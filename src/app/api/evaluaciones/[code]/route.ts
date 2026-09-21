import { NextRequest, NextResponse } from 'next/server';
import { getCampaignByCode, getFormById, incrementCampaignVisits, getSubmissions } from '@/lib/storage';

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

    // Increment visits when accessed
    const searchParams = req.nextUrl.searchParams;
    if (searchParams.get('track') === '1') {
      await incrementCampaignVisits(code);
    }

    const form = await getFormById(campaign.formId);
    const submissions = await getSubmissions(code);

    return NextResponse.json({
      success: true,
      data: {
        campaign,
        form,
        submissionsCount: submissions.filter((s) => s.status === 'completed').length,
        totalEntries: submissions.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
