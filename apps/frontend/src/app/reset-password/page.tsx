'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Reset token is missing in the URL.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await api.post('/auth/reset-password', { token, newPassword: password });
      if (res.data?.status === 'success') {
        setIsSuccess(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Password reset failed. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl bg-slate-900/60 shadow-glass border border-slate-800 relative z-10 flex flex-col gap-6 items-center text-center">
        <CheckCircle2 className="w-16 h-16 text-green-500 animate-bounce" />
        <h2 className="text-2xl font-extrabold text-white">Password Updated</h2>
        <p className="text-sm text-slate-400 font-normal">
          Your password has been successfully updated. You can now sign in.
        </p>
        <Link
          href="/login"
          className="w-full mt-2 py-3 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-sm transition-all"
        >
          Go to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md glass-panel p-8 rounded-3xl bg-slate-900/60 shadow-glass border border-slate-800 relative z-10 flex flex-col gap-6">
      <div className="text-center flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-brand-400 via-accent-500 to-indigo-500 bg-clip-text text-transparent">
          New Password
        </h1>
        <p className="text-sm text-slate-400">Set a new, secure password for your account.</p>
      </div>

      {error && (
        <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-xl text-xs text-red-400 text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4.5">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-400">New Password</label>
          <div className="relative">
            <input
              type="password"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm focus:border-brand-500 focus:outline-none transition-all placeholder-slate-650"
            />
            <Lock className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-500" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-400">Confirm Password</label>
          <div className="relative">
            <input
              type="password"
              placeholder="Re-type password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm focus:border-brand-500 focus:outline-none transition-all placeholder-slate-650"
            />
            <Lock className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-500" />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 py-3 bg-gradient-to-r from-brand-600 to-accent-600 hover:from-brand-500 hover:to-accent-500 text-white font-semibold rounded-xl text-sm shadow-glass-sm flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
        >
          {isLoading ? 'Resetting...' : 'Change Password'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-brand-500/10 rounded-full blur-[100px]"></div>
      <Suspense fallback={
        <div className="w-full max-w-md glass-panel p-8 rounded-3xl bg-slate-900/60 shadow-glass border border-slate-800 relative z-10 flex flex-col gap-6 items-center text-center">
          <Loader2 className="w-16 h-16 text-brand-500 animate-spin" />
          <h2 className="text-2xl font-extrabold text-white">Loading...</h2>
        </div>
      }>
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}
