"""Compare SQLAlchemy model metadata to a live database schema.

Detects:
- tables/columns defined on models but missing in the DB (backend ahead of DB)
- NOT NULL columns present in the DB but unknown to models, without a default
  (DB ahead of backend — old code will fail on INSERT)
- nullability mismatches that commonly break inserts
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

from sqlalchemy import MetaData, inspect
from sqlalchemy.engine import Connection


@dataclass(frozen=True)
class SchemaIssue:
    kind: str
    message: str

    def __str__(self) -> str:
        return f"[{self.kind}] {self.message}"


def _has_default(db_col: dict) -> bool:
    return db_col.get("default") is not None or db_col.get("server_default") is not None


def diff_schema(connection: Connection, metadata: MetaData) -> list[SchemaIssue]:
    """Return schema mismatches between `metadata` (models) and the live DB."""
    insp = inspect(connection)
    db_tables = set(insp.get_table_names())
    issues: list[SchemaIssue] = []

    for table_name, table in metadata.tables.items():
        if table_name not in db_tables:
            issues.append(
                SchemaIssue(
                    "missing_table",
                    f"Model table '{table_name}' is missing in the database",
                )
            )
            continue

        db_cols = {col["name"]: col for col in insp.get_columns(table_name)}
        model_cols = {col.name: col for col in table.columns}

        for name in model_cols:
            if name not in db_cols:
                issues.append(
                    SchemaIssue(
                        "missing_column",
                        f"Column '{table_name}.{name}' is defined in models "
                        f"but missing in the database",
                    )
                )

        for name, db_col in db_cols.items():
            if name in model_cols:
                model_col = model_cols[name]
                # Model allows NULL but DB requires a value → app may send NULL and fail.
                if model_col.nullable and not db_col.get("nullable", True) and not _has_default(db_col):
                    if db_col.get("autoincrement"):
                        continue
                    issues.append(
                        SchemaIssue(
                            "nullability_mismatch",
                            f"Column '{table_name}.{name}' is nullable in models "
                            f"but NOT NULL without default in the database",
                        )
                    )
                continue

            # Unknown DB column: only fail if it would break older app inserts.
            if (
                not db_col.get("nullable", True)
                and not _has_default(db_col)
                and not db_col.get("autoincrement")
            ):
                issues.append(
                    SchemaIssue(
                        "unexpected_required_column",
                        f"Database column '{table_name}.{name}' is NOT NULL "
                        f"without default and is not defined in models "
                        f"(database schema is ahead of the backend)",
                    )
                )

    return issues


def format_issues(issues: Iterable[SchemaIssue]) -> str:
    lines = [str(issue) for issue in issues]
    return "\n".join(lines) if lines else ""


def assert_schema_matches(connection: Connection, metadata: MetaData) -> None:
    issues = diff_schema(connection, metadata)
    if issues:
        raise AssertionError(
            "Database schema does not match SQLAlchemy models:\n"
            + format_issues(issues)
        )
