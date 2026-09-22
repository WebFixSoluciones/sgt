'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FileSpreadsheet,
  FileText,
  Search,
  Eye,
  CheckCircle2,
  Clock,
  User,
  Building2,
  Download,
  BarChart3,
  Calendar,
  RotateCcw,
  Upload,
  ShieldAlert,
  Briefcase,
  Globe,
  HelpCircle,
  X,
  Filter,
  Check,
  ChevronRight,
} from 'lucide-react';
import { EvaluationCampaign, FormSchema, WorkerSubmission } from '@/lib/types';
import { formatEcuadorDateTime } from '@/lib/date-utils';
import EvaluationBackupModal from '@/components/admin/EvaluationBackupModal';
import Portal from '@/components/common/Portal';

export default function RespuestasPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string)?.toUpperCase();

  const [campaign, setCampaign] = useState<EvaluationCampaign | null>(null);
  const [form, setForm] = useState<FormSchema | null>(null);
  const [submissions, setSubmissions] = useState<WorkerSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in_progress'>('all');
  
  // Modal for Viewing Single Worker Answers
  const [selectedSubmission, setSelectedSubmission] = useState<WorkerSubmission | null>(null);
  const [modalSearchTerm, setModalSearchTerm] = useState('');

  // Backup & Clear Modal state
  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const [backupModalTab, setBackupModalTab] = useState<'limpiar' | 'restaurar'>('limpiar');

  const fetchResponses = async () => {
    if (!code) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/respuestas/${code}?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setCampaign(data.data.campaign);
        setForm(data.data.form);
        setSubmissions(data.data.submissions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResponses();
  }, [code]);

  const handleOpenBackupModal = (tab: 'limpiar' | 'restaurar' = 'limpiar') => {
    setBackupModalTab(tab);
    setBackupModalOpen(true);
  };

  const handleBackupSuccess = () => {
    fetchResponses();
  };

  // Helper to lookup position/puesto human-readable label
  const getPuestoLabel = (val: string | number | undefined) => {
    if (!val || val === '-') return 'No especificado';
    const strVal = String(val).trim();
    const puestoField = form?.fields?.find(
      (f) => f.id === 'puesto' || f.id === 'agrupacion_puestos'
    );
    if (puestoField && puestoField.options) {
      const opt = puestoField.options.find(
        (o) => String(o.value).trim() === strVal || o.label.toLowerCase() === strVal.toLowerCase()
      );
      if (opt) return opt.label;
    }
    return `Código ${strVal}`;
  };

  // Total question fields (excluding page breaks)
  const totalFormFields = useMemo(() => {
    return form?.fields?.filter((f) => f.type !== 'page_break').length || 0;
  }, [form]);

  // Filtered submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      // Status filter
      if (statusFilter !== 'all' && s.status !== statusFilter) {
        return false;
      }
      // Search filter
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const puesto = String(s.answers?.['puesto'] || s.answers?.['agrupacion_puestos'] || '').toLowerCase();
      const puestoLabel = getPuestoLabel(s.answers?.['puesto'] || s.answers?.['agrupacion_puestos']).toLowerCase();
      
      return (
        s.workerCode.toLowerCase().includes(term) ||
        s.id.toLowerCase().includes(term) ||
        s.ip.toLowerCase().includes(term) ||
        puesto.includes(term) ||
        puestoLabel.includes(term)
      );
    });
  }, [submissions, searchTerm, statusFilter, form]);

  const completedCount = submissions.filter((s) => s.status === 'completed').length;
  const inProgressCount = submissions.filter((s) => s.status === 'in_progress').length;
  const expectedCount = campaign?.expectedParticipants || 100;
  const coveragePct = Math.min(100, Math.round((completedCount / (expectedCount || 1)) * 100));
  const completionRate = submissions.length > 0 ? Math.round((completedCount / submissions.length) * 100) : 0;
  const isFpsico = campaign?.formId === 'form-fpsico-40' || campaign?.code.includes('PSI');

  // Filtered fields inside answer modal
  const modalFilteredFields = useMemo(() => {
    if (!form || !selectedSubmission) return [];
    const fields = form.fields.filter((f) => f.type !== 'page_break');
    if (!modalSearchTerm) return fields;
    const term = modalSearchTerm.toLowerCase();
    return fields.filter((f, idx) => {
      const idxMatch = String(idx + 1).includes(term);
      const labelMatch = f.label.toLowerCase().includes(term);
      const sec = f.section || f.sectionTitle;
      const sectionMatch = sec ? sec.toLowerCase().includes(term) : false;
      const ansVal = String(selectedSubmission.answers[f.id] ?? '').toLowerCase();
      return idxMatch || labelMatch || sectionMatch || ansVal.includes(term);
    });
  }, [form, selectedSubmission, modalSearchTerm]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7 animate-fade-in-slide">
      {/* 1. TOP HEADER & BREADCRUMB */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            {/* Back link & Badges */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Link
                href="/admin/evaluaciones"
                className="inline-flex items-center gap-1.5 text-slate-500 hover:text-blue-600 font-semibold transition-colors py-0.5 px-2 bg-slate-100 hover:bg-blue-50 rounded-lg"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver a Evaluaciones</span>
              </Link>
              <span className="text-slate-300">•</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold uppercase tracking-wider text-[11px] border border-blue-100">
                <Building2 className="w-3 h-3" />
                {campaign?.company || 'Empresa'}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-[11px] font-bold border border-slate-200">
                COD: {code}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[11px] border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Activa
              </span>
            </div>

            {/* Page Title */}
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Entradas y Respuestas: {campaign?.title}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Monitoreo individual de trabajadores, trazabilidad de respuestas y exportación de datos.
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/admin/informes/${code}`}
              className="px-3.5 py-2 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-700 text-xs font-semibold rounded-xl transition-all inline-flex items-center gap-1.5 shadow-xs"
            >
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span>Ver Gráficos</span>
            </Link>

            <a
              href={`/api/exportar/excel?code=${code}`}
              download
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-all inline-flex items-center gap-1.5 shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Descargar Excel</span>
            </a>

            {isFpsico && (
              <a
                href={`/api/exportar/fpsico?code=${code}`}
                download
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl transition-all inline-flex items-center gap-1.5 shadow-xs"
              >
                <FileText className="w-4 h-4" />
                <span>Exportar FPSICO 4.0</span>
              </a>
            )}

            {/* Limpiar a 0 con Seguro */}
            <button
              type="button"
              onClick={() => handleOpenBackupModal('limpiar')}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl transition-all inline-flex items-center gap-1.5 shadow-xs"
              title="Descargar respaldo obligatorio y reiniciar respuestas a 0"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
              <span>Limpiar a 0</span>
            </button>

            {/* Cargar Respaldo */}
            <button
              type="button"
              onClick={() => handleOpenBackupModal('restaurar')}
              className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all inline-flex items-center gap-1.5 shadow-xs"
              title="Cargar archivo .json para restaurar respuestas"
            >
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>Restaurar</span>
            </button>
          </div>
        </div>

        {/* 2. METRICS BAR (4 VISUAL KPIS) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
          {/* Total Entradas */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total Entradas
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-100/80 text-blue-700 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-slate-900">{submissions.length}</div>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                  <span>Progreso de meta</span>
                  <span className="font-bold text-slate-700">{coveragePct}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${coveragePct}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400">Meta: {expectedCount} trabajadores</div>
              </div>
            </div>
          </div>

          {/* Completadas */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                Completadas
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-emerald-700">{completedCount}</div>
              <div className="mt-2 space-y-1">
                <div className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  <span>{completionRate}% efectividad</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  {submissions.length > 0 ? 'Encuestas terminadas con éxito' : 'Sin registros aún'}
                </div>
              </div>
            </div>
          </div>

          {/* En Progreso */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                En Progreso (Drafts)
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-amber-600">{inProgressCount}</div>
              <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                Sesiones con autoguardado listas para continuar cuando el usuario reingrese.
              </p>
            </div>
          </div>

          {/* Instrumento Asignado */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">
                Instrumento
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-sm font-bold text-slate-900 truncate" title={form?.title}>
                {form?.title || 'Formulario'}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-purple-700 font-semibold">
                <span className="px-2 py-0.5 bg-purple-100 rounded-md">
                  {totalFormFields} preguntas
                </span>
                <span className="text-[10px] text-slate-400 font-normal">por formulario</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SEARCH, FILTERS & ENTRIES TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Table Controls Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          {/* Search Input */}
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por código, ID, puesto o IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
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

          {/* Status Filter Tabs & Counter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex bg-slate-100 p-0.5 rounded-xl text-xs font-semibold border border-slate-200">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  statusFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Todas ({submissions.length})
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  statusFilter === 'completed'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-500 hover:text-emerald-700'
                }`}
              >
                Completadas ({completedCount})
              </button>
              <button
                onClick={() => setStatusFilter('in_progress')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  statusFilter === 'in_progress'
                    ? 'bg-white text-amber-700 shadow-xs'
                    : 'text-slate-500 hover:text-amber-700'
                }`}
              >
                En Progreso ({inProgressCount})
              </button>
            </div>

            <div className="text-xs text-slate-400 font-medium pl-2 hidden sm:block">
              {filteredSubmissions.length} de {submissions.length} registros
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-bold uppercase text-[11px] tracking-wider">
                <th className="py-3.5 px-5">Trabajador</th>
                <th className="py-3.5 px-5">Puesto / Agrupación</th>
                <th className="py-3.5 px-5">Fecha y Registro</th>
                <th className="py-3.5 px-5">IP Origen</th>
                <th className="py-3.5 px-5 text-center">Estado</th>
                <th className="py-3.5 px-5">Progreso de Respuestas</th>
                <th className="py-3.5 px-5 text-center w-28">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    Cargando entradas y respuestas de trabajadores...
                  </td>
                </tr>
              ) : filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 space-y-2">
                    <HelpCircle className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-semibold text-slate-600 text-xs">
                      No se encontraron entradas registradas.
                    </p>
                    {searchTerm && (
                      <p className="text-[11px] text-slate-400">
                        Intenta con otro término de búsqueda o limpia los filtros.
                      </p>
                    )}
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((sub) => {
                  const answersCount = Object.keys(sub.answers || {}).length;
                  const rawPuesto = sub.answers['puesto'] || sub.answers['agrupacion_puestos'];
                  const puestoLabel = getPuestoLabel(rawPuesto);
                  const isCompleted = sub.status === 'completed';
                  const completionPercentage = totalFormFields > 0
                    ? Math.min(100, Math.round((answersCount / totalFormFields) * 100))
                    : (isCompleted ? 100 : 0);

                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-blue-50/20 transition-colors group"
                    >
                      {/* Trabajador & ID */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-mono font-bold text-slate-900 text-xs sm:text-sm">
                              {sub.workerCode}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              Entrada #{sub.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Puesto / Agrupación */}
                      <td className="py-4 px-5">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100/90 text-slate-700 border border-slate-200/80 rounded-lg text-xs font-medium max-w-[220px] truncate" title={puestoLabel}>
                          <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{puestoLabel}</span>
                        </div>
                      </td>

                      {/* Fecha y Hora (Ecuador) */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-mono text-xs">
                            {formatEcuadorDateTime(sub.completedAt || sub.updatedAt || sub.startedAt)}
                          </span>
                        </div>
                      </td>

                      {/* IP Origen */}
                      <td className="py-4 px-5">
                        <div className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                          <Globe className="w-3 h-3 text-slate-400" />
                          <span>{sub.ip || '127.0.0.1'}</span>
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="py-4 px-5 text-center">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Completada</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>En Progreso</span>
                          </span>
                        )}
                      </td>

                      {/* Progreso de Respuestas */}
                      <td className="py-4 px-5 min-w-[150px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-800">
                              {answersCount} <span className="text-slate-400 font-normal">/ {totalFormFields || answersCount}</span>
                            </span>
                            <span className={`font-mono text-[10px] font-bold ${
                              isCompleted ? 'text-emerald-700' : 'text-amber-700'
                            }`}>
                              {completionPercentage}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isCompleted ? 'bg-emerald-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${completionPercentage}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Acción */}
                      <td className="py-4 px-5 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSubmission(sub);
                            setModalSearchTerm('');
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 hover:border-blue-300 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                          title="Ver cuestionario y respuestas completas"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver Detalle</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. MODAL: DETALLE COMPLETO DEL CUESTIONARIO INDIVIDUAL */}
      {selectedSubmission && form && (
        <Portal>
          <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      Trabajador: {selectedSubmission.workerCode}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedSubmission.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {selectedSubmission.status === 'completed' ? 'Completada' : 'En Progreso'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Entrada #{selectedSubmission.id} • IP: {selectedSubmission.ip} •{' '}
                    {formatEcuadorDateTime(selectedSubmission.completedAt || selectedSubmission.updatedAt || selectedSubmission.startedAt)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedSubmission(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Subheader: Search filter inside questions */}
            <div className="px-6 py-3 border-b border-slate-100 bg-white flex items-center justify-between gap-4">
              <div className="relative w-full max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar en preguntas o respuestas..."
                  value={modalSearchTerm}
                  onChange={(e) => setModalSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="text-xs text-slate-500 shrink-0 font-medium">
                {Object.keys(selectedSubmission.answers || {}).length} respuestas contestadas
              </div>
            </div>

            {/* Modal Questions List */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-slate-50/50">
              {modalFilteredFields.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No se encontraron preguntas que coincidan con la búsqueda.
                </div>
              ) : (
                modalFilteredFields.map((field, idx) => {
                  const val = selectedSubmission.answers[field.id];
                  const hasAnswer = val !== undefined && val !== null && val !== '';
                  const matchedOpt = field.options?.find((o) => String(o.value) === String(val));

                  return (
                    <div
                      key={field.id}
                      className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 shadow-2xs hover:border-slate-300 transition-colors"
                    >
                      {/* Question label & section */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <div>
                            {(field.section || field.sectionTitle) && (
                              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block mb-0.5">
                                {field.section || field.sectionTitle}
                              </span>
                            )}
                            <h4 className="text-xs font-bold text-slate-900 leading-snug">
                              {field.label}
                            </h4>
                          </div>
                        </div>

                        {field.fpsicoCode && (
                          <span className="shrink-0 text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                            {field.fpsicoCode}
                          </span>
                        )}
                      </div>

                      {/* Selected Value */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">Respuesta registrada:</span>
                        {hasAnswer ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg text-xs font-semibold">
                            <Check className="w-3.5 h-3.5 text-blue-600" />
                            <span>{matchedOpt ? matchedOpt.label : String(val)}</span>
                            {matchedOpt && (
                              <span className="text-[10px] font-mono text-blue-600 bg-blue-100/70 px-1.5 py-0.2 rounded ml-1">
                                Código: {val}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            Sin respuesta registrada
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="text-xs text-slate-500 font-medium">
                Cuestionario oficial SGT • Prevención de Riesgos
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
        </Portal>
      )}

      {/* 5. BACKUP, CLEAR & RESTORE MODAL */}
      {campaign && (
        <EvaluationBackupModal
          isOpen={backupModalOpen}
          onClose={() => setBackupModalOpen(false)}
          campaign={{
            code: campaign.code,
            title: campaign.title,
            company: campaign.company,
            submissionsCount: submissions.length,
          }}
          initialTab={backupModalTab}
          onSuccess={handleBackupSuccess}
        />
      )}
    </div>
  );
}
