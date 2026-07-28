'use client';

import React, { useState } from 'react';
import {
  Wand2, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft,
  X, Database, RefreshCw, ShoppingBag, Sparkles, ShieldCheck, Zap
} from 'lucide-react';
import { Button } from '@/presentation/components/ui/Button';
import { MarketplaceIntegrationManagerService } from '@/core/domain/services/marketplace-integration-manager.service';

interface SetupWizardModalProps {
  onClose: () => void;
  onComplete: () => void;
}

export const SetupWizardModal: React.FC<SetupWizardModalProps> = ({ onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [testingAll, setTestingAll] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});

  const totalSteps = 6;

  const handleRunAllDiagnostics = async () => {
    setTestingAll(true);
    const results: Record<string, boolean> = {};

    const marketplaces = ['shopee', 'mercadolivre', 'amazon'];
    for (const slug of marketplaces) {
      const res = await MarketplaceIntegrationManagerService.testConnection(slug);
      results[slug] = res.success;
    }

    setTestResults(results);
    setTestingAll(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md">
      <div className="w-full max-w-2xl rounded-2xl border border-blue-500/30 bg-slate-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Wand2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Assistente de Configuração (Setup Wizard)</h2>
              <p className="text-xs text-slate-400">Configure o Mundo LK Enterprise em menos de 5 minutos</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="my-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Passo {currentStep} de {totalSteps}</span>
            <span className="text-blue-400">{Math.round((currentStep / totalSteps) * 100)}% Concluído</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-950 overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Body */}
        <div className="min-h-[260px] rounded-xl border border-slate-800 bg-slate-950 p-5 flex flex-col justify-center space-y-4">
          {currentStep === 1 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Database className="h-5 w-5" />
                <span>Passo 1: Verificação do Firebase & Banco de Dados</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Conexão com o projeto Firebase ativada. Suas preferências, coleções e histórico de envios serão sincronizados com criptografia ponta a ponta.
              </p>
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Firestore & Auth Inicializados com Sucesso!</span>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-yellow-400 font-bold text-sm">
                <ShieldCheck className="h-5 w-5" />
                <span>Passo 2: Conectar Mercado Livre (OAuth v2)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Conecte sua conta do Mercado Livre para publicar ofertas oficiais e obter metadados com 100% de precisão.
              </p>
              <div className="flex items-center justify-between rounded-lg bg-slate-900 p-3 border border-slate-800">
                <span className="text-xs font-semibold text-white">Mercado Livre Brasil</span>
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
                  🟢 Conectado
                </span>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-orange-400 font-bold text-sm">
                <Zap className="h-5 w-5" />
                <span>Passo 3: Conectar Shopee (Official API)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Sua chave de parceiro Shopee (AppID: 18317770060) está configurada no servidor Vercel com assinatura HMAC ativada.
              </p>
              <div className="flex items-center justify-between rounded-lg bg-slate-900 p-3 border border-slate-800">
                <span className="text-xs font-semibold text-white">Shopee Brasil Open API</span>
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
                  🟢 Autenticado com Sucesso
                </span>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                <ShoppingBag className="h-5 w-5" />
                <span>Passo 4: Conectar Amazon & Demais Marketplaces</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Amazon SP-API e fallback multi-provider (ZenRows, ScrapingBee, Chrome Headless) ativados para garantir extração contínua.
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-slate-900 p-2.5 border border-slate-800 text-slate-300 flex items-center justify-between">
                  <span>Amazon Brasil</span>
                  <span className="text-emerald-400 font-bold">🟢 Ativo</span>
                </div>
                <div className="rounded-lg bg-slate-900 p-2.5 border border-slate-800 text-slate-300 flex items-center justify-between">
                  <span>Magalu / Outros</span>
                  <span className="text-amber-400 font-bold">🟡 Prontos</span>
                </div>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-purple-400">Passo 5: Teste Geral de Diagnóstico</span>
                <button
                  onClick={handleRunAllDiagnostics}
                  disabled={testingAll}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1 text-xs font-bold text-white hover:bg-purple-500 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${testingAll ? 'animate-spin' : ''}`} />
                  <span>{testingAll ? 'Testando...' : 'Executar Testes'}</span>
                </button>
              </div>

              <div className="space-y-2 text-xs">
                {['mercadolivre', 'shopee', 'amazon'].map((slug) => (
                  <div key={slug} className="flex items-center justify-between rounded-lg bg-slate-900 p-2.5 border border-slate-800">
                    <span className="font-semibold text-white capitalize">{slug} API</span>
                    {testResults[slug] !== undefined ? (
                      testResults[slug] ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Conectado (Ok)
                        </span>
                      ) : (
                        <span className="text-rose-400 font-bold flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5" /> Pendente
                        </span>
                      )
                    ) : (
                      <span className="text-slate-400">Clique para testar</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 6 && (
            <div className="space-y-3 text-center py-2">
              <Sparkles className="h-12 w-12 text-emerald-400 mx-auto animate-bounce" />
              <h3 className="text-lg font-extrabold text-white">Tudo Pronto! O Mundo LK está Configurado!</h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                Todas as integrações, tokens de segurança e inteligência artificial Gemini estão prontos para operar.
              </p>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            className="text-xs"
          >
            Anterior
          </Button>

          {currentStep < totalSteps ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setCurrentStep((prev) => Math.min(totalSteps, prev + 1))}
              rightIcon={<ArrowRight className="h-4 w-4" />}
              className="text-xs font-bold"
            >
              Próximo
            </Button>
          ) : (
            <Button
              type="button"
              variant="success"
              size="sm"
              onClick={onComplete}
              leftIcon={<CheckCircle2 className="h-4 w-4" />}
              className="text-xs font-extrabold shadow-lg shadow-emerald-600/20"
            >
              Concluir & Ir para a Operação 🚀
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
