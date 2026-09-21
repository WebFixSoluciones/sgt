'use client';

import React from 'react';
import { History, RotateCcw, ArrowRight } from 'lucide-react';

interface ResumePromptModalProps {
  currentSectionTitle: string;
  onContinue: () => void;
  onReset: () => void;
}

export default function ResumePromptModal({
  currentSectionTitle,
  onContinue,
  onReset,
}: ResumePromptModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
          <History className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-900">Evaluación en Progreso</h3>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Detectamos que tienes una evaluación iniciada previamente.
            {currentSectionTitle ? (
              <span className="block mt-1 font-semibold text-slate-800">
                Te quedaste en: {currentSectionTitle}
              </span>
            ) : null}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            ¿Deseas continuar desde donde lo dejaste o prefieres reiniciar la evaluación desde cero?
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
          <button
            type="button"
            onClick={onReset}
            className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-medium rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reiniciar evaluación</span>
          </button>

          <button
            type="button"
            onClick={onContinue}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
          >
            <span>Continuar desde aquí</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
