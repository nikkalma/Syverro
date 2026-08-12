import importlib.util
from pathlib import Path


def test_email_verification_migration_grandfathers_existing_users(monkeypatch):
    path = Path(__file__).parents[1] / "alembic" / "versions" / "0018_email_verification.py"
    spec = importlib.util.spec_from_file_location("auth_migration_0018", path)
    migration = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(migration)
    executed = []
    monkeypatch.setattr(migration.op, "add_column", lambda *args, **kwargs: None)
    monkeypatch.setattr(migration.op, "create_unique_constraint", lambda *args, **kwargs: None)
    monkeypatch.setattr(migration.op, "execute", lambda statement: executed.append(str(statement)))

    migration.upgrade()

    assert any("UPDATE users SET email_verified = true" in sql for sql in executed)
