'use client';

import Image from 'next/image';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, X, ChevronLeft, ChevronRight, Eye, Type, Sticker, Send } from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useChatBoxesStore } from '../store/chatBoxesStore';
import OptimizedAvatar from './OptimizedAvatar';
import { resolveAvatarUrl, DEFAULT_STORY_CREATE_COVER } from '../utils/avatar';
import { resolveMediaUrl } from '../utils/media';

interface StorySticker {
  emoji: string;
  x: number;
  y: number;
}

interface Story {
  id: string;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO';
  caption?: string | null;
  stickerData?: StorySticker[] | null;
  createdAt: string;
  hasViewed: boolean;
}

interface GroupedStory {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  stories: Story[];
}

const STICKER_OPTIONS = ['😀', '❤️', '🔥', '👏', '🎉', '💯', '😍', '🤣', '⭐', '🙌'];

export default function StoryCarousel() {
  const { user } = useAuthStore();
  const { openBox } = useChatBoxesStore();
  const searchParams = useSearchParams();
  const [groupedStories, setGroupedStories] = useState<GroupedStory[]>([]);
  const [activeUserStories, setActiveUserStories] = useState<GroupedStory | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [showViewer, setShowViewer] = useState(false);
  const [viewers, setViewers] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFile, setCreateFile] = useState<File | null>(null);
  const [createPreview, setCreatePreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [stickers, setStickers] = useState<StorySticker[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeStory = useMemo(
    () => activeUserStories?.stories[activeStoryIndex] ?? null,
    [activeStoryIndex, activeUserStories]
  );

  const fetchStories = useCallback(async () => {
    try {
      const res = await api.get('/stories/feed');
      if (res.data?.status === 'success') {
        setGroupedStories(res.data.data);
      }
    } catch (e) {
      console.error('Error fetching stories', e);
    }
  }, []);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  useEffect(() => {
    if (searchParams.get('story') === 'create') {
      fileInputRef.current?.click();
    }
  }, [searchParams]);

  useEffect(() => {
    const handleOpenStoryCreate = () => fileInputRef.current?.click();
    window.addEventListener('open-story-create', handleOpenStoryCreate);
    return () => window.removeEventListener('open-story-create', handleOpenStoryCreate);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCreateFile(file);
    setCreatePreview(URL.createObjectURL(file));
    setShowCreateModal(true);
    setCaption('');
    setStickers([]);
  };

  const addSticker = (emoji: string) => {
    setStickers((prev) => [
      ...prev,
      { emoji, x: 20 + Math.random() * 60, y: 20 + Math.random() * 50 },
    ]);
  };

  const handlePublishStory = async () => {
    if (!createFile) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('media', createFile);
      if (caption.trim()) formData.append('caption', caption.trim());
      if (stickers.length > 0) formData.append('stickerData', JSON.stringify(stickers));

      const res = await api.post('/stories', formData);
      if (res.data?.status === 'success') {
        setShowCreateModal(false);
        setCreateFile(null);
        if (createPreview) URL.revokeObjectURL(createPreview);
        setCreatePreview(null);
        fetchStories();
      }
    } catch (err) {
      console.error('Error uploading story', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenViewer = async (group: GroupedStory) => {
    setActiveUserStories(group);
    setActiveStoryIndex(0);
    setShowViewer(true);
    setReplyText('');
    await logStoryView(group.stories[0].id, group.userId);
  };

  const handleNextStory = async () => {
    if (!activeUserStories) return;
    if (activeStoryIndex < activeUserStories.stories.length - 1) {
      const nextIndex = activeStoryIndex + 1;
      setActiveStoryIndex(nextIndex);
      await logStoryView(activeUserStories.stories[nextIndex].id, activeUserStories.userId);
    } else {
      const currentGroupIndex = groupedStories.findIndex((g) => g.userId === activeUserStories.userId);
      if (currentGroupIndex < groupedStories.length - 1) {
        const nextGroup = groupedStories[currentGroupIndex + 1];
        setActiveUserStories(nextGroup);
        setActiveStoryIndex(0);
        await logStoryView(nextGroup.stories[0].id, nextGroup.userId);
      } else {
        setShowViewer(false);
      }
    }
  };

  const handlePrevStory = () => {
    if (!activeUserStories) return;
    if (activeStoryIndex > 0) {
      setActiveStoryIndex(activeStoryIndex - 1);
    } else {
      const currentGroupIndex = groupedStories.findIndex((g) => g.userId === activeUserStories.userId);
      if (currentGroupIndex > 0) {
        const prevGroup = groupedStories[currentGroupIndex - 1];
        setActiveUserStories(prevGroup);
        setActiveStoryIndex(prevGroup.stories.length - 1);
      }
    }
  };

  useEffect(() => {
    if (!showViewer || !activeStory || activeStory.mediaType !== 'IMAGE') return;
    const timer = window.setTimeout(() => { handleNextStory(); }, 4500);
    return () => window.clearTimeout(timer);
  }, [activeStory, showViewer]);

  const logStoryView = useCallback(async (storyId: string, ownerUserId?: string) => {
    try {
      await api.post(`/stories/view/${storyId}`);
      if (ownerUserId === user?.id) {
        const viewsRes = await api.get(`/stories/views/${storyId}`);
        if (viewsRes.data?.status === 'success') {
          setViewers(viewsRes.data.data);
        }
      }
    } catch (e) {
      console.error('Error logging story view', e);
    }
  }, [user?.id]);

  const handleReplyDM = async () => {
    if (!activeUserStories || activeUserStories.userId === user?.id) return;
    const text = replyText.trim() || 'Phản hồi tin của bạn 👋';
    try {
      const convRes = await api.post('/messages/conversations', {
        isGroup: false,
        userIds: [activeUserStories.userId],
      });
      const conv = convRes.data?.data;
      if (conv?.id) {
        await api.post(`/messages/${conv.id}/messages`, { content: text });
        openBox(activeUserStories.userId);
        setShowViewer(false);
      }
    } catch (e) {
      console.error('Error sending story reply', e);
    }
  };

  const renderOverlays = (story: Story) => (
    <>
      {story.caption && (
        <div className="absolute bottom-24 left-0 right-0 px-6 text-center z-10 pointer-events-none">
          <p className="text-white text-lg font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{story.caption}</p>
        </div>
      )}
      {(story.stickerData || []).map((s, i) => (
        <span
          key={i}
          className="absolute text-4xl pointer-events-none drop-shadow-lg"
          style={{ left: `${s.x}%`, top: `${s.y}%`, transform: 'translate(-50%, -50%)' }}
        >
          {s.emoji}
        </span>
      ))}
    </>
  );

  return (
    <div className="w-full flex items-center gap-3 overflow-x-auto py-1 scrollbar-none">
      {/* Create story card */}
      <div 
        className="fb-story-create-card flex-shrink-0"
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="fb-story-create-img-wrapper">
          <img
            src={user?.avatarUrl?.trim() ? resolveAvatarUrl(user.avatarUrl) : DEFAULT_STORY_CREATE_COVER}
            alt="My avatar"
            className="fb-story-create-img"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = DEFAULT_STORY_CREATE_COVER;
            }}
          />
        </div>
        <div className="fb-story-create-info">
          <div className="fb-story-create-btn">
            <Plus className="w-5 h-5 text-white" />
          </div>
          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 select-none">Tạo tin</span>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*,video/*" className="hidden" />
      </div>

      {groupedStories.map((group) => {
        const hasUnviewed = group.stories.some((s) => !s.hasViewed);
        const firstStory = group.stories[0];
        
        return (
          <div 
            key={group.userId} 
            className="fb-story-card flex-shrink-0"
            onClick={() => handleOpenViewer(group)}
          >
            {/* Story Preview Media */}
            {firstStory.mediaType === 'IMAGE' ? (
              <img 
                src={resolveMediaUrl(firstStory.mediaUrl)} 
                alt={group.displayName} 
                className="fb-story-img"
                loading="lazy"
              />
            ) : (
              <video 
                src={resolveMediaUrl(firstStory.mediaUrl)} 
                className="fb-story-img"
                muted
                playsInline
              />
            )}
            
            {/* Dark gradient overlay */}
            <div className="fb-story-overlay" />
            
            {/* Avatar positioning */}
            <div className={`fb-story-avatar ${!hasUnviewed ? 'fb-story-avatar-viewed' : ''}`}>
              <OptimizedAvatar 
                src={group.avatarUrl} 
                alt={group.displayName} 
                size={32} 
                className="w-8 h-8"
              />
            </div>
            
            {/* Author name at bottom */}
            <span className="fb-story-name">
              {group.userId === user?.id ? 'Tin của bạn' : group.displayName}
            </span>
          </div>
        );
      })}

      {showCreateModal && createPreview && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#242526] rounded-2xl overflow-hidden border border-[#3e4042]">
            <div className="px-4 py-3 border-b border-[#3e4042] flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">Tạo tin mới</h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-[#3a3b3c] rounded-full">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="relative aspect-[9/16] max-h-[50vh] bg-black mx-4 mt-4 rounded-xl overflow-hidden">
              {createFile?.type.startsWith('video/') ? (
                <video src={createPreview} className="w-full h-full object-contain" controls />
              ) : (
                <img src={createPreview} alt="Xem trước" className="w-full h-full object-contain" />
              )}
              {caption && (
                <div className="absolute bottom-8 left-0 right-0 text-center px-4">
                  <p className="text-white text-lg font-bold drop-shadow-lg">{caption}</p>
                </div>
              )}
              {stickers.map((s, i) => (
                <span key={i} className="absolute text-4xl" style={{ left: `${s.x}%`, top: `${s.y}%`, transform: 'translate(-50%, -50%)' }}>
                  {s.emoji}
                </span>
              ))}
            </div>

            <div className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Thêm chữ overlay..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="flex-1 px-3 py-2 bg-[#3a3b3c] rounded-lg text-sm text-white focus:outline-none"
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sticker className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-400">Thêm sticker</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {STICKER_OPTIONS.map((emoji) => (
                    <button key={emoji} type="button" onClick={() => addSticker(emoji)} className="text-2xl hover:scale-125 transition-transform">
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={handlePublishStory}
                disabled={isUploading}
                className="w-full py-2.5 bg-[#1877f2] text-white font-bold rounded-lg text-sm disabled:opacity-50"
              >
                {isUploading ? 'Đang đăng...' : 'Chia sẻ tin'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showViewer && activeUserStories && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
          <button onClick={() => setShowViewer(false)} className="absolute top-4 right-4 p-2 bg-slate-900/60 hover:bg-slate-850 text-slate-350 rounded-full border border-slate-800 hover:text-white transition-all z-50">
            <X className="w-6 h-6" />
          </button>

          <button onClick={handlePrevStory} className="absolute left-6 top-1/2 p-3 bg-slate-900/40 border border-slate-800 hover:bg-slate-800 rounded-full text-slate-300 hover:text-white transition-all z-10 hidden md:block">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button onClick={handleNextStory} className="absolute right-6 top-1/2 p-3 bg-slate-900/40 border border-slate-800 hover:bg-slate-800 rounded-full text-slate-300 hover:text-white transition-all z-10 hidden md:block">
            <ChevronRight className="w-6 h-6" />
          </button>

          <div className="w-full max-w-lg h-[80vh] md:h-[85vh] flex flex-col justify-between relative overflow-hidden bg-slate-950 rounded-3xl border border-slate-900">
            <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/80 to-transparent flex flex-col gap-2 z-20">
              <div className="flex gap-1 w-full">
                {activeUserStories.stories.map((s, idx) => (
                  <div key={s.id} className="h-1 flex-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full bg-brand-500 transition-all duration-3000 ${idx < activeStoryIndex ? 'w-full' : idx === activeStoryIndex ? 'w-full' : 'w-0'}`} />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <OptimizedAvatar src={activeUserStories.avatarUrl} alt={activeUserStories.displayName} size={36} className="w-9 h-9 rounded-full object-cover border border-slate-800" />
                  <div>
                    <p className="text-xs font-semibold text-white">{activeUserStories.displayName}</p>
                    <span className="text-[10px] text-slate-400">
                      {activeStory ? new Date(activeStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center p-2 relative" onClick={handleNextStory}>
              {activeStory?.mediaType === 'IMAGE' ? (
                <div className="relative w-full h-full">
                  <Image src={resolveMediaUrl(activeStory.mediaUrl)} alt="Nội dung tin" fill sizes="(max-width: 768px) 100vw, 640px" priority unoptimized className="object-contain rounded-2xl" />
                  {renderOverlays(activeStory)}
                </div>
              ) : (
                <div className="relative w-full h-full flex items-center justify-center">
                  <video src={resolveMediaUrl(activeStory?.mediaUrl)} autoPlay controls preload="metadata" playsInline className="max-h-full max-w-full object-contain rounded-2xl" />
                  {activeStory && renderOverlays(activeStory)}
                </div>
              )}
            </div>

            {activeUserStories.userId !== user?.id && (
              <div className="p-3 border-t border-slate-800 flex gap-2 z-20">
                <input
                  type="text"
                  placeholder="Trả lời tin..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleReplyDM()}
                  className="flex-1 px-4 py-2 bg-[#3a3b3c] rounded-full text-sm text-white focus:outline-none"
                />
                <button type="button" onClick={handleReplyDM} className="p-2 bg-[#1877f2] rounded-full text-white">
                  <Send className="w-5 h-5" />
                </button>
              </div>
            )}

            {activeUserStories.userId === user?.id && (
              <div className="p-4 bg-slate-900 border-t border-slate-850 flex flex-col gap-2.5 z-20 max-h-36 overflow-y-auto">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5" /> Lượt xem ({viewers.length})
                </span>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {viewers.length === 0 ? (
                    <span className="text-xs text-slate-650 italic">Chưa có lượt xem</span>
                  ) : (
                    viewers.map((viewer) => (
                      <div key={viewer.userId} className="flex items-center gap-1.5 p-1 bg-slate-950/40 rounded-full pr-3 border border-slate-850 flex-shrink-0">
                        <OptimizedAvatar src={viewer.avatarUrl} alt={viewer.displayName} size={20} className="w-5 h-5 rounded-full object-cover" />
                        <span className="text-[10px] font-semibold text-slate-300">{viewer.displayName}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
