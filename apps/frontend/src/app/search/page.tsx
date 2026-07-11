'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { api } from '../../services/api';
import { Search, Compass, Loader2, Users, UsersRound } from 'lucide-react';
import PostCard from '../../components/PostCard';
import OptimizedAvatar from '../../components/OptimizedAvatar';

interface SearchUserResult {
  id: string;
  email: string;
  profile: {
    displayName: string;
    avatarUrl: string | null;
    bio: string | null;
  } | null;
}

interface SearchGroupResult {
  id: string;
  name: string;
  description: string | null;
  privacy: string;
  avatarUrl: string | null;
  _count?: { members: number };
}

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q');

  const [activeTab, setActiveTab] = useState<'users' | 'groups' | 'posts'>('users');
  const [userResults, setUserResults] = useState<SearchUserResult[]>([]);
  const [groupResults, setGroupResults] = useState<SearchGroupResult[]>([]);
  const [postResults, setPostResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query) return;

    const performSearch = async () => {
      try {
        setIsLoading(true);
        const [usersRes, groupsRes, postsRes] = await Promise.all([
          api.get(`/users/search?q=${encodeURIComponent(query)}`),
          api.get(`/groups/search?q=${encodeURIComponent(query)}`),
          api.get(`/posts/search?q=${encodeURIComponent(query)}`),
        ]);

        if (usersRes.data?.status === 'success') {
          setUserResults(usersRes.data.data);
        }
        if (groupsRes.data?.status === 'success') {
          setGroupResults(groupsRes.data.data);
        }
        if (postsRes.data?.status === 'success') {
          setPostResults(postsRes.data.data);
        }
      } catch (e) {
        console.error('Error during search', e);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [query]);

  return (
    <div className="flex w-full min-h-[calc(100vh-56px)] bg-[#f0f2f5] dark:bg-[#18191a]">
      {/* Left Sidebar Filters */}
      <aside className="w-full md:w-[360px] border-r border-slate-200 dark:border-[#3e4042] bg-white dark:bg-[#242526] flex flex-col flex-shrink-0 h-[calc(100vh-56px)] sticky top-14 overflow-y-auto">
        <div className="p-4 border-b border-slate-150 dark:border-[#3e4042] flex flex-col gap-3">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Bộ lọc tìm kiếm</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Kết quả cho &quot;<span className="font-bold text-slate-700 dark:text-slate-300">{query}</span>&quot;
          </p>
        </div>

        <div className="flex-1 p-2 flex flex-col gap-1">
          {[
            { type: 'users' as const, label: 'Mọi người', count: userResults.length, icon: Users },
            { type: 'groups' as const, label: 'Nhóm', count: groupResults.length, icon: UsersRound },
            { type: 'posts' as const, label: 'Bài viết', count: postResults.length, icon: Compass },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.type;
            return (
              <button
                key={tab.type}
                type="button"
                onClick={() => setActiveTab(tab.type)}
                className={`w-full p-3 text-left flex items-center justify-between rounded-xl transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/20 text-[#1877f2] font-semibold'
                    : 'hover:bg-slate-100 dark:hover:bg-[#3a3b3c] text-slate-800 dark:text-[#e4e6eb]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-[#1877f2]' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span className="text-sm">{tab.label}</span>
                </div>
                {tab.count > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#3a3b3c] text-slate-600 dark:text-slate-350">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </aside>

      {/* Right Content Area */}
      <main className="flex-1 min-w-0 p-6 overflow-y-auto h-[calc(100vh-56px)] flex justify-center items-start">
        <div className="w-full max-w-[680px] flex flex-col gap-4">
          {/* Mobile Tab bar only */}
          <div className="fb-card overflow-hidden md:hidden bg-white dark:bg-[#242526]">
            <div className="flex border-b border-slate-200 dark:border-[#3e4042]">
              {[
                { type: 'users' as const, label: `Mọi người (${userResults.length})` },
                { type: 'groups' as const, label: `Nhóm (${groupResults.length})` },
                { type: 'posts' as const, label: `Bài viết (${postResults.length})` },
              ].map((tab) => (
                <button
                  key={tab.type}
                  type="button"
                  onClick={() => setActiveTab(tab.type)}
                  className={`flex-1 py-3 text-xs font-semibold relative transition-all ${
                    activeTab === tab.type ? 'text-[#1877f2]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.type && (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#1877f2] rounded-t-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-[#1877f2] animate-spin" />
            </div>
          ) : activeTab === 'users' ? (
            <div className="flex flex-col gap-3">
              {userResults.length === 0 ? (
                <div className="fb-card p-12 text-center rounded-xl text-slate-500 flex flex-col items-center gap-2 bg-white dark:bg-[#242526] border border-slate-200 dark:border-[#3e4042]">
                  <Compass className="w-10 h-10 text-slate-400 stroke-1" />
                  <p className="text-sm">Không tìm thấy người dùng phù hợp.</p>
                </div>
              ) : (
                userResults.map((res) => (
                  <div key={res.id} className="fb-card p-4 flex items-center justify-between gap-4 bg-white dark:bg-[#242526] border border-slate-250 dark:border-[#3e4042]/50 shadow-sm transition-all hover:shadow-md">
                    <Link href={`/profile/${res.id}`} className="flex items-center gap-3.5 min-w-0">
                      <OptimizedAvatar
                        src={res.profile?.avatarUrl}
                        alt={res.profile?.displayName}
                        size={48}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate hover:underline">{res.profile?.displayName}</p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{res.profile?.bio || 'Đang hoạt động'}</p>
                      </div>
                    </Link>
                    <Link
                      href={`/profile/${res.id}`}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#3a3b3c] dark:hover:bg-[#4a4b4d] text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-all flex-shrink-0"
                    >
                      Xem trang cá nhân
                    </Link>
                  </div>
                ))
              )}
            </div>
          ) : activeTab === 'groups' ? (
            <div className="flex flex-col gap-3">
              {groupResults.length === 0 ? (
                <div className="fb-card p-12 text-center rounded-xl text-slate-500 flex flex-col items-center gap-2 bg-white dark:bg-[#242526] border border-slate-200 dark:border-[#3e4042]">
                  <Compass className="w-10 h-10 text-slate-400 stroke-1" />
                  <p className="text-sm">Không tìm thấy nhóm phù hợp.</p>
                </div>
              ) : (
                groupResults.map((group) => (
                  <div key={group.id} className="fb-card p-4 flex items-center justify-between gap-4 bg-white dark:bg-[#242526] border border-slate-250 dark:border-[#3e4042]/50 shadow-sm transition-all hover:shadow-md">
                    <Link href={`/groups/${group.id}`} className="flex items-center gap-3.5 min-w-0">
                      <OptimizedAvatar
                        src={group.avatarUrl}
                        alt={group.name}
                        size={48}
                        className="w-12 h-12 rounded-xl object-cover"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate hover:underline">{group.name}</p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {group._count?.members ?? 0} thành viên · {group.privacy === 'PUBLIC' ? 'Công khai' : 'Riêng tư'}
                        </p>
                      </div>
                    </Link>
                    <Link
                      href={`/groups/${group.id}`}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#3a3b3c] dark:hover:bg-[#4a4b4d] text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-all flex-shrink-0"
                    >
                      Xem nhóm
                    </Link>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {postResults.length === 0 ? (
                <div className="fb-card p-12 text-center text-slate-500 text-sm bg-white dark:bg-[#242526] border border-slate-200 dark:border-[#3e4042]">Không tìm thấy bài viết công khai.</div>
              ) : (
                postResults.map((post) => <PostCard key={post.id} post={post} />)
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Layout>
      <Suspense fallback={
        <div className="max-w-[680px] mx-auto flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#1877f2] animate-spin" />
        </div>
      }>
        <SearchContent />
      </Suspense>
    </Layout>
  );
}
