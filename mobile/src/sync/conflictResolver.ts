export interface Conflict {
  entity_id: string
  client_state: any
  server_state: any
  client_timestamp: number
  server_timestamp: number
}

export interface Resolution {
  entity_id: string
  winner: 'client' | 'server'
  resolved_state: any
}

export const conflictResolver = {
  resolve(conflict: Conflict): Resolution {
    const { entity_id, client_state, server_state, client_timestamp, server_timestamp } = conflict

    if (client_timestamp > server_timestamp) {
      return {
        entity_id,
        winner: 'client',
        resolved_state: client_state,
      }
    }

    return {
      entity_id,
      winner: 'server',
      resolved_state: server_state,
    }
  },
}
