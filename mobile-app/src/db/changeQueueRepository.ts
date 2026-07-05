import { db } from './database'
import type { Change } from '../sync/syncTypes'

export const getChangeQueueRepository = () => ({
  add: async (change: Change) => {
    await db.runAsync(
      `INSERT INTO change_queue (op_id, entity, entity_id, operation, payload, status, created_at, device_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        change.op_id,
        change.entity,
        change.entity_id,
        change.operation,
        JSON.stringify(change.payload),
        'pending',
        change.timestamp,
        change.device_id,
      ]
    )
  },

  getPending: async (): Promise<Change[]> => {
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM change_queue WHERE status = 'pending' OR status = 'failed'
       ORDER BY created_at ASC`
    )
    return rows.map((row: any) => ({
      ...row,
      payload: JSON.parse(row.payload),
    }))
  },

  markSent: async (op_ids: string[]) => {
    if (op_ids.length === 0) return
    const placeholders = op_ids.map(() => '?').join(',')
    await db.runAsync(
      `UPDATE change_queue SET status = 'sent' WHERE op_id IN (${placeholders})`,
      op_ids
    )
  },

  markConfirmed: async (op_ids: string[]) => {
    if (op_ids.length === 0) return
    const placeholders = op_ids.map(() => '?').join(',')
    await db.runAsync(
      `DELETE FROM change_queue WHERE op_id IN (${placeholders})`,
      op_ids
    )
  },

  markFailed: async (op_ids: string[]) => {
    if (op_ids.length === 0) return
    const placeholders = op_ids.map(() => '?').join(',')
    await db.runAsync(
      `UPDATE change_queue SET status = 'failed', retry_count = retry_count + 1
       WHERE op_id IN (${placeholders})`,
      op_ids
    )
  },
})