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
      <div className="max-w-[680px] mx-auto flex flex-col gap-5">
        {/* Header toolbar */}
        <div className="fb-card p-4.5 flex justify-between items-center gap-4">
          <div className="flex border-b border-slate-200 dark:border-[#3e4042] flex-1">
            {[
              { type: 'joined', label: `Nhóm của tôi (${joinedGroups.length})` },
              { type: 'explore', label: `Khám phá (${exploreGroups.length})` },
            ].map((tab) => (
              <button
                key={tab.type}
                onClick={() => setActiveTab(tab.type as any)}
                className={`py-3.5 px-6 text-sm font-semibold relative transition-all ${
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

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4.5 py-2.5 bg-[#1877f2] hover:bg-[#166fe5] text-white font-semibold rounded-lg text-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Tạo nhóm
          </button>
        </div>

        {/* Tab contents list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-brand-500 animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {activeTab === 'joined' && (
              joinedGroups.length === 0 ? (
                <div className="fb-card p-12 text-center text-slate-500">
                  Bạn chưa tham gia nhóm nào. Hãy khám phá các nhóm bên dưới!
                </div>
              ) : (
                joinedGroups.map((group) => (
                  <div key={group.id} className="fb-card p-4.5 flex items-center justify-between gap-4">
                    <Link href={`/groups/${group.id}`} className="flex items-center gap-3.5 min-w-0">
                      <OptimizedAvatar
                        src={group.avatarUrl}
                        alt={group.name}
                        size={56}
                        className="w-14 h-14 rounded-2xl object-cover border border-slate-800"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{group.name}</p>
                        <p className="text-xs text-slate-500 leading-snug truncate mt-0.5">{group.description || 'Chào mừng'}</p>
                      </div>
                    </Link>
                    <Link
                      href={`/groups/${group.id}`}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-[#3a3b3c] dark:hover:bg-[#4a4b4d] text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-all flex-shrink-0"
                    >
                      Xem nhóm
                    </Link>
                  </div>
                ))
              )
            )}

            {activeTab === 'explore' && (
              exploreGroups.length === 0 ? (
                <div className="fb-card p-12 text-center text-slate-500">
                  Không có nhóm mới để khám phá.
                </div>
              ) : (
                exploreGroups.map((group) => (
                  <div key={group.id} className="fb-card p-4.5 flex items-center justify-between gap-4">
                    <Link href={`/groups/${group.id}`} className="flex items-center gap-3.5 min-w-0">
                      <OptimizedAvatar
                        src={group.avatarUrl}
                        alt={group.name}
                        size={56}
                        className="w-14 h-14 rounded-2xl object-cover border border-slate-800"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{group.name}</p>
                          {group.privacy === 'PUBLIC' ? (
                            <Globe className="w-3.5 h-3.5 text-slate-500" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-slate-500" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 leading-snug truncate mt-0.5">{group.description || 'Chào mừng'}</p>
                      </div>
                    </Link>
                    <button
                      onClick={() => handleJoin(group.id)}
                      className="px-4.5 py-2.5 bg-[#1877f2] hover:bg-[#166fe5] text-white font-semibold rounded-lg text-xs transition-all flex-shrink-0"
                    >
                      Tham gia
                    </button>
                  </div>
                ))
              )
            )}
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md fb-card p-6 flex flex-col gap-5">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-[#3e4042] pb-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Tạo nhóm mới</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-[#3a3b3c] rounded-lg text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500">Tên nhóm</label>
                <input
                  type="text"
                  placeholder="VD: Nhóm thiết kế"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="glass-input w-full px-3.5 py-2 rounded-xl text-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500">Mô tả</label>
                <textarea
                  placeholder="Nhóm này nói về điều gì?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="glass-input w-full px-3.5 py-2 rounded-xl text-sm resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500">Quyền riêng tư</label>
                <select
                  value={privacy}
                  onChange={(e) => setPrivacy(e.target.value as any)}
                  className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm"
                >
                  <option value="PUBLIC">Công khai (Ai cũng có thể tham gia)</option>
                  <option value="PRIVATE">Riêng tư (Cần duyệt thành viên)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 bg-[#1877f2] hover:bg-[#166fe5] text-white font-semibold rounded-xl text-sm transition-all"
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
