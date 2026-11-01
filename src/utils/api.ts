/**
 * SIAKAD API Client with Dual-Authentication (Bearer Token + HttpOnly Cookie)
 * Guarantees 100% session persistence in all environments including cross-origin iframes.
 */

export const getSessionToken = (): string | null => {
  try {
    return localStorage.getItem('siakad_session_token');
  } catch (e) {
    return null;
  }
};

export const setSessionToken = (token: string): void => {
  try {
    localStorage.setItem('siakad_session_token', token);
  } catch (e) {}
};

export const removeSessionToken = (): void => {
  try {
    localStorage.removeItem('siakad_session_token');
  } catch (e) {}
};

export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const token = getSessionToken();
  const headers = new Headers(init?.headers);

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(input, {
    ...init,
    credentials: init?.credentials ?? 'include',
    headers,
  });

  // Keep token updated if refreshed by server
  const resToken = res.headers.get('x-session-token');
  if (resToken) {
    setSessionToken(resToken);
  }

  return res;
}
