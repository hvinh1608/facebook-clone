'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import { api } from '../../../services/api';
import { ChevronLeft } from 'lucide-react';

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
      <div className="max-w-[680px] mx-auto flex flex-col gap-4">
        <Link href="/settings" className="flex items-center gap-2 text-sm text-[#1877f2] font-semibold"><ChevronLeft className="w-4 h-4" /> Cài đặt</Link>
        <div className="fb-card p-4"><h1 className="text-lg font-bold">Quyền riêng tư</h1></div>
        <div className="fb-card p-4 flex flex-col gap-4">
          <label className="text-xs font-bold text-slate-500 uppercase">Ai xem được hồ sơ</label>
          <select value={settings.profileVisibility} onChange={(e) => update({ profileVisibility: e.target.value })} className="px-3 py-2 rounded-lg bg-[#f0f2f5] text-sm">
            <option value="PUBLIC">Công khai</option>
            <option value="FRIENDS">Bạn bè</option>
            <option value="ONLY_ME">Chỉ mình tôi</option>
          </select>
          <label className="text-xs font-bold text-slate-500 uppercase">Ai gửi lời mời kết bạn</label>
          <select value={settings.whoCanFriendRequest} onChange={(e) => update({ whoCanFriendRequest: e.target.value })} className="px-3 py-2 rounded-lg bg-[#f0f2f5] text-sm">
            <option value="EVERYONE">Mọi người</option>
            <option value="FRIENDS_OF_FRIENDS">Bạn của bạn bè</option>
            <option value="NOBODY">Không ai</option>
          </select>
          <label className="text-xs font-bold text-slate-500 uppercase">Ai nhắn tin cho bạn</label>
          <select value={settings.whoCanMessage} onChange={(e) => update({ whoCanMessage: e.target.value })} className="px-3 py-2 rounded-lg bg-[#f0f2f5] text-sm">
            <option value="EVERYONE">Mọi người</option>
            <option value="FRIENDS">Bạn bè</option>
            <option value="NOBODY">Không ai</option>
          </select>
          {saving && <p className="text-xs text-slate-500">Đang lưu...</p>}
        </div>
      </div>
    </Layout>
  );
}
