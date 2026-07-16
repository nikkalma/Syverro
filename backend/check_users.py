import asyncio
from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.user import User


async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User))
        users = result.scalars().all()

        for u in users:
            print(u.email, u.role)


asyncio.run(main())
