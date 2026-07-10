import Link from 'next/link';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f0f2f5] dark:bg-[#18191a] flex items-center justify-center p-4">
      <div className="fb-card max-w-md w-full p-8 text-center flex flex-col items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-[#e7f3ff] dark:bg-[#3a3b3c] flex items-center justify-center">
          <span className="text-4xl">🔍</span>
        </div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Không tìm thấy trang</h1>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          Trang bạn đang tìm kiếm có thể đã bị xóa, đổi tên hoặc tạm thời không khả dụng.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 w-full mt-2">
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1877f2] hover:bg-[#166fe5] text-white font-semibold rounded-lg text-sm transition-colors"
          >
            <Home className="w-4 h-4" />
            Về bảng tin
          </Link>
          <Link
            href="/search"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--hover-bg)] hover:opacity-90 text-[var(--text-primary)] font-semibold rounded-lg text-sm transition-colors"
          >
            <Search className="w-4 h-4" />
            Tìm kiếm
          </Link>
        </div>
      </div>
    </div>
  );
}
