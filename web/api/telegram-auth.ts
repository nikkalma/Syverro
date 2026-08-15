interface ApiRequest {
  method?: string;
  body?: unknown;
}

interface ApiResponse {
  setHeader(name: string, value: string | string[]): void;
  status(code: number): ApiResponse;
  json(body: unknown): void;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
}

const BACKEND_URL = 'https://api.syverro.com';

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ detail: 'Method not allowed' });
  }

  try {
    const authResponse = await fetch(`${BACKEND_URL}/auth/telegram`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request.body),
    });
    const authBody = await authResponse.json();

    if (!authResponse.ok) {
      return response.status(authResponse.status).json(authBody);
    }

    const tokens = authBody as TokenResponse;
    const userResponse = await fetch(`${BACKEND_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!userResponse.ok) {
      return response.status(502).json({ detail: 'Unable to establish session' });
    }

    const domain = 'Domain=syverro.com';
    const common = `${domain}; HttpOnly; Secure; SameSite=Strict`;
    response.setHeader('Set-Cookie', [
      `syverro_access=${tokens.access_token}; Max-Age=1800; Path=/; ${common}`,
      `syverro_refresh=${tokens.refresh_token}; Max-Age=2592000; Path=/auth; ${common}`,
    ]);
    response.setHeader('Cache-Control', 'private, no-store');
    return response.status(200).json(await userResponse.json());
  } catch {
    return response.status(502).json({ detail: 'Telegram authentication unavailable' });
  }
}
