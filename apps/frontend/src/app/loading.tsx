export default function Loading() {
  return (
    <div className="min-h-screen bg-[#f0f2f5] dark:bg-[#18191a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-[#1877f2] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[var(--text-secondary)] font-medium">Đang tải...</p>
      </div>
    </div>
  );
}
