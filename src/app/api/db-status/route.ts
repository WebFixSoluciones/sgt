import { NextResponse } from 'next/server';
import { getDatabaseStatus, getDatabase, writeToBlobOnly } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const status = await getDatabaseStatus();
    return NextResponse.json(
      { success: true, ...status },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        },
      }
    );
  }
}

export async function POST() {
  try {
    const db = await getDatabase();
    const syncResult = await writeToBlobOnly(db);
    const status = await getDatabaseStatus();
    return NextResponse.json({
      success: syncResult.success,
      syncResult,
      ...status,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
