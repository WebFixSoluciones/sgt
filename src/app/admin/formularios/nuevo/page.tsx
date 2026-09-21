import React from 'react';
import FormBuilder from '@/components/admin/FormBuilder';
import { FormSchema } from '@/lib/types';
import { getEcuadorISOString } from '@/lib/date-utils';

export default function NuevoFormularioPage() {
  const blankForm: FormSchema = {
    id: `form-${Date.now()}`,
    title: 'NUEVA EVALUACIÓN LABORAL',
    code: `form-${Date.now()}`,
    company: 'CHAIDE Y CHAIDE',
    description: 'Nuevo cuestionario personalizado para prevención laboral.',
    isTemplate: false,
    category: 'general',
    fields: [
      {
        id: 'sec_1',
        type: 'page_break',
        label: 'SALTO DE PÁGINA',
        required: false,
        order: 0,
        sectionTitle: 'Sección 1: Datos Iniciales',
      },
      {
        id: 'puesto',
        type: 'select',
        label: 'AGRUPACIONES DE PUESTOS',
        required: true,
        order: 1,
        options: [
          { id: 'opt_1', label: '1. DIRECCIÓN / JEFATURA', value: '1' },
          { id: 'opt_2', label: '2. ADMINISTRATIVO', value: '2' },
          { id: 'opt_3', label: '3. OPERARIO / PLANTA', value: '3' },
          { id: 'opt_4', label: '4. COORDINADORES', value: '4' },
        ],
      },
      {
        id: 'q1',
        type: 'radio',
        label: '1. ¿Trabajas los sábados?',
        required: true,
        order: 2,
        options: [
          { id: 'o1', label: '1. siempre o casi siempre', value: '1' },
          { id: 'o2', label: '2. a menudo', value: '2' },
          { id: 'o3', label: '3. a veces', value: '3' },
          { id: 'o4', label: '4. nunca o casi nunca', value: '4' },
        ],
      },
      {
        id: 'antiguedad',
        type: 'radio',
        label: 'ANTIGÜEDAD',
        required: true,
        order: 3,
        options: [
          { id: 'a1', label: 'MENOS DE 2 AÑOS', value: '1' },
          { id: 'a2', label: 'ENTRE 2 Y 5 AÑOS', value: '2' },
          { id: 'a3', label: 'MAS DE 5 AÑOS', value: '3' },
        ],
      },
    ],
    createdAt: getEcuadorISOString(),
    updatedAt: getEcuadorISOString(),
  };

  return <FormBuilder initialForm={blankForm} isNew={true} />;
}
