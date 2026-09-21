import * as XLSX from 'xlsx';
import { FormSchema, WorkerSubmission } from './types';

/**
 * Builds an Excel workbook buffer (.xlsx) matching the standard structure
 * of occupational risk evaluation exports.
 */
export function generateEvaluationExcel(
  form: FormSchema,
  submissions: WorkerSubmission[]
): Uint8Array {
  // 1. Determine columns
  // Fixed initial columns:
  // ID Entrada, Fecha entrada, Fecha de actualización, IP del usuario, CÓDIGO DE TRABAJADOR
  const headers: string[] = [
    'ID Entrada',
    'Fecha entrada',
    'Fecha de actualización',
    'IP del usuario',
    'CÓDIGO DE TRABAJADOR',
  ];

  // Non-pagebreak question fields
  const questionFields = form.fields.filter((f) => f.type !== 'page_break');

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
    row.push(sub.startedAt || sub.updatedAt || '');

    // Col 3: Fecha de actualización
    row.push(sub.completedAt || sub.updatedAt || '');

    // Col 4: IP del usuario
    row.push(sub.ip || '127.0.0.1');

    // Col 5: CÓDIGO DE TRABAJADOR
    row.push(sub.workerCode || '');

    // Question answers
    for (const field of questionFields) {
      const rawVal = sub.answers[field.id];
      if (rawVal === undefined || rawVal === null || rawVal === '') {
        row.push('');
      } else {
        // If it's a pure integer or float, export as number so Excel treats it as a metric
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
    if (i < 5) return { wch: 18 };
    if (h.length > 50) return { wch: 45 };
    return { wch: Math.max(h.length + 2, 12) };
  });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Respuestas');

  // Write as binary Uint8Array
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(excelBuffer);
}
