'use client';

import React, { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const verifyStarted = useRef(false);

  useEffect(() => {
    const normalizedToken = token?.trim();
    if (!normalizedToken) {
      setStatus('error');
      setMessage('Thiếu mã xác minh. Vui lòng mở lại link trong email.');
      return;
    }

    if (verifyStarted.current) return;
    verifyStarted.current = true;

    const verify = async () => {
      try {
        const res = await api.post('/auth/verify-email', { token: normalizedToken });
        if (res.data?.status === 'success') {
          setStatus('success');
          setMessage(res.data.message || 'Xác minh email thành công!');
        }
      } catch (err: any) {
        setStatus('error');
        setMessage(
          err.response?.data?.message ||
            'Link xác minh không hợp lệ hoặc đã hết hạn. Thử đăng nhập hoặc đăng ký lại.'
        );
      }
    };

    verify();
  }, [token]);

  return (
    <div className="w-full max-w-md glass-panel p-8 rounded-3xl bg-slate-900/60 shadow-glass border border-slate-800 relative z-10 flex flex-col gap-6 items-center text-center">
      {status === 'loading' && (
        <>
          <Loader2 className="w-16 h-16 text-brand-500 animate-spin" />
          <h2 className="text-2xl font-extrabold">Verifying Email...</h2>
          <p className="text-sm text-slate-400">Please wait while we activate your account.</p>
        </>
      )}

      {status === 'success' && (
        <>
          <CheckCircle2 className="w-16 h-16 text-green-500" />
          <h2 className="text-2xl font-extrabold text-white">Email Verified!</h2>
          <p className="text-sm text-slate-400">{message}</p>
          <Link
            href="/login"
            className="w-full mt-2 py-3 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-sm transition-all"
          >
            Sign In Now
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <XCircle className="w-16 h-16 text-red-500" />
          <h2 className="text-2xl font-extrabold text-white">Xác minh thất bại</h2>
          <p className="text-sm text-red-400">{message}</p>
          <Link
            href="/login"
            className="w-full mt-2 py-3 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-sm transition-all"
          >
            Thử đăng nhập
          </Link>
          <Link
            href="/signup"
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-sm transition-all"
          >
            Đăng ký lại
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-brand-500/10 rounded-full blur-[100px]"></div>
      <Suspense fallback={
        <div className="w-full max-w-md glass-panel p-8 rounded-3xl bg-slate-900/60 shadow-glass border border-slate-800 relative z-10 flex flex-col gap-6 items-center text-center">
          <Loader2 className="w-16 h-16 text-brand-500 animate-spin" />
          <h2 className="text-2xl font-extrabold">Loading...</h2>
        </div>
      }>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
