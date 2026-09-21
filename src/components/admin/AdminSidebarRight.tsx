'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  FileSpreadsheet,
  Layers,
  UserCheck,
  LogOut,
  ShieldCheck,
  FileText,
  Activity,
  Moon,
  Menu,
  X,
  ChevronRight,
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
    if (href === '/admin' && (pathname === '/admin' || pathname.startsWith('/admin/evaluaciones'))) {
      return true;
    }
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between">
      {/* Upper Area */}
      <div className="space-y-6">
        {/* Admin Profile Box (Dropbox Style) */}
        <div className="p-3 bg-[#f8fafc] border border-slate-200 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#0061fe] text-white font-bold flex items-center justify-center text-sm shadow-xs">
            AD
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-slate-900 truncate">Administrador SGT</div>
            <div className="text-[11px] text-slate-500 truncate">admin@prevencionsgt.com</div>
          </div>
          <button
            onClick={handleLogout}
            title="Cerrar Sesión"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Section: Navegación Principal */}
        <div className="space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Navegación
          </div>

          <Link
            href="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className={`w-full ${isActive('/admin') ? 'dropbox-nav-item-active' : 'dropbox-nav-item'}`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="flex-1">Formularios y Evaluaciones</span>
          </Link>

          <Link
            href="/admin/formularios/nuevo"
            onClick={() => setMobileMenuOpen(false)}
            className={`w-full ${isActive('/admin/formularios/nuevo') ? 'dropbox-nav-item-active' : 'dropbox-nav-item'}`}
          >
            <PlusCircle className="w-4 h-4" />
            <span className="flex-1">Nuevo Formulario</span>
          </Link>

          <Link
            href="/evaluar"
            target="_blank"
            className="w-full dropbox-nav-item text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
          >
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span className="flex-1">Portal Trabajador</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>
        </div>

        {/* Section: Plantillas Maestras */}
        <div className="space-y-1 pt-2 border-t border-slate-100">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Plantillas Oficiales
          </div>

          <Link
            href="/admin/formularios/form-fpsico-40"
            onClick={() => setMobileMenuOpen(false)}
            className="w-full dropbox-nav-item group"
          >
            <ShieldCheck className="w-4 h-4 text-blue-600 group-hover:scale-105 transition-transform" />
            <div className="flex-1 min-w-0">
              <div className="truncate font-medium">FPSICO 4.0 INSST</div>
              <div className="text-[10px] text-slate-400">89 preguntas oficiales</div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          </Link>

          <Link
            href="/admin/formularios/form-lips-60"
            onClick={() => setMobileMenuOpen(false)}
            className="w-full dropbox-nav-item group"
          >
            <FileText className="w-4 h-4 text-purple-600 group-hover:scale-105 transition-transform" />
            <div className="flex-1 min-w-0">
              <div className="truncate font-medium">Cuestionario LIPS-60</div>
              <div className="text-[10px] text-slate-400">60 preguntas (0 y 1)</div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          </Link>

          <Link
            href="/admin/formularios/form-estres-laboral"
            onClick={() => setMobileMenuOpen(false)}
            className="w-full dropbox-nav-item group"
          >
            <Activity className="w-4 h-4 text-amber-600 group-hover:scale-105 transition-transform" />
            <div className="flex-1 min-w-0">
              <div className="truncate font-medium">Test de Estrés Laboral</div>
              <div className="text-[10px] text-slate-400">12 síntomas (escala 1-6)</div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          </Link>

          <Link
            href="/admin/formularios/form-trabajo-nocturno"
            onClick={() => setMobileMenuOpen(false)}
            className="w-full dropbox-nav-item group"
          >
            <Moon className="w-4 h-4 text-indigo-600 group-hover:scale-105 transition-transform" />
            <div className="flex-1 min-w-0">
              <div className="truncate font-medium">Trabajo Nocturno</div>
              <div className="text-[10px] text-slate-400">Turnos y adaptación</div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          </Link>
        </div>

        {/* Section: Baterías y Grupos */}
        <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Encuestas en Grupo</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Permite enlazar evaluaciones para que el trabajador pase automáticamente de una encuesta a otra sin reingresar su código.
          </p>
        </div>
      </div>

      {/* Footer Area */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <button
          onClick={handleLogout}
          className="w-full py-2 px-3 border border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-600 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Cerrar Sesión</span>
        </button>

        <div className="text-[10px] text-center text-slate-400">
          SGT Corp. Prevención S.A. © 2026
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Bar for Admin */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 h-16 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="flex items-center gap-3">
            <img
              src="/logo-sgt.jpg"
              alt="Prevención SGT"
              className="h-10 w-auto object-contain"
            />
            <div className="hidden sm:flex flex-col border-l border-slate-200 pl-3">
              <span className="text-xs font-bold text-slate-900 tracking-tight">SGT Prevención</span>
              <span className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">
                Administrador
              </span>
            </div>
          </Link>
        </div>

        {/* Right Header: Quick buttons + Mobile Menu Toggle */}
        <div className="flex items-center gap-2">
          <Link
            href="/admin/formularios/nuevo"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0061fe] hover:bg-[#0052d9] text-white text-xs font-medium rounded-lg transition-colors shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Crear Formulario</span>
          </Link>

          {/* Mobile right sidebar drawer toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Body with Content on Left/Center and Dropbox Sidebar on the Right */}
      <div className="flex-1 flex w-full">
        {/* Main Content Area */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          {children}
        </main>

        {/* Dropbox-style Sidebar on the Right (Desktop) */}
        <aside className="w-72 bg-white border-l border-slate-200 p-5 shrink-0 hidden lg:block sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto shadow-xs">
          {sidebarContent}
        </aside>

        {/* Mobile Right Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden bg-black/40 backdrop-blur-xs flex justify-end">
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
      </div>
    </div>
  );
}
