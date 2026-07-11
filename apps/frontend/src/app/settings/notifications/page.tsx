'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import { api } from '../../../services/api';
import { ChevronLeft } from 'lucide-react';

import SettingsSidebar from '../../../components/SettingsSidebar';

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
      <div className="flex w-full min-h-[calc(100vh-56px)] bg-[#f0f2f5] dark:bg-[#18191a]">
        {/* Left Sidebar settings navigation */}
        <SettingsSidebar activeTab="notifications" />

        {/* Right content panel */}
        <main className="flex-1 min-w-0 p-4 md:p-6 overflow-y-auto h-[calc(100vh-56px)] flex justify-center items-start">
          <div className="w-full max-w-[640px] flex flex-col gap-5">
            {/* Mobile Back button only */}
            <Link href="/settings" className="flex items-center gap-2 text-sm text-[#1877f2] font-semibold md:hidden">
              <ChevronLeft className="w-4 h-4" /> Cài đặt
            </Link>

            <div className="fb-card overflow-hidden bg-white dark:bg-[#242526]">
              <div className="p-6 border-b border-slate-150 dark:border-[#3e4042]/50">
                <h1 className="text-sm font-bold text-slate-800 dark:text-slate-100">Cài đặt thông báo</h1>
              </div>

              <div className="flex flex-col">
                {prefs.map((p) => (
                  <label key={p.key} className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#3e4042]/50 last:border-b-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-[#3a3b3c]/50 transition-colors">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{p.label}</span>
                    <input type="checkbox" checked={!!settings[p.key]} onChange={(e) => toggle(p.key, e.target.checked)} className="w-4 h-4 accent-[#1877f2] cursor-pointer" />
                  </label>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
}
