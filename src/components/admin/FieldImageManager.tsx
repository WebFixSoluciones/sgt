'use client';

import React, { useState, useRef } from 'react';
import {
  Image as ImageIcon,
  UploadCloud,
  Maximize2,
  Trash2,
  Link as LinkIcon,
  X,
  Loader2,
  Check,
  RefreshCw,
} from 'lucide-react';
import { FormField } from '@/lib/types';
import { compressImageFile } from '@/lib/image-utils';

interface FieldImageManagerProps {
  field: FormField;
  compact?: boolean;
  onUpdate: (updates: Partial<FormField>) => void;
  onPreview: (src: string, caption?: string) => void;
}

export default function FieldImageManager({
  field,
  compact = false,
  onUpdate,
  onPreview,
}: FieldImageManagerProps) {
  const [isUrlMode, setIsUrlMode] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor seleccione un archivo de imagen válido (PNG, JPG, WEBP, GIF, SVG).');
      return;
    }

    try {
      setIsUploading(true);
      const compressedDataUrl = await compressImageFile(file);
      onUpdate({
        imageUrl: compressedDataUrl,
        imageAlt: field.imageAlt || file.name.replace(/\.[^/.]+$/, ''),
      });
      setIsExpanded(true);
      setIsUrlMode(false);
    } catch (err) {
      console.error('Error al procesar la imagen:', err);
      alert('Ocurrió un error al procesar la imagen. Intente nuevamente.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleSaveUrl = () => {
    if (!urlInput.trim()) return;
    onUpdate({
      imageUrl: urlInput.trim(),
    });
    setUrlInput('');
    setIsUrlMode(false);
    setIsExpanded(true);
  };

  const handleRemoveImage = () => {
    onUpdate({
      imageUrl: undefined,
      imageCaption: undefined,
      imageAlt: undefined,
    });
    setIsExpanded(false);
    setIsUrlMode(false);
  };

  // If image is attached, show preview and details
  if (field.imageUrl) {
    return (
      <div className="bg-slate-50/90 border border-slate-200 rounded-xl p-3 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-blue-100 text-blue-700">
              <ImageIcon className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs font-bold text-slate-800">
              Imagen Asignada
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => onPreview(field.imageUrl!, field.imageCaption || field.label)}
              className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold transition-colors inline-flex items-center gap-1 shadow-2xs"
              title="Ver imagen en tamaño completo"
            >
              <Maximize2 className="w-3 h-3 text-slate-500" />
              <span>Ampliar</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-2 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-semibold transition-colors inline-flex items-center gap-1 shadow-2xs"
              title="Reemplazar imagen con otro archivo"
            >
              {isUploading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
              <span>Cambiar</span>
            </button>

            <button
              type="button"
              onClick={handleRemoveImage}
              className="px-2 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-semibold transition-colors inline-flex items-center gap-1 shadow-2xs"
              title="Quitar imagen"
            >
              <Trash2 className="w-3 h-3" />
              <span>Quitar</span>
            </button>
          </div>
        </div>

        {/* Hidden file input for replacing */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Image preview box */}
        <div
          onClick={() => onPreview(field.imageUrl!, field.imageCaption || field.label)}
          className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white hover:border-blue-400 transition-all flex items-center justify-center max-h-56 p-1"
          title="Haga clic para ver en tamaño grande"
        >
          <img
            src={field.imageUrl}
            alt={field.imageAlt || field.label || 'Imagen de la pregunta'}
            className="w-auto h-auto max-h-52 max-w-full object-contain mx-auto rounded-lg group-hover:scale-[1.01] transition-transform duration-150"
          />
          <div className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[10px] px-2 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Maximize2 className="w-3 h-3" />
            <span>Clic para ampliar</span>
          </div>
        </div>

        {/* Caption & Alt inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Pie de Foto / Leyenda (Visible para el evaluado)
            </label>
            <input
              type="text"
              value={field.imageCaption || ''}
              onChange={(e) => onUpdate({ imageCaption: e.target.value })}
              placeholder="Ej: Figura 1. Mapa de estructura comercial o proceso..."
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Texto Descriptivo (Accesibilidad)
            </label>
            <input
              type="text"
              value={field.imageAlt || ''}
              onChange={(e) => onUpdate({ imageAlt: e.target.value })}
              placeholder="Ej: Diagrama de flujo de aprobaciones de compra"
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    );
  }

  // If compact question mode and not expanded, show discrete trigger button
  if (compact && !isExpanded) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-700 bg-slate-50 hover:bg-blue-50/80 px-2.5 py-1 rounded-lg border border-dashed border-slate-300 hover:border-blue-300 transition-all font-medium"
          title="Adjuntar imagen de apoyo, esquema o diagrama para esta pregunta"
        >
          <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
          <span>+ Adjuntar Imagen a esta Pregunta</span>
        </button>
      </div>
    );
  }

  // Dropzone / URL selector mode
  return (
    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-xs font-bold text-slate-700">
            {compact ? 'Adjuntar Imagen a la Pregunta' : 'Asignar Imagen al Enunciado'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!isUrlMode ? (
            <button
              type="button"
              onClick={() => setIsUrlMode(true)}
              className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
            >
              <LinkIcon className="w-3 h-3" />
              <span>Pegar URL web</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsUrlMode(false)}
              className="text-[11px] text-slate-600 hover:text-slate-900 font-semibold inline-flex items-center gap-1"
            >
              <UploadCloud className="w-3 h-3" />
              <span>Subir archivo</span>
            </button>
          )}

          {compact && (
            <button
              type="button"
              onClick={() => {
                setIsExpanded(false);
                setIsUrlMode(false);
              }}
              className="text-slate-400 hover:text-slate-600 p-0.5"
              title="Cancelar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {isUrlMode ? (
        <div className="flex items-center gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://ejemplo.com/diagrama-estructura.png"
            className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500"
          />
          <button
            type="button"
            onClick={handleSaveUrl}
            disabled={!urlInput.trim()}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Aplicar</span>
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-4 sm:p-5 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-blue-500 bg-blue-50/70'
              : 'border-slate-300 hover:border-blue-400 bg-white hover:bg-blue-50/20'
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center justify-center py-2">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin mb-1.5" />
              <p className="text-xs font-bold text-slate-700">Procesando y optimizando imagen...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-1">
              <div className="p-2 rounded-full bg-blue-50 text-blue-600 mb-0.5">
                <UploadCloud className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-800">
                Haga clic para seleccionar o arrastre una imagen aquí
              </p>
              <p className="text-[11px] text-slate-500">
                Formatos compatibles: PNG, JPG, WEBP, GIF, SVG (Optimización automática HD)
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
