'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  PlusCircle,
  Search,
  Edit,
} from 'lucide-react';
import { FormSchema } from '@/lib/types';

export default function AdminFormulariosPage() {
  const [forms, setForms] = useState<FormSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredForms = forms.filter((f) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return f.title.toLowerCase().includes(term) || (f.description && f.description.toLowerCase().includes(term));
  });

  return (
    <div className="w-full px-6 sm:px-8 py-6 space-y-6 animate-fade-in-slide">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-indigo-600" />
            <span>Catálogo de Formularios y Plantillas Maestras</span>
          </h1>
        </div>

        <Link
          href="/admin/formularios/nuevo"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0061fe] hover:bg-[#0052d9] text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors shadow-xs shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Crear Formulario</span>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4 bg-white p-3 border border-slate-200 rounded-xl shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar plantilla de formulario..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        <span className="text-xs text-slate-500 font-medium hidden sm:inline">
          {filteredForms.length} plantillas disponibles
        </span>
      </div>

      {/* Grid of Forms */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Cargando formularios...</div>
      ) : filteredForms.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-xs space-y-2 bg-white rounded-2xl border border-slate-200">
          <FileText className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="font-semibold text-slate-700">No se encontraron formularios.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredForms.map((form) => {
            const questionCount = form.fields.filter((f) => f.type !== 'page_break').length;

            return (
              <div
                key={form.id}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  {/* Single unified icon color and background */}
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {form.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                      {form.description || 'Plantilla estandarizada de preguntas para evaluaciones laborales.'}
                    </p>
                  </div>
                </div>

                {/* Bottom Row: questionCount & Editar en Constructor */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-600">
                    {questionCount} preguntas
                  </span>

                  <Link
                    href={`/admin/formularios/${form.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5 text-blue-600" />
                    <span>Editar en Constructor</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
