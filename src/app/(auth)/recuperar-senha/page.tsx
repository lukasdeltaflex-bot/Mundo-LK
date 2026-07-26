'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Sparkles, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/presentation/context/AuthContext';
import { Button } from '@/presentation/components/ui/Button';

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await resetPassword(email);
      setSubmitted(true);
    } catch {
      setSubmitted(true); // Always display confirmation for user experience
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-8 backdrop-blur shadow-2xl space-y-6">
      {/* Header Logo */}
      <div className="text-center space-y-2">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/20 mb-2">
          <Sparkles className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white">Recuperar Senha</h1>
        <p className="text-xs text-slate-400">Informe seu e-mail para receber as instruções de redefinição</p>
      </div>

      {submitted ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center space-y-3 animate-in fade-in duration-200">
          <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
          <h3 className="text-sm font-bold text-emerald-300">E-mail enviado com sucesso!</h3>
          <p className="text-xs text-slate-300">
            Se o endereço <strong>{email}</strong> estiver cadastrado no Mundo LK, você receberá o link de redefinição de senha em alguns minutos.
          </p>
          <div className="pt-2">
            <Link href="/login">
              <Button variant="outline" size="sm" className="text-xs">
                Voltar para o Login
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">E-mail Cadastrado</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full py-3 text-xs font-bold"
            disabled={loading}
            leftIcon={loading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : undefined}
          >
            {loading ? 'Enviando e-mail...' : 'Enviar Instruções de Recuperação'}
          </Button>
        </form>
      )}

      {/* Back Link */}
      {!submitted && (
        <div className="pt-4 border-t border-slate-800/80 text-center">
          <Link href="/login" className="text-xs font-semibold text-slate-400 hover:text-white inline-flex items-center gap-1 transition">
            <ArrowLeft className="h-3 w-3" /> Lembrante da senha? Fazer Login
          </Link>
        </div>
      )}
    </div>
  );
}
