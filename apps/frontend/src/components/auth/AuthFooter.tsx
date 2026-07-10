export default function AuthFooter() {
  const languages = [
    'Tiếng Việt',
    'English (UK)',
    '中文(台灣)',
    '한국어',
    '日本語',
    'Français (France)',
    'ภาษาไทย',
    'Ngôn ngữ khác...',
  ];

  const links = [
    'Đăng ký',
    'Đăng nhập',
    'Messenger',
    'Facebook Lite',
    'Video',
    'Meta Pay',
    'Instagram',
    'Threads',
    'Chính sách quyền riêng tư',
    'Điều khoản',
    'Trợ giúp',
  ];

  return (
    <footer className="w-full bg-white border-t border-[#dddfe2] py-6 px-4">
      <div className="max-w-[980px] mx-auto flex flex-col gap-4 text-[12px] text-[#8a8d91]">
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
          {languages.map((lang) => (
            <span key={lang} className="hover:underline cursor-pointer">
              {lang}
            </span>
          ))}
        </div>
        <div className="hidden md:flex flex-wrap justify-center gap-x-4 gap-y-2">
          {links.map((link) => (
            <span key={link} className="hover:underline cursor-pointer">
              {link}
            </span>
          ))}
        </div>
        <div className="text-center text-[#8a8d91]">Meta © 2026</div>
      </div>
    </footer>
  );
}
