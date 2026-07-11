'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Layout from '../../components/Layout';
import { api } from '../../services/api';
import { useFeedStore } from '../../store/feedStore';
import { Loader2, Heart, MessageCircle, Share2, Volume2, VolumeX, Play as PlayIcon, Pause as PauseIcon } from 'lucide-react';
import { resolveMediaUrl } from '../../utils/media';
import OptimizedAvatar from '../../components/OptimizedAvatar';
import Link from 'next/link';

export default function ReelsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [playingMap, setPlayingMap] = useState<Map<string, boolean>>(new Map());
  const [progressMap, setProgressMap] = useState<Map<string, number>>(new Map());
  const [showActionOverlay, setShowActionOverlay] = useState<{ id: string; type: 'play' | 'pause' } | null>(null);

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
          const postId = video.getAttribute('data-post-id');
          if (entry.isIntersecting) {
            video.muted = isMuted;
            video.play()
              .then(() => {
                if (postId) setPlayingMap(prev => new Map(prev).set(postId, true));
              })
              .catch(() => {});
          } else {
            video.pause();
            if (postId) setPlayingMap(prev => new Map(prev).set(postId, false));
          }
        });
      },
      { threshold: 0.6 }
    );
    videoRefs.current.forEach((v) => observer.observe(v));
    return () => observer.disconnect();
  }, [posts, isMuted]);

  const setVideoRef = useCallback((id: string, el: HTMLVideoElement | null) => {
    if (el) {
      videoRefs.current.set(id, el);
    } else {
      videoRefs.current.delete(id);
    }
  }, []);

  const handleMuteToggle = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    videoRefs.current.forEach((v) => {
      v.muted = nextMute;
    });
  };

  const handleVideoClick = (postId: string) => {
    const video = videoRefs.current.get(postId);
    if (!video) return;

    if (video.paused) {
      video.play()
        .then(() => {
          setPlayingMap(prev => new Map(prev).set(postId, true));
          setShowActionOverlay({ id: postId, type: 'play' });
        })
        .catch(() => {});
    } else {
      video.pause();
      setPlayingMap(prev => new Map(prev).set(postId, false));
      setShowActionOverlay({ id: postId, type: 'pause' });
    }

    setTimeout(() => {
      setShowActionOverlay(null);
    }, 500);
  };

  const handleTimeUpdate = (postId: string, videoEl: HTMLVideoElement) => {
    const pct = (videoEl.currentTime / videoEl.duration) * 100 || 0;
    setProgressMap(prev => new Map(prev).set(postId, pct));
  };

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
        className="h-[calc(100vh-56px)] overflow-y-auto snap-y snap-mandatory scroll-smooth bg-[#0a0a0a]"
      >
        {posts.map((post) => {
          const video = post.media?.find((m: any) => m.type === 'VIDEO');
          if (!video) return null;
          const isPlaying = playingMap.get(post.id) ?? false;
          const showOverlay = showActionOverlay?.id === post.id;
          const overlayType = showActionOverlay?.type;

          return (
            <div
              key={post.id}
              className="relative h-[calc(100vh-56px)] w-full max-w-[420px] mx-auto snap-start snap-always bg-black flex items-center justify-center overflow-hidden border-x border-slate-800/20 shadow-2xl"
            >
              <div 
                className="relative w-full h-full flex items-center justify-center cursor-pointer"
                onClick={() => handleVideoClick(post.id)}
              >
                <video
                  ref={(el) => setVideoRef(post.id, el)}
                  src={resolveMediaUrl(video.url)}
                  data-post-id={post.id}
                  className="w-full h-full object-cover select-none"
                  loop
                  playsInline
                  muted={isMuted}
                  preload="metadata"
                  onTimeUpdate={(e) => handleTimeUpdate(post.id, e.currentTarget)}
                />

                {/* Big Action Overlay Center Screen */}
                {showOverlay && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-10 pointer-events-none transition-all duration-300">
                    <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center text-white scale-110 animate-ping">
                      {overlayType === 'play' ? (
                        <PlayIcon className="w-8 h-8 fill-white" />
                      ) : (
                        <PauseIcon className="w-8 h-8 fill-white" />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Progress Timeline Bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20 pointer-events-none">
                <div
                  className="h-full bg-[#1877f2] transition-all duration-75 ease-linear"
                  style={{ width: `${progressMap.get(post.id) || 0}%` }}
                />
              </div>

              {/* Right action bar */}
              <div className="absolute right-3 bottom-28 flex flex-col items-center gap-4 z-30">
                {/* Mute Button */}
                <button
                  type="button"
                  onClick={handleMuteToggle}
                  className="flex flex-col items-center gap-1.5 text-white active:scale-95 transition-transform"
                  title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
                >
                  <div className="w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/10">
                    {isMuted ? <VolumeX className="w-5.5 h-5.5 text-white" /> : <Volume2 className="w-5.5 h-5.5 text-white" />}
                  </div>
                </button>

                {/* Like Button */}
                <button
                  type="button"
                  onClick={() => handleLike(post)}
                  className="flex flex-col items-center gap-1 text-white active:scale-95 transition-transform"
                >
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md shadow-lg border border-white/10 ${
                    post.hasReacted ? 'bg-red-500/20' : 'bg-black/50 hover:bg-black/70'
                  }`}>
                    <Heart
                      className={`w-5.5 h-5.5 ${post.hasReacted ? 'fill-red-500 text-red-500' : 'text-white'}`}
                    />
                  </div>
                  <span className="text-white text-[11px] font-bold shadow-sm">
                    {post.reactions?.length || 0}
                  </span>
                </button>

                {/* Comment Button */}
                <Link
                  href={`/posts/${post.id}`}
                  className="flex flex-col items-center gap-1 text-white active:scale-95 transition-transform"
                >
                  <div className="w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/10">
                    <MessageCircle className="w-5.5 h-5.5 text-white" />
                  </div>
                  <span className="text-white text-[11px] font-bold shadow-sm">
                    {post._count?.comments ?? 0}
                  </span>
                </Link>

                {/* Share Button */}
                <button
                  type="button"
                  onClick={() => {
                    const shareUrl = `${window.location.origin}/posts/${post.id}`;
                    if (navigator.share) {
                      navigator.share({ title: post.content || 'Reels Video', url: shareUrl });
                    } else {
                      navigator.clipboard.writeText(shareUrl);
                      alert('Đã sao chép liên kết video!');
                    }
                  }}
                  className="flex flex-col items-center gap-1 text-white active:scale-95 transition-transform"
                >
                  <div className="w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/10">
                    <Share2 className="w-5.5 h-5.5 text-white" />
                  </div>
                  <span className="text-white text-[10px] font-bold shadow-sm">Chia sẻ</span>
                </button>
              </div>

              {/* Bottom gradient (left side only — keeps action buttons clear) */}
              <div className="absolute bottom-0 left-0 right-20 h-28 bg-gradient-to-t from-black/80 to-transparent z-[5] pointer-events-none" />

              {/* Bottom info */}
              <div className="absolute bottom-3 left-0 right-20 px-4 z-10 pointer-events-none">
                <div className="flex items-center gap-2.5 mb-1.5 pointer-events-auto">
                  <OptimizedAvatar
                    src={post.author?.profile?.avatarUrl}
                    alt={post.author?.profile?.displayName}
                    size={36}
                    className="w-9 h-9 rounded-full border-2 border-white/20 shadow-md object-cover"
                  />
                  <div className="flex flex-col min-w-0">
                    <Link
                      href={`/profile/${post.authorId}`}
                      className="text-white text-sm font-bold hover:underline truncate"
                    >
                      {post.author?.profile?.displayName}
                    </Link>
                  </div>
                  <button
                    type="button"
                    className="ml-auto flex-shrink-0 px-3 py-1 bg-white/20 hover:bg-white/30 text-white font-bold rounded-lg text-[11px] transition-colors"
                  >
                    Theo dõi
                  </button>
                </div>
                {post.content && (
                  <p className="text-white/95 text-xs leading-relaxed line-clamp-2 drop-shadow-sm select-text pointer-events-auto">
                    {post.content}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
