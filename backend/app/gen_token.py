import asyncio, asyncpg, os
from jose import jwt
from datetime import datetime, timedelta

async def g():
    url = os.environ["DATABASE_URL"].replace("+asyncpg://", "://")
    c = await asyncpg.connect(url)
    r = await c.fetchrow("select id from users where role = 'owner' limit 1")
    secret = os.environ.get("SECRET_KEY", "")
    if not secret:
        try:
            from app.config import Settings
            secret = Settings().SECRET_KEY
        except:
            secret = "super-secret-key"
    payload = {"sub": str(r["id"]), "exp": datetime.utcnow() + timedelta(hours=24)}
    token = jwt.encode(payload, secret, algorithm="HS256")
    print(token)
    await c.close()

asyncio.run(g())
