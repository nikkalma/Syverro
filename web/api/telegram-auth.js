const BACKEND_URL = 'https://api.syverro.com';

export default async function handler(request, response) {
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

    const domain = 'Domain=syverro.com';
    const common = `${domain}; HttpOnly; Secure; SameSite=Strict`;
    response.setHeader('Set-Cookie', [
      `syverro_access=${authBody.access_token}; Max-Age=1800; Path=/; ${common}`,
      `syverro_refresh=${authBody.refresh_token}; Max-Age=2592000; Path=/auth; ${common}`,
    ]);
    response.setHeader('Cache-Control', 'private, no-store');
    return response.status(200).json(authBody.user);
  } catch {
    return response.status(502).json({ detail: 'Telegram authentication unavailable' });
  }
}
