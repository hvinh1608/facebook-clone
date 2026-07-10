import Image from 'next/image';
import { memo, useState } from 'react';
import { resolveMediaUrl } from '../utils/media';

interface PostMediaProps {
  media: Array<{ id: string; url: string; type: 'IMAGE' | 'VIDEO' }>;
}

function MediaItem({
  item,
  index,
  className = '',
  onImageClick,
  showOverlay,
  overlayCount,
}: {
  item: { id: string; url: string; type: 'IMAGE' | 'VIDEO' };
  index: number;
  className?: string;
  onImageClick: (url: string) => void;
  showOverlay?: boolean;
  overlayCount?: number;
}) {
  return (
    <div className={`relative overflow-hidden bg-slate-950 ${className}`}>
      {item.type === 'VIDEO' ? (
        <video
          src={resolveMediaUrl(item.url)}
          controls
          muted
          autoPlay
          loop
          playsInline
          preload="metadata"
          className="w-full h-full object-cover"
        />
      ) : (
        <button
          type="button"
          onClick={() => onImageClick(item.url)}
          className="relative block w-full h-full"
        >
          <Image
            src={resolveMediaUrl(item.url)}
            alt={`Ảnh bài viết ${index + 1}`}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            unoptimized
            className="object-cover cursor-pointer hover:opacity-95 transition-opacity"
          />
        </button>
      )}
      {showOverlay && overlayCount !== undefined && overlayCount > 0 && (
        <button
          type="button"
          onClick={() => onImageClick(item.url)}
          className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-2xl font-bold"
        >
          +{overlayCount}
        </button>
      )}
    </div>
  );
}

function PostMediaComponent({ media }: PostMediaProps) {
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const count = media.length;

  const renderGrid = () => {
    if (count === 1) {
      const item = media[0];
      return (
        <div className="relative aspect-video max-h-[520px]">
          <MediaItem item={item} index={0} className="w-full h-full min-h-[200px]" onImageClick={setSelectedImageUrl} />
        </div>
      );
    }

    if (count === 2) {
      return (
        <div className="grid grid-cols-2 gap-0.5 aspect-video max-h-[400px]">
          {media.map((item, i) => (
            <MediaItem key={item.id} item={item} index={i} className="h-full" onImageClick={setSelectedImageUrl} />
          ))}
        </div>
      );
    }

    if (count === 3) {
      return (
        <div className="grid grid-cols-2 gap-0.5 aspect-video max-h-[400px]">
          <MediaItem item={media[0]} index={0} className="row-span-2 h-full min-h-[200px]" onImageClick={setSelectedImageUrl} />
          <MediaItem item={media[1]} index={1} className="h-full" onImageClick={setSelectedImageUrl} />
          <MediaItem item={media[2]} index={2} className="h-full" onImageClick={setSelectedImageUrl} />
        </div>
      );
    }

    if (count === 4) {
      return (
        <div className="grid grid-cols-2 grid-rows-2 gap-0.5 aspect-square max-h-[400px]">
          {media.map((item, i) => (
            <MediaItem key={item.id} item={item} index={i} className="h-full" onImageClick={setSelectedImageUrl} />
          ))}
        </div>
      );
    }

    // 5+ images: 2x2 grid, last cell shows +N
    const visible = media.slice(0, 4);
    const extra = count - 4;
    return (
      <div className="grid grid-cols-2 grid-rows-2 gap-0.5 aspect-square max-h-[400px]">
        {visible.map((item, i) => (
          <MediaItem
            key={item.id}
            item={item}
            index={i}
            className="h-full"
            onImageClick={setSelectedImageUrl}
            showOverlay={i === 3 && extra > 0}
            overlayCount={extra}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="overflow-hidden mt-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-transparent rounded-lg">
        {renderGrid()}
      </div>

      {selectedImageUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/85 flex items-center justify-center p-4"
          onClick={() => setSelectedImageUrl(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-white/80 hover:text-white text-sm font-semibold"
            onClick={() => setSelectedImageUrl(null)}
          >
            Đóng
          </button>
          <div className="relative w-full max-w-5xl h-[80vh]" onClick={(e) => e.stopPropagation()}>
            <Image
              src={resolveMediaUrl(selectedImageUrl)}
              alt="Ảnh phóng to"
              fill
              sizes="100vw"
              unoptimized
              className="object-contain"
              priority
            />
          </div>
        </div>
      )}
    </>
  );
}

const PostMedia = memo(PostMediaComponent);

export default PostMedia;
