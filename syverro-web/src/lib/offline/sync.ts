// src/lib/offline/sync.ts

import { getUnsyncedEvents, markEventsAsSynced, setLastSyncTime } from './store';
import { SyncResponse } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export async function syncLocalEvents(token?: string | null): Promise<SyncResponse> {
  const events = getUnsyncedEvents();

  if (events.length === 0) {
    console.log('✅ [Sync] Нет событий для синхронизации');
    return { success: true, syncedCount: 0 };
  }

  console.log(`📤 [Sync] Отправка ${events.length} событий...`);

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/events/sync`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ events }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [Sync] Ошибка синхронизации:', errorText);
      return {
        success: false,
        syncedCount: 0,
        errors: [`HTTP ${response.status}: ${errorText}`],
      };
    }

    const result = await response.json();

    const eventIds = events.map(e => e.id);
    markEventsAsSynced(eventIds);
    setLastSyncTime(new Date().toISOString());

    console.log(`✅ [Sync] Синхронизировано ${result.syncedCount || events.length} событий`);

    return {
      success: true,
      syncedCount: result.syncedCount || events.length,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    console.error('❌ [Sync] Ошибка соединения:', errorMessage);
    return {
      success: false,
      syncedCount: 0,
      errors: [errorMessage],
    };
  }
}

// Фоновый авто-синк с задержкой
let syncTimeout: ReturnType<typeof setTimeout> | null = null;

export function scheduleSync(delayMs: number = 5000): void {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }

  syncTimeout = setTimeout(() => {
    syncLocalEvents();
    syncTimeout = null;
  }, delayMs);
}

// Синхронизация при выходе из страницы (ПРИНИМАЕТ ТОКЕН)
export function setupSyncOnUnload(token?: string | null): void {
  const handleUnload = () => {
    const events = getUnsyncedEvents();
    if (events.length > 0) {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Используем fetch с keepalive для отправки перед закрытием
      fetch(`${apiUrl}/events/sync`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ events }),
        keepalive: true,
      }).catch(() => {
        // Игнорируем ошибки при закрытии
      });
    }
  };

  window.addEventListener('beforeunload', handleUnload);
}