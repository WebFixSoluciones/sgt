import { NextRequest, NextResponse } from 'next/server';
import { getCampaignByCode, getFormById, getSubmissions } from '@/lib/storage';

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const code = params.code;
    const campaign = await getCampaignByCode(code);
    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Evaluación no encontrada' }, { status: 404 });
    }

    const form = await getFormById(campaign.formId);
    if (!form) {
      return NextResponse.json({ success: false, error: 'Formulario vinculado no encontrado' }, { status: 404 });
    }

    const submissions = await getSubmissions(code);

    return NextResponse.json({
      success: true,
      data: {
        campaign,
        form,
        submissions,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
