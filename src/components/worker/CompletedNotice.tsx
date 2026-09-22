'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, PhoneCall, Calendar, User, Building2, RotateCcw } from 'lucide-react';
import { formatEcuadorDateTime } from '@/lib/date-utils';

interface CompletedNoticeProps {
  company: string;
  evaluationTitle: string;
  workerCode: string;
  completedAt?: string;
  onResetWorkerCode?: () => void;
}

export default function CompletedNotice({
  company,
  evaluationTitle,
  workerCode,
  completedAt,
  onResetWorkerCode,
}: CompletedNoticeProps) {
  return (
    <div className="max-w-md w-full bg-white border border-rose-200 rounded-2xl p-7 sm:p-8 shadow-xl text-center space-y-6 mx-auto animate-in fade-in zoom-in-95 duration-150">
      {/* Alert Icon */}
      <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200 shadow-xs">
        <ShieldAlert className="w-9 h-9" />
      </div>

      <div className="space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold uppercase tracking-wider border border-rose-200">
          Registro Existente / Finalizado
        </span>
        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-snug">
          LA EVALUACIÓN CON CÓDIGO DE TRABAJADOR YA EXISTE
        </h2>
        <p className="text-sm font-bold text-rose-600 tracking-tight">
          Comuníquese con el Evaluador
        </p>
      </div>

      {/* Details Box */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 text-left space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-slate-500 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" /> Código Trabajador:
          </span>
          <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
            {workerCode}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" /> Empresa:
          </span>
          <span className="font-semibold text-slate-900">{company}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500">Evaluación:</span>
          <span className="font-medium text-slate-900 truncate max-w-[200px]" title={evaluationTitle}>
            {evaluationTitle}
          </span>
        </div>

        {completedAt && (
          <div className="flex items-center justify-between pt-1 border-t border-slate-200">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Finalizado el:
            </span>
            <span className="font-mono font-semibold text-slate-800">
              {formatEcuadorDateTime(completedAt)}
            </span>
          </div>
        )}
      </div>

      {/* Evaluator Support Callout */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 text-left space-y-1.5">
        <div className="flex items-start gap-2 font-medium">
          <PhoneCall className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
          <span>
            Este trabajador ya finalizó su cuestionario satisfactoriamente. Por seguridad y validez de los resultados, no es posible repetir la evaluación. Si requiere autorización para una reevaluación o considera que se trata de un error, comuníquese con el <strong>Evaluador asignado</strong> o con el departamento de Salud Ocupacional / Talento Humano.
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2 pt-1">
        {onResetWorkerCode && (
          <button
            type="button"
            onClick={onResetWorkerCode}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-black text-white font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Ingresar otro código de trabajador</span>
          </button>
        )}

        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors py-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Regresar a la página principal</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
