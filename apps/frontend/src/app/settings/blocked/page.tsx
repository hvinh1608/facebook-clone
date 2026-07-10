'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import { api } from '../../../services/api';
import OptimizedAvatar from '../../../components/OptimizedAvatar';
import { UserX, Loader2, ArrowLeft } from 'lucide-react';

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
      <div className="max-w-[680px] mx-auto flex flex-col gap-5">
        <div className="fb-card p-4 flex items-center gap-3">
          <Link href="/settings" className="p-2 hover:bg-slate-100 dark:hover:bg-[#3a3b3c] rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </Link>
          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
            <UserX className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Người đã chặn</h1>
            <p className="text-xs text-slate-500">Quản lý danh sách người bạn đã chặn</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#1877f2] animate-spin" />
          </div>
        ) : blockedUsers.length === 0 ? (
          <div className="fb-card p-12 text-center text-slate-500">
            Bạn chưa chặn ai.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {blockedUsers.map((blockedUser) => (
              <div key={blockedUser.id} className="fb-card p-4 flex items-center justify-between gap-4">
                <Link href={`/profile/${blockedUser.id}`} className="flex items-center gap-3 min-w-0">
                  <OptimizedAvatar
                    src={blockedUser.profile?.avatarUrl}
                    alt={blockedUser.profile?.displayName}
                    size={48}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {blockedUser.profile?.displayName}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{blockedUser.email}</p>
                  </div>
                </Link>
                <button
                  onClick={() => handleUnblock(blockedUser.id)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-[#3a3b3c] dark:hover:bg-[#4a4b4d] text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-all flex-shrink-0"
                >
                  Bỏ chặn
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
