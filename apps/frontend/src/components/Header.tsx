'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Search, Bell, MessageSquare, ShieldAlert, LogOut, User, Lock, Home, Users, Compass, Bookmark, UserX, Play, Moon, Sun, Radio } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { useChatStore } from '../store/chatStore';
import { useChatBoxesStore } from '../store/chatBoxesStore';
import { useThemeStore } from '../store/themeStore';
import { api } from '../services/api';
import OptimizedAvatar from './OptimizedAvatar';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { notifications, unreadCount, fetchNotifications, markAsRead } = useNotificationStore();
  const { conversations, fetchConversations } = useChatStore();
  const { openBox } = useChatBoxesStore();
  const { theme, toggleTheme } = useThemeStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const [showNotifyDropdown, setShowNotifyDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showMessengerDropdown, setShowMessengerDropdown] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifyRef = useRef<HTMLDivElement>(null);
  const messengerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchConversations();
      api.get('/users/search/history').then((res) => {
        if (res.data?.status === 'success') setRecentSearches(res.data.data || []);
      }).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
      if (notifyRef.current && !notifyRef.current.contains(event.target as Node)) {
        setShowNotifyDropdown(false);
      }
      if (messengerRef.current && !messengerRef.current.contains(event.target as Node)) {
        setShowMessengerDropdown(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowRecentSearches(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleNotificationClick = async (notif: any) => {
    await markAsRead(notif.id);
    setShowNotifyDropdown(false);

    if (notif.type === 'LIKE' || notif.type === 'COMMENT' || notif.type === 'SHARE') {
      if (notif.entityId) {
        router.push(`/posts/${notif.entityId}`);
      }
    } else if (notif.type === 'FRIEND_REQUEST') {
      router.push('/friends');
    } else if (notif.type === 'FRIEND_ACCEPT') {
      if (notif.entityId) {
        router.push(`/profile/${notif.entityId}`);
      } else if (notif.sender?.id) {
        router.push(`/profile/${notif.sender.id}`);
      } else {
        router.push('/friends');
      }
    } else if (notif.type === 'NEW_MESSAGE') {
      const partnerId = notif.sender?.id || notif.entityId;
      if (partnerId) {
        openBox(partnerId);
      } else {
        router.push('/chat');
      }
    }
  };

  const handleOpenConversation = (conv: any) => {
    const partnerId = conv.chatPartner?.userId || conv.members?.find((m: any) => m.userId !== user?.id)?.userId;
    if (partnerId) {
      openBox(partnerId);
      setShowMessengerDropdown(false);
    }
  };

  const hasUnreadMessages = conversations.some(
    (c) => c.lastMessage && !c.lastMessage.isRead && c.lastMessage.senderId !== user?.id
  );

  return (
    <header className="sticky top-0 z-40 w-full h-14 bg-white dark:bg-[#242526] border-b border-slate-200 dark:border-[#3e4042] px-3 md:px-4 flex items-center justify-between shadow-[var(--header-shadow)]">

      <div className="flex items-center gap-2.5 min-w-0">
        <Link href="/" className="w-10 h-10 bg-[#1877f2] rounded-full flex items-center justify-center text-white text-3xl font-black italic tracking-tighter hover:opacity-95 transition-all select-none">
          f
        </Link>

        <div className="relative hidden sm:flex items-center" ref={searchRef}>
        <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full">
          <input
            type="text"
            placeholder="Tìm kiếm trên Facebook"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowRecentSearches(true)}
            className="glass-input pl-9 pr-4 py-2 w-48 md:w-60 rounded-full text-sm dark:text-white placeholder-slate-500 focus:bg-white dark:focus:bg-[#242526]"
          />
          <Search className="absolute left-3 w-4 h-4 text-slate-500" />
          {showRecentSearches && recentSearches.length > 0 && (
            <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-[#242526] border border-slate-200 dark:border-[#3e4042] rounded-xl shadow-xl z-50 py-2">
              <p className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase">Tìm kiếm gần đây</p>
              {recentSearches.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => { router.push(`/search?q=${encodeURIComponent(q)}`); setShowRecentSearches(false); }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-[#3a3b3c]"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </form>
        </div>
      </div>

      <div className="hidden md:flex items-center justify-center flex-1 max-w-[540px] h-full px-4">
        {[
          { href: '/', icon: Home, label: 'Trang chủ' },
          { href: '/friends', icon: Users, label: 'Bạn bè' },
          { href: '/watch', icon: Play, label: 'Video' },
          { href: '/live', icon: Radio, label: 'Trực tiếp' },
          { href: '/groups', icon: Compass, label: 'Nhóm' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href || (tab.href === '/watch' && pathname.startsWith('/watch')) || (tab.href === '/live' && pathname.startsWith('/live'));
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`fb-nav-tab flex-1 flex items-center justify-center h-full relative group px-6 ${
                isActive ? 'text-[#1877f2]' : 'text-slate-500 dark:text-slate-400'
              }`}
              title={tab.label}
            >
              <Icon className="w-6 h-6" />
              {isActive ? (
                <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#1877f2]"></span>
              ) : (
                <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-transparent group-hover:bg-slate-200 dark:group-hover:bg-[#3e4042]"></span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        {user?.role === 'ADMIN' && (
          <Link
            href="/admin"
            className="fb-icon-button text-amber-600 dark:text-amber-500"
            title="Quản trị"
          >
            <ShieldAlert className="w-5 h-5" />
          </Link>
        )}

        {/* Messenger — popup on desktop, full page on mobile */}
        <div className="relative" ref={messengerRef}>
          <button
            type="button"
            onClick={() => setShowMessengerDropdown(!showMessengerDropdown)}
            className="fb-icon-button relative hidden md:flex"
            title="Messenger"
          >
            <MessageSquare className="w-5 h-5" />
            {hasUnreadMessages && (
              <span className="absolute top-0 right-0 w-3 h-3 bg-[#e41e3f] rounded-full border-2 border-white dark:border-[#242526]"></span>
            )}
          </button>
          <Link
            href="/chat"
            className="fb-icon-button relative md:hidden"
            title="Messenger"
          >
            <MessageSquare className="w-5 h-5" />
            {hasUnreadMessages && (
              <span className="absolute top-0 right-0 w-3 h-3 bg-[#e41e3f] rounded-full border-2 border-white dark:border-[#242526]"></span>
            )}
          </Link>

          {showMessengerDropdown && (
            <div className="absolute right-0 mt-2.5 w-80 max-h-96 overflow-y-auto bg-white dark:bg-[#242526] border border-slate-200 dark:border-[#3e4042] rounded-xl shadow-xl flex flex-col z-50">
              <div className="p-4 border-b border-slate-200 dark:border-[#3e4042] flex items-center justify-between">
                <span className="font-bold text-sm">Messenger</span>
                <Link
                  href="/chat"
                  onClick={() => setShowMessengerDropdown(false)}
                  className="text-xs text-[#1877f2] hover:underline font-semibold"
                >
                  Xem tất cả
                </Link>
              </div>
              <div className="flex-1">
                {conversations.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">Chưa có cuộc trò chuyện.</div>
                ) : (
                  conversations.slice(0, 8).map((conv) => {
                    const partner = conv.chatPartner;
                    const displayName = conv.isGroup ? conv.name : partner?.displayName;
                    const avatarUrl = partner?.avatarUrl;
                    const isUnread = conv.lastMessage && !conv.lastMessage.isRead && conv.lastMessage.senderId !== user?.id;

                    return (
                      <button
                        key={conv.id}
                        type="button"
                        onClick={() => handleOpenConversation(conv)}
                        className={`w-full text-left p-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-[#3a3b3c] transition-colors border-b border-slate-100 dark:border-[#3e4042]/50 last:border-b-0 ${
                          isUnread ? 'bg-[#e7f3ff] dark:bg-brand-950/20' : ''
                        }`}
                      >
                        <OptimizedAvatar
                          src={avatarUrl}
                          alt={displayName || 'Chat'}
                          size={40}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-transparent"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-black dark:text-white truncate">{displayName}</p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {conv.lastMessage?.content || 'Bắt đầu trò chuyện'}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={notifyRef}>
          <button
            onClick={() => setShowNotifyDropdown(!showNotifyDropdown)}
            className="fb-icon-button relative"
            title="Thông báo"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#e41e3f] text-[10px] font-bold text-white w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-[#242526]">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifyDropdown && (
            <div className="absolute right-0 mt-2.5 w-80 max-h-96 overflow-y-auto bg-white dark:bg-[#242526] border border-slate-200 dark:border-[#3e4042] rounded-xl shadow-xl flex flex-col z-50">
              <div className="p-4 border-b border-slate-200 dark:border-[#3e4042] flex items-center justify-between">
                <span className="font-bold text-sm">Thông báo</span>
                <div className="flex items-center gap-2">
                  <Link href="/notifications" onClick={() => setShowNotifyDropdown(false)} className="text-xs text-[#1877f2] hover:underline font-semibold">
                    Xem tất cả
                  </Link>
                  {unreadCount > 0 && (
                    <button onClick={() => markAsRead('all')} className="text-xs text-[#1877f2] hover:underline font-semibold">
                      Đánh dấu đã đọc
                    </button>
                  )}
                </div>
              </div>
              <div className="flex-1">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">Không có thông báo.</div>
                ) : (
                  notifications.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`w-full text-left p-3 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-[#3a3b3c] transition-colors border-b border-slate-100 dark:border-[#3e4042]/50 last:border-b-0 ${
                        !notif.isRead ? 'bg-[#e7f3ff] dark:bg-brand-950/20' : ''
                      }`}
                    >
                      <OptimizedAvatar
                        src={notif.sender?.avatarUrl}
                        alt={notif.sender?.displayName || 'Hệ thống'}
                        size={36}
                        className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-transparent"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-700 dark:text-slate-250 leading-snug">
                          <span className="font-semibold text-black dark:text-white">{notif.sender?.displayName || 'Hệ thống'}</span>{' '}
                          {notif.type === 'LIKE' && 'đã thích bài viết của bạn.'}
                          {notif.type === 'COMMENT' && 'đã bình luận bài viết của bạn.'}
                          {notif.type === 'FRIEND_REQUEST' && 'đã gửi lời mời kết bạn.'}
                          {notif.type === 'FRIEND_ACCEPT' && 'đã chấp nhận lời mời kết bạn.'}
                          {notif.type === 'SHARE' && 'đã chia sẻ bài viết của bạn.'}
                          {notif.type === 'NEW_MESSAGE' && 'đã gửi tin nhắn mới.'}
                        </p>
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          {new Date(notif.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {!notif.isRead && (
                        <span className="w-2.5 h-2.5 bg-[#1877f2] rounded-full self-center"></span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={profileRef}>
          <button onClick={() => setShowProfileDropdown(!showProfileDropdown)} className="flex items-center focus:outline-none">
            <OptimizedAvatar
              src={user?.avatarUrl}
              alt={user?.displayName || 'Người dùng'}
              size={36}
              className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-transparent hover:brightness-95 transition-all"
            />
          </button>

          {showProfileDropdown && (
            <div className="absolute right-0 mt-2.5 w-60 bg-white dark:bg-[#242526] border border-slate-200 dark:border-[#3e4042] rounded-xl shadow-xl overflow-hidden flex flex-col p-1.5 z-50">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-[#3e4042] text-slate-700 dark:text-slate-350">
                <p className="font-bold text-sm text-black dark:text-white truncate">{user?.displayName}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>

              <Link
                href={`/profile/${user?.id}`}
                onClick={() => setShowProfileDropdown(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#3a3b3c] rounded-md transition-all"
              >
                <User className="w-4 h-4 text-slate-500" />
                Xem trang cá nhân
              </Link>

              <Link
                href="/saved"
                onClick={() => setShowProfileDropdown(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#3a3b3c] rounded-md transition-all"
              >
                <Bookmark className="w-4 h-4 text-slate-500" />
                Đã lưu
              </Link>

              <Link
                href="/settings"
                onClick={() => setShowProfileDropdown(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#3a3b3c] rounded-md transition-all"
              >
                <Lock className="w-4 h-4 text-slate-500" />
                Cài đặt &amp; quyền riêng tư
              </Link>

              <button
                type="button"
                onClick={() => {
                  toggleTheme();
                  setShowProfileDropdown(false);
                }}
                className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#3a3b3c] rounded-md transition-all"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-slate-500" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-500" />
                )}
                {theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
              </button>

              <Link
                href="/settings/blocked"
                onClick={() => setShowProfileDropdown(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#3a3b3c] rounded-md transition-all"
              >
                <UserX className="w-4 h-4 text-slate-500" />
                Người đã chặn
              </Link>

              <button
                onClick={() => {
                  logout();
                  router.push('/login');
                }}
                className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-all border-t border-slate-100 dark:border-[#3e4042] mt-1"
              >
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
