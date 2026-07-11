'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { api } from '../../services/api';
import { Loader2, Plus, ShoppingBag, Search, Tag, MapPin, X, Globe } from 'lucide-react';

export default function MarketplacePage() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', price: '', location: '', imageUrl: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  const fetchListings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);
      if (locationFilter.trim()) params.set('location', locationFilter.trim());
      const res = await api.get(`/discovery/marketplace?${params.toString()}`);
      if (res.data?.status === 'success') {
        setListings(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchListings();
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery, minPrice, maxPrice, locationFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/discovery/marketplace', {
        title: form.title,
        price: Number(form.price),
        location: form.location || 'Hà Nội',
        imageUrl: form.imageUrl.trim() || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80',
      });
      setShowForm(false);
      setForm({ title: '', price: '', location: '', imageUrl: '' });
      fetchListings();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredListings = listings.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.location && item.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Layout>
      <div className="flex w-full min-h-[calc(100vh-56px)] bg-[#f0f2f5] dark:bg-[#18191a]">
        {/* Left Sidebar filter & actions */}
        <aside className="w-full md:w-[360px] border-r border-slate-200 dark:border-[#3e4042] bg-white dark:bg-[#242526] flex flex-col flex-shrink-0 h-[calc(100vh-56px)] sticky top-14 overflow-y-auto">
          <div className="p-4 border-b border-slate-150 dark:border-[#3e4042] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-6 h-6 text-[#1877f2]" />
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Marketplace</h1>
              </div>
            </div>

            {/* Search Box */}
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-[#f0f2f5] dark:bg-[#3a3b3c] border-0 rounded-full text-xs focus:outline-none dark:text-white placeholder-slate-500"
              />
              <Search className="absolute right-3.5 top-2.5 w-4 h-4 text-slate-400" />
            </div>

            <button
              onClick={() => setShowForm(true)}
              className="w-full py-2.5 bg-blue-50 hover:bg-blue-100/80 dark:bg-blue-950/20 dark:hover:bg-blue-900/30 text-[#1877f2] font-bold rounded-lg text-sm transition-all flex items-center justify-center gap-1.5 shadow-sm mt-1"
            >
              <Plus className="w-4.5 h-4.5" /> Đăng tin bán sản phẩm
            </button>
          </div>

          <div className="flex-1 p-4 flex flex-col gap-3">
            <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider">Bộ lọc</h3>
            <div className="flex flex-col gap-2.5">
              <input
                type="text"
                placeholder="Vị trí (VD: Hà Nội)"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-[#f0f2f5] dark:bg-[#3a3b3c] border-0 focus:outline-none dark:text-white"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Giá từ"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-1/2 px-3 py-2 text-xs rounded-lg bg-[#f0f2f5] dark:bg-[#3a3b3c] border-0 focus:outline-none dark:text-white"
                />
                <input
                  type="number"
                  placeholder="Giá đến"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-1/2 px-3 py-2 text-xs rounded-lg bg-[#f0f2f5] dark:bg-[#3a3b3c] border-0 focus:outline-none dark:text-white"
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Right Main Content Grid */}
        <main className="flex-1 min-w-0 p-6 overflow-y-auto h-[calc(100vh-56px)]">
          <div className="max-w-5xl mx-auto flex flex-col gap-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Sản phẩm đề xuất cho bạn</h2>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 text-[#1877f2] animate-spin" />
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="fb-card p-12 text-center text-slate-500">
                Chưa có sản phẩm nào phù hợp được đăng bán.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredListings.map((item) => (
                  <Link
                    key={item.id}
                    href={`/marketplace/${item.id}`}
                    className="fb-card overflow-hidden flex flex-col border border-slate-200 dark:border-transparent transition-all hover:shadow-md"
                  >
                    {/* Square Image container */}
                    <div className="relative w-full aspect-square overflow-hidden bg-slate-100 dark:bg-[#3a3b3c] flex-shrink-0">
                      <img
                        src={item.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80'}
                        alt={item.title}
                        className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-200"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80';
                        }}
                      />
                    </div>

                    <div className="p-3 flex flex-col gap-1.5 flex-1 justify-between bg-white dark:bg-[#242526]">
                      <div>
                        <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100 truncate hover:underline block leading-tight">
                          {item.title}
                        </p>
                        <p className="text-xs font-bold text-[#1877f2] mt-0.5">
                          {Number(item.price).toLocaleString('vi-VN')} đ
                        </p>
                      </div>

                      <div className="mt-2 flex flex-col gap-0.5 border-t border-slate-100 dark:border-[#3e4042]/50 pt-2.5">
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                          <MapPin className="w-3 h-3 flex-shrink-0 text-slate-400" />
                          {item.location || 'Hà Nội'}
                        </p>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                          Người bán: {item.seller?.profile?.displayName}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create Listing Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md fb-card p-6 flex flex-col gap-5 bg-white dark:bg-[#242526]">
            <div className="flex justify-between items-center border-b border-slate-150 dark:border-[#3e4042] pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Đăng sản phẩm bán mới</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#3a3b3c] rounded-full text-slate-500 dark:text-slate-400">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tên sản phẩm</label>
                <input
                  type="text"
                  placeholder="VD: iPhone 14 Pro Max"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 bg-[#f0f2f5] dark:bg-[#3a3b3c] border-0 rounded-xl text-sm focus:outline-none dark:text-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Giá sản phẩm (VNĐ)</label>
                <input
                  type="number"
                  placeholder="VD: 15000000"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 bg-[#f0f2f5] dark:bg-[#3a3b3c] border-0 rounded-xl text-sm focus:outline-none dark:text-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Khu vực giao dịch</label>
                <input
                  type="text"
                  placeholder="VD: Hà Nội hoặc TP. Hồ Chí Minh"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 bg-[#f0f2f5] dark:bg-[#3a3b3c] border-0 rounded-xl text-sm focus:outline-none dark:text-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Link ảnh demo sản phẩm (URL)</label>
                <input
                  type="text"
                  placeholder="VD: https://link-anh.com/iphone.jpg"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#f0f2f5] dark:bg-[#3a3b3c] border-0 rounded-xl text-sm focus:outline-none dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 bg-[#1877f2] hover:bg-[#166fe5] text-white font-bold rounded-xl text-sm transition-all"
              >
                Đăng bán sản phẩm
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
