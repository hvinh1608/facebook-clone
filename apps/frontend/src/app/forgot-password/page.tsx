'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import AuthShell from '../../components/auth/AuthShell';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data?.status === 'success') {
        setIsSuccess(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể gửi liên kết khôi phục. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <AuthShell variant="centered">
        <div className="w-full max-w-[432px] fb-auth-card p-6 flex flex-col gap-5 items-center text-center">
          <CheckCircle2 className="w-14 h-14 text-[#1877f2]" />
          <h2 className="text-xl font-bold text-[#1c1e21]">Liên kết khôi phục đã được tạo</h2>
          <p className="text-sm text-[#65676b]">
            Yêu cầu khôi phục mật khẩu đã được xử lý cho <span className="font-semibold text-[#1c1e21]">{email}</span>.
          </p>

          <div className="p-4 bg-[#f0f2f5] border border-[#dddfe2] rounded-md text-[12px] text-left flex flex-col gap-2 w-full text-[#65676b]">
            <span className="font-bold text-[#1c1e21] uppercase tracking-wide block">Hướng dẫn thử nghiệm:</span>
            <span>Kiểm tra logs terminal <span className="font-semibold text-[#1877f2]">nexus-backend</span> để lấy URL đặt lại mật khẩu.</span>
          </div>

          <Link href="/login" className="fb-auth-btn-primary flex items-center justify-center text-base">
            Quay lại trang đăng nhập
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell variant="centered">
      <div className="w-full max-w-[432px] flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <Link href="/login" className="self-start text-[#1c1e21] p-1 hover:bg-[#e4e6eb] rounded-full">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h2 className="text-[24px] font-bold text-[#1c1e21] leading-tight">Tìm tài khoản của bạn</h2>
          <p className="text-[15px] text-[#65676b] leading-normal">Hãy nhập số di động hoặc email của bạn.</p>
        </div>

        {error && (
          <div className="p-3 bg-[#fff4f4] border border-[#f5c2c7] rounded-md text-xs text-[#b02a37] text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="fb-auth-input !text-[15px] !py-3"
          />

          <button type="submit" disabled={isLoading} className="fb-auth-btn-primary !text-[17px]">
            {isLoading ? 'Đang gửi...' : 'Tìm kiếm'}
          </button>

          <Link href="/login" className="fb-auth-btn-outline flex items-center justify-center">
            Quay lại đăng nhập
          </Link>
        </form>
      </div>
    </AuthShell>
  );
}
