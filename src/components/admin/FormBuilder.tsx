'use client';

import React, { useState } from 'react';
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
  HelpCircle,
  Sparkles,
  ChevronDown,
  Layers,
  Settings2,
  X
} from 'lucide-react';
import { FormSchema, FormField, FormFieldOption, FormFieldType } from '@/lib/types';

interface FormBuilderProps {
  initialForm: FormSchema;
  isNew?: boolean;
}

export default function FormBuilder({ initialForm, isNew = false }: FormBuilderProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormSchema>(initialForm);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(
    initialForm.fields.length > 0 ? initialForm.fields[0].id : null
  );
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Batch presets modal state
  const [batchFieldId, setBatchFieldId] = useState<string | null>(null);
  const [batchText, setBatchText] = useState('');

  // Update whole form properties (title, description, company)
  const updateFormMeta = (updates: Partial<FormSchema>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  // Update a specific field
  const updateFormField = (fieldId: string, updates: Partial<FormField>) => {
    setForm((prev) => ({
      ...prev,
      fields: prev.fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)),
    }));
  };

  // Add new field (can insert at end or after active index)
  const handleAddField = (type: FormFieldType, insertAfterIndex?: number) => {
    const newId = `field_${Date.now()}`;
    const newField: FormField = {
      id: newId,
      type,
      label: type === 'page_break' ? 'Nueva Sección' : '¿Escriba aquí el enunciado de la pregunta?',
      required: type !== 'page_break',
      order: form.fields.length,
      showValues: true,
      sectionTitle: type === 'page_break' ? 'Nueva Sección' : undefined,
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
      if (typeof insertAfterIndex === 'number' && insertAfterIndex >= 0) {
        newFields.splice(insertAfterIndex + 1, 0, newField);
      } else {
        newFields.push(newField);
      }
      return { ...prev, fields: newFields };
    });

    setActiveFieldId(newId);

    // Smooth scroll into the newly added field
    setTimeout(() => {
      const el = document.getElementById(`builder-field-${newId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
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
    setForm((prev) => ({
      ...prev,
      fields: prev.fields.filter((f) => f.id !== fieldId),
    }));
    if (activeFieldId === fieldId) {
      setActiveFieldId(null);
    }
  };

  // Option Operations
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
        setTimeout(() => setSavedSuccess(false), 2500);
        if (isNew) {
          router.push(`/admin/formularios/${data.data.id}`);
        }
      } else {
        alert(data.error || 'Error al guardar el formulario');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión en el servidor al guardar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfdfe] flex flex-col pb-24">
      {/* Top Clean Sticky Bar: Centrado y sin ruido */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-slate-200 sticky top-16 z-30 px-4 sm:px-8 py-3.5 shadow-2xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/admin"
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-semibold shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Volver</span>
            </Link>
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <span className="text-xs text-slate-400 font-medium truncate">
              {isNew ? 'Nuevo Formulario' : 'Editando Formulario'} • {form.fields.length} campos
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {savedSuccess && (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 animate-fade-in-slide">
                <Check className="w-4 h-4" /> Guardado
              </span>
            )}
            <button
              onClick={handleSaveForm}
              disabled={saving}
              className="px-4 py-2 bg-[#0061fe] hover:bg-[#0052d9] text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors inline-flex items-center gap-2 shadow-xs disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Guardando...' : 'Guardar Formulario'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Centered Document Canvas (Totalmente centrado y oxigenado) */}
      <div className="max-w-4xl w-full mx-auto px-4 sm:px-8 pt-8 space-y-8 animate-fade-in-slide">
        
        {/* Form Title & Description Card: Limpio, minimalista y editable */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs hover:border-slate-300 transition-all space-y-3">
          <input
            type="text"
            value={form.title}
            onChange={(e) => updateFormMeta({ title: e.target.value })}
            placeholder="Título del Formulario o Evaluación..."
            className="w-full text-2xl sm:text-3xl font-bold text-slate-900 placeholder:text-slate-300 border-b border-transparent hover:border-slate-200 focus:border-blue-600 focus:outline-none py-1 transition-colors"
          />

          <textarea
            rows={2}
            value={form.description || ''}
            onChange={(e) => updateFormMeta({ description: e.target.value })}
            placeholder="Añada una descripción o instrucciones para los evaluados..."
            className="w-full text-sm text-slate-600 placeholder:text-slate-400 border-b border-transparent hover:border-slate-200 focus:border-blue-600 focus:outline-none py-1 transition-colors resize-none"
          />

          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg">
              <span className="font-semibold text-slate-700">Empresa:</span>
              <input
                type="text"
                value={form.company || ''}
                onChange={(e) => updateFormMeta({ company: e.target.value })}
                placeholder="Ej. PREVENCIÓN SGT"
                className="bg-transparent text-xs text-slate-800 font-medium focus:outline-none w-36"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg">
              <span className="font-semibold text-slate-700">Categoría:</span>
              <select
                value={form.category || 'general'}
                onChange={(e) => updateFormMeta({ category: e.target.value as any })}
                className="bg-transparent text-xs text-slate-800 font-medium focus:outline-none"
              >
                <option value="psicosocial">Psicosocial (FPSICO)</option>
                <option value="lips60">Cuestionario LIPS-60</option>
                <option value="estres">Estrés Laboral</option>
                <option value="nocturno">Trabajo Nocturno</option>
                <option value="general">General / Personalizado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Fields List: Cards amplias, limpias y centradas */}
        <div className="space-y-5">
          {form.fields.map((field, fieldIndex) => {
            const isSelected = activeFieldId === field.id;

            // Render: Section Break (Salto de Página)
            if (field.type === 'page_break') {
              return (
                <div
                  key={field.id}
                  id={`builder-field-${field.id}`}
                  onClick={() => setActiveFieldId(field.id)}
                  className="py-4 my-2 animate-fade-in-slide"
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
                        className="bg-transparent border-none focus:outline-none font-bold text-blue-900 text-xs w-56 sm:w-72 text-center"
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

            // Render: Question Card
            return (
              <div
                key={field.id}
                id={`builder-field-${field.id}`}
                onClick={() => setActiveFieldId(field.id)}
                className={`bg-white rounded-2xl p-6 sm:p-7 transition-all duration-150 border ${
                  isSelected
                    ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                    : 'border-slate-200/90 hover:border-slate-300 shadow-xs'
                }`}
              >
                {/* Question Header: Enunciado y Tipo de Campo */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => updateFormField(field.id, { label: e.target.value })}
                      placeholder="Escriba la pregunta aquí..."
                      className="w-full text-base sm:text-lg font-semibold text-slate-900 placeholder:text-slate-300 border-b border-transparent hover:border-slate-200 focus:border-blue-600 focus:outline-none py-1 transition-colors"
                    />

                    {/* Optional Question Description */}
                    <input
                      type="text"
                      value={field.description || ''}
                      onChange={(e) => updateFormField(field.id, { description: e.target.value })}
                      placeholder="+ Añadir descripción o nota aclaratoria (opcional)..."
                      className="w-full text-xs text-slate-500 placeholder:text-slate-300 border-b border-transparent hover:border-slate-200 focus:border-blue-600 focus:outline-none py-1 mt-1 transition-colors"
                    />
                  </div>

                  {/* Field Type Selector */}
                  <div className="flex items-center gap-2 self-start shrink-0">
                    <select
                      value={field.type}
                      onChange={(e) => {
                        const newType = e.target.value as FormFieldType;
                        updateFormField(field.id, {
                          type: newType,
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
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 focus:outline-none focus:border-blue-600 transition-colors"
                    >
                      <option value="radio">Opción Única (Radio)</option>
                      <option value="checkbox">Casillas (Checkbox)</option>
                      <option value="select">Desplegable (Select)</option>
                      <option value="text">Texto Corto</option>
                      <option value="textarea">Párrafo / Observaciones</option>
                    </select>
                  </div>
                </div>

                {/* Question Options List (For Radio, Checkbox, Select) */}
                {(field.type === 'radio' || field.type === 'checkbox' || field.type === 'select') && (
                  <div className="space-y-2.5 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                      <span>Opciones de respuesta</span>
                      <div className="flex items-center gap-3">
                        <span className="hidden sm:inline">Valor Numérico</span>
                        {/* Quick preset button */}
                        <div className="relative group">
                          <button
                            type="button"
                            className="text-blue-600 hover:text-blue-700 font-medium normal-case flex items-center gap-1"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Escalas rápidas</span>
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 hidden group-hover:block z-20 space-y-1">
                            <button
                              type="button"
                              onClick={() => applyPreset(field.id, 'frecuencia_4')}
                              className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors font-medium"
                            >
                              Frecuencia (1 a 4)
                            </button>
                            <button
                              type="button"
                              onClick={() => applyPreset(field.id, 'binaria')}
                              className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors font-medium"
                            >
                              Sí / No (0 y 1)
                            </button>
                            <button
                              type="button"
                              onClick={() => applyPreset(field.id, 'estres_6')}
                              className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors font-medium"
                            >
                              Estrés OIT (1 a 6)
                            </button>
                            <button
                              type="button"
                              onClick={() => applyPreset(field.id, 'antiguedad_3')}
                              className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors font-medium"
                            >
                              Antigüedad (3 rangos)
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Option Rows */}
                    <div className="space-y-2">
                      {field.options?.map((opt, optIdx) => (
                        <div key={opt.id} className="flex items-center gap-2 group/opt">
                          {/* Option Bullet / Radio preview */}
                          <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0 flex items-center justify-center">
                            {field.type === 'radio' && <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />}
                          </div>

                          {/* Etiqueta */}
                          <input
                            type="text"
                            value={opt.label}
                            onChange={(e) =>
                              handleUpdateOption(field.id, optIdx, 'label', e.target.value)
                            }
                            placeholder={`Opción ${optIdx + 1}`}
                            className="flex-1 px-3 py-1.5 bg-slate-50/70 border border-slate-200 hover:border-slate-300 focus:border-blue-600 focus:bg-white rounded-lg text-xs sm:text-sm text-slate-800 transition-colors focus:outline-none"
                          />

                          {/* Valor Numérico */}
                          <input
                            type="text"
                            value={opt.value}
                            onChange={(e) =>
                              handleUpdateOption(field.id, optIdx, 'value', e.target.value)
                            }
                            placeholder="Val"
                            title="Valor numérico exportable a Excel y FPSICO"
                            className="w-16 px-2 py-1.5 bg-slate-50/70 border border-slate-200 hover:border-slate-300 focus:border-blue-600 focus:bg-white rounded-lg text-xs font-mono text-center text-slate-700 transition-colors focus:outline-none"
                          />

                          {/* Delete Option */}
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(field.id, optIdx)}
                            className="p-1 text-slate-300 hover:text-rose-600 rounded transition-colors"
                            title="Eliminar opción"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add Option Button */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => handleAddOption(field.id)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 py-1 inline-flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Añadir opción</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Text Field Preview */}
                {field.type === 'text' && (
                  <div className="pt-2 border-t border-slate-100">
                    <input
                      type="text"
                      disabled
                      placeholder="Espacio para respuesta de texto corto del trabajador..."
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50/60 text-slate-400"
                    />
                  </div>
                )}

                {/* Textarea Field Preview */}
                {field.type === 'textarea' && (
                  <div className="pt-2 border-t border-slate-100">
                    <textarea
                      disabled
                      rows={2}
                      placeholder="Espacio para observaciones o respuesta larga..."
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50/60 text-slate-400 resize-none"
                    />
                  </div>
                )}

                {/* Card Bottom Toolbar: Obligatorio, Duplicar, Eliminar */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => updateFormField(field.id, { required: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-0 w-3.5 h-3.5"
                    />
                    <span className="font-medium text-slate-700">Obligatoria *</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDuplicateField(field, fieldIndex)}
                      className="px-2.5 py-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors inline-flex items-center gap-1 font-medium"
                      title="Duplicar pregunta"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Duplicar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteField(field.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Eliminar pregunta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Centered Add Field Bar: Oxigenado y con iconos claros */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-center gap-2.5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
            + Añadir:
          </span>

          <button
            type="button"
            onClick={() => handleAddField('radio')}
            className="px-3 py-1.5 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors inline-flex items-center gap-1.5 shadow-2xs"
          >
            <CircleDot className="w-3.5 h-3.5 text-blue-600" />
            <span>Opción Única</span>
          </button>

          <button
            type="button"
            onClick={() => handleAddField('checkbox')}
            className="px-3 py-1.5 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors inline-flex items-center gap-1.5 shadow-2xs"
          >
            <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
            <span>Casillas</span>
          </button>

          <button
            type="button"
            onClick={() => handleAddField('select')}
            className="px-3 py-1.5 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors inline-flex items-center gap-1.5 shadow-2xs"
          >
            <ListFilter className="w-3.5 h-3.5 text-amber-600" />
            <span>Desplegable</span>
          </button>

          <button
            type="button"
            onClick={() => handleAddField('text')}
            className="px-3 py-1.5 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors inline-flex items-center gap-1.5 shadow-2xs"
          >
            <AlignLeft className="w-3.5 h-3.5 text-emerald-600" />
            <span>Texto Corto</span>
          </button>

          <button
            type="button"
            onClick={() => handleAddField('textarea')}
            className="px-3 py-1.5 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors inline-flex items-center gap-1.5 shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5 text-purple-600" />
            <span>Observaciones</span>
          </button>

          <button
            type="button"
            onClick={() => handleAddField('page_break')}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-bold text-blue-800 transition-colors inline-flex items-center gap-1.5 shadow-2xs"
          >
            <SplitSquareVertical className="w-3.5 h-3.5 text-blue-600" />
            <span>Salto de Sección</span>
          </button>
        </div>
      </div>
    </div>
  );
}
