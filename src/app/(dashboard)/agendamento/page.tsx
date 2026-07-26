'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/presentation/components/ui/Card';
import { Button } from '@/presentation/components/ui/Button';
import { Badge } from '@/presentation/components/ui/Badge';
import { Calendar as CalendarIcon, Clock, Plus, Trash2 } from 'lucide-react';

export default function AgendamentoPage() {
  const [schedules, setSchedules] = useState([
    {
      id: 'sch_1',
      title: 'Promoção Smartphone Xiaomi Redmi Note 13',
      channel: 'WhatsApp',
      date: '2026-07-27',
      time: '11:30',
      status: 'PROGRAMMADO',
    },
    {
      id: 'sch_2',
      title: 'Air Fryer Mondo 4L - Grupo de Ofertas VIP',
      channel: 'Telegram',
      date: '2026-07-27',
      time: '14:00',
      status: 'PROGRAMMADO',
    },
    {
      id: 'sch_3',
      title: 'Fone Bluetooth ANC - Story Reels',
      channel: 'Instagram',
      date: '2026-07-26',
      time: '19:00',
      status: 'PUBLICADO',
    },
  ]);

  const [newTitle, setNewTitle] = useState('');
  const [newChannel, setNewChannel] = useState('WhatsApp');
  const [newDate, setNewDate] = useState('2026-07-28');
  const [newTime, setNewTime] = useState('12:00');

  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const item = {
      id: `sch_${Date.now()}`,
      title: newTitle,
      channel: newChannel,
      date: newDate,
      time: newTime,
      status: 'PROGRAMMADO',
    };

    setSchedules([item, ...schedules]);
    setNewTitle('');
  };

  const handleDelete = (id: string) => {
    setSchedules(schedules.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <CalendarIcon className="h-6 w-6 text-blue-400" />
          <span>Agendamento de Conteúdos & Publicações</span>
        </h1>
        <p className="text-sm text-slate-400">Programe publicações automáticas por data, hora e canal de distribuição.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Schedule Form */}
        <Card className="lg:col-span-1 p-5">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-base">Novo Agendamento</CardTitle>
            <CardDescription className="text-xs">Defina a oferta, canal e horário exato</CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            <form onSubmit={handleAddSchedule} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Título / Oferta</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Oferta Xiaomi Redmi Note 13"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Canal de Destino</label>
                <select
                  value={newChannel}
                  onChange={(e) => setNewChannel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Telegram">Telegram</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Threads">Threads</option>
                  <option value="Pinterest">Pinterest</option>
                  <option value="TikTok">TikTok</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Data</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Horário</label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <Button type="submit" variant="primary" className="w-full py-2.5 text-xs font-bold" leftIcon={<Plus className="h-3.5 w-3.5" />}>
                Programar Publicação
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Scheduled Items List */}
        <Card className="lg:col-span-2 p-5">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-base">Conteúdos Agendados</CardTitle>
            <CardDescription className="text-xs">Lista de postagens programadas na fila</CardDescription>
          </CardHeader>

          <CardContent className="p-0 space-y-3">
            {schedules.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-white">{s.title}</h4>
                    <Badge variant="info" className="text-[10px]">{s.channel}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                    <Clock className="h-3 w-3 text-blue-400" />
                    <span>{s.date} às {s.time}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {s.status === 'PUBLICADO' ? <Badge variant="success">Publicado</Badge> : <Badge variant="warning">Programado</Badge>}
                  <button onClick={() => handleDelete(s.id)} className="text-slate-500 hover:text-red-400 transition">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
