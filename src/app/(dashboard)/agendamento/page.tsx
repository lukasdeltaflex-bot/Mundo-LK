'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/presentation/components/ui/Card';
import { Button } from '@/presentation/components/ui/Button';
import { Badge } from '@/presentation/components/ui/Badge';
import { Calendar as CalendarIcon, Clock, Plus, Trash2, CheckCircle2, Loader2, Send } from 'lucide-react';
import { useAuth } from '@/presentation/context/AuthContext';
import { doc, setDoc, deleteDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/infrastructure/firebase/config/firebase.config';

export interface UISchedule {
  id: string;
  userId: string;
  title: string;
  channel: string;
  date: string;
  time: string;
  status: 'PROGRAMMADO' | 'PUBLICADO' | 'CANCELADO';
  createdAt: string;
}

export default function AgendamentoPage() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<UISchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newChannel, setNewChannel] = useState('WhatsApp');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('12:00');

  useEffect(() => {
    async function loadSchedules() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const q = query(collection(db, 'schedules'), where('userId', '==', user.uid));
        const snap = await getDocs(q);
        const list: UISchedule[] = snap.docs.map((d) => d.data() as UISchedule);
        setSchedules(list);
      } catch (err) {
        console.warn('Erro ao carregar agendamentos:', err);
      } finally {
        setLoading(false);
      }
    }

    loadSchedules();
  }, [user]);

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setSaving(true);
    const id = `sch_${Date.now()}`;
    const uid = user?.uid || 'guest';

    const item: UISchedule = {
      id,
      userId: uid,
      title: newTitle.trim(),
      channel: newChannel,
      date: newDate,
      time: newTime,
      status: 'PROGRAMMADO',
      createdAt: new Date().toISOString(),
    };

    setSchedules([item, ...schedules]);
    setNewTitle('');

    try {
      if (user) {
        await setDoc(doc(db, 'schedules', id), item);
      }
      setSuccessMsg('Agendamento salvo com sucesso no Firebase!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Erro ao salvar agendamento:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSchedules(schedules.filter((s) => s.id !== id));

    try {
      if (user) {
        await deleteDoc(doc(db, 'schedules', id));
      }
      setSuccessMsg('Agendamento removido com sucesso.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Erro ao excluir agendamento:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-blue-400" />
            <span>Agendamento de Publicações</span>
          </h1>
          <p className="text-sm text-slate-400">Programe disparos automáticos para WhatsApp, Telegram, Instagram e Redes Sociais.</p>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-400 animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Formulário Novo Agendamento */}
      <Card className="p-6 bg-slate-900 border-slate-800">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-base text-white">Criar Novo Agendamento</CardTitle>
          <CardDescription className="text-xs">Defina o produto/oferta, o canal e a data/hora exata do disparo</CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <form onSubmit={handleAddSchedule} className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="md:col-span-2 space-y-1">
              <label className="font-semibold text-slate-300 block">Título / Oferta</label>
              <input
                type="text"
                placeholder="Ex: Smartphone Xiaomi Note 13 com 30% OFF"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300 block">Canal de Destino</label>
              <select
                value={newChannel}
                onChange={(e) => setNewChannel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="WhatsApp">WhatsApp</option>
                <option value="Telegram">Telegram</option>
                <option value="Instagram">Instagram</option>
                <option value="Facebook">Facebook</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300 block">Data & Hora</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white"
                />
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-24 bg-slate-950 border border-slate-800 rounded-xl p-2 text-white"
                />
              </div>
            </div>

            <div className="md:col-span-4 flex justify-end pt-2">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={saving}
                leftIcon={saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              >
                {saving ? 'Agendando...' : 'Confirmar Agendamento'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Lista de Agendamentos Reais */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 text-xs">
          <Loader2 className="h-5 w-5 animate-spin text-blue-500 mr-2" />
          Carregando seus agendamentos reais...
        </div>
      ) : schedules.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-slate-800 bg-slate-900/40">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-400 border border-blue-500/20 mx-auto mb-4">
            <CalendarIcon className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Nenhum agendamento programado.</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Preencha o formulário acima para programar o envio automático das suas ofertas.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {schedules.map((s) => (
            <Card key={s.id} className="p-4 border-slate-800 bg-slate-900/90">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="info">{s.channel}</Badge>
                    <Badge variant={s.status === 'PUBLICADO' ? 'success' : 'warning'}>{s.status}</Badge>
                  </div>
                  <h4 className="font-bold text-sm text-white">{s.title}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="h-3.5 w-3.5 text-blue-400" />
                      {s.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-emerald-400" />
                      {s.time}
                    </span>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="danger"
                  className="text-xs p-2"
                  title="Cancelar Agendamento"
                  onClick={() => handleDelete(s.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
