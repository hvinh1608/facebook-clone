'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Layout from '../../components/Layout';
import OptimizedAvatar from '../../components/OptimizedAvatar';
import { useNotificationStore } from '../../store/notificationStore';
import { useChatBoxesStore } from '../../store/chatBoxesStore';
import { Bell, CheckCheck, Trash2, Loader2 } from 'lucide-react';

const typeLabels: Record<string, string> = {
  LIKE: 'đã thích bài viết của bạn.',
  COMMENT: 'đã bình luận bài viết của bạn.',
  SHARE: 'đã chia sẻ bài viết của bạn.',
  FRIEND_REQUEST: 'đã gửi lời mời kết bạn.',
  FRIEND_ACCEPT: 'đã chấp nhận lời mời kết bạn.',
  NEW_MESSAGE: 'đã gửi tin nhắn mới.',
};

export default function NotificationsPage() {
  const router = useRouter();
  const { openBox } = useChatBoxesStore();
  const { notifications, unreadCount, isLoading, fetchNotifications, markAsRead, deleteNotification } =
    useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleClick = async (notif: any) => {
    await markAsRead(notif.id);
    if (notif.type === 'LIKE' || notif.type === 'COMMENT' || notif.type === 'SHARE') {
      if (notif.entityId) router.push(`/posts/${notif.entityId}`);
    } else if (notif.type === 'FRIEND_REQUEST') {
      router.push('/friends');
    } else if (notif.type === 'FRIEND_ACCEPT') {
      router.push(notif.entityId ? `/profile/${notif.entityId}` : '/friends');
    } else if (notif.type === 'NEW_MESSAGE') {
      const partnerId = notif.sender?.id || notif.entityId;
      if (partnerId) openBox(partnerId);
      else router.push('/chat');
    }
  };

  return (
    <Layout>
      <div className="max-w-[680px] mx-auto flex flex-col gap-4">
        <div className="fb-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-[#1877f2]" />
            <div>
              <h1 className="text-lg font-bold">Thông báo</h1>
              <p className="text-xs text-slate-500">{unreadCount} chưa đọc</p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAsRead('all')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1877f2] hover:bg-[#e7f3ff] rounded-lg"
            >
              <CheckCheck className="w-4 h-4" />
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>

        <div className="fb-card overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#1877f2] animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <p className="text-center text-sm text-slate-500 py-12">Chưa có thông báo nào.</p>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`flex items-start gap-3 p-4 border-b border-slate-100 dark:border-[#3e4042] last:border-b-0 ${
                  !notif.isRead ? 'bg-[#e7f3ff] dark:bg-brand-950/20' : ''
                }`}
              >
                <button type="button" onClick={() => handleClick(notif)} className="flex items-start gap-3 flex-1 text-left min-w-0">
                  <OptimizedAvatar
                    src={notif.sender?.avatarUrl}
                    alt={notif.sender?.displayName || 'Hệ thống'}
                    size={44}
                    className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 dark:text-[#e4e6eb] leading-snug">
                      <span className="font-semibold">{notif.sender?.displayName || 'Hệ thống'}</span>{' '}
                      {typeLabels[notif.type] || 'đã tương tác với bạn.'}
                    </p>
                    <span className="text-xs text-slate-500 mt-1 block">
                      {new Date(notif.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => deleteNotification(notif.id)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-[#3a3b3c] rounded-full"
                  title="Xóa"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <Link href="/" className="text-center text-sm text-[#1877f2] hover:underline font-semibold py-2">
          Về trang chủ
        </Link>
      </div>
    </Layout>
  );
}
