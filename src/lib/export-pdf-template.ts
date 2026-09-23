import jsPDF from 'jspdf';
import autoTable, { RowInput } from 'jspdf-autotable';
import { FormSchema, FormField } from './types';

/**
 * Format category label for display
 */
function getCategoryLabel(category?: string): string {
  switch (category) {
    case 'psicosocial':
      return 'Evaluación Psicosocial (F-PSICO)';
    case 'lips60':
      return 'LIPS-60 (Factores Psicosociales)';
    case 'estres':
      return 'Estrés Laboral (Escala OIT/OMS)';
    case 'nocturno':
      return 'Trabajo Nocturno y Turnos';
    default:
      return 'General / Multidimensión';
  }
}

/**
 * Format field type label for display
 */
function getFieldTypeLabel(type: string): string {
  switch (type) {
    case 'radio':
      return 'Opción Única (Radio)';
    case 'checkbox':
      return 'Opción Múltiple (Checkbox)';
    case 'select':
      return 'Menú Desplegable (Select)';
    case 'text':
      return 'Texto Breve';
    case 'textarea':
      return 'Texto Amplio / Párrafo';
    default:
      return type;
  }
}

/**
 * Generates a clean, professional PDF document representing the empty template questionnaire.
 * Includes all sections, question statements, question IDs, types, and blank options with point values.
 */
export function generateTemplatePdf(form: FormSchema): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2; // 182mm

  // -------------------------------------------------------------
  // 1. FIRST PAGE HEADER & METADATA
  // -------------------------------------------------------------
  let currentY = 16;

  // Top Category / Brand Tag
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 97, 254); // SGT Blue
  doc.text('SGT EVALUACIONES  •  FICHA TÉCNICA Y BANCO DE PREGUNTAS', marginX, currentY);

  currentY += 6;

  // Title of the Questionnaire
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // Slate 900
  const titleLines = doc.splitTextToSize(form.title || 'CUESTIONARIO DE EVALUACIÓN', contentWidth);
  doc.text(titleLines, marginX, currentY);
  currentY += titleLines.length * 6 + 2;

  // Count metrics
  const totalQuestions = form.fields.filter((f) => f.type !== 'page_break').length;
  const sectionFields = form.fields.filter((f) => f.type === 'page_break');
  const totalSections = Math.max(1, sectionFields.length);

  // Metadata Card / Grid Box
  const metaBoxY = currentY;
  const metaBoxHeight = 26;
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.setLineWidth(0.4);
  doc.roundedRect(marginX, metaBoxY, contentWidth, metaBoxHeight, 2.5, 2.5, 'FD');

  const col1X = marginX + 4;
  const col2X = marginX + (contentWidth / 2) + 2;

  doc.setFontSize(8);

  // Row 1
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105); // Slate 600
  doc.text('Tipo:', col1X, metaBoxY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  const isMaster = Boolean(form.isTemplate) && (!form.company || form.company.trim() === '');
  doc.text(isMaster ? 'Plantilla Maestra Estándar' : `Formulario Empresa: ${form.company || 'Personalizado'}`, col1X + 16, metaBoxY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Total Preguntas:', col2X, metaBoxY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 97, 254);
  doc.text(`${totalQuestions} preguntas`, col2X + 26, metaBoxY + 6);

  // Row 2
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Categoría:', col1X, metaBoxY + 12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(getCategoryLabel(form.category), col1X + 16, metaBoxY + 12);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Secciones:', col2X, metaBoxY + 12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${totalSections} secciones`, col2X + 26, metaBoxY + 12);

  // Row 3
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Código ID:', col1X, metaBoxY + 18);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(form.code || form.id || 'N/A', col1X + 16, metaBoxY + 18);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Fecha Emisión:', col2X, metaBoxY + 18);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  const formattedDate = new Date().toLocaleDateString('es-EC', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  doc.text(formattedDate, col2X + 26, metaBoxY + 18);

  currentY = metaBoxY + metaBoxHeight + 4;

  // Optional Description / Instructions Notice
  if (form.description || true) {
    const descText = form.description
      ? `${form.description.trim()}\n• Nota Técnica: Formato en blanco con ponderación de opciones para revisión metodológica, cruce de preguntas y homologación técnica.`
      : '• Nota Técnica: Formato en blanco con ponderación de opciones para revisión metodológica, cruce de preguntas y homologación técnica.';

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    const descLines = doc.splitTextToSize(descText, contentWidth);
    doc.text(descLines, marginX, currentY + 3);
    currentY += descLines.length * 3.8 + 5;
  }

  // -------------------------------------------------------------
  // 2. CONSTRUCT TABLE DATA WITH SECTIONS & QUESTIONS
  // -------------------------------------------------------------
  const tableBody: RowInput[] = [];

  let questionCounter = 0;
  let hasOpenedFirstSection = false;

  form.fields.forEach((field) => {
    if (field.type === 'page_break') {
      hasOpenedFirstSection = true;
      const sectionTitle = field.sectionTitle || field.label || 'Nueva Sección';
      const sectionDesc = field.description ? `  —  ${field.description}` : '';

      tableBody.push([
        {
          content: `SECCIÓN: ${sectionTitle.toUpperCase()}${sectionDesc}`,
          colSpan: 5,
          styles: {
            fillColor: [30, 41, 59], // Slate 800
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 8.5,
            halign: 'left',
            cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 },
          },
        },
      ]);
      return;
    }

    // If first question appears before any page_break
    if (!hasOpenedFirstSection && questionCounter === 0) {
      hasOpenedFirstSection = true;
      tableBody.push([
        {
          content: 'SECCIÓN: DATOS GENERALES Y VARIABLES INICIALES',
          colSpan: 5,
          styles: {
            fillColor: [30, 41, 59],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 8.5,
            halign: 'left',
            cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 },
          },
        },
      ]);
    }

    questionCounter++;

    // Question label + requirement + description
    let questionText = field.label || `Pregunta ${questionCounter}`;
    if (field.required) {
      questionText += '\n* Obligatoria';
    } else {
      questionText += '\n(Opcional)';
    }
    if (field.description) {
      questionText += `\nNota: ${field.description}`;
    }

    // Format Options with empty marks and points/values
    let optionsText = '';
    if (field.options && field.options.length > 0) {
      optionsText = field.options
        .map((opt) => {
          const mark = field.type === 'checkbox' ? '[  ]' : '(  )';
          const valueText = opt.value !== undefined && opt.value !== '' ? ` [Valor: ${opt.value}]` : '';
          return `${mark} ${opt.label}${valueText}`;
        })
        .join('\n');
    } else if (field.type === 'textarea') {
      optionsText = '[ Espacio para respuesta abierta / observaciones ]\n____________________________________\n____________________________________';
    } else {
      optionsText = '[ Espacio para texto breve ]\n____________________________________';
    }

    tableBody.push([
      String(questionCounter),
      field.fpsicoCode || field.id || `q_${questionCounter}`,
      questionText,
      getFieldTypeLabel(field.type),
      optionsText,
    ]);
  });

  // -------------------------------------------------------------
  // 3. RENDER AUTOTABLE
  // -------------------------------------------------------------
  autoTable(doc, {
    startY: currentY,
    margin: { top: 22, left: marginX, right: marginX, bottom: 18 },
    head: [['#', 'Código / ID', 'Enunciado de la Pregunta', 'Tipo de Entrada', 'Opciones de Respuesta y Ponderación']],
    body: tableBody,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      lineColor: [226, 232, 240], // Slate 200
      lineWidth: 0.2,
      overflow: 'linebreak',
      textColor: [51, 65, 85], // Slate 700
    },
    headStyles: {
      fillColor: [0, 97, 254], // SGT Blue
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
      cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 22, halign: 'left', textColor: [100, 116, 139] },
      2: { cellWidth: 74, halign: 'left', fontStyle: 'normal' },
      3: { cellWidth: 24, halign: 'left' },
      4: { cellWidth: 52, halign: 'left' },
    },
    didDrawPage: (data) => {
      // Header on pages > 1
      if (data.pageNumber > 1) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(0, 97, 254);
        doc.text('SGT EVALUACIONES  •  FICHA TÉCNICA DEL CUESTIONARIO', marginX, 12);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        const truncatedTitle = form.title.length > 55 ? `${form.title.substring(0, 52)}...` : form.title;
        doc.text(truncatedTitle, pageWidth - marginX, 12, { align: 'right' });

        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.line(marginX, 14.5, pageWidth - marginX, 14.5);
      }
    },
  });

  // -------------------------------------------------------------
  // 4. FOOTERS & PAGE NUMBERING ON ALL PAGES
  // -------------------------------------------------------------
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const footerY = 290;

    // Divider Line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(marginX, footerY - 4, pageWidth - marginX, footerY - 4);

    // Left Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text('SGT - Sistema de Gestión Técnica de Evaluaciones  •  Matriz de Preguntas y Opciones', marginX, footerY);

    // Right Footer: Página X de Y
    doc.setFont('helvetica', 'bold');
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - marginX, footerY, { align: 'right' });
  }

  return doc;
}

/**
 * Client-side trigger to download the questionnaire PDF
 */
export async function exportFormToPdf(form: FormSchema, fileNameOverride?: string): Promise<void> {
  const doc = generateTemplatePdf(form);
  const safeTitle = (form.title || 'Cuestionario')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 35);
  const code = form.code || form.id || 'plantilla';
  const fileName = fileNameOverride || `Cuestionario_${safeTitle}_${code}.pdf`;
  doc.save(fileName);
}
