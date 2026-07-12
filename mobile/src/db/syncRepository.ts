import { db } from './database'

export const getSyncRepository = () => ({
  getDeviceId: async (): Promise<string> => {
    const result = await db.getFirstAsync<{ device_id: string }>(
      `SELECT device_id FROM sync_state WHERE id = 1`
    )

    if (result) return result.device_id

    const newId = `device_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    await db.runAsync(
      `INSERT INTO sync_state (id, device_id, updated_at) VALUES (1, ?, ?)`,
      [newId, Date.now()]
    )
    return newId
  },

  getCursor: async (): Promise<string | null> => {
    const result = await db.getFirstAsync<{ last_cursor: string | null }>(
      `SELECT last_cursor FROM sync_state WHERE id = 1`
    )
    return result?.last_cursor || null
  },

  saveCursor: async (cursor: string) => {
    await db.runAsync(
      `UPDATE sync_state SET last_cursor = ?, last_sync_at = ?, updated_at = ?
       WHERE id = 1`,
      [cursor, Date.now(), Date.now()]
    )
  },
})