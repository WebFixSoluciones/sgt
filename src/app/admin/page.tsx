'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PlusCircle,
  FileText,
  BarChart3,
  Search,
  Copy,
  Check,
  ClipboardList,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Eye,
  Layers,
  Building2,
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  FileSpreadsheet,
  Trash2,
} from 'lucide-react';
import { EvaluationCampaign, FormSchema } from '@/lib/types';
import AdminEvaluationWizard from '@/components/admin/AdminEvaluationWizard';

export default function AdminDashboardPage() {
  const [campaigns, setCampaigns] = useState<EvaluationCampaign[]>([]);
  const [forms, setForms] = useState<FormSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardInitialData, setWizardInitialData] = useState<Partial<EvaluationCampaign> | null>(null);

  const fetchDashboardData = async () => {
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
    fetchDashboardData();
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

  const handleTrashCampaign = async (code: string, title: string) => {
    if (!confirm(`¿Enviar la evaluación "${title}" (${code}) a la papelera? Podrá restaurarla cuando lo necesite.`)) {
      return;
    }
    try {
      const res = await fetch('/api/evaluaciones', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, action: 'trash' }),
      });
      const data = await res.json();
      if (data.success) {
        setCampaigns((prev) =>
          prev.map((c) =>
            c.code === code ? { ...c, status: 'trash', isTrash: true } : c
          )
        );
      } else {
        alert(data.error || 'Error al enviar a papelera');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al mover a papelera');
    }
  };

  const nonTrashCampaigns = campaigns.filter((c) => c.status !== 'trash' && !c.isTrash);
  const activeCampaigns = nonTrashCampaigns.filter((c) => c.status === 'active');
  const totalSubmissions = nonTrashCampaigns.reduce((acc, c) => acc + (c.submissionsCount || 0), 0);
  const trashCampaignsCount = campaigns.filter((c) => c.status === 'trash' || c.isTrash).length;

  const filteredCampaigns = nonTrashCampaigns.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.title.toLowerCase().includes(term) ||
      c.code.toLowerCase().includes(term) ||
      c.company.toLowerCase().includes(term)
    );
  });

  return (
    <div className="w-full px-6 sm:px-8 py-6 space-y-8 animate-fade-in-slide">
      {/* 1. TOP WELCOME BANNER: Bienvenido Prevención SGT */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0b1b36] to-[#0061fe] rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 backdrop-blur-3xl transform skew-x-12 translate-x-10 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold tracking-wide text-blue-200 backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              <span>Plataforma Oficial de Salud y Prevención</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Bienvenido Prevención SGT
            </h1>
          </div>

          {/* Quick Metrics Pills */}
          <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
            <div className="px-4 py-3 bg-white/10 rounded-xl backdrop-blur-xs border border-white/10 text-center min-w-[110px]">
              <div className="text-2xl font-black text-white">{activeCampaigns.length}</div>
              <div className="text-[11px] text-blue-200 uppercase tracking-wider font-medium">Evaluaciones Activas</div>
            </div>
            <div className="px-4 py-3 bg-white/10 rounded-xl backdrop-blur-xs border border-white/10 text-center min-w-[110px]">
              <div className="text-2xl font-black text-white">{forms.length}</div>
              <div className="text-[11px] text-blue-200 uppercase tracking-wider font-medium">Formularios Base</div>
            </div>
            <div className="px-4 py-3 bg-white/10 rounded-xl backdrop-blur-xs border border-white/10 text-center min-w-[110px]">
              <div className="text-2xl font-black text-emerald-400">{totalSubmissions}</div>
              <div className="text-[11px] text-blue-200 uppercase tracking-wider font-medium">Respuestas</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. THE 3 PROMINENT DIRECT ACTION CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: CREAR EVALUACIÓN */}
        <div
          onClick={() => {
            setWizardInitialData(null);
            setWizardOpen(true);
          }}
          className="group relative bg-white border border-slate-200 hover:border-blue-500 rounded-2xl p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Campaña por Empresa</span>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors mt-0.5">
                CREAR EVALUACIÓN
              </h3>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
            <span>Iniciar Asistente</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 2: CREAR FORMULARIO */}
        <Link
          href="/admin/formularios/nuevo"
          className="group relative bg-white border border-slate-200 hover:border-indigo-500 rounded-2xl p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Constructor de Preguntas</span>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mt-0.5">
                CREAR FORMULARIO
              </h3>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600">
            <span>Abrir Constructor</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Card 3: VER RESULTADOS */}
        <Link
          href="/admin/resultados"
          className="group relative bg-white border border-slate-200 hover:border-emerald-500 rounded-2xl p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Módulo de Informes</span>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors mt-0.5">
                VER RESULTADOS
              </h3>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-600">
            <span>Explorar Resultados</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* 3. EVALUACIONES ACTIVAS Y RECIENTES TABLE (FULL-WIDTH, FLUID SPACING) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Table Header Bar */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-600" />
              <span>Evaluaciones y Procesos de Empresas</span>
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar empresa o código..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            {trashCampaignsCount > 0 && (
              <Link
                href="/admin/evaluaciones?tab=trash"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Papelera ({trashCampaignsCount})</span>
              </Link>
            )}

            <button
              onClick={() => {
                setWizardInitialData(null);
                setWizardOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0061fe] hover:bg-[#0052d9] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nueva Evaluación</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Cargando evaluaciones...</div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-2">
            <ClipboardList className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">No se encontraron evaluaciones.</p>
            <p>Haga clic en "+ Nueva Evaluación" para crear la primera campaña de evaluación.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-100">
              <thead className="bg-[#f8fafc] text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Estado</th>
                  <th className="py-3.5 px-5">Evaluación / Empresa</th>
                  <th className="py-3.5 px-5">Código de Acceso</th>
                  <th className="py-3.5 px-5">Formularios que la Componen</th>
                  <th className="py-3.5 px-5 text-center">Respuestas</th>
                  <th className="py-3.5 px-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCampaigns.map((camp) => {
                  const isActive = camp.status === 'active';
                  // Resolve assigned forms titles
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

                      {/* Formularios que la componen */}
                      <td className="py-4 px-5">
                        <div className="flex flex-wrap gap-1.5 max-w-sm">
                          {assignedForms.length > 0 ? (
                            assignedForms.map((f) => (
                              <span
                                key={f.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-md text-[10px] font-medium"
                              >
                                <FileText className="w-3 h-3 text-blue-500" />
                                <span className="truncate max-w-[140px]">{f.title}</span>
                              </span>
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
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors border border-emerald-200"
                          >
                            <BarChart3 className="w-4 h-4" />
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

                          <button
                            onClick={() => handleTrashCampaign(camp.code, camp.title)}
                            title="Enviar a papelera"
                            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Creation Wizard Modal */}
      <AdminEvaluationWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSuccess={(newCamp) => {
          fetchDashboardData();
        }}
        existingCampaigns={campaigns}
        forms={forms}
        initialData={wizardInitialData}
      />
    </div>
  );
}
