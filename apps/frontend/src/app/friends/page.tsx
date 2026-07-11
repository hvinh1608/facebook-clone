'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useChatBoxesStore } from '../../store/chatBoxesStore';
import { Check, X, UserMinus, MessageSquare, UserPlus, Loader2 } from 'lucide-react';
import OptimizedAvatar from '../../components/OptimizedAvatar';

export default function FriendsPage() {
  const { user } = useAuthStore();
  const { openBox } = useChatBoxesStore();
  const [received, setReceived] = useState<any[]>([]);
  const [sent, setSent] = useState<any[]>([]);
  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'requests' | 'sent' | 'all' | 'suggestions'>('requests');
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
      <div className="flex w-full min-h-[calc(100vh-56px)] bg-[#f0f2f5] dark:bg-[#18191a]">
        {/* Left Sidebar Menu */}
        <aside className="w-full md:w-[360px] border-r border-slate-200 dark:border-[#3e4042] bg-white dark:bg-[#242526] flex flex-col flex-shrink-0 h-[calc(100vh-56px)] sticky top-14 overflow-y-auto">
          <div className="p-4 border-b border-slate-150 dark:border-[#3e4042]">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Bạn bè</h1>
          </div>

          <div className="flex-1 p-2 flex flex-col gap-1">
            {[
              { type: 'requests', label: 'Lời mời kết bạn', count: received.length },
              { type: 'suggestions', label: 'Gợi ý kết bạn', count: suggestions.length },
              { type: 'sent', label: 'Lời mời đã gửi', count: sent.length },
              { type: 'all', label: 'Tất cả bạn bè', count: friendsList.length },
            ].map((tab) => (
              <button
                key={tab.type}
                onClick={() => setActiveTab(tab.type as any)}
                className={`w-full p-3 text-left flex items-center justify-between rounded-xl transition-all duration-150 ${
                  activeTab === tab.type
                    ? 'bg-blue-50 dark:bg-blue-950/20 text-[#1877f2] font-semibold'
                    : 'hover:bg-slate-100 dark:hover:bg-[#3a3b3c] text-slate-800 dark:text-[#e4e6eb]'
                }`}
              >
                <span className="text-sm">{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    tab.type === 'requests' ? 'bg-[#e41e3f] text-white' : 'bg-slate-200 dark:bg-[#3a3b3c] text-slate-600 dark:text-slate-350'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </aside>

        {/* Right Main Content Grid */}
        <main className="flex-1 min-w-0 p-6 overflow-y-auto h-[calc(100vh-56px)]">
          <div className="max-w-5xl mx-auto flex flex-col gap-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white capitalize">
                {activeTab === 'requests' && 'Lời mời kết bạn'}
                {activeTab === 'suggestions' && 'Gợi ý bạn bè'}
                {activeTab === 'sent' && 'Lời mời đã gửi'}
                {activeTab === 'all' && 'Tất cả bạn bè'}
              </h2>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-[#1877f2] animate-spin" />
              </div>
            ) : (
              <>
                {/* 1. Lời mời kết bạn */}
                {activeTab === 'requests' && (
                  received.length === 0 ? (
                    <div className="fb-card p-12 text-center text-slate-500">
                      Không có lời mời kết bạn nào.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                      {received.map((req) => (
                        <div key={req.id} className="fb-card overflow-hidden flex flex-col border border-slate-200 dark:border-transparent transition-all hover:shadow-md">
                          <Link href={`/profile/${req.sender.id}`} className="block relative w-full aspect-[3/4] overflow-hidden bg-slate-100 bg-[#e4e6eb] dark:bg-[#3a3b3c]">
                            <OptimizedAvatar
                              src={req.sender.profile?.avatarUrl}
                              alt={req.sender.profile?.displayName || 'Avatar'}
                              fill
                              square
                              className="rounded-none hover:scale-[1.03] transition-transform duration-200"
                            />
                          </Link>
                          <div className="p-3 flex flex-col gap-3 flex-1 justify-between">
                            <div>
                              <Link href={`/profile/${req.sender.id}`} className="text-[13px] font-bold text-slate-800 dark:text-slate-100 truncate hover:underline block leading-snug">
                                {req.sender.profile?.displayName}
                              </Link>
                              <p className="text-[10px] text-slate-500 truncate mt-0.5">{req.sender.profile?.bio || 'Đang hoạt động'}</p>
                            </div>
                            <div className="flex flex-col gap-1.5 mt-2">
                              <button
                                onClick={() => handleAccept(req.sender.id)}
                                className="w-full py-1.5 bg-[#1877f2] hover:bg-[#166fe5] text-white font-bold rounded-lg text-[11px] transition-colors"
                              >
                                Chấp nhận
                              </button>
                              <button
                                onClick={() => handleDecline(req.sender.id)}
                                className="w-full py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-[#3a3b3c] dark:hover:bg-[#4a4b4d] text-slate-700 dark:text-slate-200 font-bold rounded-lg text-[11px] transition-colors"
                              >
                                Từ chối
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}

                {/* 2. Gợi ý kết bạn */}
                {activeTab === 'suggestions' && (
                  suggestions.length === 0 ? (
                    <div className="fb-card p-12 text-center text-slate-500">
                      Không có gợi ý mới nào.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                      {suggestions.map((sug) => (
                        <div key={sug.id} className="fb-card overflow-hidden flex flex-col border border-slate-200 dark:border-transparent transition-all hover:shadow-md">
                          <Link href={`/profile/${sug.id}`} className="block relative w-full aspect-[3/4] overflow-hidden bg-slate-100 bg-[#e4e6eb] dark:bg-[#3a3b3c]">
                            <OptimizedAvatar
                              src={sug.profile?.avatarUrl}
                              alt={sug.profile?.displayName || 'Avatar'}
                              fill
                              square
                              className="rounded-none hover:scale-[1.03] transition-transform duration-200"
                            />
                          </Link>
                          <div className="p-3 flex flex-col gap-3 flex-1 justify-between">
                            <div>
                              <Link href={`/profile/${sug.id}`} className="text-[13px] font-bold text-slate-800 dark:text-slate-100 truncate hover:underline block leading-snug">
                                {sug.profile?.displayName}
                              </Link>
                              <p className="text-[10px] text-slate-500 truncate mt-0.5">{sug.profile?.bio || 'Gợi ý kết bạn'}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAddFriend(sug.id)}
                              className="w-full py-2 bg-[#e7f3ff] hover:bg-[#dbeaff] text-[#1877f2] dark:bg-[#3a3b3c] dark:hover:bg-[#3e4042] rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 mt-2"
                            >
                              Thêm bạn bè
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}

                {/* 3. Lời mời đã gửi */}
                {activeTab === 'sent' && (
                  sent.length === 0 ? (
                    <div className="fb-card p-12 text-center text-slate-500">
                      Chưa gửi lời mời nào.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                      {sent.map((req) => (
                        <div key={req.id} className="fb-card overflow-hidden flex flex-col border border-slate-200 dark:border-transparent transition-all hover:shadow-md">
                          <Link href={`/profile/${req.receiver.id}`} className="block relative w-full aspect-[3/4] overflow-hidden bg-slate-100 bg-[#e4e6eb] dark:bg-[#3a3b3c]">
                            <OptimizedAvatar
                              src={req.receiver.profile?.avatarUrl}
                              alt={req.receiver.profile?.displayName || 'Avatar'}
                              fill
                              square
                              className="rounded-none hover:scale-[1.03] transition-transform duration-200"
                            />
                          </Link>
                          <div className="p-3 flex flex-col gap-3 flex-1 justify-between">
                            <div>
                              <Link href={`/profile/${req.receiver.id}`} className="text-[13px] font-bold text-slate-800 dark:text-slate-100 truncate hover:underline block leading-snug">
                                {req.receiver.profile?.displayName}
                              </Link>
                              <p className="text-[10px] text-slate-550 mt-0.5">Đang chờ phản hồi</p>
                            </div>
                            <button
                              onClick={() => handleCancelRequest(req.receiver.id)}
                              className="w-full py-2 bg-slate-200 hover:bg-slate-300 dark:bg-[#3a3b3c] dark:hover:bg-[#4a4b4d] text-slate-700 dark:text-slate-200 font-bold rounded-lg text-[11px] transition-colors mt-2"
                            >
                              Hủy lời mời
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}

                {/* 4. Tất cả bạn bè */}
                {activeTab === 'all' && (
                  friendsList.length === 0 ? (
                    <div className="fb-card p-12 text-center text-slate-500">
                      Bạn chưa có bạn bè nào.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                      {friendsList.map((friend) => (
                        <div key={friend.id} className="fb-card overflow-hidden flex flex-col border border-slate-200 dark:border-transparent transition-all hover:shadow-md">
                          <Link href={`/profile/${friend.id}`} className="block relative w-full aspect-[3/4] overflow-hidden bg-slate-100 bg-[#e4e6eb] dark:bg-[#3a3b3c]">
                            <OptimizedAvatar
                              src={friend.profile?.avatarUrl}
                              alt={friend.profile?.displayName || 'Avatar'}
                              fill
                              square
                              className="rounded-none hover:scale-[1.03] transition-transform duration-200"
                            />
                          </Link>
                          <div className="p-3 flex flex-col gap-3 flex-1 justify-between">
                            <div>
                              <Link href={`/profile/${friend.id}`} className="text-[13px] font-bold text-slate-800 dark:text-slate-100 truncate hover:underline block leading-snug">
                                {friend.profile?.displayName}
                              </Link>
                              <p className="text-[10px] text-slate-500 truncate mt-0.5">{friend.profile?.bio || 'Đang hoạt động'}</p>
                            </div>
                            <div className="flex flex-col gap-1.5 mt-2">
                              <button
                                onClick={(e) => handleMessage(e, friend.id)}
                                className="w-full py-1.5 bg-[#1877f2] hover:bg-[#166fe5] text-white font-bold rounded-lg text-[11px] flex items-center justify-center gap-1 transition-colors"
                              >
                                <MessageSquare className="w-3.5 h-3.5" /> Nhắn tin
                              </button>
                              <button
                                onClick={() => handleUnfriend(friend.id)}
                                className="w-full py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-white rounded-lg border border-red-200 dark:border-red-900/35 font-bold text-[11px] flex items-center justify-center gap-1 transition-colors"
                              >
                                <UserMinus className="w-3.5 h-3.5" /> Hủy kết bạn
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </Layout>
  );
}
