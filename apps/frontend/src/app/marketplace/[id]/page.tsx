'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import { api } from '../../../services/api';
import { Loader2, ShoppingBag, ArrowLeft } from 'lucide-react';
import OptimizedAvatar from '../../../components/OptimizedAvatar';

export default function MarketplaceDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/discovery/marketplace/${id}`)
      .then((res) => {
        if (res.data?.status === 'success') setItem(res.data.data);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#1877f2] animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!item) {
    return (
      <Layout>
        <div className="max-w-[680px] mx-auto fb-card p-8 text-center">
          <p className="text-[var(--text-secondary)]">Không tìm thấy sản phẩm.</p>
          <Link href="/marketplace" className="text-[#1877f2] text-sm font-semibold mt-2 inline-block hover:underline">
            Quay lại Marketplace
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-[680px] mx-auto flex flex-col gap-4">
        <Link href="/marketplace" className="flex items-center gap-2 text-sm text-[#1877f2] font-semibold hover:underline w-fit">
          <ArrowLeft className="w-4 h-4" /> Marketplace
        </Link>

        <div className="fb-card p-6">
          <div className="flex items-start gap-3 mb-4">
            <ShoppingBag className="w-6 h-6 text-[#1877f2] flex-shrink-0 mt-1" />
            <div>
              <h1 className="text-xl font-bold text-[var(--text-primary)]">{item.title}</h1>
              <p className="text-2xl font-bold text-[#1877f2] mt-2">
                {Number(item.price).toLocaleString('vi-VN')} đ
              </p>
            </div>
          </div>

          {item.description && (
            <p className="text-sm text-[var(--text-primary)] leading-relaxed mb-4">{item.description}</p>
          )}

          <div className="flex flex-col gap-2 text-sm text-[var(--text-secondary)] border-t border-[var(--border-soft)] pt-4">
            {item.location && <p>📍 {item.location}</p>}
            {item.condition && <p>Tình trạng: {item.condition}</p>}
            <p>Đăng ngày: {new Date(item.createdAt).toLocaleDateString('vi-VN')}</p>
          </div>

          {item.seller && (
            <Link
              href={`/profile/${item.seller.id}`}
              className="flex items-center gap-3 mt-4 p-3 rounded-lg bg-[var(--hover-bg)] hover:opacity-90 transition-opacity"
            >
              <OptimizedAvatar
                src={item.seller.profile?.avatarUrl}
                alt={item.seller.profile?.displayName}
                size={40}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {item.seller.profile?.displayName}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">Người bán</p>
              </div>
            </Link>
          )}

          <button
            type="button"
            className="w-full mt-4 py-3 bg-[#1877f2] hover:bg-[#166fe5] text-white font-bold rounded-lg text-sm transition-colors"
          >
            Nhắn tin người bán
          </button>
        </div>
      </div>
    </Layout>
  );
}
