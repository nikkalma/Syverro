import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[1]

load_dotenv(BASE_DIR / ".env")


class Settings:
    def __init__(self):
        self.DATABASE_URL = os.getenv("DATABASE_URL", "")
        self.SECRET_KEY = os.getenv(
            "SECRET_KEY",
            "your-secret-key-change-this-in-production"
        )
        self.ALGORITHM = "HS256"
        self.ACCESS_TOKEN_EXPIRE_MINUTES = int(
            os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
        )

        if self.DATABASE_URL:
            print(f"🔍 DATABASE_URL loaded: {self.DATABASE_URL[:60]}...")

            if self.DATABASE_URL.startswith("postgres://"):
                self.DATABASE_URL = self.DATABASE_URL.replace(
                    "postgres://",
                    "postgresql+asyncpg://",
                    1
                )

            elif (
                self.DATABASE_URL.startswith("postgresql://")
                and "+asyncpg" not in self.DATABASE_URL
            ):
                self.DATABASE_URL = self.DATABASE_URL.replace(
                    "postgresql://",
                    "postgresql+asyncpg://",
                    1
                )

        else:
            print("❌ DATABASE_URL is not set in environment!")


settings = Settings()
