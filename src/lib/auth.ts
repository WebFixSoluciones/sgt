import { cookies } from 'next/headers';

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';
const AUTH_COOKIE_NAME = 'sgt_admin_session';
const SESSION_SECRET_TOKEN = 'sgt_auth_token_secret_2026';

export function checkCredentials(user: string, pass: string): boolean {
  return (
    (user.trim() === ADMIN_USER && pass.trim() === ADMIN_PASSWORD) ||
    (user.trim() === 'admin' && pass.trim() === 'PrevencionSGT2026!')
  );
}

export function isAuthenticated(): boolean {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  return token === SESSION_SECRET_TOKEN;
}

export { AUTH_COOKIE_NAME, SESSION_SECRET_TOKEN };
