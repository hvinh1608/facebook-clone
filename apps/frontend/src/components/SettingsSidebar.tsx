'use client';

import React from 'react';
import Link from 'next/link';
import { Lock, Bell, UserX, KeyRound, ArrowLeft } from 'lucide-react';

interface SettingsSidebarProps {
  activeTab: 'security' | 'privacy' | 'notifications' | 'blocked';
}

export default function SettingsSidebar({ activeTab }: SettingsSidebarProps) {
  const menuItems = [
    {
      key: 'security',
      href: '/settings',
      label: 'Mật khẩu & Bảo mật',
      icon: KeyRound,
      desc: 'Đổi mật khẩu và bảo vệ tài khoản',
    },
    {
      key: 'privacy',
      href: '/settings/privacy',
      label: 'Quyền riêng tư',
      icon: Lock,
      desc: 'Ai có thể xem và liên hệ với bạn',
    },
    {
      key: 'notifications',
      href: '/settings/notifications',
      label: 'Thông báo',
      icon: Bell,
      desc: 'Tùy chỉnh thông báo hệ thống',
    },
    {
      key: 'blocked',
      href: '/settings/blocked',
      label: 'Người dùng đã chặn',
      icon: UserX,
      desc: 'Quản lý danh sách chặn',
    },
  ];

  return (
    <aside className="w-full md:w-[280px] lg:w-[320px] bg-white dark:bg-[#242526] border-r border-slate-200 dark:border-[#3e4042] flex flex-col flex-shrink-0 h-[calc(100vh-56px)] sticky top-14 overflow-y-auto">
      <div className="p-4 border-b border-slate-150 dark:border-[#3e4042] flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#3a3b3c] rounded-full text-slate-500 transition-colors md:hidden"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Cài đặt</h1>
        </div>
      </div>

      <div className="flex-1 p-2 flex flex-col gap-1.5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.key;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`w-full p-3 text-left flex items-start gap-3 rounded-xl transition-all duration-150 ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-950/20 text-[#1877f2]'
                  : 'hover:bg-slate-100 dark:hover:bg-[#3a3b3c] text-slate-800 dark:text-[#e4e6eb]'
              }`}
            >
              <div className={`p-2 rounded-full flex items-center justify-center flex-shrink-0 ${
                isActive ? 'bg-[#1877f2]/10' : 'bg-slate-100 dark:bg-[#3a3b3c]'
              }`}>
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#1877f2]' : 'text-slate-500 dark:text-slate-400'}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold leading-tight">{item.label}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal truncate">{item.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
