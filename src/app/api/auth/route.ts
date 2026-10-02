import { NextRequest, NextResponse } from 'next/server';
import { checkCredentials, AUTH_COOKIE_NAME, SESSION_SECRET_TOKEN } from '@/lib/auth';
import { updateAdminPassword } from '@/lib/storage';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, username, password, currentPassword, newPassword } = body;

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

      const isValid = await checkCredentials(username, password);
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

    if (action === 'change-password') {
      const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
      if (token !== SESSION_SECRET_TOKEN) {
        return NextResponse.json(
          { success: false, error: 'Sesión no autorizada para cambiar contraseña' },
          { status: 401 }
        );
      }

      if (!currentPassword || !newPassword) {
        return NextResponse.json(
          { success: false, error: 'Debe ingresar la contraseña actual y la nueva contraseña' },
          { status: 400 }
        );
      }

      if (typeof newPassword !== 'string' || newPassword.trim().length < 6) {
        return NextResponse.json(
          { success: false, error: 'La nueva contraseña debe tener al menos 6 caracteres' },
          { status: 400 }
        );
      }

      // Validar contraseña actual (contra usuario 'admin' o configurable)
      const isCurrentValid = await checkCredentials('admin', currentPassword);
      if (!isCurrentValid) {
        return NextResponse.json(
          { success: false, error: 'La contraseña actual ingresada es incorrecta' },
          { status: 400 }
        );
      }

      await updateAdminPassword(newPassword.trim(), 'admin');

      return NextResponse.json({
        success: true,
        message: 'Contraseña actualizada correctamente',
      });
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
