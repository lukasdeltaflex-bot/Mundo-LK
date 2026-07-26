'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/presentation/components/ui/Card';
import { Button } from '@/presentation/components/ui/Button';
import { Badge } from '@/presentation/components/ui/Badge';
import { useAuth } from '@/presentation/context/AuthContext';
import { FirestoreUserRepository } from '@/infrastructure/firebase/repositories/firestore-user.repository';
import { User as UserIcon, Mail, Calendar, Shield, Save, CheckCircle2, Loader2, Image as ImageIcon } from 'lucide-react';

export default function PerfilPage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setSuccessMsg(null);

    try {
      const repo = new FirestoreUserRepository();
      user.name = name;
      user.photoURL = photoURL;
      await repo.save(user);

      setSuccessMsg('Perfil atualizado com sucesso no Firebase!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      setSuccessMsg('Erro ao salvar alterações no perfil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <UserIcon className="h-6 w-6 text-blue-400" />
          <span>Meu Perfil de Afiliado</span>
        </h1>
        <p className="text-sm text-slate-400">Gerencie seus dados de conta e preferências pessoais.</p>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-400 animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Card */}
        <Card className="md:col-span-1 p-6 text-center">
          <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-blue-500/20 mb-4 overflow-hidden">
            {photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoURL} alt={name} className="h-full w-full object-cover" />
            ) : (
              user?.name?.charAt(0).toUpperCase() || 'U'
            )}
          </div>
          <h2 className="text-lg font-bold text-white">{name || user?.name}</h2>
          <p className="text-xs text-slate-400 mb-3">{user?.email}</p>
          <Badge variant="info" className="text-xs py-1 px-3">
            {user?.role === 'ADMIN' ? 'Administrador' : 'Afiliado Pro'}
          </Badge>
        </Card>

        {/* Edit Form */}
        <Card className="md:col-span-2 p-6">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="text-base">Informações Pessoais</CardTitle>
            <CardDescription className="text-xs">Atualize os dados exibidos no painel</CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Nome Completo</label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Endereço de E-mail (Somente leitura)</label>
                <div className="relative opacity-60">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">URL da Foto de Perfil (Opcional)</label>
                <div className="relative">
                  <ImageIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="url"
                    value={photoURL}
                    onChange={(e) => setPhotoURL(e.target.value)}
                    placeholder="https://exemplo.com/minha-foto.jpg"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800 text-slate-400">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-400" />
                  <span>Membro desde: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '2026'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-400" />
                  <span>Status da Conta: {user?.status || 'Ativo'}</span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full py-2.5 text-xs font-bold"
                  disabled={saving}
                  leftIcon={saving ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Save className="h-4 w-4" />}
                >
                  {saving ? 'Salvando Alterações...' : 'Salvar Alterações do Perfil'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
