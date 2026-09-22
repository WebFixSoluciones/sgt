import { NextRequest, NextResponse } from 'next/server';
import { getCampaignByCode, getFormById, getSubmissions, getFormsForCampaign } from '@/lib/storage';

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
