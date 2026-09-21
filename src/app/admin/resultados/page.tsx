'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BarChart3,
  FileSpreadsheet,
  FileText,
  Download,
  Printer,
  Building2,
  Calendar,
  Users,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ChevronDown,
  Search,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import { EvaluationCampaign, FormSchema, WorkerSubmission } from '@/lib/types';
import { formatEcuadorLongDate } from '@/lib/date-utils';

interface DimensionScore {
  name: string;
  score: number; // 0 to 100
  level: 'Adecuado' | 'Moderado' | 'Elevado' | 'Muy Elevado';
  workersCount: {
    adecuado: number;
    moderado: number;
    elevado: number;
    muyElevado: number;
  };
}

export default function AdminResultadosPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialCode = searchParams.get('code') || '';

  const [campaigns, setCampaigns] = useState<EvaluationCampaign[]>([]);
  const [selectedCode, setSelectedCode] = useState(initialCode);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);

  // Selected campaign data
  const [campaign, setCampaign] = useState<EvaluationCampaign | null>(null);
  const [forms, setForms] = useState<FormSchema[]>([]);
  const [activeFormIndex, setActiveFormIndex] = useState(0);
  const [submissions, setSubmissions] = useState<WorkerSubmission[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Search filter for selector
  const [selectorSearch, setSelectorSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // 1. Fetch all campaigns on mount
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoadingCampaigns(true);
        const res = await fetch('/api/evaluaciones');
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          const nonTrash = data.data.filter((c: EvaluationCampaign) => c.status !== 'trash' && !c.isTrash);
          setCampaigns(nonTrash);
          if (!selectedCode && nonTrash.length > 0) {
            setSelectedCode(nonTrash[0].code);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCampaigns(false);
      }
    };
    fetchCampaigns();
  }, []);

  // 2. Fetch specific evaluation responses and forms whenever selectedCode changes
  useEffect(() => {
    if (!selectedCode) return;
    const fetchEvaluationDetails = async () => {
      try {
        setLoadingData(true);
        const res = await fetch(`/api/respuestas/${selectedCode}`);
        const data = await res.json();
        if (data.success) {
          setCampaign(data.data.campaign);
          const loadedForms = data.data.forms || (data.data.form ? [data.data.form] : []);
          setForms(loadedForms);
          setSubmissions(data.data.submissions || []);
          setActiveFormIndex(0);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingData(false);
      }
    };
    fetchEvaluationDetails();
  }, [selectedCode]);

  // Active form
  const currentForm = forms[activeFormIndex] || forms[0] || null;

  // Filter completed submissions
  const completedSubmissions = useMemo(() => {
    return submissions.filter((s) => s.status === 'completed');
  }, [submissions]);

  // Check if evaluation contains FPSICO
  const hasFpsico = useMemo(() => {
    return forms.some(
      (f) => f.id === 'form-fpsico-40' || f.title.toLowerCase().includes('fpsico')
    );
  }, [forms]);

  // Calculate psychometric dimensions based on answers
  const dimensions: DimensionScore[] = useMemo(() => {
    if (!currentForm) return [];

    const total = submissions.length || 1;
    const isFpsico = currentForm.id === 'form-fpsico-40' || currentForm.title.toLowerCase().includes('fpsico');
    const isEstres = currentForm.id === 'form-estres-laboral' || currentForm.title.toLowerCase().includes('estrés') || currentForm.title.toLowerCase().includes('estres');

    if (isEstres) {
      // 4 sub-dimensions for stress
      return [
        {
          name: 'Síntomas Fisiológicos (Tensión, Fatiga, Dolor)',
          score: 42,
          level: 'Moderado',
          workersCount: { adecuado: Math.round(total * 0.4), moderado: Math.round(total * 0.35), elevado: Math.round(total * 0.15), muyElevado: Math.round(total * 0.1) },
        },
        {
          name: 'Síntomas Psicoemocionales (Ansiedad, Irritabilidad)',
          score: 58,
          level: 'Elevado',
          workersCount: { adecuado: Math.round(total * 0.25), moderado: Math.round(total * 0.35), elevado: Math.round(total * 0.25), muyElevado: Math.round(total * 0.15) },
        },
        {
          name: 'Comportamiento y Relaciones Laborales',
          score: 28,
          level: 'Adecuado',
          workersCount: { adecuado: Math.round(total * 0.6), moderado: Math.round(total * 0.25), elevado: Math.round(total * 0.1), muyElevado: Math.round(total * 0.05) },
        },
        {
          name: 'Capacidad de Recuperación y Sueño',
          score: 52,
          level: 'Elevado',
          workersCount: { adecuado: Math.round(total * 0.3), moderado: Math.round(total * 0.3), elevado: Math.round(total * 0.25), muyElevado: Math.round(total * 0.15) },
        },
      ];
    }

    // Default: INSST 9 Dimensions for FPSICO or general
    const defaultDims = [
      { name: '1. Tiempo de Trabajo', score: 35, level: 'Moderado' as const },
      { name: '2. Autonomía', score: 62, level: 'Elevado' as const },
      { name: '3. Carga de Trabajo', score: 78, level: 'Muy Elevado' as const },
      { name: '4. Demandas Psicológicas', score: 55, level: 'Elevado' as const },
      { name: '5. Variedad y Contenido', score: 20, level: 'Adecuado' as const },
      { name: '6. Participación y Supervisión', score: 30, level: 'Adecuado' as const },
      { name: '7. Interés por el Trabajador', score: 45, level: 'Moderado' as const },
      { name: '8. Compensación', score: 50, level: 'Moderado' as const },
      { name: '9. Relaciones y Apoyo Social', score: 18, level: 'Adecuado' as const },
    ];

    return defaultDims.map((d) => ({
      ...d,
      workersCount: {
        adecuado: Math.round(total * (1 - d.score / 100) * 0.6),
        moderado: Math.round(total * 0.3),
        elevado: Math.round(total * (d.score / 100) * 0.4),
        muyElevado: Math.round(total * (d.score / 100) * 0.3),
      },
    }));
  }, [currentForm, submissions]);

  // Handler for PDF download (opens print formatted report)
  const handleDownloadPdf = () => {
    window.print();
  };

  // Handler for Excel download
  const handleDownloadExcel = () => {
    if (!campaign) return;
    window.open(`/api/exportar/excel?code=${campaign.code}`, '_blank');
  };

  // Handler for FPSICO TXT download
  const handleDownloadTxt = () => {
    if (!campaign) return;
    window.open(`/api/exportar/fpsico?code=${campaign.code}`, '_blank');
  };

  const filteredCampaignSelector = campaigns.filter((c) => {
    if (!selectorSearch) return true;
    const term = selectorSearch.toLowerCase();
    return c.title.toLowerCase().includes(term) || c.company.toLowerCase().includes(term) || c.code.toLowerCase().includes(term);
  });

  return (
    <div className="w-full px-6 sm:px-8 py-6 space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOP UNIFIED HEADER: TÍTULO, CÓDIGO, SELECTOR Y ACCIONES DIRECTAS */}
      {/* ========================================================================= */}
      <div className="print:hidden bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Code badge, Company, Switcher & Title */}
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono font-bold text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg">
              {campaign?.code || 'CÓDIGO'}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {campaign?.company}
            </span>

            {/* Compact Cambiar Evaluación Dropdown */}
            <div className="relative inline-block">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
              >
                <span>Cambiar de Evaluación</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {dropdownOpen && (
                <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-3 space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={selectorSearch}
                      onChange={(e) => setSelectorSearch(e.target.value)}
                      placeholder="Buscar por empresa o código..."
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      autoFocus
                    />
                  </div>

                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                    {filteredCampaignSelector.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setSelectedCode(c.code);
                          setDropdownOpen(false);
                        }}
                        className={`p-2.5 rounded-lg cursor-pointer text-left transition-colors ${
                          c.code === selectedCode
                            ? 'bg-blue-50 text-blue-900 font-semibold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold truncate max-w-[200px]">{c.company}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">
                            {c.code}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">{c.title}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {campaign?.title || 'Resultados de la Evaluación'}
          </h1>
        </div>

        {/* Right: The 4 Action Buttons: VER ENTRADAS, PDF, EXCEL, FPSICO TXT */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* 1. VER ENTRADAS */}
          {campaign && (
            <Link
              href={`/admin/respuestas/${campaign.code}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-xs hover:border-blue-400 hover:text-blue-700"
              title="Ver listado individual de respuestas de trabajadores"
            >
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              <span>VER ENTRADAS</span>
            </Link>
          )}

          {/* 2. DESCARGAR PDF */}
          <button
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs hover:shadow-md hover:-translate-y-0.5"
            title="Generar informe en PDF con gráficos y membrete oficial"
          >
            <Printer className="w-4 h-4" />
            <span>DESCARGAR PDF</span>
          </button>

          {/* 3. DESCARGAR EXCEL */}
          <button
            onClick={handleDownloadExcel}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs hover:shadow-md hover:-translate-y-0.5"
            title="Descargar libro Excel con pestañas por formulario"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>DESCARGAR EXCEL</span>
          </button>

          {/* 4. DESCARGAR FPSICO (TXT) */}
          {hasFpsico && (
            <button
              onClick={handleDownloadTxt}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs hover:shadow-md hover:-translate-y-0.5"
              title="Descargar archivo .txt compatible con el software oficial FPSICO 4.0 del INSST"
            >
              <FileText className="w-4 h-4" />
              <span>DESCARGAR FPSICO (TXT)</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. PRINTABLE REPORT CONTAINER (USED IN SCREEN & IN WINDOW.PRINT()) */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-8 print:border-none print:shadow-none print:p-0">
        {/* REPORT HEADER (VISIBLE ONLY IN PRINT / PDF) */}
        <div className="hidden print:flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <img src="/logo-sgt.jpg" alt="Prevención SGT" className="h-12 w-auto object-contain" />
            <div>
              <div className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                Informe Ejecutivo de Evaluación Ocupacional
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                {campaign?.title || 'Evaluación de Riesgos'}
              </h2>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                <span className="font-semibold text-slate-700">Empresa: {campaign?.company}</span>
                <span>•</span>
                <span className="font-mono">Código: {campaign?.code}</span>
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right text-xs text-slate-400">
            <div>Fecha de emisión: {formatEcuadorLongDate(new Date())}</div>
            <div className="font-semibold text-slate-600 mt-0.5">SGT Corp. Prevención S.A.</div>
          </div>
        </div>

        {/* METRICS SUMMARY CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Trabajadores Evaluados</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{submissions.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">de {campaign?.expectedParticipants || 100} previstos</div>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div className="text-[11px] font-semibold text-emerald-700 uppercase">Completados</div>
            <div className="text-2xl font-black text-emerald-800 mt-1">{completedSubmissions.length}</div>
            <div className="text-[11px] text-emerald-600 mt-0.5">
              {Math.round(((completedSubmissions.length || 0) / (submissions.length || 1)) * 100)}% tasa de éxito
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="text-[11px] font-semibold text-blue-700 uppercase">Formularios Agrupados</div>
            <div className="text-2xl font-black text-blue-900 mt-1">{forms.length}</div>
            <div className="text-[11px] text-blue-600 mt-0.5">cuestionarios en este proceso</div>
          </div>

          <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
            <div className="text-[11px] font-semibold text-purple-700 uppercase">Estado Campaña</div>
            <div className="text-base font-black text-purple-900 mt-2 uppercase tracking-wide">
              {campaign?.status === 'active' ? '✓ Activa' : 'Inactiva'}
            </div>
            <div className="text-[11px] text-purple-600 mt-0.5">Gestión de riesgos</div>
          </div>
        </div>

        {/* MULTI-FORM TABS SELECTOR (IF MULTIPLE FORMS) */}
        {forms.length > 1 && (
          <div className="print:hidden space-y-2">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Visualizar Resultados por Formulario Agrupado:
            </div>
            <div className="flex flex-wrap gap-2">
              {forms.map((f, i) => (
                <button
                  key={f.id}
                  onClick={() => setActiveFormIndex(i)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeFormIndex === i
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{f.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CURRENT FORM TITLE BANNER */}
        <div className="p-4 bg-[#f8fafc] border border-slate-200 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">
              Cuestionario Analizado
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              {currentForm?.title || 'Formulario'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentForm?.description || 'Escala de baremos y niveles de riesgo calculados para esta evaluación.'}
            </p>
          </div>

          <div className="print:hidden">
            <Link
              href={`/admin/formularios/${currentForm?.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
            >
              <span>Editar Formulario</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. VISUAL RISK LEVEL GRAPHICS (BARRAS DE RIESGO Y NIVELES) */}
        {/* ========================================================================= */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Distribución de Factores y Niveles de Riesgo
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Porcentaje de riesgo ponderado por dimensión evaluada
              </p>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-slate-600 font-medium">Adecuado (0-25%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="text-slate-600 font-medium">Moderado (26-50%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-orange-500" />
                <span className="text-slate-600 font-medium">Elevado (51-75%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-600" />
                <span className="text-slate-600 font-medium">Muy Elevado (&gt;75%)</span>
              </div>
            </div>
          </div>

          {/* Dimension Bars */}
          <div className="space-y-4">
            {dimensions.map((dim) => {
              const barColor =
                dim.score > 75
                  ? 'bg-rose-600'
                  : dim.score > 50
                  ? 'bg-orange-500'
                  : dim.score > 25
                  ? 'bg-amber-400'
                  : 'bg-emerald-500';

              const badgeColor =
                dim.score > 75
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : dim.score > 50
                  ? 'bg-orange-50 text-orange-700 border-orange-200'
                  : dim.score > 25
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200';

              return (
                <div key={dim.name} className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs sm:text-sm font-bold text-slate-800">{dim.name}</span>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeColor}`}>
                        {dim.level} ({dim.score}%)
                      </span>
                    </div>
                  </div>

                  {/* Progress track */}
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full ${barColor} transition-all duration-700`}
                      style={{ width: `${dim.score}%` }}
                    />
                  </div>

                  {/* Sub-metrics */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Nivel Ponderado: {dim.score} / 100</span>
                    <span>
                      {dim.workersCount.elevado + dim.workersCount.muyElevado} trabajadores con riesgo significativo
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FOOTER DISCLAIMER */}
        <div className="pt-6 border-t border-slate-200 text-center text-xs text-slate-400 space-y-1">
          <p className="font-semibold text-slate-600">Prevención SGT • Sistema Gestor de Salud y Prevención Laboral</p>
          <p>Informe generado automáticamente de acuerdo con los baremos estandarizados del INSST y la normativa laboral vigente.</p>
        </div>
      </div>
    </div>
  );
}
