import { NextRequest, NextResponse } from 'next/server';
import { getCampaignByCode, getFormById, getSubmissions } from '@/lib/storage';
import { generateEvaluationExcel } from '@/lib/export-excel';

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
    const excelBuffer = generateEvaluationExcel(form, submissions);

    const safeTitle = campaign.title.replace(/[^a-zA-Z0-9_\-]/g, '_');
    const filename = `INFORME_${safeTitle}_${campaign.code}.xlsx`;

    return new NextResponse(Buffer.from(excelBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
