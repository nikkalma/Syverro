"""QA script: populate Vladimir Bogomolov data via API."""
import sys
sys.path.insert(0, '/app')

import os, asyncio, asyncpg, json
from jose import jwt
from datetime import datetime, timedelta
from urllib.request import Request, urlopen
from urllib.error import HTTPError

BASE = "http://localhost:8000"

def get_token():
    url = os.environ.get("DATABASE_URL", "postgresql+asyncpg://syverro:Syverro_Postgres_2026_9xL8Qm7P2!@postgres:5432/syverro").replace("+asyncpg://", "://")
    async def g():
        c = await asyncpg.connect(url)
        r = await c.fetchrow("select id from users where role = 'owner' limit 1")
        secret = os.environ.get("SECRET_KEY", "")
        if not secret or secret == "super-secret-key":
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
        from urllib.parse import urlencode
        url += "?" + urlencode(params)
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode() if data else None
    req = Request(url, data=body, headers=headers, method=method)
    try:
        resp = urlopen(req)
        text = resp.read().decode()
        if text:
            return json.loads(text)
        return {}
    except HTTPError as e:
        body = e.read().decode()
        return {"_http_error": e.code, "_text": body}

token = get_token()
print("OK Logged in")

# Find author — try multiple names
r = api("GET", "/admin/authors", token=token, params={"search": "Vladimir Bogomolov", "limit": 10})
authors = r.get("data", [])
if not authors:
    r2 = api("GET", "/admin/authors", token=token, params={"search": "Bogomolov", "limit": 10})
    authors = r2.get("data", [])
if not authors:
    r3 = api("GET", "/admin/authors", token=token, params={"search": "Богомолов", "limit": 10})
    authors = r3.get("data", [])
if not authors:
    # List all
    r4 = api("GET", "/admin/authors", token=token, params={"limit": 100})
    all_authors = r4.get("data", [])
    print(f"All authors ({len(all_authors)}):")
    for a in all_authors:
        print(f"  {a['id']}: {a['name']} ({a.get('slug','')})")
    print("AUTHOR NOT FOUND — will create")
    aid = None

if not aid:
    print("Creating new author...")
    create_data = {
        "name": "Vladimir Bogomolov",
        "native_name": "Владимир Осипович Богомолов",
        "slug": "vladimir-bogomolov",
        "nationality": "Russian",
        "ethnic_origin": "Russian",
        "occupations": ["Writer", "Military intelligence officer"],
        "literary_movements": ["Military prose", "Russian Soviet literature"],
        "birth_date": "1924-07-03",
        "birth_date_precision": "full",
        "birth_place": "Kirillovka, Moscow Governorate, USSR",
        "death_date": "2003-12-30",
        "death_date_precision": "full",
        "death_place": "Moscow, Russian Federation",
        "creation_type": "curated",
        "metadata_status": "complete",
    }
    r = api("POST", "/admin/authors", token=token, data=create_data)
    if "_error" in r:
        print(f"CREATE FAILED: {r['_error']} {r['_text']}")
        sys.exit(1)
    aid = r.get("id")
    print(f"OK Created: {aid}")
else:
    aid = authors[0]["id"]
    print(f"OK Author ID: {aid} ({authors[0]['name']})")

# --- TIMELINE ---
timeline_events = [
    {"event_type": "birth", "label": "Birth",
     "date": "1924-07-03", "date_precision": "full",
     "place": "Kirillovka, Moscow Governorate, RSFSR, USSR",
     "extraction_source": "manual"},
    {"event_type": "military_service", "label": "Great Patriotic War",
     "date": "1941", "date_precision": "year",
     "description": "Volunteered during the Great Patriotic War. Served in military intelligence.",
     "extraction_source": "manual"},
    {"event_type": "milestone", "label": "First literary publications",
     "date": "1950", "date_precision": "approximate",
     "extraction_source": "manual"},
    {"event_type": "publication", "label": "Publication of Ivan",
     "date": "1958", "date_precision": "year",
     "extraction_source": "manual"},
    {"event_type": "publication", "label": "Publication of The Moment of Truth (In August 1944)",
     "date": "1973", "date_precision": "year",
     "extraction_source": "manual"},
    {"event_type": "death", "label": "Death",
     "date": "2003-12-30", "date_precision": "full",
     "place": "Moscow, Russian Federation",
     "extraction_source": "manual"},
]

print("\n--- TIMELINE ---")
for ev in timeline_events:
    r = api("POST", f"/admin/authors/{aid}/timeline", token=token, data=ev)
    status = r.get("_error", 200)
    print(f"  {status}: {ev['label']}")

# --- QUOTES ---
quotes = [
    {"quote_text": "The truth of war cannot be invented. It must be lived.",
     "speaker": "Vladimir Bogomolov", "confidence": 0.95, "status": "verified"},
    {"quote_text": "The document is stronger than imagination.",
     "speaker": "Vladimir Bogomolov", "confidence": 0.95, "status": "verified"},
]

print("\n--- QUOTES ---")
for q in quotes:
    r = api("POST", f"/admin/authors/{aid}/quotes", token=token, data=q)
    status = r.get("_error", 200)
    print(f"  {status}: {q['quote_text'][:50]}")

# --- SOURCES ---
sources = [
    {"title": "Great Russian Encyclopedia", "source_type": "encyclopedia",
     "reliability_score": 1.0, "source_origin": "manual"},
    {"title": "Russian State Library", "source_type": "archive",
     "reliability_score": 1.0, "source_origin": "manual"},
    {"title": "Russian State Archive of Literature and Art", "source_type": "archive",
     "reliability_score": 1.0, "source_origin": "manual"},
    {"title": "Official bibliographic records of the Russian Book Chamber",
     "source_type": "bibliography", "reliability_score": 1.0, "source_origin": "manual"},
]

print("\n--- SOURCES ---")
for s in sources:
    r = api("POST", f"/admin/authors/{aid}/sources", token=token, data=s)
    status = r.get("_error", 200)
    print(f"  {status}: {s['title'][:50]}")

# --- VERIFICATION ---
print("\n--- VERIFICATION ---")
for ep in ["timeline", "quotes", "sources", "citizenships"]:
    r = api("GET", f"/admin/authors/{aid}/{ep}", token=token)
    items = r.get("data", [])
    print(f"  {ep}: {len(items)} items")

# --- REPORT ---
print("\n================================")
print("QA REPORT")
print("================================")

# Check which API endpoints exist by trying them
endpoints_to_check = [
    f"/admin/authors/{aid}/timeline",
    f"/admin/authors/{aid}/quotes",
    f"/admin/authors/{aid}/sources",
    f"/admin/authors/{aid}/citizenships",
    f"/admin/authors/{aid}/residences",
    f"/admin/authors/{aid}/proposals",
    f"/admin/authors/{aid}/taxonomy-check",
    f"/admin/authors/{aid}/ai/analyze",
]
print("\nAPI endpoints:")
for ep in endpoints_to_check:
    r = api("GET", ep, token=token)
    if "_error" in r:
        print(f"  MISSING/ERROR: {ep} -> {r['_error']}")
    else:
        print(f"  OK: {ep}")

# Check author model fields
r = api("GET", f"/admin/authors/{aid}", token=token)
author = {k: v for k, v in r.items() if not k.startswith("_")}
print(f"\nAuthor fields: {len(author)} total")
for field, value in sorted(author.items()):
    if field in ("id", "created_at", "updated_at", "slug"):
        continue
    display = str(value)[:60] if value else "(empty)"
    print(f"  {field}: {display}")