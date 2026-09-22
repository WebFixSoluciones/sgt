import { NextRequest, NextResponse } from 'next/server';
import {
  getCampaignByCode,
  getFormById,
  getFormsForCampaign,
  getSubmission,
  saveSubmission,
  resetSubmission,
} from '@/lib/storage';
import { WorkerSubmission } from '@/lib/types';
import { getEcuadorISOString } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    } = body;

    if (!evaluationCode || !workerCode) {
      return NextResponse.json(
        { success: false, error: 'Código de evaluación y código de trabajador son requeridos' },
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

    const forms = await getFormsForCampaign(campaign);
    const form = forms[0] || (campaign.formId ? await getFormById(campaign.formId) : null);
    if (!form) {
      return NextResponse.json(
        { success: false, error: 'Formulario vinculado no encontrado.' },
        { status: 404 }
      );
    }

    // ACTION: CHECK (Worker enters evaluation code and worker number)
    if (action === 'check') {
      const existing = await getSubmission(evaluationCode, workerCode);

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
            campaign,
          });
        }

        // 2. Worker IN PROGRESS with answers -> Calculate exact question stopped at
        const existingAnswers = existing.answers || {};
        const allQuestions = form.fields.filter((f) => f.type !== 'page_break');
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

      // New worker session
      const allQuestions = form.fields.filter((f) => f.type !== 'page_break');
      return NextResponse.json({
        success: true,
        status: 'new',
        canResume: false,
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

    // ACTION: RESET (Worker chooses to restart from the beginning)
    if (action === 'reset') {
      const existing = await getSubmission(evaluationCode, workerCode);
      if (existing && existing.status === 'completed') {
        return NextResponse.json(
          {
            success: false,
            error: 'LA EVALUACIÓN CON COD DE TRABAJADOR YA EXISTE. No es posible reiniciar una evaluación ya finalizada. Comuníquese con el Evaluador.',
          },
          { status: 403 }
        );
      }

      const resetSub = await resetSubmission(evaluationCode, workerCode);
      return NextResponse.json({
        success: true,
        status: 'reset',
        submission: resetSub,
      });
    }

    // ACTION: SAVE DRAFT (Auto-save answers as the worker moves along)
    if (action === 'save_draft') {
      const existing = await getSubmission(evaluationCode, workerCode);
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
        workerCode: workerCode.trim(),
        status: 'in_progress',
        currentFormIndex: typeof currentFormIndex === 'number' ? currentFormIndex : (existing?.currentFormIndex || 0),
        currentFieldIndex: typeof currentFieldIndex === 'number' ? currentFieldIndex : (existing?.currentFieldIndex || 0),
        currentSectionTitle: currentSectionTitle || existing?.currentSectionTitle || '',
        answers: { ...(existing?.answers || {}), ...(answers || {}) },
        ip: req.headers.get('x-forwarded-for') || req.ip || '181.199.58.217',
        userAgent: req.headers.get('user-agent') || 'Browser Client',
        startedAt: existing?.startedAt || getEcuadorISOString(),
        updatedAt: getEcuadorISOString(),
      };

      await saveSubmission(submission);
      return NextResponse.json({ success: true, submission });
    }

    // ACTION: COMPLETE (Final submission with STRICT validation)
    if (action === 'complete') {
      const existing = await getSubmission(evaluationCode, workerCode);
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
          if (field.type !== 'page_break' && field.required) {
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
        workerCode: workerCode.trim(),
        status: 'completed',
        currentFormIndex: typeof currentFormIndex === 'number' ? currentFormIndex : 0,
        currentFieldIndex: typeof currentFieldIndex === 'number' ? currentFieldIndex : (existing?.currentFieldIndex || 0),
        currentSectionTitle: 'Finalizado',
        answers: combinedAnswers,
        ip: req.headers.get('x-forwarded-for') || req.ip || '181.199.58.217',
        userAgent: req.headers.get('user-agent') || 'Browser Client',
        startedAt: existing?.startedAt || getEcuadorISOString(),
        updatedAt: getEcuadorISOString(),
        completedAt: getEcuadorISOString(),
      };

      await saveSubmission(submission);

      // Check chained evaluation in group
      const nextEvaluationCode = campaign.nextEvaluationCode;

      return NextResponse.json({
        success: true,
        status: 'completed',
        nextEvaluationCode: nextEvaluationCode || null,
        message: nextEvaluationCode
          ? 'Evaluación completada. Pasando a la siguiente evaluación...'
          : 'USTED HA COMPLETADO SATISFACTORIAMENTE SU EVALUACIÓN.',
      });
    }

    return NextResponse.json({ success: false, error: 'Acción inválida' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
