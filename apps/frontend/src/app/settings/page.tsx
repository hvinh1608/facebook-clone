'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { api } from '../../services/api';
import { Lock, CheckCircle2, ArrowRight, Bookmark, UserX, ChevronRight } from 'lucide-react';

import SettingsSidebar from '../../components/SettingsSidebar';

export default function SettingsPage() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu mới không khớp.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await api.post('/auth/change-password', {
        oldPassword,
        newPassword,
      });

      if (res.data?.status === 'success') {
        setSuccess('Đã cập nhật mật khẩu!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể cập nhật mật khẩu. Thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const settingsLinks = [
    { href: '/settings/privacy', icon: Lock, label: 'Quyền riêng tư', desc: 'Ai có thể xem hồ sơ và liên hệ' },
    { href: '/settings/notifications', icon: CheckCircle2, label: 'Thông báo', desc: 'Tùy chọn thông báo' },
    { href: '/saved', icon: Bookmark, label: 'Đã lưu', desc: 'Xem các bài viết đã lưu' },
    { href: '/settings/blocked', icon: UserX, label: 'Người đã chặn', desc: 'Quản lý danh sách chặn' },
  ];

  return (
    <Layout>
      <div className="flex w-full min-h-[calc(100vh-56px)] bg-[#f0f2f5] dark:bg-[#18191a]">
        {/* Left Sidebar settings navigation */}
        <SettingsSidebar activeTab="security" />

        {/* Right content panel */}
        <main className="flex-1 min-w-0 p-4 md:p-6 overflow-y-auto h-[calc(100vh-56px)] flex justify-center items-start">
          <div className="w-full max-w-[640px] flex flex-col gap-5">
            {/* Header mobile only */}
            <div className="fb-card p-4 flex items-center gap-3 md:hidden bg-white dark:bg-[#242526]">
              <div className="w-10 h-10 rounded-full bg-[#1877f2]/10 flex items-center justify-center">
                <Lock className="w-5 h-5 text-[#1877f2]" />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-900 dark:text-white">Bảo mật tài khoản</h1>
                <p className="text-xs text-slate-500">Đổi mật khẩu và cài đặt an toàn</p>
              </div>
            </div>

            {/* Mobile-only settings menu quick links */}
            <div className="fb-card overflow-hidden md:hidden bg-white dark:bg-[#242526]">
              <span className="text-xs font-bold text-slate-400 block px-4 pt-3.5 pb-1 uppercase tracking-wider">Danh mục cài đặt</span>
              {settingsLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-[#3a3b3c] border-b border-slate-100 dark:border-[#3e4042] last:border-b-0 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-slate-500" />
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{item.label}</p>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>
                );
              })}
            </div>

            {/* Change password panel */}
            <div className="fb-card p-6 flex flex-col gap-5 bg-white dark:bg-[#242526]">
              <div className="border-b border-slate-150 dark:border-[#3e4042]/50 pb-3">
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Đổi mật khẩu</h2>
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-600 dark:text-red-400 text-center">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 rounded-xl text-xs text-green-600 dark:text-green-400 text-center flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> {success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    placeholder="Nhập mật khẩu hiện tại"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-[#f0f2f5] dark:bg-[#3a3b3c] border-0 rounded-xl text-sm focus:outline-none text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Mật khẩu mới</label>
                  <input
                    type="password"
                    placeholder="Ít nhất 6 ký tự"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-[#f0f2f5] dark:bg-[#3a3b3c] border-0 rounded-xl text-sm focus:outline-none text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    placeholder="Nhập lại mật khẩu mới"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-[#f0f2f5] dark:bg-[#3a3b3c] border-0 rounded-xl text-sm focus:outline-none text-slate-800 dark:text-slate-200"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !oldPassword || !newPassword}
                  className="w-full mt-2 py-3 bg-[#1877f2] hover:bg-[#166fe5] text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
}
