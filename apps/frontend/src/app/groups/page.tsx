'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { api } from '../../services/api';
import { Plus, X, Globe, Lock, RefreshCw } from 'lucide-react';
import OptimizedAvatar from '../../components/OptimizedAvatar';

export default function GroupsPage() {
  const [joinedGroups, setJoinedGroups] = useState<any[]>([]);
  const [exploreGroups, setExploreGroups] = useState<any[]>([]);
  
  const [activeTab, setActiveTab] = useState<'joined' | 'explore'>('joined');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Group creation inputs
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const joinedRes = await api.get('/groups/joined');
      if (joinedRes.data?.status === 'success') {
        setJoinedGroups(joinedRes.data.data);
      }

      const exploreRes = await api.get('/groups/explore');
      if (exploreRes.data?.status === 'success') {
        setExploreGroups(exploreRes.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const res = await api.post('/groups', { name, description, privacy });
      if (res.data?.status === 'success') {
        setShowCreateModal(false);
        setName('');
        setDescription('');
        setPrivacy('PUBLIC');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoin = async (groupId: string) => {
    try {
      const res = await api.post(`/groups/${groupId}/join`);
      if (res.data?.status === 'success') {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Layout>
      <div className="flex w-full min-h-[calc(100vh-56px)] bg-[#f0f2f5] dark:bg-[#18191a]">
        {/* Left Sidebar Menu */}
        <aside className="w-full md:w-[360px] border-r border-slate-200 dark:border-[#3e4042] bg-white dark:bg-[#242526] flex flex-col flex-shrink-0 h-[calc(100vh-56px)] sticky top-14 overflow-y-auto">
          <div className="p-4 border-b border-slate-150 dark:border-[#3e4042] flex flex-col gap-3">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Nhóm</h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full py-2.5 bg-blue-50 hover:bg-blue-100/80 dark:bg-blue-950/20 dark:hover:bg-blue-900/30 text-[#1877f2] font-bold rounded-lg text-sm transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4.5 h-4.5" /> Tạo nhóm mới
            </button>
          </div>

          <div className="flex-1 p-2 flex flex-col gap-1">
            {[
              { type: 'joined', label: 'Nhóm của tôi', count: joinedGroups.length },
              { type: 'explore', label: 'Khám phá nhóm', count: exploreGroups.length },
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
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#3a3b3c] text-slate-600 dark:text-slate-350">
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
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {activeTab === 'joined' ? 'Nhóm của bạn' : 'Khám phá nhóm mới'}
              </h2>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <RefreshCw className="w-8 h-8 text-[#1877f2] animate-spin" />
              </div>
            ) : (
              <>
                {/* 1. Nhóm của tôi */}
                {activeTab === 'joined' && (
                  joinedGroups.length === 0 ? (
                    <div className="fb-card p-12 text-center text-slate-500">
                      Bạn chưa tham gia nhóm nào. Hãy chuyển sang Khám phá để tìm kiếm nhóm mới!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {joinedGroups.map((group) => (
                        <div key={group.id} className="fb-card overflow-hidden flex flex-col border border-slate-200 dark:border-transparent transition-all hover:shadow-md">
                          {/* Simulated cover header */}
                          <div className="h-24 bg-gradient-to-r from-blue-450 to-indigo-500 dark:from-blue-900 dark:to-indigo-950 rounded-t-xl relative flex-shrink-0">
                            {/* Group Avatar positioned overlay */}
                            <div className="absolute -bottom-6 left-4">
                              <OptimizedAvatar
                                src={group.avatarUrl}
                                alt={group.name}
                                size={56}
                                square
                                className="w-14 h-14 rounded-xl border-4 border-white dark:border-[#242526] shadow-md object-cover bg-white"
                              />
                            </div>
                          </div>

                          <div className="p-4 pt-8 flex flex-col gap-3.5 flex-1 justify-between bg-white dark:bg-[#242526]">
                            <div>
                              <div className="flex items-center gap-1.5 min-w-0">
                                <Link href={`/groups/${group.id}`} className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate hover:underline block leading-tight">
                                  {group.name}
                                </Link>
                                {group.privacy === 'PUBLIC' ? (
                                  <Globe className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                ) : (
                                  <Lock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-normal">
                                {group.description || 'Không có mô tả cho nhóm này.'}
                              </p>
                            </div>

                            <div className="mt-2 flex items-center justify-between border-t border-slate-100 dark:border-[#3e4042]/50 pt-3">
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                                {group._count?.members || 1} thành viên
                              </span>
                              <Link
                                href={`/groups/${group.id}`}
                                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#3a3b3c] dark:hover:bg-[#4a4b4d] text-slate-700 dark:text-slate-200 font-bold rounded-lg text-[11px] transition-colors"
                              >
                                Xem nhóm
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}

                {/* 2. Khám phá nhóm */}
                {activeTab === 'explore' && (
                  exploreGroups.length === 0 ? (
                    <div className="fb-card p-12 text-center text-slate-500">
                      Không có nhóm mới nào để khám phá.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {exploreGroups.map((group) => (
                        <div key={group.id} className="fb-card overflow-hidden flex flex-col border border-slate-200 dark:border-transparent transition-all hover:shadow-md">
                          {/* Simulated cover header */}
                          <div className="h-24 bg-gradient-to-r from-emerald-400 to-teal-500 dark:from-emerald-950 dark:to-teal-950 rounded-t-xl relative flex-shrink-0">
                            {/* Group Avatar positioned overlay */}
                            <div className="absolute -bottom-6 left-4">
                              <OptimizedAvatar
                                src={group.avatarUrl}
                                alt={group.name}
                                size={56}
                                square
                                className="w-14 h-14 rounded-xl border-4 border-white dark:border-[#242526] shadow-md object-cover bg-white"
                              />
                            </div>
                          </div>

                          <div className="p-4 pt-8 flex flex-col gap-3.5 flex-1 justify-between bg-white dark:bg-[#242526]">
                            <div>
                              <div className="flex items-center gap-1.5 min-w-0">
                                <Link href={`/groups/${group.id}`} className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate hover:underline block leading-tight">
                                  {group.name}
                                </Link>
                                {group.privacy === 'PUBLIC' ? (
                                  <Globe className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                ) : (
                                  <Lock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-normal">
                                {group.description || 'Chào mừng các thành viên mới gia nhập nhóm.'}
                              </p>
                            </div>

                            <div className="mt-2 flex items-center justify-between border-t border-slate-100 dark:border-[#3e4042]/50 pt-3">
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                                {group._count?.members || 1} thành viên
                              </span>
                              <button
                                onClick={() => handleJoin(group.id)}
                                className="px-3.5 py-1.5 bg-[#1877f2] hover:bg-[#166fe5] text-white font-bold rounded-lg text-[11px] transition-colors"
                              >
                                Tham gia
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

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md fb-card p-6 flex flex-col gap-5 bg-white dark:bg-[#242526]">
            <div className="flex justify-between items-center border-b border-slate-150 dark:border-[#3e4042] pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Tạo nhóm mới</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#3a3b3c] rounded-full text-slate-500 dark:text-slate-400">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tên nhóm</label>
                <input
                  type="text"
                  placeholder="VD: Nhóm thiết kế"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-[#f0f2f5] dark:bg-[#3a3b3c] border-0 rounded-xl text-sm focus:outline-none dark:text-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Mô tả</label>
                <textarea
                  placeholder="Nhóm này nói về điều gì?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-[#f0f2f5] dark:bg-[#3a3b3c] border-0 rounded-xl text-sm focus:outline-none dark:text-white resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Quyền riêng tư</label>
                <select
                  value={privacy}
                  onChange={(e) => setPrivacy(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-[#f0f2f5] dark:bg-[#3a3b3c] border-0 rounded-xl text-sm focus:outline-none dark:text-white"
                >
                  <option value="PUBLIC">Công khai (Ai cũng có thể tham gia)</option>
                  <option value="PRIVATE">Riêng tư (Cần duyệt thành viên)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 bg-[#1877f2] hover:bg-[#166fe5] text-white font-bold rounded-xl text-sm transition-all"
              >
                Tạo nhóm
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
