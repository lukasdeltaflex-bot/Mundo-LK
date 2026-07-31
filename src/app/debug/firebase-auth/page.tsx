'use client';

import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCSD70V0UfbwRlpCitCwMOWGpTZmPg5HmQ',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'mundo-lk-eb4da.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'mundo-lk-eb4da',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'mundo-lk-eb4da.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '90164257983',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:90164257983:web:b98e8dfd2816ebb9a1920a',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-HGV68PG5XR',
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const BUILD_INFO = {
  buildId: 'BUILD_2026_07_31_PROOF_V1',
  gitCommit: 'RELEASE_AUDIT_FINAL',
  deployTimestamp: '2026-07-31T12:00:00.000Z',
  environment: process.env.NODE_ENV || 'production',
};

export default function DebugFirebaseAuthPage() {
  // ETAPA 1 State
  const [authState, setAuthState] = useState<{
    uid: string | null;
    email: string | null;
    providers: string[];
    currentUserUid: string | null;
    isAnonymous: boolean;
    listenerCount: number;
    lastEventTimestamp: string;
  }>({
    uid: null,
    email: null,
    providers: [],
    currentUserUid: null,
    isAnonymous: false,
    listenerCount: 0,
    lastEventTimestamp: 'Aguardando evento...',
  });

  // ETAPA 2 State (Token)
  const [tokenResult, setTokenResult] = useState<{
    status: 'IDLE' | 'OK' | 'ERROR';
    tokenSnippet?: string;
    errorDetails?: string;
  }>({ status: 'IDLE' });

  // ETAPA 3 State (IndexedDB)
  const [idbState, setIdbState] = useState<{
    available: boolean;
    openStatus: string;
    errorDetails?: string;
  }>({ available: false, openStatus: 'Testando...' });

  // ETAPA 4 State (Auth Domain)
  const [domainInfo, setDomainInfo] = useState<{
    projectId: string;
    authDomainConfigured: string;
    currentHost: string;
    locationOrigin: string;
  }>({
    projectId: 'mundo-lk-eb4da',
    authDomainConfigured: 'mundo-lk-eb4da.firebaseapp.com',
    currentHost: '',
    locationOrigin: '',
  });

  // ETAPA 6 State (Raw Firestore Query)
  const [firestoreResult, setFirestoreResult] = useState<{
    status: 'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR';
    quantity: number;
    docs: { id: string; userId: string; tenantId: string }[];
    errorDetails?: string;
  }>({ status: 'IDLE', quantity: 0, docs: [] });

  // Login Form State
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // ── 1. Inicializar Listener do SDK Oficial do Firebase ───────────────────
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDomainInfo({
        projectId: firebaseConfig.projectId,
        authDomainConfigured: firebaseConfig.authDomain,
        currentHost: window.location.host,
        locationOrigin: window.location.origin,
      });

      // ETAPA 3 — Teste do IndexedDB
      const available = !!window.indexedDB;
      if (!available) {
        setIdbState({ available: false, openStatus: 'Indisponível (window.indexedDB é falsy)' });
      } else {
        try {
          const req = window.indexedDB.open('firebaseLocalStorageDb');
          req.onsuccess = () => {
            setIdbState({ available: true, openStatus: 'Sucesso (Abertura de firebaseLocalStorageDb autorizada)' });
            req.result.close();
          };
          req.onerror = (e: any) => {
            setIdbState({
              available: true,
              openStatus: 'Erro na abertura de firebaseLocalStorageDb',
              errorDetails: e?.target?.error?.message || String(e),
            });
          };
        } catch (err: any) {
          setIdbState({
            available: true,
            openStatus: 'Exceção ao chamar indexedDB.open()',
            errorDetails: err?.message || String(err),
          });
        }
      }
    }

    let count = 0;
    const unsubscribe = onAuthStateChanged(auth, (user: FirebaseUser | null) => {
      count++;
      console.log(`[DEBUG SDK] onAuthStateChanged #${count}`, { user, currentUser: auth.currentUser });

      setAuthState({
        uid: user?.uid || null,
        email: user?.email || null,
        providers: user?.providerData.map((p) => p.providerId) || [],
        currentUserUid: auth.currentUser?.uid || null,
        isAnonymous: user?.isAnonymous || false,
        listenerCount: count,
        lastEventTimestamp: new Date().toISOString(),
      });
    });

    return () => unsubscribe();
  }, []);

  // ── 2. ETAPA 2 — Testar getIdToken(true) ─────────────────────────────────
  const runTokenTest = async () => {
    const curUser = auth.currentUser;
    if (!curUser) {
      setTokenResult({
        status: 'ERROR',
        errorDetails: 'auth.currentUser é NULL. Faça o login primeiro nesta página.',
      });
      return;
    }

    try {
      const token = await curUser.getIdToken(true);
      setTokenResult({
        status: 'OK',
        tokenSnippet: token ? `${token.substring(0, 25)}...` : 'Vazio',
      });
    } catch (err: any) {
      setTokenResult({
        status: 'ERROR',
        errorDetails: err?.message || String(err),
      });
    }
  };

  // ── 3. ETAPA 6 — Testar Firestore Direto Sem Repository ─────────────────
  const runRawFirestoreTest = async () => {
    const curUid = auth.currentUser?.uid;
    if (!curUid) {
      setFirestoreResult({
        status: 'ERROR',
        quantity: 0,
        docs: [],
        errorDetails: 'Impossível consultar Firestore: auth.currentUser.uid é NULL.',
      });
      return;
    }

    setFirestoreResult({ status: 'LOADING', quantity: 0, docs: [] });
    try {
      const q = query(collection(db, 'offers'), where('userId', '==', curUid));
      const snap = await getDocs(q);

      const docs = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          userId: data.userId || 'N/A',
          tenantId: data.tenantId || 'N/A',
        };
      });

      setFirestoreResult({
        status: 'SUCCESS',
        quantity: snap.size,
        docs,
      });
    } catch (err: any) {
      setFirestoreResult({
        status: 'ERROR',
        quantity: 0,
        docs: [],
        errorDetails: `[${err?.code || 'ERROR'}] ${err?.message || String(err)}`,
      });
    }
  };

  // ── 4. Form de Login Direto do SDK ───────────────────────────────────────
  const handleDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      await signInWithEmailAndPassword(auth, emailInput, passwordInput);
      await runTokenTest();
      await runRawFirestoreTest();
    } catch (err: any) {
      setLoginError(`[${err?.code || 'LOGIN_ERROR'}] ${err?.message || String(err)}`);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleDirectLogout = async () => {
    await signOut(auth);
    setTokenResult({ status: 'IDLE' });
    setFirestoreResult({ status: 'IDLE', quantity: 0, docs: [] });
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', backgroundColor: '#090d16', color: '#e2e8f0', minHeight: '100vh' }}>
      <h1 style={{ color: '#38bdf8', fontSize: '20px', marginBottom: '4px' }}>
        🔬 Rota de Diagnóstico Estrito — SDK Oficial Firebase (`/debug/firebase-auth`)
      </h1>
      <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '20px' }}>
        Execução pura sem AuthContext, sem ProtectedRoute, sem Repositories, sem Mappers e sem Hooks da aplicação.
      </p>

      {/* PAINEL DE LOGIN DIRETO DO SDK */}
      <div style={{ border: '1px solid #334155', borderRadius: '8px', padding: '16px', marginBottom: '20px', backgroundColor: '#0f172a' }}>
        <h3 style={{ color: '#f59e0b', marginTop: 0, fontSize: '14px' }}>🔑 Login Direto via SDK Oficial (`signInWithEmailAndPassword`)</h3>
        <form onSubmit={handleDirectLogin} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="email"
            placeholder="carolramoscollection@gmail.com"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #475569', backgroundColor: '#020617', color: '#fff', fontSize: '12px' }}
          />
          <input
            type="password"
            placeholder="Sua senha"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #475569', backgroundColor: '#020617', color: '#fff', fontSize: '12px' }}
          />
          <button
            type="submit"
            disabled={loginLoading}
            style={{ padding: '8px 16px', borderRadius: '4px', backgroundColor: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
          >
            {loginLoading ? 'Autenticando...' : 'Entrar via SDK Nao-Interceptado'}
          </button>
          {authState.uid && (
            <button
              type="button"
              onClick={handleDirectLogout}
              style={{ padding: '8px 16px', borderRadius: '4px', backgroundColor: '#dc2626', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px' }}
            >
              Sair (signOut)
            </button>
          )}
        </form>
        {loginError && <div style={{ color: '#f87171', marginTop: '10px', fontSize: '12px' }}>{loginError}</div>}
      </div>

      {/* GRID DE ETAPAS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>

        {/* ETAPA 1 — ESTADO DE AUTENTICAÇÃO */}
        <div style={{ border: '1px solid #0284c7', borderRadius: '8px', padding: '14px', backgroundColor: '#0c4a6e22' }}>
          <h4 style={{ color: '#38bdf8', marginTop: 0 }}>📌 ETAPA 1 — onAuthStateChanged (SDK)</h4>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div><strong>UID:</strong> <span style={{ color: authState.uid ? '#4ade80' : '#f87171' }}>{authState.uid || 'null (NÃO AUTENTICADO)'}</span></div>
            <div><strong>Email:</strong> {authState.email || 'N/A'}</div>
            <div><strong>Providers:</strong> {authState.providers.join(', ') || 'Nenhum'}</div>
            <div><strong>auth.currentUser.uid:</strong> {authState.currentUserUid || 'null'}</div>
            <div><strong>isAnonymous:</strong> {String(authState.isAnonymous)}</div>
            <div><strong>Disparos do Listener:</strong> #{authState.listenerCount}</div>
            <div><strong>Último Evento:</strong> {authState.lastEventTimestamp}</div>
          </div>
        </div>

        {/* ETAPA 2 — TESTE DE PERSISTÊNCIA E TOKEN */}
        <div style={{ border: '1px solid #16a34a', borderRadius: '8px', padding: '14px', backgroundColor: '#14532d22' }}>
          <h4 style={{ color: '#4ade80', marginTop: 0 }}>🔑 ETAPA 2 — Persistência & Token ID</h4>
          <button
            onClick={runTokenTest}
            style={{ padding: '6px 12px', borderRadius: '4px', backgroundColor: '#16a34a', color: '#fff', border: 'none', cursor: 'pointer', marginBottom: '10px', fontSize: '12px', fontWeight: 'bold' }}
          >
            Executar getIdToken(true)
          </button>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div><strong>Status:</strong> {tokenResult.status}</div>
            {tokenResult.tokenSnippet && <div style={{ color: '#4ade80' }}><strong>TOKEN OK:</strong> {tokenResult.tokenSnippet}</div>}
            {tokenResult.errorDetails && <div style={{ color: '#f87171' }}><strong>TOKEN ERROR:</strong> {tokenResult.errorDetails}</div>}
          </div>
        </div>

        {/* ETAPA 3 — INDEXEDDB */}
        <div style={{ border: '1px solid #d97706', borderRadius: '8px', padding: '14px', backgroundColor: '#78350f22' }}>
          <h4 style={{ color: '#fbbf24', marginTop: 0 }}>💾 ETAPA 3 — Teste do IndexedDB</h4>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div><strong>window.indexedDB:</strong> <span style={{ color: idbState.available ? '#4ade80' : '#f87171' }}>{idbState.available ? 'Disponível' : 'Indisponível'}</span></div>
            <div><strong>Abertura de Banco:</strong> {idbState.openStatus}</div>
            {idbState.errorDetails && <div style={{ color: '#f87171' }}><strong>Erro Detalhado:</strong> {idbState.errorDetails}</div>}
          </div>
        </div>

        {/* ETAPA 4 — AUTH DOMAIN */}
        <div style={{ border: '1px solid #9333ea', borderRadius: '8px', padding: '14px', backgroundColor: '#581c8722' }}>
          <h4 style={{ color: '#c084fc', marginTop: 0 }}>🌐 ETAPA 4 — Auth Domain & Host</h4>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div><strong>Project ID:</strong> {domainInfo.projectId}</div>
            <div><strong>Auth Domain Configurado:</strong> <span style={{ color: '#c084fc' }}>{domainInfo.authDomainConfigured}</span></div>
            <div><strong>Current Host:</strong> {domainInfo.currentHost}</div>
            <div><strong>window.location.origin:</strong> {domainInfo.locationOrigin}</div>
          </div>
        </div>

        {/* ETAPA 5 — AUDITORIA DE BUILD */}
        <div style={{ border: '1px solid #64748b', borderRadius: '8px', padding: '14px', backgroundColor: '#1e293b22' }}>
          <h4 style={{ color: '#94a3b8', marginTop: 0 }}>📦 ETAPA 5 — Auditoria de Build</h4>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div><strong>Build ID:</strong> {BUILD_INFO.buildId}</div>
            <div><strong>Git Commit:</strong> {BUILD_INFO.gitCommit}</div>
            <div><strong>Deploy Timestamp:</strong> {BUILD_INFO.deployTimestamp}</div>
            <div><strong>Environment:</strong> {BUILD_INFO.environment}</div>
          </div>
        </div>

        {/* ETAPA 6 — TESTE DE FIRESTORE SEM REPOSITORY */}
        <div style={{ border: '1px solid #ec4899', borderRadius: '8px', padding: '14px', backgroundColor: '#83184322' }}>
          <h4 style={{ color: '#f472b6', marginTop: 0 }}>🔥 ETAPA 6 — Firestore Sem Repository</h4>
          <button
            onClick={runRawFirestoreTest}
            style={{ padding: '6px 12px', borderRadius: '4px', backgroundColor: '#db2777', color: '#fff', border: 'none', cursor: 'pointer', marginBottom: '10px', fontSize: '12px', fontWeight: 'bold' }}
          >
            Executar query(offers, where(userId == auth.currentUser.uid))
          </button>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div><strong>Status Query:</strong> {firestoreResult.status}</div>
            <div><strong>Quantidade Retornada:</strong> <span style={{ color: '#f472b6', fontSize: '14px', fontWeight: 'bold' }}>{firestoreResult.quantity} documento(s)</span></div>
            {firestoreResult.errorDetails && <div style={{ color: '#f87171' }}>{firestoreResult.errorDetails}</div>}
            {firestoreResult.docs.length > 0 && (
              <div style={{ marginTop: '8px', maxHeight: '120px', overflowY: 'auto' }}>
                {firestoreResult.docs.map((d) => (
                  <div key={d.id} style={{ fontSize: '10px', padding: '4px', borderBottom: '1px solid #475569' }}>
                    <strong>ID:</strong> {d.id} | <strong>userId:</strong> {d.userId}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ETAPA 7 — TABELA DE COMPARAÇÃO DESKTOP X SAFARI */}
      <div style={{ marginTop: '24px', border: '1px solid #475569', borderRadius: '8px', padding: '16px', backgroundColor: '#020617' }}>
        <h3 style={{ color: '#e2e8f0', marginTop: 0, fontSize: '14px' }}>📊 ETAPA 7 — Tabela de Comparação Vivo (Desktop vs Safari)</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginTop: '10px' }}>
          <thead>
            <tr style={{ backgroundColor: '#1e293b', textAlign: 'left' }}>
              <th style={{ padding: '8px', border: '1px solid #334155' }}>Item</th>
              <th style={{ padding: '8px', border: '1px solid #334155' }}>Valor no Dispositivo Atual ({domainInfo.currentHost})</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '8px', border: '1px solid #334155' }}>Build ID</td>
              <td style={{ padding: '8px', border: '1px solid #334155' }}>{BUILD_INFO.buildId}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', border: '1px solid #334155' }}>Git Commit</td>
              <td style={{ padding: '8px', border: '1px solid #334155' }}>{BUILD_INFO.gitCommit}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', border: '1px solid #334155' }}>Firebase Project ID</td>
              <td style={{ padding: '8px', border: '1px solid #334155' }}>{domainInfo.projectId}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', border: '1px solid #334155' }}>Auth Domain</td>
              <td style={{ padding: '8px', border: '1px solid #334155' }}>{domainInfo.authDomainConfigured}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', border: '1px solid #334155' }}>UID Ativo</td>
              <td style={{ padding: '8px', border: '1px solid #334155', color: authState.uid ? '#4ade80' : '#f87171' }}>{authState.uid || 'null (NÃO AUTENTICADO)'}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', border: '1px solid #334155' }}>Token Status</td>
              <td style={{ padding: '8px', border: '1px solid #334155' }}>{tokenResult.status} ({tokenResult.tokenSnippet || tokenResult.errorDetails || 'Não testado'})</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', border: '1px solid #334155' }}>IndexedDB Status</td>
              <td style={{ padding: '8px', border: '1px solid #334155' }}>{idbState.openStatus}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', border: '1px solid #334155' }}>Firestore Direct Query</td>
              <td style={{ padding: '8px', border: '1px solid #334155' }}>{firestoreResult.status} ({firestoreResult.quantity} docs)</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* PAINEL DE EXPORTAÇÃO DE ARTEFATOS FORENSES */}
      <div style={{ marginTop: '20px', border: '1px solid #0284c7', borderRadius: '8px', padding: '16px', backgroundColor: '#0f172a' }}>
        <h3 style={{ color: '#38bdf8', marginTop: 0, fontSize: '14px' }}>📦 Exportar Artefato Forense Imutável (`trace-*.json`)</h3>
        <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '12px' }}>
          Gera o arquivo JSON completo com checksum SHA-256 e todos os eventos correlacionados da sessão para o protocolo congelado.
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={async () => {
              const { forensicCollector } = await import('@/infrastructure/telemetry/forensic-collector');
              const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) || /iPhone|iPad|iPod/i.test(navigator.userAgent);
              const envName = isSafari ? 'Safari' : 'Chrome';
              const artifact = await forensicCollector.generateArtifact(envName);
              const defaultName = isSafari ? 'trace-safari-01.json' : 'trace-chrome-01.json';
              const filename = prompt('Nome do arquivo de trace:', defaultName) || defaultName;
              forensicCollector.downloadArtifactJson(filename, artifact);
            }}
            style={{ padding: '10px 18px', borderRadius: '4px', backgroundColor: '#0284c7', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
          >
            ⬇️ Baixar Artefato `.json` (SHA-256 Checksum)
          </button>
        </div>
      </div>
    </div>
  );
}
