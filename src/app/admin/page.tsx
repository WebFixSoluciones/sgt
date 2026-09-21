'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Copy,
  Check,
  FileSpreadsheet,
  FileText,
  BarChart3,
  Edit,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  RefreshCw,
  Files,
  Layers,
} from 'lucide-react';
import { EvaluationCampaign, FormSchema } from '@/lib/types';
import AdminEvaluationWizard from '@/components/admin/AdminEvaluationWizard';

export default function AdminFormsPage() {
  const [campaigns, setCampaigns] = useState<EvaluationCampaign[]>([]);
  const [forms, setForms] = useState<FormSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // New Campaign Wizard State
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardInitialData, setWizardInitialData] = useState<Partial<EvaluationCampaign> | null>(null);

  // Duplicate / Template Modal State
  const [duplicateSource, setDuplicateSource] = useState<EvaluationCampaign | null>(null);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/evaluaciones');
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.data);
      }

      const formsRes = await fetch('/api/formularios');
      const formsData = await formsRes.json();
      if (formsData.success) {
        setForms(formsData.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleToggleStatus = async (code: string) => {
    try {
      const res = await fetch('/api/evaluaciones', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, action: 'toggle_status' }),
      });
      const data = await res.json();
      if (data.success) {
        setCampaigns((prev) =>
          prev.map((c) => (c.code === code ? { ...c, status: data.data.status } : c))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyEvaluationLink = (code: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${origin}/evaluar/${code}`;
    navigator.clipboard.writeText(link);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleBulkApply = async () => {
    if (!bulkAction || selectedIds.length === 0) return;

    if (bulkAction === 'activate' || bulkAction === 'deactivate') {
      const targetStatus = bulkAction === 'activate' ? 'active' : 'inactive';
      for (const id of selectedIds) {
        const camp = campaigns.find((c) => c.id === id);
        if (camp && camp.status !== targetStatus) {
          await handleToggleStatus(camp.code);
        }
      }
      setSelectedIds([]);
      setBulkAction('');
    }
  };

  const handleDuplicate = (camp: EvaluationCampaign) => {
    setWizardInitialData({
      title: `${camp.title} (COPIA)`,
      code: `${camp.code}-COPIA`,
      company: camp.company,
      formId: camp.formId,
      expectedParticipants: camp.expectedParticipants,
      nextEvaluationCode: camp.nextEvaluationCode,
    });
    setWizardOpen(true);
  };

  // Filtered lists
  const filteredCampaigns = campaigns.filter((c) => {
    if (filterTab === 'active' && c.status !== 'active') return false;
    if (filterTab === 'inactive' && c.status !== 'inactive') return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        c.title.toLowerCase().includes(term) ||
        c.code.toLowerCase().includes(term) ||
        c.company.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const countAll = campaigns.length;
  const countActive = campaigns.filter((c) => c.status === 'active').length;
  const countInactive = campaigns.filter((c) => c.status === 'inactive').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header matching Screenshot 1 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Formularios</h1>
          <button
            onClick={() => {
              setWizardInitialData(null);
              setWizardOpen(true);
            }}
            className="px-3.5 py-1.5 bg-[#2271b1] hover:bg-[#135e96] text-white text-sm font-medium rounded transition-colors shadow-sm inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Añadir nuevo</span>
          </button>
        </div>

        {/* Search matching Screenshot 1 */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Buscar formularios"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2271b1] w-56 sm:w-64"
          />
          <button
            type="button"
            className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded transition-colors"
          >
            Buscar formularios
          </button>
        </div>
      </div>

      {/* Filter Tabs matching Screenshot 1 */}
      <div className="flex items-center gap-2 text-sm text-slate-600 mb-4 pb-2 border-b border-slate-200">
        <button
          onClick={() => setFilterTab('all')}
          className={`hover:text-[#2271b1] transition-colors ${
            filterTab === 'all' ? 'text-[#2271b1] font-semibold' : ''
          }`}
        >
          Todos <span className="text-slate-400 font-normal">({countAll})</span>
        </button>
        <span className="text-slate-300">|</span>
        <button
          onClick={() => setFilterTab('active')}
          className={`hover:text-[#2271b1] transition-colors ${
            filterTab === 'active' ? 'text-[#2271b1] font-semibold' : ''
          }`}
        >
          Activos <span className="text-slate-400 font-normal">({countActive})</span>
        </button>
        <span className="text-slate-300">|</span>
        <button
          onClick={() => setFilterTab('inactive')}
          className={`hover:text-[#2271b1] transition-colors ${
            filterTab === 'inactive' ? 'text-[#2271b1] font-semibold' : ''
          }`}
        >
          Inactivos <span className="text-slate-400 font-normal">({countInactive})</span>
        </button>
        <span className="text-slate-300">|</span>
        <span className="text-slate-400">
          Papelera <span className="font-normal">(0)</span>
        </span>
      </div>

      {/* Bulk actions and count header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded text-sm text-slate-700 bg-white focus:outline-none focus:border-[#2271b1]"
          >
            <option value="">Acciones en lote</option>
            <option value="activate">Activar seleccionados</option>
            <option value="deactivate">Desactivar seleccionados</option>
          </select>
          <button
            onClick={handleBulkApply}
            disabled={!bulkAction || selectedIds.length === 0}
            className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded transition-colors disabled:opacity-50"
          >
            Aplicar
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          {filteredCampaigns.length} elementos
        </div>
      </div>

      {/* Data Table matching Screenshot 1 */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-medium text-xs">
                <th className="py-3 px-3 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredCampaigns.length && filteredCampaigns.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(filteredCampaigns.map((c) => c.id));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                    className="rounded border-slate-300 text-[#2271b1] focus:ring-0"
                  />
                </th>
                <th className="py-3 px-3 w-28">Estado</th>
                <th className="py-3 px-4">Título</th>
                <th className="py-3 px-3 text-center w-24">Código / ID</th>
                <th className="py-3 px-3 text-right w-24">Entradas</th>
                <th className="py-3 px-3 text-right w-24">Visitas</th>
                <th className="py-3 px-3 text-right w-24">Conversión</th>
                <th className="py-3 px-4 text-center w-48">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
                    Cargando evaluaciones...
                  </td>
                </tr>
              ) : filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No se encontraron formularios o evaluaciones.
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map((camp) => {
                  const conversion =
                    camp.visits > 0 ? ((camp.submissionsCount / camp.visits) * 100).toFixed(1) : '0';
                  const isChecked = selectedIds.includes(camp.id);
                  const isFpsico = camp.formId === 'form-fpsico-40' || camp.code.includes('PSI');

                  return (
                    <tr
                      key={camp.id}
                      className={`hover:bg-blue-50/30 transition-colors ${
                        isChecked ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds([...selectedIds, camp.id]);
                            } else {
                              setSelectedIds(selectedIds.filter((id) => id !== camp.id));
                            }
                          }}
                          className="rounded border-slate-300 text-[#2271b1] focus:ring-0"
                        />
                      </td>

                      {/* Estado Pill Toggle */}
                      <td className="py-3.5 px-3">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(camp.code)}
                          title="Click para cambiar estado"
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-all ${
                            camp.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              camp.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          <span>{camp.status === 'active' ? 'Activos' : 'Inactivos'}</span>
                        </button>
                      </td>

                      {/* Título */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#135e96] hover:underline cursor-pointer">
                          <Link href={`/admin/respuestas/${camp.code}`}>
                            {camp.title}
                          </Link>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                          <span>{camp.company}</span>
                          {camp.nextEvaluationCode && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                              <Layers className="w-3 h-3" />
                              Encadenada $\rightarrow$ {camp.nextEvaluationCode}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* ID / Código */}
                      <td className="py-3.5 px-3 text-center font-mono text-xs text-slate-600 font-medium">
                        {camp.code}
                      </td>

                      {/* Entradas */}
                      <td className="py-3.5 px-3 text-right font-medium text-slate-800">
                        {camp.submissionsCount}
                      </td>

                      {/* Visitas */}
                      <td className="py-3.5 px-3 text-right text-slate-600">
                        {camp.visits}
                      </td>

                      {/* Conversión */}
                      <td className="py-3.5 px-3 text-right font-medium text-slate-700">
                        {conversion}%
                      </td>

                      {/* Acciones Rápidas */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Copiar enlace */}
                          <button
                            type="button"
                            onClick={() => copyEvaluationLink(camp.code)}
                            title="Copiar enlace directo de evaluación"
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            {copiedCode === camp.code ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>

                          {/* Ver respuestas */}
                          <Link
                            href={`/admin/respuestas/${camp.code}`}
                            title="Ver respuestas individuales"
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {/* Gráficos e Informes */}
                          <Link
                            href={`/admin/informes/${camp.code}`}
                            title="Gráficos y Analítica"
                            className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                          >
                            <BarChart3 className="w-4 h-4" />
                          </Link>

                          {/* Descargar Excel */}
                          <a
                            href={`/api/exportar/excel?code=${camp.code}`}
                            download
                            title="Descargar Excel completo (.xlsx)"
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                          >
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                          </a>

                          {/* Descargar TXT FPSICO 4.0 */}
                          {isFpsico && (
                            <a
                              href={`/api/exportar/fpsico?code=${camp.code}`}
                              download
                              title="Descargar TXT listo para FPSICO 4.0"
                              className="p-1.5 text-slate-600 hover:text-purple-700 hover:bg-purple-50 rounded transition-colors"
                            >
                              <FileText className="w-4 h-4 text-purple-600" />
                            </a>
                          )}

                          {/* Duplicar / Plantilla */}
                          <button
                            type="button"
                            onClick={() => handleDuplicate(camp)}
                            title="Duplicar / Guardar como plantilla"
                            className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                          >
                            <Files className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Asistente de Creación Paso a Paso */}
      <AdminEvaluationWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSuccess={async () => {
          await fetchCampaigns();
        }}
        existingCampaigns={campaigns}
        forms={forms}
        initialData={wizardInitialData}
      />
    </div>
  );
}
