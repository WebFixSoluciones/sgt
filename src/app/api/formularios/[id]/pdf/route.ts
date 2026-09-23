import { NextRequest, NextResponse } from 'next/server';
import { getFormById } from '@/lib/storage';
import { generateTemplatePdf } from '@/lib/export-pdf-template';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const form = await getFormById(id);

    if (!form) {
      return NextResponse.json(
        { success: false, error: 'Formulario no encontrado' },
        { status: 404 }
      );
    }

    const doc = generateTemplatePdf(form);
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    const safeTitle = (form.title || 'Cuestionario')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 35);
    const code = form.code || form.id || 'plantilla';
    const fileName = `Cuestionario_${safeTitle}_${code}.pdf`;

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${fileName}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    console.error('Error generando PDF de cuestionario:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Error al generar el PDF' },
      { status: 500 }
    );
  }
}
