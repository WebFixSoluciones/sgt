'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
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
  ShieldCheck,
  AlertCircle,
  PlusCircle,
  Edit,
  ChevronDown,
  RotateCcw,
  Briefcase,
  ArrowUp,
  ArrowDown,
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

const DEFAULT_PUESTOS = [
  '1. DIRECCIÓN / GERENCIA',
  '2. ADMINISTRACIÓN / FINANZAS',
  '3. COMERCIAL / VENTAS',
  '4. COORDINADORES / SUPERVISORES',
  '5. OPERACIONES / PLANTA',
  '6. LOGÍSTICA / BODEGA',
  '7. SERVICIO TÉCNICO / MANTENIMIENTO',
  '28. PRODUCCIÓN LÍNEA CONTINUA',
];

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
  const [selectedFormIds, setSelectedFormIds] = useState<string[]>([]);
  const [selectedCompanyFormId, setSelectedCompanyFormId] = useState<string>('');
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [expectedParticipants, setExpectedParticipants] = useState('100');
  const [puestosText, setPuestosText] = useState(DEFAULT_PUESTOS.join('\n'));
  const [showPuestosCustomizer, setShowPuestosCustomizer] = useState(false);
  
  // Chaining configuration
  const [isChained, setIsChained] = useState(false);
  const [nextEvaluationCode, setNextEvaluationCode] = useState('');
  
  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdCampaign, setCreatedCampaign] = useState<EvaluationCampaign | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Helper to distinguish master templates from company-specific forms
  const isMasterTemplate = (f: FormSchema) => {
    return f.isTemplate !== false && (!f.company || f.company.trim() === '');
  };

  // Master templates only (displayed in Step 1 cards grid)
  const templateForms = useMemo(() => {
    return forms.filter(isMasterTemplate);
  }, [forms]);

  // Company-specific forms (displayed in copy-from-company dropdown)
  const companyForms = useMemo(() => {
    return forms.filter((f) => !isMasterTemplate(f));
  }, [forms]);

  // Selected company form object
  const selectedCompanyForm = useMemo(() => {
    if (!selectedCompanyFormId) return null;
    return companyForms.find((f) => f.id === selectedCompanyFormId) || null;
  }, [companyForms, selectedCompanyFormId]);

  // Prepopulate or initialize
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const initialFormIds = initialData.formIds && initialData.formIds.length > 0
          ? initialData.formIds
          : (initialData.formId ? [initialData.formId] : (forms[0]?.id ? [forms[0].id] : []));
        setSelectedFormIds(initialFormIds);

        // Check if initial form is a company form
        const isComp = companyForms.some((cf) => initialFormIds.includes(cf.id));
        if (isComp && initialFormIds[0]) {
          setSelectedCompanyFormId(initialFormIds[0]);
        } else {
          setSelectedCompanyFormId('');
        }

        setCompany(initialData.company || '');
        setTitle(initialData.title || '');
        setCode(initialData.code || '');
        setExpectedParticipants(String(initialData.expectedParticipants || 100));
        if (initialData.puestos && initialData.puestos.length > 0) {
          setPuestosText(initialData.puestos.join('\n'));
        } else {
          setPuestosText(DEFAULT_PUESTOS.join('\n'));
        }
        if (initialData.nextEvaluationCode) {
          setIsChained(true);
          setNextEvaluationCode(initialData.nextEvaluationCode);
        } else {
          setIsChained(false);
          setNextEvaluationCode('');
        }
      } else {
        const defaultTemplateId = forms.find(isMasterTemplate)?.id || forms[0]?.id;
        setSelectedFormIds(defaultTemplateId ? [defaultTemplateId] : []);
        setSelectedCompanyFormId('');
        setCompany('');
        setTitle('');
        setCode('');
        setExpectedParticipants('100');
        setPuestosText(DEFAULT_PUESTOS.join('\n'));
        setShowPuestosCustomizer(false);
        setIsChained(false);
        setNextEvaluationCode('');
      }
      setCurrentStep(1);
      setCreatedCampaign(null);
      setErrorMsg('');
      setCopiedLink(false);
    }
  }, [isOpen, initialData, forms, companyForms]);

  const toggleFormSelection = (id: string) => {
    // If a company form was previously selected, clear it and select this master template
    if (selectedCompanyFormId) {
      setSelectedCompanyFormId('');
      setSelectedFormIds([id]);
      return;
    }

    setSelectedFormIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // Keep at least one selected
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectCompanyForm = (formId: string) => {
    if (!formId) {
      handleClearCompanyForm();
      return;
    }
    setSelectedCompanyFormId(formId);
    setSelectedFormIds([formId]);
  };

  const handleClearCompanyForm = () => {
    setSelectedCompanyFormId('');
    const defaultTemplateId = forms.find(isMasterTemplate)?.id || forms[0]?.id;
    if (defaultTemplateId) {
      setSelectedFormIds([defaultTemplateId]);
    }
  };

  // Selected forms objects (maintains user-defined sequence order)
  const selectedForms = useMemo(() => {
    return selectedFormIds
      .map((id) => forms.find((f) => f.id === id))
      .filter((f): f is FormSchema => Boolean(f));
  }, [forms, selectedFormIds]);

  const moveFormUp = (index: number) => {
    if (index <= 0) return;
    setSelectedFormIds((prev) => {
      const updated = [...prev];
      const temp = updated[index - 1];
      updated[index - 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
  };

  const moveFormDown = (index: number) => {
    if (index >= selectedFormIds.length - 1) return;
    setSelectedFormIds((prev) => {
      const updated = [...prev];
      const temp = updated[index + 1];
      updated[index + 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
  };

  const totalQuestions = useMemo(() => {
    return selectedForms.reduce((acc, f) => acc + (f.fields?.filter((field) => field.type !== 'page_break').length || 0), 0);
  }, [selectedForms]);

  // Primary selected form
  const selectedForm = selectedForms[0] || forms[0];

  // Selected next campaign object (for visual chaining preview)
  const selectedNextCampaign = useMemo(() => {
    if (!nextEvaluationCode) return null;
    return existingCampaigns.find((c) => c.code === nextEvaluationCode) || null;
  }, [existingCampaigns, nextEvaluationCode]);

  // Auto-generate title and code suggestions when company changes
  const handleCompanyChange = (val: string) => {
    setCompany(val);
    if (!initialData) {
      const cleanCompany = val.trim();
      if (cleanCompany) {
        if (!title || title.startsWith('EVALUACIÓN') || title.includes(' - ')) {
          setTitle(`EVALUACIÓN INTEGRAL ${cleanCompany.toUpperCase()} 2026`);
        }
        if (!code) {
          const compSlug = cleanCompany
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .substring(0, 8);
          setCode(`${compSlug}-2026`);
        }
      }
    }
  };

  if (!isOpen || !mounted) return null;

  // Step 1 Validation
  const canProceedStep1 = selectedFormIds.length > 0;

  // Step 2 Validation
  const canProceedStep2 = Boolean(
    company.trim() && title.trim() && code.trim() && Number(expectedParticipants) > 0
  );

  // Step 3 Validation: If multiple forms selected, it is ALWAYS chained and ready to proceed!
  const isMultiForm = selectedFormIds.length > 1;
  const canProceedStep3 = isMultiForm || !isChained || (isChained && Boolean(nextEvaluationCode));

  // Handler to create
  const handleCreateEvaluation = async () => {
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const cleanPuestos = puestosText
        .split('\n')
        .map((p) => p.trim())
        .filter(Boolean);

      const payload = {
        title: title.trim(),
        code: code.trim().toUpperCase(),
        formId: selectedFormIds[0] || '',
        formIds: selectedFormIds,
        company: company.trim(),
        expectedParticipants: parseInt(expectedParticipants) || 100,
        nextEvaluationCode: isChained ? nextEvaluationCode.trim().toUpperCase() : '',
        puestos: cleanPuestos.length > 0 ? cleanPuestos : undefined,
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

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-4xl overflow-hidden flex flex-col max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-2.5rem)] my-auto animate-fade-in-slide">
        
        {/* TOP HEADER: Clean Stepper & Progress */}
        <div className="px-5 sm:px-6 py-3 sm:py-3.5 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Asistente de Creación de Evaluación
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            title="Cerrar asistente"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP PROGRESS BAR */}
        {!createdCampaign && (
          <div className="bg-slate-50/80 border-b border-slate-100 px-4 sm:px-6 py-2 sm:py-2.5 shrink-0">
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
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 bg-[#fcfdfe]">
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 1: SELECCIÓN DE PLANTILLAS O FORMULARIOS QUE COMPONEN LA EVALUACIÓN */}
          {/* ========================================================================= */}
          {currentStep === 1 && !createdCampaign && (
            <div className="space-y-3.5 animate-fade-in-slide">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Seleccione una plantilla o formulario
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Elige el cuestionario base para esta evaluación.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg shrink-0">
                    {selectedFormIds.length} seleccionado(s)
                  </span>
                  <Link
                    href="/admin/formularios/nuevo"
                    onClick={() => onClose()}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-slate-50 text-blue-600 hover:text-blue-700 border border-slate-300 hover:border-blue-400 rounded-lg text-xs font-bold transition-all shadow-xs shrink-0"
                    title="Crear una nueva plantilla personalizada en el constructor"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
                    <span>Crear Formulario Nuevo</span>
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {templateForms.map((form) => {
                  const isSelected = !selectedCompanyFormId && selectedFormIds.includes(form.id);

                  return (
                    <div
                      key={form.id}
                      onClick={() => toggleFormSelection(form.id)}
                      className={`p-3.5 sm:p-4 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-600/30 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {form.title}
                          </h4>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            Plantilla Oficial
                          </span>
                        </div>
                      </div>

                      {isSelected ? (
                        <div className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-md border border-slate-300 shrink-0 hover:border-slate-400" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Sección: Copiar cuestionario de una empresa existente */}
              {companyForms.length > 0 && (
                <div className="mt-4 pt-3.5 border-t border-slate-100">
                  <div
                    className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                      selectedCompanyFormId
                        ? 'bg-blue-50/40 border-blue-200 ring-1 ring-blue-500/20 shadow-xs'
                        : 'bg-slate-50/70 border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2.5">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>¿Deseas copiar de una empresa?</span>
                      </label>
                      <span className="text-[11px] text-slate-500">
                        Selecciona un formulario existente adaptado para otra empresa
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <div className="relative flex-1">
                        <select
                          value={selectedCompanyFormId}
                          onChange={(e) => handleSelectCompanyForm(e.target.value)}
                          className={`w-full appearance-none bg-white border rounded-lg px-3.5 py-2 text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-1 pr-9 transition-colors ${
                            selectedCompanyFormId
                              ? 'border-blue-500 ring-1 ring-blue-500/30'
                              : 'border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:ring-blue-600'
                          }`}
                        >
                          <option value="">-- Seleccionar formulario de una empresa --</option>
                          {companyForms.map((cf) => (
                            <option key={cf.id} value={cf.id}>
                              {cf.company ? `[${cf.company}] ` : ''}{cf.title}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </div>

                      {selectedCompanyFormId && (
                        <button
                          type="button"
                          onClick={handleClearCompanyForm}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors shrink-0"
                          title="Descartar y volver a las plantillas estándar"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                          <span>Volver a plantilla base</span>
                        </button>
                      )}
                    </div>

                    {selectedCompanyForm && (
                      <div className="mt-3 pt-2.5 border-t border-blue-100/80 flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 text-blue-900 min-w-0">
                          <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="truncate">
                            Formulario asignado:{' '}
                            <strong className="font-bold text-slate-900">
                              {selectedCompanyForm.title}
                            </strong>
                            {selectedCompanyForm.company && (
                              <span className="text-blue-700 ml-1 font-medium">
                                ({selectedCompanyForm.company})
                              </span>
                            )}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-blue-600 text-white rounded-md shrink-0">
                          Copiado de Empresa
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: DATOS DE LA CAMPAÑA & EMPRESA */}
          {/* ========================================================================= */}
          {currentStep === 2 && !createdCampaign && (
            <div className="space-y-4 max-w-2xl mx-auto animate-fade-in-slide">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Paso 2: Información de la Empresa y la Campaña
                </h3>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3.5 shadow-xs">
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
                  </div>
                </div>

                {/* Puestos de Trabajo de la Empresa */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                      Puestos de Trabajo de la Empresa
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPuestosCustomizer(!showPuestosCustomizer)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                    >
                      {showPuestosCustomizer ? 'Reducir vista' : 'Personalizar puestos'}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed mb-2.5">
                    El trabajador seleccionará su puesto una sola vez y se asignará automáticamente a todos los formularios conectados y evaluaciones en cadena.
                  </p>

                  <div className="space-y-2">
                    <textarea
                      rows={showPuestosCustomizer ? 7 : 3}
                      value={puestosText}
                      onChange={(e) => setPuestosText(e.target.value)}
                      placeholder="Ingrese un puesto por línea..."
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors font-mono leading-relaxed resize-y bg-slate-50/50"
                    />

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>
                        {
                          puestosText
                            .split('\n')
                            .map((p) => p.trim())
                            .filter(Boolean).length
                        }{' '}
                        puestos configurados (un puesto por línea)
                      </span>
                      <button
                        type="button"
                        onClick={() => setPuestosText(DEFAULT_PUESTOS.join('\n'))}
                        className="text-blue-600 hover:underline transition-colors font-medium"
                      >
                        Restablecer estándar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: ORDENAMIENTO & ENCADENAMIENTO DE CIRCUITO */}
          {/* ========================================================================= */}
          {currentStep === 3 && !createdCampaign && (
            <div className="space-y-4 max-w-2xl mx-auto animate-fade-in-slide">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Paso 3: Secuencia y Circuito de Encuestas
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedForms.length > 1
                    ? `Ha seleccionado ${selectedForms.length} plantillas: se ejecutarán en cadena continua automáticamente.`
                    : 'Configure si esta evaluación es independiente o se conectará con otra al finalizar.'}
                </p>
              </div>

              {selectedForms.length > 1 ? (
                /* CASO A: MÚLTIPLES PLANTILLAS SELECCIONADAS -> CADENA CONTINUA AUTOMÁTICA */
                <div className="space-y-4">
                  {/* Banner Destacado de Cadena Continua Automática */}
                  <div className="p-4 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 border border-blue-200 rounded-2xl flex items-start gap-3.5 shadow-2xs">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <GitMerge className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-blue-950">
                          Cadena Multiformulario Activa Automáticamente
                        </h4>
                        <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-[10px] font-bold">
                          {selectedForms.length} CUESTIONARIOS
                        </span>
                      </div>
                      <p className="text-xs text-blue-800/90 mt-1 leading-relaxed">
                        Al haber seleccionado <strong>{selectedForms.length} plantillas</strong>, la evaluación se ejecutará de forma encadenada. Cuando el trabajador termine el Cuestionario 1, avanzará de inmediato al Cuestionario 2 y Cuestionario 3 sin pedirle nuevamente su código ni su puesto de trabajo.
                      </p>
                    </div>
                  </div>

                  {/* Lista Ordenable de Cuestionarios en la Cadena */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-blue-600" />
                        <span>Orden de Ejecución de los Cuestionarios</span>
                      </label>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Use las flechas para cambiar el orden
                      </span>
                    </div>

                    <div className="space-y-2">
                      {selectedForms.map((f, i) => {
                        const qCount = f.fields?.filter((field) => field.type !== 'page_break').length || 0;
                        return (
                          <div
                            key={f.id}
                            className="p-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl flex items-center justify-between gap-3 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                                {i + 1}
                              </span>
                              <div className="min-w-0">
                                <h5 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                  {f.title}
                                </h5>
                                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                  <span>{qCount} preguntas</span>
                                  {f.category && (
                                    <>
                                      <span>•</span>
                                      <span className="capitalize">{f.category}</span>
                                    </>
                                  )}
                                  {i === 0 ? (
                                    <span className="text-blue-600 font-semibold">• Primer cuestionario (Captura puesto)</span>
                                  ) : (
                                    <span className="text-emerald-600 font-semibold">• Hereda puesto automáticamente</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Controles de Reordenamiento */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                disabled={i === 0}
                                onClick={() => moveFormUp(i)}
                                title="Mover hacia arriba"
                                className="p-1.5 bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 rounded-lg text-xs font-semibold transition-colors disabled:opacity-30 disabled:pointer-events-none"
                              >
                                <ArrowUp className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                disabled={i === selectedForms.length - 1}
                                onClick={() => moveFormDown(i)}
                                title="Mover hacia abajo"
                                className="p-1.5 bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 rounded-lg text-xs font-semibold transition-colors disabled:opacity-30 disabled:pointer-events-none"
                              >
                                <ArrowDown className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Diagrama de Flujo Continuo */}
                    <div className="pt-3 border-t border-slate-100">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Flujo Automatizado para el Trabajador
                      </div>
                      <div className="flex items-center flex-wrap gap-2 text-xs">
                        {selectedForms.map((f, i) => (
                          <React.Fragment key={f.id}>
                            <div className="px-2.5 py-1.5 bg-blue-50 border border-blue-200 rounded-lg font-bold text-blue-900 text-xs">
                              {i + 1}. {f.title.length > 25 ? `${f.title.substring(0, 22)}...` : f.title}
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          </React.Fragment>
                        ))}
                        <div className="px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg font-bold text-emerald-900 text-xs flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Finalización</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Opción Avanzada Opcional: Enlazar con otra campaña externa al finalizar todos */}
                  <div className="pt-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-600 hover:text-slate-900">
                      <input
                        type="checkbox"
                        checked={isChained}
                        onChange={(e) => {
                          setIsChained(e.target.checked);
                          if (!e.target.checked) setNextEvaluationCode('');
                          else if (!nextEvaluationCode && existingCampaigns.length > 0) {
                            const candidate = existingCampaigns.find((c) => c.code !== code);
                            if (candidate) setNextEvaluationCode(candidate.code);
                          }
                        }}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span>Enlazar también con OTRA campaña externa existente al terminar estos {selectedForms.length} cuestionarios (Opcional)</span>
                    </label>

                    {isChained && (
                      <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-fade-in-slide">
                        {existingCampaigns.filter((c) => c.code !== code).length === 0 ? (
                          <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 p-3 rounded-lg">
                            No hay otras evaluaciones cargadas en el sistema para enlazar. La evaluación concluirá al terminar el último cuestionario de la lista.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                              Seleccione la campaña externa posterior:
                            </label>
                            <select
                              value={nextEvaluationCode}
                              onChange={(e) => setNextEvaluationCode(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white focus:outline-none focus:border-blue-600"
                            >
                              <option value="" disabled>-- Seleccione una campaña --</option>
                              {existingCampaigns
                                .filter((c) => c.code !== code)
                                .map((camp) => (
                                  <option key={camp.id} value={camp.code}>
                                    [{camp.code}] • {camp.company} - {camp.title}
                                  </option>
                                ))}
                            </select>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* CASO B: SOLO 1 PLANTILLA SELECCIONADA */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                          Enlazar con otra Evaluación Externa
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
                        Al finalizar este cuestionario, transiciona de inmediato a otra evaluación cargada sin volver a pedir código.
                      </p>
                    </div>
                  </div>

                  {isChained && (
                    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs animate-fade-in-slide">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Seleccione la Siguiente Evaluación a Responder *
                        </label>
                        <span className="text-[11px] text-blue-600 font-medium">
                          {existingCampaigns.filter((c) => c.code !== code).length} evaluaciones disponibles
                        </span>
                      </div>

                      {existingCampaigns.filter((c) => c.code !== code).length === 0 ? (
                        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs leading-relaxed space-y-2">
                          <p>
                            No hay otras evaluaciones cargadas en el sistema para encadenar todavía.
                          </p>
                          <p className="text-amber-900 font-medium">
                            💡 Si desea crear una evaluación encadenada con varios cuestionarios, regrese al <strong>Paso 1</strong> y seleccione 2 o más plantillas (ej. F-PSICO 4.0 + Estrés Laboral). Se encadenarán automáticamente.
                          </p>
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => setCurrentStep(1)}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                              <span>Volver al Paso 1 y Seleccionar Múltiples Plantillas</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <select
                            value={nextEvaluationCode}
                            onChange={(e) => setNextEvaluationCode(e.target.value)}
                            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                          >
                            <option value="" disabled>-- Seleccione una encuesta del sistema --</option>
                            {existingCampaigns
                              .filter((c) => c.code !== code)
                              .map((camp) => (
                                <option key={camp.id} value={camp.code}>
                                  [{camp.code}] • {camp.company} - {camp.title}
                                </option>
                              ))}
                          </select>
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
            <div className="space-y-4 max-w-2xl mx-auto animate-fade-in-slide">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Paso 4: Resumen y Confirmación de la Evaluación
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verifique los detalles antes de crear y habilitar el cuestionario
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs divide-y divide-slate-100">
                {/* Formularios Asignados */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                      Formularios que Componen la Evaluación ({selectedForms.length})
                    </div>
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                      {totalQuestions} preguntas en total
                    </span>
                  </div>
                  <div className="space-y-2">
                    {selectedForms.map((f, i) => (
                      <div key={f.id} className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-md bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">
                            {i + 1}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-slate-800">
                            {f.title}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 font-medium">
                          {f.fields?.filter(field => field.type !== 'page_break').length || 0} preguntas
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-2.5 p-2.5 bg-blue-50/60 border border-blue-100 rounded-lg text-[11px] text-blue-700 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                    <span>
                      Se duplicarán automáticamente <strong>{selectedForms.length} formulario(s) nuevos para {company || 'esta empresa'}</strong>, listos para personalizar sin alterar las plantillas maestras.
                    </span>
                  </div>
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
                          : (selectedForms.length > 1
                              ? `Cadena Continua (${selectedForms.length} cuestionarios en secuencia)`
                              : 'Encuesta Única / Fin de Circuito')}
                      </div>
                      {isChained && selectedNextCampaign && (
                        <div className="text-xs text-purple-600 font-mono mt-0.5">
                          Siguiente COD: {selectedNextCampaign.code}
                        </div>
                      )}
                      {selectedForms.length > 1 && !isChained && (
                        <div className="text-xs text-blue-600 font-medium mt-0.5">
                          Ejecución consecutiva de {selectedForms.length} cuestionarios sin reingreso de datos
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Puestos de Trabajo */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 font-semibold uppercase">Puestos de Trabajo</div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900">
                        {puestosText.split('\n').map((p) => p.trim()).filter(Boolean).length} puestos configurados
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Asignación única automática para todos los formularios
                      </div>
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
                {createdCampaign.formId && (
                  <Link
                    href={`/admin/formularios/${createdCampaign.formId}`}
                    onClick={() => onClose()}
                    className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
                    title="Editar puestos de trabajo o preguntas específicas de esta empresa"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Personalizar Puestos y Preguntas</span>
                  </Link>
                )}

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
          <div className="px-5 sm:px-6 py-3 sm:py-3.5 border-t border-slate-100 bg-white flex items-center justify-between shrink-0">
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
    </div>,
    document.body
  );
}
