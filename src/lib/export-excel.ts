import * as XLSX from 'xlsx';
import { FormSchema, WorkerSubmission, EvaluationCampaign } from './types';
import { formatEcuadorDateTime } from './date-utils';

/**
 * Resolves the human-readable job position (Puesto de Trabajo) for a worker submission.
 * Checks campaign puestos, form option definitions, and standard INSST classifications.
 */
export function resolvePuestoLabel(
  sub: WorkerSubmission,
  forms: FormSchema[] = [],
  campaignPuestos?: string[]
): string {
  const rawPuesto = sub.answers ? (sub.answers['puesto'] ?? sub.answers['agrupacion_puestos']) : undefined;
  if (rawPuesto === undefined || rawPuesto === null || rawPuesto === '' || rawPuesto === '-') {
    return 'No especificado';
  }
  const strVal = String(rawPuesto).trim();

  // 1. Check if campaign has explicit puestos configured
  if (campaignPuestos && campaignPuestos.length > 0) {
    const num = parseInt(strVal, 10);
    if (!isNaN(num) && campaignPuestos[num - 1]) {
      return campaignPuestos[num - 1];
    }
    const found = campaignPuestos.find(
      (p, idx) => p === strVal || String(idx + 1) === strVal || p.toLowerCase().includes(strVal.toLowerCase())
    );
    if (found) return found;
  }

  // 2. Search across all forms for field 'puesto' options
  for (const form of forms) {
    const puestoField = form.fields?.find((f) => f.id === 'puesto' || f.id === 'agrupacion_puestos');
    if (puestoField && puestoField.options) {
      const opt = puestoField.options.find(
        (o) => String(o.value).trim() === strVal || o.label.toLowerCase() === strVal.toLowerCase()
      );
      if (opt) return opt.label;
    }
  }

  // 3. Standard INSST FPSICO official puesto mapping
  const standardPuestos: Record<string, string> = {
    '1': '1. DIRECCIÓN / GERENCIA',
    '2': '2. ADMINISTRACIÓN / FINANZAS',
    '3': '3. COMERCIAL / VENTAS',
    '4': '4. COORDINADORES / SUPERVISORES',
    '5': '5. OPERACIONES / PLANTA',
    '6': '6. LOGÍSTICA / BODEGA',
    '7': '7. SERVICIO TÉCNICO / MANTENIMIENTO',
    '28': '28. PRODUCCIÓN LÍNEA CONTINUA',
  };
  if (standardPuestos[strVal]) {
    return standardPuestos[strVal];
  }

  // If value is already readable text (not a bare number), return as is
  if (isNaN(Number(strVal))) {
    return strVal;
  }

  return `Puesto ${strVal}`;
}

/**
 * Builds an Excel workbook buffer (.xlsx) matching the standard structure
 * of occupational risk evaluation exports, including CÓDIGO DE TRABAJADOR and PUESTO DE TRABAJO.
 */
export function generateEvaluationExcel(
  form: FormSchema,
  submissions: WorkerSubmission[],
  campaign?: EvaluationCampaign | null
): Uint8Array {
  // 1. Determine columns
  // Fixed initial columns:
  // ID Entrada, Fecha entrada, Fecha de actualización, IP del usuario, CÓDIGO DE TRABAJADOR, PUESTO DE TRABAJO
  const headers: string[] = [
    'ID Entrada',
    'Fecha entrada',
    'Fecha de actualización',
    'IP del usuario',
    'CÓDIGO DE TRABAJADOR',
    'PUESTO DE TRABAJO',
  ];

  // Non-pagebreak question fields (omit 'puesto' and 'html' from dynamic list to avoid duplicate or non-question columns)
  const questionFields = form.fields.filter(
    (f) => f.type !== 'page_break' && f.type !== 'html' && f.id !== 'puesto' && f.id !== 'agrupacion_puestos'
  );

  // Add question headers
  for (const field of questionFields) {
    headers.push(field.label);
  }

  // Trailing columns (matching standard template)
  headers.push('Observaciones: Indique a continuación las observaciones o consideraciones que no estén suficiente o adecuadamente contempladas en las encuestas:');
  headers.push('Creada por (ID de usuario)');
  headers.push('Agente de usuario');

  // 2. Build rows
  const rows: (string | number)[][] = [headers];

  for (const sub of submissions) {
    const row: (string | number)[] = [];

    // Col 1: ID Entrada
    row.push(sub.id || '');

    // Col 2: Fecha entrada
    row.push(formatEcuadorDateTime(sub.startedAt || sub.updatedAt));

    // Col 3: Fecha de actualización
    row.push(formatEcuadorDateTime(sub.completedAt || sub.updatedAt));

    // Col 4: IP del usuario
    row.push(sub.ip || '127.0.0.1');

    // Col 5: CÓDIGO DE TRABAJADOR (entered once by worker)
    row.push(sub.workerCode || '');

    // Col 6: PUESTO DE TRABAJO (selected once by worker)
    row.push(resolvePuestoLabel(sub, [form], campaign?.puestos));

    // Question answers
    for (const field of questionFields) {
      const rawVal = sub.answers[field.id];
      if (rawVal === undefined || rawVal === null || rawVal === '') {
        row.push('');
      } else {
        const numVal = Number(rawVal);
        if (!isNaN(numVal) && typeof rawVal !== 'boolean') {
          row.push(numVal);
        } else {
          row.push(String(rawVal));
        }
      }
    }

    // Observaciones
    row.push(String(sub.answers['observaciones'] || ''));

    // Creada por (ID de usuario)
    row.push('29');

    // Agente de usuario
    row.push(sub.userAgent || '');

    rows.push(row);
  }

  // 3. Create SheetJS worksheet and workbook
  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths for clean readability
  const colWidths = headers.map((h, i) => {
    if (i < 6) return { wch: 22 };
    if (h.length > 50) return { wch: 45 };
    return { wch: Math.max(h.length + 2, 12) };
  });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Respuestas');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(excelBuffer);
}

/**
 * Builds a multi-sheet Excel workbook with one dedicated sheet per form in the evaluation,
 * plus a consolidated participant summary sheet.
 * Every sheet includes CÓDIGO DE TRABAJADOR and PUESTO DE TRABAJO assigned to that worker.
 */
export function generateMultiFormEvaluationExcel(
  forms: FormSchema[],
  submissions: WorkerSubmission[],
  campaignOrTitle?: EvaluationCampaign | string | null
): Uint8Array {
  const campaign = typeof campaignOrTitle === 'object' ? campaignOrTitle : null;
  const workbook = XLSX.utils.book_new();

  // 1. Sheet 1: Resumen General de Participantes
  const summaryHeaders = [
    'ID Entrada',
    'CÓDIGO DE TRABAJADOR',
    'PUESTO DE TRABAJO',
    'Estado',
    'Fecha Inicio',
    'Fecha Finalización',
    'IP',
    'Dispositivo',
  ];
  const summaryRows: (string | number)[][] = [summaryHeaders];

  for (const sub of submissions) {
    summaryRows.push([
      sub.id || '',
      sub.workerCode || '',
      resolvePuestoLabel(sub, forms, campaign?.puestos),
      sub.status === 'completed' ? 'Completado' : 'En Progreso',
      formatEcuadorDateTime(sub.startedAt),
      formatEcuadorDateTime(sub.completedAt || sub.updatedAt),
      sub.ip || '127.0.0.1',
      sub.userAgent || '',
    ]);
  }
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryRows);
  summaryWs['!cols'] = [
    { wch: 14 },
    { wch: 24 },
    { wch: 32 },
    { wch: 16 },
    { wch: 22 },
    { wch: 22 },
    { wch: 16 },
    { wch: 35 },
  ];
  XLSX.utils.book_append_sheet(workbook, summaryWs, 'Resumen General');

  // 2. Dedicated Sheet for each Form in forms
  for (let idx = 0; idx < forms.length; idx++) {
    const form = forms[idx];
    const questionFields = form.fields.filter(
      (f) => f.type !== 'page_break' && f.type !== 'html' && f.id !== 'puesto' && f.id !== 'agrupacion_puestos'
    );

    const headers: string[] = [
      'ID Entrada',
      'CÓDIGO DE TRABAJADOR',
      'PUESTO DE TRABAJO',
      'Fecha',
      ...questionFields.map((f) => f.label),
    ];

    const rows: (string | number)[][] = [headers];

    for (const sub of submissions) {
      const row: (string | number)[] = [
        sub.id || '',
        sub.workerCode || '',
        resolvePuestoLabel(sub, forms, campaign?.puestos),
        formatEcuadorDateTime(sub.completedAt || sub.updatedAt || sub.startedAt),
      ];

      for (const field of questionFields) {
        const rawVal = sub.answers[field.id];
        if (rawVal === undefined || rawVal === null || rawVal === '') {
          row.push('');
        } else {
          const numVal = Number(rawVal);
          if (!isNaN(numVal) && typeof rawVal !== 'boolean') {
            row.push(numVal);
          } else {
            row.push(String(rawVal));
          }
        }
      }
      rows.push(row);
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = headers.map((h, i) => {
      if (i < 4) return { wch: 24 };
      if (h.length > 40) return { wch: 35 };
      return { wch: Math.max(h.length + 2, 12) };
    });

    // Clean sheet name (Excel limits sheet names to 31 chars and no special chars)
    let sheetName = form.title
      .replace(/[\\/?*[\]:]/g, '')
      .substring(0, 28)
      .trim();
    if (!sheetName) sheetName = `Formulario ${idx + 1}`;

    // Ensure sheet name uniqueness
    if (workbook.SheetNames.includes(sheetName)) {
      sheetName = `${sheetName.substring(0, 25)}_${idx + 1}`;
    }

    XLSX.utils.book_append_sheet(workbook, ws, sheetName);
  }

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(excelBuffer);
}
