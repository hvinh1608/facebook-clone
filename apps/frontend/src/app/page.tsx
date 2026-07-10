'use client';

import React, { useEffect, useRef, Suspense } from 'react';
import Layout from '../components/Layout';
import StoryCarousel from '../components/StoryCarousel';
import PostCreator from '../components/PostCreator';
import ScheduledPostsBar from '../components/ScheduledPostsBar';
import PostCard from '../components/PostCard';
import { useFeedStore, type FeedSort } from '../store/feedStore';
import { Loader2 } from 'lucide-react';

export default function HomeFeedPage() {
  const { posts, nextCursor, isLoading, hasInitialized, sort, fetchFeed, setSort } = useFeedStore();
  const observerTarget = useRef<HTMLDivElement>(null);
  const hasRequestedInitialFeed = useRef(false);

  useEffect(() => {
    if (hasRequestedInitialFeed.current || hasInitialized) return;
    hasRequestedInitialFeed.current = true;
    fetchFeed(true);
  }, [fetchFeed, hasInitialized]);

  const handleSortChange = (newSort: FeedSort) => {
    if (newSort === sort) return;
    setSort(newSort);
    fetchFeed(true, newSort);
  };

  // Infinite Scroll using IntersectionObserver
  useEffect(() => {
    if (!nextCursor || isLoading) return;

    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchFeed(false);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
      observer.disconnect();
    };
  }, [fetchFeed, nextCursor, isLoading]);

  return (
    <Layout>
      <div className="flex flex-col gap-4 md:gap-5 max-w-[680px] mx-auto">
        {/* Story Carousel Section */}
        <div className="fb-card p-3 md:p-4 overflow-hidden">
          <Suspense fallback={<div className="h-24 animate-pulse bg-[var(--hover-bg)] rounded-lg" />}>
            <StoryCarousel />
          </Suspense>
        </div>

        {/* Post Creator Section */}
        <PostCreator />

        <ScheduledPostsBar />

        {/* Feed sort toggle */}
        <div className="fb-card px-4 py-2.5 flex items-center gap-2">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">Sắp xếp:</span>
          <button
            type="button"
            onClick={() => handleSortChange('recent')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              sort === 'recent'
                ? 'bg-[#1877f2] text-white'
                : 'bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:opacity-90'
            }`}
          >
            Gần đây
          </button>
          <button
            type="button"
            onClick={() => handleSortChange('popular')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              sort === 'popular'
                ? 'bg-[#1877f2] text-white'
                : 'bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:opacity-90'
            }`}
          >
            Phổ biến
          </button>
        </div>

        {/* Feed Posts List */}
        <div className="flex flex-col gap-4">
          {posts.length === 0 && !isLoading ? (
            <div className="fb-card p-12 text-center flex flex-col items-center gap-3">
              <span className="text-4xl">👋</span>
              <h3 className="text-base font-semibold text-slate-700 dark:text-slate-100">Chào mừng đến Facebook</h3>
              <p className="text-sm text-slate-500 max-w-sm">
                Bảng tin trống. Hãy đăng bài, tạo tin hoặc kết bạn để cập nhật bảng tin của bạn.
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))
          )}

          {/* Loading Indicator & Scroll Trigger */}
          <div ref={observerTarget} className="py-6 flex items-center justify-center">
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="w-5 h-5 text-brand-500 animate-spin" />
                <span>Đang tải thêm...</span>
              </div>
            )}
            {!nextCursor && posts.length > 0 && (
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-600">
                Bạn đã xem hết bài viết
              </span>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
