// src/lib/offline/types.ts

export type LocalEventType = 
  | 'READING_STARTED'
  | 'READING_FINISHED'
  | 'NOTE_CREATED'
  | 'MOOD_CHANGED'
  | 'BOOK_ADDED'
  | 'PAGE_CHANGED'
  | 'SESSION_STARTED'
  | 'SESSION_ENDED'

export interface LocalEvent {
  id: string
  type: LocalEventType
  bookId: string
  timestamp: string
  synced: boolean
  payload: Record<string, unknown>
}

export interface SyncResponse {
  success: boolean
  syncedCount: number
  errors?: string[]
}

export interface MoodPayload {
  before?: string
  after?: string
  effect?: string
}

export interface NotePayload {
  text: string
  page?: number
}

export interface PagePayload {
  page: number
  progress?: number // 0-100
}

export interface SessionPayload {
  duration?: number // секунды
  pagesRead?: number
}