// src/lib/offline/events.ts

import { LocalEvent, LocalEventType } from './types'
import { saveLocalEvent } from './store'

export function createLocalEvent(
  type: LocalEventType,
  bookId: string,
  payload: Record<string, unknown> = {}
): LocalEvent {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    type,
    bookId,
    timestamp: new Date().toISOString(),
    synced: false,
    payload,
  }
}

export function addLocalEvent(
  type: LocalEventType,
  bookId: string,
  payload?: Record<string, unknown>
): LocalEvent {
  const event = createLocalEvent(type, bookId, payload)
  saveLocalEvent(event)
  console.log(`📝 [Local] Event saved: ${type}`, event)
  return event
}

// Удобные хелперы для частых событий
export function trackReadingStart(bookId: string, payload?: { title?: string, author?: string }): LocalEvent {
  return addLocalEvent('READING_STARTED', bookId, payload)
}

export function trackReadingFinish(bookId: string, duration: number): LocalEvent {
  return addLocalEvent('READING_FINISHED', bookId, { duration, finishedAt: new Date().toISOString() })
}

export function trackNote(bookId: string, text: string, page?: number): LocalEvent {
  return addLocalEvent('NOTE_CREATED', bookId, { text, page })
}

export function trackMood(bookId: string, mood: string, effect?: string): LocalEvent {
  return addLocalEvent('MOOD_CHANGED', bookId, { mood, effect })
}