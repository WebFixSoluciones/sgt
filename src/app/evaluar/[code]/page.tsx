'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  Building2,
  User,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Check,
  AlertCircle,
  Loader2,
  HelpCircle,
  Sparkles,
  GitMerge,
} from 'lucide-react';
import { EvaluationCampaign, FormSchema, FormField } from '@/lib/types';
import ResumePromptModal from '@/components/worker/ResumePromptModal';
import CompletedNotice from '@/components/worker/CompletedNotice';
import ConfirmDialog, { DialogType } from '@/components/common/ConfirmDialog';

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
  const [formsList, setFormsList] = useState<FormSchema[]>([]);
  const [activeFormIndex, setActiveFormIndex] = useState(0);
  const [nextCampaignTitle, setNextCampaignTitle] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Chained URL tracking
  const fromChain = searchParams.get('from_chain') === '1';
  const prevTitle = searchParams.get('prev_title') || '';

  // Worker Session State
  const [workerCode, setWorkerCode] = useState(searchParams.get('worker') || '');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSubmittingCheck, setIsSubmittingCheck] = useState(false);

  // Status flags
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [completedData, setCompletedData] = useState<any>(null);
  const [checkError, setCheckError] = useState<string | null>(null);

  // Resume state
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeData, setResumeData] = useState<{
    questionNumber: number;
    answeredCount: number;
    totalQuestions: number;
    questionLabel: string;
    currentSectionTitle: string;
    targetSectionIndex: number;
    firstUnansweredFieldId: string | null;
  } | null>(null);

  // Active survey state
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isFinalSubmitting, setIsFinalSubmitting] = useState(false);
  const [surveyCompletedSuccess, setSurveyCompletedSuccess] = useState(false);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [validationNotice, setValidationNotice] = useState<string | null>(null);

  // Clear, High-Clarity Transition Modals (Single source of truth for step changes)
  const [chainTransition, setChainTransition] = useState<{
    completedTitle: string;
    nextCode: string;
    nextTitle: string;
    workerCode: string;
    puestoLabel: string;
    redirectUrl: string;
    countdown: number;
  } | null>(null);

  const [formTransition, setFormTransition] = useState<{
    completedTitle: string;
    nextTitle: string;
    nextIndex: number;
    totalForms: number;
    countdown: number;
  } | null>(null);

  // Modern Centered Alert Dialog
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    type?: DialogType;
    title: string;
    message: string;
    confirmText?: string;
  } | null>(null);

  const showAlert = (
    title: string,
    message: string,
    type: DialogType = 'warning',
    confirmText: string = 'Entendido'
  ) => {
    setAlertDialog({
      isOpen: true,
      type,
      title,
      message,
      confirmText,
    });
  };

  // Countdown timer for chained evaluation transition
  useEffect(() => {
    if (!chainTransition) return;
    if (chainTransition.countdown <= 0) {
      router.push(chainTransition.redirectUrl);
      return;
    }
    const timer = setInterval(() => {
      setChainTransition((prev) => {
        if (!prev) return null;
        if (prev.countdown <= 1) {
          router.push(prev.redirectUrl);
          return null;
        }
        return { ...prev, countdown: prev.countdown - 1 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [chainTransition, router]);

  // Countdown timer for multi-form transition
  useEffect(() => {
    if (!formTransition) return;
    if (formTransition.countdown <= 0) {
      setActiveFormIndex(formTransition.nextIndex);
      setCurrentSectionIndex(0);
      setActiveFieldId(null);
      setFormTransition(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const timer = setInterval(() => {
      setFormTransition((prev) => {
        if (!prev) return null;
        if (prev.countdown <= 1) {
          setActiveFormIndex(prev.nextIndex);
          setCurrentSectionIndex(0);
          setActiveFieldId(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return null;
        }
        return { ...prev, countdown: prev.countdown - 1 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [formTransition]);

  // 1. Fetch Campaign & Form Schema
  useEffect(() => {
    if (!code) return;
    const fetchCampaignData = async () => {
      try {
        setPageLoading(true);
        const res = await fetch(`/api/evaluaciones/${code}?track=1`, { cache: 'no-store' });
        const data = await res.json();
        if (data.success) {
          setCampaign(data.data.campaign);
          const loadedForms = data.data.forms || (data.data.form ? [data.data.form] : []);
          setFormsList(loadedForms);
          setForm(loadedForms[0] || data.data.form);
          if (data.data.nextCampaignTitle) {
            setNextCampaignTitle(data.data.nextCampaignTitle);
          }
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

  const activeForm = formsList[activeFormIndex] || form;

  // Clean form title for worker view (stripping redundant company name in parentheses)
  const displayFormTitle = useMemo(() => {
    if (!activeForm?.title) return 'Cuestionario';
    let clean = activeForm.title;
    if (campaign?.company) {
      const escaped = campaign.company.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      clean = clean.replace(new RegExp(`\\s*\\(${escaped}\\)\\s*$`, 'i'), '');
    }
    clean = clean.replace(/\s*\([^)]*\)\s*$/, (m) => {
      if (/oficial|insst/i.test(m)) return m;
      return '';
    });
    return clean.trim() || activeForm.title;
  }, [activeForm?.title, campaign?.company]);

  // 2. Build Sections based on 'page_break' fields
  const sections: Section[] = useMemo(() => {
    if (!activeForm || !activeForm.fields) return [];
    const secList: Section[] = [];
    let currentSec: Section = {
      title: 'Información General',
      fields: [],
    };

    // If campaign has configured puestos, inject into puesto / agrupacion_puestos field options
    const effectiveFields = activeForm.fields.map((f) => {
      if ((f.id === 'puesto' || f.id === 'agrupacion_puestos') && campaign?.puestos && campaign.puestos.length > 0) {
        return {
          ...f,
          options: campaign.puestos.map((pName, pIdx) => {
            const matchNum = pName.match(/^(\d+)\.\s*(.+)$/);
            const val = matchNum ? matchNum[1] : String(pIdx + 1);
            const lbl = matchNum ? pName : `${pIdx + 1}. ${pName}`;
            return {
              id: `p_${val}`,
              value: val,
              label: lbl,
            };
          }),
        };
      }
      return f;
    });

    const isDemographicField = (id: string) =>
      ['puesto', 'agrupacion_puestos', 'horario', 'horarios', 'antiguedad'].includes(id.toLowerCase());

    for (const field of effectiveFields) {
      if (field.type === 'page_break') {
        if (currentSec.fields.length > 0) {
          secList.push(currentSec);
        }
        currentSec = {
          title: field.sectionTitle || field.label || `Sección ${secList.length + 1}`,
          fields: [],
        };
      } else {
        // If we are on form 2, 3... AND this demographic field was already answered, don't ask again!
        const alreadyAnswered =
          answers[field.id] !== undefined &&
          answers[field.id] !== null &&
          String(answers[field.id]).trim() !== '';

        if (activeFormIndex > 0 && isDemographicField(field.id) && alreadyAnswered) {
          continue; // Automatically carried over from Form 1
        }

        currentSec.fields.push(field);
      }
    }

    if (currentSec.fields.length > 0) {
      secList.push(currentSec);
    }

    return secList;
  }, [activeForm, campaign, activeFormIndex, answers]);

  // Lookup readable label for the selected puesto
  const selectedPuestoLabel = useMemo(() => {
    const raw = answers['puesto'] || answers['agrupacion_puestos'];
    if (raw === undefined || raw === null || raw === '' || raw === '-') return null;
    const strVal = String(raw).trim();

    if (campaign?.puestos && campaign.puestos.length > 0) {
      const num = parseInt(strVal, 10);
      if (!isNaN(num) && campaign.puestos[num - 1]) {
        return campaign.puestos[num - 1];
      }
      const found = campaign.puestos.find(
        (p, idx) => p === strVal || String(idx + 1) === strVal || p.toLowerCase().includes(strVal.toLowerCase())
      );
      if (found) return found;
    }

    for (const f of formsList) {
      const pField = f.fields?.find((field) => field.id === 'puesto' || field.id === 'agrupacion_puestos');
      if (pField && pField.options) {
        const opt = pField.options.find(
          (o) => String(o.value).trim() === strVal || o.label.toLowerCase() === strVal.toLowerCase()
        );
        if (opt) return opt.label;
      }
    }

    return `Puesto ${strVal}`;
  }, [answers, campaign, formsList]);

  // 3. Worker Check / Login
  const handleWorkerCheck = async (targetCode?: string) => {
    const codeToTest = (targetCode || workerCode).trim().toUpperCase();
    if (!codeToTest) {
      setCheckError('Por favor ingrese su Código de Trabajador.');
      return;
    }
    setCheckError(null);

    // Read URL query params for carried-over demographics from chained evaluation
    const urlPuesto = searchParams.get('puesto');
    const urlHorario = searchParams.get('horario');
    const urlAntiguedad = searchParams.get('antiguedad');

    try {
      setIsSubmittingCheck(true);
      const res = await fetch('/api/sesiones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check',
          evaluationCode: code,
          workerCode: codeToTest,
          puesto: urlPuesto || undefined,
          horario: urlHorario || undefined,
          antiguedad: urlAntiguedad || undefined,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setCheckError(data.error || 'Error al validar el código.');
        return;
      }

      // If worker already completed this evaluation -> Lock and show exact blocked notice
      if (data.status === 'completed' || data.alreadyExists) {
        setCompletedData(data.submission);
        setWorkerCode(codeToTest);
        setAlreadyCompleted(true);
        return;
      }

      const mergedAnswers = {
        ...(urlPuesto ? { puesto: urlPuesto } : {}),
        ...(urlHorario ? { horario: urlHorario } : {}),
        ...(urlAntiguedad ? { antiguedad: urlAntiguedad } : {}),
        ...(data.answers || {}),
      };

      // If worker in progress with answers -> Prompt with exact question number
      if (data.canResume) {
        setAnswers(mergedAnswers);
        setResumeData({
          questionNumber: data.questionNumber || 1,
          answeredCount: data.answeredCount || 0,
          totalQuestions: data.totalQuestions || 0,
          questionLabel: data.questionLabel || '',
          currentSectionTitle: data.currentSectionTitle || '',
          targetSectionIndex: data.currentFieldIndex || 0,
          firstUnansweredFieldId: data.firstUnansweredFieldId || null,
        });
        setShowResumeModal(true);
      } else {
        setAnswers(mergedAnswers);
        setCurrentSectionIndex(0);
        setIsLoggedIn(true);
      }
    } catch (e) {
      console.error(e);
      setCheckError('Error al verificar sesión. Por favor intente nuevamente.');
    } finally {
      setIsSubmittingCheck(false);
    }
  };

  // Auto-login if worker code is in query string (from chained group)
  useEffect(() => {
    const workerParam = searchParams.get('worker');
    if (workerParam && form && !isLoggedIn && !isSubmittingCheck && !alreadyCompleted) {
      handleWorkerCheck(workerParam);
    }
  }, [searchParams, form]);

  // Save & Resume: Continue from where worker stopped
  const handleContinueSaved = () => {
    setShowResumeModal(false);
    const targetSec = resumeData?.targetSectionIndex ?? 0;
    setCurrentSectionIndex(Math.min(targetSec, Math.max(0, sections.length - 1)));
    setIsLoggedIn(true);

    // Smooth scroll and highlight the exact pending question
    if (resumeData?.firstUnansweredFieldId) {
      const fieldId = resumeData.firstUnansweredFieldId;
      setActiveFieldId(fieldId);
      setTimeout(() => {
        const el = document.getElementById(`field-${fieldId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  };

  // Save & Resume: Reset to start from question 1
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
      setActiveFieldId(null);
      setShowResumeModal(false);
      setIsLoggedIn(true);
    } catch (e) {
      console.error(e);
      showAlert('Error al reiniciar', 'No fue posible reiniciar la evaluación en este momento.', 'danger');
    }
  };

  // Non-blocking Debounced Draft Auto-save
  const draftTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerAutoSave = useCallback(
    (updatedAnswers: Record<string, string | number>, targetSectionIdx: number) => {
      if (!code || !workerCode) return;
      setIsSavingDraft(true);

      fetch('/api/sesiones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_draft',
          evaluationCode: code,
          workerCode,
          answers: updatedAnswers,
          currentFormIndex: activeFormIndex,
          currentFieldIndex: targetSectionIdx,
          currentSectionTitle: sections[targetSectionIdx]?.title || '',
        }),
      })
        .catch((err) => console.warn('[AUTO-SAVE] Background notice:', err))
        .finally(() => {
          setIsSavingDraft(false);
        });
    },
    [code, workerCode, activeFormIndex, sections]
  );

  const scheduleAutoSave = useCallback(
    (updatedAnswers: Record<string, string | number>, targetSectionIdx: number) => {
      if (draftTimerRef.current) {
        clearTimeout(draftTimerRef.current);
      }
      draftTimerRef.current = setTimeout(() => {
        triggerAutoSave(updatedAnswers, targetSectionIdx);
      }, 500); // 500ms debounce: allows instant UI clicks without event loop lag
    },
    [triggerAutoSave]
  );

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (draftTimerRef.current) {
        clearTimeout(draftTimerRef.current);
      }
    };
  }, []);

  // Handle Answer Selection - 100% Synchronous, Instant UI (< 1ms execution, 0 INP lag)
  const handleSelectAnswer = (fieldId: string, value: string | number) => {
    const updatedAnswers = { ...answers, [fieldId]: value };
    // 1. Instant local state updates
    setAnswers(updatedAnswers);
    setActiveFieldId(fieldId);
    setValidationNotice(null);

    // 2. Schedule non-blocking background auto-save (debounced)
    scheduleAutoSave(updatedAnswers, currentSectionIndex);

    // 3. Smooth auto-advance to next unanswered question in current section
    const currentFields = sections[currentSectionIndex]?.fields || [];
    const currentIndex = currentFields.findIndex((f) => f.id === fieldId);
    if (currentIndex !== -1) {
      const nextUnanswered = currentFields.slice(currentIndex + 1).find((f) => {
        return f.type !== 'html' && (updatedAnswers[f.id] === undefined || updatedAnswers[f.id] === null || updatedAnswers[f.id] === '');
      });
      if (nextUnanswered) {
        setTimeout(() => {
          const el = document.getElementById(`field-${nextUnanswered.id}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setActiveFieldId(nextUnanswered.id);
          }
        }, 120);
      }
    }
  };

  // Navigation: Next Section
  const handleNextSection = () => {
    // Validate required fields in current section
    const currentFields = sections[currentSectionIndex]?.fields || [];
    const firstMissing = currentFields.find(
      (f) => f.type !== 'html' && f.required && (answers[f.id] === undefined || answers[f.id] === null || String(answers[f.id]).trim() === '')
    );

    if (firstMissing) {
      setValidationNotice(`Pregunta requerida pendiente: "${firstMissing.label}"`);
      setActiveFieldId(firstMissing.id);
      const el = document.getElementById(`field-${firstMissing.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    if (currentSectionIndex < sections.length - 1) {
      const nextIndex = currentSectionIndex + 1;
      setCurrentSectionIndex(nextIndex);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setActiveFieldId(null);
      setValidationNotice(null);

      // Flush pending auto-save immediately to record the section advance
      if (draftTimerRef.current) {
        clearTimeout(draftTimerRef.current);
      }
      triggerAutoSave(answers, nextIndex);
    }
  };

  // Navigation: Previous Section
  const handlePrevSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setActiveFieldId(null);
      setValidationNotice(null);
    }
  };

  // Final Submit with STRICT validation
  const handleFinalSubmit = async () => {
    // 1. COMPREHENSIVE VALIDATION: Check that ALL required questions in the active form are answered
    const missingInActiveForm: { field: FormField; sectionIdx: number; sectionTitle: string }[] = [];

    sections.forEach((sec, sIdx) => {
      sec.fields.forEach((f) => {
        if (f.type !== 'page_break' && f.type !== 'html' && f.required) {
          const val = answers[f.id];
          if (val === undefined || val === null || String(val).trim() === '') {
            missingInActiveForm.push({ field: f, sectionIdx: sIdx, sectionTitle: sec.title });
          }
        }
      });
    });

    if (missingInActiveForm.length > 0) {
      const firstMissing = missingInActiveForm[0];
      setValidationNotice(`Pregunta requerida pendiente: "${firstMissing.field.label}"`);
      setActiveFieldId(firstMissing.field.id);

      // If missing question is in another section, jump straight to that section!
      if (currentSectionIndex !== firstMissing.sectionIdx) {
        setCurrentSectionIndex(firstMissing.sectionIdx);
      }

      setTimeout(() => {
        const el = document.getElementById(`field-${firstMissing.field.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 200);

      showAlert(
        'Preguntas requeridas pendientes',
        `Para finalizar la evaluación es obligatorio responder todas las preguntas.\n\nAún faltan ${missingInActiveForm.length} pregunta(s) por responder. Le hemos situado en la primera pregunta pendiente.`,
        'warning',
        'Continuar respondiendo'
      );
      return;
    }

    // 2. If this evaluation contains multiple forms and there are more forms pending:
    if (activeFormIndex < formsList.length - 1) {
      try {
        setIsSavingDraft(true);
        await fetch('/api/sesiones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'save_draft',
            evaluationCode: code,
            workerCode,
            answers,
            currentFormIndex: activeFormIndex + 1,
            currentFieldIndex: 0,
            currentSectionTitle: formsList[activeFormIndex + 1]?.title || 'Siguiente Formulario',
          }),
        });

        const completedFormTitle = activeForm?.title || `Cuestionario ${activeFormIndex + 1}`;
        const nextFormTitle = formsList[activeFormIndex + 1]?.title || `Cuestionario ${activeFormIndex + 2}`;

        setFormTransition({
          completedTitle: completedFormTitle,
          nextTitle: nextFormTitle,
          nextIndex: activeFormIndex + 1,
          totalForms: formsList.length,
          countdown: 4,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setIsSavingDraft(false);
      }
      return;
    }

    // 3. Final submission with server-side validation
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
          currentFormIndex: activeFormIndex,
          currentFieldIndex: currentSectionIndex,
          currentSectionTitle: 'Finalizado',
        }),
      });

      const data = await res.json();
      if (!data.success) {
        if (data.firstMissingFieldId) {
          setActiveFieldId(data.firstMissingFieldId);
          const el = document.getElementById(`field-${data.firstMissingFieldId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
        showAlert(
          'Validación de cuestionario',
          data.error || 'Asegúrese de haber completado todas las preguntas requeridas para poder finalizar.',
          'warning',
          'Revisar preguntas'
        );
        return;
      }

      // Check Chained Evaluation in Group!
      if (data.nextEvaluationCode) {
        const pVal = encodeURIComponent(String(answers['puesto'] || answers['agrupacion_puestos'] || ''));
        const hVal = encodeURIComponent(String(answers['horario'] || answers['horarios'] || ''));
        const aVal = encodeURIComponent(String(answers['antiguedad'] || ''));
        const nextTitle = data.nextEvaluationTitle || nextCampaignTitle || data.nextEvaluationCode;
        const currentCampTitle = campaign?.title || 'Evaluación Actual';
        const redirectUrl = `/evaluar/${data.nextEvaluationCode}?worker=${encodeURIComponent(workerCode)}&puesto=${pVal}&horario=${hVal}&antiguedad=${aVal}&from_chain=1&prev_title=${encodeURIComponent(currentCampTitle)}`;

        setChainTransition({
          completedTitle: currentCampTitle,
          nextCode: data.nextEvaluationCode,
          nextTitle,
          workerCode,
          puestoLabel: selectedPuestoLabel || 'Asignado',
          redirectUrl,
          countdown: 5,
        });
      } else {
        setSurveyCompletedSuccess(true);
      }
    } catch (err) {
      console.error(err);
      showAlert(
        'Error de conexión',
        'Ocurrió un error en el servidor al enviar la evaluación. Por favor intente nuevamente.',
        'danger'
      );
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
          completedAt={completedData?.completedAt}
          onResetWorkerCode={() => {
            setAlreadyCompleted(false);
            setWorkerCode('');
            setIsLoggedIn(false);
            setCheckError(null);
          }}
        />
      </div>
    );
  }

  // State: Chain Transition (Between different linked campaigns)
  if (chainTransition) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-3">
            <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-base shadow-xs">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <div className="w-16 h-1 bg-emerald-200 rounded-full" />
            <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-xs animate-pulse">
              2
            </div>
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold uppercase tracking-wider">
              ¡Evaluación Completada con Éxito!
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
              Has finalizado:
            </h2>
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 font-bold text-sm sm:text-base">
              "{chainTransition.completedTitle}"
            </div>
          </div>

          {/* Siguiente Evaluación en Cadena */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50/70 border-2 border-blue-200 rounded-2xl p-5 text-left space-y-2.5 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Siguiente Evaluación del Circuito:</span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
              {chainTransition.nextTitle}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tus datos ya fueron asignados automáticamente para esta nueva evaluación:
            </p>
            <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
              <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-800 shadow-2xs">
                COD: {chainTransition.workerCode}
              </span>
              {chainTransition.puestoLabel && (
                <span className="px-2.5 py-1 bg-emerald-100 border border-emerald-300 rounded-lg font-bold text-emerald-900 shadow-2xs">
                  {chainTransition.puestoLabel}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <button
              type="button"
              onClick={() => router.push(chainTransition.redirectUrl)}
              className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group"
            >
              <span>Comenzar Ahora: {chainTransition.nextTitle}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-xs text-slate-400">
              Avanzando automáticamente en <span className="font-bold text-slate-700">{chainTransition.countdown}</span> segundos...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // State: Form Transition (Between forms within the same evaluation)
  if (formTransition) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto border border-blue-200 shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold uppercase tracking-wider">
              ¡Cuestionario Completado!
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Has finalizado:
            </h2>
            <div className="p-3 bg-slate-100 rounded-2xl text-slate-800 font-semibold text-sm">
              "{formTransition.completedTitle}"
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-2xl p-5 text-left space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 uppercase tracking-wider">
              <ArrowRight className="w-4 h-4 text-indigo-600" />
              <span>A continuación ({formTransition.nextIndex + 1} de {formTransition.totalForms}):</span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              {formTransition.nextTitle}
            </h3>
            <p className="text-xs text-slate-600">
              Evaluación en curso: <strong>{campaign.title}</strong>
            </p>
          </div>

          <div className="space-y-3 pt-1">
            <button
              type="button"
              onClick={() => {
                setActiveFormIndex(formTransition.nextIndex);
                setCurrentSectionIndex(0);
                setActiveFieldId(null);
                setFormTransition(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>Comenzar: {formTransition.nextTitle}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-xs text-slate-400">
              Continuando automáticamente en <span className="font-bold text-slate-700">{formTransition.countdown}</span> segundos...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // State: Final Success Confirmation
  if (surveyCompletedSuccess) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-emerald-200 rounded-2xl p-8 text-center space-y-5 shadow-sm">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <span className="inline-block px-3 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[11px] font-bold uppercase tracking-wider">
              Evaluación Finalizada
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              ¡Evaluación Completada con Éxito!
            </h2>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-left space-y-1.5 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Evaluación:</span>
                <span className="font-bold text-slate-900 text-sm">{campaign?.title || 'Evaluación'}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-600 font-medium">Empresa: {campaign?.company || ''}</span>
                <span className="font-mono font-bold text-slate-800">COD: {workerCode}</span>
              </div>
              {selectedPuestoLabel && (
                <div className="pt-1 border-t border-slate-200 text-emerald-800 font-semibold">
                  Puesto: {selectedPuestoLabel}
                </div>
              )}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed pt-1">
              Muchas gracias por su valiosa colaboración. Sus respuestas han sido registradas de forma
              segura para el programa de prevención laboral.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => router.push('/')}
              className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
            >
              Finalizar y salir
            </button>
          </div>
        </div>
      </div>
    );
  }

  // State: Step 1 - Worker Login
  if (!isLoggedIn) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        {showResumeModal && resumeData && (
          <ResumePromptModal
            questionNumber={resumeData.questionNumber}
            answeredCount={resumeData.answeredCount}
            totalQuestions={resumeData.totalQuestions}
            questionLabel={resumeData.questionLabel}
            currentSectionTitle={resumeData.currentSectionTitle}
            onContinue={handleContinueSaved}
            onReset={handleResetSession}
          />
        )}

        <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
          {/* Header with SGT Logo */}
          <div className="border-b border-slate-100 pb-4 text-center">
            <div className="flex justify-center mb-3">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                <img
                  src="/logo-sgt.jpg"
                  alt="SGT Corp. Prevención S.A."
                  className="h-12 w-auto object-contain"
                />
              </div>
            </div>
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

          {checkError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{checkError}</span>
            </div>
          )}

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
                  onChange={(e) => {
                    setWorkerCode(e.target.value.toUpperCase());
                    setCheckError(null);
                  }}
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

        {alertDialog && (
          <ConfirmDialog
            isOpen={alertDialog.isOpen}
            type={alertDialog.type}
            title={alertDialog.title}
            message={alertDialog.message}
            confirmText={alertDialog.confirmText}
            cancelText={null}
            onConfirm={() => setAlertDialog(null)}
          />
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // Step 2: Survey Form Renderer (Assisted Sections with Enfoque Activo)
  // -------------------------------------------------------------
  const currentSection = sections[currentSectionIndex];
  const progressPercent = Math.round(((currentSectionIndex + 1) / Math.max(sections.length, 1)) * 100);

  const currentSectionFields = currentSection?.fields || [];
  const currentSectionQuestions = currentSectionFields.filter((f) => f.type !== 'html');
  const currentSectionTotal = currentSectionQuestions.length;
  const currentSectionAnswered = currentSectionQuestions.filter(
    (f) => answers[f.id] !== undefined && answers[f.id] !== ''
  ).length;
  const currentSectionPending = currentSectionTotal - currentSectionAnswered;
  const allRequiredAnswered = currentSectionFields.every(
    (f) => f.type === 'html' || !f.required || (answers[f.id] !== undefined && answers[f.id] !== '')
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Resume modal if triggered */}
      {showResumeModal && resumeData && (
        <ResumePromptModal
          questionNumber={resumeData.questionNumber}
          answeredCount={resumeData.answeredCount}
          totalQuestions={resumeData.totalQuestions}
          questionLabel={resumeData.questionLabel}
          currentSectionTitle={resumeData.currentSectionTitle}
          onContinue={handleContinueSaved}
          onReset={handleResetSession}
        />
      )}

      {/* Top Clean Sticky Progress Header con Título de Evaluación destacado */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-8 py-3">
        <div className="max-w-6xl xl:max-w-7xl w-full mx-auto">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src="/logo-sgt.jpg"
                alt="SGT"
                className="h-8 w-auto object-contain hidden sm:block shrink-0"
              />
              <div className="flex flex-col min-w-0">
                {/* Badges superiores: Empresa + Trabajador + Cuestionario */}
                <div className="flex items-center gap-2 flex-wrap text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-blue-700 flex items-center gap-1">
                    <Building2 className="w-3 h-3 shrink-0" />
                    <span className="truncate max-w-[200px]">{campaign.company}</span>
                  </span>
                  {workerCode && (
                    <span className="text-slate-600 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                      ID: {workerCode}
                    </span>
                  )}
                  {formsList.length > 1 && (
                    <span className="text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 shrink-0">
                      Cuestionario {activeFormIndex + 1} de {formsList.length}
                    </span>
                  )}
                </div>

                {/* TÍTULO PRINCIPAL DE LA EVALUACIÓN */}
                <h1 className="text-sm sm:text-base font-extrabold text-slate-900 truncate leading-tight mt-0.5" title={campaign.title}>
                  {campaign.title}
                </h1>

                {/* Sub-línea: Cuestionario actual, Sección y Puesto Asignado */}
                <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500 mt-0.5">
                  <span className="font-semibold text-slate-700 truncate max-w-[320px]" title={displayFormTitle}>
                    {displayFormTitle}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-600 truncate max-w-[240px]">
                    {currentSection?.title || 'Preguntas'}
                  </span>
                  {selectedPuestoLabel && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="text-emerald-700 font-semibold truncate flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="truncate max-w-[220px]">Puesto: {selectedPuestoLabel}</span>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {isSavingDraft && (
                <span className="text-[11px] text-slate-400 hidden sm:inline-flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin text-blue-600" /> Guardando...
                </span>
              )}
              <div className="text-right">
                <span className="text-xs sm:text-sm font-black text-blue-600 font-mono">
                  {progressPercent}%
                </span>
                <span className="block text-[9px] text-slate-400 uppercase font-medium">Completado</span>
              </div>
            </div>
          </div>

          {/* Slim clean progress line */}
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main Wide Evaluation Body: Clean question flow */}
      <main className="flex-1 max-w-6xl xl:max-w-7xl w-full mx-auto px-4 sm:px-8 md:px-12 py-6 sm:py-8 animate-fade-in-slide">
        {/* Banner si viene de una evaluación previa en cadena */}
        {fromChain && (
          <div className="mb-5 p-3.5 bg-purple-50/80 border border-purple-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-purple-900 animate-in fade-in slide-in-from-top-2 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
              <div>
                <span className="font-bold">Continuando circuito de evaluación en cadena:</span>
                {prevTitle ? (
                  <span className="ml-1 text-purple-800">
                    Has completado con éxito <strong>"{prevTitle}"</strong>. Ahora te encuentras en <strong>"{campaign.title}"</strong>.
                  </span>
                ) : (
                  <span className="ml-1 text-purple-800">
                    Tus respuestas anteriores se guardaron correctamente.
                  </span>
                )}
              </div>
            </div>
            <span className="px-2.5 py-0.5 bg-purple-200/60 text-purple-900 rounded-full text-[10px] font-bold uppercase shrink-0">
              Paso Siguiente
            </span>
          </div>
        )}

        <div className="divide-y divide-slate-100">
          {currentSection?.fields.map((field) => {
            // RENDER: Bloque de Contenido HTML (Informativo / Instrucciones / Tablas)
            if (field.type === 'html') {
              return (
                <div
                  key={field.id}
                  id={`field-${field.id}`}
                  className="py-5 first:pt-2 last:pb-6"
                >
                  {field.label && field.label.trim() !== '' && field.label !== 'Bloque HTML' && field.label !== 'Instrucciones / Contenido Informativo' && (
                    <h2 className="text-sm sm:text-base font-bold text-slate-800 mb-2 leading-snug">
                      {field.label}
                    </h2>
                  )}
                  {field.description && (
                    <p className="mb-2 text-xs text-slate-500 leading-relaxed">{field.description}</p>
                  )}
                  <div
                    className="prose prose-sm sm:prose max-w-none text-slate-800 leading-relaxed overflow-x-auto"
                    dangerouslySetInnerHTML={{ __html: field.htmlContent || '' }}
                  />
                </div>
              );
            }

            const currentValue = answers[field.id];
            const isAnswered = currentValue !== undefined && currentValue !== '';

            return (
              <div
                key={field.id}
                id={`field-${field.id}`}
                className={`py-6 first:pt-2 last:pb-8 transition-all rounded-xl px-2 sm:px-3 ${
                  activeFieldId === field.id
                    ? 'ring-2 ring-blue-500/40 bg-blue-50/20'
                    : ''
                }`}
              >
                {/* Question Label */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h2 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
                    {field.label} {field.required && <span className="text-rose-500">*</span>}
                  </h2>

                  {isAnswered && (
                    <span className="text-emerald-600 shrink-0 mt-0.5" title="Respondida">
                      <Check className="w-4 h-4" />
                    </span>
                  )}
                </div>

                {field.description && (
                  <p className="mb-3 text-xs text-slate-500 leading-relaxed">{field.description}</p>
                )}

                {/* Radio Options Grid */}
                {field.type === 'radio' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
                    {field.options?.map((opt) => {
                      const isSelected = String(currentValue) === String(opt.value);
                      return (
                        <button
                          type="button"
                          key={opt.id}
                          onClick={() => handleSelectAnswer(field.id, opt.value)}
                          className={`p-3 rounded-lg border text-left text-xs sm:text-sm font-medium transition-all duration-150 flex items-center justify-between ${
                            isSelected
                              ? 'bg-blue-50/90 border-blue-600 text-blue-950 font-semibold ring-1 ring-blue-600 shadow-xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <span className="leading-snug pointer-events-none">{opt.label}</span>
                          <span
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-2.5 pointer-events-none ${
                              isSelected
                                ? 'border-blue-600 bg-blue-600 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white pointer-events-none" />}
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
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
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
                      placeholder="Escriba aquí sus observaciones o consideraciones..."
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
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
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* Guided Sticky Bottom Control Bar */}
      <footer className="sticky bottom-0 z-20 bg-white/95 backdrop-blur-sm border-t border-slate-200 py-3.5 px-4 sm:px-8">
        <div className="max-w-6xl xl:max-w-7xl w-full mx-auto flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handlePrevSection}
            disabled={currentSectionIndex === 0}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs sm:text-sm font-medium rounded-lg transition-colors inline-flex items-center gap-1.5 disabled:opacity-30 disabled:pointer-events-none"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Anterior</span>
          </button>

          {/* Dynamic Status / Validation Notice */}
          <div className="text-center text-xs text-slate-500 font-medium">
            {validationNotice ? (
              <span className="text-rose-600 font-semibold">{validationNotice}</span>
            ) : (
              <span>
                Respondidas: <strong className="text-slate-800">{currentSectionAnswered}</strong> de {currentSectionTotal}
              </span>
            )}
          </div>

          {currentSectionIndex < sections.length - 1 ? (
            <button
              type="button"
              onClick={handleNextSection}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors inline-flex items-center gap-2 shadow-xs"
            >
              <span>Siguiente Sección</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : activeFormIndex < formsList.length - 1 ? (
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={isSavingDraft}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors inline-flex items-center gap-2 shadow-xs disabled:opacity-50"
            >
              {isSavingDraft ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Cargando...</span>
                </>
              ) : (
                <>
                  <span>
                    Siguiente Cuestionario ({activeFormIndex + 2} de {formsList.length}): {formsList[activeFormIndex + 1]?.title}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={isFinalSubmitting}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors inline-flex items-center gap-2 shadow-xs disabled:opacity-50"
            >
              {isFinalSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : campaign?.nextEvaluationCode ? (
                <>
                  <span>
                    Finalizar y Continuar Circuito ({nextCampaignTitle || 'Siguiente Evaluación'})
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Finalizar Evaluación</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </footer>

      {alertDialog && (
        <ConfirmDialog
          isOpen={alertDialog.isOpen}
          type={alertDialog.type}
          title={alertDialog.title}
          message={alertDialog.message}
          confirmText={alertDialog.confirmText}
          cancelText={null}
          onConfirm={() => setAlertDialog(null)}
        />
      )}
    </div>
  );
}
