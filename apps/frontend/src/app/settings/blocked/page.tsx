'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import { api } from '../../../services/api';
import OptimizedAvatar from '../../../components/OptimizedAvatar';
import { UserX, Loader2, ArrowLeft } from 'lucide-react';

import SettingsSidebar from '../../../components/SettingsSidebar';

export default function BlockedUsersPage() {
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBlocked = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/users/blocked');
      if (res.data?.status === 'success') {
        setBlockedUsers(res.data.data);
      }
    } catch (e) {
      console.error('Error loading blocked users', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocked();
  }, []);

  const handleUnblock = async (userId: string) => {
    try {
      const res = await api.delete(`/users/unblock/${userId}`);
      if (res.data?.status === 'success') {
        setBlockedUsers((prev) => prev.filter((u) => u.id !== userId));
      }
    } catch (e) {
      console.error('Error unblocking user', e);
    }
  };

  return (
    <Layout>
      <div className="flex w-full min-h-[calc(100vh-56px)] bg-[#f0f2f5] dark:bg-[#18191a]">
        {/* Left Sidebar settings navigation */}
        <SettingsSidebar activeTab="blocked" />

        {/* Right content panel */}
        <main className="flex-1 min-w-0 p-4 md:p-6 overflow-y-auto h-[calc(100vh-56px)] flex justify-center items-start">
          <div className="w-full max-w-[640px] flex flex-col gap-5">
            {/* Mobile Back button only */}
            <Link href="/settings" className="flex items-center gap-2 text-sm text-[#1877f2] font-semibold md:hidden">
              <ArrowLeft className="w-4 h-4" /> Cài đặt
            </Link>

            <div className="fb-card p-6 flex flex-col gap-5 bg-white dark:bg-[#242526]">
              <div className="border-b border-slate-150 dark:border-[#3e4042]/50 pb-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <UserX className="w-4.5 h-4.5 text-red-500" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-slate-800 dark:text-slate-100">Người đã chặn</h1>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Danh sách người bạn đã chặn hiển thị tại đây.</p>
                </div>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-8 h-8 text-[#1877f2] animate-spin" />
                </div>
              ) : blockedUsers.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Bạn chưa chặn ai.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {blockedUsers.map((blockedUser) => (
                    <div key={blockedUser.id} className="flex items-center justify-between gap-4 p-3 rounded-xl border border-slate-100 dark:border-[#3e4042]/50 bg-slate-50/30 dark:bg-black/5 hover:bg-slate-50 dark:hover:bg-[#3a3b3c]/20 transition-colors">
                      <Link href={`/profile/${blockedUser.id}`} className="flex items-center gap-3 min-w-0">
                        <OptimizedAvatar
                          src={blockedUser.profile?.avatarUrl}
                          alt={blockedUser.profile?.displayName}
                          size={40}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate leading-snug">
                            {blockedUser.profile?.displayName}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">{blockedUser.email}</p>
                        </div>
                      </Link>
                      <button
                        onClick={() => handleUnblock(blockedUser.id)}
                        className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-[#3a3b3c] dark:hover:bg-[#4a4b4d] text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-bold transition-all flex-shrink-0"
                      >
                        Bỏ chặn
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
}
