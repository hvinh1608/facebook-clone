import Image from 'next/image';
import { resolveAvatarUrl } from '../utils/avatar';

interface OptimizedAvatarProps {
  src?: string | null;
  alt?: string;
  size?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  square?: boolean;
}

export default function OptimizedAvatar({
  src,
  alt,
  size = 40,
  fill = false,
  className = '',
  priority = false,
  square = false,
}: OptimizedAvatarProps) {
  const resolvedSrc = resolveAvatarUrl(src);
  const shapeClass = square ? 'rounded-md' : 'rounded-full';

  if (fill) {
    return (
      <div className={`relative overflow-hidden bg-[#e4e6eb] w-full h-full ${shapeClass} ${className}`}>
        <Image
          src={resolvedSrc}
          alt={alt || 'Avatar'}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          priority={priority}
          unoptimized={resolvedSrc.startsWith('data:') || resolvedSrc.includes('/uploads/')}
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden ${shapeClass} flex-shrink-0 bg-[#e4e6eb] ${className}`}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
    >
      <Image
        src={resolvedSrc}
        alt={alt || 'Avatar'}
        fill
        sizes={`${size}px`}
        priority={priority}
        unoptimized={resolvedSrc.startsWith('data:') || resolvedSrc.includes('/uploads/')}
        className="object-cover"
      />
    </div>
  );
}
