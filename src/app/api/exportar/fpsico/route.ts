import { NextRequest, NextResponse } from 'next/server';
import { getCampaignByCode, getSubmissions, getFormsForCampaign } from '@/lib/storage';
import { generateFpsicoTxt, isFpsicoForm } from '@/lib/export-fpsico';

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

    const forms = await getFormsForCampaign(campaign);
    // Find specifically the Psychosocial / FPSICO 4.0 form within this campaign
    const fpsicoForm = forms.find(isFpsicoForm);

    // EXCLUSIVE: FPSICO TXT is strictly allowed if and only if the evaluation contains a psychosocial evaluation form!
    if (!fpsicoForm) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Esta evaluación no contiene un cuestionario de Evaluación Psicosocial (FPSICO 4.0). La exportación en formato TXT del INSST es exclusiva para evaluaciones psicosociales.',
        },
        { status: 400 }
      );
    }

    const submissions = await getSubmissions(code);

    // Filter question fields (non-pagebreaks, non-demographic, non-observaciones)
    let fpsicoFieldIds = fpsicoForm.fields
      .filter((f) => f.type !== 'page_break' && f.type !== 'html' && f.id.startsWith('q'))
      .map((f) => f.id);

    if (fpsicoFieldIds.length === 0) {
      fpsicoFieldIds = fpsicoForm.fields
        .filter(
          (f) =>
            f.type !== 'page_break' &&
            f.type !== 'html' &&
            !['puesto', 'agrupacion_puestos', 'horario', 'horarios', 'antiguedad', 'observaciones'].includes(
              f.id.toLowerCase()
            )
        )
        .map((f) => f.id);
    }

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
