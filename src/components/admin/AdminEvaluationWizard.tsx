'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  FileText,
  Building2,
  GitMerge,
  Sparkles,
  Link2,
  Copy,
  ExternalLink,
  Layers,
  Clock,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import type { EvaluationCampaign, FormSchema } from '@/lib/types';

interface AdminEvaluationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newCampaign: EvaluationCampaign) => void;
  existingCampaigns: EvaluationCampaign[];
  forms: FormSchema[];
  initialData?: Partial<EvaluationCampaign> | null;
}

export default function AdminEvaluationWizard({
  isOpen,
  onClose,
  onSuccess,
  existingCampaigns,
  forms,
  initialData,
}: AdminEvaluationWizardProps) {
  // Step tracker (1: Plantilla, 2: Datos Empresa, 3: Encadenamiento, 4: Resumen & Éxito)
  const [currentStep, setCurrentStep] = useState(1);

  // Form fields
  const [selectedFormId, setSelectedFormId] = useState('');
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [expectedParticipants, setExpectedParticipants] = useState('100');
  
  // Chaining configuration
  const [isChained, setIsChained] = useState(false);
  const [nextEvaluationCode, setNextEvaluationCode] = useState('');
  
  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdCampaign, setCreatedCampaign] = useState<EvaluationCampaign | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Prepopulate or initialize
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setSelectedFormId(initialData.formId || (forms[0]?.id ?? ''));
        setCompany(initialData.company || '');
        setTitle(initialData.title || '');
        setCode(initialData.code || '');
        setExpectedParticipants(String(initialData.expectedParticipants || 100));
        if (initialData.nextEvaluationCode) {
          setIsChained(true);
          setNextEvaluationCode(initialData.nextEvaluationCode);
        } else {
          setIsChained(false);
          setNextEvaluationCode('');
        }
      } else {
        setSelectedFormId(forms[0]?.id ?? '');
        setCompany('');
        setTitle('');
        setCode('');
        setExpectedParticipants('100');
        setIsChained(false);
        setNextEvaluationCode('');
      }
      setCurrentStep(1);
      setCreatedCampaign(null);
      setErrorMsg('');
      setCopiedLink(false);
    }
  }, [isOpen, initialData, forms]);

  // Selected form object
  const selectedForm = useMemo(() => {
    return forms.find((f) => f.id === selectedFormId);
  }, [forms, selectedFormId]);

  // Selected next campaign object (for visual chaining preview)
  const selectedNextCampaign = useMemo(() => {
    if (!nextEvaluationCode) return null;
    return existingCampaigns.find((c) => c.code === nextEvaluationCode) || null;
  }, [existingCampaigns, nextEvaluationCode]);

  // Auto-generate title and code suggestions when company or template changes
  const handleCompanyChange = (val: string) => {
    setCompany(val);
    if (!initialData) {
      const formName = selectedForm?.title || 'EVALUACIÓN';
      const cleanCompany = val.trim();
      if (cleanCompany) {
        if (!title || title.startsWith('EVALUACIÓN') || title.includes(' - ')) {
          setTitle(`${cleanCompany} - ${formName}`);
        }
        if (!code) {
          const compSlug = cleanCompany
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .substring(0, 8);
          const formSlug = formName.toLowerCase().includes('fpsico')
            ? 'PSI'
            : formName.toLowerCase().includes('lips')
            ? 'LIPS'
            : formName.toLowerCase().includes('estrés') || formName.toLowerCase().includes('estres')
            ? 'ESTRES'
            : 'SGT';
          setCode(`${compSlug}-${formSlug}-2026`);
        }
      }
    }
  };

  if (!isOpen) return null;

  // Step 1 Validation
  const canProceedStep1 = Boolean(selectedFormId);

  // Step 2 Validation
  const canProceedStep2 = Boolean(
    company.trim() && title.trim() && code.trim() && Number(expectedParticipants) > 0
  );

  // Step 3 Validation
  const canProceedStep3 = !isChained || (isChained && Boolean(nextEvaluationCode));

  // Handler to create
  const handleCreateEvaluation = async () => {
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const payload = {
        title: title.trim(),
        code: code.trim().toUpperCase(),
        formId: selectedFormId,
        company: company.trim(),
        expectedParticipants: parseInt(expectedParticipants) || 100,
        nextEvaluationCode: isChained ? nextEvaluationCode.trim().toUpperCase() : '',
        status: 'active',
      };

      const res = await fetch('/api/evaluaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.error || 'Error al crear la evaluación.');
        setIsSubmitting(false);
        return;
      }

      setCreatedCampaign(data.data);
      onSuccess(data.data);
    } catch (e: any) {
      console.error(e);
      setErrorMsg('Error de conexión con el servidor al guardar la evaluación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (!createdCampaign) return;
    const url = `${window.location.origin}/evaluar/${createdCampaign.code}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in-slide">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* TOP HEADER: Clean Stepper & Progress */}
        <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Asistente de Creación de Evaluación
              </h2>
              <p className="text-xs text-slate-500">
                Configure paso a paso la nueva campaña de salud y prevención laboral
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            title="Cerrar asistente"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP PROGRESS BAR */}
        {!createdCampaign && (
          <div className="bg-slate-50/70 border-b border-slate-100 px-6 py-3">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              {/* Step 1 */}
              <div
                onClick={() => currentStep > 1 && setCurrentStep(1)}
                className={`flex items-center gap-2 cursor-pointer transition-all ${
                  currentStep === 1
                    ? 'text-blue-600 font-bold'
                    : currentStep > 1
                    ? 'text-emerald-600 font-semibold'
                    : 'text-slate-400 font-normal'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    currentStep === 1
                      ? 'bg-blue-600 text-white shadow-xs'
                      : currentStep > 1
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {currentStep > 1 ? <Check className="w-4 h-4" /> : '1'}
                </div>
                <span className="text-xs hidden sm:inline">Cuestionario Base</span>
              </div>

              <div className={`h-0.5 flex-1 mx-3 transition-colors ${currentStep > 1 ? 'bg-emerald-500' : 'bg-slate-200'}`} />

              {/* Step 2 */}
              <div
                onClick={() => currentStep > 2 && setCurrentStep(2)}
                className={`flex items-center gap-2 transition-all ${
                  currentStep >= 2 ? 'cursor-pointer' : 'cursor-default'
                } ${
                  currentStep === 2
                    ? 'text-blue-600 font-bold'
                    : currentStep > 2
                    ? 'text-emerald-600 font-semibold'
                    : 'text-slate-400 font-normal'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    currentStep === 2
                      ? 'bg-blue-600 text-white shadow-xs'
                      : currentStep > 2
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {currentStep > 2 ? <Check className="w-4 h-4" /> : '2'}
                </div>
                <span className="text-xs hidden sm:inline">Campaña & Empresa</span>
              </div>

              <div className={`h-0.5 flex-1 mx-3 transition-colors ${currentStep > 2 ? 'bg-emerald-500' : 'bg-slate-200'}`} />

              {/* Step 3 */}
              <div
                onClick={() => currentStep > 3 && setCurrentStep(3)}
                className={`flex items-center gap-2 transition-all ${
                  currentStep >= 3 ? 'cursor-pointer' : 'cursor-default'
                } ${
                  currentStep === 3
                    ? 'text-blue-600 font-bold'
                    : currentStep > 3
                    ? 'text-emerald-600 font-semibold'
                    : 'text-slate-400 font-normal'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    currentStep === 3
                      ? 'bg-blue-600 text-white shadow-xs'
                      : currentStep > 3
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {currentStep > 3 ? <Check className="w-4 h-4" /> : '3'}
                </div>
                <span className="text-xs hidden sm:inline">Circuito & Secuencia</span>
              </div>

              <div className={`h-0.5 flex-1 mx-3 transition-colors ${currentStep > 3 ? 'bg-emerald-500' : 'bg-slate-200'}`} />

              {/* Step 4 */}
              <div
                className={`flex items-center gap-2 ${
                  currentStep === 4 ? 'text-blue-600 font-bold' : 'text-slate-400 font-normal'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    currentStep === 4
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  4
                </div>
                <span className="text-xs hidden sm:inline">Resumen</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP CONTENT BODY (SCROLLABLE) */}
        <div className="p-6 overflow-y-auto flex-1 bg-[#fcfdfe]">
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 1: SELECCIÓN DE PLANTILLA O ENCUESTA BASE */}
          {/* ========================================================================= */}
          {currentStep === 1 && !createdCampaign && (
            <div className="space-y-4 animate-fade-in-slide">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Paso 1: Seleccione la Encuesta o Cuestionario Base
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Elija entre las plantillas oficiales preconfiguradas o un formulario personalizado
                  </p>
                </div>
                <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-md">
                  {forms.length} plantillas disponibles
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                {forms.map((form) => {
                  const isSelected = selectedFormId === form.id;
                  const isFPSICO = form.title.toLowerCase().includes('fpsico');
                  const isLIPS = form.title.toLowerCase().includes('lips');
                  const isEstres = form.title.toLowerCase().includes('estrés') || form.title.toLowerCase().includes('estres');
                  const isNocturno = form.title.toLowerCase().includes('nocturno');

                  return (
                    <div
                      key={form.id}
                      onClick={() => setSelectedFormId(form.id)}
                      className={`p-4 rounded-xl border text-left cursor-pointer transition-all relative ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-600/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold ${
                              isFPSICO
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : isLIPS
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : isEstres
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : isNocturno
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug line-clamp-1">
                              {form.title}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                              <span className="font-semibold text-slate-700">
                                {form.fields.length} preguntas / ítems
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {Math.max(5, Math.round(form.fields.length * 0.25))} min
                              </span>
                            </div>
                          </div>
                        </div>

                        {isSelected ? (
                          <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Check className="w-3 h-3" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-slate-300 shrink-0" />
                        )}
                      </div>

                      <p className="mt-2.5 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {form.description || 'Plantilla estandarizada de evaluación de factores de riesgo laboral.'}
                      </p>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">
                          {isFPSICO ? 'Oficial INSST • Exportación TXT' : isLIPS ? 'Batería Psicosocial LIPS' : 'Evaluación Ocupacional'}
                        </span>
                        <span className="text-blue-600 font-medium">
                          {isSelected ? 'Seleccionada' : 'Haga clic para elegir'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: DATOS DE LA CAMPAÑA & EMPRESA */}
          {/* ========================================================================= */}
          {currentStep === 2 && !createdCampaign && (
            <div className="space-y-5 max-w-2xl mx-auto animate-fade-in-slide">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Paso 2: Información de la Empresa y la Campaña
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Defina a qué empresa pertenece la evaluación y el código con el que accederán los colaboradores
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
                {/* Empresa Destino */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    Empresa Destino *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. CHAIDE Y CHAIDE S.A."
                    value={company}
                    onChange={(e) => handleCompanyChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Nombre oficial de la organización o cliente evaluado.
                  </p>
                </div>

                {/* Título de la Evaluación */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    Título de la Evaluación *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. CHAIDE Y CHAIDE - EVALUACIÓN PSICOSOCIAL 2026"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Título descriptivo con el que se identificará en informes y tablas.
                  </p>
                </div>

                {/* Código de Acceso (ID) & Trabajadores */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                      Código de Acceso (ID) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. CHAIDE-PSI-2026"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9\-_]/g, ''))}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 font-mono tracking-wider uppercase focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                    />
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-blue-600">
                      <Link2 className="w-3 h-3 shrink-0" />
                      <span className="truncate">/evaluar/{code || '[COD]'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      Trabajadores Esperados
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="100"
                      value={expectedParticipants}
                      onChange={(e) => setExpectedParticipants(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Para calcular el % de participación en tiempo real.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: ORDENAMIENTO & ENCADENAMIENTO DE CIRCUITO */}
          {/* ========================================================================= */}
          {currentStep === 3 && !createdCampaign && (
            <div className="space-y-5 max-w-2xl mx-auto animate-fade-in-slide">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Paso 3: Secuencia y Ordenamiento de Encuestas (Circuito)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Conecte esta evaluación con la siguiente encuesta para que el trabajador continúe automáticamente
                </p>
              </div>

              {/* Selector de Modo de Circuito */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div
                  onClick={() => {
                    setIsChained(false);
                    setNextEvaluationCode('');
                  }}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    !isChained
                      ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-600/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900">Encuesta Independiente</span>
                    {!isChained ? (
                      <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-slate-300" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Al terminar de responder, el trabajador verá la pantalla de agradecimiento y concluirá su proceso.
                  </p>
                </div>

                <div
                  onClick={() => {
                    setIsChained(true);
                    if (!nextEvaluationCode && existingCampaigns.length > 0) {
                      const candidate = existingCampaigns.find((c) => c.code !== code);
                      if (candidate) setNextEvaluationCode(candidate.code);
                    }
                  }}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    isChained
                      ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-600/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <GitMerge className="w-4 h-4 text-blue-600" />
                      Enlazar en Circuito Continuo
                    </span>
                    {isChained ? (
                      <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-slate-300" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Al finalizar, transiciona de inmediato a otra encuesta cargada sin volver a pedir código de trabajador.
                  </p>
                </div>
              </div>

              {/* Selector Visual de Encuestas Cargadas */}
              {isChained && (
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs animate-fade-in-slide">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Seleccione la Siguiente Encuesta a Responder *
                    </label>
                    <span className="text-[11px] text-blue-600 font-medium">
                      {existingCampaigns.filter((c) => c.code !== code).length} encuestas disponibles
                    </span>
                  </div>

                  {existingCampaigns.filter((c) => c.code !== code).length === 0 ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs leading-relaxed">
                      No hay otras evaluaciones cargadas en el sistema para encadenar todavía. Puede crear esta evaluación como independiente y luego encadenarla desde el listado.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <select
                        value={nextEvaluationCode}
                        onChange={(e) => setNextEvaluationCode(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                      >
                        <option value="" disabled>
                          -- Seleccione una encuesta del sistema --
                        </option>
                        {existingCampaigns
                          .filter((c) => c.code !== code)
                          .map((camp) => (
                            <option key={camp.id} value={camp.code}>
                              [{camp.code}] • {camp.company} - {camp.title}
                            </option>
                          ))}
                      </select>

                      {/* Visual Diagram of Flow */}
                      {selectedNextCampaign && (
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Flujo Automatizado de Respuesta
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center items-start gap-3">
                            <div className="px-3 py-2 bg-white border border-slate-200 rounded-lg shadow-xs flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-blue-600" />
                              <div>
                                <div className="text-xs font-bold text-slate-900 truncate max-w-[180px]">
                                  {code || 'NUEVA EVALUACIÓN'}
                                </div>
                                <div className="text-[10px] text-slate-400">Paso 1 del circuito</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 text-slate-400 font-bold px-2 py-1 bg-slate-100 rounded text-xs self-center">
                              <ArrowRight className="w-4 h-4 text-blue-600" />
                              <span className="text-[11px] text-slate-600">Pasa automáticamente</span>
                            </div>

                            <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg shadow-xs flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-600" />
                              <div>
                                <div className="text-xs font-bold text-blue-950 truncate max-w-[200px]">
                                  {selectedNextCampaign.title}
                                </div>
                                <div className="text-[10px] text-blue-600 font-mono">
                                  COD: {selectedNextCampaign.code} ({selectedNextCampaign.company})
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: RESUMEN Y CONFIRMACIÓN */}
          {/* ========================================================================= */}
          {currentStep === 4 && !createdCampaign && (
            <div className="space-y-5 max-w-2xl mx-auto animate-fade-in-slide">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Paso 4: Resumen y Confirmación de la Evaluación
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verifique los detalles antes de crear y habilitar el cuestionario
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs divide-y divide-slate-100">
                {/* Plantilla Base */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 font-semibold uppercase">Plantilla Base</div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900">
                        {selectedForm?.title}
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-md">
                    {selectedForm?.fields.length} preguntas
                  </span>
                </div>

                {/* Empresa & Título */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 font-semibold uppercase">Empresa Destino</div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900">{company}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{title}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400 uppercase">Trabajadores</div>
                    <div className="text-sm font-bold text-slate-800">{expectedParticipants}</div>
                  </div>
                </div>

                {/* Código de Acceso */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 font-semibold uppercase">Código de Acceso</div>
                      <div className="text-sm font-mono font-bold text-emerald-700 tracking-wider">
                        {code}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    /evaluar/{code}
                  </div>
                </div>

                {/* Circuito de Encadenamiento */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                      <GitMerge className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 font-semibold uppercase">Secuencia en Circuito</div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900">
                        {isChained && selectedNextCampaign
                          ? `Encadenada ➔ ${selectedNextCampaign.title}`
                          : 'Encuesta Única / Fin de Circuito'}
                      </div>
                      {isChained && selectedNextCampaign && (
                        <div className="text-xs text-purple-600 font-mono mt-0.5">
                          Siguiente COD: {selectedNextCampaign.code}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP POST-CREATION: SUCCESS SCREEN */}
          {/* ========================================================================= */}
          {createdCampaign && (
            <div className="max-w-lg mx-auto py-6 text-center space-y-5 animate-fade-in-slide">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  ¡Evaluación Creada con Éxito!
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  La evaluación ha quedado activa en el sistema y lista para recibir respuestas.
                </p>
              </div>

              {/* Link Box */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Enlace Directo para los Trabajadores:
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/evaluar/${createdCampaign.code}`}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors shadow-xs"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
                <a
                  href={`/evaluar/${createdCampaign.code}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Probar Evaluación en Vivo</span>
                </a>
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <span>Ir al Panel de Control</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM NAVIGATION FOOTER */}
        {!createdCampaign && (
          <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between">
            <div>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep((s) => s - 1)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Anterior</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>

              {currentStep < 4 ? (
                <button
                  type="button"
                  disabled={
                    (currentStep === 1 && !canProceedStep1) ||
                    (currentStep === 2 && !canProceedStep2) ||
                    (currentStep === 3 && !canProceedStep3)
                  }
                  onClick={() => setCurrentStep((s) => s + 1)}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <span>Continuar</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleCreateEvaluation}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Creando evaluación...</span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Lanzar Evaluación</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
