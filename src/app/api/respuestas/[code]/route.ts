import { NextRequest, NextResponse } from 'next/server';
import {
  getCampaignByCode,
  getFormById,
  getSubmissions,
  getFormsForCampaign,
  deleteSubmission,
} from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const code = params.code;
    const campaign = await getCampaignByCode(code);
    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Evaluación no encontrada' },
        { status: 404, headers: NO_CACHE_HEADERS }
      );
    }

    const forms = await getFormsForCampaign(campaign);
    const form = forms[0] || (campaign.formId ? await getFormById(campaign.formId) : null);

    const submissions = await getSubmissions(code);

    return NextResponse.json(
      {
        success: true,
        data: {
          campaign,
          form,
          forms,
          submissions,
        },
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const code = params.code;
    const body = await req.json().catch(() => ({}));
    const workerCode = body.workerCode || req.nextUrl.searchParams.get('workerCode');

    if (!workerCode) {
      return NextResponse.json(
        { success: false, error: 'Código de trabajador requerido para eliminar' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const deleted = await deleteSubmission(code, workerCode);
    return NextResponse.json(
      {
        success: deleted,
        message: deleted
          ? `La entrada del trabajador ${workerCode} fue eliminada correctamente.`
          : 'Entrada no encontrada.',
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
