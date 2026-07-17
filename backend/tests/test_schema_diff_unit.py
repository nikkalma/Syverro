"""Unit tests for schema diff logic (SQLite — no Postgres required)."""

from sqlalchemy import Column, Integer, MetaData, String, Table, create_engine, text

from app.schema_check import diff_schema


def _engine():
    return create_engine("sqlite:///:memory:")


def test_no_issues_when_schema_matches():
    metadata = MetaData()
    Table(
        "items",
        metadata,
        Column("id", Integer, primary_key=True),
        Column("name", String),
    )
    engine = _engine()
    metadata.create_all(engine)

    with engine.connect() as conn:
        assert diff_schema(conn, metadata) == []


def test_detects_missing_table():
    db_meta = MetaData()
    Table("items", db_meta, Column("id", Integer, primary_key=True))
    engine = _engine()
    db_meta.create_all(engine)

    model_meta = MetaData()
    Table("items", model_meta, Column("id", Integer, primary_key=True))
    Table("users", model_meta, Column("id", Integer, primary_key=True))

    with engine.connect() as conn:
        issues = diff_schema(conn, model_meta)

    assert any(i.kind == "missing_table" and "users" in i.message for i in issues)


def test_detects_missing_column_backend_ahead_of_db():
    """Models gained a column that was never migrated onto the DB."""
    db_meta = MetaData()
    Table(
        "users",
        db_meta,
        Column("id", Integer, primary_key=True),
        Column("email", String),
    )
    engine = _engine()
    db_meta.create_all(engine)

    model_meta = MetaData()
    Table(
        "users",
        model_meta,
        Column("id", Integer, primary_key=True),
        Column("email", String),
        Column("first_name", String),
    )

    with engine.connect() as conn:
        issues = diff_schema(conn, model_meta)

    assert any(
        i.kind == "missing_column" and "first_name" in i.message for i in issues
    )


def test_detects_unexpected_required_column_db_ahead_of_backend():
    """DB has a new NOT NULL column the old backend models do not know about."""
    engine = _engine()
    with engine.begin() as conn:
        conn.execute(
            text(
                "CREATE TABLE users ("
                "id INTEGER PRIMARY KEY, "
                "email VARCHAR, "
                "tenant_id VARCHAR NOT NULL"
                ")"
            )
        )

    model_meta = MetaData()
    Table(
        "users",
        model_meta,
        Column("id", Integer, primary_key=True),
        Column("email", String),
    )

    with engine.connect() as conn:
        issues = diff_schema(conn, model_meta)

    assert any(
        i.kind == "unexpected_required_column" and "tenant_id" in i.message
        for i in issues
    )


def test_extra_nullable_db_column_is_ignored():
    """Extra optional DB columns are usually forward-compatible."""
    engine = _engine()
    with engine.begin() as conn:
        conn.execute(
            text(
                "CREATE TABLE users ("
                "id INTEGER PRIMARY KEY, "
                "email VARCHAR, "
                "legacy_flag INTEGER"
                ")"
            )
        )

    model_meta = MetaData()
    Table(
        "users",
        model_meta,
        Column("id", Integer, primary_key=True),
        Column("email", String),
    )

    with engine.connect() as conn:
        issues = diff_schema(conn, model_meta)

    assert issues == []


def test_detects_nullability_mismatch():
    engine = _engine()
    with engine.begin() as conn:
        conn.execute(
            text(
                "CREATE TABLE users ("
                "id INTEGER PRIMARY KEY, "
                "nickname VARCHAR NOT NULL"
                ")"
            )
        )

    model_meta = MetaData()
    Table(
        "users",
        model_meta,
        Column("id", Integer, primary_key=True),
        Column("nickname", String, nullable=True),
    )

    with engine.connect() as conn:
        issues = diff_schema(conn, model_meta)

    assert any(i.kind == "nullability_mismatch" and "nickname" in i.message for i in issues)
