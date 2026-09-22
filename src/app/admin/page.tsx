'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  BarChart3,
  ClipboardList,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { EvaluationCampaign, FormSchema } from '@/lib/types';
import AdminEvaluationWizard from '@/components/admin/AdminEvaluationWizard';

export default function AdminDashboardPage() {
  const [campaigns, setCampaigns] = useState<EvaluationCampaign[]>([]);
  const [forms, setForms] = useState<FormSchema[]>([]);
  const [loading, setLoading] = useState(true);

  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardInitialData, setWizardInitialData] = useState<Partial<EvaluationCampaign> | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/evaluaciones?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.data);
      }

      const formsRes = await fetch(`/api/formularios?t=${Date.now()}`, { cache: 'no-store' });
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

  const nonTrashCampaigns = campaigns.filter((c) => c.status !== 'trash' && !c.isTrash);
  const activeCampaigns = nonTrashCampaigns.filter((c) => c.status === 'active');
  const totalSubmissions = nonTrashCampaigns.reduce((acc, c) => acc + (c.submissionsCount || 0), 0);

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

      {/* Creation Wizard Modal */}
      <AdminEvaluationWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSuccess={() => {
          fetchDashboardData();
        }}
        existingCampaigns={campaigns}
        forms={forms}
        initialData={wizardInitialData}
      />
    </div>
  );
}
