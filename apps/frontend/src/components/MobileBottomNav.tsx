'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Clapperboard, Store, Menu } from 'lucide-react';

interface MobileBottomNavProps {
  onMenuOpen: () => void;
}

const tabs = [
  { href: '/', icon: Home, label: 'Trang chủ' },
  { href: '/friends', icon: Users, label: 'Bạn bè' },
  { href: '/reels', icon: Clapperboard, label: 'Reels' },
  { href: '/marketplace', icon: Store, label: 'Marketplace' },
] as const;

function isTabActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function MobileBottomNav({ onMenuOpen }: MobileBottomNavProps) {
  const pathname = usePathname() || '/';

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#242526] border-t border-slate-200 dark:border-[#3e4042] pb-[env(safe-area-inset-bottom,0px)]"
      aria-label="Điều hướng chính"
    >
      <div className="flex items-stretch justify-around h-14 max-w-lg mx-auto">
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = isTabActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 min-w-0 px-1 transition-colors ${
                active ? 'text-[#1877f2]' : 'text-slate-600 dark:text-[#b0b3b8]'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className={`w-6 h-6 ${active ? 'stroke-[2.5px]' : ''}`} />
              <span className="text-[10px] font-semibold truncate max-w-full">{label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={onMenuOpen}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 min-w-0 px-1 text-slate-600 dark:text-[#b0b3b8] transition-colors"
          aria-label="Mở menu"
        >
          <Menu className="w-6 h-6" />
          <span className="text-[10px] font-semibold">Menu</span>
        </button>
      </div>
    </nav>
  );
}
