/** Routes that use the Facebook 3-column layout (left + main + right sidebars). */
const FULL_BLEED_PREFIXES = ['/reels', '/watch', '/profile/', '/chat', '/live', '/admin', '/login', '/signup'];

const SIDEBAR_PREFIXES = [
  '/',
  '/friends',
  '/groups',
  '/marketplace',
  '/events',
  '/pages',
  '/memories',
  '/saved',
  '/notifications',
  '/search',
  '/posts',
  '/settings',
];

export function shouldShowSidebars(pathname: string | null): boolean {
  if (!pathname) return false;
  if (FULL_BLEED_PREFIXES.some((p) => pathname.startsWith(p))) return false;
  if (pathname === '/') return true;
  return SIDEBAR_PREFIXES.some(
    (p) => p !== '/' && (pathname === p || pathname.startsWith(`${p}/`))
  );
}

export function isFullBleedPage(pathname: string | null): boolean {
  if (!pathname) return false;
  return FULL_BLEED_PREFIXES.some((p) => pathname.startsWith(p));
}

export function isReelsPage(pathname: string | null): boolean {
  return pathname?.startsWith('/reels') ?? false;
}
