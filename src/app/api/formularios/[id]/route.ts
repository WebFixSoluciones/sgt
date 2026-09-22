import { NextRequest, NextResponse } from 'next/server';
import { getFormById, saveForm, deleteForm } from '@/lib/storage';
import { getEcuadorISOString } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const form = await getFormById(params.id);
    if (!form) {
      return NextResponse.json(
        { success: false, error: 'Formulario no encontrado' },
        { status: 404, headers: NO_CACHE_HEADERS }
      );
    }
    return NextResponse.json(
      { success: true, data: form },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
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
      return NextResponse.json(
        { success: false, error: 'Formulario no encontrado' },
        { status: 404, headers: NO_CACHE_HEADERS }
      );
    }

    const updated = {
      ...existing,
      ...body,
      id: existing.id,
      updatedAt: getEcuadorISOString(),
    };

    await saveForm(updated);
    return NextResponse.json(
      { success: true, data: updated },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await getFormById(params.id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Formulario no encontrado' },
        { status: 404, headers: NO_CACHE_HEADERS }
      );
    }

    if (existing.isTemplate) {
      return NextResponse.json(
        { success: false, error: 'No se pueden eliminar las plantillas maestras del sistema.' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const deleted = await deleteForm(params.id);
    return NextResponse.json(
      { success: deleted, message: 'Formulario eliminado correctamente' },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
