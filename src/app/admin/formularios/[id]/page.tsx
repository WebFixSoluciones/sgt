import React from 'react';
import { getFormById } from '@/lib/storage';
import FormBuilder from '@/components/admin/FormBuilder';
import { notFound } from 'next/navigation';

export default async function EditarFormularioPage({
  params,
}: {
  params: { id: string };
}) {
  const form = await getFormById(params.id);

  if (!form) {
    notFound();
  }

  return <FormBuilder initialForm={form} isNew={false} />;
}
