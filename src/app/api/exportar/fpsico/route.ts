import { NextRequest, NextResponse } from 'next/server';
import { getCampaignByCode, getFormById, getSubmissions } from '@/lib/storage';
import { generateFpsicoTxt } from '@/lib/export-fpsico';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ success: false, error: 'Código de evaluación requerido' }, { status: 400 });
    }

    const campaign = await getCampaignByCode(code);
    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Evaluación no encontrada' }, { status: 404 });
    }

    const form = await getFormById(campaign.formId);
    if (!form) {
      return NextResponse.json({ success: false, error: 'Formulario vinculado no encontrado' }, { status: 404 });
    }

    const submissions = await getSubmissions(code);

    // Filter question fields (non-pagebreaks, non-demographic, non-observaciones)
    const fpsicoFieldIds = form.fields
      .filter((f) => f.type !== 'page_break' && f.id.startsWith('q'))
      .map((f) => f.id);

    const txtContent = generateFpsicoTxt(submissions, fpsicoFieldIds);

    const safeTitle = campaign.title.replace(/[^a-zA-Z0-9_\-]/g, '_');
    const filename = `FPSICO40_${safeTitle}_${campaign.code}.txt`;

    return new NextResponse(txtContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
