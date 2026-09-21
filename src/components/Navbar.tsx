'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClipboardList, LayoutDashboard, UserCheck, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const isCurrent = (path: string) => {
    if (path === '/admin' && (pathname === '/admin' || pathname.startsWith('/admin/evaluaciones'))) {
      return true;
    }
    return pathname.startsWith(path);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2 text-slate-900 font-bold text-lg tracking-tight">
              <div className="w-8 h-8 rounded bg-blue-600 text-white flex items-center justify-center font-black text-base shadow-sm">
                S
              </div>
              <div className="flex flex-col">
                <span className="leading-tight text-slate-900">SGT Prevención</span>
                <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                  Gestor de Evaluaciones
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/admin"
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1.5 ${
                isCurrent('/admin')
                  ? 'bg-slate-100 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Formularios</span>
            </Link>

            <Link
              href="/admin/formularios/nuevo"
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1.5 ${
                pathname.startsWith('/admin/formularios')
                  ? 'bg-slate-100 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>Constructor</span>
            </Link>

            <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block"></div>

            <Link
              href="/evaluar"
              className="px-3 py-1.5 rounded text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1.5"
            >
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Portal Trabajador</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
