'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ClipboardList,
  PlusCircle,
  Search,
  Copy,
  Check,
  Building2,
  FileText,
  BarChart3,
  Eye,
  ExternalLink,
  Edit,
  Trash2,
  RefreshCw,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { EvaluationCampaign, FormSchema } from '@/lib/types';
import AdminEvaluationWizard from '@/components/admin/AdminEvaluationWizard';

export default function AdminEvaluacionesPage() {
  const searchParams = useSearchParams();
  const [campaigns, setCampaigns] = useState<EvaluationCampaign[]>([]);
  const [forms, setForms] = useState<FormSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(searchParams.get('crear') === '1');
  const [wizardInitialData, setWizardInitialData] = useState<Partial<EvaluationCampaign> | null>(null);

  const fetchCampaignsData = async () => {
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
    fetchCampaignsData();
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

  return (
    <div className="w-full px-6 sm:px-8 py-6 space-y-6 animate-fade-in-slide">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ClipboardList className="w-7 h-7 text-blue-600" />
            <span>Gestión de Evaluaciones por Empresa</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Administre los procesos de evaluación activos, configure los formularios asignados y consulte respuestas.
          </p>
        </div>

        <button
          onClick={() => {
            setWizardInitialData(null);
            setWizardOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0061fe] hover:bg-[#0052d9] text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors shadow-xs shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nueva Evaluación</span>
        </button>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3 border border-slate-200 rounded-xl shadow-xs">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              filterTab === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todas ({campaigns.length})
          </button>
          <button
            onClick={() => setFilterTab('active')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              filterTab === 'active'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Activas ({campaigns.filter((c) => c.status === 'active').length})
          </button>
          <button
            onClick={() => setFilterTab('inactive')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              filterTab === 'inactive'
                ? 'bg-white text-slate-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Inactivas ({campaigns.filter((c) => c.status === 'inactive').length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por empresa o código..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Main Table: Full-Width */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Cargando evaluaciones...</div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-2">
            <ClipboardList className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">No se encontraron evaluaciones con los filtros actuales.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-100">
              <thead className="bg-[#f8fafc] text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Estado</th>
                  <th className="py-3.5 px-5">Evaluación / Empresa</th>
                  <th className="py-3.5 px-5">Código de Acceso</th>
                  <th className="py-3.5 px-5">Formularios Asignados & Edición</th>
                  <th className="py-3.5 px-5 text-center">Respuestas</th>
                  <th className="py-3.5 px-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCampaigns.map((camp) => {
                  const isActive = camp.status === 'active';
                  const assignedFormIds = camp.formIds && camp.formIds.length > 0
                    ? camp.formIds
                    : (camp.formId ? [camp.formId] : []);
                  const assignedForms = forms.filter((f) => assignedFormIds.includes(f.id));

                  return (
                    <tr key={camp.id} className="hover:bg-slate-50/70 transition-colors group">
                      {/* Estado */}
                      <td className="py-4 px-5">
                        <button
                          onClick={() => handleToggleStatus(camp.code)}
                          title="Clic para cambiar estado"
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          <span>{isActive ? 'Activa' : 'Inactiva'}</span>
                        </button>
                      </td>

                      {/* Título & Empresa */}
                      <td className="py-4 px-5">
                        <div>
                          <Link
                            href={`/admin/resultados?code=${camp.code}`}
                            className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-xs sm:text-sm hover:underline"
                          >
                            {camp.title}
                          </Link>
                          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mt-0.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>{camp.company}</span>
                          </div>
                        </div>
                      </td>

                      {/* Código de Acceso */}
                      <td className="py-4 px-5">
                        <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                          <span className="font-mono font-bold text-slate-800 tracking-wide">
                            {camp.code}
                          </span>
                          <button
                            onClick={() => copyEvaluationLink(camp.code)}
                            title="Copiar enlace del trabajador"
                            className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                          >
                            {copiedCode === camp.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Formularios que la componen con botón de editar formulario */}
                      <td className="py-4 px-5">
                        <div className="space-y-1.5 max-w-md">
                          {assignedForms.length > 0 ? (
                            assignedForms.map((f) => (
                              <div
                                key={f.id}
                                className="inline-flex items-center justify-between gap-2 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-medium mr-2 mb-1 group/form"
                              >
                                <div className="flex items-center gap-1.5">
                                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                                  <span className="text-slate-800 truncate max-w-[150px]">{f.title}</span>
                                </div>
                                <Link
                                  href={`/admin/formularios/${f.id}`}
                                  title="Editar las preguntas de este formulario"
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white hover:bg-blue-50 text-blue-600 border border-slate-200 hover:border-blue-300 rounded text-[10px] font-semibold transition-colors"
                                >
                                  <Edit className="w-3 h-3" />
                                  <span>Editar</span>
                                </Link>
                              </div>
                            ))
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">
                              {camp.formId || 'Sin formularios asignados'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Respuestas */}
                      <td className="py-4 px-5 text-center">
                        <div className="font-bold text-slate-900 text-sm">
                          {camp.submissionsCount || 0}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          de {camp.expectedParticipants || 100} esperados
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/resultados?code=${camp.code}`}
                            title="Ver Gráficos y Descargas"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors border border-emerald-200 font-semibold text-xs"
                          >
                            <BarChart3 className="w-3.5 h-3.5" />
                            <span>Resultados</span>
                          </Link>

                          <Link
                            href={`/admin/respuestas/${camp.code}`}
                            title="Ver tabla de respuestas detalladas"
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          <a
                            href={`/evaluar/${camp.code}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Abrir como trabajador"
                            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Creation Wizard */}
      <AdminEvaluationWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSuccess={() => {
          fetchCampaignsData();
        }}
        existingCampaigns={campaigns}
        forms={forms}
        initialData={wizardInitialData}
      />
    </div>
  );
}
