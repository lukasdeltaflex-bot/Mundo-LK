'use client';

import React, { useState, useEffect } from 'react';
import {
  Key, ShieldCheck, AlertTriangle, CheckCircle2, X, RefreshCw, Info, Save, Activity, Wifi
} from 'lucide-react';
import { Button } from '@/presentation/components/ui/Button';
import { useAuth } from '@/presentation/context/AuthContext';
import { MarketplaceConnectionService, ConnectionTestResult } from '@/core/application/services/integrations/MarketplaceConnectionService';
import { MarketplaceConnectionSlug, MarketplaceCredentials } from '@/core/domain/entities/marketplace-connection.entity';

interface CredentialManagerModalProps {
  onClose: () => void;
}

interface CredentialFormState {
  slug: MarketplaceConnectionSlug;
  name: string;
  category: string;
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  partnerId?: string;
  partnerKey?: string;
  phoneNumberId?: string;
  apiKey?: string;
}

export const CredentialManagerModal: React.FC<CredentialManagerModalProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [selectedSlug, setSelectedSlug] = useState<MarketplaceConnectionSlug>('mercadolivre');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const availableIntegrations: Array<{ slug: MarketplaceConnectionSlug; name: string; category: string; description: string }> = [
    { slug: 'mercadolivre', name: 'Mercado Livre Brasil', category: 'Marketplace', description: 'Client ID, Client Secret e Access Token OAuth v2' },
    { slug: 'shopee', name: 'Shopee Brasil', category: 'Marketplace', description: 'Partner ID, Partner Key e Shop ID no portal de devs' },
    { slug: 'whatsapp', name: 'WhatsApp Cloud API', category: 'Canal Social', description: 'Access Token e Phone Number ID na Meta Developer' },
    { slug: 'gemini', name: 'Google Gemini 2.5 Flash', category: 'IA Core', description: 'Chave API no Google AI Studio (GEMINI_API_KEY)' },
    { slug: 'openai', name: 'OpenAI GPT-4o', category: 'IA Core', description: 'Chave de API OpenAI Platform (OPENAI_API_KEY)' },
  ];

  const currentIntegration = availableIntegrations.find((i) => i.slug === selectedSlug) || availableIntegrations[0];

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const creds: MarketplaceCredentials = {
        clientId: formData.clientId,
        clientSecret: formData.clientSecret,
        accessToken: formData.accessToken,
        partnerId: formData.partnerId,
        partnerKey: formData.partnerKey,
        phoneNumberId: formData.phoneNumberId,
        apiKey: formData.apiKey,
      };

      const result = await MarketplaceConnectionService.getInstance().testRealConnection(selectedSlug, creds);
      setTestResult(result);
    } catch (err: any) {
      setTestResult({
        marketplaceSlug: selectedSlug,
        success: false,
        status: 'ERROR',
        latencyMs: 0,
        endpointTested: 'API Test Endpoint',
        message: `🔴 Falha ao testar conexão: ${err?.message || String(err)}`,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
      });
    } fontally: {
      setIsTesting(false);
    }
  };

  const handleSaveCredentials = async () => {
    if (!user) return;
    setIsSaving(true);
    setFeedback(null);
    try {
      const creds: MarketplaceCredentials = {
        clientId: formData.clientId,
        clientSecret: formData.clientSecret,
        accessToken: formData.accessToken,
        partnerId: formData.partnerId,
        partnerKey: formData.partnerKey,
        phoneNumberId: formData.phoneNumberId,
        apiKey: formData.apiKey,
      };

      await MarketplaceConnectionService.getInstance().saveUserCredentials({
        userId: user.uid,
        marketplaceSlug: selectedSlug,
        credentials: creds,
      });

      setFeedback({ type: 'success', message: 'Credenciais salvas com sucesso em marketplace_connections!' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: `Erro ao salvar credenciais: ${err?.message || String(err)}` });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Hub Oficial de Credenciais & APIs Enterprise</h2>
              <p className="text-xs text-slate-400">
                Gerencie credenciais salvas no seu tenant ou utilize o fallback automático do servidor (`process.env`).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Seleção da Integração */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {availableIntegrations.map((item) => (
            <button
              key={item.slug}
              type="button"
              onClick={() => {
                setSelectedSlug(item.slug);
                setTestResult(null);
                setFeedback(null);
              }}
              className={`p-2.5 rounded-xl text-left border text-xs transition-all ${
                selectedSlug === item.slug
                  ? 'bg-blue-600/20 border-blue-500 text-white font-bold'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <p className="font-semibold truncate">{item.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{item.category}</p>
            </button>
          ))}
        </div>

        {/* Formulário Dinâmico de Credenciais */}
        <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={16} className="text-blue-400" />
                Configurar {currentIntegration.name}
              </h3>
              <p className="text-xs text-slate-400">{currentIntegration.description}</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              Tenant: {user?.uid.slice(0, 8)}…
            </span>
          </div>

          {/* Campos específicos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {selectedSlug === 'mercadolivre' && (
              <>
                <div>
                  <label className="block text-slate-400 mb-1">Client ID</label>
                  <input
                    type="text"
                    placeholder="Ex: 882194012948"
                    value={formData.clientId || ''}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                    className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Client Secret</label>
                  <input
                    type="password"
                    placeholder="••••••••••••••••"
                    value={formData.clientSecret || ''}
                    onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
                    className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 mb-1">Access Token OAuth v2</label>
                  <input
                    type="password"
                    placeholder="Ex: APP_USR-88291048-072820-..."
                    value={formData.accessToken || ''}
                    onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
                    className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </>
            )}

            {selectedSlug === 'shopee' && (
              <>
                <div>
                  <label className="block text-slate-400 mb-1">Partner ID</label>
                  <input
                    type="text"
                    placeholder="Ex: 18317770060"
                    value={formData.partnerId || ''}
                    onChange={(e) => setFormData({ ...formData, partnerId: e.target.value })}
                    className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Partner Key</label>
                  <input
                    type="password"
                    placeholder="••••••••••••••••"
                    value={formData.partnerKey || ''}
                    onChange={(e) => setFormData({ ...formData, partnerKey: e.target.value })}
                    className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </>
            )}

            {selectedSlug === 'whatsapp' && (
              <>
                <div>
                  <label className="block text-slate-400 mb-1">Phone Number ID</label>
                  <input
                    type="text"
                    placeholder="Ex: 1048201948201"
                    value={formData.phoneNumberId || ''}
                    onChange={(e) => setFormData({ ...formData, phoneNumberId: e.target.value })}
                    className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Meta Access Token</label>
                  <input
                    type="password"
                    placeholder="Ex: EAA..."
                    value={formData.accessToken || ''}
                    onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
                    className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </>
            )}

            {(selectedSlug === 'gemini' || selectedSlug === 'openai') && (
              <div className="sm:col-span-2">
                <label className="block text-slate-400 mb-1">API Key</label>
                <input
                  type="password"
                  placeholder="Ex: AIzaSy... ou sk-..."
                  value={formData.apiKey || ''}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            )}
          </div>

          {/* Toast / Feedback */}
          {feedback && (
            <div className={`p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${
              feedback.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
            }`}>
              {feedback.type === 'success' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Resultado do Teste de Conexão */}
          {testResult && (
            <div className={`p-3 rounded-lg border text-xs space-y-1 ${
              testResult.success ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200' : 'bg-rose-950/40 border-rose-500/30 text-rose-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold">{testResult.message}</span>
                <span className="font-mono text-[10px] opacity-80">{testResult.latencyMs}ms</span>
              </div>
              <p className="text-[11px] font-mono opacity-70">Endpoint: {testResult.endpointTested}</p>
              {testResult.errorDetails && <p className="text-[11px] font-semibold text-rose-400 mt-1">{testResult.errorDetails}</p>}
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-300 transition-all"
            >
              <RefreshCw size={14} className={isTesting ? 'animate-spin text-blue-400' : ''} />
              {isTesting ? 'Testando Conexão Real…' : 'Testar Conexão Real'}
            </button>

            <button
              type="button"
              onClick={handleSaveCredentials}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-md transition-all"
            >
              <Save size={14} />
              {isSaving ? 'Salvando…' : 'Salvar no Tenant'}
            </button>
          </div>
        </div>

        {/* Rodapé com Orientação */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-[11px]">
            <Info className="h-3.5 w-3.5 text-blue-400 shrink-0" />
            As credenciais do tenant possuem prioridade total sobre as variáveis `.env` do Vercel.
          </div>
          <Button type="button" variant="primary" size="sm" onClick={onClose} className="text-xs font-bold px-5">
            Concluído
          </Button>
        </div>
      </div>
    </div>
  );
};
