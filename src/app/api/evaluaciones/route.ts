import { NextRequest, NextResponse } from 'next/server';
import {
  getCampaigns,
  saveCampaign,
  toggleCampaignStatus,
  trashCampaign,
  restoreCampaign,
  deleteCampaignPermanently,
  emptyTrashCampaigns,
} from '@/lib/storage';
import { EvaluationCampaign } from '@/lib/types';
import { getEcuadorISOString } from '@/lib/date-utils';

export async function GET(req: NextRequest) {
  try {
    const campaigns = await getCampaigns();
    return NextResponse.json({ success: true, data: campaigns });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, title, company, formId, formIds, expectedParticipants, groupId, nextEvaluationCode } = body;

    const resolvedFormIds: string[] = Array.isArray(formIds) && formIds.length > 0
      ? formIds
      : (formId ? [formId] : []);

    if (!code || !title || !company || resolvedFormIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos obligatorios (código, título, empresa y al menos un formulario seleccionado)' },
        { status: 400 }
      );
    }

    const nowEc = getEcuadorISOString();
    const newCampaign: EvaluationCampaign = {
      id: `camp-${Date.now()}`,
      code: code.trim().toUpperCase(),
      title: title.trim(),
      company: company.trim(),
      formId: resolvedFormIds[0],
      formIds: resolvedFormIds,
      expectedParticipants: Number(expectedParticipants) || 100,
      status: 'active',
      groupId: groupId || undefined,
      nextEvaluationCode: nextEvaluationCode || undefined,
      visits: 0,
      submissionsCount: 0,
      createdAt: nowEc,
      updatedAt: nowEc,
    };

    await saveCampaign(newCampaign);
    return NextResponse.json({ success: true, data: newCampaign }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, action } = body;

    if (action === 'empty_trash') {
      const count = await emptyTrashCampaigns();
      return NextResponse.json({ success: true, count });
    }

    if (!code) {
      return NextResponse.json({ success: false, error: 'Código de evaluación requerido' }, { status: 400 });
    }

    if (action === 'toggle_status') {
      const updated = await toggleCampaignStatus(code);
      if (!updated) {
        return NextResponse.json({ success: false, error: 'Evaluación no encontrada' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: updated });
    }

    if (action === 'trash') {
      const updated = await trashCampaign(code);
      if (!updated) {
        return NextResponse.json({ success: false, error: 'Evaluación no encontrada' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: updated });
    }

    if (action === 'restore') {
      const updated = await restoreCampaign(code);
      if (!updated) {
        return NextResponse.json({ success: false, error: 'Evaluación no encontrada' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json({ success: false, error: 'Acción no soportada' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    let code = searchParams.get('code');
    let action = searchParams.get('action');

    if (!code && !action) {
      try {
        const body = await req.json();
        code = body.code;
        action = body.action;
      } catch {
        // No body provided
      }
    }

    if (action === 'empty_trash') {
      const count = await emptyTrashCampaigns();
      return NextResponse.json({ success: true, count });
    }

    if (!code) {
      return NextResponse.json({ success: false, error: 'Código de evaluación requerido' }, { status: 400 });
    }

    const deleted = await deleteCampaignPermanently(code);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Evaluación no encontrada para eliminar' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Evaluación eliminada definitivamente' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
