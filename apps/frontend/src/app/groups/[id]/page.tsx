'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '../../../components/Layout';
import PostCard from '../../../components/PostCard';
import PostCreator from '../../../components/PostCreator';
import { api } from '../../../services/api';
import { resolveAvatarUrl, resolveGroupAvatarUrl, resolveGroupCoverUrl } from '../../../utils/avatar';
import { useAuthStore } from '../../../store/authStore';
import { Globe, Lock, Users, Camera, RefreshCw, Check, X, Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function GroupDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;
  const { user: currentUser } = useAuthStore();

  const [group, setGroup] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  
  const [activeTab, setActiveTab] = useState<'posts' | 'members' | 'requests'>('posts');
  const [isLoading, setIsLoading] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const fetchGroupData = async () => {
    try {
      setIsLoading(true);
      const groupRes = await api.get(`/groups/${groupId}`);
      if (groupRes.data?.status === 'success') {
        setGroup(groupRes.data.data.group);
      }

      // Fetch group posts
      try {
        const postsRes = await api.get(`/groups/${groupId}/posts`);
        if (postsRes.data?.status === 'success') {
          setPosts(postsRes.data.data);
        }
      } catch (err) {
        console.log('Posts hidden (Private Group or Not Member)');
      }

      // Fetch group members
      const membersRes = await api.get(`/groups/${groupId}/members`);
      if (membersRes.data?.status === 'success') {
        setMembers(membersRes.data.data);
      }

      // Fetch pending requests if admin
      const isMyMembershipAdmin = groupRes.data.data.group.myMembership?.role === 'ADMIN';
      if (isMyMembershipAdmin) {
        const pendingRes = await api.get(`/groups/${groupId}/pending`);
        if (pendingRes.data?.status === 'success') {
          setPendingRequests(pendingRes.data.data);
        }
      }
    } catch (e) {
      console.error(e);
      router.push('/groups');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) {
      fetchGroupData();
    }
  }, [groupId]);

  const handleJoinLeave = async () => {
    if (!group) return;
    const isMember = !!group.myMembership;

    try {
      if (isMember) {
        if (window.confirm('Bạn có chắc muốn rời nhóm này?')) {
          await api.post(`/groups/${groupId}/leave`);
          fetchGroupData();
        }
      } else {
        await api.post(`/groups/${groupId}/join`);
        fetchGroupData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleApprove = async (targetUserId: string) => {
    try {
      await api.post(`/groups/${groupId}/approve/${targetUserId}`);
      setPendingRequests((prev) => prev.filter((r) => r.id !== targetUserId));
      fetchGroupData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDecline = async (targetUserId: string) => {
    try {
      await api.delete(`/groups/${groupId}/decline/${targetUserId}`);
      setPendingRequests((prev) => prev.filter((r) => r.id !== targetUserId));
      fetchGroupData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', 'cover');
    try {
      const res = await api.put(`/groups/${groupId}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.status === 'success') {
        setGroup((prev: any) => ({ ...prev, coverUrl: res.data.data.coverUrl }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveMember = async (targetUserId: string) => {
    if (!window.confirm('Xóa thành viên này khỏi nhóm?')) return;
    try {
      await api.delete(`/groups/${groupId}/remove/${targetUserId}`);
      fetchGroupData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateRole = async (targetUserId: string, role: 'ADMIN' | 'MEMBER') => {
    try {
      await api.put(`/groups/${groupId}/members/${targetUserId}/role`, { role });
      fetchGroupData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', 'avatar');

    try {
      const res = await api.put(`/groups/${groupId}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.status === 'success') {
        setGroup((prev: any) => ({ ...prev, avatarUrl: res.data.data.avatarUrl }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <RefreshCw className="w-10 h-10 text-brand-500 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!group) return null;

  const isApprovedMember = group.myMembership?.status === 'APPROVED';
  const isAdmin = group.myMembership?.role === 'ADMIN' && isApprovedMember;
  const isPending = group.myMembership?.status === 'PENDING';
  
  const coverUrl = resolveGroupCoverUrl(group.coverUrl);
  const avatarUrl = resolveGroupAvatarUrl(group.avatarUrl);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto flex flex-col gap-6 p-4">
        {/* Back navigation */}
        <div className="flex items-center gap-2">
          <Link href="/groups" className="p-1.5 hover:bg-slate-250 dark:hover:bg-[#3a3b3c] rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors">
            <ArrowLeft className="w-4.5 h-4.5" />
          </Link>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Quay lại Nhóm</span>
        </div>

        <div className="fb-card rounded-2xl overflow-hidden border border-slate-200 dark:border-[#3e4042] bg-white dark:bg-[#242526] relative shadow-sm">
          <div className="h-44 md:h-56 bg-slate-200 dark:bg-slate-950 relative group/cover">
            <img src={coverUrl} alt="Ảnh bìa nhóm" className="w-full h-full object-cover" />
            {isAdmin && (
              <button
                onClick={() => coverInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/cover:opacity-100 transition-opacity text-white gap-2"
              >
                <Camera className="w-5 h-5" />
                <span className="text-xs font-semibold">Đổi ảnh bìa</span>
                <input type="file" ref={coverInputRef} onChange={handleCoverChange} className="hidden" accept="image/*" />
              </button>
            )}
          </div>

          <div className="p-6 pt-0 flex flex-col md:flex-row items-center md:items-end justify-between gap-4 -mt-10 md:-mt-12 relative z-10 px-6 pb-4">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-4 text-center md:text-left">
              <div className="relative group flex-shrink-0">
                <img
                  src={avatarUrl}
                  alt={group.name}
                  className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover border-4 border-white dark:border-[#242526] shadow-md bg-slate-100 dark:bg-[#18191a]"
                />
                {isAdmin && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                  >
                    <Camera className="w-5 h-5" />
                    <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
                  </button>
                )}
              </div>

              <div>
                <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white">{group.name}</h2>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-1.5 text-xs text-slate-505 dark:text-slate-400 font-semibold">
                  <span className="flex items-center gap-1.5 uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {group.privacy === 'PUBLIC' ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    {group.privacy === 'PUBLIC' ? 'Nhóm công khai' : 'Nhóm riêng tư'}
                  </span>
                  <span>•</span>
                  <span>{group._count.members} thành viên</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={handleJoinLeave}
                className={`px-5 py-2.5 font-bold rounded-xl text-xs transition-all ${
                  isApprovedMember
                    ? 'bg-slate-100 hover:bg-slate-200 dark:bg-[#3a3b3c] dark:hover:bg-[#4a4b4d] text-slate-700 dark:text-slate-200'
                    : isPending
                    ? 'bg-blue-50 dark:bg-blue-950/20 text-[#1877f2] border border-blue-200 dark:border-blue-900/30'
                    : 'bg-[#1877f2] hover:bg-[#166fe5] text-white'
                }`}
              >
                {isApprovedMember ? 'Rời nhóm' : isPending ? 'Đang chờ duyệt' : 'Tham gia nhóm'}
              </button>
            </div>
          </div>

          {/* Group view Tabs navigation */}
          <div className="flex border-t border-slate-150 dark:border-[#3e4042] bg-slate-50/50 dark:bg-black/5 px-4">
            <button
              onClick={() => setActiveTab('posts')}
              className={`px-5 py-4 text-xs font-semibold uppercase tracking-wider relative transition-all ${
                activeTab === 'posts' ? 'text-[#1877f2] font-bold border-b-2 border-[#1877f2]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-750 dark:hover:text-slate-200'
              }`}
            >
              Bài viết
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`px-5 py-4 text-xs font-semibold uppercase tracking-wider relative transition-all ${
                activeTab === 'members' ? 'text-[#1877f2] font-bold border-b-2 border-[#1877f2]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-750 dark:hover:text-slate-200'
              }`}
            >
              Thành viên ({members.length})
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab('requests')}
                className={`px-5 py-4 text-xs font-semibold uppercase tracking-wider relative transition-all ${
                  activeTab === 'requests' ? 'text-[#1877f2] font-bold border-b-2 border-[#1877f2]' : 'text-slate-505 dark:text-slate-400 hover:text-slate-750 dark:hover:text-slate-200'
                }`}
              >
                Yêu cầu ({pendingRequests.length})
              </button>
            )}
          </div>
        </div>

        {/* Tab content renderer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Intro card widget */}
          <div className="flex flex-col gap-4 md:col-span-1">
            <div className="fb-card p-5 rounded-2xl flex flex-col gap-3 bg-white dark:bg-[#242526]">
              <h3 className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider border-b border-slate-100 dark:border-[#3e4042]/50 pb-2">Giới thiệu</h3>
              <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">{group.description || 'Chào mừng đến với nhóm của chúng tôi!'}</p>
            </div>
          </div>

          {/* Core dynamic content grid */}
          <div className="flex flex-col gap-4 md:col-span-2">
            {activeTab === 'posts' && (
              <div className="flex flex-col gap-4">
                {isApprovedMember ? (
                  <PostCreator groupId={groupId} />
                ) : (
                  !isPending && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/10 border border-blue-200 dark:border-blue-900/30 rounded-2xl text-xs text-[#1877f2] text-center font-semibold">
                      Tham gia nhóm để đăng bài và thảo luận.
                    </div>
                  )
                )}

                {/* Posts List */}
                {group.privacy === 'PRIVATE' && !isApprovedMember ? (
                  <div className="fb-card p-12 text-center rounded-2xl bg-white dark:bg-[#242526] border border-slate-200 dark:border-[#3e4042]">
                    <Lock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">Nhóm riêng tư. Chỉ thành viên được duyệt mới xem được bài viết.</p>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="fb-card p-12 text-center rounded-2xl bg-white dark:bg-[#242526] border border-slate-200 dark:border-[#3e4042]">
                    <p className="text-xs text-slate-500">Chưa có bài viết nào trong nhóm.</p>
                  </div>
                ) : (
                  posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))
                )}
              </div>
            )}

            {activeTab === 'members' && (
              <div className="fb-card p-5 rounded-2xl bg-white dark:bg-[#242526] border border-slate-200 dark:border-[#3e4042] grid grid-cols-1 sm:grid-cols-2 gap-4">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-2.5 hover:bg-slate-50 dark:hover:bg-[#3a3b3c] rounded-xl border border-slate-100 dark:border-[#3e4042]/50 transition-all">
                    <Link href={`/profile/${member.id}`} className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={resolveAvatarUrl(member.profile?.avatarUrl)}
                        alt={member.profile?.displayName}
                        className="w-9 h-9 rounded-full object-cover"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{member.profile?.displayName}</p>
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold block">
                          {member.role === 'ADMIN' ? 'Quản trị' : 'Thành viên'}
                        </span>
                      </div>
                    </Link>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {member.role === 'ADMIN' && <Shield className="w-3.5 h-3.5 text-amber-500" />}
                      {isAdmin && member.id !== currentUser?.id && (
                        <>
                          {member.role !== 'ADMIN' ? (
                            <button onClick={() => handleUpdateRole(member.id, 'ADMIN')} className="text-[10px] px-2 py-1 text-[#1877f2] hover:bg-[#e7f3ff] rounded font-semibold">
                              Thăng QTV
                            </button>
                          ) : (
                            <button onClick={() => handleUpdateRole(member.id, 'MEMBER')} className="text-[10px] px-2 py-1 text-slate-500 hover:bg-slate-800 rounded font-semibold">
                              Hạ quyền
                            </button>
                          )}
                          <button onClick={() => handleRemoveMember(member.id)} className="text-[10px] px-2 py-1 text-red-500 hover:bg-red-950/30 rounded font-semibold">
                            Xóa
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'requests' && isAdmin && (
              <div className="flex flex-col gap-3.5">
                {pendingRequests.length === 0 ? (
                  <div className="fb-card p-12 text-center rounded-2xl text-slate-500 border border-slate-200 dark:border-[#3e4042]">
                    Chưa có yêu cầu tham gia.
                  </div>
                ) : (
                  pendingRequests.map((req) => (
                    <div key={req.id} className="fb-card p-4 rounded-2xl bg-white dark:bg-[#242526] border border-slate-200 dark:border-[#3e4042] flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={resolveAvatarUrl(req.profile?.avatarUrl)}
                          alt={req.profile?.displayName}
                          className="w-11 h-11 rounded-full object-cover"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{req.profile?.displayName}</p>
                          <span className="text-[10px] text-slate-500 block mt-0.5">Yêu cầu {new Date(req.requestedAt).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleApprove(req.id)}
                          className="flex items-center justify-center p-2 bg-green-600/20 hover:bg-green-600 text-green-500 hover:text-white rounded-xl transition-all"
                          title="Duyệt"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDecline(req.id)}
                          className="flex items-center justify-center p-2 bg-red-100 hover:bg-red-600 text-red-500 hover:text-white rounded-xl transition-all"
                          title="Từ chối"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
