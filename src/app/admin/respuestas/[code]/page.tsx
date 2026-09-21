'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { EvaluationCampaign, FormSchema, WorkerSubmission } from '@/lib/types';
import { formatEcuadorDateTime } from '@/lib/date-utils';
import EvaluationBackupModal from '@/components/admin/EvaluationBackupModal';

export default function RespuestasPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string)?.toUpperCase();

  const [campaign, setCampaign] = useState<EvaluationCampaign | null>(null);
  const [form, setForm] = useState<FormSchema | null>(null);
  const [submissions, setSubmissions] = useState<WorkerSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<WorkerSubmission | null>(null);

  // Backup & Clear Modal state
  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const [backupModalTab, setBackupModalTab] = useState<'limpiar' | 'restaurar'>('limpiar');

  const fetchResponses = async () => {
    if (!code) return;
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

  const filteredSubmissions = submissions.filter((s) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.workerCode.toLowerCase().includes(term) ||
      s.id.toLowerCase().includes(term) ||
      s.ip.toLowerCase().includes(term)
    );
  });

  const completedCount = submissions.filter((s) => s.status === 'completed').length;
  const inProgressCount = submissions.filter((s) => s.status === 'in_progress').length;
  const isFpsico = campaign?.formId === 'form-fpsico-40' || campaign?.code.includes('PSI');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
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
              Entradas y Respuestas: {campaign?.title}
            </h1>
          </div>
        </div>

        {/* Action buttons: Excel & FPSICO TXT download */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/admin/informes/${code}`}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs sm:text-sm font-medium rounded transition-colors inline-flex items-center gap-1.5 shadow-xs"
          >
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <span>Ver Gráficos</span>
          </Link>

          <a
            href={`/api/exportar/excel?code=${code}`}
            download
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-medium rounded transition-colors inline-flex items-center gap-1.5 shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Descargar Excel (.xlsx)</span>
          </a>

          {isFpsico && (
            <a
              href={`/api/exportar/fpsico?code=${code}`}
              download
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-medium rounded transition-colors inline-flex items-center gap-1.5 shadow-xs"
            >
              <FileText className="w-4 h-4" />
              <span>Descargar TXT (FPSICO 4.0)</span>
            </a>
          )}

          {/* Limpiar a 0 con Seguro */}
          <button
            type="button"
            onClick={() => handleOpenBackupModal('limpiar')}
            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs sm:text-sm font-semibold rounded transition-colors inline-flex items-center gap-1.5 shadow-xs"
            title="Descargar copia de seguridad y reiniciar las respuestas a 0"
          >
            <RotateCcw className="w-4 h-4 text-rose-600" />
            <span>Limpiar a 0</span>
          </button>

          {/* Cargar Respaldo */}
          <button
            type="button"
            onClick={() => handleOpenBackupModal('restaurar')}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs sm:text-sm font-medium rounded transition-colors inline-flex items-center gap-1.5 shadow-xs"
            title="Cargar archivo .json para restaurar respuestas"
          >
            <Upload className="w-4 h-4 text-blue-600" />
            <span>Cargar Respaldo</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Entradas</span>
          <div className="mt-1 text-2xl font-bold text-slate-900">{submissions.length}</div>
          <p className="text-xs text-slate-400 mt-1">
            Meta: {campaign?.expectedParticipants || 100} trabajadores
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Completadas</span>
          <div className="mt-1 text-2xl font-bold text-emerald-700">{completedCount}</div>
          <p className="text-xs text-slate-400 mt-1">
            {campaign?.expectedParticipants
              ? `${Math.round((completedCount / campaign.expectedParticipants) * 100)}% de cobertura`
              : 'Evaluaciones cerradas'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">En Progreso (Drafts)</span>
          <div className="mt-1 text-2xl font-bold text-amber-600">{inProgressCount}</div>
          <p className="text-xs text-slate-400 mt-1">Guardadas para reanudación automática</p>
        </div>
      </div>

      {/* Search and Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative max-w-xs w-full">
            <input
              type="text"
              placeholder="Buscar por código de trabajador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Mostrando {filteredSubmissions.length} de {submissions.length} registros
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-3 w-20">ID Entrada</th>
                <th className="py-3 px-3">Fecha y Hora</th>
                <th className="py-3 px-3">CÓDIGO TRABAJADOR</th>
                <th className="py-3 px-3">Puesto / Agrupación</th>
                <th className="py-3 px-3">IP Origen</th>
                <th className="py-3 px-3 text-center">Estado</th>
                <th className="py-3 px-3 text-center w-24">Respuestas</th>
                <th className="py-3 px-3 text-center w-20">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Cargando entradas...
                  </td>
                </tr>
              ) : filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No hay respuestas registradas aún.
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((sub) => {
                  const answersCount = Object.keys(sub.answers || {}).length;
                  const puesto = sub.answers['puesto'] || sub.answers['agrupacion_puestos'] || '-';

                  return (
                    <tr key={sub.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-3 px-3 font-mono font-medium text-slate-700">{sub.id}</td>
                      <td className="py-3 px-3 text-slate-600 font-mono text-xs">
                        {formatEcuadorDateTime(sub.completedAt || sub.updatedAt || sub.startedAt)}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-blue-900">{sub.workerCode}</td>
                      <td className="py-3 px-3 text-slate-700">Código {puesto}</td>
                      <td className="py-3 px-3 font-mono text-slate-500">{sub.ip}</td>
                      <td className="py-3 px-3 text-center">
                        {sub.status === 'completed' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Completada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" /> En Progreso
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-medium text-slate-700">
                        {answersCount} ítems
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedSubmission(sub)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Ver detalle de respuestas"
                        >
                          <Eye className="w-4 h-4" />
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

      {/* Modal: View Single Worker Questionnaire Answers */}
      {selectedSubmission && form && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Respuestas del Trabajador: {selectedSubmission.workerCode}
                </h3>
                <p className="text-xs text-slate-500">
                  ID Entrada: {selectedSubmission.id} • IP: {selectedSubmission.ip} • Fecha:{' '}
                  {formatEcuadorDateTime(selectedSubmission.completedAt || selectedSubmission.updatedAt || selectedSubmission.startedAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-3 pr-2">
              {form.fields
                .filter((f) => f.type !== 'page_break')
                .map((field, idx) => {
                  const val = selectedSubmission.answers[field.id];
                  const matchedOpt = field.options?.find((o) => String(o.value) === String(val));

                  return (
                    <div
                      key={field.id}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-1"
                    >
                      <div className="font-semibold text-slate-800">
                        {idx + 1}. {field.label}
                      </div>
                      <div className="text-slate-600">
                        Valor registrado: <span className="font-mono font-bold text-blue-700">{val ?? 'Sin respuesta'}</span>
                        {matchedOpt && <span className="text-slate-500 ml-2">({matchedOpt.label})</span>}
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedSubmission(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium rounded transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backup, Clear & Restore Modal */}
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
