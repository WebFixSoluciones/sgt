'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, ArrowRight, LayoutDashboard, KeyRound, Building2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [evalCode, setEvalCode] = useState('');
  const [error, setError] = useState('');

  const handleAccess = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = evalCode.trim().toUpperCase();
    if (!clean) {
      setError('Por favor ingrese un código de evaluación');
      return;
    }
    router.push(`/evaluar/${clean}`);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md space-y-6 text-center">
        {/* Header Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Prevención de Riesgos Laborales</span>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            SGT Evaluaciones
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Sistema seguro para la realización de cuestionarios y evaluaciones de salud y prevención en el trabajo.
          </p>
        </div>

        {/* Worker Access Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 text-left shadow-sm">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Acceso del Trabajador</h2>
              <p className="text-xs text-slate-500">Ingrese el código de evaluación asignado por su empresa</p>
            </div>
          </div>

          <form onSubmit={handleAccess} className="space-y-4">
            <div>
              <label htmlFor="evalCode" className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1">
                Código de Evaluación
              </label>
              <input
                id="evalCode"
                type="text"
                value={evalCode}
                onChange={(e) => {
                  setEvalCode(e.target.value);
                  setError('');
                }}
                placeholder="Ej. CHAIDE-PSI-2026"
                className="w-full px-3 py-2 border border-slate-300 rounded text-sm text-slate-900 uppercase font-mono tracking-wider focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
              {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded text-sm transition-colors duration-150 flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Ingresar a la Evaluación</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Links */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">
              Códigos de prueba activos:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {['CHAIDE-PSI-2026', 'CHAIDE-ESTRES-2026', 'CHAIDE-LIPS-2026'].map((demoCode) => (
                <button
                  key={demoCode}
                  type="button"
                  onClick={() => setEvalCode(demoCode)}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs font-mono text-slate-700 transition-colors"
                >
                  {demoCode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Admin Link */}
        <div className="pt-2">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-blue-600 transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Acceder al Panel de Administración</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
