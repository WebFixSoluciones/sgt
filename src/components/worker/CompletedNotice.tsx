'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, ShieldAlert, ArrowLeft, PhoneCall } from 'lucide-react';

interface CompletedNoticeProps {
  company: string;
  evaluationTitle: string;
  workerCode: string;
  completedAt?: string;
}

export default function CompletedNotice({
  company,
  evaluationTitle,
  workerCode,
  completedAt,
}: CompletedNoticeProps) {
  return (
    <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-8 shadow-sm text-center space-y-6 mx-auto">
      <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-200">
        <CheckCircle2 className="w-8 h-8 text-amber-600" />
      </div>

      <div>
        <span className="inline-block px-2.5 py-1 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold uppercase tracking-wider mb-2">
          Estado: Registrado
        </span>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          USTED YA COMPLETÓ SU EVALUACIÓN
        </h2>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          Ya se encuentran registradas sus respuestas para la evaluación{' '}
          <strong className="text-slate-800">{evaluationTitle}</strong> de la empresa{' '}
          <strong className="text-slate-800">{company}</strong> con el código de trabajador{' '}
          <span className="font-mono font-bold text-slate-800">{workerCode}</span>.
        </p>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-600 text-left space-y-2">
        <div className="flex items-start gap-2">
          <PhoneCall className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
          <span>
            Si considera que esto es un error o necesita actualizar sus datos, por favor comuníquese
            con el departamento de Recursos Humanos / Salud Ocupacional o el evaluador encargado.
          </span>
        </div>
      </div>

      <div className="pt-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Regresar al inicio</span>
        </Link>
      </div>
    </div>
  );
}
