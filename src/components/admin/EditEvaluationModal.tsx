'use client';

import React, { useState, useEffect } from 'react';
import {
  Edit,
  X,
  Building2,
  Users,
  GitMerge,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Hash,
  UserCheck,
  Globe,
  Lock,
  BookmarkCheck,
  Clock,
} from 'lucide-react';
import { EvaluationCampaign } from '@/lib/types';
import Portal from '@/components/common/Portal';

interface EditEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: EvaluationCampaign | null;
  existingCampaigns?: EvaluationCampaign[];
  onSuccess: (updated: EvaluationCampaign) => void;
}

export default function EditEvaluationModal({
  isOpen,
  onClose,
  campaign,
  existingCampaigns = [],
  onSuccess,
}: EditEvaluationModalProps) {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [expectedParticipants, setExpectedParticipants] = useState('100');
  const [isOpenEvaluation, setIsOpenEvaluation] = useState(false);
  const [allowSaveProgress, setAllowSaveProgress] = useState(true);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [nextEvaluationCode, setNextEvaluationCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (campaign && isOpen) {
      setTitle(campaign.title || '');
      setCompany(campaign.company || '');
      setExpectedParticipants(String(campaign.expectedParticipants || 100));
      setIsOpenEvaluation(Boolean(campaign.isOpenEvaluation));
      setAllowSaveProgress(campaign.allowSaveProgress !== false);
      setStatus(campaign.status === 'inactive' ? 'inactive' : 'active');
      setNextEvaluationCode(campaign.nextEvaluationCode || '');
      setErrorMsg('');
    }
  }, [campaign, isOpen]);

  if (!isOpen || !campaign) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('El título de la evaluación no puede estar vacío.');
      return;
    }
    if (!company.trim()) {
      setErrorMsg('El nombre de la empresa no puede estar vacío.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      const res = await fetch('/api/evaluaciones', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: campaign.code,
          action: 'update',
          title: title.trim(),
          company: company.trim(),
          expectedParticipants: isOpenEvaluation ? 0 : (parseInt(expectedParticipants) || 100),
          isOpenEvaluation,
          allowSaveProgress,
          status,
          nextEvaluationCode: nextEvaluationCode.trim().toUpperCase() || '',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al guardar los cambios de la evaluación');
      }

      onSuccess(data.data);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error al conectar con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const otherCampaigns = existingCampaigns.filter(
    (c) => c.code.toUpperCase() !== campaign.code.toUpperCase() && c.status !== 'trash'
  );

  return (
    <Portal>
      <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <Edit className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Editar Datos de la Evaluación
                </h3>
                <p className="text-[11px] text-slate-500">
                  Código asignado: <span className="font-mono font-bold text-blue-600">{campaign.code}</span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto text-xs">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-medium">{errorMsg}</span>
              </div>
            )}

            {/* Título de la evaluación */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Nombre / Título de la Evaluación <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: EVALUACIÓN INTEGRAL WEBFIX 2026"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                autoFocus
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Este nombre aparecerá en el encabezado del portal para los trabajadores y en los informes.
              </p>
            </div>

            {/* Empresa */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Empresa o Razón Social <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Ej: WEBFIX 2026"
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
            </div>

            {/* Modalidad de Identificación de Trabajadores */}
            <div>
              <label className="block font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Modalidad de Identificación de Trabajadores *</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Con Código de Trabajador */}
                <div
                  onClick={() => setIsOpenEvaluation(false)}
                  className={`cursor-pointer p-3 rounded-xl border-2 transition-all ${
                    !isOpenEvaluation
                      ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/10'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        !isOpenEvaluation ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'
                      }`}>
                        {!isOpenEvaluation && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-blue-600" />
                        Con Código de Trabajador
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                      Identificado
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight pl-5">
                    Acceso con código de evaluación y requiere código de empleado del trabajador.
                  </p>
                </div>

                {/* Evaluación Abierta */}
                <div
                  onClick={() => setIsOpenEvaluation(true)}
                  className={`cursor-pointer p-3 rounded-xl border-2 transition-all ${
                    isOpenEvaluation
                      ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/10'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        isOpenEvaluation ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300 bg-white'
                      }`}>
                        {isOpenEvaluation && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                        <Globe className="w-3 h-3 text-emerald-600" />
                        Evaluación Abierta
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                      Sin Cód. Trabajador
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight pl-5">
                    Acceso con código de evaluación, pero no solicita código ni identificación de trabajador.
                  </p>
                </div>
              </div>
            </div>

            {/* Modalidad de Guardado de Progreso */}
            <div>
              <label className="block font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <BookmarkCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Guardado de Progreso / Salida de la Evaluación *</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Opción 1: Guardar progreso antes de terminar */}
                <div
                  onClick={() => setAllowSaveProgress(true)}
                  className={`cursor-pointer p-3 rounded-xl border-2 transition-all ${
                    allowSaveProgress
                      ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/10'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        allowSaveProgress ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'
                      }`}>
                        {allowSaveProgress && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-600" />
                        Guardar Progreso Parcial
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                      Guardar y Retomar
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight pl-5">
                    Los trabajadores pueden guardar su avance con "Guardar y Salir" y retomarlo más tarde.
                  </p>
                </div>

                {/* Opción 2: Los trabajadores deben terminar al 100% */}
                <div
                  onClick={() => setAllowSaveProgress(false)}
                  className={`cursor-pointer p-3 rounded-xl border-2 transition-all ${
                    !allowSaveProgress
                      ? 'border-purple-600 bg-purple-50/50 ring-2 ring-purple-500/10'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        !allowSaveProgress ? 'border-purple-600 bg-purple-600' : 'border-slate-300 bg-white'
                      }`}>
                        {!allowSaveProgress && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-purple-600" />
                        Obligatorio Terminar al 100%
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800">
                      Sesión Única (100%)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight pl-5">
                    Deben responder al 100% en una sola sesión. Al salir la opción será "Salir sin Guardar".
                  </p>
                </div>
              </div>
            </div>

            {/* Participantes esperados & Estado */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>Participantes Esperados</span>
                </label>
                {isOpenEvaluation ? (
                  <div className="px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 flex items-center h-[34px]">
                    <span>Ilimitado / Participación abierta</span>
                  </div>
                ) : (
                  <input
                    type="number"
                    min="1"
                    max="50000"
                    value={expectedParticipants}
                    onChange={(e) => setExpectedParticipants(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Estado de la Evaluación
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                >
                  <option value="active">Activa (Permite responder)</option>
                  <option value="inactive">Inactiva (Cerrada temporalmente)</option>
                </select>
              </div>
            </div>

            {/* Encadenamiento a siguiente evaluación */}
            {otherCampaigns.length > 0 && (
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <GitMerge className="w-3.5 h-3.5 text-slate-400" />
                  <span>Encadenar a Siguiente Evaluación (Opcional)</span>
                </label>
                <select
                  value={nextEvaluationCode}
                  onChange={(e) => setNextEvaluationCode(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                >
                  <option value="">-- Sin encadenar (Terminar al finalizar esta) --</option>
                  {otherCampaigns.map((oc) => (
                    <option key={oc.code} value={oc.code}>
                      {oc.code} - {oc.title} ({oc.company})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Al completar esta evaluación, el trabajador continuará automáticamente a la seleccionada.
                </p>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold rounded-xl text-xs transition-colors"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-[#0061fe] hover:bg-[#0052d9] text-white font-semibold rounded-xl text-xs transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Guardando cambios...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Guardar Cambios</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
}
