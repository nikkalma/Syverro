from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime
from uuid import UUID


# ============================================
# PUSH
# ============================================

class PushItem(BaseModel):
    op_id: str
    entity: str
    entity_id: str
    operation: str
    payload: Any
    timestamp: int
    device_id: str


class PushRequest(BaseModel):
    device_id: str
    changes: List[PushItem]


class AppliedItem(BaseModel):
    op_id: str
    entity_id: str
    version: int
    server_state: Optional[Any] = None


class RejectedItem(BaseModel):
    op_id: str
    entity_id: str
    reason: str
    server_state: Optional[Any] = None


class MergedItem(BaseModel):
    op_id: str
    entity_id: str
    resolved_state: Any
    version: int


class PushResponse(BaseModel):
    applied: List[AppliedItem] = []
    rejected: List[RejectedItem] = []
    merged: List[MergedItem] = []
    sync_cursor: str
    server_time: str


# ============================================
# PULL
# ============================================

class PullRequest(BaseModel):
    cursor: Optional[str] = None
    device_id: str
    limit: int = 100


class PullUpdatedItem(BaseModel):
    entity_type: str
    entity_id: str
    data: Any
    version: int
    last_modified_at: str


class PullDeletedItem(BaseModel):
    entity_type: str
    entity_id: str
    deleted_at: str


class PullResponse(BaseModel):
    updated: List[PullUpdatedItem] = []
    deleted: List[PullDeletedItem] = []
    sync_cursor: str
    has_more: bool
    server_time: str


# ============================================
# CONFLICTS
# ============================================

class ConflictItem(BaseModel):
    entity_id: str
    your_state: Optional[Any] = None
    server_state: Optional[Any] = None


class ConflictResolution(BaseModel):
    entity_id: str
    winner: str
    resolved_state: Any


# ============================================
# STATUS
# ============================================

class SyncStatusResponse(BaseModel):
    user_id: str
    last_sync_cursor: Optional[str] = None
    last_sync_status: str
    last_sync_error: Optional[str] = None
    pending_changes: int = 0
    server_time: str