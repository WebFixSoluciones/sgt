import { NextRequest, NextResponse } from 'next/server';
import { clearCampaignSubmissions, getCampaignByCode } from '@/lib/storage';

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

    const result = await clearCampaignSubmissions(code);

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
      campaign: result.campaign,
      message: `Se eliminaron ${result.deletedCount} respuestas y se reinició la evaluación a 0.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
