/**
 * Utilidades de fecha y hora para la Zona Horaria de Ecuador (America/Guayaquil, UTC-5).
 * Ecuador continental no aplica horario de verano, manteniéndose siempre en UTC-5.
 */

const ECUADOR_TIMEZONE = 'America/Guayaquil';

/**
 * Retorna la fecha y hora actual en formato ISO 8601 con offset de Ecuador (-05:00).
 * Ejemplo: "2026-09-21T16:44:21-05:00"
 */
export function getEcuadorISOString(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  
  // Offset de Ecuador: UTC-5 (300 minutos detrás de UTC)
  const ecuadorOffsetMinutes = -5 * 60;
  const utcMillis = date.getTime() + (date.getTimezoneOffset() * 60000);
  const ecDate = new Date(utcMillis + (ecuadorOffsetMinutes * 60000));

  const y = ecDate.getFullYear();
  const m = pad(ecDate.getMonth() + 1);
  const d = pad(ecDate.getDate());
  const hh = pad(ecDate.getHours());
  const mm = pad(ecDate.getMinutes());
  const ss = pad(ecDate.getSeconds());

  return `${y}-${m}-${d}T${hh}:${mm}:${ss}-05:00`;
}

/**
 * Formatea una fecha en formato legible con fecha y hora de Ecuador.
 * Ejemplo: "21/09/2026, 16:44:21"
 */
export function formatEcuadorDateTime(dateInput?: string | Date | null): string {
  if (!dateInput) return '-';
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return String(dateInput);

    return new Intl.DateTimeFormat('es-EC', {
      timeZone: ECUADOR_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    return String(dateInput);
  }
}

/**
 * Formatea únicamente la fecha en formato de Ecuador.
 * Ejemplo: "21/09/2026"
 */
export function formatEcuadorDate(dateInput?: string | Date | null): string {
  if (!dateInput) return '-';
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return String(dateInput);

    return new Intl.DateTimeFormat('es-EC', {
      timeZone: ECUADOR_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch {
    return String(dateInput);
  }
}

/**
 * Formatea únicamente la hora en formato de Ecuador.
 * Ejemplo: "16:44:21"
 */
export function formatEcuadorTime(dateInput?: string | Date | null): string {
  if (!dateInput) return '-';
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return String(dateInput);

    return new Intl.DateTimeFormat('es-EC', {
      timeZone: ECUADOR_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    return String(dateInput);
  }
}

/**
 * Formato largo para encabezados de informes y documentos oficiales.
 * Ejemplo: "21 de septiembre de 2026, 16:44"
 */
export function formatEcuadorLongDate(dateInput?: string | Date | null): string {
  if (!dateInput) return '-';
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return String(dateInput);

    return new Intl.DateTimeFormat('es-EC', {
      timeZone: ECUADOR_TIMEZONE,
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    return String(dateInput);
  }
}

/**
 * Formato oficial para exportación FPSICO 4.0 en zona horaria de Ecuador:
 * "DD/MM/AAAA HH:MM:SS"
 */
export function formatEcuadorFpsicoDate(dateInput?: string | Date | null): string {
  if (!dateInput) return '01/01/2026 00:00:00';
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return '01/01/2026 00:00:00';

    const parts = new Intl.DateTimeFormat('es-EC', {
      timeZone: ECUADOR_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(date);

    const get = (type: string) => parts.find(p => p.type === type)?.value || '00';
    return `${get('day')}/${get('month')}/${get('year')} ${get('hour')}:${get('minute')}:${get('second')}`;
  } catch {
    return '01/01/2026 00:00:00';
  }
}

