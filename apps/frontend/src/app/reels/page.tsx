'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { api } from '../../services/api';
import { useFeedStore } from '../../store/feedStore';
import { useAuthStore } from '../../store/authStore';
import {
  Loader2,
  ThumbsUp,
  MessageCircle,
  Share2,
  MoreHorizontal,
  ChevronUp,
  ChevronDown,
  Volume2,
  VolumeX,
  Sparkles,
  Clapperboard,
  User,
  SquarePen,
} from 'lucide-react';
import { resolveMediaUrl } from '../../utils/media';
import OptimizedAvatar from '../../components/OptimizedAvatar';

type ReelsTab = 'for-you' | 'following' | 'profile';

function formatCount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace('.0', '')}K`;
  return String(n);
}

function filterVideoPosts(posts: any[]) {
  return posts.filter((post) => post.media?.some((m: any) => m.type === 'VIDEO'));
}

export default function ReelsPage() {
  const { user } = useAuthStore();
  const reactPost = useFeedStore((s) => s.reactPost);
  const [posts, setPosts] = useState<any[]>([]);
  const [friendIds, setFriendIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<ReelsTab>('for-you');
  const [isMuted, setIsMuted] = useState(true);
  const [expandedCaptions, setExpandedCaptions] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState(0);

  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const slideRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  const activePost = posts[activeIndex] ?? null;

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setActiveIndex(0);
    try {
      if (activeTab === 'profile' && user?.id) {
        const res = await api.get(`/posts/user/${user.id}?limit=30`);
        if (res.data?.status === 'success') {
          setPosts(filterVideoPosts(res.data.data.posts || res.data.data || []));
        } else {
          setPosts([]);
        }
        return;
      }

      const res = await api.get('/posts/watch?limit=30');
      if (res.data?.status === 'success') {
        let items = filterVideoPosts(res.data.data.posts || []);
        if (activeTab === 'following') {
          items = items.filter((p) => friendIds.includes(p.authorId));
        }
        setPosts(items);
      } else {
        setPosts([]);
      }
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, friendIds, user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    api.get(`/users/friends/${user.id}`).then((res) => {
      if (res.data?.status === 'success') {
        setFriendIds((res.data.data || []).map((f: any) => f.id));
      }
    }).catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) {
            video.muted = isMuted;
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.65 }
    );
    videoRefs.current.forEach((v) => observer.observe(v));
    return () => observer.disconnect();
  }, [posts, isMuted]);

  useEffect(() => {
    videoRefs.current.forEach((v) => {
      v.muted = isMuted;
    });
  }, [isMuted]);

  useEffect(() => {
    setProgress(0);
    const post = posts[activeIndex];
    if (!post) return;
    const video = videoRefs.current.get(post.id);
    if (!video) return;

    const onTimeUpdate = () => {
      const pct = video.duration ? (video.currentTime / video.duration) * 100 : 0;
      setProgress(pct);
    };
    video.addEventListener('timeupdate', onTimeUpdate);
    return () => video.removeEventListener('timeupdate', onTimeUpdate);
  }, [activeIndex, posts]);

  const setVideoRef = useCallback((id: string, el: HTMLVideoElement | null) => {
    if (el) videoRefs.current.set(id, el);
    else videoRefs.current.delete(id);
  }, []);

  const scrollToIndex = (index: number) => {
    if (index < 0 || index >= posts.length) return;
    slideRefs.current.get(index)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveIndex(index);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container || posts.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const idx = Number(entry.target.getAttribute('data-index'));
          if (!Number.isNaN(idx)) setActiveIndex(idx);
        });
      },
      { root: container, threshold: 0.6 }
    );

    slideRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [posts]);

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

  const handleShare = (postId: string, title?: string | null) => {
    const shareUrl = `${window.location.origin}/posts/${postId}`;
    if (navigator.share) {
      void navigator.share({ title: title || 'Reels', url: shareUrl });
    } else {
      void navigator.clipboard.writeText(shareUrl);
      alert('Đã sao chép liên kết!');
    }
  };

  const toggleCaption = (postId: string) => {
    setExpandedCaptions((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };

  const navItems: { id: ReelsTab; label: string; icon: React.ElementType }[] = [
    { id: 'for-you', label: 'Dành cho bạn', icon: Sparkles },
    { id: 'following', label: 'Đang theo dõi', icon: Clapperboard },
    { id: 'profile', label: 'Trang cá nhân', icon: User },
  ];

  const renderActionRail = (post: any, compact = false) => (
    <div className={`flex flex-col items-center ${compact ? 'gap-4' : 'gap-3'}`}>
      {!compact && (
        <div className="flex flex-col gap-2 mb-1">
          <button
            type="button"
            onClick={() => scrollToIndex(activeIndex - 1)}
            disabled={activeIndex <= 0}
            className="w-9 h-9 rounded-full bg-[#3a3b3c] hover:bg-[#4e4f50] disabled:opacity-30 flex items-center justify-center transition-colors"
            aria-label="Reels trước"
          >
            <ChevronUp className="w-5 h-5 text-white" />
          </button>
          <button
            type="button"
            onClick={() => scrollToIndex(activeIndex + 1)}
            disabled={activeIndex >= posts.length - 1}
            className="w-9 h-9 rounded-full bg-[#3a3b3c] hover:bg-[#4e4f50] disabled:opacity-30 flex items-center justify-center transition-colors"
            aria-label="Reels tiếp"
          >
            <ChevronDown className="w-5 h-5 text-white" />
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => handleLike(post)}
        className="flex flex-col items-center gap-1 text-white group"
      >
        <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
          post.hasReacted ? 'bg-[#1877f2]/30' : 'bg-[#3a3b3c] group-hover:bg-[#4e4f50]'
        }`}>
          <ThumbsUp className={`w-5 h-5 ${post.hasReacted ? 'fill-[#1877f2] text-[#1877f2]' : 'text-white'}`} />
        </div>
        <span className="text-xs font-semibold">{formatCount(post.reactions?.length || 0)}</span>
      </button>

      <Link href={`/posts/${post.id}`} className="flex flex-col items-center gap-1 text-white group">
        <div className="w-11 h-11 rounded-full bg-[#3a3b3c] group-hover:bg-[#4e4f50] flex items-center justify-center transition-colors">
          <MessageCircle className="w-5 h-5 text-white" />
        </div>
        <span className="text-xs font-semibold">{formatCount(post._count?.comments ?? 0)}</span>
      </Link>

      <button
        type="button"
        onClick={() => handleShare(post.id, post.content)}
        className="flex flex-col items-center gap-1 text-white group"
      >
        <div className="w-11 h-11 rounded-full bg-[#3a3b3c] group-hover:bg-[#4e4f50] flex items-center justify-center transition-colors">
          <Share2 className="w-5 h-5 text-white" />
        </div>
        <span className="text-xs font-semibold">{formatCount(0)}</span>
      </button>

      <button
        type="button"
        className="w-11 h-11 rounded-full bg-[#3a3b3c] hover:bg-[#4e4f50] flex items-center justify-center transition-colors"
        aria-label="Tuỳ chọn"
      >
        <MoreHorizontal className="w-5 h-5 text-white" />
      </button>

      <Link href={`/profile/${user?.id}`} className="mt-2 relative">
        <OptimizedAvatar
          src={user?.avatarUrl}
          alt={user?.displayName || 'Bạn'}
          size={36}
          className="w-9 h-9 rounded-full border-2 border-white object-cover"
        />
      </Link>

      <Link
        href="/?story=create"
        className="w-9 h-9 rounded-full bg-[#3a3b3c] hover:bg-[#4e4f50] flex items-center justify-center transition-colors"
        title="Tạo Reels"
      >
        <SquarePen className="w-4 h-4 text-white" />
      </Link>
    </div>
  );

  if (loading) {
    return (
      <Layout>
        <div className="h-[100vh] bg-black flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h-[100vh] bg-black flex overflow-hidden">
        {/* Left Reels nav — desktop */}
        <aside className="hidden md:flex w-[280px] lg:w-[300px] flex-shrink-0 flex-col px-4 py-5 border-r border-[#3e4042]/60">
          <h1 className="text-[28px] font-bold text-white mb-6 px-2">Reels</h1>
          <nav className="flex flex-col gap-1">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                  activeTab === id
                    ? 'bg-[#3a3b3c] text-white font-bold'
                    : 'text-[#e4e6eb] hover:bg-[#3a3b3c]/60 font-semibold'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[15px]">{label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile tab bar */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-black/90 backdrop-blur border-b border-[#3e4042]/60 px-3 py-2 flex gap-1">
          {navItems.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                activeTab === id ? 'bg-[#3a3b3c] text-white' : 'text-[#b0b3b8]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Center stage */}
        <div className="flex-1 flex items-center justify-center min-w-0 pt-12 md:pt-0">
          {posts.length === 0 ? (
            <div className="text-center px-6">
              <Clapperboard className="w-12 h-12 text-[#3a3b3c] mx-auto mb-3" />
              <p className="text-white font-semibold mb-1">Chưa có Reels</p>
              <p className="text-[#b0b3b8] text-sm">
                {activeTab === 'following'
                  ? 'Theo dõi thêm bạn bè để xem Reels của họ.'
                  : activeTab === 'profile'
                    ? 'Bạn chưa đăng video nào.'
                    : 'Quay lại sau để xem thêm video.'}
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3 lg:gap-5 h-full w-full max-w-[900px] px-2 md:px-4">
              {/* Video scroll column */}
              <div
                ref={containerRef}
                className="h-full w-full max-w-[420px] overflow-y-auto snap-y snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              >
                {posts.map((post, index) => {
                  const video = post.media?.find((m: any) => m.type === 'VIDEO');
                  if (!video) return null;
                  const isExpanded = expandedCaptions.has(post.id);
                  const caption = post.content || '';
                  const showSeeMore = caption.length > 80;

                  return (
                    <div
                      key={post.id}
                      ref={(el) => {
                        if (el) slideRefs.current.set(index, el);
                        else slideRefs.current.delete(index);
                      }}
                      data-index={index}
                      className="h-[100vh] md:h-[calc(100vh-24px)] snap-start snap-always flex items-center justify-center py-2 md:py-3"
                    >
                      <div className="relative w-full h-full max-h-[92vh] rounded-2xl overflow-hidden bg-black shadow-2xl ring-1 ring-white/10">
                        <video
                          ref={(el) => setVideoRef(post.id, el)}
                          src={resolveMediaUrl(video.url)}
                          className="w-full h-full object-cover"
                          loop
                          playsInline
                          muted={isMuted}
                          preload="metadata"
                          onClick={(e) => {
                            const v = e.currentTarget;
                            if (v.paused) v.play().catch(() => {});
                            else v.pause();
                          }}
                        />

                        {/* Mute toggle */}
                        <button
                          type="button"
                          onClick={() => setIsMuted((m) => !m)}
                          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center z-20 transition-colors"
                          aria-label={isMuted ? 'Bật tiếng' : 'Tắt tiếng'}
                        >
                          {isMuted ? (
                            <VolumeX className="w-4 h-4 text-white" />
                          ) : (
                            <Volume2 className="w-4 h-4 text-white" />
                          )}
                        </button>

                        {/* Mobile action rail overlay */}
                        {index === activeIndex && (
                          <div className="lg:hidden absolute right-3 bottom-28 z-20">
                            {renderActionRail(post, true)}
                          </div>
                        )}

                        {/* Creator + caption */}
                        <div className="absolute bottom-0 left-0 right-0 lg:right-0 p-4 pb-5 bg-gradient-to-t from-black/85 via-black/40 to-transparent z-10 pointer-events-none">
                          <div className="flex items-center gap-2 mb-2 pointer-events-auto">
                            <Link href={`/profile/${post.authorId}`}>
                              <OptimizedAvatar
                                src={post.author?.profile?.avatarUrl}
                                alt={post.author?.profile?.displayName}
                                size={36}
                                className="w-9 h-9 rounded-full border border-white/30 object-cover"
                              />
                            </Link>
                            <Link
                              href={`/profile/${post.authorId}`}
                              className="text-white text-sm font-bold hover:underline truncate"
                            >
                              {post.author?.profile?.displayName}
                            </Link>
                            <button
                              type="button"
                              className="ml-1 flex-shrink-0 text-[#1877f2] text-sm font-bold hover:underline"
                            >
                              Theo dõi
                            </button>
                          </div>
                          {caption && (
                            <div className="pointer-events-auto">
                              <p className={`text-white/95 text-sm leading-snug ${isExpanded ? '' : 'line-clamp-2'}`}>
                                {caption}
                              </p>
                              {showSeeMore && (
                                <button
                                  type="button"
                                  onClick={() => toggleCaption(post.id)}
                                  className="text-white/80 text-sm font-semibold mt-0.5 hover:underline"
                                >
                                  {isExpanded ? 'Thu gọn' : 'Xem thêm'}
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Progress bar */}
                        {index === activeIndex && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20 z-20">
                            <div
                              className="h-full bg-white/90 transition-all duration-100 ease-linear"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop action rail — beside video */}
              {activePost && (
                <div className="hidden lg:flex flex-shrink-0 self-end pb-8">
                  {renderActionRail(activePost)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
