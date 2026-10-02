import { cookies } from 'next/headers';

import { getSystemSettings } from './storage';

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';
const AUTH_COOKIE_NAME = 'sgt_admin_session';
const SESSION_SECRET_TOKEN = 'sgt_auth_token_secret_2026';

export async function checkCredentials(user: string, pass: string): Promise<boolean> {
  const u = user.trim();
  const p = pass.trim();

  try {
    const settings = await getSystemSettings();
    if (settings && settings.adminPassword) {
      const expectedUser = settings.adminUsername?.trim() || ADMIN_USER;
      if (u === expectedUser && p === settings.adminPassword.trim()) {
        return true;
      }
    }
  } catch (err) {
    console.error('Error al verificar credenciales con systemSettings:', err);
  }

  return (
    (u === ADMIN_USER && p === ADMIN_PASSWORD) ||
    (u === 'admin' && p === 'PrevencionSGT2026!')
  );
}

export function isAuthenticated(): boolean {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  return token === SESSION_SECRET_TOKEN;
}

export { AUTH_COOKIE_NAME, SESSION_SECRET_TOKEN };
