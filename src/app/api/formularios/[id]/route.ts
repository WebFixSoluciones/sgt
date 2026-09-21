import { NextRequest, NextResponse } from 'next/server';
import { getFormById, saveForm } from '@/lib/storage';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const form = await getFormById(params.id);
    if (!form) {
      return NextResponse.json({ success: false, error: 'Formulario no encontrado' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: form });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const existing = await getFormById(params.id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Formulario no encontrado' }, { status: 404 });
    }

    const updated = {
      ...existing,
      ...body,
      id: existing.id,
      updatedAt: new Date().toISOString(),
    };

    await saveForm(updated);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
