import { useState } from 'react'
import { useOffline } from '@/lib/offline'

interface SyncBannerProps {
  count: number
}

export function SyncBanner({ count }: SyncBannerProps) {
  const { sync } = useOffline()
  const [isSyncing, setIsSyncing] = useState(false)

  const handleSync = async () => {
    setIsSyncing(true)
    await sync()
    setIsSyncing(false)
  }

  return (
    <div className="sync-banner">
      <div className="sync-banner-content">
        <span>📤</span>
        <span>{count} событий ждут синхронизации</span>
        <button onClick={handleSync} disabled={isSyncing}>
          {isSyncing ? '⏳' : 'Синхронизировать'}
        </button>
      </div>
    </div>
  )
}