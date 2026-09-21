import { NextRequest, NextResponse } from 'next/server';
import { checkCredentials, AUTH_COOKIE_NAME, SESSION_SECRET_TOKEN } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, username, password } = body;

    if (action === 'logout') {
      const response = NextResponse.json({ success: true, message: 'Sesión cerrada correctamente' });
      response.cookies.delete(AUTH_COOKIE_NAME);
      return response;
    }

    if (action === 'login') {
      if (!username || !password) {
        return NextResponse.json(
          { success: false, error: 'Usuario y contraseña requeridos' },
          { status: 400 }
        );
      }

      const isValid = checkCredentials(username, password);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: 'Usuario o contraseña incorrectos' },
          { status: 401 }
        );
      }

      const response = NextResponse.json({
        success: true,
        message: 'Autenticación exitosa',
      });

      // Set cookie for 7 days
      response.cookies.set({
        name: AUTH_COOKIE_NAME,
        value: SESSION_SECRET_TOKEN,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });

      return response;
    }

    return NextResponse.json({ success: false, error: 'Acción no válida' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isAuth = token === SESSION_SECRET_TOKEN;
  return NextResponse.json({ authenticated: isAuth });
}
