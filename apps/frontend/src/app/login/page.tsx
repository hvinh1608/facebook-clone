'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { Chrome, Shield } from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import AuthShell, { FacebookLogo, MetaWordmark } from '../../components/auth/AuthShell';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (el: HTMLElement, config: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [gsiReady, setGsiReady] = useState(false);
  const [gsiError, setGsiError] = useState(false);
  const googleBtnRef = React.useRef<HTMLDivElement>(null);
  const googleInitialized = React.useRef(false);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleGoogleCredential = useCallback(async (credential: string) => {
    setError('');
    setIsLoading(true);
    try {
      const res = await api.post('/auth/google-login', { credential });
      if (res.data?.status === 'success') {
        const { accessToken, user, refreshToken } = res.data.data;
        login(user, accessToken, refreshToken);
        router.push('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng nhập Google thất bại. Kiểm tra GOOGLE_CLIENT_ID.');
    } finally {
      setIsLoading(false);
    }
  }, [login, router]);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const mountGoogleButton = useCallback(() => {
    if (!googleClientId || !window.google?.accounts?.id || !googleBtnRef.current) return;

    googleBtnRef.current.innerHTML = '';
    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: (response: { credential: string }) => {
        handleGoogleCredential(response.credential);
      },
    });

    window.google.accounts.id.renderButton(googleBtnRef.current, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      width: Math.min(googleBtnRef.current.offsetWidth || 340, 360),
    });
    googleInitialized.current = true;
  }, [googleClientId, handleGoogleCredential]);

  useEffect(() => {
    if (gsiReady) {
      mountGoogleButton();
    }
  }, [gsiReady, mountGoogleButton]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data?.status === 'success') {
        const { accessToken, user, refreshToken } = res.data.data;
        login(user, accessToken, refreshToken);
        router.push('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Email hoặc mật khẩu không chính xác.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLoginMock = async () => {
    setError('');
    setIsLoading(true);

    try {
      const res = await api.post('/auth/google-login', {
        email: 'google_user@nexus.com',
        displayName: 'Google Partner',
        googleId: 'google-oauth-mock-id-12345',
        avatarUrl: null,
      });

      if (res.data?.status === 'success') {
        const { accessToken, user, refreshToken } = res.data.data;
        login(user, accessToken, refreshToken);
        router.push('/');
      }
    } catch {
      setError('Mock Google thất bại. Dùng email/mật khẩu hoặc cấu hình GOOGLE_CLIENT_ID.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell variant="split">
      {googleClientId && (
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          onLoad={() => setGsiReady(true)}
          onError={() => setGsiError(true)}
        />
      )}

      <div className="w-full max-w-[980px] flex flex-col md:flex-row items-center md:items-start justify-between gap-10 md:gap-8">
        <div className="w-full md:w-[580px] text-center md:text-left pt-2 md:pt-16">
          <FacebookLogo className="w-[100px] md:w-[180px] h-auto mx-auto md:mx-0" />
          <p className="mt-2 md:mt-3 text-[20px] md:text-[28px] leading-[28px] md:leading-[32px] text-[#1c1e21] max-w-[500px] mx-auto md:mx-0">
            Facebook giúp bạn kết nối và chia sẻ với mọi người trong cuộc sống của bạn.
          </p>
        </div>

        <div className="w-full max-w-[396px] flex flex-col gap-4">
          <div className="fb-auth-card p-4 flex flex-col gap-4">
            {error && (
              <div className="p-3 bg-[#fff4f4] border border-[#f5c2c7] rounded-md text-sm text-[#b02a37] text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="Email hoặc số di động"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="fb-auth-input"
              />
              <input
                type="password"
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="fb-auth-input"
              />
              <button type="submit" disabled={isLoading} className="fb-auth-btn-primary">
                {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
            </form>

            <Link href="/forgot-password" className="text-center text-[#1877f2] text-sm hover:underline">
              Quên mật khẩu?
            </Link>

            <div className="h-px bg-[#dadde1]" />

            {googleClientId && !gsiError ? (
              <div className="w-full flex flex-col items-center gap-2">
                <div ref={googleBtnRef} className="w-full flex justify-center min-h-[44px]" />
                {!gsiReady && (
                  <p className="text-xs text-[#65676b]">Đang tải đăng nhập Google...</p>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={gsiError ? () => { setGsiError(false); setGsiReady(false); googleInitialized.current = false; } : handleGoogleLoginMock}
                disabled={isLoading}
                className="w-full py-2.5 bg-white hover:bg-[#f5f6f7] text-[#1c1e21] rounded-md text-sm font-semibold flex items-center justify-center gap-2 border border-[#dddfe2] transition-colors"
              >
                <Chrome className="w-5 h-5 text-red-500" />
                {gsiError ? 'Thử lại đăng nhập Google' : 'Đăng nhập bằng Google (demo)'}
              </button>
            )}

            <Link href="/signup" className="fb-auth-btn-secondary flex items-center justify-center">
              Tạo tài khoản mới
            </Link>
          </div>

          <p className="text-center text-[14px] text-[#1c1e21]">
            <strong>Tạo Trang</strong> dành cho người nổi tiếng, thương hiệu hoặc doanh nghiệp.
          </p>

          <div className="flex flex-col items-center gap-3 pt-1">
            <MetaWordmark />

            <details className="w-full text-center group">
              <summary className="text-xs text-[#8a8d91] hover:text-[#65676b] font-semibold select-none list-none cursor-pointer">
                Tài khoản test
              </summary>
              <div className="flex flex-col gap-3 mt-3 text-left">
                <div className="p-3 bg-white rounded-md border border-[#dddfe2] flex gap-3 items-start text-xs text-[#65676b]">
                  <Shield className="w-5 h-5 text-[#1877f2] flex-shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-[#1c1e21]">Tài khoản test nhanh:</span>
                    <span>Thường: <b>alice@nexus.com</b> (mật khẩu: <b>password123</b>)</span>
                    <span>Admin: <b>admin@nexus.com</b> (mật khẩu: <b>password123</b>)</span>
                  </div>
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>
    </AuthShell>
  );
}
