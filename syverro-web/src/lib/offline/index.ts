// src/lib/offline/index.ts

// Типы
export type { 
  LocalEvent, 
  LocalEventType, 
  SyncResponse, 
  MoodPayload, 
  NotePayload, 
  PagePayload,
  SessionPayload 
} from './types'

// Хуки
export { useOffline } from './useOffline'

// Хранилище (для прямого доступа, если нужно)
export { 
  getLocalEvents, 
  getUnsyncedEvents, 
  getLastSyncTime,
  clearSyncedEvents 
} from './store'

// События
export { 
  addLocalEvent, 
  createLocalEvent,
  trackReadingStart,
  trackReadingFinish,
  trackNote,
  trackMood 
} from './events'

// Синхронизация
export { 
  syncLocalEvents, 
  scheduleSync, 
  setupSyncOnUnload 
} from './sync'