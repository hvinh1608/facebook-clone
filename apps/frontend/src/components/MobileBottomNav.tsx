'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Clapperboard, Bell, Menu } from 'lucide-react';
import { useNotificationStore } from '../store/notificationStore';
import { useEffect } from 'react';

interface MobileBottomNavProps {
  onMenuOpen: () => void;
}

export default function MobileBottomNav({ onMenuOpen }: MobileBottomNavProps) {
  const pathname = usePathname() || '/';
  const { unreadCount, fetchNotifications } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const tabs = [
    { href: '/', icon: Home, label: 'Trang chủ', isNotify: false },
    { href: '/friends', icon: Users, label: 'Bạn bè', isNotify: false },
    { href: '/reels', icon: Clapperboard, label: 'Reels', isNotify: false },
    { href: '/notifications', icon: Bell, label: 'Thông báo', isNotify: true },
  ] as const;

  function isTabActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-45 bg-white dark:bg-[#242526] border-t border-slate-200 dark:border-[#3e4042] pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-2px_10px_rgba(0,0,0,0.05)]"
      aria-label="Điều hướng chính"
    >
      <div className="flex items-stretch justify-around h-12 max-w-lg mx-auto">
        {tabs.map(({ href, icon: Icon, label, isNotify }) => {
          const active = isTabActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center justify-center min-w-0 px-1 relative transition-colors ${
                active ? 'text-[#1877f2]' : 'text-slate-655 dark:text-[#b0b3b8]'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <div className="relative flex items-center justify-center p-1">
                <Icon className={`w-5.5 h-5.5 ${active ? 'stroke-[2.5px]' : ''}`} />
                {isNotify && unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-1 bg-[#e41e3f] text-white text-[9px] font-bold h-4 min-w-4 px-1 flex items-center justify-center rounded-full border border-white dark:border-[#242526]">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-semibold truncate max-w-full leading-none mt-0.5">{label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={onMenuOpen}
          className="flex flex-1 flex-col items-center justify-center min-w-0 px-1 text-slate-655 dark:text-[#b0b3b8] transition-colors"
          aria-label="Mở menu"
        >
          <div className="p-1">
            <Menu className="w-5.5 h-5.5" />
          </div>
          <span className="text-[9px] font-semibold leading-none mt-0.5">Menu</span>
        </button>
      </div>
    </nav>
  );
}
