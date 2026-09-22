'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { History, RotateCcw, ArrowRight, HelpCircle } from 'lucide-react';

interface ResumePromptModalProps {
  questionNumber?: number;
  answeredCount?: number;
  totalQuestions?: number;
  questionLabel?: string;
  currentSectionTitle?: string;
  onContinue: () => void;
  onReset: () => void;
}

export default function ResumePromptModal({
  questionNumber,
  answeredCount,
  totalQuestions,
  questionLabel,
  currentSectionTitle,
  onContinue,
  onReset,
}: ResumePromptModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayQNum = questionNumber || (answeredCount ? answeredCount + 1 : 1);

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto border border-blue-100 shadow-xs">
          <History className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[11px] uppercase tracking-wider border border-blue-100">
            Evaluación en Curso Detectada
          </span>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">
            Te quedaste en la pregunta {displayQNum}
          </h3>
          {currentSectionTitle && (
            <p className="text-xs text-slate-500 font-medium">
              {currentSectionTitle}
            </p>
          )}
        </div>

        {/* Question preview card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-left text-xs text-slate-700 space-y-1.5">
          {answeredCount !== undefined && totalQuestions !== undefined && (
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Preguntas respondidas:</span>
              <strong className="text-blue-600 font-mono">{answeredCount} de {totalQuestions}</strong>
            </div>
          )}
          {questionLabel && (
            <div className="flex items-start gap-2 pt-1 border-t border-slate-200/60 text-slate-800">
              <HelpCircle className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
              <span className="font-medium line-clamp-2">{questionLabel}</span>
            </div>
          )}
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          ¿Deseas continuar desde donde te quedaste o prefieres reiniciar la evaluación?
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onReset}
            className="w-full py-2.5 px-4 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-300 hover:border-rose-200 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reiniciar evaluación</span>
          </button>

          <button
            type="button"
            onClick={onContinue}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>Continuar evaluación</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
