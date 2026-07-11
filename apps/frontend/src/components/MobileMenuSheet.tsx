'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  X,
  Play,
  Compass,
  Calendar,
  Flag,
  Clock,
  Settings,
  Bookmark,
  Bell,
  MessageSquare,
  ShieldAlert,
  LogOut,
  User,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import OptimizedAvatar from './OptimizedAvatar';

interface MobileMenuSheetProps {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
}

const menuLinks = [
  { href: '/watch', icon: Play, label: 'Video' },
  { href: '/groups', icon: Compass, label: 'Nhóm' },
  { href: '/events', icon: Calendar, label: 'Sự kiện' },
  { href: '/pages', icon: Flag, label: 'Trang' },
  { href: '/memories', icon: Clock, label: 'Kỷ niệm' },
  { href: '/saved', icon: Bookmark, label: 'Đã lưu' },
  { href: '/chat', icon: MessageSquare, label: 'Messenger' },
  { href: '/settings', icon: Settings, label: 'Cài đặt' },
];

export default function MobileMenuSheet({ open, onClose, onLogout }: MobileMenuSheetProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();

  if (!open) return null;

  return (
    <div className="md:hidden fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label="Đóng menu"
      />
      <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto bg-white dark:bg-[#242526] rounded-t-2xl border-t border-slate-200 dark:border-[#3e4042] pb-[env(safe-area-inset-bottom,0px)] animate-slide-up">
        <div className="sticky top-0 bg-white dark:bg-[#242526] px-4 py-3 border-b border-slate-200 dark:border-[#3e4042] flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#050505] dark:text-white">Menu</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-[#3a3b3c]"
            aria-label="Đóng"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4">
          <Link
            href={`/profile/${user?.id}`}
            onClick={onClose}
            className="flex items-center gap-3 p-3 rounded-xl bg-slate-100 dark:bg-[#3a3b3c] hover:opacity-90 transition-opacity"
          >
            <OptimizedAvatar
              src={user?.avatarUrl}
              alt={user?.displayName}
              size={48}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div className="min-w-0">
              <p className="font-bold text-[#050505] dark:text-white truncate">{user?.displayName}</p>
              <p className="text-xs text-[#1877f2] font-semibold flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> Xem trang cá nhân
              </p>
            </div>
          </Link>

          <div className="grid grid-cols-2 gap-2">
            {menuLinks.map(({ href, icon: Icon, label }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                    active
                      ? 'bg-[#e7f3ff] dark:bg-[#263951] text-[#1877f2]'
                      : 'bg-slate-50 dark:bg-[#18191a] text-slate-800 dark:text-[#e4e6eb] hover:bg-slate-100 dark:hover:bg-[#3a3b3c]'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-semibold">{label}</span>
                </Link>
              );
            })}
          </div>

          {user?.role === 'ADMIN' && (
            <Link
              href="/admin"
              onClick={onClose}
              className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-semibold text-sm"
            >
              <ShieldAlert className="w-5 h-5" />
              Quản trị
            </Link>
          )}

          <button
            type="button"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="flex items-center gap-3 p-3 rounded-xl text-red-500 font-semibold text-sm hover:bg-red-50 dark:hover:bg-red-950/20 w-full text-left"
          >
            <LogOut className="w-5 h-5" />
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}
