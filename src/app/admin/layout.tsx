import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AUTH_COOKIE_NAME, SESSION_SECRET_TOKEN } from '@/lib/auth';
import AdminSidebarRight from '@/components/admin/AdminSidebarRight';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const isAuth = token === SESSION_SECRET_TOKEN;

  // If not authenticated, allow viewing login page; otherwise redirect to /admin/login
  // Next.js App router: we can check in layout or redirect
  // Note: if user is on /admin/login, we must not redirect in a loop.
  // We handle this cleanly by wrapping only protected admin pages or checking path.

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col">
      <AdminSidebarRight isAuth={isAuth}>
        {children}
      </AdminSidebarRight>
    </div>
  );
}
