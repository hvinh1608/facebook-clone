'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import PostCard from '../../../components/PostCard';
import { api } from '../../../services/api';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function PostPermalinkPage() {
  const params = useParams();
  const postId = params.id as string;
  const [post, setPost] = useState<any>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!postId) return;

    const fetchPost = async () => {
      try {
        const res = await api.get(`/posts/${postId}`);
        if (res.data?.status === 'success') {
          setPost(res.data.data);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Không thể tải bài viết.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  return (
    <Layout>
      <div className="max-w-[680px] mx-auto flex flex-col gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold text-[#1877f2] hover:underline w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại bảng tin
        </Link>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#1877f2] animate-spin" />
          </div>
        ) : error ? (
          <div className="fb-card p-12 text-center text-slate-500">{error}</div>
        ) : post ? (
          <PostCard post={post} />
        ) : null}
      </div>
    </Layout>
  );
}
