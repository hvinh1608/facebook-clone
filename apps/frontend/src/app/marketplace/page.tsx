'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { api } from '../../services/api';
import { Loader2, Plus, ShoppingBag } from 'lucide-react';

export default function MarketplacePage() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', price: '', location: '' });

  const fetchListings = async () => {
    const res = await api.get('/discovery/marketplace');
    if (res.data?.status === 'success') setListings(res.data.data);
    setLoading(false);
  };

  useEffect(() => { fetchListings(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/discovery/marketplace', form);
    setShowForm(false);
    fetchListings();
  };

  return (
    <Layout>
      <div className="max-w-[680px] mx-auto flex flex-col gap-4">
        <div className="fb-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-[#1877f2]" /><h1 className="text-lg font-bold">Marketplace</h1></div>
          <button onClick={() => setShowForm(!showForm)} className="px-3 py-1.5 bg-[#1877f2] text-white rounded-lg text-sm font-semibold flex items-center gap-1"><Plus className="w-4 h-4" /> Đăng bán</button>
        </div>
        {showForm && (
          <form onSubmit={handleCreate} className="fb-card p-4 flex flex-col gap-2">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Tên sản phẩm" className="px-3 py-2 rounded-lg bg-[#f0f2f5] text-sm" required />
            <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Giá (VNĐ)" type="number" className="px-3 py-2 rounded-lg bg-[#f0f2f5] text-sm" required />
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Khu vực" className="px-3 py-2 rounded-lg bg-[#f0f2f5] text-sm" />
            <button type="submit" className="py-2 bg-[#1877f2] text-white rounded-lg font-bold text-sm">Đăng tin</button>
          </form>
        )}
        {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : listings.map((item) => (
          <Link key={item.id} href={`/marketplace/${item.id}`} className="fb-card p-4 flex justify-between hover:bg-[var(--hover-bg)] transition-colors">
            <div>
              <h3 className="font-bold">{item.title}</h3>
              <p className="text-sm text-[#1877f2] font-semibold">{Number(item.price).toLocaleString('vi-VN')} đ</p>
              <p className="text-xs text-slate-500">{item.location} · {item.seller?.profile?.displayName}</p>
            </div>
          </Link>
        ))}
      </div>
    </Layout>
  );
}
