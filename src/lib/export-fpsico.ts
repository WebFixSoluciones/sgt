import { WorkerSubmission } from './types';
import { formatEcuadorFpsicoDate } from './date-utils';

/**
 * Generates an official INSST FPSICO 4.0 compliant TXT file content.
 * Specification:
 * - Each row corresponds to one completed questionnaire.
 * - 4 mandatory comma-separated parts, each wrapped in double quotes:
 *   1. Date/Time: "DD/MM/AAAA HH:MM:SS" (Zona horaria Ecuador UTC-5)
 *   2. Demographic Variables: e.g. "211" or "(28)11" (if category > 9, enclose in parentheses)
 *   3. 89 Item Answers: 89 contiguous digits (e.g. 1 to 5, or 0)
 *   4. Questionnaire Identifier / Entry ID: e.g. "6592"
 * - No trailing spaces, no extra blank lines.
 */
export function generateFpsicoTxt(submissions: WorkerSubmission[], fpsicoFieldIds: string[]): string {
  const lines: string[] = [];

  for (const sub of submissions) {
    if (sub.status !== 'completed') continue;

    // 1. Date formatting in Ecuador Timezone (DD/MM/AAAA HH:MM:SS)
    const formattedDate = formatEcuadorFpsicoDate(sub.completedAt || sub.updatedAt || sub.startedAt);


    // 2. Demographic Variables (Agrupación de puestos, Horarios, Antigüedad)
    const puestoVal = String(sub.answers['puesto'] ?? sub.answers['agrupacion_puestos'] ?? '1');
    const horarioVal = String(sub.answers['horario'] ?? sub.answers['horarios'] ?? '1');
    const antiguedadVal = String(sub.answers['antiguedad'] ?? '1');

    // If a demographic code is >= 10, FPSICO 3.1/4.0 requires enclosing it in parentheses: (XX)
    const formatVar = (v: string) => {
      const num = parseInt(v, 10);
      if (!isNaN(num) && num >= 10) {
        return `(${num})`;
      }
      return v || '1';
    };

    const variablesString = `${formatVar(puestoVal)}${formatVar(horarioVal)}${formatVar(antiguedadVal)}`;

    // 3. 89 item responses
    let answersString = '';
    // If field IDs are provided, read in order; otherwise check q1..q89
    for (let i = 0; i < 89; i++) {
      const fieldId = fpsicoFieldIds[i] || `q${i + 1}`;
      const rawVal = sub.answers[fieldId];
      let val = '1';
      if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
        val = String(rawVal);
      }
      answersString += val;
    }

    // 4. Identifier (ID Entrada or worker code)
    const identifier = sub.id || sub.workerCode || '1';

    // Construct line: "DATE","VARS","ANSWERS","ID"
    const line = `"${formattedDate}","${variablesString}","${answersString}","${identifier}"`;
    lines.push(line);
  }

  return lines.join('\r\n');
}
