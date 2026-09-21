import { NextRequest, NextResponse } from 'next/server';
import { getCampaignByCode, getSubmissions } from '@/lib/storage';
import { getEcuadorISOString } from '@/lib/date-utils';
import { EvaluationBackupData } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(
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

    const submissions = await getSubmissions(code);
    const nowEc = getEcuadorISOString();

    const backupData: EvaluationBackupData = {
      version: '1.0',
      backupType: 'sgt_evaluation_submissions_backup',
      evaluationCode: campaign.code,
      campaignTitle: campaign.title,
      company: campaign.company,
      exportedAt: nowEc,
      totalSubmissions: submissions.length,
      completedSubmissions: submissions.filter((s) => s.status === 'completed').length,
      submissions,
    };

    const dateStr = nowEc.slice(0, 19).replace(/[:T]/g, '-');
    const filename = `respaldo_${campaign.code}_${dateStr}.json`;

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
