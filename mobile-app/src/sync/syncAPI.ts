import { PushRequest, PushResponse, PullRequest, PullResponse } from './syncTypes'

const API_BASE = 'http://localhost:3000'

export const syncAPI = {
  push: async (req: PushRequest): Promise<PushResponse> => {
    return {
      applied: req.changes.map(c => ({
        entity_id: c.entity_id,
        version: 1,
      })),
      conflicts: [],
      sync_cursor: `cursor_${Date.now()}`,
    }
  },

  pull: async (req: PullRequest): Promise<PullResponse> => {
    return {
      updated: [],
      deleted: [],
      sync_cursor: `cursor_${Date.now()}`,
    }
  },
}
