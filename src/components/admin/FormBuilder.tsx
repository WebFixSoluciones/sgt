'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Trash2,
  Copy,
  Save,
  Check,
  CircleDot,
  CheckSquare,
  ListFilter,
  AlignLeft,
  FileText,
  SplitSquareVertical,
  ArrowLeft,
  ChevronDown,
  Layers,
  ChevronRight,
  Eye,
  FileDown,
  Loader2,
  Code,
} from 'lucide-react';
import { FormSchema, FormField, FormFieldOption, FormFieldType } from '@/lib/types';
import ConfirmDialog, { DialogType } from '@/components/common/ConfirmDialog';
import { exportFormToPdf } from '@/lib/export-pdf-template';

interface FormBuilderProps {
  initialForm: FormSchema;
  isNew?: boolean;
}

interface FormSection {
  id: string; // The id of the page_break field, or 'sec_initial'
  title: string;
  pageBreakField?: FormField;
  fields: FormField[];
  startIndex: number;
}

export default function FormBuilder({ initialForm, isNew = false }: FormBuilderProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormSchema>(initialForm);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(
    initialForm.fields.length > 0 ? initialForm.fields[0].id : null
  );
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [htmlTabs, setHtmlTabs] = useState<Record<string, 'code' | 'preview'>>({});

  // Modern Centered Alert Dialog
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    type?: DialogType;
    title: string;
    message: string;
  } | null>(null);

  const showAlert = (title: string, message: string, type: DialogType = 'danger') => {
    setAlertDialog({ isOpen: true, title, message, type });
  };

  // PDF Export state
  const [exportingPdf, setExportingPdf] = useState(false);

  const handleExportPdf = async () => {
    try {
      setExportingPdf(true);
      await exportFormToPdf(form);
    } catch (e: any) {
      console.error('Error al exportar PDF:', e);
      showAlert('Error al exportar PDF', 'No se pudo generar el documento PDF del formulario.', 'danger');
    } finally {
      setExportingPdf(false);
    }
  };

  // Selected Section in Navigator ('all' = show full form, or section id = focus that section)
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('all');

  // Update whole form properties (title, description, company, category)
  const updateFormMeta = (updates: Partial<FormSchema>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  // Update a specific field
  const updateFormField = (fieldId: string, updates: Partial<FormField>) => {
    React.startTransition(() => {
      setForm((prev) => ({
        ...prev,
        fields: prev.fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)),
      }));
    });
  };

  // Compute Structured Sections based on 'page_break' fields
  const sections: FormSection[] = useMemo(() => {
    const secList: FormSection[] = [];
    let currentSec: FormSection = {
      id: 'sec_initial',
      title: 'Sección 1: Datos Generales',
      fields: [],
      startIndex: 0,
    };

    form.fields.forEach((field, index) => {
      if (field.type === 'page_break') {
        if (currentSec.fields.length > 0 || currentSec.pageBreakField) {
          secList.push(currentSec);
        }
        currentSec = {
          id: field.id,
          title: field.sectionTitle || field.label || `Sección ${secList.length + 1}`,
          pageBreakField: field,
          fields: [],
          startIndex: index,
        };
      } else {
        currentSec.fields.push(field);
      }
    });

    if (currentSec.fields.length > 0 || currentSec.pageBreakField || secList.length === 0) {
      secList.push(currentSec);
    }

    return secList;
  }, [form.fields]);

  // Current active section object
  const activeSection = useMemo(() => {
    if (selectedSectionFilter === 'all') return null;
    return sections.find((s) => s.id === selectedSectionFilter) || sections[0] || null;
  }, [sections, selectedSectionFilter]);

  // Add new field into active section or at the end
  const handleAddField = (type: FormFieldType) => {
    const newId = `field_${Date.now()}`;
    const newField: FormField = {
      id: newId,
      type,
      label:
        type === 'page_break'
          ? 'Nueva Sección'
          : type === 'html'
          ? 'Bloque de Instrucciones HTML'
          : '¿Escriba aquí el enunciado de la pregunta?',
      required: type !== 'page_break' && type !== 'html',
      order: form.fields.length,
      showValues: true,
      sectionTitle: type === 'page_break' ? 'Nueva Sección' : undefined,
      htmlContent:
        type === 'html'
          ? `<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px;">\n  <h4 style="color: #0f172a; font-weight: bold; font-size: 14px; margin: 0 0 6px 0;">Instrucciones para esta sección</h4>\n  <p style="color: #475569; font-size: 13px; line-height: 1.5; margin: 0;">Escriba aquí el contenido, formato HTML, tablas, listas o estilos personalizados.</p>\n</div>`
          : undefined,
      options:
        type === 'radio' || type === 'select' || type === 'checkbox'
          ? [
              { id: 'opt_1', label: '1. Siempre o casi siempre', value: '1', isDefault: false },
              { id: 'opt_2', label: '2. A menudo', value: '2', isDefault: false },
              { id: 'opt_3', label: '3. A veces', value: '3', isDefault: false },
              { id: 'opt_4', label: '4. Nunca o casi nunca', value: '4', isDefault: false },
            ]
          : undefined,
    };

    setForm((prev) => {
      const newFields = [...prev.fields];

      if (selectedSectionFilter !== 'all' && activeSection) {
        // Find position of the last item in this section
        const lastSectionField = activeSection.fields[activeSection.fields.length - 1];
        if (lastSectionField) {
          const insertIdx = newFields.findIndex((f) => f.id === lastSectionField.id);
          newFields.splice(insertIdx + 1, 0, newField);
        } else if (activeSection.pageBreakField) {
          const pbIdx = newFields.findIndex((f) => f.id === activeSection.pageBreakField?.id);
          newFields.splice(pbIdx + 1, 0, newField);
        } else {
          newFields.push(newField);
        }
      } else {
        newFields.push(newField);
      }

      return { ...prev, fields: newFields };
    });

    setActiveFieldId(newId);

    // Smooth scroll into newly created field
    setTimeout(() => {
      const el = document.getElementById(`builder-field-${newId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  // Add a brand new Section (page_break)
  const handleAddNewSection = () => {
    const newSecId = `sec_${Date.now()}`;
    const nextNum = sections.length + 1;
    const defaultTitle = `Sección ${nextNum}: Nueva Sección`;

    const newPageBreak: FormField = {
      id: newSecId,
      type: 'page_break',
      label: defaultTitle,
      sectionTitle: defaultTitle,
      required: false,
      order: form.fields.length,
    };

    setForm((prev) => ({
      ...prev,
      fields: [...prev.fields, newPageBreak],
    }));

    setSelectedSectionFilter(newSecId);
    setActiveFieldId(newSecId);
  };

  // Update Section Title
  const handleUpdateSectionTitle = (sec: FormSection, newTitle: string) => {
    if (sec.pageBreakField) {
      updateFormField(sec.pageBreakField.id, {
        sectionTitle: newTitle,
        label: newTitle,
      });
    } else {
      // If initial section without page_break, we create an explicit page_break at start
      const firstPb: FormField = {
        id: `sec_pb_${Date.now()}`,
        type: 'page_break',
        label: newTitle,
        sectionTitle: newTitle,
        required: false,
        order: 0,
      };
      setForm((prev) => ({
        ...prev,
        fields: [firstPb, ...prev.fields],
      }));
      setSelectedSectionFilter(firstPb.id);
    }
  };

  // Duplicate field
  const handleDuplicateField = (field: FormField, index: number) => {
    const newId = `field_${Date.now()}`;
    const duplicated: FormField = {
      ...field,
      id: newId,
      label: `${field.label} (Copia)`,
      options: field.options?.map((o, idx) => ({ ...o, id: `opt_${Date.now()}_${idx}` })),
    };

    setForm((prev) => {
      const newFields = [...prev.fields];
      newFields.splice(index + 1, 0, duplicated);
      return { ...prev, fields: newFields };
    });

    setActiveFieldId(newId);
  };

  // Delete field
  const handleDeleteField = (fieldId: string) => {
    React.startTransition(() => {
      setForm((prev) => ({
        ...prev,
        fields: prev.fields.filter((f) => f.id !== fieldId),
      }));
      if (activeFieldId === fieldId) {
        setActiveFieldId(null);
      }
      if (selectedSectionFilter === fieldId) {
        setSelectedSectionFilter('all');
      }
    });
  };

  // Options operations
  const handleAddOption = (fieldId: string) => {
    const field = form.fields.find((f) => f.id === fieldId);
    if (!field || !field.options) return;

    const nextVal = String(field.options.length + 1);
    const newOpt: FormFieldOption = {
      id: `opt_${Date.now()}`,
      label: `Opción ${field.options.length + 1}`,
      value: nextVal,
      isDefault: false,
    };

    updateFormField(fieldId, {
      options: [...field.options, newOpt],
    });
  };

  const handleRemoveOption = (fieldId: string, optIndex: number) => {
    const field = form.fields.find((f) => f.id === fieldId);
    if (!field || !field.options || field.options.length <= 1) return;

    const newOptions = field.options.filter((_, idx) => idx !== optIndex);
    updateFormField(fieldId, { options: newOptions });
  };

  const handleUpdateOption = (
    fieldId: string,
    optIndex: number,
    key: 'label' | 'value' | 'isDefault',
    val: any
  ) => {
    const field = form.fields.find((f) => f.id === fieldId);
    if (!field || !field.options) return;

    const newOptions = field.options.map((opt, idx) => {
      if (idx === optIndex) {
        return { ...opt, [key]: val };
      }
      if (key === 'isDefault' && val === true && field.type === 'radio') {
        return { ...opt, isDefault: false };
      }
      return opt;
    });

    updateFormField(fieldId, { options: newOptions });
  };

  // Presets
  const applyPreset = (fieldId: string, presetKey: string) => {
    let options: FormFieldOption[] = [];
    if (presetKey === 'frecuencia_4') {
      options = [
        { id: `o_${Date.now()}_1`, label: '1. Siempre o casi siempre', value: '1' },
        { id: `o_${Date.now()}_2`, label: '2. A menudo', value: '2' },
        { id: `o_${Date.now()}_3`, label: '3. A veces', value: '3' },
        { id: `o_${Date.now()}_4`, label: '4. Nunca o casi nunca', value: '4' },
      ];
    } else if (presetKey === 'binaria') {
      options = [
        { id: `o_${Date.now()}_1`, label: '0. No / Nunca', value: '0' },
        { id: `o_${Date.now()}_2`, label: '1. Sí / Frecuente', value: '1' },
      ];
    } else if (presetKey === 'estres_6') {
      options = [
        { id: `o_${Date.now()}_1`, label: '1. Nunca', value: '1' },
        { id: `o_${Date.now()}_2`, label: '2. Rara vez', value: '2' },
        { id: `o_${Date.now()}_3`, label: '3. Pocas veces', value: '3' },
        { id: `o_${Date.now()}_4`, label: '4. Algunas veces', value: '4' },
        { id: `o_${Date.now()}_5`, label: '5. Frecuentemente', value: '5' },
        { id: `o_${Date.now()}_6`, label: '6. Muy frecuentemente', value: '6' },
      ];
    } else if (presetKey === 'antiguedad_3') {
      options = [
        { id: `o_${Date.now()}_1`, label: 'MENOS DE 2 AÑOS', value: '1' },
        { id: `o_${Date.now()}_2`, label: 'ENTRE 2 Y 5 AÑOS', value: '2' },
        { id: `o_${Date.now()}_3`, label: 'MÁS DE 5 AÑOS', value: '3' },
      ];
    }

    if (options.length > 0) {
      updateFormField(fieldId, { options });
    }
  };

  // Save Form Handler
  const handleSaveForm = async () => {
    try {
      setSaving(true);
      const method = isNew ? 'POST' : 'PUT';
      const url = isNew ? '/api/formularios' : `/api/formularios/${form.id}`;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (data.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);

        // Cache in localStorage for offline/serverless resilience
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(`sgt_form_${data.data.id}`, JSON.stringify(data.data));
          } catch (e) {}
        }

        if (isNew) {
          // Smoothly update URL without hard reload/404
          window.history.replaceState(null, '', `/admin/formularios/${data.data.id}`);
          setForm(data.data);
        }
      } else {
        showAlert('Error al guardar', data.error || 'No fue posible guardar el formulario.', 'danger');
      }
    } catch (err) {
      console.error(err);
      showAlert('Error de conexión', 'Ocurrió un error en el servidor al intentar guardar el formulario.', 'danger');
    } finally {
      setSaving(false);
    }
  };

  // Filtered fields to display on canvas based on section navigator
  const fieldsToDisplay = useMemo(() => {
    if (selectedSectionFilter === 'all') {
      return form.fields;
    }
    if (!activeSection) return form.fields;

    // Show the page break (if any) plus all fields belonging to this section
    const list: FormField[] = [];
    if (activeSection.pageBreakField) {
      list.push(activeSection.pageBreakField);
    }
    return [...list, ...activeSection.fields];
  }, [form.fields, selectedSectionFilter, activeSection]);

  const totalQuestionsCount = form.fields.filter((f) => f.type !== 'page_break' && f.type !== 'html').length;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col pb-24">
      {/* Top Clean Sticky Bar: Directly at top-0, ZERO gap above */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 sm:px-6 py-2.5 shadow-2xs">
        <div className="w-full flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: Volver + Título editable + Métricas */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link
              href="/admin/formularios"
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-semibold shrink-0"
              title="Volver al catálogo de formularios"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Formularios</span>
            </Link>

            <div className="h-5 w-px bg-slate-200 shrink-0" />

            {/* Título editable directamente en el encabezado */}
            <div className="min-w-0 flex-1">
              <input
                type="text"
                value={form.title}
                onChange={(e) => updateFormMeta({ title: e.target.value })}
                placeholder="Nombre del Formulario o Evaluación..."
                className="w-full text-base sm:text-lg font-bold text-slate-900 placeholder:text-slate-300 border border-transparent hover:border-slate-200 focus:border-blue-600 focus:bg-white rounded-lg px-2 py-0.5 focus:outline-none transition-colors truncate"
              />
            </div>

            <div className="hidden xl:flex items-center gap-2 text-xs text-slate-400 font-medium shrink-0">
              <span>•</span>
              <span>{totalQuestionsCount} preguntas</span>
              <span>•</span>
              <span>{sections.length} secciones</span>
            </div>
          </div>

          {/* Center / Right: Empresa, Categoría y Guardar */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-end lg:self-auto">
            {/* Empresa */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-xs">
              <span className="font-semibold text-slate-500 text-[11px]">Empresa:</span>
              <input
                type="text"
                value={form.company || ''}
                onChange={(e) => updateFormMeta({ company: e.target.value })}
                placeholder="Empresa..."
                className="bg-transparent text-xs text-slate-800 font-bold focus:outline-none w-28 sm:w-36"
              />
            </div>

            {/* Tipo: Plantilla Maestra o Formulario Empresa */}
            <label className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs cursor-pointer select-none">
              <input
                type="checkbox"
                checked={Boolean(form.isTemplate)}
                onChange={(e) => updateFormMeta({ isTemplate: e.target.checked })}
                className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 w-3.5 h-3.5"
              />
              <span className={`text-[11px] font-bold ${form.isTemplate ? 'text-purple-700' : 'text-blue-700'}`}>
                {form.isTemplate ? 'Plantilla Maestra' : 'Formulario Empresa'}
              </span>
            </label>

            {/* Categoría */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-xs">
              <span className="font-semibold text-slate-500 text-[11px]">Cat:</span>
              <select
                value={form.category || 'general'}
                onChange={(e) => updateFormMeta({ category: e.target.value as any })}
                className="bg-transparent text-xs text-slate-800 font-medium focus:outline-none"
              >
                <option value="psicosocial">Psicosocial</option>
                <option value="lips60">LIPS-60</option>
                <option value="estres">Estrés</option>
                <option value="nocturno">Nocturno</option>
                <option value="general">General</option>
              </select>
            </div>

            {savedSuccess && (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 animate-fade-in-slide">
                <Check className="w-4 h-4" /> Guardado con éxito
              </span>
            )}

            {/* Botón Exportar PDF */}
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={exportingPdf}
              className="px-3 py-2 bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs sm:text-sm font-semibold rounded-xl transition-colors inline-flex items-center gap-1.5 border border-slate-200 hover:border-rose-200 shadow-2xs disabled:opacity-50"
              title="Exportar todas las preguntas y opciones vacías en PDF para cruce de variables"
            >
              {exportingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
              ) : (
                <FileDown className="w-4 h-4 text-rose-500" />
              )}
              <span className="hidden sm:inline">Exportar PDF</span>
              <span className="sm:hidden">PDF</span>
            </button>

            {/* Botón Guardar */}
            <button
              onClick={handleSaveForm}
              disabled={saving}
              className="px-4 py-2 bg-[#0061fe] hover:bg-[#0052d9] text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Guardando...' : 'Guardar Formulario'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace: Left Sidebar + Right Canvas */}
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 pt-4 flex flex-col md:flex-row items-start gap-5">
        {/* ========================================================================= */}
        {/* BARRA IZQUIERDA: OPCIONES PARA AÑADIR + NAVEGADOR DE SECCIONES */}
        {/* ========================================================================= */}
        <aside className="w-full md:w-72 lg:w-80 shrink-0 md:sticky md:top-16 md:max-h-[calc(100vh-6rem)] flex flex-col gap-4">
          {/* BLOQUE 1: OPCIONES PARA AÑADIR CAMPOS */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Añadir Campos
              </span>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                Tipos
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleAddField('radio')}
                className="flex flex-col items-center justify-center p-2.5 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 hover:border-blue-200 rounded-xl text-xs font-semibold text-slate-700 transition-all shadow-2xs group"
              >
                <CircleDot className="w-4 h-4 text-blue-600 mb-1 group-hover:scale-110 transition-transform" />
                <span>Opción Única</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddField('checkbox')}
                className="flex flex-col items-center justify-center p-2.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 rounded-xl text-xs font-semibold text-slate-700 transition-all shadow-2xs group"
              >
                <CheckSquare className="w-4 h-4 text-indigo-600 mb-1 group-hover:scale-110 transition-transform" />
                <span>Casillas</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddField('select')}
                className="flex flex-col items-center justify-center p-2.5 bg-slate-50 hover:bg-amber-50 hover:text-amber-700 border border-slate-200 hover:border-amber-200 rounded-xl text-xs font-semibold text-slate-700 transition-all shadow-2xs group"
              >
                <ListFilter className="w-4 h-4 text-amber-600 mb-1 group-hover:scale-110 transition-transform" />
                <span>Desplegable</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddField('text')}
                className="flex flex-col items-center justify-center p-2.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 rounded-xl text-xs font-semibold text-slate-700 transition-all shadow-2xs group"
              >
                <AlignLeft className="w-4 h-4 text-emerald-600 mb-1 group-hover:scale-110 transition-transform" />
                <span>Texto Corto</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddField('textarea')}
                className="flex flex-col items-center justify-center p-2.5 bg-slate-50 hover:bg-purple-50 hover:text-purple-700 border border-slate-200 hover:border-purple-200 rounded-xl text-xs font-semibold text-slate-700 transition-all shadow-2xs group"
              >
                <FileText className="w-4 h-4 text-purple-600 mb-1 group-hover:scale-110 transition-transform" />
                <span>Párrafo</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddField('html')}
                className="flex flex-col items-center justify-center p-2.5 bg-slate-50 hover:bg-amber-50 hover:text-amber-800 border border-slate-200 hover:border-amber-200 rounded-xl text-xs font-semibold text-slate-700 transition-all shadow-2xs group"
                title="Añadir bloque de contenido o instrucciones en HTML personalizado"
              >
                <Code className="w-4 h-4 text-amber-600 mb-1 group-hover:scale-110 transition-transform" />
                <span>Bloque HTML</span>
              </button>
            </div>
          </div>

          {/* BLOQUE 2: NAVEGADOR DE SECCIONES */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex-1 flex flex-col min-h-0 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600" />
                <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
                  Navegador Secciones
                </span>
              </div>

              <button
                type="button"
                onClick={handleAddNewSection}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#0061fe] hover:bg-[#0052d9] text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                title="Crear una nueva sección para navegación siguiente-siguiente"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Sección</span>
              </button>
            </div>

            {/* Toggle: Ver Todas vs Filtrar Sección */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setSelectedSectionFilter('all')}
                className={`flex-1 py-1 px-2 rounded-md font-semibold transition-all text-center ${
                  selectedSectionFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ver Todas ({form.fields.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  if (selectedSectionFilter === 'all' && sections.length > 0) {
                    setSelectedSectionFilter(sections[0].id);
                  }
                }}
                className={`flex-1 py-1 px-2 rounded-md font-semibold transition-all text-center ${
                  selectedSectionFilter !== 'all'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Por Sección
              </button>
            </div>

            {/* Sections List */}
            <div className="overflow-y-auto space-y-1.5 max-h-72 md:max-h-[300px] pr-1">
              {sections.map((sec, idx) => {
                const isActive = selectedSectionFilter === sec.id;
                const qCount = sec.fields.filter((f) => f.type !== 'page_break' && f.type !== 'html').length;

                return (
                  <div
                    key={sec.id}
                    onClick={() => {
                      React.startTransition(() => {
                        setSelectedSectionFilter(sec.id);
                      });
                      requestAnimationFrame(() => {
                        const el = document.getElementById(`builder-section-${sec.id}`);
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      });
                    }}
                    className={`p-2.5 rounded-xl cursor-pointer text-xs transition-all border ${
                      isActive
                        ? 'bg-blue-50/80 border-blue-300 text-blue-900 font-semibold shadow-2xs'
                        : 'bg-slate-50/60 hover:bg-slate-100 border-slate-200/80 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-blue-700 shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-slate-800 truncate">
                          {sec.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200 shrink-0">
                        {qCount} {qCount === 1 ? 'preg' : 'pregs'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* ========================================================================= */}
        {/* CANVAS PRINCIPAL (DERECHA): DESCRIPCIÓN, SECCIÓN ACTIVA Y PREGUNTAS */}
        {/* ========================================================================= */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* DESCRIPCIÓN DEL FORMULARIO (COMPACTA Y LIMPIA) */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 px-4 shadow-2xs">
            <input
              type="text"
              value={form.description || ''}
              onChange={(e) => updateFormMeta({ description: e.target.value })}
              placeholder="+ Añadir descripción general o instrucciones de la evaluación para los evaluados..."
              className="w-full text-xs text-slate-600 placeholder:text-slate-400 border-none focus:outline-none py-0.5"
            />
          </div>

          {/* SECTION HEADER BANNER (IF FILTERED BY SECTION) */}
          {selectedSectionFilter !== 'all' && activeSection && (
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 px-4 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <SplitSquareVertical className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-bold text-blue-900">Editando Sección:</span>
                <input
                  type="text"
                  value={activeSection.title}
                  onChange={(e) => handleUpdateSectionTitle(activeSection, e.target.value)}
                  className="bg-white border border-blue-200 px-2.5 py-1 rounded-lg font-bold text-blue-950 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[200px]"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-semibold text-blue-700">
                  {activeSection.fields.filter((f) => f.type !== 'page_break' && f.type !== 'html').length} preguntas en esta pantalla
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedSectionFilter('all')}
                  className="px-2.5 py-1 bg-white hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-colors"
                >
                  Ver Todas las Secciones
                </button>
              </div>
            </div>
          )}

          {/* LISTA DE CAMPOS Y PREGUNTAS */}
          <div className="space-y-4">
            {fieldsToDisplay.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200 space-y-2">
                <Layers className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-700">Esta sección no tiene preguntas aún.</p>
                <p>Use la barra izquierda para añadir preguntas (Opción Única, Casillas, Texto, etc.).</p>
              </div>
            ) : (
              fieldsToDisplay.map((field, fieldIndex) => {
                const isSelected = activeFieldId === field.id;

                // RENDER: Salto de Sección (page_break)
                if (field.type === 'page_break') {
                  return (
                    <div
                      key={field.id}
                      id={`builder-section-${field.id}`}
                      onClick={() => setActiveFieldId(field.id)}
                      className="py-2 my-1"
                    >
                      <div className="relative flex items-center justify-between gap-3">
                        <div className="flex-1 border-t-2 border-dashed border-blue-200" />

                        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-4 py-1.5 rounded-full text-xs font-bold text-blue-900 shadow-xs">
                          <SplitSquareVertical className="w-4 h-4 text-blue-600 shrink-0" />
                          <input
                            type="text"
                            value={field.sectionTitle || field.label}
                            onChange={(e) =>
                              updateFormField(field.id, {
                                sectionTitle: e.target.value,
                                label: e.target.value,
                              })
                            }
                            placeholder="Nombre de la Sección..."
                            className="bg-transparent border-none focus:outline-none font-bold text-blue-900 text-xs w-60 sm:w-80 text-center"
                          />
                        </div>

                        <div className="flex-1 border-t-2 border-dashed border-blue-200" />

                        <button
                          type="button"
                          onClick={() => handleDeleteField(field.id)}
                          title="Eliminar salto de sección"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                }

                // RENDER: Pregunta Normal
                return (
                  <div
                    key={field.id}
                    id={`builder-field-${field.id}`}
                    onClick={() => setActiveFieldId(field.id)}
                    className={`bg-white rounded-2xl p-5 sm:p-6 transition-all duration-150 border ${
                      isSelected
                        ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                        : 'border-slate-200/90 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    {/* Header de la Pregunta: Enunciado y Tipo */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => updateFormField(field.id, { label: e.target.value })}
                          placeholder={field.type === 'html' ? 'Título o Referencia del Bloque HTML (Opcional)...' : 'Escriba la pregunta aquí...'}
                          className="w-full text-sm sm:text-base font-bold text-slate-900 placeholder:text-slate-300 border-b border-transparent hover:border-slate-200 focus:border-blue-600 focus:outline-none py-1 transition-colors"
                        />

                        {/* Descripción opcional */}
                        <input
                          type="text"
                          value={field.description || ''}
                          onChange={(e) => updateFormField(field.id, { description: e.target.value })}
                          placeholder="+ Añadir descripción o nota aclaratoria (opcional)..."
                          className="w-full text-xs text-slate-500 placeholder:text-slate-300 border-b border-transparent hover:border-slate-200 focus:border-blue-600 focus:outline-none py-0.5 mt-0.5 transition-colors"
                        />
                      </div>

                      {/* Selector de Tipo de Campo */}
                      <div className="flex items-center gap-2 self-start shrink-0">
                        <select
                          value={field.type}
                          onChange={(e) => {
                            const newType = e.target.value as FormFieldType;
                            updateFormField(field.id, {
                              type: newType,
                              required: newType === 'html' ? false : field.required,
                              htmlContent:
                                newType === 'html' && !field.htmlContent
                                  ? `<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px;">\n  <h4 style="color: #0f172a; font-weight: bold; font-size: 14px; margin: 0 0 6px 0;">Instrucciones para esta sección</h4>\n  <p style="color: #475569; font-size: 13px; line-height: 1.5; margin: 0;">Escriba aquí el contenido, formato HTML, tablas, listas o estilos personalizados.</p>\n</div>`
                                  : field.htmlContent,
                              options:
                                (newType === 'radio' || newType === 'select' || newType === 'checkbox') &&
                                (!field.options || field.options.length === 0)
                                  ? [
                                      { id: 'opt_1', label: '1. Siempre o casi siempre', value: '1' },
                                      { id: 'opt_2', label: '2. A menudo', value: '2' },
                                      { id: 'opt_3', label: '3. A veces', value: '3' },
                                      { id: 'opt_4', label: '4. Nunca o casi nunca', value: '4' },
                                    ]
                                  : field.options,
                            });
                          }}
                          className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 focus:outline-none focus:border-blue-600 transition-colors"
                        >
                          <option value="radio">Opción Única (Radio)</option>
                          <option value="checkbox">Casillas (Checkbox)</option>
                          <option value="select">Desplegable (Select)</option>
                          <option value="text">Texto Corto</option>
                          <option value="textarea">Párrafo / Observaciones</option>
                          <option value="html">Bloque de Contenido HTML</option>
                        </select>
                      </div>
                    </div>

                    {/* Opciones de Respuesta (para radio, checkbox, select) */}
                    {(field.type === 'radio' || field.type === 'checkbox' || field.type === 'select') && (
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                          <span>Opciones de Respuesta</span>
                          <div className="flex items-center gap-3">
                            <span className="hidden sm:inline">Valor Numérico</span>
                            <div className="relative group/preset">
                              <button
                                type="button"
                                className="text-blue-600 hover:text-blue-700 font-bold inline-flex items-center gap-1 text-[11px]"
                              >
                                <span>Escalas Rápidas ▾</span>
                              </button>
                              <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-lg z-20 p-2 hidden group-hover/preset:block space-y-1">
                                <button
                                  type="button"
                                  onClick={() => applyPreset(field.id, 'frecuencia_4')}
                                  className="w-full text-left px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 rounded"
                                >
                                  Frecuencia 4 (Siempre... Nunca)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => applyPreset(field.id, 'binaria')}
                                  className="w-full text-left px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 rounded"
                                >
                                  Binaria (0. No / 1. Sí)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => applyPreset(field.id, 'estres_6')}
                                  className="w-full text-left px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 rounded"
                                >
                                  Escala Estrés 6 Puntos
                                </button>
                                <button
                                  type="button"
                                  onClick={() => applyPreset(field.id, 'antiguedad_3')}
                                  className="w-full text-left px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 rounded"
                                >
                                  Antigüedad (3 tramos)
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Options Rows */}
                        <div className="space-y-1.5">
                          {field.options?.map((opt, optIdx) => (
                            <div key={opt.id} className="flex items-center gap-2 group/opt">
                              <span className="text-slate-400">
                                {field.type === 'radio' && <CircleDot className="w-3.5 h-3.5" />}
                                {field.type === 'checkbox' && <CheckSquare className="w-3.5 h-3.5" />}
                                {field.type === 'select' && <ListFilter className="w-3.5 h-3.5" />}
                              </span>

                              <input
                                type="text"
                                value={opt.label}
                                onChange={(e) =>
                                  handleUpdateOption(field.id, optIdx, 'label', e.target.value)
                                }
                                placeholder={`Opción ${optIdx + 1}`}
                                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                              />

                              <input
                                type="text"
                                value={opt.value}
                                onChange={(e) =>
                                  handleUpdateOption(field.id, optIdx, 'value', e.target.value)
                                }
                                placeholder="Valor"
                                title="Valor numérico ponderado para cálculo psicométrico"
                                className="w-14 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-center text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                              />

                              {field.options && field.options.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveOption(field.id, optIdx)}
                                  className="p-1 text-slate-300 hover:text-rose-600 transition-colors"
                                  title="Eliminar opción"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => handleAddOption(field.id)}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Añadir opción</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Preview texto */}
                    {field.type === 'text' && (
                      <div className="pt-2 border-t border-slate-100">
                        <input
                          type="text"
                          disabled
                          placeholder="Espacio para respuesta de texto corto del trabajador..."
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50/60 text-slate-400"
                        />
                      </div>
                    )}

                    {/* Preview textarea */}
                    {field.type === 'textarea' && (
                      <div className="pt-2 border-t border-slate-100">
                        <textarea
                          disabled
                          rows={2}
                          placeholder="Espacio para observaciones o respuesta larga..."
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50/60 text-slate-400 resize-none"
                        />
                      </div>
                    )}

                    {/* Editor y Vista Previa HTML */}
                    {field.type === 'html' && (
                      <div className="pt-2 border-t border-slate-100 space-y-2.5">
                        {/* Barra superior de herramientas HTML: Modos + Inserción Rápida */}
                        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2">
                          {/* Selector de modo: Editor de Código vs Vista Previa */}
                          <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-xs shadow-2xs">
                            <button
                              type="button"
                              onClick={() => setHtmlTabs((prev) => ({ ...prev, [field.id]: 'code' }))}
                              className={`px-2.5 py-1 rounded-md font-semibold inline-flex items-center gap-1.5 transition-all ${
                                (htmlTabs[field.id] || 'code') === 'code'
                                  ? 'bg-amber-500 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              <Code className="w-3.5 h-3.5" />
                              <span>Código HTML</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setHtmlTabs((prev) => ({ ...prev, [field.id]: 'preview' }))}
                              className={`px-2.5 py-1 rounded-md font-semibold inline-flex items-center gap-1.5 transition-all ${
                                htmlTabs[field.id] === 'preview'
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Vista Previa</span>
                            </button>
                          </div>

                          {/* Inserción rápida de componentes HTML prediseñados */}
                          <div className="flex items-center gap-1 flex-wrap text-[11px]">
                            <span className="text-slate-400 font-semibold mr-0.5 hidden sm:inline">Insertar:</span>
                            <button
                              type="button"
                              onClick={() => {
                                const snippet = `<div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px 16px; margin: 8px 0;">\n  <h4 style="color: #1e40af; font-weight: bold; margin: 0 0 4px 0;">ℹ Información Importante</h4>\n  <p style="color: #1e3a8a; font-size: 13px; margin: 0;">Escriba aquí las indicaciones especiales para este módulo.</p>\n</div>`;
                                updateFormField(field.id, { htmlContent: (field.htmlContent ? field.htmlContent + '\n' : '') + snippet });
                              }}
                              className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md border border-blue-200 transition-colors font-medium"
                              title="Insertar caja de alerta azul informativa"
                            >
                              + Alerta Azul
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const snippet = `<div style="background-color: #fefce8; border: 1px solid #fef08a; border-radius: 8px; padding: 12px 16px; margin: 8px 0;">\n  <h4 style="color: #854d0e; font-weight: bold; margin: 0 0 4px 0;">⚠ Atención</h4>\n  <p style="color: #713f12; font-size: 13px; margin: 0;">Recuerde contestar con total sinceridad y tranquilidad.</p>\n</div>`;
                                updateFormField(field.id, { htmlContent: (field.htmlContent ? field.htmlContent + '\n' : '') + snippet });
                              }}
                              className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-md border border-amber-200 transition-colors font-medium"
                              title="Insertar caja de aviso amarilla"
                            >
                              + Aviso
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const snippet = `<table style="width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 13px;">\n  <thead>\n    <tr style="background-color: #f1f5f9;">\n      <th style="border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left;">Criterio</th>\n      <th style="border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left;">Descripción</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Opción A</td>\n      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Detalle explicativo</td>\n    </tr>\n  </tbody>\n</table>`;
                                updateFormField(field.id, { htmlContent: (field.htmlContent ? field.htmlContent + '\n' : '') + snippet });
                              }}
                              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md border border-slate-300 transition-colors font-medium"
                              title="Insertar tabla HTML con bordes"
                            >
                              + Tabla
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const snippet = `<ul style="margin: 8px 0; padding-left: 20px; color: #334155; font-size: 13px; line-height: 1.6;">\n  <li>Primer punto de instrucción o consideración.</li>\n  <li>Segundo punto de instrucción o consideración.</li>\n</ul>`;
                                updateFormField(field.id, { htmlContent: (field.htmlContent ? field.htmlContent + '\n' : '') + snippet });
                              }}
                              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md border border-slate-300 transition-colors font-medium"
                              title="Insertar lista con viñetas"
                            >
                              + Lista
                            </button>
                          </div>
                        </div>

                        {/* Contenido: Editor de código o Render de Vista Previa */}
                        {(htmlTabs[field.id] || 'code') === 'code' ? (
                          <div className="relative">
                            <textarea
                              rows={8}
                              value={field.htmlContent || ''}
                              onChange={(e) => updateFormField(field.id, { htmlContent: e.target.value })}
                              placeholder="<!-- Escriba o pegue aquí su código HTML, etiquetas <div>, <p>, <table>, estilos en línea, etc. -->"
                              className="w-full p-3 font-mono text-xs text-emerald-300 bg-slate-900 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed resize-y selection:bg-amber-500 selection:text-white"
                              spellCheck={false}
                            />
                            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 px-1">
                              <span>Admite HTML5 estándar, tablas, estilos en línea (style="...") y banners.</span>
                              <span className="font-mono font-medium">{(field.htmlContent || '').length} caracteres</span>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 bg-white border border-slate-200 rounded-xl min-h-[120px] shadow-2xs">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 pb-1 border-b border-slate-100 flex items-center justify-between">
                              <span>Vista Previa en Vivo (Evaluado)</span>
                              <span className="text-blue-600 font-semibold text-[11px]">Diseño en tiempo real</span>
                            </div>
                            {field.htmlContent && field.htmlContent.trim() !== '' ? (
                              <div
                                className="prose prose-sm max-w-none text-slate-800 leading-relaxed overflow-x-auto"
                                dangerouslySetInnerHTML={{ __html: field.htmlContent }}
                              />
                            ) : (
                              <div className="text-center py-6 text-slate-400 text-xs italic">
                                (No hay contenido HTML para previsualizar. Vuelva al Editor HTML para escribir código)
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Toolbar inferior de la tarjeta: Obligatoria o Informativa, Duplicar, Eliminar */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      {field.type === 'html' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg text-[11px] font-semibold text-amber-800">
                          <Code className="w-3.5 h-3.5 text-amber-600" />
                          <span>Contenido Informativo (No requiere respuesta del trabajador)</span>
                        </span>
                      ) : (
                        <label className="flex items-center gap-1.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateFormField(field.id, { required: e.target.checked })}
                            className="rounded text-blue-600 focus:ring-0 w-3.5 h-3.5"
                          />
                          <span className="font-medium text-slate-700">Obligatoria *</span>
                        </label>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDuplicateField(field, fieldIndex)}
                          className="px-2 py-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors inline-flex items-center gap-1 font-medium"
                          title="Duplicar elemento"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Duplicar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteField(field.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Eliminar elemento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {alertDialog && (
        <ConfirmDialog
          isOpen={alertDialog.isOpen}
          type={alertDialog.type}
          title={alertDialog.title}
          message={alertDialog.message}
          confirmText="Entendido"
          cancelText={null}
          onConfirm={() => setAlertDialog(null)}
        />
      )}
    </div>
  );
}
