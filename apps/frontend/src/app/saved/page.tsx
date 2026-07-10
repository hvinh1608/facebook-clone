'use client';

import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import PostCard from '../../components/PostCard';
import { api } from '../../services/api';
import { Bookmark, Loader2 } from 'lucide-react';

export default function SavedPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSaved = async () => {
      try {
        const res = await api.get('/posts/saved');
        if (res.data?.status === 'success') {
          setPosts(res.data.data.map((p: any) => ({ ...p, isSaved: true })));
        }
      } catch (e) {
        console.error('Error loading saved posts', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSaved();
  }, []);

  return (
    <Layout>
      <div className="max-w-[680px] mx-auto flex flex-col gap-5">
        <div className="fb-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#1877f2]/10 flex items-center justify-center">
            <Bookmark className="w-5 h-5 text-[#1877f2]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Đã lưu</h1>
            <p className="text-xs text-slate-500">Các bài viết bạn đã lưu để xem lại sau</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#1877f2] animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="fb-card p-12 text-center text-slate-500">
            Bạn chưa lưu bài viết nào.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
