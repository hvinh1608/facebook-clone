'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Layout from '../../components/Layout';
import PostCard from '../../components/PostCard';
import { api } from '../../services/api';
import { resolveMediaUrl } from '../../utils/media';
import { Loader2, Play } from 'lucide-react';

export default function WatchPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  const fetchWatch = useCallback(async (reset = false) => {
    if (isLoading) return;
    if (!reset && !nextCursor && hasInitialized) return;
    setIsLoading(true);
    try {
      const cursor = reset ? '' : nextCursor || '';
      const res = await api.get(`/posts/watch?limit=10&cursor=${cursor}`);
      if (res.data?.status === 'success') {
        const { posts: incoming, nextCursor: newCursor } = res.data.data;
        setPosts((prev) => {
          const merged = reset ? incoming : [...prev, ...incoming.filter((p: any) => !prev.some((x) => x.id === p.id))];
          if (!activeId && merged[0]) setActiveId(merged[0].id);
          return merged;
        });
        setNextCursor(newCursor);
        setHasInitialized(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeId, hasInitialized, isLoading, nextCursor]);

  useEffect(() => { if (!hasInitialized) fetchWatch(true); }, [fetchWatch, hasInitialized]);

  useEffect(() => {
    if (!nextCursor || isLoading) return;

    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchWatch(false);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
      observer.disconnect();
    };
  }, [fetchWatch, nextCursor, isLoading]);

  const activePost = posts.find((p) => p.id === activeId) || posts[0];

  return (
    <Layout>
      <div className="flex w-full min-h-[calc(100vh-56px)] bg-[#f0f2f5] dark:bg-[#18191a]">
        {/* Left Sidebar (Watch Menu & Video List) */}
        <aside className="w-full md:w-[360px] border-r border-slate-200 dark:border-[#3e4042] bg-white dark:bg-[#242526] flex flex-col flex-shrink-0 h-[calc(100vh-56px)] sticky top-14 overflow-y-auto">
          <div className="p-4 border-b border-slate-150 dark:border-[#3e4042] flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Play className="w-6 h-6 text-[#1877f2] fill-[#1877f2]" />
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Watch</h1>
            </div>
            {/* Search Box */}
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm video..."
                className="w-full px-4 py-2 bg-[#f0f2f5] dark:bg-[#3a3b3c] border-0 rounded-full text-xs focus:outline-none dark:text-white placeholder-slate-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5">
            <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 px-2 uppercase tracking-wide my-1">Video gợi ý</h2>
            {posts.length === 0 ? (
              <p className="text-center text-xs text-slate-500 py-10">Không tìm thấy video nào.</p>
            ) : (
              posts.map((post) => {
                const thumb = post.media?.find((m: any) => m.type === 'VIDEO');
                if (!thumb) return null;
                const isSelected = activeId === post.id;
                return (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => setActiveId(post.id)}
                    className={`w-full p-2 text-left flex gap-3 rounded-xl transition-all duration-150 ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/20 text-[#1877f2] font-semibold'
                        : 'hover:bg-slate-100 dark:hover:bg-[#3a3b3c] text-slate-800 dark:text-[#e4e6eb]'
                    }`}
                  >
                    <div className="w-28 h-16 bg-black rounded-lg overflow-hidden flex-shrink-0 relative shadow-sm border border-slate-200 dark:border-transparent">
                      <video src={resolveMediaUrl(thumb.url)} muted className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                        <Play className="w-5 h-5 text-white opacity-80 fill-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <p className="text-xs font-bold line-clamp-2 leading-tight">
                        {post.content || 'Video không có mô tả'}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                        {post.author?.profile?.displayName}
                      </p>
                    </div>
                  </button>
                );
              })
            )}

            <div ref={observerTarget} className="py-4 flex items-center justify-center border-t border-slate-100 dark:border-[#3e4042]/50 mt-4">
              {isLoading ? (
                <Loader2 className="w-5 h-5 text-[#1877f2] animate-spin" />
              ) : (
                !nextCursor && posts.length > 0 && (
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                    Hết video đề xuất
                  </span>
                )
              )}
            </div>
          </div>
        </aside>

        {/* Right Main Content (Active Video Post Card) */}
        <main className="flex-1 min-w-0 p-4 md:p-6 overflow-y-auto flex justify-center items-start h-[calc(100vh-56px)]">
          <div className="w-full max-w-[680px] flex flex-col gap-4">
            {activePost ? (
              <PostCard post={activePost} />
            ) : (
              <div className="fb-card p-12 text-center my-auto flex flex-col items-center gap-3">
                <Play className="w-12 h-12 text-slate-350 stroke-1" />
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Không có video để hiển thị</h3>
                <p className="text-xs text-slate-500 max-w-xs leading-normal">
                  Vui lòng tải thêm hoặc chọn một video từ cột bên trái.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </Layout>
  );
}
