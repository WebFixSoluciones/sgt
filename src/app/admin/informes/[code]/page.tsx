'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FileSpreadsheet,
  FileText,
  BarChart3,
  Users,
  Building2,
  PieChart,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { EvaluationCampaign, FormSchema, WorkerSubmission } from '@/lib/types';

export default function InformesPage() {
  const params = useParams();
  const code = (params.code as string)?.toUpperCase();

  const [campaign, setCampaign] = useState<EvaluationCampaign | null>(null);
  const [form, setForm] = useState<FormSchema | null>(null);
  const [submissions, setSubmissions] = useState<WorkerSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) return;
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/respuestas/${code}`);
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
    fetchAnalytics();
  }, [code]);

  const completedSubs = submissions.filter((s) => s.status === 'completed');
  const totalCount = completedSubs.length;
  const goal = campaign?.expectedParticipants || 100;
  const coveragePercent = Math.min(100, Math.round((totalCount / goal) * 100));

  // Compute breakdown by demographic variables: Puesto, Horarios, Antigüedad
  const puestosCount: Record<string, number> = {};
  const horariosCount: Record<string, number> = {};
  const antiguedadCount: Record<string, number> = {};

  for (const s of completedSubs) {
    const p = String(s.answers['puesto'] || s.answers['agrupacion_puestos'] || 'Otro');
    puestosCount[p] = (puestosCount[p] || 0) + 1;

    const h = String(s.answers['horario'] || s.answers['horarios'] || 'Otro');
    horariosCount[h] = (horariosCount[h] || 0) + 1;

    const a = String(s.answers['antiguedad'] || 'Otro');
    antiguedadCount[a] = (antiguedadCount[a] || 0) + 1;
  }

  // Label lookups
  const puestoLabels: Record<string, string> = {
    '1': 'Dirección / Gerencia',
    '2': 'Administración / Finanzas',
    '3': 'Comercial / Ventas',
    '4': 'Coordinadores / Supervisores',
    '5': 'Operaciones / Planta',
    '6': 'Logística / Bodega',
    '7': 'Mantenimiento / Técnico',
    '28': 'Producción Línea Continua',
  };

  const horarioLabels: Record<string, string> = {
    '1': 'Horario Día',
    '2': 'Horario Nocturno',
    '3': 'Turnos Rotativos',
  };

  const antiguedadLabels: Record<string, string> = {
    '1': 'Menos de 2 años',
    '2': 'Entre 2 y 5 años',
    '3': 'Más de 5 años',
  };

  const isFpsico = campaign?.formId === 'form-fpsico-40' || campaign?.code.includes('PSI');

  return (
    <div className="w-full px-6 sm:px-8 py-6 space-y-6 animate-fade-in-slide">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/respuestas/${code}`}
            className="p-2 border border-slate-300 hover:bg-slate-50 text-slate-600 rounded transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 uppercase tracking-wider">
                {campaign?.company || 'Empresa'}
              </span>
              <span className="text-xs font-mono text-slate-500 font-medium">COD: {code}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
              Informe Analítico y Resultados: {campaign?.title}
            </h1>
          </div>
        </div>

        {/* Download buttons */}
        <div className="flex items-center gap-2">
          <a
            href={`/api/exportar/excel?code=${code}`}
            download
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-medium rounded transition-colors inline-flex items-center gap-1.5 shadow-xs"
            title="Descargar informe en Microsoft Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Descargar Excel</span>
          </a>

          <a
            href={`/api/exportar/fpsico?code=${code}`}
            download
            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-medium rounded transition-colors inline-flex items-center gap-1.5 shadow-xs"
            title="Descargar archivo plano .TXT compatible con el software oficial INSST FPSICO 4.0"
          >
            <FileText className="w-4 h-4" />
            <span>FPSICO TXT</span>
          </a>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Completadas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{totalCount}</div>
          <p className="text-xs text-slate-500 mt-1">Cuestionarios finalizados</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Meta de Participación</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{goal}</div>
          <p className="text-xs text-slate-500 mt-1">Trabajadores convocados</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Tasa de Cobertura</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 text-3xl font-bold text-purple-700">{coveragePercent}%</div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: `${coveragePercent}%` }} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Visitas al Link</span>
            <PieChart className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{campaign?.visits || 0}</div>
          <p className="text-xs text-slate-500 mt-1">
            Conversión:{' '}
            {campaign?.visits ? ((totalCount / campaign.visits) * 100).toFixed(1) : 0}%
          </p>
        </div>
      </div>

      {/* Demographic Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Puestos de Trabajo */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Participación por Puesto de Trabajo
          </h2>
          <div className="space-y-2.5">
            {Object.entries(puestosCount).length === 0 ? (
              <p className="text-xs text-slate-400">Sin datos registrados</p>
            ) : (
              Object.entries(puestosCount).map(([key, count]) => {
                const label = puestoLabels[key] || `Puesto ${key}`;
                const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>{label}</span>
                      <span className="text-slate-500 font-mono">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Horarios */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Distribución por Horario
          </h2>
          <div className="space-y-2.5">
            {Object.entries(horariosCount).length === 0 ? (
              <p className="text-xs text-slate-400">Sin datos registrados</p>
            ) : (
              Object.entries(horariosCount).map(([key, count]) => {
                const label = horarioLabels[key] || `Horario ${key}`;
                const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>{label}</span>
                      <span className="text-slate-500 font-mono">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Antigüedad */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Distribución por Antigüedad
          </h2>
          <div className="space-y-2.5">
            {Object.entries(antiguedadCount).length === 0 ? (
              <p className="text-xs text-slate-400">Sin datos registrados</p>
            ) : (
              Object.entries(antiguedadCount).map(([key, count]) => {
                const label = antiguedadLabels[key] || `Antigüedad ${key}`;
                const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>{label}</span>
                      <span className="text-slate-500 font-mono">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Sample Items Breakdown */}
      {form && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Muestra de Respuestas por Pregunta
            </h2>
            <span className="text-xs text-slate-500">Valores registrados para exportación</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {form.fields
              .filter((f) => f.type === 'radio' && f.options && f.options.length > 0)
              .slice(0, 8)
              .map((field) => {
                // Count frequencies
                const freqs: Record<string, number> = {};
                for (const s of completedSubs) {
                  const v = String(s.answers[field.id] ?? '');
                  if (v) {
                    freqs[v] = (freqs[v] || 0) + 1;
                  }
                }

                return (
                  <div key={field.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
                    <div className="font-semibold text-slate-800 leading-snug">{field.label}</div>
                    <div className="space-y-1">
                      {field.options?.map((opt) => {
                        const cnt = freqs[String(opt.value)] || 0;
                        const pct = totalCount > 0 ? Math.round((cnt / totalCount) * 100) : 0;
                        return (
                          <div key={opt.id} className="flex items-center justify-between text-[11px] text-slate-600">
                            <span className="truncate max-w-[70%]">{opt.label}</span>
                            <span className="font-mono text-slate-700">
                              Val {opt.value}: {cnt} ({pct}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
