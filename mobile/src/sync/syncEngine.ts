// ============================================
// SYVERRO — SYNC ENGINE v6 (clean layer)
// ============================================

import { Change } from './syncTypes'
import { syncAPI } from './syncAPI'
import { getChangeQueueRepository } from '../db/changeQueueRepository'
import { getSyncRepository } from '../db/syncRepository'
import { bookRepository } from '../db/bookRepository'
import { conflictResolver } from './conflictResolver'

const changeQueueRepo = getChangeQueueRepository()
const syncRepo = getSyncRepository()

export class SyncEngine {
  private isSyncing = false
  private timer: ReturnType<typeof setTimeout> | null = null
  private onSyncComplete?: () => void  // 🔥 callback, не зависимость

  // ==========================================
  // 🔥 Конструктор принимает callback
  // ==========================================
  constructor(onSyncComplete?: () => void) {
    this.onSyncComplete = onSyncComplete
  }

  // ==========================================
  // PUBLIC
  // ==========================================
  async onLocalChange(change: Omit<Change, 'op_id' | 'timestamp' | 'device_id'>) {
    const deviceId = await syncRepo.getDeviceId()

    const full: Change = {
      ...change,
      op_id: crypto.randomUUID?.() || `op_${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      device_id: deviceId,
    }

    await changeQueueRepo.add(full)
    this.schedule()
  }

  async syncNow() {
    await this.sync()
  }

  private schedule() {
    if (this.timer) clearTimeout(this.timer)
    this.timer = setTimeout(() => this.sync(), 100)
  }

  // ==========================================
  // PRIVATE: PUSH
  // ==========================================
  private async push() {
    const pending = await changeQueueRepo.getPending()
    if (pending.length === 0) return

    console.log(`📤 Pushing ${pending.length} changes...`)

    const response = await syncAPI.push({
      device_id: await syncRepo.getDeviceId(),
      changes: pending,
    })

    const opIds = pending.map((c) => c.op_id)

    await changeQueueRepo.markSent(opIds)

    if (response.conflicts?.length > 0) {
      for (const conflict of response.conflicts) {
        const resolution = conflictResolver.resolve({
          entity_id: conflict.entity_id,
          client_state: null,
          server_state: conflict.server_state,
          client_timestamp: 0,
          server_timestamp: conflict.server_state?.updated_at || 0,
        })

        if (resolution.winner === 'server') {
await (bookRepository as any).applyServerState(resolution.resolved_state)        }
      }
    }

    await changeQueueRepo.markConfirmed(opIds)
    await syncRepo.saveCursor(response.sync_cursor)

    console.log(`📊 Push: ${response.applied.length} applied`)
  }

  // ==========================================
  // PRIVATE: PULL
  // ==========================================
  private async pull() {
    const cursor = await syncRepo.getCursor()
    const deviceId = await syncRepo.getDeviceId()

    const response = await syncAPI.pull({
      cursor,
      device_id: deviceId,
    })

    if (response.updated.length === 0 && response.deleted.length === 0) {
      return
    }

    console.log(`📥 Pulled ${response.updated.length} updates`)

    for (const updated of response.updated) {
await (bookRepository as any).applyServerState(updated)
    }

    for (const deleted of response.deleted) {
      await bookRepository.delete(deleted.entity_id)
    }

    await syncRepo.saveCursor(response.sync_cursor)

    console.log(`📊 Pull: ${response.updated.length} updated, ${response.deleted.length} deleted`)
  }

  // ==========================================
  // PRIVATE: SYNC
  // ==========================================
  private async sync() {
    if (this.isSyncing) return
    if (typeof navigator !== 'undefined' && !navigator.onLine) return

    this.isSyncing = true
    console.log('🔄 SYNC STARTED')

    try {
      await this.push()
      await this.pull()
      console.log('✅ SYNC COMPLETED')

      // 🔥 Вызываем callback (если есть)
      this.onSyncComplete?.()
    } catch (error) {
      console.error('❌ SYNC FAILED:', error)
    } finally {
      this.isSyncing = false
    }
  }
}

// ==========================================
// SINGLETON (с поддержкой callback)
// ==========================================
let instance: SyncEngine | null = null

export const getSyncEngine = (onSyncComplete?: () => void): SyncEngine => {
  if (!instance) {
    instance = new SyncEngine(onSyncComplete)
  }
  return instance
}