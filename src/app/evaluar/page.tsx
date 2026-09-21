'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Lock } from 'lucide-react';

export default function EvaluacionesIndexPage() {
  const router = useRouter();
  const [evalCode, setEvalCode] = useState('');
  const [error, setError] = useState('');

  const handleAccess = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = evalCode.trim().toUpperCase();
    if (!clean) {
      setError('Por favor ingrese su código de evaluación');
      return;
    }
    router.push(`/evaluar/${clean}`);
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col items-center justify-between p-6">
      <div className="w-full h-8" />

      <div className="w-full max-w-sm flex flex-col items-center text-center space-y-8">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <img
            src="/logo-sgt.jpg"
            alt="SGT Corp. Prevención S.A."
            className="h-16 sm:h-20 w-auto object-contain"
          />
        </div>

        <div className="w-full space-y-4 text-left">
          <div className="text-center space-y-1">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Ingrese su código de evaluación
            </h1>
            <p className="text-xs text-slate-500">
              Cuestionario de prevención de riesgos laborales
            </p>
          </div>

          <form onSubmit={handleAccess} className="space-y-3 pt-2">
            <div>
              <input
                type="text"
                required
                autoFocus
                value={evalCode}
                onChange={(e) => {
                  setEvalCode(e.target.value);
                  setError('');
                }}
                placeholder="CÓDIGO DE EVALUACIÓN"
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-center text-sm sm:text-base text-slate-900 uppercase font-mono tracking-widest focus:outline-none focus:border-[#0061fe] focus:ring-2 focus:ring-[#0061fe]/15 shadow-xs transition-all placeholder:text-slate-400 placeholder:tracking-normal placeholder:font-sans"
              />
              {error && <p className="mt-1.5 text-xs text-rose-600 text-center font-medium">{error}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-[#0061fe] hover:bg-[#0052d9] text-white font-medium rounded-xl text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-xs hover:shadow-sm"
            >
              <span>Continuar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      <footer className="w-full max-w-sm flex items-center justify-between text-xs text-slate-400 pt-8">
        <span>SGT Prevención © 2026</span>
        <Link
          href="/admin/login"
          title="Acceso Administrador"
          className="p-1.5 hover:text-slate-700 rounded-md transition-colors flex items-center gap-1"
        >
          <Lock className="w-3.5 h-3.5" />
          <span className="text-[11px]">Administrador</span>
        </Link>
      </footer>
    </div>
  );
}
