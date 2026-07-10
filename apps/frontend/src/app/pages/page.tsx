'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { api } from '../../services/api';
import { Loader2, Plus } from 'lucide-react';

export default function PagesListPage() {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [showForm, setShowForm] = useState(false);

  const fetchPages = async () => {
    try {
      const res = await api.get('/discovery/pages');
      if (res.data?.status === 'success') setPages(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPages(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/discovery/pages', { name });
    setName('');
    setShowForm(false);
    fetchPages();
  };

  return (
    <Layout>
      <div className="max-w-[680px] mx-auto flex flex-col gap-4">
        <div className="fb-card p-4 flex items-center justify-between">
          <h1 className="text-lg font-bold">Trang</h1>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 px-3 py-1.5 bg-[#1877f2] text-white rounded-lg text-sm font-semibold">
            <Plus className="w-4 h-4" /> Tạo trang
          </button>
        </div>
        {showForm && (
          <form onSubmit={handleCreate} className="fb-card p-4 flex gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên trang" className="flex-1 px-3 py-2 rounded-lg bg-[#f0f2f5] text-sm" required />
            <button type="submit" className="px-4 py-2 bg-[#1877f2] text-white rounded-lg text-sm font-bold">Tạo</button>
          </form>
        )}
        {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#1877f2]" /> : pages.length === 0 ? (
          <p className="text-center text-sm text-slate-500 py-8">Chưa có trang nào.</p>
        ) : pages.map((p) => (
          <Link key={p.id} href={`/pages/${p.id}`} className="fb-card p-4 hover:bg-[var(--hover-bg)] transition-colors block">
            <h3 className="font-bold">{p.name}</h3>
            <p className="text-xs text-slate-500 mt-1">{p.description || 'Không có mô tả'}</p>
            <p className="text-[10px] text-slate-400 mt-2">{p._count?.followers || 0} người theo dõi</p>
          </Link>
        ))}
      </div>
    </Layout>
  );
}
