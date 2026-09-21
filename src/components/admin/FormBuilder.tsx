'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Trash2,
  Copy,
  GripVertical,
  Settings,
  X,
  FileCode,
  Save,
  Sliders,
  Eye,
  Check,
  ChevronDown,
  ArrowUpDown,
  AlignLeft,
  CircleDot,
  CheckSquare,
  ListFilter,
  SplitSquareVertical,
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

  // Batch options modal state
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchText, setBatchText] = useState('');

  const activeField = form.fields.find((f) => f.id === activeFieldId) || null;

  const handleAddField = (type: FormFieldType) => {
    const newId = `field_${Date.now()}`;
    const newField: FormField = {
      id: newId,
      type,
      label: type === 'page_break' ? 'SALTO DE PÁGINA' : 'Nueva Pregunta',
      required: type !== 'page_break',
      order: form.fields.length,
      showValues: true,
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

    setForm((prev) => ({
      ...prev,
      fields: [...prev.fields, newField],
    }));
    setActiveFieldId(newId);
  };

  const handleDuplicateField = (field: FormField) => {
    const newId = `field_${Date.now()}`;
    const duplicated: FormField = {
      ...field,
      id: newId,
      label: `${field.label} (Copia)`,
      order: form.fields.length,
      options: field.options?.map((o, idx) => ({ ...o, id: `opt_${Date.now()}_${idx}` })),
    };

    setForm((prev) => ({
      ...prev,
      fields: [...prev.fields, duplicated],
    }));
    setActiveFieldId(newId);
  };

  const handleDeleteField = (fieldId: string) => {
    setForm((prev) => ({
      ...prev,
      fields: prev.fields.filter((f) => f.id !== fieldId),
    }));
    if (activeFieldId === fieldId) {
      setActiveFieldId(null);
    }
  };

  const updateActiveField = (updates: Partial<FormField>) => {
    if (!activeFieldId) return;
    setForm((prev) => ({
      ...prev,
      fields: prev.fields.map((f) => (f.id === activeFieldId ? { ...f, ...updates } : f)),
    }));
  };

  // Option operations in settings panel (matching screenshots 2 & 3)
  const handleAddOption = (afterIndex?: number) => {
    if (!activeField || !activeField.options) return;
    const nextVal = String(activeField.options.length + 1);
    const newOpt: FormFieldOption = {
      id: `opt_${Date.now()}`,
      label: `Opción ${activeField.options.length + 1}`,
      value: nextVal,
      isDefault: false,
    };

    const newOptions = [...activeField.options];
    if (typeof afterIndex === 'number') {
      newOptions.splice(afterIndex + 1, 0, newOpt);
    } else {
      newOptions.push(newOpt);
    }
    updateActiveField({ options: newOptions });
  };

  const handleRemoveOption = (index: number) => {
    if (!activeField || !activeField.options) return;
    if (activeField.options.length <= 1) return;
    const newOptions = activeField.options.filter((_, i) => i !== index);
    updateActiveField({ options: newOptions });
  };

  const handleUpdateOption = (index: number, key: 'label' | 'value' | 'isDefault', val: any) => {
    if (!activeField || !activeField.options) return;
    const newOptions = activeField.options.map((opt, i) => {
      if (i === index) {
        return { ...opt, [key]: val };
      }
      if (key === 'isDefault' && val === true && activeField.type === 'radio') {
        return { ...opt, isDefault: false };
      }
      return opt;
    });
    updateActiveField({ options: newOptions });
  };

  const applyBatchPreset = (type: string) => {
    let presetText = '';
    if (type === 'frecuencia_4') {
      presetText = '1. Siempre o casi siempre|1\n2. A menudo|2\n3. A veces|3\n4. Nunca o casi nunca|4';
    } else if (type === 'binaria_cero') {
      presetText = '0. No / Nunca|0\n1. Sí / Frecuente|1';
    } else if (type === 'estres_6') {
      presetText = '1. Nunca|1\n2. Rara vez|2\n3. Pocas veces|3\n4. Algunas veces|4\n5. Frecuentemente|5\n6. Muy frecuentemente|6';
    } else if (type === 'antiguedad_3') {
      presetText = 'MENOS DE 2 AÑOS|1\nENTRE 2 Y 5 AÑOS|2\nMÁS DE 5 AÑOS|3';
    } else if (type === 'horarios_3') {
      presetText = 'HORARIO DÍA|1\nHORARIO NOCTURNO|2\nTURNOS ROTATIVOS|3';
    }
    setBatchText(presetText);
  };

  const handleApplyBatch = () => {
    if (!activeField) return;
    const lines = batchText.split('\n').map((l) => l.trim()).filter(Boolean);
    const parsedOptions: FormFieldOption[] = lines.map((line, idx) => {
      let label = line;
      let value = String(idx + 1);
      if (line.includes('|')) {
        const parts = line.split('|');
        label = parts[0].trim();
        value = parts[1].trim();
      }
      return {
        id: `opt_${Date.now()}_${idx}`,
        label,
        value,
        isDefault: false,
      };
    });

    updateActiveField({ options: parsedOptions });
    setShowBatchModal(false);
    setBatchText('');
  };

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
        alert(data.error || 'Error al guardar');
      }
    } catch (err) {
      console.error(err);
      alert('Error en el servidor');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar matching Gravity Forms header */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-16 z-20 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 text-sm sm:text-base">{form.title}</span>
            <ChevronDown className="w-4 h-4 text-slate-400 cursor-pointer" />
          </div>

          <div className="hidden md:flex items-center gap-3 text-xs text-slate-500 border-l border-slate-200 pl-4">
            <span className="hover:text-blue-600 cursor-pointer font-medium">Ajustes</span>
            <span className="hover:text-blue-600 cursor-pointer font-medium">Entradas</span>
            <span className="text-slate-400">|</span>
            <span className="hover:text-blue-600 cursor-pointer font-mono font-medium">{'</>'} Incrustado</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {savedSuccess && (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <Check className="w-4 h-4" /> Guardado
            </span>
          )}
          <button
            onClick={handleSaveForm}
            disabled={saving}
            className="px-3.5 py-1.5 bg-[#2271b1] hover:bg-[#135e96] text-white text-xs sm:text-sm font-medium rounded transition-colors inline-flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Guardando...' : 'Guardar Formulario'}</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto p-4 sm:p-6 gap-6">
        {/* Left / Center Column: Field canvas */}
        <div className="flex-1 space-y-4">
          {/* Quick Add Bar */}
          <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-wrap items-center gap-2 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">
              Añadir campo:
            </span>
            <button
              type="button"
              onClick={() => handleAddField('radio')}
              className="px-2.5 py-1 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded text-xs font-medium text-slate-700 transition-colors inline-flex items-center gap-1"
            >
              <CircleDot className="w-3.5 h-3.5 text-blue-600" />
              <span>Opción única (Radio)</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddField('checkbox')}
              className="px-2.5 py-1 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded text-xs font-medium text-slate-700 transition-colors inline-flex items-center gap-1"
            >
              <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
              <span>Casillas (Checkbox)</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddField('select')}
              className="px-2.5 py-1 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded text-xs font-medium text-slate-700 transition-colors inline-flex items-center gap-1"
            >
              <ListFilter className="w-3.5 h-3.5 text-amber-600" />
              <span>Desplegable (Select)</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddField('text')}
              className="px-2.5 py-1 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded text-xs font-medium text-slate-700 transition-colors inline-flex items-center gap-1"
            >
              <AlignLeft className="w-3.5 h-3.5 text-emerald-600" />
              <span>Texto Corto</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddField('page_break')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-dashed border-slate-300 rounded text-xs font-medium text-slate-700 transition-colors inline-flex items-center gap-1"
            >
              <SplitSquareVertical className="w-3.5 h-3.5 text-slate-600" />
              <span>Salto de Página</span>
            </button>
          </div>

          {/* Fields Canvas List matching Screenshots 2 & 3 */}
          <div className="space-y-3">
            {form.fields.map((field, index) => {
              const isSelected = activeFieldId === field.id;

              if (field.type === 'page_break') {
                return (
                  <div
                    key={field.id}
                    onClick={() => setActiveFieldId(field.id)}
                    className={`p-3 rounded-lg border border-dashed transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-[#2271b1] bg-blue-50/40 shadow-xs'
                        : 'border-slate-300 bg-slate-100/70 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <SplitSquareVertical className="w-4 h-4 text-slate-500" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                        {field.label || 'SALTO DE PÁGINA'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteField(field.id);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={field.id}
                  onClick={() => setActiveFieldId(field.id)}
                  className={`bg-white rounded-lg border transition-all cursor-pointer relative p-4 ${
                    isSelected
                      ? 'border-[#2271b1] ring-1 ring-[#2271b1] shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Field Action Toolbar on top right matching Screenshot 3 */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-slate-400 cursor-grab" />
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                        {field.label} {field.required && <span className="text-rose-600">*</span>}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateField(field);
                        }}
                        title="Duplicar campo"
                        className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveFieldId(field.id);
                        }}
                        title="Configurar opciones"
                        className="p-1 text-slate-400 hover:text-[#2271b1] rounded transition-colors"
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteField(field.id);
                        }}
                        title="Eliminar campo"
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Render Field Preview in canvas matching Screenshot 3 */}
                  <div className="mt-2 text-sm text-slate-700">
                    {field.type === 'radio' && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                        {field.options?.map((opt) => (
                          <label
                            key={opt.id}
                            className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50/60 p-2 rounded border border-slate-100"
                          >
                            <input
                              type="radio"
                              name={`preview_${field.id}`}
                              disabled
                              checked={opt.isDefault}
                              className="text-blue-600"
                            />
                            <span>{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {field.type === 'checkbox' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        {field.options?.map((opt) => (
                          <label
                            key={opt.id}
                            className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50/60 p-2 rounded border border-slate-100"
                          >
                            <input
                              type="checkbox"
                              disabled
                              checked={opt.isDefault}
                              className="rounded text-blue-600"
                            />
                            <span>{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {field.type === 'select' && (
                      <select disabled className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs bg-slate-50 text-slate-600">
                        {field.options?.map((opt) => (
                          <option key={opt.id} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    )}

                    {field.type === 'text' && (
                      <input
                        type="text"
                        disabled
                        placeholder="Texto de respuesta..."
                        className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs bg-slate-50 text-slate-400"
                      />
                    )}

                    {field.type === 'textarea' && (
                      <textarea
                        disabled
                        rows={2}
                        placeholder="Observaciones o comentarios..."
                        className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs bg-slate-50 text-slate-400"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Drawer / Settings Panel matching Screenshots 2 & 3 */}
        <div className="w-full lg:w-96 bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-5 h-fit lg:sticky lg:top-32">
          {activeField ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">Opciones del Campo</h2>
                <button
                  onClick={() => setActiveFieldId(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Field Label Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Etiqueta del Campo
                </label>
                <input
                  type="text"
                  value={activeField.label}
                  onChange={(e) => updateActiveField({ label: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-[#2271b1]"
                />
              </div>

              {/* Required Toggle */}
              {activeField.type !== 'page_break' && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="req_field"
                    checked={activeField.required}
                    onChange={(e) => updateActiveField({ required: e.target.checked })}
                    className="rounded border-slate-300 text-[#2271b1] focus:ring-0"
                  />
                  <label htmlFor="req_field" className="text-xs font-medium text-slate-700">
                    Campo Obligatorio
                  </label>
                </div>
              )}

              {/* Options Table (matching Screenshots 2 & 3) */}
              {activeField.options && (
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                      Opciones
                    </h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Define las opciones de este campo. Si el tipo de campo lo admite, también podrás
                      seleccionar la(s) opción(es) por defecto a la izquierda de la elección.
                    </p>
                  </div>

                  {/* Header: Etiqueta vs Valor */}
                  <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-slate-600 pb-1 border-b border-slate-100">
                    <div className="col-span-1 text-center">#</div>
                    <div className="col-span-6">Etiqueta</div>
                    <div className="col-span-3 text-center">Valor</div>
                    <div className="col-span-2 text-center">Acción</div>
                  </div>

                  {/* Options List */}
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {activeField.options.map((opt, idx) => (
                      <div key={opt.id} className="grid grid-cols-12 gap-1.5 items-center text-xs">
                        {/* Reorder / Default check */}
                        <div className="col-span-1 flex items-center justify-center">
                          <input
                            type="radio"
                            name={`default_${activeField.id}`}
                            checked={opt.isDefault || false}
                            onChange={(e) => handleUpdateOption(idx, 'isDefault', e.target.checked)}
                            title="Opción predeterminada"
                            className="text-[#2271b1] focus:ring-0"
                          />
                        </div>

                        {/* Etiqueta input */}
                        <div className="col-span-6">
                          <input
                            type="text"
                            value={opt.label}
                            onChange={(e) => handleUpdateOption(idx, 'label', e.target.value)}
                            placeholder="Etiqueta"
                            className="w-full px-2 py-1 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-[#2271b1]"
                          />
                        </div>

                        {/* Valor input (user red arrow highlighted!) */}
                        <div className="col-span-3">
                          <input
                            type="text"
                            value={opt.value}
                            onChange={(e) => handleUpdateOption(idx, 'value', e.target.value)}
                            placeholder="Valor"
                            className="w-full px-2 py-1 border border-slate-300 rounded text-xs text-slate-900 text-center font-mono focus:outline-none focus:border-[#2271b1]"
                          />
                        </div>

                        {/* Plus and minus actions */}
                        <div className="col-span-2 flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleAddOption(idx)}
                            className="w-5 h-5 rounded-full border border-slate-300 hover:border-[#2271b1] hover:text-[#2271b1] flex items-center justify-center text-slate-500 font-bold"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(idx)}
                            className="w-5 h-5 rounded-full border border-slate-300 hover:border-rose-500 hover:text-rose-500 flex items-center justify-center text-slate-500 font-bold"
                          >
                            -
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Batch add button matching Screenshot 3 */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setShowBatchModal(true)}
                      className="w-full py-1.5 px-3 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded transition-colors"
                    >
                      Añadir por lotes / Opciones predefinidas
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <Sliders className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs">Selecciona un campo del formulario para editar sus opciones y valores.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Añadir Opciones por Lotes */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-lg max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Añadir Opciones por Lotes</h3>
              <button
                onClick={() => setShowBatchModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-slate-500">
                Selecciona una escala predefinida o pega una opción por línea en formato{' '}
                <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px] font-mono">
                  Etiqueta|Valor
                </code>
                :
              </p>

              {/* Preset quick buttons */}
              <div className="flex flex-wrap gap-1.5 pt-1 pb-2">
                <button
                  type="button"
                  onClick={() => applyBatchPreset('frecuencia_4')}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[11px] font-medium text-slate-700"
                >
                  Frecuencia (1 a 4)
                </button>
                <button
                  type="button"
                  onClick={() => applyBatchPreset('binaria_cero')}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[11px] font-medium text-slate-700"
                >
                  Sí/No con 0 (0: No, 1: Sí)
                </button>
                <button
                  type="button"
                  onClick={() => applyBatchPreset('estres_6')}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[11px] font-medium text-slate-700"
                >
                  Estrés (1 a 6)
                </button>
                <button
                  type="button"
                  onClick={() => applyBatchPreset('antiguedad_3')}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[11px] font-medium text-slate-700"
                >
                  Antigüedad (3 rangos)
                </button>
                <button
                  type="button"
                  onClick={() => applyBatchPreset('horarios_3')}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[11px] font-medium text-slate-700"
                >
                  Horarios (3 opciones)
                </button>
              </div>

              <textarea
                rows={7}
                value={batchText}
                onChange={(e) => setBatchText(e.target.value)}
                placeholder="1. Siempre o casi siempre|1&#10;2. A menudo|2&#10;3. A veces|3&#10;4. Nunca o casi nunca|4"
                className="w-full px-3 py-2 border border-slate-300 rounded text-xs font-mono text-slate-900 focus:outline-none focus:border-[#2271b1]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApplyBatch}
                className="px-4 py-2 bg-[#2271b1] hover:bg-[#135e96] text-white text-xs font-medium rounded transition-colors"
              >
                Insertar Opciones
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
