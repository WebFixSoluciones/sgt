'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  BarChart3,
  UserCheck,
  LogOut,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';

interface AdminSidebarRightProps {
  children: React.ReactNode;
  isAuth: boolean;
}

export default function AdminSidebarRight({ children, isAuth }: AdminSidebarRightProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLoginPage = pathname === '/admin/login';

  // Client-side authentication guard
  useEffect(() => {
    if (!isLoginPage && !isAuth) {
      router.push('/admin/login');
    }
  }, [isLoginPage, isAuth, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!isAuth) {
    return null; // Prevents flashing protected content before redirect
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
      router.push('/admin/login');
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between">
      {/* Upper Area */}
      <div className="space-y-6">
        {/* Navigation Section */}
        <div className="space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Plataforma SGT
          </div>

          <Link
            href="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className={`w-full ${isActive('/admin') ? 'dropbox-nav-item-active' : 'dropbox-nav-item'}`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="flex-1">Inicio</span>
          </Link>

          <Link
            href="/admin/evaluaciones"
            onClick={() => setMobileMenuOpen(false)}
            className={`w-full ${isActive('/admin/evaluaciones') ? 'dropbox-nav-item-active' : 'dropbox-nav-item'}`}
          >
            <ClipboardList className="w-4 h-4" />
            <span className="flex-1">Evaluaciones</span>
          </Link>

          <Link
            href="/admin/formularios"
            onClick={() => setMobileMenuOpen(false)}
            className={`w-full ${isActive('/admin/formularios') ? 'dropbox-nav-item-active' : 'dropbox-nav-item'}`}
          >
            <FileText className="w-4 h-4" />
            <span className="flex-1">Formularios (Plantillas)</span>
          </Link>

          <Link
            href="/admin/resultados"
            onClick={() => setMobileMenuOpen(false)}
            className={`w-full ${isActive('/admin/resultados') ? 'dropbox-nav-item-active' : 'dropbox-nav-item'}`}
          >
            <BarChart3 className="w-4 h-4" />
            <span className="flex-1">Resultados e Informes</span>
          </Link>

          <div className="pt-3 pb-1 px-3">
            <div className="h-px bg-slate-100" />
          </div>

          <Link
            href="/evaluar"
            target="_blank"
            className="w-full dropbox-nav-item text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
          >
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span className="flex-1">Portal Trabajador</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* Footer Area */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <button
          onClick={handleLogout}
          className="w-full py-2.5 px-3 border border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-600 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2 shadow-2xs"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Cerrar Sesión</span>
        </button>

        <div className="text-[10px] text-center text-slate-400 font-medium">
          Sistema de Evaluaciones | desarrollado por{" "}
          <a
            href="https://webfixsoluciones.net"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-600 hover:underline transition-colors"
          >
            Web FiX Soluciones
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Bar for Admin */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          {/* Mobile left sidebar drawer toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/admin" className="flex items-center">
            <img
              src="/logo-sgt.jpg"
              alt="Prevención SGT"
              className="h-10 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Right Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/evaluar"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Ver Portal</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>
        </div>
      </header>

      {/* Main Body with Dropbox Sidebar on the Left and Content on the Right */}
      <div className="flex-1 flex w-full">
        {/* Dropbox-style Sidebar on the Left (Desktop) */}
        <aside className="w-72 bg-white border-r border-slate-200 p-5 shrink-0 hidden lg:block sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto shadow-xs">
          {sidebarContent}
        </aside>

        {/* Mobile Left Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden bg-black/40 backdrop-blur-xs flex justify-start animate-fade-in-slide">
            <div className="w-72 bg-white h-full p-5 shadow-2xl overflow-y-auto">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">Menú Administrador</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {sidebarContent}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 overflow-y-auto flex flex-col justify-between">
          <div className="flex-1">
            {children}
          </div>
          <footer className="py-3 px-6 border-t border-slate-100 bg-white/50 text-center text-[11px] text-slate-400 print:hidden">
            Sistema de Evaluaciones | desarrollado por{" "}
            <a
              href="https://webfixsoluciones.net"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-600 hover:underline transition-colors"
            >
              Web FiX Soluciones
            </a>
          </footer>
        </main>
      </div>
    </div>
  );
}
