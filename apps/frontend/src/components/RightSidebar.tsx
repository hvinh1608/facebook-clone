'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { UserPlus, RefreshCw, Search, MoreHorizontal } from 'lucide-react';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useChatBoxesStore } from '../store/chatBoxesStore';
import { useAuthStore } from '../store/authStore';
import OptimizedAvatar from './OptimizedAvatar';

interface Suggestion {
  id: string;
  email: string;
  profile: {
    displayName: string;
    avatarUrl: string | null;
  } | null;
}

export default function RightSidebar() {
  const { onlineUsers } = useSocket();
  const user = useAuthStore((state) => state.user);
  const { openBox } = useChatBoxesStore();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [showContactSearch, setShowContactSearch] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSuggestions = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/users/suggestions');
      if (res.data?.status === 'success') {
        const rawSuggestions = res.data.data || [];
        const uniqueSuggestions = rawSuggestions.filter((item: any, idx: number, self: any[]) =>
          self.findIndex((t) => t.id === item.id) === idx
        );
        setSuggestions(uniqueSuggestions);
      }
    } catch (e) {
      console.error('Error fetching suggestions', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchFriends = useCallback(async () => {
    try {
      const myId = user?.id;
      if (!myId) return;

      const res = await api.get(`/users/friends/${myId}`);
      if (res.data?.status === 'success') {
        const rawFriends = res.data.data || [];
        const uniqueFriends = rawFriends.filter((item: any, idx: number, self: any[]) =>
          self.findIndex((t) => t.id === item.id) === idx
        );
        setFriends(uniqueFriends);
      }
    } catch (e) {
      console.error('Error loading friends list', e);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const onlineFriends = useMemo(() => {
    const q = contactSearch.trim().toLowerCase();
    return [...friends]
      .map((friend) => ({
        ...friend,
        isOnline: onlineUsers.includes(friend.id),
      }))
      .filter((friend) =>
        !q || (friend.profile?.displayName || '').toLowerCase().includes(q)
      )
      .sort((a, b) => Number(b.isOnline) - Number(a.isOnline));
  }, [friends, onlineUsers, contactSearch]);

  const handleAddFriend = async (userId: string) => {
    try {
      const res = await api.post(`/friends/request/${userId}`);
      if (res.data?.status === 'success') {
        setSuggestions((prev) => prev.filter((s) => s.id !== userId));
      }
    } catch (e) {
      console.error('Error sending friend request', e);
    }
  };

  const handleContactClick = (e: React.MouseEvent, friendId: string) => {
    e.preventDefault();
    openBox(friendId);
  };

  return (
    <aside className="w-[320px] h-[calc(100vh-56px)] sticky top-14 overflow-y-auto hidden lg:flex flex-col gap-3 py-4 pr-2 bg-[#f0f2f5] dark:bg-[#18191a]">
      {/* Suggestions Component */}
      <div className="rounded-2xl bg-white/90 dark:bg-[#242526] shadow-sm p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between pb-1">
          <span className="text-[15px] font-semibold text-slate-600 dark:text-[#b0b3b8]">
            Những người bạn có thể biết
          </span>
          <button
            onClick={fetchSuggestions}
            disabled={isLoading}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-[#3a3b3c] hover:text-slate-650 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {suggestions.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-2">Không có gợi ý</p>
          ) : (
            suggestions.slice(0, 5).map((user) => (
              <div key={user.id} className="flex items-center justify-between gap-2">
                <Link href={`/profile/${user.id}`} className="flex items-center gap-2.5 min-w-0">
                  <OptimizedAvatar
                    src={user.profile?.avatarUrl}
                    alt={user.profile?.displayName}
                    size={36}
                    className="border border-slate-200 dark:border-transparent"
                  />
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-black dark:text-[#e4e6eb] hover:text-[#1877f2] hover:underline truncate max-w-[130px]">
                      {user.profile?.displayName}
                    </p>
                  </div>
                </Link>
                <button
                  onClick={() => handleAddFriend(user.id)}
                  className="flex items-center justify-center p-2 bg-[#e7f3ff] hover:bg-[#dbeaff] text-[#1877f2] dark:bg-[#3a3b3c] dark:hover:bg-[#3e4042] dark:text-[#1877f2] rounded-full transition-all"
                  title="Thêm bạn bè"
                >
                  <UserPlus className="w-4.5 h-4.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Online Contacts List */}
      <div className="min-h-0 flex flex-col gap-2">
        <div className="px-2 flex items-center justify-between">
          <span className="text-[17px] font-semibold text-slate-600 dark:text-[#b0b3b8]">
            Người liên hệ
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowContactSearch((v) => !v)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:text-[#b0b3b8] dark:hover:bg-[#3a3b3c] transition-colors"
              title="Tìm kiếm"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:text-[#b0b3b8] dark:hover:bg-[#3a3b3c] transition-colors"
              title="Tùy chọn"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {showContactSearch && (
          <div className="px-2 pb-2">
            <input
              type="text"
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              placeholder="Tìm liên hệ..."
              className="w-full px-3 py-2 text-sm rounded-full bg-slate-100 dark:bg-[#3a3b3c] border-0 focus:outline-none dark:text-white"
              autoFocus
            />
          </div>
        )}

        <div className="flex flex-col gap-0.5 overflow-y-auto pr-1 min-h-0">
          {onlineFriends.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">Không có liên hệ</p>
          ) : (
            onlineFriends.map((friend) => (
              <Link
                key={friend.id}
                href={`/chat?userId=${friend.id}`}
                onClick={(e) => handleContactClick(e, friend.id)}
                className="flex items-center gap-3 h-12 px-2 rounded-lg hover:bg-slate-200/90 dark:hover:bg-[#3a3b3c] transition-colors w-full"
              >
                <div className="relative flex-shrink-0">
                  <OptimizedAvatar
                    src={friend.profile?.avatarUrl}
                    alt={friend.profile?.displayName}
                    size={32}
                    className="border border-slate-200 dark:border-transparent"
                  />
                  {friend.isOnline ? (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#31a24c] border-2 border-white dark:border-[#18191a] rounded-full online-pulse"></span>
                  ) : (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-slate-500 border-2 border-white dark:border-[#18191a] rounded-full"></span>
                  )}
                </div>
                <span className="text-[15px] leading-none font-medium text-slate-800 dark:text-[#e4e6eb] truncate max-w-[220px]">
                  {friend.profile?.displayName}
                </span>
              </Link>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
