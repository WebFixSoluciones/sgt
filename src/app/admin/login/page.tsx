'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Lock, User, KeyRound, ArrowRight, ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          username,
          password,
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push('/admin');
        router.refresh();
      } else {
        setError(data.error || 'Credenciales inválidas');
      }
    } catch (err) {
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Logo Section */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <img
              src="/logo-sgt.jpg"
              alt="SGT Corp. Prevención S.A."
              className="h-14 w-auto object-contain"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Panel Administrativo
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestión exclusiva de encuestas y evaluaciones laborales
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-slate-800 text-sm font-semibold">
            <Lock className="w-4 h-4 text-blue-600" />
            <span>Ingreso de Administrador</span>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="user"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
              >
                Usuario
              </label>
              <div className="relative">
                <input
                  id="user"
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#0061fe] focus:ring-1 focus:ring-[#0061fe]"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label
                htmlFor="pass"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="pass"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#0061fe] focus:ring-1 focus:ring-[#0061fe]"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#0061fe] hover:bg-[#0052d9] text-white font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <span>Ingresar al Administrador</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Credenciales por defecto: <code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded">admin / admin</code></span>
          </div>
        </div>

        {/* Back to evaluation */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a la pantalla de evaluación</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
