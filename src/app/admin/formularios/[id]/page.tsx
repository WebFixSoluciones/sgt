'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import FormBuilder from '@/components/admin/FormBuilder';
import { FormSchema } from '@/lib/types';
import { FileText, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function EditarFormularioPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [form, setForm] = useState<FormSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const loadForm = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch from server API
        const res = await fetch(`/api/formularios/${id}`);
        const data = await res.json();
        if (data.success && data.data) {
          setForm(data.data);
          // Cache in localStorage for offline/serverless resilience
          try {
            localStorage.setItem(`sgt_form_${id}`, JSON.stringify(data.data));
          } catch (e) {}
          return;
        }

        // 2. Fallback: check localStorage cache
        if (typeof window !== 'undefined') {
          const cached = localStorage.getItem(`sgt_form_${id}`);
          if (cached) {
            try {
              const parsed: FormSchema = JSON.parse(cached);
              setForm(parsed);
              // Re-sync with server in background
              fetch('/api/formularios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(parsed),
              }).catch(() => {});
              return;
            } catch (e) {}
          }
        }

        setError('No se pudo encontrar el formulario especificado.');
      } catch (err: any) {
        // Network error fallback
        if (typeof window !== 'undefined') {
          const cached = localStorage.getItem(`sgt_form_${id}`);
          if (cached) {
            try {
              setForm(JSON.parse(cached));
              return;
            } catch (e) {}
          }
        }
        setError(err.message || 'Error al cargar formulario');
      } finally {
        setLoading(false);
      }
    };

    loadForm();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="text-center space-y-2.5">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600">Cargando constructor de formulario...</p>
        </div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Formulario no encontrado</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            El formulario con código <span className="font-mono font-bold text-slate-700">{id}</span> no está disponible en este momento.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              href="/admin/formularios"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0061fe] hover:bg-[#0052d9] text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a Formularios</span>
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reintentar</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <FormBuilder initialForm={form} isNew={false} />;
}
