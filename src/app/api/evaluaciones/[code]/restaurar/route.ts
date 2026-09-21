import { NextRequest, NextResponse } from 'next/server';
import { restoreCampaignSubmissions, getCampaignByCode } from '@/lib/storage';
import { WorkerSubmission } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const code = params.code?.toUpperCase();
    if (!code) {
      return NextResponse.json({ success: false, error: 'Código requerido' }, { status: 400 });
    }

    const campaign = await getCampaignByCode(code);
    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Evaluación no encontrada' }, { status: 404 });
    }

    const body = await req.json();
    let submissions: WorkerSubmission[] = [];

    if (Array.isArray(body)) {
      submissions = body;
    } else if (body && Array.isArray(body.submissions)) {
      submissions = body.submissions;
    } else {
      return NextResponse.json(
        { success: false, error: 'Formato de archivo inválido. Debe ser un archivo de respaldo con un listado de respuestas.' },
        { status: 400 }
      );
    }

    if (submissions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'El archivo de respaldo no contiene ninguna respuesta registrada para restaurar.' },
        { status: 400 }
      );
    }

    const result = await restoreCampaignSubmissions(code, submissions);

    return NextResponse.json({
      success: true,
      restoredCount: result.restoredCount,
      campaign: result.campaign,
      message: `Se restauraron exitosamente ${result.restoredCount} respuestas en la evaluación ${campaign.code}.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
