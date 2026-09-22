import { NextRequest, NextResponse } from 'next/server';
import {
  getCampaigns,
  saveCampaign,
  updateCampaign,
  toggleCampaignStatus,
  trashCampaign,
  restoreCampaign,
  deleteCampaignPermanently,
  emptyTrashCampaigns,
  getFormById,
  cloneFormForCampaign,
  cloneFormsForCampaignBatch,
} from '@/lib/storage';
import { EvaluationCampaign } from '@/lib/types';
import { getEcuadorISOString } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function GET(req: NextRequest) {
  try {
    const campaigns = await getCampaigns();
    return NextResponse.json(
      { success: true, data: campaigns },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, title, company, formId, formIds, expectedParticipants, groupId, nextEvaluationCode, isolateForms = true, puestos } = body;

    const resolvedFormIds: string[] = Array.isArray(formIds) && formIds.length > 0
      ? formIds
      : (formId ? [formId] : []);

    if (!code || !title || !company || resolvedFormIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos obligatorios (código, título, empresa y al menos un formulario seleccionado)' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const cleanCode = code.trim().toUpperCase();
    const cleanTitle = title.trim();
    const cleanCompany = company.trim();
    const nowEc = getEcuadorISOString();
    const cleanPuestos: string[] = Array.isArray(puestos)
      ? puestos.map((p: any) => String(p).trim()).filter(Boolean)
      : [];

    // Auto-clone all forms in a single batch so each company evaluation has its own isolated form instances
    let campaignFormIds: string[] = [];
    if (isolateForms) {
      const formsToClone: string[] = [];
      const formKeepIds: { [fId: string]: boolean } = {};

      for (const fId of resolvedFormIds) {
        const sourceForm = await getFormById(fId);
        // If it's a template or a form from another company, generate an isolated copy for this company
        if (
          sourceForm &&
          (sourceForm.isTemplate !== false ||
            !sourceForm.company ||
            sourceForm.company.trim().toUpperCase() !== cleanCompany.toUpperCase())
        ) {
          formsToClone.push(fId);
        } else {
          formKeepIds[fId] = true;
        }
      }

      if (formsToClone.length > 0) {
        const clonedForms = await cloneFormsForCampaignBatch(formsToClone, {
          code: cleanCode,
          title: cleanTitle,
          company: cleanCompany,
          puestos: cleanPuestos,
        });

        let cloneIdx = 0;
        for (const fId of resolvedFormIds) {
          if (formKeepIds[fId]) {
            campaignFormIds.push(fId);
          } else if (clonedForms[cloneIdx]) {
            campaignFormIds.push(clonedForms[cloneIdx].id);
            cloneIdx++;
          } else {
            campaignFormIds.push(fId);
          }
        }
      } else {
        campaignFormIds = [...resolvedFormIds];
      }
    } else {
      campaignFormIds = [...resolvedFormIds];
    }

    const newCampaign: EvaluationCampaign = {
      id: `camp-${Date.now()}`,
      code: cleanCode,
      title: cleanTitle,
      company: cleanCompany,
      formId: campaignFormIds[0],
      formIds: campaignFormIds,
      expectedParticipants: Number(expectedParticipants) || 100,
      status: 'active',
      groupId: groupId || undefined,
      nextEvaluationCode: nextEvaluationCode || undefined,
      puestos: cleanPuestos.length > 0 ? cleanPuestos : undefined,
      visits: 0,
      submissionsCount: 0,
      createdAt: nowEc,
      updatedAt: nowEc,
    };

    await saveCampaign(newCampaign);
    return NextResponse.json(
      { success: true, data: newCampaign },
      { status: 201, headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, action } = body;

    if (action === 'empty_trash') {
      const count = await emptyTrashCampaigns();
      return NextResponse.json(
        { success: true, count },
        { headers: NO_CACHE_HEADERS }
      );
    }

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Código de evaluación requerido' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    if (action === 'update' || (!action && (body.title || body.company))) {
      const { title, company, expectedParticipants, nextEvaluationCode, status, puestos } = body;
      const updated = await updateCampaign(code, {
        title,
        company,
        expectedParticipants,
        nextEvaluationCode,
        status,
        puestos: Array.isArray(puestos) ? puestos.map((p: any) => String(p).trim()).filter(Boolean) : undefined,
      });
      if (!updated) {
        return NextResponse.json(
          { success: false, error: 'Evaluación no encontrada' },
          { status: 404, headers: NO_CACHE_HEADERS }
        );
      }
      return NextResponse.json(
        { success: true, data: updated },
        { headers: NO_CACHE_HEADERS }
      );
    }

    if (action === 'toggle_status') {
      const updated = await toggleCampaignStatus(code);
      if (!updated) {
        return NextResponse.json(
          { success: false, error: 'Evaluación no encontrada' },
          { status: 404, headers: NO_CACHE_HEADERS }
        );
      }
      return NextResponse.json(
        { success: true, data: updated },
        { headers: NO_CACHE_HEADERS }
      );
    }

    if (action === 'trash') {
      const updated = await trashCampaign(code);
      if (!updated) {
        return NextResponse.json(
          { success: false, error: 'Evaluación no encontrada' },
          { status: 404, headers: NO_CACHE_HEADERS }
        );
      }
      return NextResponse.json(
        { success: true, data: updated },
        { headers: NO_CACHE_HEADERS }
      );
    }

    if (action === 'restore') {
      const updated = await restoreCampaign(code);
      if (!updated) {
        return NextResponse.json(
          { success: false, error: 'Evaluación no encontrada' },
          { status: 404, headers: NO_CACHE_HEADERS }
        );
      }
      return NextResponse.json(
        { success: true, data: updated },
        { headers: NO_CACHE_HEADERS }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Acción no soportada' },
      { status: 400, headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
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
      return NextResponse.json(
        { success: true, count },
        { headers: NO_CACHE_HEADERS }
      );
    }

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Código de evaluación requerido' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const deleted = await deleteCampaignPermanently(code);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Evaluación no encontrada para eliminar' },
        { status: 404, headers: NO_CACHE_HEADERS }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Evaluación eliminada definitivamente' },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
