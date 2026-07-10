'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import { api } from '../../../services/api';
import { toast } from '../../../utils/toast';
import { Loader2, Flag, ArrowLeft } from 'lucide-react';

export default function PageDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    api.get(`/discovery/pages/${id}`)
      .then((res) => {
        if (res.data?.status === 'success') {
          setPage(res.data.data);
          setFollowing(!!res.data.data.isFollowing);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleFollow = async () => {
    try {
      if (following) {
        await api.delete(`/discovery/pages/${id}/follow`);
        toast.info('Đã bỏ theo dõi trang.');
        setFollowing(false);
        setPage((prev: any) => ({
          ...prev,
          _count: { ...prev._count, followers: Math.max(0, (prev._count?.followers || 1) - 1) },
        }));
      } else {
        await api.post(`/discovery/pages/${id}/follow`);
        toast.success('Đã theo dõi trang!');
        setFollowing(true);
        setPage((prev: any) => ({
          ...prev,
          _count: { ...prev._count, followers: (prev._count?.followers || 0) + 1 },
        }));
      }
    } catch {
      toast.error('Không thể cập nhật trạng thái theo dõi.');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#1877f2] animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!page) {
    return (
      <Layout>
        <div className="max-w-[680px] mx-auto fb-card p-8 text-center">
          <p className="text-[var(--text-secondary)]">Không tìm thấy trang.</p>
          <Link href="/pages" className="text-[#1877f2] text-sm font-semibold mt-2 inline-block hover:underline">
            Quay lại Trang
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-[680px] mx-auto flex flex-col gap-4">
        <Link href="/pages" className="flex items-center gap-2 text-sm text-[#1877f2] font-semibold hover:underline w-fit">
          <ArrowLeft className="w-4 h-4" /> Trang
        </Link>

        <div className="fb-card p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-16 h-16 rounded-lg bg-[#1877f2] flex items-center justify-center flex-shrink-0">
              <Flag className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-[var(--text-primary)]">{page.name}</h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                {page._count?.followers || 0} người theo dõi
              </p>
            </div>
          </div>

          {page.description && (
            <p className="text-sm text-[var(--text-primary)] leading-relaxed mb-4">{page.description}</p>
          )}

          <div className="text-xs text-[var(--text-secondary)] border-t border-[var(--border-soft)] pt-4">
            Tạo ngày: {new Date(page.createdAt).toLocaleDateString('vi-VN')}
          </div>

          <button
            type="button"
            onClick={handleFollow}
            className={`w-full mt-4 py-3 font-bold rounded-lg text-sm transition-colors ${
              following
                ? 'bg-[var(--hover-bg)] text-[var(--text-primary)] hover:opacity-90'
                : 'bg-[#1877f2] hover:bg-[#166fe5] text-white'
            }`}
          >
            {following ? 'Đang theo dõi' : 'Theo dõi trang'}
          </button>
        </div>
      </div>
    </Layout>
  );
}
