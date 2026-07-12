// ============================================
// SYVERRO — SYNC BOOTSTRAP
// Orchestrator слой: связывает sync и UI
// ============================================

import { getSyncEngine } from './syncEngine'
import { useStore } from '../store'

const SYNC_INTERVAL = 10 * 60 * 1000 // 10 минут

let isStarted = false

// ==========================================
// 🔥 Единственное место, где sync знает про store
// ==========================================
export const startSync = () => {
  if (isStarted) return
  isStarted = true

  // Создаём engine с callback для обновления UI
  const engine = getSyncEngine(() => {
    console.log('🔄 UI refresh triggered by sync')
    useStore.getState().loadBooks()
  })

  // Синхронизация при старте
  engine.syncNow()

  // Периодическая синхронизация
  setInterval(() => {
    engine.syncNow()
  }, SYNC_INTERVAL)

  console.log('🔄 Sync orchestrator started')
}

// ==========================================
// 🔥 Ручной запуск синхронизации (из UI)
// ==========================================
export const syncNow = () => {
  const engine = getSyncEngine()
  engine.syncNow()
}