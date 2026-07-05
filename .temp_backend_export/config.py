import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    def __init__(self):
        # Проверяем и конвертируем URL
        if self.DATABASE_URL:
            print(f"🔍 Original DATABASE_URL: {self.DATABASE_URL[:60]}...")
            # Конвертируем postgres:// → postgresql+asyncpg://
            if self.DATABASE_URL.startswith("postgres://"):
                self.DATABASE_URL = self.DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
                print(f"✅ Converted to asyncpg: {self.DATABASE_URL[:60]}...")
            elif self.DATABASE_URL.startswith("postgresql://") and "+asyncpg" not in self.DATABASE_URL:
                self.DATABASE_URL = self.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
                print(f"✅ Added asyncpg driver: {self.DATABASE_URL[:60]}...")
        else:
            print("❌ DATABASE_URL is not set in environment!")

settings = Settings()