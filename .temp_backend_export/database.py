from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.config import settings

# Печать информации о подключении
print(f"🔍 Creating database engine with URL: {settings.DATABASE_URL[:80]}..." if settings.DATABASE_URL else "❌ DATABASE_URL not set!")

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=True,  # Временно включаем SQL-логи для отладки
    future=True
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

Base = declarative_base()

async def get_db():
    print("🟢 get_db() called - creating session")
    async with AsyncSessionLocal() as session:
        yield session
    print("🔴 Session closed")