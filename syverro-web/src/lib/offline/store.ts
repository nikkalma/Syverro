// src/lib/offline/store.ts

import { LocalEvent } from './types'

const STORAGE_KEY = 'syverro_local_events'
const SYNC_KEY = 'syverro_last_sync'

export function getLocalEvents(): LocalEvent[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function saveLocalEvent(event: LocalEvent): void {
  const events = getLocalEvents()
  events.push(event)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
}

export function getUnsyncedEvents(): LocalEvent[] {
  return getLocalEvents().filter(e => !e.synced)
}

export function markEventsAsSynced(ids: string[]): void {
  const events = getLocalEvents()
  const synced = events.map(e => 
    ids.includes(e.id) ? { ...e, synced: true } : e
  )
  localStorage.setItem(STORAGE_KEY, JSON.stringify(synced))
}

export function getLastSyncTime(): string | null {
  return localStorage.getItem(SYNC_KEY)
}

export function setLastSyncTime(time: string): void {
  localStorage.setItem(SYNC_KEY, time)
}

export function clearSyncedEvents(): void {
  const events = getLocalEvents()
  const unsynced = events.filter(e => !e.synced)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(unsynced))
}