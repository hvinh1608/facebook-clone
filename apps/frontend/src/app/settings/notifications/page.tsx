'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import { api } from '../../../services/api';
import { ChevronLeft } from 'lucide-react';

const prefs = [
  { key: 'notifyLike', label: 'Thích bài viết' },
  { key: 'notifyComment', label: 'Bình luận' },
  { key: 'notifyShare', label: 'Chia sẻ' },
  { key: 'notifyFriendRequest', label: 'Lời mời kết bạn' },
  { key: 'notifyMessage', label: 'Tin nhắn mới' },
] as const;

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    api.get('/settings').then((res) => {
      if (res.data?.status === 'success') setSettings(res.data.data);
    });
  }, []);

  const toggle = async (key: string, value: boolean) => {
    const res = await api.put('/settings', { [key]: value });
    if (res.data?.status === 'success') setSettings(res.data.data);
  };

  if (!settings) return <Layout><div className="p-8 text-center text-sm">Đang tải...</div></Layout>;

  return (
    <Layout>
      <div className="max-w-[680px] mx-auto flex flex-col gap-4">
        <Link href="/settings" className="flex items-center gap-2 text-sm text-[#1877f2] font-semibold"><ChevronLeft className="w-4 h-4" /> Cài đặt</Link>
        <div className="fb-card p-4"><h1 className="text-lg font-bold">Thông báo</h1></div>
        <div className="fb-card overflow-hidden">
          {prefs.map((p) => (
            <label key={p.key} className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 dark:border-[#3e4042] last:border-b-0 cursor-pointer">
              <span className="text-sm font-semibold">{p.label}</span>
              <input type="checkbox" checked={!!settings[p.key]} onChange={(e) => toggle(p.key, e.target.checked)} className="w-4 h-4 accent-[#1877f2]" />
            </label>
          ))}
        </div>
      </div>
    </Layout>
  );
}
