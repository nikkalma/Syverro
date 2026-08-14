import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from './authStore';
import { clearLegacyAuthTokens } from '../shared/api/client';

describe('auth token storage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
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
});
