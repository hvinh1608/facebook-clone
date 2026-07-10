import AuthFooter from './AuthFooter';

export function FacebookLogo({ className = 'w-[120px] md:w-[200px] h-auto' }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" className={`text-[#1877f2] ${className}`} fill="currentColor" aria-hidden>
      <path d="M20.181 35.87C29.094 34.791 36 27.202 36 18c0-9.941-8.059-18-18-18S0 8.059 0 18c0 8.442 5.811 15.526 13.652 17.471L14 36v-13h-4v-5h4v-3.89c0-3.953 2.355-6.11 5.918-6.11 1.707 0 3.492.304 3.492.304v3.841h-1.968c-1.959 0-2.571 1.215-2.571 2.46V18h4.375l-.699 5h-3.676v13l.433-.13z" />
    </svg>
  );
}

export function MetaWordmark() {
  return (
    <span className="text-[#1877f2] font-semibold text-[15px] inline-flex items-center gap-1.5 select-none">
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <path d="M18.73 5.4c-1.24 0-2.52.61-3.46 1.76a7.28 7.28 0 00-3.27-1.76C10.76 5.4 9.48 6 8.54 7.16a6.83 6.83 0 00-2.48-1.57c-1-.31-2-.19-2.86.35C2.33 6.5 1.8 7.58 1.8 9.07c0 2.22 1.34 4.88 3.58 7.5a14.28 14.28 0 005.15 3.91 3.5 3.5 0 002.94 0 14.28 14.28 0 005.15-3.91c2.24-2.62 3.58-5.28 3.58-7.5 0-1.49-.53-2.57-1.4-3.13a3.46 3.46 0 00-2.07-.55zm.62 3.67c0 1.63-1.07 3.86-3.05 6.17a12.65 12.65 0 01-4.22 3.23c-.34.16-.76.16-1.1 0a12.65 12.65 0 01-4.22-3.23c-1.98-2.31-3.05-4.54-3-6.17 0-.82.25-1.35.67-1.62a1.86 1.86 0 011.66-.08c.55.22 1.07.69 1.54 1.39l.23.36a.6.6 0 001.07-.44v-.11c.21-1.39.93-2.22 1.94-2.22.82 0 1.64.67 2.37 1.94l.11.2a.6.6 0 001.06-.4v-.17c.21-1.37.93-2.2 1.94-2.2.82 0 1.64.67 2.37 1.94l.1.18a.6.6 0 001 .07c.56-.7 1.08-1.17 1.63-1.39a1.87 1.87 0 011.66.08c.42.27.67.8.67 1.62z" />
      </svg>
      Meta
    </span>
  );
}

export default function AuthShell({
  children,
  variant = 'split',
}: {
  children: React.ReactNode;
  variant?: 'split' | 'centered';
}) {
  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col text-[#1c1e21]">
      <div
        className={`flex-1 flex items-center justify-center px-4 py-8 ${
          variant === 'split' ? 'md:py-16' : 'py-12'
        }`}
      >
        {children}
      </div>
      <AuthFooter />
    </div>
  );
}
