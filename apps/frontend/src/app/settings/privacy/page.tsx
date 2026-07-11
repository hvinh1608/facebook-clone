'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import { api } from '../../../services/api';
import { ChevronLeft } from 'lucide-react';

import SettingsSidebar from '../../../components/SettingsSidebar';

export default function PrivacySettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/settings').then((res) => {
      if (res.data?.status === 'success') setSettings(res.data.data);
    });
  }, []);

  const update = async (patch: object) => {
    setSaving(true);
    try {
      const res = await api.put('/settings', patch);
      if (res.data?.status === 'success') setSettings(res.data.data);
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return <Layout><div className="p-8 text-center text-sm">Đang tải...</div></Layout>;

  return (
    <Layout>
      <div className="flex w-full min-h-[calc(100vh-56px)] bg-[#f0f2f5] dark:bg-[#18191a]">
        {/* Left Sidebar settings navigation */}
        <SettingsSidebar activeTab="privacy" />

        {/* Right content panel */}
        <main className="flex-1 min-w-0 p-4 md:p-6 overflow-y-auto h-[calc(100vh-56px)] flex justify-center items-start">
          <div className="w-full max-w-[640px] flex flex-col gap-5">
            {/* Mobile Back button only */}
            <Link href="/settings" className="flex items-center gap-2 text-sm text-[#1877f2] font-semibold md:hidden">
              <ChevronLeft className="w-4 h-4" /> Cài đặt
            </Link>

            <div className="fb-card p-6 flex flex-col gap-5 bg-white dark:bg-[#242526]">
              <div className="border-b border-slate-150 dark:border-[#3e4042]/50 pb-3">
                <h1 className="text-sm font-bold text-slate-800 dark:text-slate-100">Quyền riêng tư</h1>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Ai xem được hồ sơ</label>
                  <select
                    value={settings.profileVisibility}
                    onChange={(e) => update({ profileVisibility: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#f0f2f5] dark:bg-[#3a3b3c] border-0 rounded-xl text-sm focus:outline-none dark:text-white"
                  >
                    <option value="PUBLIC">Công khai</option>
                    <option value="FRIENDS">Bạn bè</option>
                    <option value="ONLY_ME">Chỉ mình tôi</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Ai gửi lời mời kết bạn</label>
                  <select
                    value={settings.whoCanFriendRequest}
                    onChange={(e) => update({ whoCanFriendRequest: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#f0f2f5] dark:bg-[#3a3b3c] border-0 rounded-xl text-sm focus:outline-none dark:text-white"
                  >
                    <option value="EVERYONE">Mọi người</option>
                    <option value="FRIENDS_OF_FRIENDS">Bạn của bạn bè</option>
                    <option value="NOBODY">Không ai</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Ai nhắn tin cho bạn</label>
                  <select
                    value={settings.whoCanMessage}
                    onChange={(e) => update({ whoCanMessage: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#f0f2f5] dark:bg-[#3a3b3c] border-0 rounded-xl text-sm focus:outline-none dark:text-white"
                  >
                    <option value="EVERYONE">Mọi người</option>
                    <option value="FRIENDS">Bạn bè</option>
                    <option value="NOBODY">Không ai</option>
                  </select>
                </div>

                {saving && <p className="text-xs text-slate-500 animate-pulse mt-2">Đang tự động lưu...</p>}
              </div>
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
}
