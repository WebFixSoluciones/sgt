'use client';

import React, { useState, useEffect } from 'react';
import { KeyRound, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, X, ShieldCheck } from 'lucide-react';
import Portal from '@/components/common/Portal';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Reset form when opened or closed
  useEffect(() => {
    if (isOpen) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
      setError(null);
      setSuccess(false);
      setLoading(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validations
    if (!currentPassword.trim()) {
      setError('Por favor ingrese su contraseña actual.');
      return;
    }

    if (!newPassword.trim()) {
      setError('Por favor ingrese la nueva contraseña.');
      return;
    }

    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (newPassword === currentPassword) {
      setError('La nueva contraseña debe ser diferente a la contraseña actual.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las nuevas contraseñas no coinciden. Verifique e intente nuevamente.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change-password',
          currentPassword: currentPassword.trim(),
          newPassword: newPassword.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2200);
      } else {
        setError(data.error || 'No se pudo actualizar la contraseña. Verifique sus datos.');
      }
    } catch (err: any) {
      setError('Error de conexión con el servidor. Inténtelo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
          onClick={() => !loading && onClose()}
        />

        {/* Modal Card */}
        <div
          className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Cambiar Contraseña
                </h3>
                <p className="text-xs text-slate-500">
                  Actualice la clave de acceso al panel administrativo
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            {success ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center shadow-xs">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-slate-900">¡Contraseña Actualizada!</h4>
                <p className="text-xs text-slate-600 max-w-xs mx-auto">
                  La clave de acceso maestro ha sido modificada exitosamente. A partir de ahora use su nueva contraseña para iniciar sesión.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                  >
                    Aceptar
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-start gap-2.5 animate-in fade-in duration-100">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span className="flex-1">{error}</span>
                  </div>
                )}

                {/* Contraseña Actual */}
                <div>
                  <label
                    htmlFor="currentPassword"
                    className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
                  >
                    Contraseña Actual
                  </label>
                  <div className="relative">
                    <input
                      id="currentPassword"
                      type={showCurrent ? 'text' : 'password'}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Ingrese su contraseña actual"
                      disabled={loading}
                      className="w-full pl-9 pr-10 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#0061fe] focus:ring-1 focus:ring-[#0061fe] disabled:bg-slate-50"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      tabIndex={-1}
                    >
                      {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 space-y-4">
                  {/* Nueva Contraseña */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label
                        htmlFor="newPassword"
                        className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
                      >
                        Nueva Contraseña
                      </label>
                      <span className="text-[10px] text-slate-400 font-medium">Mín. 6 caracteres</span>
                    </div>
                    <div className="relative">
                      <input
                        id="newPassword"
                        type={showNew ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Ingrese la nueva contraseña"
                        disabled={loading}
                        className="w-full pl-9 pr-10 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#0061fe] focus:ring-1 focus:ring-[#0061fe] disabled:bg-slate-50"
                      />
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                        tabIndex={-1}
                      >
                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirmar Nueva Contraseña */}
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
                    >
                      Confirmar Nueva Contraseña
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        type={showConfirm ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repita la nueva contraseña"
                        disabled={loading}
                        className={`w-full pl-9 pr-10 py-2 border rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-1 disabled:bg-slate-50 ${
                          confirmPassword && confirmPassword !== newPassword
                            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500'
                            : 'border-slate-300 focus:border-[#0061fe] focus:ring-[#0061fe]'
                        }`}
                      />
                      <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                        tabIndex={-1}
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {confirmPassword && confirmPassword !== newPassword && (
                      <p className="text-[11px] text-rose-600 mt-1 font-medium">
                        Las contraseñas aún no coinciden.
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{loading ? 'Guardando...' : 'Guardar Contraseña'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
}
