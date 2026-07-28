"""Golden Author Import — Dry Run: validate all payloads against schemas without writing to DB."""
import sys, os, json

# --- Load all relevant schemas ---
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.schemas.author import AuthorCreate, AuthorUpdate
from app.schemas.timeline_event import TimelineEventCreate
from app.schemas.source import SourceCreate
from app.schemas.author_citizenship import AuthorCitizenshipCreate
from app.schemas.place import PlaceCreate

errors = []
warnings = []

# ============================================================
# AUTHOR CREATE PAYLOAD
# ============================================================
author_create = {
    "name": "Vladimir Bogomolov",
    "native_name": "Владимир Осипович Богомолов",
    "slug": "vladimir-bogomolov",
    "display_name": "Владимир Богомолов",
    "birth_date": "1926-07-03",
    "birth_date_precision": "full",
    "birth_place": "Москва",
    "death_date": "2003-12-30",
    "death_date_precision": "full",
    "death_place": "Москва",
    "nationality": "русский",
    "ethnic_origin": "еврейское происхождение",
    "cultural_identity": "Русская литература XX века, советская литература, военная проза",
    "creation_type": "curated",
}
print("\n=== AUTHOR CREATE VALIDATION ===")
try:
    obj = AuthorCreate(**author_create)
    print(f"  PASS: {len(obj.model_dump(exclude_none=True))} fields accepted")
    # Check which fields were kept vs dropped
    received = set(obj.model_dump(exclude_none=True).keys())
    sent = set(author_create.keys())
    dropped = sent - received
    if dropped:
        warnings.append(f"AuthorCreate dropped fields: {dropped}")
        for f in dropped:
            print(f"  WARNING: field '{f}' was silently dropped (not in schema)")
except Exception as e:
    errors.append(f"AuthorCreate FAILED: {e}")
    print(f"  FAIL: {e}")

# ============================================================
# AUTHOR UPDATE PAYLOAD
# ============================================================
author_update = {
    "nationality": "русский",
    "ethnic_origin": "еврейское происхождение",
    "cultural_identity": "Русская литература XX века, советская литература, военная проза",
    "birth_date": "1926-07-03",
    "birth_date_precision": "full",
    "birth_place": "Москва",
    "death_date": "2003-12-30",
    "death_date_precision": "full",
    "death_place": "Москва",
}
print("\n=== AUTHOR UPDATE VALIDATION ===")
try:
    obj = AuthorUpdate(**author_update)
    received = set(obj.model_dump(exclude_none=True).keys())
    sent = set(author_update.keys())
    dropped = sent - received
    if dropped:
        warnings.append(f"AuthorUpdate dropped fields: {dropped}")
        for f in dropped:
            print(f"  WARNING: field '{f}' was silently dropped")
    else:
        print(f"  PASS: all {len(sent)} fields accepted")
except Exception as e:
    errors.append(f"AuthorUpdate FAILED: {e}")
    print(f"  FAIL: {e}")

# ============================================================
# CITIZENSHIP PAYLOADS
# ============================================================
print("\n=== CITIZENSHIP VALIDATION ===")
citizenships = [
    {"state_name": "СССР", "from_date": "1926", "to_date": "1991",
     "notes": "Born and lived during USSR period.", "status": "verified", "confidence": 0.95},
    {"state_name": "Российская Федерация", "from_date": "1991", "to_date": "2003",
     "notes": "Period after USSR dissolution.", "status": "verified", "confidence": 0.95},
]
for c in citizenships:
    try:
        obj = AuthorCitizenshipCreate(**c)
        print(f"  PASS: {c['state_name']}")
    except Exception as e:
        errors.append(f"Citizenship '{c['state_name']}' FAILED: {e}")
        print(f"  FAIL: {c['state_name']}: {e}")

# ============================================================
# PLACE PAYLOAD
# ============================================================
print("\n=== PLACE VALIDATION ===")
place_data = {"name": "Москва", "country": "Россия"}
try:
    obj = PlaceCreate(**place_data)
    print(f"  PASS: Москва")
except Exception as e:
    errors.append(f"Place FAILED: {e}")
    print(f"  FAIL: {e}")

# ============================================================
# TIMELINE PAYLOADS
# ============================================================
print("\n=== TIMELINE VALIDATION ===")
events = [
    {"event_type": "birth", "date_value": "1926-07-03", "date_precision": "full",
     "label": "Рождение Владимира Богомолова",
     "description": "Родился Владимир Осипович Богомолов в Москве.",
     "place_id": None, "extraction_source": "curator"},
    {"event_type": "military_service", "date_value": "1944", "date_precision": "year",
     "label": "Участие в Великой Отечественной войне",
     "extraction_source": "curator"},
    {"event_type": "publication", "date_value": "1958", "date_precision": "year",
     "label": "Публикация повести «Иван»",
     "extraction_source": "curator"},
    {"event_type": "publication", "date_value": "1973", "date_precision": "year",
     "label": "Публикация романа «Момент истины»",
     "extraction_source": "curator"},
    {"event_type": "death", "date_value": "2003-12-30", "date_precision": "full",
     "label": "Смерть Владимира Богомолова",
     "place_id": None, "extraction_source": "curator"},
]
for ev in events:
    try:
        obj = TimelineEventCreate(**ev)
        received = set(obj.model_dump(exclude_none=True).keys())
        sent = set(ev.keys())
        dropped = sent - received
        msg = f"  PASS: {ev['label']}"
        if dropped:
            msg += f" [dropped: {dropped}]"
            warnings.append(f"TimelineEventCreate dropped fields: {dropped}")
        print(msg)
    except Exception as e:
        errors.append(f"Timeline '{ev['label']}' FAILED: {e}")
        print(f"  FAIL: {ev['label']}: {e}")

# ============================================================
# SOURCE PAYLOADS
# ============================================================
print("\n=== SOURCE VALIDATION ===")
sources = [
    {"title": "Большая российская энциклопедия. Владимир Осипович Богомолов",
     "source_type": "encyclopedia", "language": "ru", "reliability_score": "0.8",
     "source_origin": "institutional"},
    {"title": "Российская государственная библиотека. Каталог произведений Владимира Богомолова",
     "source_type": "library_catalog", "language": "ru", "reliability_score": "0.8",
     "source_origin": "institutional"},
    {"title": "Владимир Богомолов — биографические материалы",
     "source_type": "biographical_reference", "language": "ru", "reliability_score": "0.6",
     "source_origin": "secondary"},
]
for s in sources:
    try:
        obj = SourceCreate(**s)
        received = set(obj.model_dump(exclude_none=True).keys())
        sent = set(s.keys())
        dropped = sent - received
        msg = f"  PASS: {s['title'][:50]}..."
        if dropped:
            msg += f" [dropped: {dropped}]"
            warnings.append(f"SourceCreate dropped fields: {dropped}")
        print(msg)
    except Exception as e:
        errors.append(f"Source '{s['title']}' FAILED: {e}")
        print(f"  FAIL: {s['title']}: {e}")

# ============================================================
# SUMMARY
# ============================================================
print("\n" + "=" * 60)
print("DRY-RUN SUMMARY")
print("=" * 60)
if errors:
    print(f"\nERRORS ({len(errors)}):")
    for e in errors:
        print(f"  ❌ {e}")
else:
    print("\n  ✅ All payloads valid — no schema errors")

if warnings:
    print(f"\nWARNINGS ({len(warnings)}):")
    for w in set(warnings):
        print(f"  ⚠️  {w}")
else:
    print("\n  ✅ No fields dropped — full schema coverage")

duplicate_risks = [
    "Author search may find existing Bogomolov → will UPDATE not CREATE",
    "Citizenships: СССР / Российская Федерация — may already exist",
    "Timeline labels may conflict with existing entries",
    "Sources by title may already exist in /admin/sources",
]
print("\nDUPLICATE RISKS:")
for r in duplicate_risks:
    print(f"  • {r}")

required_fields_status = {
    "author: name": "✅ provided",
    "timeline: event_type": "✅ provided (birth, military_service, publication, death)",
    "timeline: date_value": "✅ provided",
    "timeline: label": "✅ provided",
    "source: title": "✅ provided",
    "source: source_type": "✅ provided (encyclopedia, library_catalog, biographical_reference)",
    "citizenship: state_name": "✅ provided (СССР, Российская Федерация)",
    "place: name": "✅ provided (Москва)",
}
print("\nREQUIRED FIELDS:")
for k, v in required_fields_status.items():
    print(f"  {k}: {v}")

missing_fields = [
    "ethnic_origin status badge → no dedicated review column on Author",
    "cultural_identity multi-value → stored as single text field",
    "extraction_source → not in TimelineEventCreate schema (uses server_default='manual')",
]
print("\nREMAINING GAPS:")
for g in missing_fields:
    print(f"  • {g}")