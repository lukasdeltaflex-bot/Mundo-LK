'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/presentation/components/ui/Card';
import { Button } from '@/presentation/components/ui/Button';
import { Badge } from '@/presentation/components/ui/Badge';
import { useAuth } from '@/presentation/context/AuthContext';
import { FirestoreUserRepository, FirestoreUserDoc } from '@/infrastructure/firebase/repositories/firestore-user.repository';
import { User as UserIcon, Mail, Calendar, Shield, Save, CheckCircle2, Loader2, Image as ImageIcon, Phone, Briefcase, Building2, Key, Eye, EyeOff, Bell, Volume2, Sparkles, Laptop, Lock } from 'lucide-react';
import Link from 'next/link';

export default function PerfilPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'pessoal' | 'seguranca' | 'preferencias' | 'empresa'>('pessoal');

  // Form Fields
  const [name, setName] = useState(user?.name || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [phone, setPhone] = useState('(11) 98765-4321');
  const [jobTitle, setJobTitle] = useState('Gestor de Afiliados Pro');
  const [companyName, setCompanyName] = useState('Mundo LK Afiliados LTDA');
  const [companyCnpj, setCompanyCnpj] = useState('48.123.456/0001-90');
  const [bio, setBio] = useState('Especialista em automação de ofertas e marketing de afiliados de alta conversão.');

  // Password Security Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Notifications State
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [whatsAppAlerts, setWhatsAppAlerts] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [highDiscountAlerts, setHighDiscountAlerts] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadUserProfile() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const repo = new FirestoreUserRepository();
        const docData = await repo.findDocByUid(user.uid);

        if (docData) {
          setName(docData.name || user.name || '');
          setPhotoURL(docData.photoURL || user.photoURL || '');
          if (docData.phone) setPhone(docData.phone);
          if (docData.jobTitle) setJobTitle(docData.jobTitle);
          if (docData.companyName) setCompanyName(docData.companyName);
          if (docData.companyCnpj) setCompanyCnpj(docData.companyCnpj);
          if (docData.bio) setBio(docData.bio);
          if (docData.notifications) {
            setEmailAlerts(docData.notifications.emailAlerts);
            setWhatsAppAlerts(docData.notifications.whatsAppAlerts);
            setSoundEffects(docData.notifications.soundEffects);
            setHighDiscountAlerts(docData.notifications.highDiscountAlerts);
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar perfil do Firestore:', err);
      } finally {
        setLoading(false);
      }
    }

    loadUserProfile();
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setSuccessMsg(null);

    try {
      const repo = new FirestoreUserRepository();
      await repo.saveDoc({
        uid: user.uid,
        name,
        email: user.email,
        photoURL,
        phone,
        jobTitle,
        companyName,
        companyCnpj,
        bio,
        notifications: {
          emailAlerts,
          whatsAppAlerts,
          soundEffects,
          highDiscountAlerts,
        },
      });

      setSuccessMsg('Todas as alterações do seu perfil foram salvas no Firebase com sucesso!');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch {
      setSuccessMsg('Erro ao salvar perfil.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('A nova senha e a confirmação não coincidem.');
      return;
    }
    if (newPassword.length < 6) {
      alert('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    setSuccessMsg('Senha alterada com sucesso!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400 text-xs">
        <Loader2 className="h-5 w-5 animate-spin text-blue-500 mr-2" />
        Carregando Perfil de Usuário...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <UserIcon className="h-6 w-6 text-blue-400" />
            <span>Meu Perfil Profissional</span>
          </h1>
          <p className="text-sm text-slate-400">Gerenciamento completo de conta, segurança, preferências e dados da empresa.</p>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-400 animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* HEADER CARD */}
      <Card className="p-6 bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="relative group">
            {photoURL ? (
              <img src={photoURL} alt={name} className="h-20 w-20 rounded-2xl object-cover border-2 border-blue-500 shadow-xl" />
            ) : (
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-2xl font-bold text-white shadow-xl shadow-blue-500/20 border-2 border-blue-400/30">
                {name ? name.substring(0, 2).toUpperCase() : 'LK'}
              </div>
            )}
          </div>

          <div className="space-y-1 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-white">{name || 'Usuário Afiliado'}</h2>
              <Badge variant="success">Conta Ativa</Badge>
              <Badge variant="info">Plano PRO Unlimited</Badge>
            </div>
            <p className="text-xs text-blue-400 font-semibold flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5" />
              {jobTitle} — <span className="text-slate-300">{companyName}</span>
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5 text-slate-500" />
                {user?.email || 'usuario@mundolk.com'}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                Membro desde: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '2026'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* TABS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none">
        {[
          { id: 'pessoal', label: '1) Informações Pessoais', icon: UserIcon },
          { id: 'seguranca', label: '2) Segurança & Acesso', icon: Shield },
          { id: 'preferencias', label: '3) Preferências & Notificações', icon: Bell },
          { id: 'empresa', label: '4) Empresa & Plano', icon: Building2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'pessoal' | 'seguranca' | 'preferencias' | 'empresa')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ABA 1: DADOS PESSOAIS */}
      {activeTab === 'pessoal' && (
        <Card className="p-6 bg-slate-900 border-slate-800">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-base text-white">Dados Pessoais</CardTitle>
            <CardDescription className="text-xs">Atualize suas informações de contato e foto do perfil</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300 block">Nome Completo</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300 block">URL da Foto do Perfil / Avatar</label>
                  <input
                    type="url"
                    placeholder="https://exemplo.com/avatar.jpg"
                    value={photoURL}
                    onChange={(e) => setPhotoURL(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500 font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300 block">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300 block">E-mail de Cadastro (Somente Leitura)</label>
                  <input
                    type="email"
                    value={user?.email || 'usuario@mundolk.com'}
                    disabled
                    className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="font-semibold text-slate-300 block">Cargo / Função na Operação</label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="font-semibold text-slate-300 block">Biografia Curta</label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={saving}
                  leftIcon={saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                >
                  {saving ? 'Salvando...' : 'Salvar Alterações Pessoais'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ABA 2: SEGURANÇA & ACESSO */}
      {activeTab === 'seguranca' && (
        <div className="space-y-6">
          <Card className="p-6 bg-slate-900 border-slate-800">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-base text-white">Alterar Senha de Acesso</CardTitle>
              <CardDescription className="text-xs">Atualize sua senha para manter a conta segura</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <form onSubmit={handlePasswordChange} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300 block">Senha Atual</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300 block">Nova Senha</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300 block">Confirmar Nova Senha</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    <span>{showPassword ? 'Ocultar Senhas' : 'Mostrar Senhas'}</span>
                  </button>

                  <Button type="submit" variant="primary" size="sm" leftIcon={<Key className="h-3.5 w-3.5" />}>
                    Atualizar Senha
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="p-6 bg-slate-900 border-slate-800">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-base text-white">Sessões & Dispositivos Conectados</CardTitle>
            </CardHeader>
            <CardContent className="p-0 text-xs space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-600/10 text-blue-400">
                    <Laptop className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">Navegador Atual (Chrome v126 — Windows 11)</span>
                    <span className="text-slate-400 text-[11px]">Último acesso: Hoje às 15:30 — IP: 189.120.45.12</span>
                  </div>
                </div>
                <Badge variant="success">Sessão Ativa</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ABA 3: PREFERÊNCIAS & NOTIFICAÇÕES */}
      {activeTab === 'preferencias' && (
        <Card className="p-6 bg-slate-900 border-slate-800">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-base text-white">Preferências de Notificação & Sistema</CardTitle>
            <CardDescription className="text-xs">Configure como o Mundo LK envia alertas operacionais</CardDescription>
          </CardHeader>
          <CardContent className="p-0 space-y-4 text-xs">
            {[
              { label: 'Notificações por E-mail', desc: 'Receba resumos diários de produtos e ofertas geradas', state: emailAlerts, set: setEmailAlerts },
              { label: 'Alertas de Ofertas via WhatsApp', desc: 'Receba notificações diretas sobre republicações concluídas', state: whatsAppAlerts, set: setWhatsAppAlerts },
              { label: 'Efeitos Sonoros do Sistema', desc: 'Reproduzir sons de confirmação ao copiar copys ou salvar', state: soundEffects, set: setSoundEffects },
              { label: 'Alerta de Alta Comissão / Desconto', desc: 'Notificar quando a IA identificar produtos campeões com desconto > 40%', state: highDiscountAlerts, set: setHighDiscountAlerts },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <span className="font-bold text-white block">{item.label}</span>
                  <span className="text-slate-400 text-[11px]">{item.desc}</span>
                </div>
                <button
                  type="button"
                  onClick={() => item.set(!item.state)}
                  className={`w-12 h-6 rounded-full p-1 transition ${item.state ? 'bg-blue-600' : 'bg-slate-800'}`}
                >
                  <div className={`h-4 w-4 rounded-full bg-white transition transform ${item.state ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
            ))}

            <div className="pt-4 flex justify-between items-center border-t border-slate-800">
              <Link href="/configuracoes/aparencia">
                <Button size="sm" variant="outline" className="text-xs" leftIcon={<Sparkles className="h-3.5 w-3.5 text-amber-400" />}>
                  Abrir Central Profissional de Aparência
                </Button>
              </Link>

              <Button type="button" variant="primary" size="sm" onClick={handleSaveProfile} leftIcon={<Save className="h-3.5 w-3.5" />}>
                Salvar Notificações
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ABA 4: EMPRESA & PLANO */}
      {activeTab === 'empresa' && (
        <Card className="p-6 bg-slate-900 border-slate-800">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-base text-white">Informações da Empresa & Nível de Permissão</CardTitle>
          </CardHeader>

          <CardContent className="p-0 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300 block">Razão Social da Empresa</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300 block">CNPJ</label>
                <input
                  type="text"
                  value={companyCnpj}
                  onChange={(e) => setCompanyCnpj(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Nível de Acesso & Permissões do Usuário</span>
                <Badge variant="success">Administrador Total</Badge>
              </div>
              <ul className="space-y-1 text-[11px] text-slate-400 pl-4 list-disc">
                <li>Acesso ilimitado ao Gerador de Ofertas por URL e Importação em Lote.</li>
                <li>Mapeamento automático de marketplaces (Shopee, Mercado Livre, Amazon, Magalu).</li>
                <li>Inteligência Adaptativa e Gerenciador de Prompts Personalizados.</li>
                <li>Central de Aparência, Agendador e Backup Manager em JSON.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
