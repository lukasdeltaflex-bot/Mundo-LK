'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sparkles, User as UserIcon, Mail, Lock, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/presentation/context/AuthContext';
import { Button } from '@/presentation/components/ui/Button';

const registerSchema = z
  .object({
    name: z.string().min(3, 'O nome deve conter pelo menos 3 caracteres'),
    email: z.string().email('Digite um e-mail válido'),
    password: z.string().min(6, 'A senha deve possuir pelo menos 6 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function CadastroPage() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { register: registerAuth } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema as unknown as Parameters<typeof zodResolver>[0]) as unknown as ReturnType<typeof useForm<RegisterFormData>>['formState']['errors'] extends undefined ? undefined : ReturnType<typeof useForm<RegisterFormData>>['control']['_options']['resolver'],
  });

  const onSubmit = async (data: RegisterFormData) => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await registerAuth(data.name, data.email, data.password);
      router.push('/dashboard');
    } catch {
      setErrorMsg('Falha ao realizar cadastro. Tente outro e-mail.');
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
        <h1 className="text-2xl font-extrabold tracking-tight text-white">Criar Conta no Mundo LK</h1>
        <p className="text-xs text-slate-400">Cadastre-se para automatizar suas ofertas de afiliados</p>
      </div>

      {/* Error Feedback */}
      {errorMsg && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-400">
          {errorMsg}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name Field */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Nome Completo</label>
          <div className="relative">
            <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              {...register('name')}
              type="text"
              placeholder="Seu nome"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>
          {errors.name && <p className="text-[11px] text-red-400">{errors.name.message}</p>}
        </div>

        {/* Email Field */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">E-mail</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              {...register('email')}
              type="email"
              placeholder="seu.email@exemplo.com"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>
          {errors.email && <p className="text-[11px] text-red-400">{errors.email.message}</p>}
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Senha</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              {...register('password')}
              type="password"
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>
          {errors.password && <p className="text-[11px] text-red-400">{errors.password.message}</p>}
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Confirmar Senha</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              {...register('confirmPassword')}
              type="password"
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>
          {errors.confirmPassword && (
            <p className="text-[11px] text-red-400">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          className="w-full py-3 text-xs font-bold"
          disabled={loading}
          leftIcon={loading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : undefined}
        >
          {loading ? 'Cadastrando...' : 'Criar minha conta'}
        </Button>
      </form>

      {/* Back to Login Link */}
      <div className="pt-4 border-t border-slate-800/80 text-center">
        <Link href="/login" className="text-xs font-semibold text-slate-400 hover:text-white inline-flex items-center gap-1 transition">
          <ArrowLeft className="h-3 w-3" /> Já possui uma conta? Entrar
        </Link>
      </div>
    </div>
  );
}
