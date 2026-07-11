'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Layout from '../../components/Layout';
import { api } from '../../services/api';
import { useFeedStore } from '../../store/feedStore';
import { Loader2, Heart, MessageCircle } from 'lucide-react';
import { resolveMediaUrl } from '../../utils/media';
import OptimizedAvatar from '../../components/OptimizedAvatar';

export default function ReelsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const reactPost = useFeedStore((s) => s.reactPost);

  useEffect(() => {
    api.get('/posts/watch?limit=20').then((res) => {
      if (res.data?.status === 'success') setPosts(res.data.data.posts || []);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) {
            video.muted = true;
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.6 }
    );
    videoRefs.current.forEach((v) => observer.observe(v));
    return () => observer.disconnect();
  }, [posts]);

  const setVideoRef = useCallback((id: string, el: HTMLVideoElement | null) => {
    if (el) videoRefs.current.set(id, el);
    else videoRefs.current.delete(id);
  }, []);

  const handleLike = async (post: any) => {
    await reactPost(post.id, post.hasReacted ? post.reactionType || 'LIKE' : 'LIKE');
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== post.id) return p;
        const hasReacted = !p.hasReacted;
        return {
          ...p,
          hasReacted,
          reactionType: hasReacted ? 'LIKE' : null,
          reactions: hasReacted
            ? [...(p.reactions || []), { id: 'optimistic', userId: 'me', type: 'LIKE' }]
            : (p.reactions || []).filter((r: any) => r.userId !== 'me'),
        };
      })
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#1877f2] animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div
        ref={containerRef}
        className="h-[calc(100vh-56px)] overflow-y-auto snap-y snap-mandatory scroll-smooth"
      >
        {posts.map((post) => {
          const video = post.media?.find((m: any) => m.type === 'VIDEO');
          if (!video) return null;
          return (
            <div
              key={post.id}
              className="relative h-[calc(100vh-56px)] w-full max-w-md mx-auto snap-start snap-always bg-black flex items-center justify-center"
            >
              <video
                ref={(el) => setVideoRef(post.id, el)}
                src={resolveMediaUrl(video.url)}
                className="w-full h-full object-cover"
                loop
                playsInline
                muted
                controls
                preload="metadata"
              />

              {/* Right action bar */}
              <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5 z-10">
                <button
                  type="button"
                  onClick={() => handleLike(post)}
                  className="flex flex-col items-center gap-1"
                >
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center ${
                    post.hasReacted ? 'bg-red-500/20' : 'bg-black/40'
                  }`}>
                    <Heart
                      className={`w-6 h-6 ${post.hasReacted ? 'fill-red-500 text-red-500' : 'text-white'}`}
                    />
                  </div>
                  <span className="text-white text-xs font-semibold">
                    {post.reactions?.length || 0}
                  </span>
                </button>

                <div className="flex flex-col items-center gap-1">
                  <div className="w-11 h-11 rounded-full bg-black/40 flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-white text-xs font-semibold">
                    {post._count?.comments ?? 0}
                  </span>
                </div>
              </div>

              {/* Bottom info overlay */}
              <div className="absolute bottom-0 left-0 right-14 p-4 bg-gradient-to-t from-black/80 to-transparent z-10">
                <div className="flex items-center gap-2 mb-2">
                  <OptimizedAvatar
                    src={post.author?.profile?.avatarUrl}
                    alt={post.author?.profile?.displayName}
                    size={32}
                    className="w-8 h-8 rounded-full border border-white/30"
                  />
                  <p className="text-white text-sm font-semibold">
                    {post.author?.profile?.displayName}
                  </p>
                </div>
                {post.content && (
                  <p className="text-white/90 text-sm line-clamp-2">{post.content}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
