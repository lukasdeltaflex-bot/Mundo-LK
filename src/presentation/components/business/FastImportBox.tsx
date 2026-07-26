'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Sparkles, Link as LinkIcon, Tag, ArrowRight, Loader2, Check } from 'lucide-react';
import { ImportUrlSchema, ImportUrlFormData } from '@/shared/validators/import-url.validator';
import { PRODUCT_CATEGORIES } from '@/core/domain/entities/category.entity';
import { CategorySuggesterService } from '@/core/domain/services/category-suggester.service';
import { Button } from '../ui/Button';

export interface FastImportBoxProps {
  onImport: (data: ImportUrlFormData & { category?: string }) => Promise<void>;
  isLoading?: boolean;
}

export const FastImportBox: React.FC<FastImportBoxProps> = ({ onImport, isLoading }) => {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Eletrônicos');
  const [isAiSuggested, setIsAiSuggested] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ImportUrlFormData>({
    resolver: zodResolver(ImportUrlSchema as unknown as Parameters<typeof zodResolver>[0]) as unknown as ReturnType<typeof useForm<ImportUrlFormData>>['formState']['errors'] extends undefined ? undefined : ReturnType<typeof useForm<ImportUrlFormData>>['control']['_options']['resolver'],
  });

  const urlValue = watch('url');

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.trim().length > 10) {
      const suggested = CategorySuggesterService.suggestCategory(val);
      setSelectedCategory(suggested);
      setIsAiSuggested(true);
    }
  };

  const onSubmit = async (data: ImportUrlFormData) => {
    try {
      setActiveStep(1);
      setTimeout(() => setActiveStep(2), 600);
      setTimeout(() => setActiveStep(3), 1200);
      setTimeout(() => setActiveStep(4), 1800);

      await onImport({ ...data, category: selectedCategory });

      setTimeout(() => {
        setActiveStep(null);
        reset();
      }, 2400);
    } catch {
      setActiveStep(null);
    }
  };

  const steps = [
    'Extraindo Dados do Marketplace',
    'Processando Imagens e Preços',
    'Gerando Copys com IA',
    'Calculando Score de Oferta',
  ];

  return (
    <div className="rounded-2xl border border-blue-500/30 bg-slate-900/90 p-6 shadow-2xl backdrop-blur">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Importação Inteligente com Detecção de Categoria</h3>
          <p className="text-xs text-slate-400">A IA analisa o link e sugere a categoria ideal para contextualização.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* URL Input */}
          <div className="md:col-span-2 relative">
            <div className="relative">
              <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                {...register('url')}
                onChange={(e) => {
                  register('url').onChange(e);
                  handleUrlChange(e);
                }}
                type="url"
                placeholder="https://shopee.com.br/product/... ou https://mercadolivre.com.br/..."
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
            {errors.url && <p className="text-[11px] text-red-400 mt-1">{errors.url.message}</p>}
          </div>

          {/* Category Dropdown with AI Suggestion indicator */}
          <div className="relative">
            <div className="relative">
              <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setIsAiSuggested(false);
                }}
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500 transition"
              >
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            {isAiSuggested && (
              <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1 mt-1 animate-in fade-in duration-150">
                <Check className="h-3 w-3" /> Categoria sugerida pela IA
              </span>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            className="w-full sm:w-auto px-6 py-3 text-xs font-bold"
            disabled={isLoading}
            leftIcon={isLoading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : undefined}
            rightIcon={!isLoading ? <ArrowRight className="h-4 w-4" /> : undefined}
          >
            {isLoading ? 'Processando Oferta...' : 'Importar & Gerar Oferta'}
          </Button>
        </div>
      </form>

      {/* Workflow Progress Steps */}
      {activeStep !== null && (
        <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-3 animate-in fade-in duration-200">
          <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Progresso do Workflow Mundo LK</h4>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            {steps.map((stepName, idx) => {
              const stepNum = idx + 1;
              const isCurrent = activeStep === stepNum;
              const isDone = activeStep > stepNum;

              return (
                <div
                  key={stepNum}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs transition ${
                    isDone
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                      : isCurrent
                      ? 'border-blue-500 bg-blue-600/10 text-blue-300 animate-pulse'
                      : 'border-slate-800 bg-slate-950/40 text-slate-600'
                  }`}
                >
                  <span className="font-mono text-[10px] font-bold">{stepNum}.</span>
                  <span className="truncate">{stepName}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
