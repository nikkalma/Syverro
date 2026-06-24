// src/lib/offline/useOffline.ts

import { useCallback, useEffect, useState } from 'react'
import { addLocalEvent, trackReadingStart, trackReadingFinish, trackNote, trackMood } from './events'
import { syncLocalEvents, scheduleSync } from './sync'
import { getLocalEvents, getUnsyncedEvents, getLastSyncTime } from './store'
import { LocalEventType, LocalEvent, SyncResponse } from './types'

interface UseOfflineReturn {
  // Методы для трекинга
  trackEvent: (type: LocalEventType, bookId: string, payload?: Record<string, unknown>) => LocalEvent
  trackReadingStart: (bookId: string, payload?: { title?: string, author?: string }) => LocalEvent
  trackReadingFinish: (bookId: string, duration: number) => LocalEvent
  trackNote: (bookId: string, text: string, page?: number) => LocalEvent
  trackMood: (bookId: string, mood: string, effect?: string) => LocalEvent
  
  // Синхронизация
  sync: () => Promise<SyncResponse>
  scheduleSync: (delayMs?: number) => void
  
  // Статус
  unsyncedCount: number
  totalEvents: number
  lastSyncTime: string | null
  hasUnsyncedEvents: boolean
  
  // Авто-синхронизация
  startAutoSync: (intervalMs?: number) => void
  stopAutoSync: () => void
}

export function useOffline(): UseOfflineReturn {
  const [unsyncedCount, setUnsyncedCount] = useState(0)
  const [totalEvents, setTotalEvents] = useState(0)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)
  
  // Обновление статистики
  const updateStats = useCallback(() => {
    const events = getLocalEvents()
    const unsynced = events.filter(e => !e.synced)
    setTotalEvents(events.length)
    setUnsyncedCount(unsynced.length)
    setLastSyncTime(getLastSyncTime())
  }, [])
  
  useEffect(() => {
    updateStats()
    
    // Подписываемся на изменения storage (для других вкладок)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'syverro_local_events') {
        updateStats()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [updateStats])
  
  const trackEvent = useCallback((type: LocalEventType, bookId: string, payload?: Record<string, unknown>) => {
    const event = addLocalEvent(type, bookId, payload)
    updateStats()
    
    // Автоматический синк через 5 секунд после события
    scheduleSync(5000)
    
    return event
  }, [updateStats])
  
  const sync = useCallback(async () => {
    const result = await syncLocalEvents()
    updateStats()
    return result
  }, [updateStats])
  
  return {
    trackEvent,
    trackReadingStart,
    trackReadingFinish,
    trackNote,
    trackMood,
    sync,
    scheduleSync,
    unsyncedCount,
    totalEvents,
    lastSyncTime,
    hasUnsyncedEvents: unsyncedCount > 0,
    startAutoSync: () => {},
    stopAutoSync: () => {},
  }
}