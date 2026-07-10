'use client';

import { useEffect } from 'react';
import { RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#f0f2f5] dark:bg-[#18191a] flex items-center justify-center p-4">
      <div className="fb-card max-w-md w-full p-8 text-center flex flex-col items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
          <span className="text-4xl">⚠️</span>
        </div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Đã xảy ra lỗi</h1>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          Rất tiếc, đã có lỗi xảy ra khi tải trang. Vui lòng thử lại hoặc quay về bảng tin.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 w-full mt-2">
          <button
            type="button"
            onClick={reset}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1877f2] hover:bg-[#166fe5] text-white font-semibold rounded-lg text-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Thử lại
          </button>
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--hover-bg)] hover:opacity-90 text-[var(--text-primary)] font-semibold rounded-lg text-sm transition-colors"
          >
            <Home className="w-4 h-4" />
            Về bảng tin
          </Link>
        </div>
      </div>
    </div>
  );
}
