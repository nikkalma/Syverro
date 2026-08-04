import os
from pathlib import Path
import subprocess
import sys


BACKEND_ROOT = Path(__file__).resolve().parents[1]


def test_database_initialization_does_not_print_connection_url():
    secret_marker = "do-not-log-this-password"
    env = os.environ.copy()
    env["DATABASE_URL"] = (
        f"postgresql+asyncpg://syverro:{secret_marker}@localhost:5432/syverro"
    )

    result = subprocess.run(
        [sys.executable, "-c", "import app.config; import app.database"],
        cwd=BACKEND_ROOT,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )

    output = result.stdout + result.stderr
    assert result.returncode == 0
    assert secret_marker not in output
    assert env["DATABASE_URL"] not in output


def test_sqlalchemy_echo_is_disabled():
    env = os.environ.copy()
    env["DATABASE_URL"] = "postgresql+asyncpg://syverro:test-only@localhost:5432/syverro"
    result = subprocess.run(
        [sys.executable, "-c", "from app.database import engine; assert engine.echo is False"],
        cwd=BACKEND_ROOT,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr
