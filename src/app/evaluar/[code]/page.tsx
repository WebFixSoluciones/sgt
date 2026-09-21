'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  Building2,
  User,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { EvaluationCampaign, FormSchema, FormField } from '@/lib/types';
import ResumePromptModal from '@/components/worker/ResumePromptModal';
import CompletedNotice from '@/components/worker/CompletedNotice';

interface Section {
  title: string;
  fields: FormField[];
}

export default function WorkerEvaluationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = (params.code as string)?.toUpperCase();

  // Campaign & Form Data
  const [campaign, setCampaign] = useState<EvaluationCampaign | null>(null);
  const [form, setForm] = useState<FormSchema | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Worker Session State
  const [workerCode, setWorkerCode] = useState(searchParams.get('worker') || '');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSubmittingCheck, setIsSubmittingCheck] = useState(false);

  // Status flags
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeSectionTitle, setResumeSectionTitle] = useState('');
  const [savedSectionIndex, setSavedSectionIndex] = useState(0);

  // Active survey state
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isFinalSubmitting, setIsFinalSubmitting] = useState(false);
  const [transitionMsg, setTransitionMsg] = useState<string | null>(null);
  const [surveyCompletedSuccess, setSurveyCompletedSuccess] = useState(false);

  // 1. Fetch Campaign & Form Schema
  useEffect(() => {
    if (!code) return;
    const fetchCampaignData = async () => {
      try {
        setPageLoading(true);
        const res = await fetch(`/api/evaluaciones/${code}?track=1`);
        const data = await res.json();
        if (data.success) {
          setCampaign(data.data.campaign);
          setForm(data.data.form);
        } else {
          setErrorMsg(data.error || 'No se pudo cargar la evaluación.');
        }
      } catch (err: any) {
        setErrorMsg('Error al conectar con el servidor.');
      } finally {
        setPageLoading(false);
      }
    };
    fetchCampaignData();
  }, [code]);

  // 2. Build Sections based on 'page_break' fields
  const sections: Section[] = useMemo(() => {
    if (!form || !form.fields) return [];
    const secList: Section[] = [];
    let currentSec: Section = {
      title: 'Información General',
      fields: [],
    };

    for (const field of form.fields) {
      if (field.type === 'page_break') {
        if (currentSec.fields.length > 0) {
          secList.push(currentSec);
        }
        currentSec = {
          title: field.sectionTitle || field.label || `Sección ${secList.length + 1}`,
          fields: [],
        };
      } else {
        currentSec.fields.push(field);
      }
    }

    if (currentSec.fields.length > 0) {
      secList.push(currentSec);
    }

    return secList;
  }, [form]);

  // 3. Worker Check / Login
  const handleWorkerCheck = async (targetCode?: string) => {
    const codeToTest = (targetCode || workerCode).trim().toUpperCase();
    if (!codeToTest) {
      alert('Por favor ingrese su Código de Trabajador.');
      return;
    }

    try {
      setIsSubmittingCheck(true);
      const res = await fetch('/api/sesiones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check',
          evaluationCode: code,
          workerCode: codeToTest,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        alert(data.error || 'Error al validar el código.');
        return;
      }

      if (data.status === 'completed') {
        setAlreadyCompleted(true);
        setIsLoggedIn(true);
        return;
      }

      if (data.canResume) {
        setAnswers(data.answers || {});
        setSavedSectionIndex(data.currentFieldIndex || 0);
        setResumeSectionTitle(data.currentSectionTitle || `Sección ${(data.currentFieldIndex || 0) + 1}`);
        setShowResumeModal(true);
      } else {
        setAnswers(data.answers || {});
        setCurrentSectionIndex(0);
        setIsLoggedIn(true);
      }
    } catch (e) {
      console.error(e);
      alert('Error al verificar sesión.');
    } finally {
      setIsSubmittingCheck(false);
    }
  };

  // Auto-login if worker code is in query string (from chained group)
  useEffect(() => {
    const workerParam = searchParams.get('worker');
    if (workerParam && form && !isLoggedIn && !isSubmittingCheck) {
      handleWorkerCheck(workerParam);
    }
  }, [searchParams, form]);

  // Save & Resume: Continue
  const handleContinueSaved = () => {
    setShowResumeModal(false);
    setCurrentSectionIndex(Math.min(savedSectionIndex, Math.max(0, sections.length - 1)));
    setIsLoggedIn(true);
  };

  // Save & Resume: Reset
  const handleResetSession = async () => {
    try {
      await fetch('/api/sesiones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset',
          evaluationCode: code,
          workerCode,
        }),
      });
      setAnswers({});
      setCurrentSectionIndex(0);
      setShowResumeModal(false);
      setIsLoggedIn(true);
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Answer Selection + Auto Draft Save
  const handleSelectAnswer = async (fieldId: string, value: string | number) => {
    const updatedAnswers = { ...answers, [fieldId]: value };
    setAnswers(updatedAnswers);

    // Auto-save draft asynchronously
    try {
      setIsSavingDraft(true);
      await fetch('/api/sesiones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_draft',
          evaluationCode: code,
          workerCode,
          answers: updatedAnswers,
          currentFieldIndex: currentSectionIndex,
          currentSectionTitle: sections[currentSectionIndex]?.title || '',
        }),
      });
    } catch (err) {
      console.warn('Auto-save warning:', err);
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Navigation: Next Section
  const handleNextSection = () => {
    // Validate required fields in current section
    const currentFields = sections[currentSectionIndex]?.fields || [];
    for (const f of currentFields) {
      if (f.required && (answers[f.id] === undefined || answers[f.id] === '')) {
        alert(`Por favor responda a la pregunta obligatoria: "${f.label}"`);
        return;
      }
    }

    if (currentSectionIndex < sections.length - 1) {
      const nextIndex = currentSectionIndex + 1;
      setCurrentSectionIndex(nextIndex);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Save section advance
      fetch('/api/sesiones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_draft',
          evaluationCode: code,
          workerCode,
          answers,
          currentFieldIndex: nextIndex,
          currentSectionTitle: sections[nextIndex]?.title || '',
        }),
      });
    }
  };

  // Navigation: Previous Section
  const handlePrevSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Final Submit
  const handleFinalSubmit = async () => {
    // Validate current section
    const currentFields = sections[currentSectionIndex]?.fields || [];
    for (const f of currentFields) {
      if (f.required && (answers[f.id] === undefined || answers[f.id] === '')) {
        alert(`Por favor responda a la pregunta obligatoria: "${f.label}"`);
        return;
      }
    }

    try {
      setIsFinalSubmitting(true);
      const res = await fetch('/api/sesiones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete',
          evaluationCode: code,
          workerCode,
          answers,
          currentFieldIndex: currentSectionIndex,
          currentSectionTitle: 'Finalizado',
        }),
      });

      const data = await res.json();
      if (!data.success) {
        alert(data.error || 'Error al enviar evaluación.');
        return;
      }

      // Check Chained Evaluation in Group!
      if (data.nextEvaluationCode) {
        setTransitionMsg(
          `¡Evaluación completada! Continuando automáticamente con la siguiente evaluación de su grupo...`
        );
        setTimeout(() => {
          router.push(`/evaluar/${data.nextEvaluationCode}?worker=${encodeURIComponent(workerCode)}`);
        }, 2000);
      } else {
        setSurveyCompletedSuccess(true);
      }
    } catch (err) {
      console.error(err);
      alert('Error en el servidor al finalizar.');
    } finally {
      setIsFinalSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // RENDERING STATES
  // -------------------------------------------------------------

  if (pageLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-medium">Cargando evaluación...</p>
      </div>
    );
  }

  if (errorMsg || !campaign || !form) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-rose-200 rounded-lg p-6 text-center space-y-4 shadow-sm">
          <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
          <h2 className="text-base font-bold text-slate-900">Evaluación no disponible</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {errorMsg || 'La evaluación no fue encontrada o se encuentra inactiva.'}
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  // State: Worker Already Completed
  if (alreadyCompleted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <CompletedNotice
          company={campaign.company}
          evaluationTitle={campaign.title}
          workerCode={workerCode}
        />
      </div>
    );
  }

  // State: Final Success Confirmation
  if (surveyCompletedSuccess) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-emerald-200 rounded-xl p-8 text-center space-y-5 shadow-sm">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              ¡Evaluación Completada con Éxito!
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Muchas gracias por su valiosa colaboración. Sus respuestas han sido registradas de forma
              segura para el programa de prevención laboral de{' '}
              <strong className="text-slate-800">{campaign.company}</strong>.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-medium rounded transition-colors"
            >
              Finalizar y salir
            </button>
          </div>
        </div>
      </div>
    );
  }

  // State: Transitioning to Next Chained Evaluation
  if (transitionMsg) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-purple-200 rounded-xl p-8 text-center space-y-4 shadow-sm animate-pulse">
          <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Encuesta Guardada</h2>
          <p className="text-xs text-slate-600 leading-relaxed">{transitionMsg}</p>
          <div className="flex items-center justify-center gap-2 text-xs text-purple-700 font-semibold pt-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Cargando siguiente sección...</span>
          </div>
        </div>
      </div>
    );
  }

  // State: Step 1 - Worker Login
  if (!isLoggedIn) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        {showResumeModal && (
          <ResumePromptModal
            currentSectionTitle={resumeSectionTitle}
            onContinue={handleContinueSaved}
            onReset={handleResetSession}
          />
        )}

        <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
          {/* Header */}
          <div className="border-b border-slate-100 pb-4">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[11px] font-semibold uppercase tracking-wider mb-2">
              <Building2 className="w-3.5 h-3.5" />
              <span>{campaign.company}</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-snug">
              {campaign.title}
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Evaluación de Salud y Prevención de Riesgos Laborales
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleWorkerCheck();
            }}
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="workerId"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
              >
                Código de Trabajador (COD) *
              </label>
              <div className="relative">
                <input
                  id="workerId"
                  type="text"
                  required
                  autoFocus
                  value={workerCode}
                  onChange={(e) => setWorkerCode(e.target.value.toUpperCase())}
                  placeholder="Ej. 5555 o 999999"
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 font-mono tracking-wider uppercase focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Ingrese su número o código provisto por la empresa para identificarse.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmittingCheck}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              {isSubmittingCheck ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validando...</span>
                </>
              ) : (
                <>
                  <span>Comenzar Evaluación</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Step 2: Survey Form Renderer (Clean, Flat, 100% Responsive)
  // -------------------------------------------------------------
  const currentSection = sections[currentSectionIndex];
  const progressPercent = Math.round(((currentSectionIndex + 1) / Math.max(sections.length, 1)) * 100);

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 sm:px-6 lg:px-8">
      {/* Resume modal if triggered */}
      {showResumeModal && (
        <ResumePromptModal
          currentSectionTitle={resumeSectionTitle}
          onContinue={handleContinueSaved}
          onReset={handleResetSession}
        />
      )}

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Floating / Sticky Progress Header */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs sticky top-20 z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600 mb-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">{campaign.company}</span>
              <span className="text-slate-300">•</span>
              <span className="font-mono text-slate-500">COD: {workerCode}</span>
            </div>
            <div className="flex items-center gap-3">
              {isSavingDraft && (
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Auto-guardando...
                </span>
              )}
              <span className="font-semibold text-blue-700">
                Sección {currentSectionIndex + 1} de {sections.length} ({progressPercent}%)
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Section Title */}
          <div className="mt-3 font-semibold text-sm text-slate-800 flex items-center gap-2">
            <span>{currentSection?.title || 'Preguntas'}</span>
          </div>
        </div>

        {/* Question Cards List */}
        <div className="space-y-4">
          {currentSection?.fields.map((field, fieldIdx) => {
            const currentValue = answers[field.id];

            return (
              <div
                key={field.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs transition-all hover:border-slate-300"
              >
                {/* Question Label */}
                <div className="mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Pregunta {fieldIdx + 1} {field.required && <span className="text-rose-600">*</span>}
                  </span>
                  <h3 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
                    {field.label}
                  </h3>
                  {field.description && (
                    <p className="mt-1 text-xs text-slate-500">{field.description}</p>
                  )}
                </div>

                {/* Radio Options Grid */}
                {field.type === 'radio' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                    {field.options?.map((opt) => {
                      const isSelected = String(currentValue) === String(opt.value);
                      return (
                        <button
                          type="button"
                          key={opt.id}
                          onClick={() => handleSelectAnswer(field.id, opt.value)}
                          className={`p-3 rounded-lg border text-left text-xs sm:text-sm font-medium transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-blue-50/80 border-blue-600 text-blue-900 ring-1 ring-blue-600 shadow-xs'
                              : 'bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                          }`}
                        >
                          <span>{opt.label}</span>
                          <span
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-2 ${
                              isSelected
                                ? 'border-blue-600 bg-blue-600 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Select Dropdown */}
                {field.type === 'select' && (
                  <div className="mt-2">
                    <select
                      value={currentValue !== undefined ? String(currentValue) : ''}
                      onChange={(e) => handleSelectAnswer(field.id, e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    >
                      <option value="">-- Seleccione una opción --</option>
                      {field.options?.map((opt) => (
                        <option key={opt.id} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Textarea */}
                {field.type === 'textarea' && (
                  <div className="mt-2">
                    <textarea
                      rows={3}
                      value={currentValue !== undefined ? String(currentValue) : ''}
                      onChange={(e) => handleSelectAnswer(field.id, e.target.value)}
                      placeholder="Escriba aquí sus observaciones o consideraciones adicionales..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                )}

                {/* Text Input */}
                {field.type === 'text' && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={currentValue !== undefined ? String(currentValue) : ''}
                      onChange={(e) => handleSelectAnswer(field.id, e.target.value)}
                      placeholder="Ingrese texto..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Navigation Buttons */}
        <div className="flex items-center justify-between gap-4 pt-4 pb-12">
          <button
            type="button"
            onClick={handlePrevSection}
            disabled={currentSectionIndex === 0}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs sm:text-sm font-medium rounded-lg transition-colors inline-flex items-center gap-2 disabled:opacity-30 disabled:pointer-events-none"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Anterior</span>
          </button>

          {currentSectionIndex < sections.length - 1 ? (
            <button
              type="button"
              onClick={handleNextSection}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors inline-flex items-center gap-2 shadow-xs"
            >
              <span>Siguiente</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={isFinalSubmitting}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors inline-flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isFinalSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enviando Respuestas...</span>
                </>
              ) : (
                <>
                  <span>Finalizar y Enviar Evaluación</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
