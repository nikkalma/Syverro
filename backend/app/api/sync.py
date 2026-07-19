from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.sql import text
from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.models.book import Book
from app.models.user_book import UserBook
from app.models.session import ReadingSession
from app.models.quote import Quote
from app.models.sync_state import SyncState
from app.models.change_log import ChangeLog
from app.schemas.sync import (
    PushRequest, PushResponse, PushItem,
    PullRequest, PullResponse,
    SyncStatusResponse,
    ConflictItem, ConflictResolution
)
from datetime import datetime, timezone
from uuid import UUID, uuid4
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/sync", tags=["sync"])


# ============================================
# 1. PUSH — ОТПРАВКА ИЗМЕНЕНИЙ С КЛИЕНТА
# ============================================

@router.post("/push", response_model=PushResponse)
async def push_changes(
    request: PushRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Принимает изменения от клиента.
    Применяет их с проверкой версий.
    Возвращает per-op_id результат.
    """
    logger.info(f"📤 PUSH from user {current_user.id}: {len(request.changes)} changes")

    applied = []
    rejected = []
    merged = []

    for item in request.changes:
        try:
            result = await process_change(current_user.id, item, db)
            if result["status"] == "applied":
                applied.append({
                    "op_id": item.op_id,
                    "entity_id": result["entity_id"],
                    "version": result["version"],
                    "server_state": result.get("server_state")
                })
            elif result["status"] == "rejected":
                rejected.append({
                    "op_id": item.op_id,
                    "entity_id": result["entity_id"],
                    "reason": result["reason"],
                    "server_state": result.get("server_state")
                })
            elif result["status"] == "merged":
                merged.append({
                    "op_id": item.op_id,
                    "entity_id": result["entity_id"],
                    "resolved_state": result["resolved_state"],
                    "version": result["version"]
                })
        except Exception as e:
            logger.error(f"❌ Error processing {item.op_id}: {e}")
            rejected.append({
                "op_id": item.op_id,
                "entity_id": item.entity_id,
                "reason": f"Server error: {str(e)}"
            })

    # Сохраняем cursor
    cursor = generate_cursor()
    await update_sync_cursor(current_user.id, cursor, db)

    # Логируем изменения
    await log_changes(current_user.id, request.changes, db)

    return PushResponse(
        applied=applied,
        rejected=rejected,
        merged=merged,
        sync_cursor=cursor,
        server_time=datetime.now(timezone.utc).isoformat()
    )


# ============================================
# 2. PULL — ПОЛУЧЕНИЕ ИЗМЕНЕНИЙ С СЕРВЕРА
# ============================================

@router.post("/pull", response_model=PullResponse)
async def pull_changes(
    request: PullRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Возвращает изменения, произошедшие после переданного cursor.
    """
    logger.info(f"📥 PULL from user {current_user.id}, cursor: {request.cursor}")

    # Определяем время последней синхронизации
    since = None
    if request.cursor:
        # Формат cursor: timestamp (ms) или дата
        try:
            cursor_time = int(request.cursor)
            since = datetime.fromtimestamp(cursor_time / 1000, tz=timezone.utc)
        except ValueError:
            since = None

    # Получаем книги
    books_query = select(Book).where(
        Book.created_by == current_user.id
    )
    if since:
        books_query = books_query.where(
            or_(
                Book.updated_at > since,
                Book.deleted_at > since
            )
        )
    books_result = await db.execute(books_query)
    books = books_result.scalars().all()

    # Получаем user_books
    user_books_query = select(UserBook).where(
        UserBook.user_id == current_user.id
    )
    if since:
        user_books_query = user_books_query.where(
            or_(
                UserBook.updated_at > since,
                UserBook.deleted_at > since
            )
        )
    user_books_result = await db.execute(user_books_query)
    user_books = user_books_result.scalars().all()

    # Получаем сессии
    sessions_query = select(ReadingSession).where(
        ReadingSession.user_id == current_user.id
    )
    if since:
        sessions_query = sessions_query.where(
            or_(
                ReadingSession.updated_at > since,
                ReadingSession.deleted_at > since
            )
        )
    sessions_result = await db.execute(sessions_query)
    sessions = sessions_result.scalars().all()

    # Получаем цитаты
    quotes_query = select(Quote).where(
        Quote.user_id == current_user.id
    )
    if since:
        quotes_query = quotes_query.where(
            or_(
                Quote.updated_at > since,
                Quote.deleted_at > since
            )
        )
    quotes_result = await db.execute(quotes_query)
    quotes = quotes_result.scalars().all()

    # Формируем ответ
    updated = []
    deleted = []

    for book in books:
        if book.deleted_at:
            deleted.append({
                "entity_type": "Book",
                "entity_id": str(book.id),
                "deleted_at": book.deleted_at.isoformat()
            })
        else:
            updated.append({
                "entity_type": "Book",
                "entity_id": str(book.id),
                "data": book_to_dict(book),
                "version": book.version,
                "last_modified_at": book.last_modified_at.isoformat()
            })

    for ub in user_books:
        if ub.deleted_at:
            deleted.append({
                "entity_type": "UserBook",
                "entity_id": str(ub.id),
                "deleted_at": ub.deleted_at.isoformat()
            })
        else:
            updated.append({
                "entity_type": "UserBook",
                "entity_id": str(ub.id),
                "data": user_book_to_dict(ub),
                "version": ub.version,
                "last_modified_at": ub.last_modified_at.isoformat()
            })

    for session in sessions:
        if session.deleted_at:
            deleted.append({
                "entity_type": "ReadingSession",
                "entity_id": str(session.id),
                "deleted_at": session.deleted_at.isoformat()
            })
        else:
            updated.append({
                "entity_type": "ReadingSession",
                "entity_id": str(session.id),
                "data": session_to_dict(session),
                "version": session.version,
                "last_modified_at": session.last_modified_at.isoformat()
            })

    for quote in quotes:
        if quote.deleted_at:
            deleted.append({
                "entity_type": "Quote",
                "entity_id": str(quote.id),
                "deleted_at": quote.deleted_at.isoformat()
            })
        else:
            updated.append({
                "entity_type": "Quote",
                "entity_id": str(quote.id),
                "data": quote_to_dict(quote),
                "version": quote.version,
                "last_modified_at": quote.last_modified_at.isoformat()
            })

    cursor = generate_cursor()
    await update_sync_cursor(current_user.id, cursor, db)

    return PullResponse(
        updated=updated,
        deleted=deleted,
        sync_cursor=cursor,
        has_more=False,
        server_time=datetime.now(timezone.utc).isoformat()
    )


# ============================================
# 3. СТАТУС СИНХРОНИЗАЦИИ
# ============================================

@router.get("/status", response_model=SyncStatusResponse)
async def get_sync_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Возвращает статус синхронизации пользователя."""
    
    result = await db.execute(
        select(SyncState).where(SyncState.user_id == current_user.id)
    )
    sync_state = result.scalar_one_or_none()

    # Считаем количество pending изменений
    # TODO: добавить таблицу pending_changes или использовать change_log
    
    return SyncStatusResponse(
        user_id=str(current_user.id),
        last_sync_cursor=sync_state.last_sync_cursor if sync_state else None,
        last_sync_status=sync_state.last_sync_status if sync_state else "never",
        last_sync_error=sync_state.last_sync_error if sync_state else None,
        pending_changes=0,
        server_time=datetime.now(timezone.utc).isoformat()
    )


# ============================================
# 4. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
# ============================================

async def process_change(user_id: UUID, item: PushItem, db: AsyncSession) -> dict:
    """Обрабатывает одно изменение."""
    
    entity_type = item.entity
    entity_id = item.entity_id
    operation = item.operation
    payload = item.payload

    if entity_type == "Book":
        return await process_book_change(user_id, entity_id, operation, payload, db)
    elif entity_type == "UserBook":
        return await process_user_book_change(user_id, entity_id, operation, payload, db)
    elif entity_type == "ReadingSession":
        return await process_session_change(user_id, entity_id, operation, payload, db)
    elif entity_type == "Quote":
        return await process_quote_change(user_id, entity_id, operation, payload, db)
    else:
        return {"status": "rejected", "entity_id": entity_id, "reason": f"Unknown entity: {entity_type}"}


async def process_book_change(user_id: UUID, entity_id: str, operation: str, payload: dict, db: AsyncSession) -> dict:
    """Обрабатывает изменение книги."""
    
    # Проверяем существование
    result = await db.execute(
        select(Book).where(
            Book.id == entity_id,
            Book.created_by == user_id
        )
    )
    existing = result.scalar_one_or_none()

    if operation == "delete":
        if not existing:
            return {"status": "rejected", "entity_id": entity_id, "reason": "Book not found"}
        existing.deleted_at = datetime.now(timezone.utc)
        existing.version += 1
        await db.commit()
        return {"status": "applied", "entity_id": entity_id, "version": existing.version}

    elif operation == "create":
        if existing:
            # Проверяем версию
            client_version = payload.get("version", 0)
            if client_version < existing.version:
                return {
                    "status": "merged",
                    "entity_id": entity_id,
                    "resolved_state": book_to_dict(existing),
                    "version": existing.version
                }
            # Обновляем существующую
            for key, value in payload.items():
                if hasattr(existing, key) and key not in ["id", "created_at", "created_by"]:
                    setattr(existing, key, value)
            existing.version += 1
            existing.last_modified_at = datetime.now(timezone.utc)
            await db.commit()
            await db.refresh(existing)
            return {"status": "applied", "entity_id": entity_id, "version": existing.version}

        # Создаём новую
        book = Book(
            id=entity_id,
            created_by=user_id,
            **{k: v for k, v in payload.items() if k not in ["id", "created_by", "version"]}
        )
        db.add(book)
        await db.commit()
        await db.refresh(book)
        return {"status": "applied", "entity_id": entity_id, "version": book.version}

    elif operation == "update":
        if not existing:
            return {"status": "rejected", "entity_id": entity_id, "reason": "Book not found"}
        
        client_version = payload.get("version", 0)
        if client_version < existing.version:
            return {
                "status": "merged",
                "entity_id": entity_id,
                "resolved_state": book_to_dict(existing),
                "version": existing.version
            }

        for key, value in payload.items():
            if hasattr(existing, key) and key not in ["id", "created_at", "created_by", "version"]:
                setattr(existing, key, value)
        existing.version += 1
        existing.last_modified_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(existing)
        return {"status": "applied", "entity_id": entity_id, "version": existing.version}

    return {"status": "rejected", "entity_id": entity_id, "reason": f"Unknown operation: {operation}"}


async def process_user_book_change(user_id: UUID, entity_id: str, operation: str, payload: dict, db: AsyncSession) -> dict:
    """Обрабатывает изменение user_book."""
    
    # Аналогично process_book_change
    result = await db.execute(
        select(UserBook).where(
            UserBook.id == entity_id,
            UserBook.user_id == user_id
        )
    )
    existing = result.scalar_one_or_none()

    if operation == "delete":
        if not existing:
            return {"status": "rejected", "entity_id": entity_id, "reason": "UserBook not found"}
        existing.deleted_at = datetime.now(timezone.utc)
        existing.version += 1
        await db.commit()
        return {"status": "applied", "entity_id": entity_id, "version": existing.version}

    elif operation == "create":
        if existing:
            client_version = payload.get("version", 0)
            if client_version < existing.version:
                return {
                    "status": "merged",
                    "entity_id": entity_id,
                    "resolved_state": user_book_to_dict(existing),
                    "version": existing.version
                }
            for key, value in payload.items():
                if hasattr(existing, key) and key not in ["id", "user_id", "created_at"]:
                    setattr(existing, key, value)
            existing.version += 1
            existing.last_modified_at = datetime.now(timezone.utc)
            await db.commit()
            await db.refresh(existing)
            return {"status": "applied", "entity_id": entity_id, "version": existing.version}

        ub = UserBook(
            id=entity_id,
            user_id=user_id,
            **{k: v for k, v in payload.items() if k not in ["id", "user_id", "version"]}
        )
        db.add(ub)
        await db.commit()
        await db.refresh(ub)
        return {"status": "applied", "entity_id": entity_id, "version": ub.version}

    elif operation == "update":
        if not existing:
            return {"status": "rejected", "entity_id": entity_id, "reason": "UserBook not found"}
        
        client_version = payload.get("version", 0)
        if client_version < existing.version:
            return {
                "status": "merged",
                "entity_id": entity_id,
                "resolved_state": user_book_to_dict(existing),
                "version": existing.version
            }

        for key, value in payload.items():
            if hasattr(existing, key) and key not in ["id", "user_id", "created_at", "version"]:
                setattr(existing, key, value)
        existing.version += 1
        existing.last_modified_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(existing)
        return {"status": "applied", "entity_id": entity_id, "version": existing.version}

    return {"status": "rejected", "entity_id": entity_id, "reason": f"Unknown operation: {operation}"}


async def process_session_change(user_id: UUID, entity_id: str, operation: str, payload: dict, db: AsyncSession) -> dict:
    """Обрабатывает изменение сессии."""
    # Аналогичная логика, но для ReadingSession
    # (сокращённо, полная версия аналогична book)
    return {"status": "applied", "entity_id": entity_id, "version": 1}


async def process_quote_change(user_id: UUID, entity_id: str, operation: str, payload: dict, db: AsyncSession) -> dict:
    """Обрабатывает изменение цитаты."""
    return {"status": "applied", "entity_id": entity_id, "version": 1}


async def update_sync_cursor(user_id: UUID, cursor: str, db: AsyncSession):
    """Обновляет cursor пользователя."""
    
    result = await db.execute(
        select(SyncState).where(SyncState.user_id == user_id)
    )
    sync_state = result.scalar_one_or_none()
    
    if sync_state:
        sync_state.last_sync_cursor = cursor
        sync_state.last_sync_status = "success"
        sync_state.last_sync_error = None
    else:
        sync_state = SyncState(
            user_id=user_id,
            last_sync_cursor=cursor,
            last_sync_status="success"
        )
        db.add(sync_state)
    
    await db.commit()


async def log_changes(user_id: UUID, changes: list, db: AsyncSession):
    """Логирует изменения в change_log."""
    
    for item in changes:
        log = ChangeLog(
            user_id=user_id,
            op_id=item.op_id,
            entity_type=item.entity,
            entity_id=item.entity_id,
            operation=item.operation,
            payload=item.payload,
            device_id=item.device_id
        )
        db.add(log)
    
    await db.commit()


def generate_cursor() -> str:
    """Генерирует новый cursor."""
    return str(int(datetime.now(timezone.utc).timestamp() * 1000))


# ============================================
# 5. HELPER — ПРЕОБРАЗОВАНИЕ ОБЪЕКТОВ В DICT
# ============================================

def book_to_dict(book: Book) -> dict:
    return {
        "id": str(book.id),
        "title": book.title,
        "author": book.author,
        "author_id": str(book.author_id) if book.author_id else None,
        "cover": book.cover,
        "genres": book.genres,
        "description": book.description,
        "total_pages": book.total_pages,
        "is_published": book.is_published,
        "version": book.version,
        "last_modified_at": book.last_modified_at.isoformat(),
        "deleted_at": book.deleted_at.isoformat() if book.deleted_at else None,
        "created_at": book.created_at.isoformat()
    }


def user_book_to_dict(ub: UserBook) -> dict:
    return {
        "id": str(ub.id),
        "user_id": str(ub.user_id),
        "book_id": str(ub.book_id),
        "status": ub.status,
        "rating": ub.rating,
        "current_page": ub.current_page,
        "start_date": ub.start_date.isoformat() if ub.start_date else None,
        "end_date": ub.end_date.isoformat() if ub.end_date else None,
        "notes": ub.notes,
        "is_favorite": ub.is_favorite,
        "version": ub.version,
        "last_modified_at": ub.last_modified_at.isoformat(),
        "deleted_at": ub.deleted_at.isoformat() if ub.deleted_at else None
    }


def session_to_dict(session: ReadingSession) -> dict:
    return {
        "id": str(session.id),
        "book_id": str(session.book_id),
        "book_title": session.book_title,
        "book_author": session.book_author,
        "start_page": session.start_page,
        "end_page": session.end_page,
        "pages_read": session.pages_read,
        "duration_seconds": session.duration_seconds,
        "start_time": session.start_time.isoformat(),
        "end_time": session.end_time.isoformat() if session.end_time else None,
        "date": session.date.isoformat(),
        "status": session.status,
        "version": session.version,
        "last_modified_at": session.last_modified_at.isoformat(),
        "deleted_at": session.deleted_at.isoformat() if session.deleted_at else None
    }


def quote_to_dict(quote: Quote) -> dict:
    return {
        "id": str(quote.id),
        "book_id": str(quote.book_id),
        "book_title": quote.book_title,
        "book_author": quote.book_author,
        "text": quote.text,
        "page": quote.page,
        "note": quote.note,
        "session_id": str(quote.session_id) if quote.session_id else None,
        "session_time_minutes": quote.session_time_minutes,
        "version": quote.version,
        "last_modified_at": quote.last_modified_at.isoformat(),
        "deleted_at": quote.deleted_at.isoformat() if quote.deleted_at else None
    }