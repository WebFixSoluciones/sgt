import { NextRequest, NextResponse } from 'next/server';
import {
  getCampaignByCode,
  getFormById,
  getFormsForCampaign,
  getSubmission,
  getSubmissions,
  getNextOpenParticipantCode,
  saveSubmission,
  resetSubmission,
} from '@/lib/storage';
import { WorkerSubmission } from '@/lib/types';
import { getEcuadorISOString } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0].trim();
    if (first) return first;
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp.trim();
  return (req as any).ip || '127.0.0.1';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      action,
      evaluationCode,
      workerCode,
      answers,
      currentFormIndex,
      currentFieldIndex,
      currentSectionTitle,
      enteredCode,
      forceNew,
      clientWorkerCode,
    } = body;

    if (!evaluationCode) {
      return NextResponse.json(
        { success: false, error: 'Código de evaluación es requerido' },
        { status: 400 }
      );
    }

    const campaign = await getCampaignByCode(evaluationCode);
    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'La evaluación especificada no existe.' },
        { status: 404 }
      );
    }

    if (campaign.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Esta evaluación se encuentra inactiva actualmente. Comuníquese con su administrador.' },
        { status: 403 }
      );
    }

    const isOpenEval = Boolean(campaign.isOpenEvaluation);
    const forms = await getFormsForCampaign(campaign);
    const form = forms[0] || (campaign.formId ? await getFormById(campaign.formId) : null);
    if (!form) {
      return NextResponse.json(
        { success: false, error: 'Formulario vinculado no encontrado.' },
        { status: 404 }
      );
    }

    const clientIp = getClientIp(req);

    // ACTION: CHECK (Worker enters evaluation code or worker number)
    if (action === 'check') {
      if (isOpenEval) {
        // En modo abierto la URL es protegida: si o si debe ingresar el código de evaluación
        const inputCode = String(enteredCode || workerCode || '').trim().toUpperCase();
        if (!inputCode) {
          return NextResponse.json(
            { success: false, error: 'Por favor ingrese el Código de Evaluación.' },
            { status: 400 }
          );
        }
        if (inputCode !== campaign.code.trim().toUpperCase()) {
          return NextResponse.json(
            {
              success: false,
              error: 'El código de evaluación ingresado no coincide con esta evaluación. Verifíquelo e intente nuevamente.',
            },
            { status: 403 }
          );
        }

        // Si el usuario eligió iniciar una nueva evaluación
        if (forceNew) {
          const newWorkerCode = await getNextOpenParticipantCode(evaluationCode);
          const allQuestions = form.fields.filter((f) => f.type !== 'page_break' && f.type !== 'html' && f.type !== 'statement');
          return NextResponse.json({
            success: true,
            status: 'new',
            canResume: false,
            isOpenEvaluation: true,
            workerCode: newWorkerCode,
            clientIp,
            answeredCount: 0,
            totalQuestions: allQuestions.length,
            questionNumber: 1,
            currentFieldIndex: 0,
            currentSectionTitle: '',
            answers: {},
            form,
            forms,
            campaign,
          });
        }

        // Identificar si existe evaluación en curso para esta IP o identificador guardado
        const allSubmissions = await getSubmissions(evaluationCode);
        let existing: WorkerSubmission | null = null;

        const cleanClientWorkerCode = typeof clientWorkerCode === 'string' ? clientWorkerCode.trim().toUpperCase() : '';
        if (cleanClientWorkerCode) {
          existing = allSubmissions.find(
            (s) => s.workerCode.toUpperCase() === cleanClientWorkerCode && s.status === 'in_progress'
          ) || null;
        }

        if (!existing && clientIp) {
          const ipMatches = allSubmissions.filter(
            (s) => s.status === 'in_progress' && s.ip && (s.ip === clientIp || s.ip.includes(clientIp))
          );
          if (ipMatches.length > 0) {
            ipMatches.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            existing = ipMatches[0];
          }
        }

        if (existing) {
          const existingAnswers = existing.answers || {};
          const allQuestions = form.fields.filter((f) => f.type !== 'page_break' && f.type !== 'html' && f.type !== 'statement');
          const totalQuestions = allQuestions.length;

          const answeredCount = allQuestions.filter(
            (q) => existingAnswers[q.id] !== undefined && existingAnswers[q.id] !== null && String(existingAnswers[q.id]).trim() !== ''
          ).length;

          if (answeredCount > 0) {
            const firstUnansweredIndex = allQuestions.findIndex(
              (q) => existingAnswers[q.id] === undefined || existingAnswers[q.id] === null || String(existingAnswers[q.id]).trim() === ''
            );

            const questionNumber = firstUnansweredIndex >= 0 ? firstUnansweredIndex + 1 : totalQuestions;
            const targetQuestion = firstUnansweredIndex >= 0 ? allQuestions[firstUnansweredIndex] : allQuestions[totalQuestions - 1];
            const questionLabel = targetQuestion ? targetQuestion.label : '';
            const firstUnansweredFieldId = targetQuestion ? targetQuestion.id : null;

            let targetSectionIndex = 0;
            let targetSectionTitle = 'Información General';
            let secCounter = 0;
            let currentTitle = 'Información General';

            for (const field of form.fields) {
              if (field.type === 'page_break') {
                secCounter++;
                currentTitle = field.sectionTitle || field.label || `Sección ${secCounter + 1}`;
              } else if (firstUnansweredFieldId && field.id === firstUnansweredFieldId) {
                targetSectionIndex = secCounter;
                targetSectionTitle = currentTitle;
                break;
              }
            }

            if (!targetSectionTitle || (targetSectionIndex === 0 && existing.currentSectionTitle)) {
              targetSectionTitle = existing.currentSectionTitle || targetSectionTitle;
              targetSectionIndex = typeof existing.currentFieldIndex === 'number' ? existing.currentFieldIndex : targetSectionIndex;
            }

            return NextResponse.json({
              success: true,
              status: 'in_progress',
              canResume: true,
              isOpenEvaluation: true,
              workerCode: existing.workerCode,
              clientIp,
              answeredCount,
              totalQuestions,
              questionNumber,
              questionLabel,
              firstUnansweredFieldId,
              currentFieldIndex: targetSectionIndex,
              currentSectionTitle: targetSectionTitle,
              currentFormIndex: existing.currentFormIndex || 0,
              answers: existingAnswers,
              form,
              forms,
              campaign,
            });
          }
        }

        // Sin evaluación previa en progreso para esta IP -> Nueva participación
        const newWorkerCode = await getNextOpenParticipantCode(evaluationCode);
        const allQuestions = form.fields.filter((f) => f.type !== 'page_break' && f.type !== 'html' && f.type !== 'statement');
        return NextResponse.json({
          success: true,
          status: 'new',
          canResume: false,
          isOpenEvaluation: true,
          workerCode: newWorkerCode,
          clientIp,
          answeredCount: 0,
          totalQuestions: allQuestions.length,
          questionNumber: 1,
          currentFieldIndex: 0,
          currentSectionTitle: '',
          answers: {},
          form,
          forms,
          campaign,
        });
      }

      // Modalidad con Código de Trabajador
      const effectiveWorkerCode = typeof workerCode === 'string' ? workerCode.trim().toUpperCase() : '';
      if (!effectiveWorkerCode) {
        return NextResponse.json(
          { success: false, error: 'Código de trabajador es requerido' },
          { status: 400 }
        );
      }

      const existing = await getSubmission(evaluationCode, effectiveWorkerCode);

      if (existing) {
        // 1. Worker ALREADY COMPLETED -> Block access with the exact requested notice
        if (existing.status === 'completed') {
          return NextResponse.json({
            success: true,
            status: 'completed',
            alreadyExists: true,
            error: 'LA EVALUACIÓN CON COD DE TRABAJADOR YA EXISTE. Comuníquese con el Evaluador.',
            message: 'LA EVALUACIÓN CON COD DE TRABAJADOR YA EXISTE. Comuníquese con el Evaluador.',
            submission: existing,
            workerCode: effectiveWorkerCode,
            campaign,
          });
        }

        // 2. Worker IN PROGRESS with answers -> Calculate exact question stopped at
        const existingAnswers = existing.answers || {};
        const allQuestions = form.fields.filter((f) => f.type !== 'page_break' && f.type !== 'html' && f.type !== 'statement');
        const totalQuestions = allQuestions.length;

        const answeredCount = allQuestions.filter(
          (q) => existingAnswers[q.id] !== undefined && existingAnswers[q.id] !== null && String(existingAnswers[q.id]).trim() !== ''
        ).length;

        // Find the first unanswered question
        const firstUnansweredIndex = allQuestions.findIndex(
          (q) => existingAnswers[q.id] === undefined || existingAnswers[q.id] === null || String(existingAnswers[q.id]).trim() === ''
        );

        const questionNumber = firstUnansweredIndex >= 0 ? firstUnansweredIndex + 1 : totalQuestions;
        const targetQuestion = firstUnansweredIndex >= 0 ? allQuestions[firstUnansweredIndex] : allQuestions[totalQuestions - 1];
        const questionLabel = targetQuestion ? targetQuestion.label : '';
        const firstUnansweredFieldId = targetQuestion ? targetQuestion.id : null;

        // Find section containing this question
        let targetSectionIndex = 0;
        let targetSectionTitle = 'Información General';
        let secCounter = 0;
        let currentTitle = 'Información General';

        for (const field of form.fields) {
          if (field.type === 'page_break') {
            secCounter++;
            currentTitle = field.sectionTitle || field.label || `Sección ${secCounter + 1}`;
          } else if (firstUnansweredFieldId && field.id === firstUnansweredFieldId) {
            targetSectionIndex = secCounter;
            targetSectionTitle = currentTitle;
            break;
          }
        }

        if (!targetSectionTitle || targetSectionIndex === 0 && existing.currentSectionTitle) {
          targetSectionTitle = existing.currentSectionTitle || targetSectionTitle;
          targetSectionIndex = typeof existing.currentFieldIndex === 'number' ? existing.currentFieldIndex : targetSectionIndex;
        }

        return NextResponse.json({
          success: true,
          status: 'in_progress',
          canResume: answeredCount > 0,
          workerCode: effectiveWorkerCode,
          clientIp,
          answeredCount,
          totalQuestions,
          questionNumber,
          questionLabel,
          firstUnansweredFieldId,
          currentFieldIndex: targetSectionIndex,
          currentSectionTitle: targetSectionTitle,
          currentFormIndex: existing.currentFormIndex || 0,
          answers: existingAnswers,
          form,
          forms,
          campaign,
        });
      }

      // New worker session: Check if worker already has demographic answers (puesto, horario, antiguedad)
      // from URL params, body, or from a prior evaluation in the same company/group
      const inheritedAnswers: Record<string, string | number> = {};

      if (body.puesto) inheritedAnswers.puesto = String(body.puesto);
      if (body.horario) inheritedAnswers.horario = String(body.horario);
      if (body.antiguedad) inheritedAnswers.antiguedad = String(body.antiguedad);

      if (!inheritedAnswers.puesto) {
        try {
          const { getDatabase } = await import('@/lib/storage');
          const db = await getDatabase();
          const cleanWCode = effectiveWorkerCode.toUpperCase();
          const priorSub = db.submissions.find(
            (s) =>
              s.workerCode.trim().toUpperCase() === cleanWCode &&
              (s.answers?.['puesto'] || s.answers?.['agrupacion_puestos'])
          );
          if (priorSub && priorSub.answers) {
            if (priorSub.answers['puesto'] || priorSub.answers['agrupacion_puestos']) {
              inheritedAnswers.puesto = priorSub.answers['puesto'] || priorSub.answers['agrupacion_puestos'];
            }
            if (priorSub.answers['horario'] || priorSub.answers['horarios']) {
              inheritedAnswers.horario = priorSub.answers['horario'] || priorSub.answers['horarios'];
            }
            if (priorSub.answers['antiguedad']) {
              inheritedAnswers.antiguedad = priorSub.answers['antiguedad'];
            }
          }
        } catch (e) {}
      }

      const allQuestions = form.fields.filter((f) => f.type !== 'page_break' && f.type !== 'html' && f.type !== 'statement');
      return NextResponse.json({
        success: true,
        status: 'new',
        canResume: false,
        workerCode: effectiveWorkerCode,
        clientIp,
        answeredCount: Object.keys(inheritedAnswers).length,
        totalQuestions: allQuestions.length,
        questionNumber: 1,
        currentFieldIndex: 0,
        currentSectionTitle: '',
        answers: inheritedAnswers,
        form,
        forms,
        campaign,
      });
    }

    const effectiveWorkerCode = typeof workerCode === 'string' ? workerCode.trim().toUpperCase() : '';

    // ACTION: RESET (Worker chooses to restart from the beginning)
    if (action === 'reset') {
      const existing = await getSubmission(evaluationCode, effectiveWorkerCode);
      if (existing && existing.status === 'completed') {
        return NextResponse.json(
          {
            success: false,
            error: 'LA EVALUACIÓN CON COD DE TRABAJADOR YA EXISTE. No es posible reiniciar una evaluación ya finalizada. Comuníquese con el Evaluador.',
          },
          { status: 403 }
        );
      }

      const resetSub = await resetSubmission(evaluationCode, effectiveWorkerCode);
      return NextResponse.json({
        success: true,
        status: 'reset',
        workerCode: effectiveWorkerCode,
        submission: resetSub,
      });
    }

    // ACTION: SAVE DRAFT (Auto-save answers as the worker moves along)
    if (action === 'save_draft') {
      const existing = await getSubmission(evaluationCode, effectiveWorkerCode);
      if (existing && existing.status === 'completed') {
        return NextResponse.json(
          {
            success: false,
            error: 'LA EVALUACIÓN CON COD DE TRABAJADOR YA EXISTE. Comuníquese con el Evaluador.',
          },
          { status: 403 }
        );
      }

      const submission: WorkerSubmission = {
        id: existing ? existing.id : String(Math.floor(1000 + Math.random() * 9000)),
        evaluationCode: campaign.code,
        workerCode: effectiveWorkerCode,
        status: 'in_progress',
        currentFormIndex: typeof currentFormIndex === 'number' ? currentFormIndex : (existing?.currentFormIndex || 0),
        currentFieldIndex: typeof currentFieldIndex === 'number' ? currentFieldIndex : (existing?.currentFieldIndex || 0),
        currentSectionTitle: currentSectionTitle || existing?.currentSectionTitle || '',
        answers: { ...(existing?.answers || {}), ...(answers || {}) },
        ip: clientIp,
        userAgent: req.headers.get('user-agent') || 'Browser Client',
        startedAt: existing?.startedAt || getEcuadorISOString(),
        updatedAt: getEcuadorISOString(),
      };

      await saveSubmission(submission);
      return NextResponse.json({ success: true, workerCode: effectiveWorkerCode, submission });
    }

    // ACTION: COMPLETE (Final submission with STRICT validation)
    if (action === 'complete') {
      const existing = await getSubmission(evaluationCode, effectiveWorkerCode);
      if (existing && existing.status === 'completed') {
        return NextResponse.json(
          {
            success: false,
            error: 'LA EVALUACIÓN CON COD DE TRABAJADOR YA EXISTE. Comuníquese con el Evaluador.',
          },
          { status: 403 }
        );
      }

      // STRICT VALIDATION: ALL required questions must be answered to finalize
      const targetForms = forms.length > 0 ? forms : [form];
      const combinedAnswers = { ...(existing?.answers || {}), ...(answers || {}) };

      const missingRequiredQuestions: { formTitle: string; label: string; fieldId: string; order: number }[] = [];
      for (const f of targetForms) {
        for (const field of f.fields) {
          if (field.type !== 'page_break' && field.type !== 'html' && field.type !== 'statement' && field.required) {
            const val = combinedAnswers[field.id];
            if (val === undefined || val === null || String(val).trim() === '') {
              missingRequiredQuestions.push({
                formTitle: f.title,
                label: field.label,
                fieldId: field.id,
                order: field.order,
              });
            }
          }
        }
      }

      if (missingRequiredQuestions.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Para finalizar la evaluación es obligatorio responder todas las preguntas. Faltan ${missingRequiredQuestions.length} pregunta(s) por responder.`,
            missingCount: missingRequiredQuestions.length,
            missingQuestions: missingRequiredQuestions.slice(0, 10),
            firstMissingFieldId: missingRequiredQuestions[0].fieldId,
          },
          { status: 400 }
        );
      }

      // Mark as completed
      const submission: WorkerSubmission = {
        id: existing ? existing.id : String(Math.floor(1000 + Math.random() * 9000)),
        evaluationCode: campaign.code,
        workerCode: effectiveWorkerCode,
        status: 'completed',
        currentFormIndex: typeof currentFormIndex === 'number' ? currentFormIndex : 0,
        currentFieldIndex: typeof currentFieldIndex === 'number' ? currentFieldIndex : (existing?.currentFieldIndex || 0),
        currentSectionTitle: 'Finalizado',
        answers: combinedAnswers,
        ip: clientIp,
        userAgent: req.headers.get('user-agent') || 'Browser Client',
        startedAt: existing?.startedAt || getEcuadorISOString(),
        updatedAt: getEcuadorISOString(),
        completedAt: getEcuadorISOString(),
      };

      await saveSubmission(submission);

      // Check chained evaluation in group
      const nextEvaluationCode = campaign.nextEvaluationCode;
      let nextEvaluationTitle: string | null = null;
      if (nextEvaluationCode) {
        try {
          const nextCamp = await getCampaignByCode(nextEvaluationCode);
          if (nextCamp) {
            nextEvaluationTitle = nextCamp.title;
          }
        } catch (e) {
          console.warn('[SESIONES] Error getting next evaluation title:', e);
        }
      }

      return NextResponse.json({
        success: true,
        status: 'completed',
        currentEvaluationTitle: campaign.title,
        nextEvaluationCode: nextEvaluationCode || null,
        nextEvaluationTitle: nextEvaluationTitle || null,
        message: nextEvaluationCode
          ? `Evaluación completada. Pasando a la siguiente evaluación: ${nextEvaluationTitle || nextEvaluationCode}...`
          : 'USTED HA COMPLETADO SATISFACTORIAMENTE SU EVALUACIÓN.',
      });
    }

    return NextResponse.json({ success: false, error: 'Acción inválida' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
