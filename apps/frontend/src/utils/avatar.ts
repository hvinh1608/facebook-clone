import { resolveMediaUrl } from './media';

export const DEFAULT_AVATAR =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none">
      <rect width="80" height="80" rx="40" fill="#E4E6EB"/>
      <path d="M40 41c5.8 0 10.5-4.7 10.5-10.5S45.8 20 40 20s-10.5 4.7-10.5 10.5S34.2 41 40 41zm0 5.2c-7 0-21 3.5-21 10.5V60h42v-3.3c0-7-14-10.5-21-10.5z" fill="#B0B3B8"/>
    </svg>`
  );

export const DEFAULT_GROUP_COVER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 300" fill="none">
      <rect width="1200" height="300" fill="#CED0D4"/>
      <rect x="0" y="200" width="1200" height="100" fill="#B0B3B8" opacity="0.35"/>
    </svg>`
  );

export const DEFAULT_GROUP_AVATAR =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none">
      <rect width="80" height="80" rx="12" fill="#E4E6EB"/>
      <path d="M40 28c4.4 0 8-3.6 8-8s-3.6-8-8-8-8 3.6-8 8 3.6 8 8 8zm0 4c-5.3 0-16 2.7-16 8v8h32v-8c0-5.3-10.7-8-16-8z" fill="#B0B3B8"/>
    </svg>`
  );

/** Square cover placeholder for the "Create story" card background */
export const DEFAULT_STORY_CREATE_COVER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 112 130" fill="none">
      <rect width="112" height="130" fill="#E4E6EB"/>
      <path d="M56 58c8.3 0 15-6.7 15-15s-6.7-15-15-15-15 6.7-15 15 6.7 15 15 15zm0 7.5c-10 0-30 5-30 15V95h60V80.5c0-10-20-15-30-15z" fill="#B0B3B8"/>
    </svg>`
  );

export const resolveGroupCoverUrl = (value?: string | null) => {
  if (!value || !value.trim()) return DEFAULT_GROUP_COVER;
  return resolveMediaUrl(value) || DEFAULT_GROUP_COVER;
};

export const resolveGroupAvatarUrl = (value?: string | null) => {
  if (!value || !value.trim()) return DEFAULT_GROUP_AVATAR;
  return resolveMediaUrl(value) || DEFAULT_GROUP_AVATAR;
};

export const resolveAvatarUrl = (value?: string | null) => {
  if (!value || !value.trim()) return DEFAULT_AVATAR;
  return resolveMediaUrl(value) || DEFAULT_AVATAR;
};

export const normalizeAuthUser = (user: {
  id?: string;
  email?: string;
  role?: 'USER' | 'ADMIN';
  displayName?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
}) => {
  const email = user.email || '';
  return {
    id: user.id || '',
    email,
    role: user.role || 'USER',
    displayName: user.displayName || (email ? email.split('@')[0] : 'Người dùng'),
    avatarUrl: user.avatarUrl?.trim() || null,
    coverUrl: user.coverUrl?.trim() || null,
  };
};
