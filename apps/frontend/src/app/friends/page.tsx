'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useChatBoxesStore } from '../../store/chatBoxesStore';
import { Check, X, UserMinus, MessageSquare, UserPlus } from 'lucide-react';
import OptimizedAvatar from '../../components/OptimizedAvatar';

export default function FriendsPage() {
  const { user } = useAuthStore();
  const { openBox } = useChatBoxesStore();
  const [received, setReceived] = useState<any[]>([]);
  const [sent, setSent] = useState<any[]>([]);
  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'requests' | 'sent' | 'all'>('requests');
  const [isLoading, setIsLoading] = useState(false);

  const fetchFriendData = async () => {
    try {
      setIsLoading(true);
      const recRes = await api.get('/friends/requests/received');
      if (recRes.data?.status === 'success') {
        setReceived(recRes.data.data);
      }

      const sentRes = await api.get('/friends/requests/sent');
      if (sentRes.data?.status === 'success') {
        setSent(sentRes.data.data);
      }

      if (user?.id) {
        const listRes = await api.get(`/users/friends/${user.id}`);
        if (listRes.data?.status === 'success') {
          setFriendsList(listRes.data.data);
        }
      }

      const sugRes = await api.get('/users/suggestions');
      if (sugRes.data?.status === 'success') {
        setSuggestions(sugRes.data.data.slice(0, 8));
      }
    } catch (e) {
      console.error('Error loading friends details', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFriendData();
  }, [user]);

  const handleAccept = async (senderId: string) => {
    try {
      const res = await api.post(`/friends/request/accept/${senderId}`);
      if (res.data?.status === 'success') {
        fetchFriendData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDecline = async (senderId: string) => {
    try {
      const res = await api.delete(`/friends/request/decline/${senderId}`);
      if (res.data?.status === 'success') {
        fetchFriendData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancelRequest = async (receiverId: string) => {
    try {
      const res = await api.delete(`/friends/request/cancel/${receiverId}`);
      if (res.data?.status === 'success') {
        fetchFriendData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUnfriend = async (friendId: string) => {
    if (window.confirm('Bạn có chắc muốn hủy kết bạn với người này?')) {
      try {
        const res = await api.delete(`/friends/unfriend/${friendId}`);
        if (res.data?.status === 'success') {
          fetchFriendData();
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleAddFriend = async (userId: string) => {
    try {
      const res = await api.post(`/friends/request/${userId}`);
      if (res.data?.status === 'success') {
        setSuggestions((prev) => prev.filter((s) => s.id !== userId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMessage = (e: React.MouseEvent, friendId: string) => {
    e.preventDefault();
    openBox(friendId);
  };

  return (
    <Layout>
      <div className="max-w-[680px] mx-auto flex flex-col gap-5">
        {suggestions.length > 0 && (
          <div className="fb-card p-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Những người bạn có thể biết</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {suggestions.map((sug) => (
                <div key={sug.id} className="border border-slate-200 dark:border-[#3e4042] rounded-lg overflow-hidden bg-white dark:bg-[#242526]">
                  <Link href={`/profile/${sug.id}`} className="block relative w-full aspect-square overflow-hidden bg-[#e4e6eb]">
                    <OptimizedAvatar
                      src={sug.profile?.avatarUrl}
                      alt={sug.profile?.displayName}
                      fill
                      className="rounded-none"
                    />
                  </Link>
                  <div className="p-2.5 flex flex-col gap-2">
                    <Link href={`/profile/${sug.id}`} className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate hover:underline">
                      {sug.profile?.displayName}
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleAddFriend(sug.id)}
                      className="w-full py-1.5 bg-[#e7f3ff] hover:bg-[#dbeaff] text-[#1877f2] dark:bg-[#3a3b3c] dark:hover:bg-[#3e4042] rounded-md text-xs font-semibold flex items-center justify-center gap-1"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Thêm bạn bè
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="fb-card p-4">
          <div className="flex border-b border-slate-200 dark:border-[#3e4042]">
            {[
              { type: 'requests', label: `Lời mời nhận (${received.length})` },
              { type: 'sent', label: `Đã gửi (${sent.length})` },
              { type: 'all', label: `Bạn bè (${friendsList.length})` },
            ].map((tab) => (
              <button
                key={tab.type}
                onClick={() => setActiveTab(tab.type as any)}
                className={`flex-1 py-3.5 text-sm font-semibold relative transition-all ${
                  activeTab === tab.type ? 'text-[#1877f2]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {tab.label}
                {activeTab === tab.type && (
                  <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#1877f2] rounded-t-full"></span>
                )}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {activeTab === 'requests' && (
              received.length === 0 ? (
                <div className="fb-card p-12 text-center text-slate-500">
                  Không có lời mời kết bạn.
                </div>
              ) : (
                received.map((req) => (
                  <div key={req.id} className="fb-card p-4 flex items-center justify-between gap-4">
                    <Link href={`/profile/${req.sender.id}`} className="flex items-center gap-3 min-w-0">
                      <OptimizedAvatar
                        src={req.sender.profile?.avatarUrl}
                        alt={req.sender.profile?.displayName}
                        size={48}
                        className="w-12 h-12 rounded-full object-cover border border-slate-800"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{req.sender.profile?.displayName}</p>
                        <p className="text-xs text-slate-500 leading-snug truncate">{req.sender.profile?.bio || 'Đang hoạt động'}</p>
                      </div>
                    </Link>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleAccept(req.sender.id)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#1877f2] hover:bg-[#166fe5] text-white font-semibold rounded-lg text-xs transition-all"
                      >
                        <Check className="w-3.5 h-3.5" /> Chấp nhận
                      </button>
                      <button
                        onClick={() => handleDecline(req.sender.id)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-[#3a3b3c] dark:hover:bg-[#4a4b4d] text-slate-700 dark:text-slate-200 rounded-lg text-xs transition-all"
                      >
                        <X className="w-3.5 h-3.5" /> Từ chối
                      </button>
                    </div>
                  </div>
                ))
              )
            )}

            {activeTab === 'sent' && (
              sent.length === 0 ? (
                <div className="fb-card p-12 text-center text-slate-500">
                  Chưa gửi lời mời nào.
                </div>
              ) : (
                sent.map((req) => (
                  <div key={req.id} className="fb-card p-4 flex items-center justify-between gap-4">
                    <Link href={`/profile/${req.receiver.id}`} className="flex items-center gap-3 min-w-0">
                      <OptimizedAvatar
                        src={req.receiver.profile?.avatarUrl}
                        alt={req.receiver.profile?.displayName}
                        size={48}
                        className="w-12 h-12 rounded-full object-cover border border-slate-800"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{req.receiver.profile?.displayName}</p>
                        <span className="text-xs text-slate-500">Đang chờ phản hồi</span>
                      </div>
                    </Link>
                    <button
                      onClick={() => handleCancelRequest(req.receiver.id)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-[#3a3b3c] dark:hover:bg-[#4a4b4d] text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-all"
                    >
                      <X className="w-3.5 h-3.5" /> Hủy lời mời
                    </button>
                  </div>
                ))
              )
            )}

            {activeTab === 'all' && (
              friendsList.length === 0 ? (
                <div className="fb-card p-12 text-center text-slate-500">
                  Bạn chưa có bạn bè nào.
                </div>
              ) : (
                friendsList.map((friend) => (
                  <div key={friend.id} className="fb-card p-4 flex items-center justify-between gap-4">
                    <Link href={`/profile/${friend.id}`} className="flex items-center gap-3 min-w-0">
                      <OptimizedAvatar
                        src={friend.profile?.avatarUrl}
                        alt={friend.profile?.displayName}
                        size={48}
                        className="w-12 h-12 rounded-full object-cover border border-slate-800"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{friend.profile?.displayName}</p>
                        <p className="text-xs text-slate-500 leading-snug truncate">{friend.profile?.bio || 'Đang hoạt động'}</p>
                      </div>
                    </Link>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => handleMessage(e, friend.id)}
                        className="p-2.5 bg-[#1877f2] hover:bg-[#166fe5] text-white rounded-lg flex items-center justify-center transition-all"
                        title="Nhắn tin"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleUnfriend(friend.id)}
                        className="p-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-white rounded-lg border border-red-200 dark:border-red-900/35 transition-all flex items-center justify-center"
                        title="Hủy kết bạn"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
