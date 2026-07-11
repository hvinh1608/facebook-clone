'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import axios from 'axios';
import Header from './Header';
import Sidebar from './Sidebar';
import RightSidebar from './RightSidebar';
import ChatBoxesContainer from './ChatBoxesContainer';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, updateUser } = useAuthStore();
  // Sidebars only on home feed; discovery pages (friends, events, pages, etc.) use full width
  const showSidebars = pathname === '/';
  const hideSidebars = !showSidebars;
  const isFullBleedPage =
    pathname?.startsWith('/watch') ||
    pathname?.startsWith('/profile/') ||
    pathname?.startsWith('/reels');

  useEffect(() => {
    const refreshSession = async () => {
      const { isAuthenticated, refreshToken, login, logout } = useAuthStore.getState();
      if (!isAuthenticated || !refreshToken) return;

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const res = await axios.post(`${apiUrl}/auth/refresh-token`, { refreshToken });
        if (res.data?.status === 'success') {
          const { accessToken, user, refreshToken: nextRefresh } = res.data.data;
          login(user, accessToken, nextRefresh ?? refreshToken);
        }
      } catch {
        logout();
      }
    };

    void refreshSession();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const refreshCurrentUser = async () => {
      const currentUser = useAuthStore.getState().user;
      if (!isAuthenticated || !currentUser?.id) return;

      try {
        const res = await api.get(`/users/profile/${currentUser.id}`);
        if (res.data?.status === 'success') {
          const profileUser = res.data.data.user;
          updateUser({
            displayName: profileUser.profile?.displayName,
            avatarUrl: profileUser.profile?.avatarUrl ?? null,
            coverUrl: profileUser.profile?.coverUrl ?? null,
          });
        }
      } catch {
        // Keep cached user if profile refresh fails.
      }
    };

    refreshCurrentUser();
  }, [isAuthenticated, updateUser]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] dark:bg-[#18191a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-10 h-10 border-4 border-[#1877f2] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500 font-sans">Đang chuyển hướng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f2f5] dark:bg-[#18191a] text-[#050505] dark:text-[#e4e6eb] pb-16 md:pb-0">
      <Header />

      <div
        className={`flex flex-1 w-full mx-auto ${
          hideSidebars ? 'max-w-none px-0' : 'max-w-[1464px] gap-4 xl:gap-6 px-0 md:px-4'
        }`}
      >
        {!showSidebars && <Sidebar mobileOnly />}
        {showSidebars && <Sidebar />}

        <main
          className={`flex-1 min-w-0 overflow-y-auto ${
            isFullBleedPage
              ? 'px-0 py-0 pb-0 md:pb-0'
              : hideSidebars
                ? 'px-2 py-4 md:px-6 md:py-6 pb-24 md:pb-8'
                : 'px-2 py-4 md:px-0 md:py-6 pb-24 md:pb-8'
          }`}
        >
          {children}
        </main>

        {showSidebars && <RightSidebar />}
      </div>

      <ChatBoxesContainer />
    </div>
  );
}
