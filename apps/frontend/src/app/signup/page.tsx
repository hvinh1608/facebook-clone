'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HelpCircle, ChevronLeft } from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import AuthShell, { MetaWordmark } from '../../components/auth/AuthShell';

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuthStore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [gender, setGender] = useState('');

  const days = Array.from({ length: 31 }, (_, i) => String(i + 1));
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const years = Array.from({ length: 100 }, (_, i) => String(new Date().getFullYear() - i));

  const selectClass =
    'w-full px-4 py-3 bg-white border border-[#ccd0d5] rounded-md text-[15px] text-[#1c1e21] focus:outline-none focus:border-[#1877f2] focus:ring-1 focus:ring-[#1877f2] appearance-none';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const displayName = `${lastName} ${firstName}`.trim();
    if (!displayName) {
      setError('Vui lòng nhập Họ và Tên.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.post('/auth/signup', { email, password, displayName }, { timeout: 45000 });
      if (res.data?.status === 'success') {
        const { accessToken, user, refreshToken } = res.data.data;
        login(user, accessToken, refreshToken);
        router.push('/');
      }
    } catch (err: any) {
      if (err.code === 'ECONNABORTED') {
        setError('Server phản hồi chậm (Render đang khởi động). Thử lại sau 30 giây.');
      } else {
        setError(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell variant="centered">
      <div className="w-full max-w-[432px] flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <Link href="/login" className="self-start text-[#1c1e21] p-1 hover:bg-[#e4e6eb] rounded-full">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <MetaWordmark />
          <h2 className="text-[24px] font-bold text-[#1c1e21] leading-tight">Bắt đầu trên Facebook</h2>
          <p className="text-[15px] text-[#65676b] leading-normal">
            Hãy tạo tài khoản để kết nối với bạn bè, người thân và cộng đồng có chung mối quan tâm với bạn.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-[#fff4f4] border border-[#f5c2c7] rounded-md text-xs text-[#b02a37] text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-semibold text-[#1c1e21]">Tên</label>
            <div className="flex gap-3 w-full">
              <input type="text" placeholder="Họ" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="fb-auth-input !text-[15px] !py-3" />
              <input type="text" placeholder="Tên" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="fb-auth-input !text-[15px] !py-3" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1">
              <label className="text-[14px] font-semibold text-[#1c1e21]">Ngày sinh</label>
              <HelpCircle className="w-4 h-4 text-[#8a8d91]" />
            </div>
            <div className="flex gap-3 w-full">
              <select value={birthDay} onChange={(e) => setBirthDay(e.target.value)} required className={selectClass}>
                <option value="" disabled hidden>Ngày</option>
                {days.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)} required className={selectClass}>
                <option value="" disabled hidden>Tháng</option>
                {months.map((m) => <option key={m} value={m}>Tháng {m}</option>)}
              </select>
              <select value={birthYear} onChange={(e) => setBirthYear(e.target.value)} required className={selectClass}>
                <option value="" disabled hidden>Năm</option>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1">
              <label className="text-[14px] font-semibold text-[#1c1e21]">Giới tính</label>
              <HelpCircle className="w-4 h-4 text-[#8a8d91]" />
            </div>
            <select value={gender} onChange={(e) => setGender(e.target.value)} required className={selectClass}>
              <option value="" disabled hidden>Chọn giới tính</option>
              <option value="female">Nữ</option>
              <option value="male">Nam</option>
              <option value="custom">Khác</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-semibold text-[#1c1e21]">Số di động hoặc email</label>
            <input type="email" placeholder="Số di động hoặc email" value={email} onChange={(e) => setEmail(e.target.value)} required className="fb-auth-input !text-[15px] !py-3" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-semibold text-[#1c1e21]">Mật khẩu</label>
            <input type="password" placeholder="Mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} required className="fb-auth-input !text-[15px] !py-3" />
          </div>

          <p className="text-[11px] text-[#777] leading-[16px]">
            Bằng việc nhấn Gửi, bạn đồng ý với{' '}
            <span className="text-[#1877f2] hover:underline cursor-pointer">Điều khoản</span>,{' '}
            <span className="text-[#1877f2] hover:underline cursor-pointer">Chính sách quyền riêng tư</span> và{' '}
            <span className="text-[#1877f2] hover:underline cursor-pointer">Chính sách cookie</span> của Facebook.
          </p>

          <button type="submit" disabled={isLoading} className="fb-auth-btn-primary !text-[17px]">
            {isLoading ? 'Đang gửi...' : 'Gửi'}
          </button>

          <Link href="/login" className="fb-auth-btn-outline flex items-center justify-center">
            Tôi có tài khoản rồi
          </Link>
        </form>
      </div>
    </AuthShell>
  );
}
