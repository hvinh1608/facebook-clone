'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { api } from '../../services/api';
import { Loader2, Plus, Calendar } from 'lucide-react';

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', location: '', startAt: '' });

  const fetchEvents = async () => {
    try {
      const res = await api.get('/discovery/events');
      if (res.data?.status === 'success') setEvents(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/discovery/events', form);
    setShowForm(false);
    setForm({ title: '', location: '', startAt: '' });
    fetchEvents();
  };

  return (
    <Layout>
      <div className="max-w-[680px] mx-auto flex flex-col gap-4">
        <div className="fb-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-2"><Calendar className="w-5 h-5 text-[#1877f2]" /><h1 className="text-lg font-bold">Sự kiện</h1></div>
          <button onClick={() => setShowForm(!showForm)} className="px-3 py-1.5 bg-[#1877f2] text-white rounded-lg text-sm font-semibold flex items-center gap-1"><Plus className="w-4 h-4" /> Tạo</button>
        </div>
        {showForm && (
          <form onSubmit={handleCreate} className="fb-card p-4 flex flex-col gap-2">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Tên sự kiện" className="px-3 py-2 rounded-lg bg-[#f0f2f5] text-sm" required />
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Địa điểm" className="px-3 py-2 rounded-lg bg-[#f0f2f5] text-sm" />
            <input type="datetime-local" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} className="px-3 py-2 rounded-lg bg-[#f0f2f5] text-sm" required />
            <button type="submit" className="py-2 bg-[#1877f2] text-white rounded-lg font-bold text-sm">Tạo sự kiện</button>
          </form>
        )}
        {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : events.map((ev) => (
          <Link key={ev.id} href={`/events/${ev.id}`} className="fb-card p-4 flex justify-between items-start hover:bg-[var(--hover-bg)] transition-colors">
            <div>
              <h3 className="font-bold">{ev.title}</h3>
              <p className="text-xs text-slate-500">{ev.location}</p>
              <p className="text-xs text-[#1877f2] mt-1">{new Date(ev.startAt).toLocaleString('vi-VN')}</p>
            </div>
            <span className="text-xs px-3 py-1 bg-[#e7f3ff] text-[#1877f2] rounded-lg font-semibold">Xem chi tiết</span>
          </Link>
        ))}
      </div>
    </Layout>
  );
}
