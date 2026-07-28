from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.models.author import Author
from app.models.author_quote import AuthorQuote
from app.models.author_citizenship import AuthorCitizenship
from app.models.author_residence import AuthorResidence
from app.models.ai_proposal import AIProposal
from app.models.source import Source
from app.models.timeline_event import TimelineEvent
from app.models.author_knowledge_relation import AuthorKnowledgeRelation
from app.schemas.author_quote import AuthorQuoteCreate, AuthorQuoteUpdate, AuthorQuoteResponse
from app.schemas.author_citizenship import AuthorCitizenshipCreate, AuthorCitizenshipUpdate, AuthorCitizenshipResponse
from app.schemas.author_residence import AuthorResidenceCreate, AuthorResidenceUpdate, AuthorResidenceResponse
from app.schemas.ai_proposal import AIProposalCreate, AIProposalUpdate, AIProposalResponse
import logging
from typing import Optional
from uuid import UUID
from datetime import datetime
from sqlalchemy import func

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin/authors", tags=["admin-authors-ext"])


async def check_admin(user: User) -> User:
    if user.role not in ["owner", "admin", "moderator"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


async def get_author_or_404(db: AsyncSession, author_id: str) -> Author:
    result = await db.execute(select(Author).where(Author.id == author_id))
    author = result.scalar_one_or_none()
    if not author:
        raise HTTPException(status_code=404, detail="Author not found")
    return author


# ============================================================
# AUTHOR QUOTES CRUD
# ============================================================

@router.get("/{author_id}/quotes", response_model=dict)
async def get_author_quotes(
    author_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)
    author = await get_author_or_404(db, author_id)

    result = await db.execute(
        select(AuthorQuote).where(AuthorQuote.author_id == author.id).order_by(AuthorQuote.created_at)
    )
    quotes = result.scalars().all()
    return {
        "data": [{
            "id": str(q.id),
            "author_id": str(q.author_id),
            "text": q.text,
            "speaker": q.speaker,
            "source_id": str(q.source_id) if q.source_id else None,
            "date_value": q.date_value,
            "confidence": q.confidence,
            "status": q.status,
            "sort_order": q.sort_order,
            "created_at": q.created_at.isoformat() if q.created_at else None,
            "updated_at": q.updated_at.isoformat() if q.updated_at else None,
        } for q in quotes],
    }


@router.post("/{author_id}/quotes", status_code=201)
async def create_author_quote(
    author_id: str,
    data: AuthorQuoteCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)
    author = await get_author_or_404(db, author_id)

    quote = AuthorQuote(author_id=author.id, **data.model_dump())
    db.add(quote)
    await db.commit()
    await db.refresh(quote)
    return {
        "id": str(quote.id),
        "message": "Quote created",
    }


@router.put("/{author_id}/quotes/{quote_id}")
async def update_author_quote(
    author_id: str,
    quote_id: str,
    data: AuthorQuoteUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)
    author = await get_author_or_404(db, author_id)

    result = await db.execute(
        select(AuthorQuote).where(AuthorQuote.id == quote_id, AuthorQuote.author_id == author.id)
    )
    quote = result.scalar_one_or_none()
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(quote, key, value)
    await db.commit()
    return {"message": "Quote updated"}


@router.delete("/{author_id}/quotes/{quote_id}", status_code=204)
async def delete_author_quote(
    author_id: str,
    quote_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)
    author = await get_author_or_404(db, author_id)

    result = await db.execute(
        select(AuthorQuote).where(AuthorQuote.id == quote_id, AuthorQuote.author_id == author.id)
    )
    quote = result.scalar_one_or_none()
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    await db.delete(quote)
    await db.commit()


# ============================================================
# AUTHOR CITIZENSHIPS CRUD
# ============================================================

@router.get("/{author_id}/citizenships", response_model=dict)
async def get_author_citizenships(
    author_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)
    author = await get_author_or_404(db, author_id)

    result = await db.execute(
        select(AuthorCitizenship).where(AuthorCitizenship.author_id == author.id).order_by(AuthorCitizenship.from_date)
    )
    items = result.scalars().all()
    return {
        "data": [{
            "id": str(c.id),
            "author_id": str(c.author_id),
            "state_name": c.state_name,
            "from_date": c.from_date,
            "to_date": c.to_date,
            "notes": c.notes,
            "source_id": str(c.source_id) if c.source_id else None,
            "confidence": c.confidence,
            "status": c.status,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        } for c in items],
    }


@router.post("/{author_id}/citizenships", status_code=201)
async def create_author_citizenship(
    author_id: str,
    data: AuthorCitizenshipCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)
    author = await get_author_or_404(db, author_id)

    item = AuthorCitizenship(author_id=author.id, **data.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return {"id": str(item.id), "message": "Citizenship created"}


@router.put("/{author_id}/citizenships/{item_id}")
async def update_author_citizenship(
    author_id: str,
    item_id: str,
    data: AuthorCitizenshipUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)
    author = await get_author_or_404(db, author_id)
    result = await db.execute(
        select(AuthorCitizenship).where(AuthorCitizenship.id == item_id, AuthorCitizenship.author_id == author.id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Citizenship not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    await db.commit()
    await db.refresh(item)
    return {"id": str(item.id), "message": "Citizenship updated"}


@router.delete("/{author_id}/citizenships/{item_id}", status_code=204)
async def delete_author_citizenship(
    author_id: str,
    item_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)
    author = await get_author_or_404(db, author_id)

    result = await db.execute(
        select(AuthorCitizenship).where(AuthorCitizenship.id == item_id, AuthorCitizenship.author_id == author.id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Citizenship not found")
    await db.delete(item)
    await db.commit()


# ============================================================
# AUTHOR RESIDENCES CRUD
# ============================================================

@router.get("/{author_id}/residences", response_model=dict)
async def get_author_residences(
    author_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)
    author = await get_author_or_404(db, author_id)

    result = await db.execute(
        select(AuthorResidence).where(AuthorResidence.author_id == author.id).order_by(AuthorResidence.from_date)
    )
    items = result.scalars().all()
    return {
        "data": [{
            "id": str(r.id),
            "author_id": str(r.author_id),
            "place_id": str(r.place_id) if r.place_id else None,
            "from_date": r.from_date,
            "to_date": r.to_date,
            "source_id": str(r.source_id) if r.source_id else None,
            "confidence": r.confidence,
            "status": r.status,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        } for r in items],
    }


@router.post("/{author_id}/residences", status_code=201)
async def create_author_residence(
    author_id: str,
    data: AuthorResidenceCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)
    author = await get_author_or_404(db, author_id)

    item = AuthorResidence(author_id=author.id, **data.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return {"id": str(item.id), "message": "Residence created"}


@router.delete("/{author_id}/residences/{item_id}", status_code=204)
async def delete_author_residence(
    author_id: str,
    item_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)
    author = await get_author_or_404(db, author_id)

    result = await db.execute(
        select(AuthorResidence).where(AuthorResidence.id == item_id, AuthorResidence.author_id == author.id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Residence not found")
    await db.delete(item)
    await db.commit()


# ============================================================
# AUTHOR SOURCES (scoped to sources referenced by this author)
# ============================================================


@router.get("/{author_id}/sources")
async def get_author_sources(
    author_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)
    author = await get_author_or_404(db, author_id)

    source_ids = set()

    tl_result = await db.execute(
        select(TimelineEvent.source_id).where(TimelineEvent.author_id == author.id)
    )
    source_ids.update(row[0] for row in tl_result if row[0])

    q_result = await db.execute(
        select(AuthorQuote.source_id).where(AuthorQuote.author_id == author.id)
    )
    source_ids.update(row[0] for row in q_result if row[0])

    c_result = await db.execute(
        select(AuthorCitizenship.source_id).where(AuthorCitizenship.author_id == author.id)
    )
    source_ids.update(row[0] for row in c_result if row[0])

    res_result = await db.execute(
        select(AuthorResidence.source_id).where(AuthorResidence.author_id == author.id)
    )
    source_ids.update(row[0] for row in res_result if row[0])

    kr_result = await db.execute(
        select(AuthorKnowledgeRelation.source_id).where(AuthorKnowledgeRelation.author_id == author.id)
    )
    source_ids.update(row[0] for row in kr_result if row[0])

    if not source_ids:
        return {"data": []}

    result = await db.execute(
        select(Source).where(Source.id.in_(list(source_ids))).order_by(Source.title)
    )
    sources = result.scalars().all()
    return {
        "data": [{
            "id": str(s.id),
            "title": s.title,
            "source_type": s.source_type,
            "url": s.url,
            "citation": s.citation,
            "notes": s.notes,
            "language": s.language,
            "reliability_score": s.reliability_score,
            "source_origin": s.source_origin,
            "created_at": s.created_at.isoformat() if s.created_at else None,
        } for s in sources],
    }


# ============================================================
# AI PROPOSALS
# ============================================================

@router.get("/{author_id}/proposals", response_model=dict)
async def get_author_proposals(
    author_id: str,
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)

    query = select(AIProposal).where(AIProposal.entity_id == author_id)
    if status_filter:
        query = query.where(AIProposal.status == status_filter)
    query = query.order_by(AIProposal.created_at.desc())

    result = await db.execute(query)
    proposals = result.scalars().all()
    return {
        "data": [{
            "id": str(p.id),
            "entity_type": p.entity_type,
            "entity_id": p.entity_id,
            "field_name": p.field_name,
            "current_value": p.current_value,
            "suggested_value": p.suggested_value,
            "source_type": p.source_type,
            "confidence": p.confidence,
            "status": p.status,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "reviewed_at": p.reviewed_at.isoformat() if p.reviewed_at else None,
            "reviewed_by": str(p.reviewed_by) if p.reviewed_by else None,
        } for p in proposals],
    }


@router.post("/{author_id}/proposals", status_code=201)
async def create_author_proposal(
    author_id: str,
    data: AIProposalCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)

    proposal = AIProposal(entity_id=author_id, **data.model_dump())
    db.add(proposal)
    await db.commit()
    await db.refresh(proposal)
    return {"id": str(proposal.id), "message": "Proposal created"}


@router.put("/{author_id}/proposals/{proposal_id}")
async def update_author_proposal(
    author_id: str,
    proposal_id: str,
    data: AIProposalUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)

    result = await db.execute(
        select(AIProposal).where(AIProposal.id == proposal_id, AIProposal.entity_id == author_id)
    )
    proposal = result.scalar_one_or_none()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")

    if data.status:
        proposal.status = data.status
        proposal.reviewed_at = datetime.utcnow()
        proposal.reviewed_by = current_user.id
    await db.commit()
    return {"message": "Proposal updated"}


# ============================================================
# AI ANALYZE ENDPOINT (placeholder)
# ============================================================

@router.post("/{author_id}/ai/analyze")
async def analyze_author_ai(
    author_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)
    author = await get_author_or_404(db, author_id)

    return {
        "author_id": str(author.id),
        "author_name": author.name,
        "timeline_candidates": [],
        "source_candidates": [],
        "knowledge_candidates": [],
        "message": "AI analysis endpoint is ready. ML integration pending.",
    }


# ============================================================
# TAXONOMY DUPLICATE CHECK
# ============================================================

from app.models.knowledge_node import KnowledgeNode


@router.get("/{author_id}/taxonomy-check")
async def check_taxonomy_duplicates(
    author_id: str,
    name: str,
    node_type: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_admin(current_user)

    normalized = name.strip().lower()
    result = await db.execute(
        select(KnowledgeNode).where(
            KnowledgeNode.slug == normalized,
            KnowledgeNode.node_type == node_type
        ).limit(1)
    )
    existing = result.scalar_one_or_none()

    # Count how many authors use this node
    author_count = 0
    if existing:
        from app.models.author_knowledge_relation import AuthorKnowledgeRelation
        count_result = await db.execute(
            select(func.count()).select_from(AuthorKnowledgeRelation).where(
                AuthorKnowledgeRelation.node_id == existing.id
            )
        )
        author_count = count_result.scalar() or 0

    return {
        "exists": existing is not None,
        "node_id": str(existing.id) if existing else None,
        "name": existing.name if existing else None,
        "author_count": author_count,
        "normalized": normalized,
    }
