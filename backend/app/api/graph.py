from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import get_db
from app.graph.service import get_book_graph
from uuid import UUID

router = APIRouter(prefix="/books", tags=["graph"])


@router.get("/{book_id}/graph")
async def book_graph(
    book_id: UUID,
    depth: int = Query(1, ge=0, le=2, description="0=book only, 1=direct neighbors, 2=with knowledge relations"),
    db: AsyncSession = Depends(get_db),
):
    """Return the graph centered on a book at the specified depth.

    The graph service layer handles all traversal and serialization.
    This route only validates input, calls the service, and returns the response.
    """
    result = await get_book_graph(db, book_id, depth=depth)
    if result is None:
        raise HTTPException(status_code=404, detail="Book not found")
    return result
