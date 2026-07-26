'use client';

import React, { useState } from 'react';
import { Link2, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { FormWrapper } from '../forms/FormWrapper';
import { FormInput } from '../forms/FormInput';
import { Button } from '../ui/Button';
import { ImportUrlSchema, ImportUrlFormData } from '@/shared/validators/import-url.validator';

export interface FastImportBoxProps {
  onImport: (data: ImportUrlFormData) => Promise<void>;
  isLoading?: boolean;
}

export const FastImportBox: React.FC<FastImportBoxProps> = ({ onImport, isLoading = false }) => {
  const [currentStep, setCurrentStep] = useState<number>(0);

  const steps = [
    'Extraindo dados da loja e produto...',
    'Processando imagens e calculando desconto...',
    'Gerando cópias multicanais com Inteligência Artificial...',
    'Calculando Score Inteligente da Oferta (0-100)...',
  ];

  const handleSubmit = async (data: ImportUrlFormData) => {
    try {
      setCurrentStep(1);
      await onImport(data);
      setCurrentStep(4);
    } catch {
      setCurrentStep(0);
    }
  };

  return (
    <div className="w-full rounded-2xl border border-blue-500/20 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 p-6 shadow-xl backdrop-blur-md">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Importador Rápido em 1-Clique</h2>
          <p className="text-xs text-slate-400">Cole a URL da Shopee, Mercado Livre, Amazon ou Magalu para automatizar tudo.</p>
        </div>
      </div>

      <FormWrapper schema={ImportUrlSchema} onSubmit={handleSubmit}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex-1 w-full">
            <FormInput
              name="url"
              placeholder="https://shopee.com.br/product/... ou https://mercadolivre.com.br/..."
              leftIcon={<Link2 className="h-4 w-4" />}
              disabled={isLoading}
            />
          </div>
          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full sm:w-auto h-10 px-6 font-semibold"
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Gerar Oferta
          </Button>
        </div>
      </FormWrapper>

      {isLoading && (
        <div className="mt-5 space-y-2 border-t border-slate-800/80 pt-4">
          <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
            <span>Progresso da Automação</span>
            <span className="text-blue-400 font-semibold">{currentStep * 25}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-500 rounded-full"
              style={{ width: `${currentStep * 25}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-2 pt-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-blue-400 animate-pulse" />
            {steps[Math.min(currentStep - 1, steps.length - 1)] || 'Processando...'}
          </p>
        </div>
      )}
    </div>
  );
};
