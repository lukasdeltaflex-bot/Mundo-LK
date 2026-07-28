'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/presentation/components/ui/Card';
import { Button } from '@/presentation/components/ui/Button';
import { Badge } from '@/presentation/components/ui/Badge';
import { MarketplaceBadge } from '@/presentation/components/business/MarketplaceBadge';
import {
  Calendar as CalendarIcon, Clock, Plus, Trash2, CheckCircle2, Loader2, Send,
  ChevronLeft, ChevronRight, Filter, Eye, Image as ImageIcon, Sparkles, TrendingUp,
  Radio, X, Info, Layers
} from 'lucide-react';
import { useAuth } from '@/presentation/context/AuthContext';
import { doc, setDoc, deleteDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/infrastructure/firebase/config/firebase.config';
import { FirestoreProductRepository } from '@/infrastructure/firebase/repositories/firestore-product.repository';
import { Product, DispatchRecord } from '@/core/domain/entities/product.entity';

// ─── Domain Types ────────────────────────────────────────────────────────────

export interface CalendarEvent {
  id: string;
  type: 'DISPATCH' | 'SCHEDULED';
  productId?: string;
  title: string;
  marketplaceSlug?: string;
  imageUrl?: string;
  channel: string;
  targetGroup?: string;
  dateStr: string; // YYYY-MM-DD
  timeStr: string; // HH:MM
  sentBy?: string;
  notes?: string;
  status: 'PUBLICADO' | 'PROGRAMMADO';
}

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

type CalendarViewMode = 'month' | 'week' | 'day';

// ─── Image Fallback Helper ────────────────────────────────────────────────────

function EventImageThumbnail({ src, title }: { src?: string; title: string }) {
  const [imgError, setImgError] = useState(false);
  return (
    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center">
      {src && !imgError ? (
        <img src={src} alt={title} onError={() => setImgError(true)} className="h-full w-full object-cover" />
      ) : (
        <ImageIcon className="h-4 w-4 text-slate-600" />
      )}
    </div>
  );
}

// ─── Calendar Density Heatmap Badge ──────────────────────────────────────────

function DayDensityBadge({ count }: { count: number }) {
  if (count === 0) return null;
  if (count <= 3) {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
        🟢 {count} {count === 1 ? 'envio' : 'envios'}
      </span>
    );
  }
  if (count <= 8) {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
        🟡 {count} envios
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
      🔴 {count} envios (Alta)
    </span>
  );
}

export default function AgendamentoPage() {
  const { user } = useAuth();
  
  // Data State
  const [schedules, setSchedules] = useState<UISchedule[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Calendar Controls State
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayEvents, setSelectedDayEvents] = useState<{ dateStr: string; events: CalendarEvent[] } | null>(null);

  // Filters State
  const [filterMarketplace, setFilterMarketplace] = useState<string>('TODOS');
  const [filterChannel, setFilterChannel] = useState<string>('TODOS');

  // Form State for Manual Schedule Creation
  const [newTitle, setNewTitle] = useState('');
  const [newChannel, setNewChannel] = useState('WhatsApp');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('12:00');

  // Load Real Data (Products + Schedules)
  const loadCalendarData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      // 1. Fetch Programmed Schedules
      const q = query(collection(db, 'schedules'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      const schedList: UISchedule[] = snap.docs.map((d) => d.data() as UISchedule);
      setSchedules(schedList);

      // 2. Fetch Products with Dispatch History
      const repo = new FirestoreProductRepository();
      const prodList = await repo.findAll(user.uid);
      setProducts(prodList);
    } catch (err) {
      console.warn('Erro ao carregar dados do calendário:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendarData();
  }, [user]);

  // Combine Dispatches + Scheduled Items into Calendar Events
  const allEvents = useMemo<CalendarEvent[]>(() => {
    const events: CalendarEvent[] = [];

    // 1. Map Programmed Schedules
    for (const s of schedules) {
      events.push({
        id: s.id,
        type: 'SCHEDULED',
        title: s.title,
        channel: s.channel,
        dateStr: s.date,
        timeStr: s.time,
        status: s.status === 'PUBLICADO' ? 'PUBLICADO' : 'PROGRAMMADO',
      });
    }

    // 2. Map Real Dispatches recorded on Products
    for (const p of products) {
      if (p.dispatchHistory && p.dispatchHistory.length > 0) {
        for (const dh of p.dispatchHistory) {
          const dObj = new Date(dh.dispatchedAt);
          const dateStr = dObj.toISOString().split('T')[0];
          const timeStr = dObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

          events.push({
            id: dh.id,
            type: 'DISPATCH',
            productId: p.id,
            title: p.title,
            marketplaceSlug: p.marketplaceSlug,
            imageUrl: p.images && p.images.length > 0 ? p.images[0] : undefined,
            channel: dh.channel,
            targetGroup: dh.targetGroup,
            dateStr,
            timeStr,
            sentBy: dh.sentBy,
            notes: dh.notes,
            status: 'PUBLICADO',
          });
        }
      }
    }

    return events;
  }, [schedules, products]);

  // Apply Quick Filters
  const filteredEvents = useMemo(() => {
    return allEvents.filter((evt) => {
      if (filterMarketplace !== 'TODOS' && evt.marketplaceSlug !== filterMarketplace) {
        return false;
      }
      if (filterChannel !== 'TODOS' && !evt.channel.toLowerCase().includes(filterChannel.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [allEvents, filterMarketplace, filterChannel]);

  // Map Events by Date (YYYY-MM-DD)
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const evt of filteredEvents) {
      const list = map.get(evt.dateStr) || [];
      list.push(evt);
      map.set(evt.dateStr, list);
    }
    return map;
  }, [filteredEvents]);

  // Calendar Month Calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun

  const daysGrid = useMemo(() => {
    const grid: Array<{ dayNum: number; dateStr: string; isCurrentMonth: boolean }> = [];
    // Padding days from previous month
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevDate = new Date(year, month - 1, d);
      grid.push({
        dayNum: d,
        dateStr: prevDate.toISOString().split('T')[0],
        isCurrentMonth: false,
      });
    }

    // Days of current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      // Adjust timezone offset format
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      grid.push({
        dayNum: d,
        dateStr: `${yyyy}-${mm}-${dd}`,
        isCurrentMonth: true,
      });
    }

    // Remaining padding days for next month
    const totalCells = Math.ceil(grid.length / 7) * 7;
    const remaining = totalCells - grid.length;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      grid.push({
        dayNum: d,
        dateStr: nextDate.toISOString().split('T')[0],
        isCurrentMonth: false,
      });
    }

    return grid;
  }, [year, month, daysInMonth, firstDayOfWeek]);

  // Summary Statistics calculation
  const calendarStats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayCount = (eventsByDate.get(todayStr) || []).length;

    // Week calculation
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    let weekCount = 0;
    let monthCount = 0;

    eventsByDate.forEach((evts, dateKey) => {
      const dObj = new Date(dateKey);
      if (dObj >= startOfWeek && dObj <= endOfWeek) {
        weekCount += evts.length;
      }
      if (dObj.getMonth() === month && dObj.getFullYear() === year) {
        monthCount += evts.length;
      }
    });

    const avgDaily = (monthCount / daysInMonth).toFixed(1);

    return {
      todayCount,
      weekCount,
      monthCount,
      avgDaily,
    };
  }, [eventsByDate, month, year, daysInMonth]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

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
      setSuccessMsg('Novo agendamento salvo no Firebase!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Erro ao salvar agendamento:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    setSchedules(schedules.filter((s) => s.id !== id));
    try {
      if (user) {
        await deleteDoc(doc(db, 'schedules', id));
      }
      setSuccessMsg('Agendamento removido.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Erro ao excluir agendamento:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <span>Calendário Inteligente de Divulgação</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Controle total de envios realizados, ofertas programadas e densidade de disparos diários.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/produtos">
            <Button size="sm" variant="secondary" className="text-xs" leftIcon={<Send className="h-3.5 w-3.5" />}>
              Central de Produtos
            </Button>
          </Link>
        </div>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-400 animate-in fade-in duration-200 shadow-lg shadow-emerald-950/20">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ── Summary Statistics KPI Panel ─────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 flex flex-col justify-between shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400">🔥 Envios Hoje</span>
          <div className="text-2xl font-extrabold text-blue-400 mt-1">{calendarStats.todayCount}</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 flex flex-col justify-between shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400">📅 Envios na Semana</span>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">{calendarStats.weekCount}</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 flex flex-col justify-between shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400">📊 Envios no Mês</span>
          <div className="text-2xl font-extrabold text-purple-400 mt-1">{calendarStats.monthCount}</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 flex flex-col justify-between shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400">📈 Média Diária</span>
          <div className="text-2xl font-extrabold text-amber-400 mt-1">{calendarStats.avgDaily} / dia</div>
        </div>
      </div>

      {/* ── Calendar Controls & Filters Bar ───────────────────────────────── */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800/80 shadow-md">
        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handlePrevMonth} className="h-8 w-8 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="text-sm font-extrabold text-white capitalize px-2 min-w-[140px] text-center">
            {monthName}
          </span>

          <Button size="sm" variant="outline" onClick={handleNextMonth} className="h-8 w-8 p-0">
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button size="sm" variant="secondary" onClick={handleToday} className="text-xs h-8">
            Hoje
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Marketplace Filter */}
          <select
            value={filterMarketplace}
            onChange={(e) => setFilterMarketplace(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="TODOS">Todos os Marketplaces</option>
            <option value="shopee">Shopee</option>
            <option value="mercadolivre">Mercado Livre</option>
            <option value="amazon">Amazon</option>
            <option value="magalu">Magalu</option>
          </select>

          {/* Channel Filter */}
          <select
            value={filterChannel}
            onChange={(e) => setFilterChannel(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="TODOS">Todos os Canais</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Telegram">Telegram</option>
            <option value="Instagram">Instagram</option>
            <option value="Facebook">Facebook</option>
          </select>
        </div>
      </div>

      {/* ── Interactive Grid Calendar (Month View) ─────────────────────────── */}
      <Card className="p-4 bg-slate-900/90 border-slate-800/80 rounded-2xl shadow-xl">
        {/* Days of the Week Header */}
        <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-400 border-b border-slate-800/80 pb-3 mb-2">
          <span>Dom</span>
          <span>Seg</span>
          <span>Ter</span>
          <span>Qua</span>
          <span>Qui</span>
          <span>Sex</span>
          <span>Sáb</span>
        </div>

        {/* Days Cells Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {daysGrid.map((cell, idx) => {
            const evts = eventsByDate.get(cell.dateStr) || [];
            const count = evts.length;
            const isToday = cell.dateStr === new Date().toISOString().split('T')[0];

            return (
              <div
                key={idx}
                onClick={() => setSelectedDayEvents({ dateStr: cell.dateStr, events: evts })}
                className={`min-h-[90px] p-2 rounded-xl border flex flex-col justify-between cursor-pointer transition duration-150 ${
                  isToday
                    ? 'border-blue-500/80 bg-blue-950/20 shadow-md shadow-blue-500/10'
                    : cell.isCurrentMonth
                    ? 'border-slate-800/90 bg-slate-950/50 hover:bg-slate-800/60 hover:border-slate-700'
                    : 'border-slate-900/40 bg-slate-950/20 opacity-40 hover:opacity-70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold ${
                      isToday
                        ? 'flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white'
                        : cell.isCurrentMonth
                        ? 'text-slate-300'
                        : 'text-slate-600'
                    }`}
                  >
                    {cell.dayNum}
                  </span>

                  <DayDensityBadge count={count} />
                </div>

                {/* Event Previews (Up to 2 events) */}
                <div className="space-y-1 mt-1">
                  {evts.slice(0, 2).map((ev) => (
                    <div
                      key={ev.id}
                      className="truncate text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300"
                    >
                      <span className="text-blue-400">{ev.timeStr}</span> {ev.title}
                    </div>
                  ))}
                  {evts.length > 2 && (
                    <div className="text-[9px] font-bold text-slate-500 text-right pr-1">
                      +{evts.length - 2} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── Modal Detalhes das Ofertas do Dia Selecionado ────────────────────── */}
      {selectedDayEvents && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl p-6 bg-slate-900 border-slate-800 animate-in fade-in zoom-in-95 duration-150 rounded-2xl shadow-2xl">
            <CardHeader className="p-0 mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20">
                    <CalendarIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base text-white">
                      Divulgações de {new Date(selectedDayEvents.dateStr + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                      Total de {selectedDayEvents.events.length} oferta(s) registrada(s) neste dia.
                    </CardDescription>
                  </div>
                </div>
                <button onClick={() => setSelectedDayEvents(null)} className="text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-0 space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {selectedDayEvents.events.length === 0 ? (
                <div className="text-center py-10 text-slate-400 space-y-2">
                  <Info className="h-8 w-8 mx-auto text-slate-600" />
                  <p className="text-xs">Nenhum disparo ou agendamento registrado para esta data.</p>
                </div>
              ) : (
                selectedDayEvents.events.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <EventImageThumbnail src={ev.imageUrl} title={ev.title} />

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {ev.marketplaceSlug && <MarketplaceBadge marketplaceSlug={ev.marketplaceSlug} />}
                          <Badge variant="info" className="text-[10px]">{ev.channel}</Badge>
                          <Badge variant={ev.status === 'PUBLICADO' ? 'success' : 'warning'} className="text-[10px]">
                            {ev.status}
                          </Badge>
                        </div>
                        <h4 className="font-bold text-xs text-white max-w-md line-clamp-1">{ev.title}</h4>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                          <span className="text-blue-400 font-mono">⏰ {ev.timeStr}</span>
                          {ev.targetGroup && <span>• {ev.targetGroup}</span>}
                          {ev.sentBy && <span>• Por: {ev.sentBy}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}

              <div className="flex justify-end pt-3 border-t border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setSelectedDayEvents(null)}>
                  Fechar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Formulário Novo Agendamento Programado ──────────────────────────── */}
      <Card className="p-6 bg-slate-900/90 border-slate-800/80 rounded-2xl shadow-lg">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-400" />
            <span>Programar Disparo Futuro</span>
          </CardTitle>
          <CardDescription className="text-xs">Defina a oferta, o canal e a data/hora exata do disparo programado</CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <form onSubmit={handleAddSchedule} className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="md:col-span-2 space-y-1">
              <label className="font-semibold text-slate-300 block">Título / Nome da Oferta</label>
              <input
                type="text"
                placeholder="Ex: Fone Bluetooth Xiaomi Redmi Airdots 3"
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
                <option value="WhatsApp">WhatsApp Promoções</option>
                <option value="Telegram">Telegram VIP</option>
                <option value="Instagram">Instagram Stories</option>
                <option value="Facebook">Facebook Grupos</option>
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
                {saving ? 'Agendando...' : 'Confirmar Agendamento Programado'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
