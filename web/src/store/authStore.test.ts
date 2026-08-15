import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from './authStore';
import { clearLegacyAuthTokens } from '../shared/api/client';

describe('auth token storage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false });
  });

  it('does not persist access or refresh tokens in JavaScript storage', () => {
    useAuthStore.getState().setAuth(
      'access-secret',
      { id: 'user-1', email: 'reader@example.com', created_at: '2026-01-01' },
      'refresh-secret',
    );

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(localStorage.getItem('user')).not.toContain('access-secret');
    expect(localStorage.getItem('user')).not.toContain('refresh-secret');
  });

  it('removes tokens left by earlier web releases', () => {
    localStorage.setItem('token', 'legacy-access');
    localStorage.setItem('refresh_token', 'legacy-refresh');

    clearLegacyAuthTokens();

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });

  it('creates a cookie session from signed Telegram data without storing tokens', async () => {
    const telegramPayload = {
      id: 123,
      first_name: 'Ada',
      auth_date: 1_800_000_000,
      hash: 'signed-hash',
    };
    const user = { id: 'user-telegram', email: 'telegram-123@users.invalid', created_at: '2026-01-01' };
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('{}', { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(user), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }));

    await useAuthStore.getState().telegramLogin(telegramPayload);

    expect(fetchMock).toHaveBeenNthCalledWith(1, expect.stringContaining('/auth/telegram'), expect.objectContaining({
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify(telegramPayload),
    }));
    expect(useAuthStore.getState().user).toEqual(user);
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });

  it('does not expose structured API errors as [object Object]', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify({
      detail: [{ loc: ['body', 'id'], msg: 'Invalid value' }],
    }), {
      status: 422,
      headers: { 'Content-Type': 'application/json' },
    }));

    await expect(useAuthStore.getState().telegramLogin({
      id: 123,
      first_name: 'Ada',
      auth_date: 1_800_000_000,
      hash: 'signed-hash',
    })).rejects.toThrow('Ошибка входа через Telegram');
  });
});
