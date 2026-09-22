'use client';

import React from 'react';
import {
  AlertTriangle,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Info,
  X,
  Loader2,
} from 'lucide-react';
import Portal from '@/components/common/Portal';

export type DialogType = 'danger' | 'warning' | 'info' | 'success';

export interface ConfirmDialogProps {
  isOpen: boolean;
  type?: DialogType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string | null; // pass null to show only the confirm button (alert mode)
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

export default function ConfirmDialog({
  isOpen,
  type = 'warning',
  title,
  message,
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <Trash2 className="w-6 h-6 text-rose-600" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-amber-600" />;
      case 'success':
        return <CheckCircle2 className="w-6 h-6 text-emerald-600" />;
      case 'info':
      default:
        return <Info className="w-6 h-6 text-blue-600" />;
    }
  };

  const getIconWrapperClass = () => {
    switch (type) {
      case 'danger':
        return 'bg-rose-50 border-rose-200';
      case 'warning':
        return 'bg-amber-50 border-amber-200';
      case 'success':
        return 'bg-emerald-50 border-emerald-200';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getConfirmButtonClass = () => {
    switch (type) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs focus:ring-rose-500';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs focus:ring-amber-500';
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs focus:ring-emerald-500';
      case 'info':
      default:
        return 'bg-[#0061fe] hover:bg-[#0052d9] text-white shadow-xs focus:ring-blue-500';
    }
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
        <div
          className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-center space-y-4 animate-in zoom-in-95 duration-150 relative overflow-hidden"
          role="dialog"
          aria-modal="true"
        >
          {/* Close X button if cancel is allowed */}
          {cancelText !== null && onCancel && (
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Centered Icon */}
          <div
            className={`w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto shadow-xs ${getIconWrapperClass()}`}
          >
            {getIcon()}
          </div>

          {/* Content */}
          <div className="space-y-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug tracking-tight">
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line px-1">
              {message}
            </p>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-center gap-3">
            {cancelText !== null && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1 py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs border border-slate-300 transition-colors shadow-2xs disabled:opacity-50"
              >
                {cancelText}
              </button>
            )}

            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`${
                cancelText !== null && onCancel ? 'flex-1' : 'w-full'
              } py-2.5 px-4 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 ${getConfirmButtonClass()} disabled:opacity-50`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : (
                <span>{confirmText}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
