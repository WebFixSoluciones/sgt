import { NextRequest, NextResponse } from 'next/server';
import { getForms, saveForm, getFormById } from '@/lib/storage';
import { FormSchema } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const forms = await getForms();
    return NextResponse.json({ success: true, data: forms });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, code, company, description, fields, isTemplate, category } = body;

    if (!title || !fields) {
      return NextResponse.json({ success: false, error: 'Título y campos son requeridos' }, { status: 400 });
    }

    const newForm: FormSchema = {
      id: body.id || `form-${Date.now()}`,
      title: title.trim(),
      code: code ? code.trim() : `form-${Date.now()}`,
      company: company || '',
      description: description || '',
      isTemplate: Boolean(isTemplate),
      category: category || 'general',
      fields: fields || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveForm(newForm);
    return NextResponse.json({ success: true, data: newForm }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
