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
  const mainVideoRef = useRef<HTMLVideoElement>(null);

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

  useEffect(() => {
    const v = mainVideoRef.current;
    if (!v) return;
    v.muted = true;
    v.play().catch(() => {});
  }, [activeId]);

  const activePost = posts.find((p) => p.id === activeId) || posts[0];
  const activeVideo = activePost?.media?.find((m: any) => m.type === 'VIDEO');

  return (
    <Layout>
      <div className="max-w-6xl mx-auto flex gap-4 py-2 px-2">
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          <div className="fb-card p-4 flex items-center gap-3">
            <Play className="w-5 h-5 text-[#1877f2] fill-[#1877f2]" />
            <div>
              <h1 className="text-lg font-bold">Video</h1>
              <p className="text-xs text-slate-500">Tự động phát khi xem (tắt tiếng)</p>
            </div>
          </div>

          {activeVideo && (
            <div className="fb-card overflow-hidden bg-black aspect-video">
              <video
                ref={mainVideoRef}
                key={activeVideo.url}
                src={resolveMediaUrl(activeVideo.url)}
                controls
                autoPlay
                muted
                playsInline
                className="w-full h-full object-contain"
              />
            </div>
          )}

          {activePost && <PostCard post={activePost} />}

          <div ref={observerTarget} className="py-6 flex items-center justify-center">
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="w-5 h-5 text-brand-500 animate-spin" />
                <span>Đang tải thêm...</span>
              </div>
            )}
            {!nextCursor && posts.length > 0 && (
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-600">
                Bạn đã xem hết video
              </span>
            )}
          </div>
        </div>

        <aside className="hidden lg:flex w-80 flex-col gap-2">
          <div className="fb-card p-3"><h2 className="text-sm font-bold">Video gợi ý</h2></div>
          {posts.map((post) => {
            const thumb = post.media?.find((m: any) => m.type === 'VIDEO');
            if (!thumb) return null;
            return (
              <button
                key={post.id}
                type="button"
                onClick={() => setActiveId(post.id)}
                className={`fb-card p-2 text-left flex gap-2 ${activeId === post.id ? 'ring-2 ring-[#1877f2]' : ''}`}
              >
                <div className="w-24 h-14 bg-black rounded overflow-hidden flex-shrink-0">
                  <video src={resolveMediaUrl(thumb.url)} muted className="w-full h-full object-cover" />
                </div>
                <p className="text-xs font-semibold line-clamp-2">{post.content || post.author?.profile?.displayName}</p>
              </button>
            );
          })}
        </aside>
      </div>
    </Layout>
  );
}
