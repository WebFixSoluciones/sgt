'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  PlusCircle,
  Search,
  Edit,
  Copy,
  Trash2,
  Building2,
  Sparkles,
  Layers,
  Check,
  X,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { FormSchema } from '@/lib/types';

export default function AdminFormulariosPage() {
  const [forms, setForms] = useState<FormSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'templates' | 'companies' | 'all'>('templates');

  // Duplication Modal State
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [duplicatingForm, setDuplicatingForm] = useState<FormSchema | null>(null);
  const [duplicateTitle, setDuplicateTitle] = useState('');
  const [duplicateAsTemplate, setDuplicateAsTemplate] = useState(true);
  const [duplicateCompany, setDuplicateCompany] = useState('');
  const [isDuplicating, setIsDuplicating] = useState(false);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/formularios');
      const data = await res.json();
      if (data.success) {
        setForms(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const isMasterForm = (f: FormSchema) => {
    return Boolean(f.isTemplate) && (!f.company || f.company.trim() === '');
  };

  const masterTemplatesCount = useMemo(() => {
    return forms.filter(isMasterForm).length;
  }, [forms]);

  const companyFormsCount = useMemo(() => {
    return forms.filter((f) => !isMasterForm(f)).length;
  }, [forms]);

  const filteredForms = useMemo(() => {
    return forms.filter((f) => {
      // Tab filter
      const isMaster = isMasterForm(f);
      if (activeTab === 'templates' && !isMaster) return false;
      if (activeTab === 'companies' && isMaster) return false;

      // Search filter
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const titleMatch = f.title.toLowerCase().includes(term);
      const descMatch = f.description ? f.description.toLowerCase().includes(term) : false;
      const compMatch = f.company ? f.company.toLowerCase().includes(term) : false;
      return titleMatch || descMatch || compMatch;
    });
  }, [forms, activeTab, searchTerm]);

  // Open Duplication Modal
  const handleOpenDuplicateModal = (form: FormSchema) => {
    setDuplicatingForm(form);
    setDuplicateTitle(`Copia de ${form.title}`);
    setDuplicateAsTemplate(isMasterForm(form));
    setDuplicateCompany(form.company || '');
    setDuplicateModalOpen(true);
  };

  // Submit Duplication
  const handleConfirmDuplicate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!duplicatingForm || !duplicateTitle.trim()) return;

    try {
      setIsDuplicating(true);
      const res = await fetch('/api/formularios/duplicar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId: duplicatingForm.id,
          newTitle: duplicateTitle.trim(),
          asTemplate: duplicateAsTemplate,
          company: duplicateAsTemplate ? '' : duplicateCompany.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al duplicar formulario');
      }

      await fetchForms();
      setDuplicateModalOpen(false);
      // Automatically switch to the tab where the duplicated form belongs
      if (duplicateAsTemplate) {
        setActiveTab('templates');
      } else {
        setActiveTab('companies');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error al duplicar formulario');
    } finally {
      setIsDuplicating(false);
    }
  };

  // Delete Custom Form
  const handleDeleteCustomForm = async (form: FormSchema) => {
    if (isMasterForm(form)) {
      alert('Las plantillas maestras del sistema no pueden eliminarse.');
      return;
    }

    if (!confirm(`¿Eliminar el formulario "${form.title}"?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/formularios/${form.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al eliminar formulario');
      }
      setForms((prev) => prev.filter((f) => f.id !== form.id));
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error al eliminar formulario');
    }
  };

  return (
    <div className="w-full px-6 sm:px-8 py-6 space-y-6 animate-fade-in-slide">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-indigo-600" />
            <span>Catálogo de Formularios y Plantillas Maestras</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Plantillas maestras estándar y formularios personalizados para cada evaluación de empresa.
          </p>
        </div>

        <Link
          href="/admin/formularios/nuevo"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0061fe] hover:bg-[#0052d9] text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors shadow-xs shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Crear Formulario desde Cero</span>
        </Link>
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3 border border-slate-200 rounded-2xl shadow-xs">
        {/* Filter Tabs */}
        <div className="inline-flex bg-slate-100 p-1 rounded-xl text-xs font-semibold border border-slate-200">
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'templates'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Plantillas Maestras ({masterTemplatesCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('companies')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'companies'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Formularios de Empresas ({companyFormsCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Todos ({forms.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título o empresa..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Grid or Table of Forms */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Cargando catálogo de formularios...</div>
      ) : filteredForms.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-xs space-y-2 bg-white rounded-2xl border border-slate-200">
          <FileText className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="font-semibold text-slate-700">No se encontraron formularios en esta sección.</p>
          {activeTab === 'companies' && (
            <p className="text-slate-400 text-[11px]">
              Al crear una evaluación para una empresa en el Asistente, se generará automáticamente su formulario independiente y aparecerá en esta tabla.
            </p>
          )}
        </div>
      ) : activeTab === 'companies' || activeTab === 'all' ? (
        /* TABLE VIEW FOR COMPANY FORMS AND ALL FORMS */
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-100">
              <thead className="bg-[#f8fafc] text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Empresa / Tipo</th>
                  <th className="py-3.5 px-5">Formulario & Cuestionario</th>
                  <th className="py-3.5 px-5 text-center">Preguntas</th>
                  <th className="py-3.5 px-5">Fecha</th>
                  <th className="py-3.5 px-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredForms.map((form) => {
                  const questionCount = form.fields.filter((f) => f.type !== 'page_break').length;
                  const isMaster = isMasterForm(form);
                  const formattedDate = form.createdAt
                    ? new Date(form.createdAt).toLocaleDateString('es-EC', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '-';

                  return (
                    <tr
                      key={form.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Empresa / Tipo */}
                      <td className="py-4 px-5">
                        {isMaster ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Plantilla Maestra</span>
                          </span>
                        ) : (
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold shrink-0 border border-blue-100">
                              <Building2 className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block text-xs">
                                {form.company || 'Empresa'}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                Formulario Personalizado
                              </span>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Título & Descripción */}
                      <td className="py-4 px-5 max-w-xs sm:max-w-md">
                        <div>
                          <Link
                            href={`/admin/formularios/${form.id}`}
                            className="font-bold text-slate-900 hover:text-blue-600 transition-colors block text-xs"
                          >
                            {form.title}
                          </Link>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {form.description ||
                              (isMaster
                                ? 'Plantilla canónica estándar de preguntas para evaluaciones laborales.'
                                : `Formulario adaptado exclusivamente para ${form.company || 'la empresa'}.`)}
                          </p>
                        </div>
                      </td>

                      {/* Preguntas */}
                      <td className="py-4 px-5 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                          {questionCount} preguntas
                        </span>
                      </td>

                      {/* Fecha */}
                      <td className="py-4 px-5 whitespace-nowrap text-slate-500 text-xs">
                        {formattedDate}
                      </td>

                      {/* Acciones */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Duplicar */}
                          <button
                            type="button"
                            onClick={() => handleOpenDuplicateModal(form)}
                            title="Duplicar como nueva plantilla o formulario"
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Eliminar (solo para formularios de empresas) */}
                          {!isMaster && (
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomForm(form)}
                              title="Eliminar este formulario personalizado"
                              className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-lg text-xs font-semibold transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Editar */}
                          <Link
                            href={`/admin/formularios/${form.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0061fe] hover:bg-[#0052d9] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARDS VIEW FOR MASTER TEMPLATES */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredForms.map((form) => {
            const questionCount = form.fields.filter((f) => f.type !== 'page_break').length;
            const isMaster = isMasterForm(form);

            return (
              <div
                key={form.id}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  {/* Top Badges & Icon */}
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>

                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                      <Sparkles className="w-3 h-3" />
                      <span>Plantilla Maestra</span>
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {form.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                      {form.description || 'Plantilla canónica estándar de preguntas para evaluaciones laborales.'}
                    </p>
                  </div>
                </div>

                {/* Bottom Row: questionCount & Action buttons */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-600">
                    {questionCount} preguntas
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Duplicar */}
                    <button
                      type="button"
                      onClick={() => handleOpenDuplicateModal(form)}
                      title="Duplicar como nueva plantilla o formulario"
                      className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {/* Editar en Constructor */}
                    <Link
                      href={`/admin/formularios/${form.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5 text-blue-600" />
                      <span>Editar</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: DUPLICAR FORMULARIO */}
      {duplicateModalOpen && duplicatingForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Copy className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Duplicar Formulario o Plantilla
                </h3>
              </div>
              <button
                onClick={() => setDuplicateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmDuplicate} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nombre de la nueva copia:
                </label>
                <input
                  type="text"
                  required
                  value={duplicateTitle}
                  onChange={(e) => setDuplicateTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  placeholder="Ej: Evaluación Psicosocial Chaide 2026"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Tipo de formulario:
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 p-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name="asTemplate"
                      checked={duplicateAsTemplate}
                      onChange={() => setDuplicateAsTemplate(true)}
                      className="text-blue-600"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">Plantilla Maestra</span>
                      <span className="text-[11px] text-slate-500 block">
                        Aparecerá en el catálogo maestro para ser usada en cualquier evaluación futura.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name="asTemplate"
                      checked={!duplicateAsTemplate}
                      onChange={() => setDuplicateAsTemplate(false)}
                      className="text-blue-600"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">Formulario Exclusivo de Empresa</span>
                      <span className="text-[11px] text-slate-500 block">
                        Copia independiente para una empresa en particular (ej. Chaide, Quifatex).
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {!duplicateAsTemplate && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Empresa asignada:
                  </label>
                  <input
                    type="text"
                    required={!duplicateAsTemplate}
                    value={duplicateCompany}
                    onChange={(e) => setDuplicateCompany(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                    placeholder="Ej: Chaide y Chaide S.A."
                  />
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDuplicateModalOpen(false)}
                  className="px-3.5 py-2 border border-slate-300 text-slate-600 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isDuplicating || !duplicateTitle.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  {isDuplicating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Duplicando...</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Crear Copia</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
