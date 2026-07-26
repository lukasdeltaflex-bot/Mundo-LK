'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/presentation/context/AuthContext';
import { Button } from '@/presentation/components/ui/Button';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Por favor, preencha o e-mail e a senha.');
      return;
    }
    setErrorMsg(null);
    setLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch {
      setErrorMsg('E-mail ou senha incorretos. Verifique suas credenciais.');
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
        <h1 className="text-2xl font-extrabold tracking-tight text-white">Mundo LK</h1>
        <p className="text-xs text-slate-400">Gestão Inteligente de Ofertas para Afiliados</p>
      </div>

      {/* Error Feedback */}
      {errorMsg && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-400 animate-in fade-in duration-200">
          {errorMsg}
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleLogin} className="space-y-4">
        {/* Email Field */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">E-mail</label>
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

        {/* Password Field */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Senha</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-0"
            />
            <span className="text-xs text-slate-400">Lembrar-me</span>
          </label>

          <Link href="/recuperar-senha" className="text-xs text-blue-400 hover:text-blue-300 transition">
            Esqueceu sua senha?
          </Link>
        </div>

        {/* Enter Button */}
        <Button
          type="submit"
          variant="primary"
          className="w-full py-3 text-xs font-bold"
          disabled={loading}
          leftIcon={loading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : undefined}
        >
          {loading ? 'Autenticando...' : 'Entrar no Mundo LK'}
        </Button>
      </form>

      {/* Register Link */}
      <div className="pt-4 border-t border-slate-800/80 text-center">
        <p className="text-xs text-slate-400">
          Ainda não possui uma conta?{' '}
          <Link href="/cadastro" className="font-bold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 transition">
            Cadastrar-se <ArrowRight className="h-3 w-3" />
          </Link>
        </p>
      </div>
    </div>
  );
}
