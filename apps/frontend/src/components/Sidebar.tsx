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
    { name: 'Bảng tin', href: '/', icon: Home, color: 'text-[#1877f2]' },
    { name: 'Bạn bè', href: '/friends', icon: Users, color: 'text-[#1877f2]' },
    { name: 'Video', href: '/watch', icon: Play, color: 'text-[#1877f2]' },
    { name: 'Reels', href: '/reels', icon: Clapperboard, color: 'text-[#a033ff]' },
    { name: 'Marketplace', href: '/marketplace', icon: Store, color: 'text-[#1877f2]' },
    { name: 'Sự kiện', href: '/events', icon: Calendar, color: 'text-[#f5533d]' },
    { name: 'Trang', href: '/pages', icon: Flag, color: 'text-orange-500' },
    { name: 'Kỷ niệm', href: '/memories', icon: Clock, color: 'text-[#1877f2]' },
    { name: 'Nhóm', href: '/groups', icon: Compass, color: 'text-[#1877f2]' },
  ];

  return (
    <aside className="hidden md:flex w-[280px] lg:w-[300px] h-[calc(100vh-56px)] sticky top-14 flex-col justify-between bg-[#f0f2f5] dark:bg-[#18191a] py-4 flex-shrink-0">

      <div className="flex flex-col items-stretch w-full gap-1 overflow-y-auto">
        <Link
          href={`/profile/${user?.id}`}
          className="flex items-center gap-3 px-3 py-2.5 mx-1 rounded-xl hover:bg-slate-200 dark:hover:bg-[#3a3b3c] transition-colors"
        >
          <OptimizedAvatar
            src={user?.avatarUrl}
            alt={user?.displayName}
            size={36}
            className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-transparent"
          />
          <span className="text-sm font-bold truncate text-black dark:text-[#e4e6eb]">
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
            || (item.href === '/memories' && pathname.startsWith('/memories'))
            || (item.href === '/groups' && pathname.startsWith('/groups'));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3.5 px-3 py-2.5 mx-1 rounded-xl transition-colors ${
                isActive
                  ? 'bg-white dark:bg-[#242526] text-[#1877f2] font-bold shadow-[var(--panel-shadow)]'
                  : 'text-slate-700 dark:text-[#e4e6eb] hover:bg-slate-200 dark:hover:bg-[#3a3b3c] font-semibold'
              }`}
            >
              <Icon className={`w-6 h-6 ${item.color}`} />
              <span className="text-sm">{item.name}</span>
            </Link>
          );
        })}

        {joinedGroups.length > 0 && (
          <div className="flex flex-col gap-1 mt-3 pt-3 mx-1 border-t border-slate-200 dark:border-[#3e4042]">
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
                <span className="text-sm font-semibold text-slate-700 dark:text-[#e4e6eb] truncate">{group.name}</span>
              </Link>
            ))}
          </div>
        )}

        {user?.role === 'ADMIN' && (
          <Link
            href="/admin"
            className={`flex items-center gap-3.5 px-3 py-2.5 mx-1 rounded-xl transition-colors ${
              pathname.startsWith('/admin')
                ? 'bg-white dark:bg-[#242526] text-amber-500 font-bold shadow-[var(--panel-shadow)]'
                : 'text-amber-500 hover:bg-slate-200 dark:hover:bg-[#3a3b3c] font-semibold'
            }`}
          >
            <ShieldAlert className="w-6 h-6" />
            <span className="text-sm">Quản trị</span>
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-3.5 border-t border-slate-200 dark:border-[#3e4042] pt-4 mx-1 mt-4">
        <div className="text-[10px] text-slate-500 leading-normal px-3 select-none">
          Quyền riêng tư · Điều khoản · Quảng cáo · Cookie · Meta © 2026
        </div>
      </div>
    </aside>
  );
}
