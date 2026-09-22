import { NextRequest, NextResponse } from 'next/server';
import { duplicateForm, getFormById } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { formId, newTitle, asTemplate, company } = body;

    if (!formId) {
      return NextResponse.json({ success: false, error: 'ID de formulario requerido' }, { status: 400 });
    }

    const source = await getFormById(formId);
    if (!source) {
      return NextResponse.json({ success: false, error: 'Formulario origen no encontrado' }, { status: 404 });
    }

    const duplicated = await duplicateForm(
      formId,
      newTitle || `Copia de ${source.title}`,
      Boolean(asTemplate),
      company
    );

    return NextResponse.json({
      success: true,
      data: duplicated,
      message: `Se ha duplicado exitosamente como "${duplicated.title}"`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
