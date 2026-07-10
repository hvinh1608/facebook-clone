'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { resolveMediaUrl } from '../utils/media';

interface PhotoLightboxProps {
  photos: { id: string; url: string }[];
  initialIndex?: number;
  onClose: () => void;
}

export default function PhotoLightbox({ photos, initialIndex = 0, onClose }: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setCurrentIndex((i) => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setCurrentIndex((i) => Math.min(photos.length - 1, i + 1));
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose, photos.length]);

  const current = photos[currentIndex];
  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
        aria-label="Đóng"
      >
        <X className="w-6 h-6" />
      </button>

      {currentIndex > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setCurrentIndex((i) => i - 1);
          }}
          className="absolute left-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
          aria-label="Ảnh trước"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}

      {currentIndex < photos.length - 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setCurrentIndex((i) => i + 1);
          }}
          className="absolute right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
          aria-label="Ảnh sau"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      )}

      <div
        className="relative max-w-[90vw] max-h-[85vh] w-full h-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={resolveMediaUrl(current.url)}
          alt={`Ảnh ${currentIndex + 1}`}
          width={1200}
          height={900}
          unoptimized
          className="max-w-full max-h-[85vh] w-auto h-auto object-contain"
        />
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm font-medium">
        {currentIndex + 1} / {photos.length}
      </div>
    </div>
  );
}
