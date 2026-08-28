import json
from urllib.parse import parse_qs, urlparse
from uuid import uuid4

import pytest

from app.models.ai_proposal import AIProposal
from app.models.ai_proposal_source import AIProposalSource
from app.models.author import Author
from app.models.source import Source
from app.models.syvai_run import SyvaiRun
from app.syvai.bootstrap_author import (
    ACQUISITION_VERSION,
    CLAIM_SCHEMA_VERSION,
    DOMAIN,
    PROPERTY_RULES,
    AcquiredFact,
    CanonicalIdentity,
    _persist_fact,
    _time_value,
    acquire_structured_facts,
    resolve_canonical_identity,
)
from app.syvai.discovery.fetcher import FetchedPage
from app.syvai.field_specs import AUTHOR_FIELD_REGISTRY, BootstrapPolicy, EvidenceRelation


def _statement(value, *, rank="normal", statement_id="Q1$abc", qualifiers=None):
    return {
        "id": statement_id,
        "rank": rank,
        "mainsnak": {"snaktype": "value", "datavalue": {"value": value}},
        "qualifiers": qualifiers or {},
    }


def _entity_value(qid):
    return {"entity-type": "item", "numeric-id": int(qid[1:]), "id": qid}


class FixtureFetcher:
    def __init__(self, handler):
        self.handler = handler
        self.urls = []

    async def fetch(self, url):
        self.urls.append(url)
        body = self.handler(url)
        return FetchedPage(url, url, 200, "application/json", json.dumps(body))


def _wiki_payload(title, qid="Q42", *, pageid=7, disambiguation=False):
    props = {"wikibase_item": qid}
    if disambiguation:
        props["disambiguation"] = ""
    return {"query": {"pages": [{"pageid": pageid, "title": title, "pageprops": props}]}}


def _entity_payload(qid, *, en_title=None, source_site=None, source_title=None, claims=None):
    sitelinks = {}
    if en_title:
        sitelinks["enwiki"] = {"site": "enwiki", "title": en_title}
    if source_site and source_title:
        sitelinks[f"{source_site}wiki"] = {"site": f"{source_site}wiki", "title": source_title}
    return {"entities": {qid: {"id": qid, "sitelinks": sitelinks, "claims": claims or {}}}}


@pytest.mark.asyncio
@pytest.mark.parametrize("name,qid", [
    ("Ray Bradbury", "Q310732"),
    ("Jane Austen", "Q36322"),
    ("Han Kang", "Q495896"),
    ("George Eliot", "Q181099"),
])
async def test_exact_english_identity_resolution(name, qid):
    wiki = FixtureFetcher(lambda url: _wiki_payload(name, qid))
    wd = FixtureFetcher(lambda url: _entity_payload(qid, en_title=name))
    identity, _ = await resolve_canonical_identity(
        Author(name=name), wikipedia_fetcher=wiki, wikidata_fetcher=wd,
    )
    assert identity.qid == qid
    assert identity.query_variant == name
    assert identity.canonical_site == "en"
    assert identity.canonical_title == name
    assert identity.provenance()["resolution_method"] == "exact_title_pageprops_wikibase_item"


@pytest.mark.asyncio
async def test_cyrillic_identity_retains_native_sitelink_but_uses_enwiki():
    def wiki_handler(url):
        host = urlparse(url).hostname
        if host == "en.wikipedia.org":
            return {"query": {"pages": [{"title": "Фёдор Достоевский", "missing": True}]}}
        return _wiki_payload("Фёдор Достоевский", "Q991")

    wiki = FixtureFetcher(wiki_handler)
    wd = FixtureFetcher(lambda url: _entity_payload(
        "Q991", en_title="Fyodor Dostoevsky", source_site="ru", source_title="Фёдор Достоевский",
    ))
    identity, _ = await resolve_canonical_identity(
        Author(name="Фёдор Достоевский"), wikipedia_fetcher=wiki, wikidata_fetcher=wd,
    )
    assert identity.canonical_title == "Fyodor Dostoevsky"
    assert identity.native_sitelink == {"site": "ruwiki", "title": "Фёдор Достоевский"}
    assert identity.query_variant == "Фёдор Достоевский"


@pytest.mark.asyncio
async def test_missing_enwiki_sitelink_keeps_bound_non_disambiguation_article():
    def wiki_handler(url):
        if urlparse(url).hostname == "en.wikipedia.org":
            return {"query": {"pages": [{"title": "Нет страницы", "missing": True}]}}
        return _wiki_payload("Писатель", "Q999")

    identity, _ = await resolve_canonical_identity(
        Author(name="Писатель"), wikipedia_fetcher=FixtureFetcher(wiki_handler),
        wikidata_fetcher=FixtureFetcher(lambda url: _entity_payload(
            "Q999", source_site="ru", source_title="Писатель",
        )),
    )
    assert identity.canonical_site == "ru"
    assert identity.canonical_title == "Писатель"


@pytest.mark.asyncio
async def test_disambiguation_and_missing_qid_fail_closed():
    with pytest.raises(ValueError, match="NOT_FOUND"):
        await resolve_canonical_identity(
            Author(name="Ambiguous"),
            wikipedia_fetcher=FixtureFetcher(lambda url: _wiki_payload("Ambiguous", disambiguation=True)),
            wikidata_fetcher=FixtureFetcher(lambda url: {}),
        )
    with pytest.raises(ValueError, match="NOT_FOUND"):
        await resolve_canonical_identity(
            Author(name="No QID"),
            wikipedia_fetcher=FixtureFetcher(lambda url: _wiki_payload("No QID", qid="")),
            wikidata_fetcher=FixtureFetcher(lambda url: {}),
        )


def test_date_precision_is_never_increased():
    assert _time_value({"time": "+1920-00-00T00:00:00Z", "precision": 9}) == {
        "value": "1920", "precision": "year", "wikidata_precision": 9,
    }
    assert _time_value({"time": "+1920-08-00T00:00:00Z", "precision": 10}) == {
        "value": "1920-08", "precision": "month", "wikidata_precision": 10,
    }
    assert _time_value({"time": "+1920-08-22T00:00:00Z", "precision": 11}) == {
        "value": "1920-08-22", "precision": "day", "wikidata_precision": 11,
    }


@pytest.mark.asyncio
async def test_structured_facts_map_explicit_relations_and_labels():
    entity = {"claims": {
        "P569": [_statement({"time": "+1920-08-22T00:00:00Z", "precision": 11})],
        "P570": [_statement({"time": "+2012-06-05T00:00:00Z", "precision": 11})],
        "P19": [_statement(_entity_value("Q100"))],
        "P106": [_statement(_entity_value("Q200")), _statement(_entity_value("Q201"), statement_id="Q1$def")],
        "P27": [_statement(_entity_value("Q30"))],
        "P21": [_statement(_entity_value("Q6581097"))],
    }}
    labels = {
        "Q100": "Waukegan", "Q200": "novelist", "Q201": "screenwriter",
        "Q30": "United States of America", "Q6581097": "male",
    }

    def handler(url):
        ids = parse_qs(urlparse(url).query).get("ids", [""])[0].split("|")
        return {"entities": {qid: {"labels": {"en": {"value": labels[qid]}}} for qid in ids if qid}}

    facts, skipped = await acquire_structured_facts(entity, wikidata_fetcher=FixtureFetcher(handler))
    by_field = {}
    for fact in facts:
        by_field.setdefault(fact.rule.field_name, []).append(fact)
    assert by_field["birth_date"][0].value["value"] == "1920-08-22"
    assert by_field["birth_place"][0].value == {"value": "Waukegan", "wikidata_qid": "Q100"}
    assert {f.value["value"] for f in by_field["occupations"]} == {"novelist", "screenwriter"}
    assert by_field["citizenship"][0].rule.relation == EvidenceRelation.AUTHOR_CITIZENSHIP
    assert "nationality" not in by_field
    assert "languages" not in by_field
    assert "writing_languages" not in by_field
    assert not [item for item in skipped if item["field"] == "birth_date"]


@pytest.mark.asyncio
async def test_preferred_rank_wins_but_unranked_conflict_is_omitted():
    conflicting = {"claims": {"P569": [
        _statement({"time": "+1900-00-00T00:00:00Z", "precision": 9}),
        _statement({"time": "+1901-00-00T00:00:00Z", "precision": 9}, statement_id="Q1$2"),
    ]}}
    facts, skipped = await acquire_structured_facts(conflicting, wikidata_fetcher=FixtureFetcher(lambda url: {}))
    assert not facts
    assert {x["reason"] for x in skipped} >= {"conflicting_P569_values"}

    preferred = {"claims": {"P569": [
        _statement({"time": "+1900-00-00T00:00:00Z", "precision": 9}),
        _statement({"time": "+1901-00-00T00:00:00Z", "precision": 9}, rank="preferred"),
    ]}}
    facts, _ = await acquire_structured_facts(preferred, wikidata_fetcher=FixtureFetcher(lambda url: {}))
    assert facts[0].value["value"] == "1901"


@pytest.mark.asyncio
async def test_george_eliot_property_semantics_keep_birth_name_and_pseudonym_distinct():
    entity = {"claims": {
        "P1477": [_statement({"text": "Mary Ann Evans", "language": "en"})],
        "P742": [_statement({"text": "George Eliot", "language": "en"})],
        "P1559": [],
    }}
    facts, _ = await acquire_structured_facts(entity, wikidata_fetcher=FixtureFetcher(lambda url: {}))
    relations = {(f.rule.field_name, f.rule.relation) for f in facts}
    assert ("birth_name", EvidenceRelation.AUTHOR_BIRTH_NAME) in relations
    assert ("pseudonyms", EvidenceRelation.AUTHOR_PSEUDONYM) in relations
    assert not any(field == "native_name" for field, _ in relations)
    assert not any(field == "pen_names" for field, _ in relations)


@pytest.mark.asyncio
async def test_han_kang_native_claim_requires_explicit_native_name_property():
    entity = {
        "labels": {"ru": {"language": "ru", "value": "Хан Ган"}},
        "claims": {
            "P1559": [_statement({"text": "한강", "language": "ko"})],
            # Edition/document language and work publication date are hostile
            # fixture noise and have no B2 property mapping.
            "P407": [_statement(_entity_value("Q9176"))],
            "P577": [_statement({"time": "+2016-01-01T00:00:00Z", "precision": 11})],
        },
    }
    facts, _ = await acquire_structured_facts(entity, wikidata_fetcher=FixtureFetcher(lambda url: {}))
    assert [(fact.rule.field_name, fact.value) for fact in facts] == [
        ("native_name", {"value": "한강", "language": "ko"})
    ]
    assert all("Хан Ган" not in json.dumps(fact.value, ensure_ascii=False) for fact in facts)


@pytest.mark.asyncio
async def test_article_and_related_entity_noise_cannot_become_b2_claims():
    # B2 intentionally has no Wikipedia-text extraction consumer. Unsupported
    # publication/language/country properties and related-person blobs are
    # ignored rather than passed through a general discovery or Fill prompt.
    entity = {"claims": {
        "P407": [_statement(_entity_value("Q7737"))],
        "P577": [_statement({"time": "+1813-01-28T00:00:00Z", "precision": 11})],
        "P291": [_statement(_entity_value("Q84"))],
        "RELATED_PERSON": [{"occupation": "narrator", "nationality": "British"}],
    }}
    facts, _ = await acquire_structured_facts(entity, wikidata_fetcher=FixtureFetcher(lambda url: {}))
    assert facts == []


def test_property_registry_forbids_language_nationality_and_localization_shortcuts():
    mapped_fields = {rule.field_name for rule in PROPERTY_RULES}
    assert "languages" not in mapped_fields
    assert "writing_languages" not in mapped_fields
    assert "nationality" not in mapped_fields
    assert "pen_names" not in mapped_fields
    assert next(rule for rule in PROPERTY_RULES if rule.property_id == "P27").field_name == "citizenship"
    assert next(rule for rule in PROPERTY_RULES if rule.property_id == "P1559").field_name == "native_name"


def test_deferred_and_deterministic_fields_have_no_acquisition_mapping():
    mapped = {rule.field_name for rule in PROPERTY_RULES}
    for name, policy in AUTHOR_FIELD_REGISTRY.items():
        if policy.deferred or policy.bootstrap_policy in {
            BootstrapPolicy.DETERMINISTIC,
            BootstrapPolicy.PRESERVE_EXISTING,
            BootstrapPolicy.SYNTHESIZED_REVIEW_REQUIRED,
            BootstrapPolicy.TIMELINE_ENTAILMENT,
        }:
            assert name not in mapped
    assert "publications" not in mapped
    assert "bio" not in mapped
    assert "slug" not in mapped
    assert "sort_name" not in mapped


def test_bootstrap_contract_is_separate_and_versioned():
    assert DOMAIN == "catalog_bootstrap_author"
    assert CLAIM_SCHEMA_VERSION.endswith("_v1")
    assert ACQUISITION_VERSION.endswith("_v1")


class AddOnlySession:
    def __init__(self):
        self.added = []

    def add(self, value):
        self.added.append(value)

    async def execute(self, _query):
        return EmptyResult()

    async def flush(self):
        for value in self.added:
            if getattr(value, "id", None) is None:
                value.id = uuid4()


class EmptyResult:
    def scalar_one_or_none(self):
        return None

    def scalars(self):
        return self

    def all(self):
        return []


@pytest.mark.asyncio
async def test_persisted_claim_keeps_subject_relation_provenance_and_never_auto_approves():
    author = Author(
        id=uuid4(), name="Ray Bradbury", metadata_status="draft",
        birth_date="1919-01-01", birth_date_precision="day",
    )
    run = SyvaiRun(id=uuid4(), author_id=author.id, domain=DOMAIN)
    source = Source(id=uuid4(), title="Wikidata Q310732", source_type="wikidata")
    identity = CanonicalIdentity(
        qid="Q310732", query_variant="Ray Bradbury", resolved_title="Ray Bradbury",
        resolved_page_id=1, resolved_site="en", canonical_title="Ray Bradbury",
        canonical_url="https://en.wikipedia.org/wiki/Ray_Bradbury", canonical_site="en",
    )
    rule = next(rule for rule in PROPERTY_RULES if rule.property_id == "P569")
    fact = AcquiredFact(
        rule=rule, value={"value": "1920-08-22", "precision": "day", "wikidata_precision": 11},
        statement_id="Q310732$birth", rank="normal", qualifiers={},
        raw_datavalue={"time": "+1920-08-22T00:00:00Z", "precision": 11},
    )
    session = AddOnlySession()
    proposal = await _persist_fact(
        session, author=author, run=run, fact=fact, identity=identity, source=source,
    )
    payload = json.loads(proposal.suggested_value)
    assert payload["subject"]["wikidata_qid"] == "Q310732"
    assert payload["relation"] == "AUTHOR_BORN_ON"
    assert payload["source"]["property_id"] == "P569"
    assert payload["verifier_status"] == "DIRECT_GROUNDED"
    assert payload["verification"]["verifier_version"] == "author_field_entailment_v1"
    assert payload["human_review_required"] is True
    assert payload["auto_apply"] is False
    assert proposal.status == "proposed"
    assert proposal.review_band == "quality_review"
    assert proposal.validation_state == "direct_grounded"
    assert proposal.conflict_state == "canonical_conflict"
    assert json.loads(proposal.current_value)["value"] == {
        "date_value": "1919-01-01", "date_precision": "day",
    }
    assert payload["value"] == {
        "date_value": "1920-08-22", "date_precision": "day", "wikidata_precision": 11,
    }
    assert author.birth_date == "1919-01-01"
    assert author.metadata_status == "draft"
    assert any(isinstance(value, AIProposalSource) for value in session.added)
    assert sum(isinstance(value, AIProposal) for value in session.added) == 1


@pytest.mark.asyncio
async def test_exact_canonical_list_value_creates_no_actionable_proposal():
    author = Author(
        id=uuid4(), name="Ray Bradbury", metadata_status="draft",
        occupations=["screenwriter"],
    )
    run = SyvaiRun(id=uuid4(), author_id=author.id, domain=DOMAIN)
    source = Source(id=uuid4(), title="Wikidata Q310732", source_type="wikidata")
    identity = CanonicalIdentity(
        qid="Q310732", query_variant="Ray Bradbury", resolved_title="Ray Bradbury",
        resolved_page_id=1, resolved_site="en", canonical_title="Ray Bradbury",
        canonical_url="https://en.wikipedia.org/wiki/Ray_Bradbury", canonical_site="en",
    )
    rule = next(rule for rule in PROPERTY_RULES if rule.property_id == "P106")
    fact = AcquiredFact(
        rule=rule, value={"value": "screenwriter", "wikidata_qid": "Q28389"},
        statement_id="Q310732$occupation", rank="normal", qualifiers={},
        raw_datavalue={"id": "Q28389"},
    )
    session = AddOnlySession()

    proposal = await _persist_fact(
        session, author=author, run=run, fact=fact, identity=identity, source=source,
    )

    assert proposal is None
    assert not any(isinstance(value, AIProposal) for value in session.added)
    assert author.occupations == ["screenwriter"]
    assert author.metadata_status == "draft"


@pytest.mark.asyncio
async def test_structurally_mismatched_bootstrap_fact_is_rejected_before_persistence():
    author = Author(id=uuid4(), name="Ray Bradbury", metadata_status="draft")
    run = SyvaiRun(id=uuid4(), author_id=author.id, domain=DOMAIN)
    source = Source(id=uuid4(), title="Wikidata", source_type="wikidata")
    identity = CanonicalIdentity(
        qid="Q310732", query_variant="Ray Bradbury", resolved_title="Ray Bradbury",
        resolved_page_id=1, resolved_site="en", canonical_title="Ray Bradbury",
        canonical_url="https://en.wikipedia.org/wiki/Ray_Bradbury", canonical_site="en",
    )
    rule = next(rule for rule in PROPERTY_RULES if rule.property_id == "P569")
    fact = AcquiredFact(
        rule=rule, value={"value": "1920-01-01", "precision": "day", "wikidata_precision": 11},
        statement_id="Q310732$birth", rank="normal", qualifiers={},
        raw_datavalue={"time": "+1920-00-00T00:00:00Z", "precision": 9},
    )
    session = AddOnlySession()
    with pytest.raises(ValueError, match="BOOTSTRAP_CLAIM_REJECTED:structured_value_mismatch"):
        await _persist_fact(
            session, author=author, run=run, fact=fact, identity=identity, source=source,
        )
    assert not any(isinstance(value, AIProposal) for value in session.added)
