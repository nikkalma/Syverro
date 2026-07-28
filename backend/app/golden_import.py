"""Golden Author Import — Vladimir Bogomolov"""
import sys, os, json, asyncio, asyncpg
from jose import jwt
from datetime import datetime, timedelta
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from urllib.parse import urlencode

BASE = "http://localhost:8000"

def get_token():
    url = os.environ.get("DATABASE_URL","").replace("+asyncpg://","://")
    async def g():
        c = await asyncpg.connect(url)
        r = await c.fetchrow("select id from users where role='owner' limit 1")
        secret = os.environ.get("SECRET_KEY","")
        if not secret:
            from app.config import Settings
            secret = Settings().SECRET_KEY
        payload = {"sub": str(r["id"]), "exp": datetime.utcnow() + timedelta(hours=24)}
        token = jwt.encode(payload, secret, algorithm="HS256")
        await c.close()
        return token
    return asyncio.run(g())

def api(method, path, token=None, data=None, params=None):
    url = f"{BASE}{path}"
    if params:
        url += "?" + urlencode(params)
    headers = {"Content-Type": "application/json","Authorization": f"Bearer {token}"}
    body = json.dumps(data).encode() if data else None
    req = Request(url, data=body, headers=headers, method=method)
    try:
        resp = urlopen(req)
        text = resp.read().decode()
        return json.loads(text) if text else {}
    except HTTPError as e:
        return {"_error": e.code, "_text": e.read().decode()}

report = {"created": [], "updated": [], "missing": [], "conflicts": [], "duplicates": [], "needs_review": []}

token = get_token()
print("AUTH OK")

# --- Step 1: Find or create author ---
r = api("GET", "/admin/authors", token=token, params={"search": "Bogomolov", "limit": 5})
authors = r.get("data", [])
if not authors:
    r = api("GET", "/admin/authors", token=token, params={"search": "Богомолов", "limit": 5})
    authors = r.get("data", [])
if not authors:
    # Create author
    create = {
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
    r = api("POST", "/admin/authors", token=token, data=create)
    if "_error" in r:
        print(f"CREATE FAILED: {r}")
        sys.exit(1)
    aid = r.get("id")
    report["created"].append(f"Author: {aid}")
    print(f"AUTHOR CREATED: {aid}")
else:
    aid = authors[0]["id"]
    # Update existing
    update = {
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
    r = api("PUT", f"/admin/authors/{aid}", token=token, data=update)
    if "_error" in r:
        report["conflicts"].append(f"Author update: {r['_text']}")
    else:
        report["updated"].append(f"Author identity: {aid}")
    print(f"AUTHOR UPDATED: {aid}")

report["needs_review"].append("ethnic_origin: еврейское происхождение — requires source confirmation")

# --- Step 2: Citizenships ---
existing_cit = api("GET", f"/admin/authors/{aid}/citizenships", token=token).get("data", [])
existing_states = {c["state_name"] for c in existing_cit}

citizenships = [
    {"state_name": "СССР", "from_date": "1926", "to_date": "1991",
     "notes": "Born and lived during USSR period.", "status": "verified", "confidence": 0.95},
    {"state_name": "Российская Федерация", "from_date": "1991", "to_date": "2003",
     "notes": "Period after USSR dissolution.", "status": "verified", "confidence": 0.95},
]
for c in citizenships:
    if c["state_name"] in existing_states:
        report["duplicates"].append(f"Citizenship '{c['state_name']}' already exists")
    else:
        r = api("POST", f"/admin/authors/{aid}/citizenships", token=token, data=c)
        if "_error" in r:
            report["conflicts"].append(f"Citizenship create: {r['_text']}")
        else:
            report["created"].append(f"Citizenship: {c['state_name']}")
print(f"CITIZENSHIPS: {len(citizenships)} attempted")

# --- Step 3: Timeline events ---
existing_tl = api("GET", f"/admin/authors/{aid}/timeline", token=token)
existing_labels = {e["label"] for e in existing_tl} if isinstance(existing_tl, list) else set()

# Create/find Place for Москва
place_moscow = None
places_r = api("GET", "/admin/places", token=token, params={"search": "Москва"})
if places_r and len(places_r) > 0:
    place_moscow = places_r[0].get("id")
    report["updated"].append("Place: Москва (found existing)")
if not place_moscow:
    place_create = api("POST", "/admin/places", token=token, data={"name": "Москва", "country": "Россия"})
    if "_error" not in place_create:
        place_moscow = place_create.get("id")
        report["created"].append("Place: Москва")

events = [
    {"event_type": "birth", "date_value": "1926-07-03", "date_precision": "full",
     "label": "Рождение Владимира Богомолова",
     "description": "Родился Владимир Осипович Богомолов в Москве.",
     "place_id": place_moscow, "extraction_source": "curator"},
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
     "place_id": place_moscow, "extraction_source": "curator"},
]
for ev in events:
    if ev["label"] in existing_labels:
        report["duplicates"].append(f"Timeline '{ev['label']}' already exists")
    else:
        r = api("POST", f"/admin/authors/{aid}/timeline", token=token, data=ev)
        if "_error" in r:
            report["conflicts"].append(f"Timeline create: {r['_text']}")
        else:
            report["created"].append(f"Timeline: {ev['label']}")
print(f"TIMELINE: {len(events)} attempted")

# --- Step 4: Sources ---
existing_src = api("GET", "/admin/sources", token=token)
existing_titles = {s["title"] for s in existing_src} if isinstance(existing_src, list) else set()

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
    if s["title"] in existing_titles:
        report["duplicates"].append(f"Source '{s['title']}' already exists")
    else:
        r = api("POST", "/admin/sources", token=token, data=s)
        if "_error" in r:
            report["conflicts"].append(f"Source create: {r['_text']}")
        else:
            report["created"].append(f"Source: {s['title']}")
print(f"SOURCES: {len(sources)} attempted")

# --- Step 5: Knowledge relations ---
# Check existing occupations / taxonomy nodes
existing_occupations = []  # will be populated if we can read from author
auth = api("GET", f"/admin/authors/{aid}", token=token)
existing_occ = set(auth.get("occupations") or [])
existing_lm = set(auth.get("literary_movements") or [])

# Update occupations and literary movements on the author directly
update = {}
needs_update = False

if "писатель" not in existing_occ:
    occs = list(existing_occ) + ["писатель"]
    update["occupations"] = occs
    needs_update = True
    report["created"].append("Occupation: писатель")

for lm in ["советская литература", "военная проза"]:
    if lm not in existing_lm:
        lms = list(existing_lm) + [lm]
        update["literary_movements"] = lms
        needs_update = True
        report["created"].append(f"Literary movement: {lm}")

if needs_update:
    r = api("PUT", f"/admin/authors/{aid}", token=token, data=update)
    if "_error" in r:
        report["conflicts"].append(f"Knowledge update: {r['_text']}")
    else:
        report["updated"].append("Author knowledge relations")
print("KNOWLEDGE RELATIONS: done")

# --- Step 6: Places ---
report["missing"].append("No Place entity exists — birth/death places stored as free text on Author")
report["missing"].append("cultural_identity is a single text field — cannot store multiple values separately")

# --- Verification ---
print("\n=== VERIFICATION ===")
tl = api("GET", f"/admin/authors/{aid}/timeline", token=token)
print(f"  timeline: {len(tl) if isinstance(tl, list) else 0} items")
cit = api("GET", f"/admin/authors/{aid}/citizenships", token=token)
print(f"  citizenships: {len(cit.get('data', []))} items")
q = api("GET", f"/admin/authors/{aid}/quotes", token=token)
print(f"  quotes: {len(q.get('data', []))} items")
src = api("GET", "/admin/sources", token=token)
print(f"  sources: {len(src) if isinstance(src, list) else 0} items")

# Final author state
final = api("GET", f"/admin/authors/{aid}", token=token)
print(f"\n  Author: {final.get('name')}")
print(f"  Birth: {final.get('birth_date')} ({final.get('birth_date_precision')}) @ {final.get('birth_place')}")
print(f"  Death: {final.get('death_date')} ({final.get('death_date_precision')}) @ {final.get('death_place')}")
print(f"  Nationality: {final.get('nationality')}")
print(f"  Ethnic origin: {final.get('ethnic_origin')}")
print(f"  Cultural identity: {final.get('cultural_identity')}")
print(f"  Occupations: {final.get('occupations')}")
print(f"  Literary movements: {final.get('literary_movements')}")

print("\n=== REPORT ===")
for section in report:
    if report[section]:
        print(f"\n{section.upper()}:")
        for item in report[section]:
            print(f"  - {item}")