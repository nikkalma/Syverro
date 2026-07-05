import { Change, SyncState } from './syncTypes'

let memoryQueue: (Change & { status: SyncState; created_at: number })[] = []

export const changeQueue = {
  add: async (change: Change) => {
    memoryQueue.push({
      ...change,
      status: 'pending',
      created_at: Date.now(),
      retry_count: 0,
    })
  },

  getPending: async (): Promise<Change[]> => {
    return memoryQueue
      .filter(i => i.status === 'pending' || i.status === 'failed')
      .map(({ status, created_at, ...c }) => c)
  },

  markSent: async (ids: string[]) => {
    memoryQueue = memoryQueue.map(i =>
      ids.includes(i.op_id) ? { ...i, status: 'sent' } : i
    )
  },

  markConfirmed: async (ids: string[]) => {
    memoryQueue = memoryQueue.filter(i => !ids.includes(i.op_id))
  },

  markFailed: async (ids: string[]) => {
    memoryQueue = memoryQueue.map(i =>
      ids.includes(i.op_id)
        ? { ...i, status: 'failed', retry_count: (i.retry_count || 0) + 1 }
        : i
    )
  },

  clear: async () => {
    memoryQueue = []
  },
}