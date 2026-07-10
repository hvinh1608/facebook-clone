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
    <div className="max-w-[680px] mx-auto flex flex-col gap-5">
      <div className="fb-card p-4 flex items-center gap-3">
        <Search className="w-5 h-5 text-[#1877f2]" />
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          Kết quả cho &quot;<span className="font-bold">{query}</span>&quot;
        </h2>
      </div>

      <div className="fb-card overflow-hidden">
        <div className="flex border-b border-slate-200 dark:border-[#3e4042]">
          {[
            { type: 'users' as const, label: `Mọi người (${userResults.length})`, icon: Users },
            { type: 'groups' as const, label: `Nhóm (${groupResults.length})`, icon: UsersRound },
            { type: 'posts' as const, label: `Bài viết (${postResults.length})`, icon: Compass },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.type}
                type="button"
                onClick={() => setActiveTab(tab.type)}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold relative transition-all ${
                  activeTab === tab.type ? 'text-[#1877f2]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {activeTab === tab.type && (
                  <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#1877f2] rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#1877f2] animate-spin" />
        </div>
      ) : activeTab === 'users' ? (
        <div className="flex flex-col gap-3">
          {userResults.length === 0 ? (
            <div className="fb-card p-12 text-center rounded-xl text-slate-500 flex flex-col items-center gap-2">
              <Compass className="w-10 h-10 text-slate-400 stroke-1" />
              <p className="text-sm">Không tìm thấy người dùng phù hợp.</p>
            </div>
          ) : (
            userResults.map((res) => (
              <div key={res.id} className="fb-card p-4 flex items-center justify-between gap-4">
                <Link href={`/profile/${res.id}`} className="flex items-center gap-3.5 min-w-0">
                  <OptimizedAvatar
                    src={res.profile?.avatarUrl}
                    alt={res.profile?.displayName}
                    size={48}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{res.profile?.displayName}</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{res.profile?.bio || 'Đang hoạt động'}</p>
                  </div>
                </Link>
                <Link
                  href={`/profile/${res.id}`}
                  className="px-4 py-2 bg-[#1877f2] hover:bg-[#166fe5] text-white rounded-lg text-xs font-semibold transition-all flex-shrink-0"
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
            <div className="fb-card p-12 text-center rounded-xl text-slate-500 flex flex-col items-center gap-2">
              <Compass className="w-10 h-10 text-slate-400 stroke-1" />
              <p className="text-sm">Không tìm thấy nhóm phù hợp.</p>
            </div>
          ) : (
            groupResults.map((group) => (
              <div key={group.id} className="fb-card p-4 flex items-center justify-between gap-4">
                <Link href={`/groups/${group.id}`} className="flex items-center gap-3.5 min-w-0">
                  <OptimizedAvatar
                    src={group.avatarUrl}
                    alt={group.name}
                    size={48}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{group.name}</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {group._count?.members ?? 0} thành viên · {group.privacy === 'PUBLIC' ? 'Công khai' : 'Riêng tư'}
                    </p>
                  </div>
                </Link>
                <Link
                  href={`/groups/${group.id}`}
                  className="px-4 py-2 bg-[#1877f2] hover:bg-[#166fe5] text-white rounded-lg text-xs font-semibold transition-all flex-shrink-0"
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
            <div className="fb-card p-12 text-center text-slate-500 text-sm">Không tìm thấy bài viết công khai.</div>
          ) : (
            postResults.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </div>
      )}
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
