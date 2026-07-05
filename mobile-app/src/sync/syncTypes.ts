export type EntityType = 'Book' | 'Quote' | 'ReadingSession'

export type OperationType = 'create' | 'update' | 'delete'

export type SyncState = 'pending' | 'sent' | 'confirmed' | 'failed'

export interface Change {
  op_id: string
  entity: EntityType
  entity_id: string
  operation: OperationType
  payload: any
  timestamp: number
  device_id: string
  retry_count?: number
}

export interface PushRequest {
  device_id: string
  changes: Change[]
}

export interface PushResponse {
  applied: Array<{ entity_id: string; version: number }>
  conflicts: Array<{
    entity_id: string
    server_state: any
    your_state?: any
  }>
  sync_cursor: string
}

export interface PullRequest {
  cursor: string | null
  device_id: string
}

export interface PullResponse {
  updated: any[]
  deleted: Array<{ entity_id: string; deleted_at: number }>
  sync_cursor: string
}