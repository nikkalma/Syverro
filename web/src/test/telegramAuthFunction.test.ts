import { afterEach, describe, expect, it, vi } from 'vitest';

import handler from '../../api/telegram-auth';

class TestResponse {
  headers = new Map<string, string | string[]>();
  statusCode = 200;
  body: unknown;

  setHeader(name: string, value: string | string[]) {
    this.headers.set(name, value);
  }

  status(code: number) {
    this.statusCode = code;
    return this;
  }

  json(body: unknown) {
    this.body = body;
  }
}

describe('Telegram auth function', () => {
  afterEach(() => vi.restoreAllMocks());

  it('sets protected same-domain cookies and returns only the user', async () => {
    const user = { id: 'user-1', email: 'telegram-1@users.invalid' };
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({
        access_token: 'access-secret',
        refresh_token: 'refresh-secret',
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(user), { status: 200 }));
    const response = new TestResponse();

    await handler({ method: 'POST', body: { id: 1 } }, response);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(user);
    expect(JSON.stringify(response.body)).not.toContain('secret');
    const cookies = response.headers.get('Set-Cookie') as string[];
    expect(cookies).toHaveLength(2);
    expect(cookies.every((cookie) => (
      cookie.includes('Domain=syverro.com')
      && cookie.includes('HttpOnly')
      && cookie.includes('Secure')
      && cookie.includes('SameSite=Strict')
    ))).toBe(true);
  });

  it('does not set cookies when backend authentication fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(
      JSON.stringify({ detail: 'Invalid authentication' }),
      { status: 401 },
    ));
    const response = new TestResponse();

    await handler({ method: 'POST', body: { id: 1 } }, response);

    expect(response.statusCode).toBe(401);
    expect(response.headers.has('Set-Cookie')).toBe(false);
  });
});
