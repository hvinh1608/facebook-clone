'use client';

import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { api } from '../../services/api';
import { Loader2, Plus } from 'lucide-react';

export default function MemoriesPage() {
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');

  useEffect(() => {
    api.get('/discovery/memories').then((res) => {
      if (res.data?.status === 'success') setMemories(res.data.data);
    }).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/discovery/memories', { title });
    setTitle('');
    const res = await api.get('/discovery/memories');
    if (res.data?.status === 'success') setMemories(res.data.data);
  };

  return (
    <Layout>
      <div className="max-w-[680px] mx-auto flex flex-col gap-4">
        <div className="fb-card p-4"><h1 className="text-lg font-bold">Kỷ niệm</h1><p className="text-xs text-slate-500">Những khoảnh khắc đáng nhớ</p></div>
        <form onSubmit={handleCreate} className="fb-card p-4 flex gap-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tiêu đề kỷ niệm" className="flex-1 px-3 py-2 rounded-lg bg-[#f0f2f5] text-sm" required />
          <button type="submit" className="px-4 py-2 bg-[#1877f2] text-white rounded-lg text-sm font-bold flex items-center gap-1"><Plus className="w-4 h-4" /> Thêm</button>
        </form>
        {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : memories.map((m) => (
          <div key={m.id} className="fb-card p-4">
            <h3 className="font-bold">{m.title}</h3>
            <p className="text-xs text-slate-500 mt-1">{new Date(m.memoryDate).toLocaleDateString('vi-VN')}</p>
            {m.content && <p className="text-sm mt-2">{m.content}</p>}
          </div>
        ))}
      </div>
    </Layout>
  );
}
