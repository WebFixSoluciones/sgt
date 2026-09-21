import { NextRequest, NextResponse } from 'next/server';
import {
  getCampaignByCode,
  getFormById,
  getSubmission,
  saveSubmission,
  resetSubmission,
} from '@/lib/storage';
import { WorkerSubmission } from '@/lib/types';
import { getEcuadorISOString } from '@/lib/date-utils';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, evaluationCode, workerCode, answers, currentFieldIndex, currentSectionTitle } = body;

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

    const targetFormId = campaign.formId || (campaign.formIds && campaign.formIds[0]) || '';
    const form = targetFormId ? await getFormById(targetFormId) : null;
    if (!form) {
      return NextResponse.json(
        { success: false, error: 'Formulario vinculado no encontrado.' },
        { status: 404 }
      );
    }

    // ACTION: CHECK (Initial worker login)
    if (action === 'check') {
      const existing = await getSubmission(evaluationCode, workerCode);

      if (existing) {
        if (existing.status === 'completed') {
          return NextResponse.json({
            success: true,
            status: 'completed',
            message: 'USTED YA COMPLETÓ SU EVALUACIÓN. Si considera que se trata de un error, comuníquese con el evaluador o la empresa encargada.',
            submission: existing,
          });
        }

        // In progress with answers -> Prompt to resume or restart
        const hasAnswers = Object.keys(existing.answers || {}).length > 0;
        return NextResponse.json({
          success: true,
          status: 'in_progress',
          canResume: hasAnswers,
          currentFieldIndex: existing.currentFieldIndex || 0,
          currentSectionTitle: existing.currentSectionTitle || '',
          answers: existing.answers || {},
          form,
          campaign,
        });
      }

      // New worker session
      return NextResponse.json({
        success: true,
        status: 'new',
        canResume: false,
        currentFieldIndex: 0,
        currentSectionTitle: '',
        answers: {},
        form,
        campaign,
      });
    }

    // ACTION: RESET (Worker chooses to restart from the beginning)
    if (action === 'reset') {
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
      const submission: WorkerSubmission = {
        id: existing ? existing.id : String(Math.floor(1000 + Math.random() * 9000)),
        evaluationCode: campaign.code,
        workerCode: workerCode.trim(),
        status: 'in_progress',
        currentFieldIndex: typeof currentFieldIndex === 'number' ? currentFieldIndex : existing?.currentFieldIndex || 0,
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

    // ACTION: COMPLETE (Final submission)
    if (action === 'complete') {
      const existing = await getSubmission(evaluationCode, workerCode);
      const submission: WorkerSubmission = {
        id: existing ? existing.id : String(Math.floor(1000 + Math.random() * 9000)),
        evaluationCode: campaign.code,
        workerCode: workerCode.trim(),
        status: 'completed',
        currentFieldIndex: typeof currentFieldIndex === 'number' ? currentFieldIndex : existing?.currentFieldIndex || 0,
        currentSectionTitle: 'Finalizado',
        answers: { ...(existing?.answers || {}), ...(answers || {}) },
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
