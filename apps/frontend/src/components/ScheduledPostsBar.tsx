'use client';

import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { api } from '../services/api';

export default function ScheduledPostsBar() {
  const [scheduled, setScheduled] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/posts/scheduled');
        if (res.data?.status === 'success') {
          setScheduled(res.data.data || []);
        }
      } catch {
        setScheduled([]);
      }
    };
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, []);

  if (scheduled.length === 0) return null;

  return (
    <div className="fb-card p-3 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
        <Clock className="w-4 h-4 text-[#1877f2]" />
        Bài viết đã lên lịch ({scheduled.length})
      </div>
      {scheduled.slice(0, 3).map((post) => (
        <div key={post.id} className="text-xs text-slate-500 dark:text-slate-400 pl-6">
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {post.content?.slice(0, 60) || 'Bài viết không có chữ'}
            {post.content && post.content.length > 60 ? '…' : ''}
          </span>
          {' · '}
          {new Date(post.scheduledAt).toLocaleString('vi-VN')}
        </div>
      ))}
    </div>
  );
}
