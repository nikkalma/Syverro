from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.api.admin import (
    RoleUpdate,
    block_user,
    delete_author,
    delete_book,
    delete_genre,
    logout_user_sessions,
    update_metadata_book,
    update_user_role,
)


class FakeResult:
    def __init__(self, value):
        self.value = value

    def scalar_one_or_none(self):
        return self.value


class FakeSession:
    def __init__(self, values):
        self.values = iter(values)
        self.statements = []
        self.commit = AsyncMock()

    async def execute(self, statement):
        self.statements.append(statement)
        return FakeResult(next(self.values, None))


def user(role, *, user_id=None):
    return SimpleNamespace(id=user_id or uuid4(), role=role)


@pytest.mark.asyncio
async def test_moderator_cannot_promote_itself_to_owner():
    moderator = user("moderator")

    with pytest.raises(HTTPException) as exc:
        await update_user_role(
            user_id=str(moderator.id),
            data=RoleUpdate(role="owner"),
            current_user=moderator,
            db=FakeSession([]),
        )

    assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_admin_cannot_grant_admin_or_owner_role():
    admin = user("admin")
    target = user("user")

    with pytest.raises(HTTPException) as exc:
        await update_user_role(
            user_id=str(target.id),
            data=RoleUpdate(role="owner"),
            current_user=admin,
            db=FakeSession([target]),
        )

    assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_admin_can_promote_user_to_moderator():
    admin = user("admin")
    target = user("user")
    db = FakeSession([target])

    await update_user_role(
        user_id=str(target.id),
        data=RoleUpdate(role="moderator"),
        current_user=admin,
        db=db,
    )

    assert target.role == "moderator"
    db.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_moderator_cannot_block_an_admin():
    with pytest.raises(HTTPException) as exc:
        await block_user(
            user_id=str(uuid4()),
            data=SimpleNamespace(is_active=False),
            current_user=user("moderator"),
            db=FakeSession([]),
        )

    assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_ordinary_user_cannot_update_admin_book_metadata():
    with pytest.raises(HTTPException) as exc:
        await update_metadata_book(
            book_id=str(uuid4()),
            data=SimpleNamespace(),
            current_user=user("user"),
            db=FakeSession([]),
        )

    assert exc.value.status_code == 403


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("operation", "id_argument"),
    [
        (delete_book, "book_id"),
        (delete_author, "author_id"),
        (delete_genre, "genre_id"),
    ],
)
async def test_moderator_cannot_permanently_delete_catalog_entities(
    operation, id_argument
):
    with pytest.raises(HTTPException) as exc:
        await operation(
            **{id_argument: str(uuid4())},
            current_user=user("moderator"),
            db=FakeSession([]),
        )

    assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_admin_logout_revokes_all_target_refresh_sessions():
    admin = user("admin")
    target = user("user")
    db = FakeSession([target, None])

    response = await logout_user_sessions(
        user_id=str(target.id),
        current_user=admin,
        db=db,
    )

    assert response == {"message": "All sessions terminated"}
    assert len(db.statements) == 2
    update_sql = str(db.statements[1])
    assert "UPDATE refresh_sessions" in update_sql
    assert "refresh_sessions.user_id" in update_sql
    assert "refresh_sessions.revoked_at IS NULL" in update_sql
    db.commit.assert_awaited_once()
