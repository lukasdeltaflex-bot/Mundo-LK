'use client';

import React, { useState, useEffect } from 'react';
import { auth, db } from '@/infrastructure/firebase/config/firebase.config';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

export const FirestoreDiagnosticPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Etapa 1 Data
  const [nativeAuthInfo, setNativeAuthInfo] = useState<{
    uid: string;
    email: string;
    providers: string;
    isAnonymous: boolean;
  }>({ uid: 'carregando...', email: '', providers: '', isAnonymous: false });

  // Etapa 2 Data (Unfiltered)
  const [rawOffersResult, setRawOffersResult] = useState<{
    totalDocs: number;
    docs: { id: string; userId: string; tenantId: string; marketplaceId: string; createdAt: string }[];
    distinctUserIds: string[];
    error?: string;
  } | null>(null);

  // Etapa 3 Data (Filtered)
  const [filteredOffersResult, setFilteredOffersResult] = useState<{
    uidUsed: string;
    totalDocs: number;
    docs: { id: string; userId: string; tenantId: string; marketplaceId: string; createdAt: string }[];
    error?: string;
  } | null>(null);

  const [envInfo, setEnvInfo] = useState<{
    isMobile: boolean;
    isSafari: boolean;
    isPWA: boolean;
    swActive: boolean;
    userAgent: string;
    href: string;
  }>({
    isMobile: false,
    isSafari: false,
    isPWA: false,
    swActive: false,
    userAgent: '',
    href: '',
  });

  const refreshNativeAuthInfo = () => {
    const cur = auth.currentUser;
    setNativeAuthInfo({
      uid: cur?.uid || 'null (NÃO AUTENTICADO)',
      email: cur?.email || 'N/A',
      providers: cur?.providerData.map((p) => p.providerId).join(', ') || (cur?.isAnonymous ? 'anonymous' : 'password/email'),
      isAnonymous: cur?.isAnonymous || false,
    });
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    refreshNativeAuthInfo();

    const ua = navigator.userAgent || '';
    const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua) || /iPhone|iPad|iPod/i.test(ua);
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
    const swActive = 'serviceWorker' in navigator && !!navigator.serviceWorker.controller;

    setEnvInfo({
      isMobile,
      isSafari,
      isPWA,
      swActive,
      userAgent: ua,
      href: window.location.href,
    });
  }, []);

  const runFullAuditPipeline = async () => {
    setLoading(true);
    refreshNativeAuthInfo();
    const curUid = auth.currentUser?.uid;

    try {
      // ── ETAPA 2 — Leitura Direta Sem Filtro ─────────────────────────────
      let rawDocs: any[] = [];
      let rawError: string | undefined;
      try {
        const rawQuery = query(collection(db, 'offers'), limit(50));
        const rawSnap = await getDocs(rawQuery);
        rawDocs = rawSnap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            userId: data.userId || 'N/A',
            tenantId: data.tenantId || 'N/A',
            marketplaceId: data.marketplaceId || data.marketplaceSlug || 'N/A',
            createdAt: data.createdAt || 'N/A',
          };
        });

        // Imprimir no console antes de qualquer setState
        console.group('📌 [AUDIT ETAPA 2] Leitura Direta Coleção "offers"');
        console.log('Total Documentos Brutos:', rawSnap.size);
        console.table(rawSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        console.groupEnd();
      } catch (err: any) {
        rawError = `[${err?.code || 'ERROR'}] ${err?.message || String(err)}`;
      }

      const distinctUserIds = Array.from(new Set(rawDocs.map((d) => d.userId)));

      setRawOffersResult({
        totalDocs: rawDocs.length,
        docs: rawDocs,
        distinctUserIds,
        error: rawError,
      });

      // ── ETAPA 3 — Consulta Filtrada (where("userId", "==", auth.currentUser.uid)) ──
      let filteredDocs: any[] = [];
      let filteredError: string | undefined;
      if (curUid) {
        try {
          const filteredQuery = query(collection(db, 'offers'), where('userId', '==', curUid), limit(50));
          const filteredSnap = await getDocs(filteredQuery);
          filteredDocs = filteredSnap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              userId: data.userId || 'N/A',
              tenantId: data.tenantId || 'N/A',
              marketplaceId: data.marketplaceId || data.marketplaceSlug || 'N/A',
              createdAt: data.createdAt || 'N/A',
            };
          });

          // ETAPA 5 — Imprimir tabela da consulta filtrada antes de qualquer setState
          console.group('📌 [AUDIT ETAPA 3 & 5] Consulta Filtrada where("userId", "==", auth.currentUser.uid)');
          console.log('UID Utilizado:', curUid);
          console.log('Total Documentos Retornados:', filteredSnap.size);
          console.table(filteredSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
          console.groupEnd();
        } catch (err: any) {
          filteredError = `[${err?.code || 'ERROR'}] ${err?.message || String(err)}`;
        }
      } else {
        filteredError = 'auth.currentUser.uid é NULL no momento da consulta!';
      }

      setFilteredOffersResult({
        uidUsed: curUid || 'null',
        totalDocs: filteredDocs.length,
        docs: filteredDocs,
        error: filteredError,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] font-mono text-xs">
      {!isOpen ? (
        <button
          onClick={() => {
            setIsOpen(true);
            runFullAuditPipeline();
          }}
          className="bg-purple-900/90 hover:bg-purple-800 text-purple-200 border border-purple-500/40 px-3 py-2 rounded-lg shadow-2xl backdrop-blur flex items-center gap-2 text-xs font-semibold"
        >
          <span>⚡ Auditoria Final (Desktop vs Safari)</span>
        </button>
      ) : (
        <div className="bg-slate-950/95 border border-purple-500/40 text-slate-200 p-4 rounded-xl shadow-2xl max-w-xl w-[94vw] max-h-[88vh] overflow-y-auto space-y-4 backdrop-blur-md text-xs">
          <div className="flex items-center justify-between border-b border-purple-500/30 pb-2">
            <h3 className="font-bold text-purple-300 flex items-center gap-2 text-sm">
              <span>🔍 Prova Definitiva: Desktop vs Safari</span>
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white text-base px-2 py-0.5 font-bold"
            >
              ✕
            </button>
          </div>

          {/* ETAPA 1 — CAPTURAR UID REAL (auth.currentUser.uid) */}
          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-cyan-500/30">
            <h4 className="font-bold text-cyan-400 mb-1">📌 ETAPA 1 — Capturar UID Real (`auth.currentUser`)</h4>
            <div className="space-y-1 text-[11px]">
              <div><span className="text-slate-500">UID Real (`auth.currentUser.uid`):</span> <span className="font-bold text-cyan-300 select-all">{nativeAuthInfo.uid}</span></div>
              <div><span className="text-slate-500">Email:</span> <span className="text-slate-200">{nativeAuthInfo.email}</span></div>
              <div><span className="text-slate-500">Provider:</span> <span className="text-amber-300">{nativeAuthInfo.providers}</span></div>
              <div><span className="text-slate-500">isAnonymous:</span> <span className={nativeAuthInfo.isAnonymous ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>{String(nativeAuthInfo.isAnonymous)}</span></div>
            </div>
          </div>

          {/* ETAPA 2 — LEITURA DIRETA SEM FILTRO */}
          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-amber-500/30">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-bold text-amber-400">📂 ETAPA 2 — Leitura Direta Coleção (`getDocs("offers")`)</h4>
              <button
                onClick={runFullAuditPipeline}
                disabled={loading}
                className="bg-amber-900/60 hover:bg-amber-700 text-amber-200 text-[10px] px-2 py-0.5 rounded border border-amber-500/30"
              >
                {loading ? 'Executando...' : '🔄 Re-executar Pipeline'}
              </button>
            </div>
            {rawOffersResult ? (
              <div className="space-y-1 text-[11px]">
                <div><span className="text-slate-500">Total Documentos Brutos na Coleção:</span> <span className="font-bold text-amber-300">{rawOffersResult.totalDocs}</span></div>
                <div><span className="text-slate-500">UserIDs Distintos Encontrados na Coleção:</span> <span className="font-bold text-purple-300">{rawOffersResult.distinctUserIds.join(', ') || 'Nenhum'}</span></div>
                {rawOffersResult.error && <div className="text-red-400 bg-red-950/50 p-1 rounded mt-1">{rawOffersResult.error}</div>}
              </div>
            ) : (
              <div className="text-slate-500 italic text-[11px]">Clique em Re-executar para carregar.</div>
            )}
          </div>

          {/* ETAPA 3 & 4 — CONSULTA FILTRADA & COMPARATIVO */}
          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-emerald-500/30">
            <h4 className="font-bold text-emerald-400 mb-1">🎯 ETAPA 3 & 4 — Consulta Filtrada (`where("userId", "==", uid)`)</h4>
            {filteredOffersResult ? (
              <div className="space-y-1 text-[11px]">
                <div><span className="text-slate-500">UID Utilizado na Query:</span> <span className="font-bold text-cyan-300 select-all">{filteredOffersResult.uidUsed}</span></div>
                <div><span className="text-slate-500">Quantidade Retornada:</span> <span className="font-bold text-emerald-300 text-xs">{filteredOffersResult.totalDocs} documento(s)</span></div>
                {filteredOffersResult.error && <div className="text-red-400 bg-red-950/50 p-1 rounded mt-1">{filteredOffersResult.error}</div>}

                {/* COMPARATIVO ETAPA 4 */}
                {rawOffersResult && rawOffersResult.totalDocs > 0 && filteredOffersResult.totalDocs === 0 && (
                  <div className="mt-2 bg-red-950/80 border border-red-500/50 text-red-200 p-2 rounded text-[11px]">
                    <div className="font-bold mb-1">🚨 DIVERGÊNCIA DETECTADA (ETAPA 4):</div>
                    <div>A coleção "offers" possui {rawOffersResult.totalDocs} documento(s) no Firestore, mas a busca por `userId == "{filteredOffersResult.uidUsed}"` retornou 0!</div>
                    <div className="mt-1 font-semibold text-amber-300">UserIDs existentes no banco: [{rawOffersResult.distinctUserIds.join(', ')}]</div>
                  </div>
                )}

                {filteredOffersResult.docs.length > 0 && (
                  <div className="mt-2 space-y-1 max-h-36 overflow-y-auto pr-1">
                    {filteredOffersResult.docs.map((d) => (
                      <div key={d.id} className="bg-slate-950 p-1.5 rounded border border-emerald-900 text-[10px]">
                        <div className="font-bold text-slate-200">{d.id}</div>
                        <div className="text-slate-400">userId: {d.userId} | tenantId: {d.tenantId}</div>
                        <div className="text-slate-400">mkt: {d.marketplaceId} | data: {d.createdAt}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-slate-500 italic text-[11px]">Aguardando pipeline de auditoria.</div>
            )}
          </div>

          {/* AMBIENTE */}
          <div className="text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-800 pt-2">
            <span>{envInfo.isMobile ? '📱 Mobile' : '🖥️ Desktop'} | {envInfo.isSafari ? '🧭 Safari' : '🌐 Chrome/Outro'}</span>
            <span>Logs enviados ao DevTools via `console.table()`</span>
          </div>
        </div>
      )}
    </div>
  );
};
