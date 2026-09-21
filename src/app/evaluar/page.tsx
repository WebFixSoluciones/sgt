'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, ArrowRight, ShieldCheck } from 'lucide-react';

export default function EvaluacionesIndexPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = code.trim().toUpperCase();
    if (!clean) {
      setError('Por favor ingrese el código de evaluación proporcionado por su empresa.');
      return;
    }
    router.push(`/evaluar/${clean}`);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Acceso a Evaluación
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Ingrese el código de evaluación para acceder al cuestionario correspondiente.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="evalCode"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
            >
              Código de Evaluación (COD) *
            </label>
            <input
              id="evalCode"
              type="text"
              required
              autoFocus
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError('');
              }}
              placeholder="Ej. CHAIDE-PSI-2026"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 font-mono tracking-wider uppercase focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
            {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            <span>Acceder a la Evaluación</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
