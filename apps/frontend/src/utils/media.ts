const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

export const resolveMediaUrl = (value?: string | null) => {
  if (!value) return value ?? '';
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/')) return `${API_ORIGIN}${value}`;
  return `${API_ORIGIN}/${value}`;
};

export const isBackendMediaUrl = (value?: string | null) => {
  if (!value) return false;
  return value.startsWith('/uploads/') || value.includes('/uploads/');
};
