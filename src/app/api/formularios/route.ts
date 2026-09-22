import { NextRequest, NextResponse } from 'next/server';
import { getForms, saveForm } from '@/lib/storage';
import { FormSchema } from '@/lib/types';
import { getEcuadorISOString } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function GET(req: NextRequest) {
  try {
    const forms = await getForms();
    return NextResponse.json(
      { success: true, data: forms },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, code, company, description, fields, isTemplate, category } = body;

    if (!title || !fields) {
      return NextResponse.json(
        { success: false, error: 'Título y campos son requeridos' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const nowEc = getEcuadorISOString();
    const newForm: FormSchema = {
      id: body.id || `form-${Date.now()}`,
      title: title.trim(),
      code: code ? code.trim() : `form-${Date.now()}`,
      company: company || '',
      description: description || '',
      isTemplate: Boolean(isTemplate),
      category: category || 'general',
      fields: fields || [],
      createdAt: nowEc,
      updatedAt: nowEc,
    };

    await saveForm(newForm);
    return NextResponse.json(
      { success: true, data: newForm },
      { status: 201, headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
