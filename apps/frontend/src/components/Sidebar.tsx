'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Compass, ShieldAlert, Play, Clapperboard, Store, Calendar, Flag, Clock } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { resolveGroupAvatarUrl } from '../utils/avatar';
import OptimizedAvatar from './OptimizedAvatar';

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [joinedGroups, setJoinedGroups] = useState<any[]>([]);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await api.get('/groups/joined');
        if (res.data?.status === 'success') {
          setJoinedGroups((res.data.data || []).slice(0, 5));
        }
      } catch (e) {
        console.error(e);
      }
    };
    if (user) fetchGroups();
  }, [user]);

  const menuItems = [
    { name: 'Bảng tin', href: '/', icon: Home, color: 'text-blue-500' },
    { name: 'Bạn bè', href: '/friends', icon: Users, color: 'text-[#1877f2]' },
    { name: 'Video', href: '/watch', icon: Play, color: 'text-[#e41e3f]' },
    { name: 'Reels', href: '/reels', icon: Clapperboard, color: 'text-[#a033ff]' },
    { name: 'Marketplace', href: '/marketplace', icon: Store, color: 'text-[#45bd62]' },
    { name: 'Sự kiện', href: '/events', icon: Calendar, color: 'text-[#f5533d]' },
    { name: 'Trang', href: '/pages', icon: Flag, color: 'text-[#1877f2]' },
    { name: 'Kỷ niệm', href: '/memories', icon: Clock, color: 'text-amber-500' },
    { name: 'Nhóm', href: '/groups', icon: Compass, color: 'text-emerald-500' },
  ];

  return (
    <aside className="w-full md:w-[280px] md:h-[calc(100vh-56px)] md:sticky md:top-14 bg-[#f0f2f5] dark:bg-[#18191a] px-2 py-3 md:px-0 md:py-4 flex flex-row md:flex-col justify-between fixed bottom-0 left-0 right-0 md:relative z-30 border-t md:border-t-0 border-slate-200 dark:border-transparent">

      <div className="flex flex-row md:flex-col items-center md:items-stretch justify-around md:justify-start w-full gap-0.5 md:gap-1">
        <Link
          href={`/profile/${user?.id}`}
          className="hidden md:flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-200 dark:hover:bg-[#3a3b3c] transition-colors"
        >
          <OptimizedAvatar
            src={user?.avatarUrl}
            alt={user?.displayName}
            size={36}
            className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-transparent"
          />
          <span className="text-xs font-bold truncate text-black dark:text-[#e4e6eb]">
            {user?.displayName}
          </span>
        </Link>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href
            || (item.href === '/watch' && pathname.startsWith('/watch'))
            || (item.href === '/reels' && pathname.startsWith('/reels'))
            || (item.href === '/marketplace' && pathname.startsWith('/marketplace'))
            || (item.href === '/events' && pathname.startsWith('/events'))
            || (item.href === '/pages' && pathname.startsWith('/pages'))
            || (item.href === '/memories' && pathname.startsWith('/memories'));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3.5 px-3 py-2.5 rounded-xl transition-colors w-full ${
                isActive
                  ? 'bg-white dark:bg-[#242526] text-[#1877f2] font-bold shadow-[var(--panel-shadow)]'
                  : 'text-slate-700 dark:text-[#e4e6eb] hover:bg-slate-200 dark:hover:bg-[#3a3b3c] font-semibold'
              }`}
            >
              <Icon className={`w-6 h-6 ${item.color}`} />
              <span className="hidden md:inline text-xs">{item.name}</span>
            </Link>
          );
        })}

        {joinedGroups.length > 0 && (
          <div className="hidden md:flex flex-col gap-1 mt-3 pt-3 border-t border-slate-200 dark:border-[#3e4042]">
            <span className="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wide">Lối tắt của bạn</span>
            {joinedGroups.map((group) => (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-200 dark:hover:bg-[#3a3b3c] transition-colors"
              >
                <img
                  src={resolveGroupAvatarUrl(group.avatarUrl)}
                  alt={group.name}
                  className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-transparent"
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-[#e4e6eb] truncate">{group.name}</span>
              </Link>
            ))}
          </div>
        )}

        {user?.role === 'ADMIN' && (
          <Link
            href="/admin"
            className={`flex items-center gap-3.5 px-3 py-2.5 rounded-xl transition-colors w-full ${
              pathname.startsWith('/admin')
                ? 'bg-white dark:bg-[#242526] text-amber-500 font-bold shadow-[var(--panel-shadow)]'
                : 'text-amber-500 hover:bg-slate-200 dark:hover:bg-[#3a3b3c] font-semibold'
            }`}
          >
            <ShieldAlert className="w-6 h-6" />
            <span className="hidden md:inline text-xs">Quản trị</span>
          </Link>
        )}
      </div>

      <div className="hidden md:flex flex-col gap-3.5 border-t border-slate-200 dark:border-[#3e4042] pt-4.5 mt-4">
        <div className="text-[10px] text-slate-500 dark:text-slate-500 leading-normal px-3 select-none">
          <span>Quyền riêng tư · Điều khoản · Quảng cáo · Cookie · Meta © 2026</span>
        </div>
      </div>
    </aside>
  );
}
