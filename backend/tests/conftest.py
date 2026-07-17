import os

# Must run before app.database is imported.
os.environ.setdefault(
    "DATABASE_URL",
    os.environ.get(
        "TEST_DATABASE_URL",
        "postgresql+asyncpg://test:test@localhost:5432/syverro_test",
    ),
)
os.environ.setdefault("SECRET_KEY", "test-secret-key")
