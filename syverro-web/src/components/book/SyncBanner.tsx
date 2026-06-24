// src/components/SyncBanner.tsx

import { useState } from 'react'
import { useOffline } from '@/lib/offline'

interface SyncBannerProps {
  count: number
}

export function SyncBanner({ count }: SyncBannerProps) {
  const { sync } = useOffline()
  const [isSyncing, setIsSyncing] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  const handleSync = async () => {
    setIsSyncing(true)
    await sync()
    setIsSyncing(false)
  }

  if (!isVisible) return null

  return (
    <div className="sync-banner">
      <div className="sync-banner-content">
        <span className="sync-banner-icon">📤</span>
        <span className="sync-banner-text">
          {count} {count === 1 ? 'событие' : 'событий'} ждут синхронизации
          {isSyncing && <span className="sync-spinner" />}
        </span>
        <button 
          className="sync-banner-button" 
          onClick={handleSync}
          disabled={isSyncing}
        >
          {isSyncing ? '⏳' : '📤 Синхронизировать'}
        </button>
        <button 
          className="sync-banner-close" 
          onClick={() => setIsVisible(false)}
          aria-label="Закрыть"
        >
          ✕
        </button>
      </div>
    </div>
  )
}