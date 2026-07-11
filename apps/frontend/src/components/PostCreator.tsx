'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Image, Globe, Users, Lock, Smile, MapPin, X, UserPlus } from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useFeedStore } from '../store/feedStore';
import OptimizedAvatar from './OptimizedAvatar';

const QUICK_EMOJIS = ['😀', '😂', '❤️', '👍', '😍', '😢', '😡', '🎉', '🔥', '✨', '👏', '🙏', '😎', '🥳', '💯'];

export default function PostCreator({
  groupId = null,
  onPostCreated,
}: {
  groupId?: string | null;
  onPostCreated?: (post: any) => void;
}) {
  const { user } = useAuthStore();
  const { addPost } = useFeedStore();

  const [content, setContent] = useState('');
  const [privacy, setPrivacy] = useState<'PUBLIC' | 'FRIENDS' | 'ONLY_ME' | 'FRIENDS_EXCEPT' | 'SPECIFIC_FRIENDS'>('PUBLIC');
  const [selectedAudience, setSelectedAudience] = useState<string[]>([]);
  const [isPoll, setIsPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [scheduledAt, setScheduledAt] = useState('');
  const [scheduleNotice, setScheduleNotice] = useState('');
  const [feeling, setFeeling] = useState('');
  const [location, setLocation] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  
  const [showExtra, setShowExtra] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showTagFriends, setShowTagFriends] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchFriends = async () => {
      if (!user?.id) return;
      try {
        const res = await api.get(`/users/friends/${user.id}`);
        if (res.data?.status === 'success') {
          setFriends(res.data.data || []);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchFriends();
  }, [user?.id]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) {
        setShowEmoji(false);
      }
      if (tagRef.current && !tagRef.current.contains(event.target as Node)) {
        setShowTagFriends(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      previews.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
    };
  }, [previews]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    const filesArray = Array.from(selectedFiles);
    setFiles((prev) => [...prev, ...filesArray]);

    const newPreviews = filesArray.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEmojiSelect = (emoji: string) => {
    setContent((prev) => prev + emoji);
    setShowEmoji(false);
  };

  const handleTagFriend = (friend: any) => {
    const name = friend.profile?.displayName || 'Bạn bè';
    setContent((prev) => (prev.trim() ? `${prev.trim()} @${name} ` : `@${name} `));
    setShowTagFriends(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && files.length === 0) return;

    setIsLoading(true);

    const formData = new FormData();
    formData.append('content', content);
    formData.append('privacy', privacy);
    if (privacy === 'SPECIFIC_FRIENDS') {
      formData.append('audienceUserIds', JSON.stringify(selectedAudience));
    }
    if (privacy === 'FRIENDS_EXCEPT') {
      formData.append('excludedUserIds', JSON.stringify(selectedAudience));
    }
    if (scheduledAt) formData.append('scheduledAt', scheduledAt);
    if (isPoll) {
      formData.append('isPoll', 'true');
      formData.append('pollOptions', JSON.stringify(pollOptions.filter(Boolean)));
    }
    if (feeling) formData.append('feeling', feeling);
    if (location) formData.append('location', location);
    if (groupId) formData.append('groupId', groupId);

    files.forEach((file) => {
      formData.append('media', file);
    });

    try {
      const res = await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.status === 'success') {
        const newPost = res.data.data;
        const isScheduled = newPost.scheduledAt && new Date(newPost.scheduledAt) > new Date();

        if (!isScheduled) {
          addPost(newPost);
        } else {
          setScheduleNotice(
            `Đã lên lịch đăng lúc ${new Date(newPost.scheduledAt).toLocaleString('vi-VN')}`
          );
        }
        onPostCreated?.(newPost);

        setContent('');
        setFeeling('');
        setLocation('');
        setFiles([]);
        setPreviews([]);
        setShowExtra(false);
        setIsPoll(false);
        setPollOptions(['', '']);
        setScheduledAt('');
      }
    } catch (err) {
      console.error('Error creating post', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fb-card p-3.5 md:p-4 flex flex-col gap-3">
        {/* Top Row: Avatar and Input Trigger */}
        <div className="flex gap-3 items-center">
          <OptimizedAvatar
            src={user?.avatarUrl}
            alt={user?.displayName}
            size={40}
            className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-transparent flex-shrink-0"
          />
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex-1 bg-[#f0f2f5] dark:bg-[#3a3b3c] hover:bg-[#e4e6eb] dark:hover:bg-[#3e4042] text-left text-sm rounded-full py-2.5 px-4.5 text-slate-500 transition-colors select-none cursor-pointer"
          >
            Bạn đang nghĩ gì, {user?.displayName?.split(' ')[0]}?
          </button>
        </div>

        {scheduleNotice && (
          <div className="px-3 py-2 bg-[#e7f3ff] dark:bg-[#263951]/40 border border-[#1877f2]/30 rounded-lg text-xs text-[#1877f2] font-semibold flex items-center justify-between">
            <span>{scheduleNotice}</span>
            <button type="button" onClick={() => setScheduleNotice('')} className="text-slate-500 hover:text-slate-700">✕</button>
          </div>
        )}

        {/* Divider line */}
        <div className="h-px bg-slate-200 dark:bg-[#3e4042]"></div>

        {/* Bottom Actions Row triggers Modal */}
        <div className="flex items-center justify-around gap-1 text-slate-600 dark:text-slate-300 select-none">
          {/* Live Video placeholder */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-slate-100 dark:hover:bg-[#3a3b3c] rounded-lg transition-colors text-xs font-bold"
          >
            <span className="text-red-500 text-lg leading-none">📹</span>
            <span className="hidden sm:inline">Video trực tiếp</span>
          </button>

          {/* Photos option */}
          <button
            type="button"
            onClick={() => { setIsModalOpen(true); setTimeout(() => fileInputRef.current?.click(), 100); }}
            className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-slate-100 dark:hover:bg-[#3a3b3c] rounded-lg transition-colors text-xs font-bold"
          >
            <Image className="w-5 h-5 text-[#45bd62]" />
            <span className="hidden sm:inline">Ảnh/Video</span>
          </button>

          {/* Activity option */}
          <button
            type="button"
            onClick={() => { setIsModalOpen(true); setShowExtra(true); }}
            className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-slate-100 dark:hover:bg-[#3a3b3c] rounded-lg transition-colors text-xs font-bold"
          >
            <Smile className="w-5 h-5 text-[#f7b928]" />
            <span className="hidden sm:inline">Cảm xúc/Hoạt động</span>
          </button>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          accept="image/*,video/*"
          className="hidden"
        />
      </div>

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fb-modal-bg">
          <div className="w-full max-w-[500px] bg-white dark:bg-[#242526] rounded-xl shadow-2xl overflow-hidden animate-fb-modal-content flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="relative px-4 py-4 border-b border-slate-200 dark:border-[#3e4042] text-center">
              <h3 className="text-base font-bold text-black dark:text-white">Tạo bài viết</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="absolute right-4 top-3 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-[#3a3b3c] dark:hover:bg-[#3e4042] flex items-center justify-center transition-colors text-slate-650 dark:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              
              {/* User info & privacy selection */}
              <div className="flex gap-3 items-center">
                <OptimizedAvatar
                  src={user?.avatarUrl}
                  alt={user?.displayName}
                  size={40}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-transparent flex-shrink-0"
                />
                <div>
                  <h4 className="text-sm font-semibold text-black dark:text-white">{user?.displayName}</h4>
                  <div className="mt-1">
                    <select
                      value={privacy}
                      onChange={(e) => setPrivacy(e.target.value as any)}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#3a3b3c] dark:hover:bg-[#3e4042] text-[11px] font-semibold rounded text-slate-600 dark:text-slate-300 border-0 focus:ring-0 focus:outline-none cursor-pointer"
                    >
                      <option value="PUBLIC">🌎 Công khai</option>
                      <option value="FRIENDS">👥 Bạn bè</option>
                      <option value="ONLY_ME">🔒 Chỉ mình tôi</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Text Area */}
              <div className="min-h-[120px] flex flex-col">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={`Bạn đang nghĩ gì thế, ${user?.displayName?.split(' ')[0]}?`}
                  rows={4}
                  className="w-full bg-transparent border-0 text-[15px] focus:ring-0 focus:outline-none dark:text-white placeholder-slate-500 resize-none"
                  autoFocus
                />
              </div>

              {/* Previews Panel */}
              {previews.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {previews.map((url, idx) => (
                    <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-[#3e4042] bg-slate-950">
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-black rounded-full text-white transition-colors z-10"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      {files[idx]?.type.startsWith('video/') ? (
                        <video src={url} preload="metadata" playsInline className="w-full h-full object-cover" />
                      ) : (
                        <img src={url} alt="Upload preview" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Extra Inputs */}
              {showExtra && (
                <div className="flex flex-col gap-3 p-3 bg-slate-50 dark:bg-[#3a3b3c]/50 rounded-xl border border-slate-200 dark:border-[#3e4042]">
                  {(privacy === 'FRIENDS_EXCEPT' || privacy === 'SPECIFIC_FRIENDS') && friends.length > 0 && (
                    <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">
                        {privacy === 'FRIENDS_EXCEPT' ? 'Bạn bè loại trừ' : 'Bạn bè được xem'}
                      </span>
                      {friends.map((f) => (
                        <label key={f.id} className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={selectedAudience.includes(f.id)}
                            onChange={(e) => {
                              setSelectedAudience((prev) =>
                                e.target.checked ? [...prev, f.id] : prev.filter((id) => id !== f.id)
                              );
                            }}
                          />
                          {f.profile?.displayName}
                        </label>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Lên lịch đăng (tùy chọn)</label>
                    <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="px-3 py-1.5 bg-white dark:bg-[#3a3b3c] border rounded-md text-xs dark:text-white" />
                  </div>

                  <label className="flex items-center gap-2 text-xs font-semibold select-none">
                    <input type="checkbox" checked={isPoll} onChange={(e) => setIsPoll(e.target.checked)} />
                    Tạo bình chọn
                  </label>
                  {isPoll && (
                    <div className="flex flex-col gap-2">
                      {pollOptions.map((opt, i) => (
                        <input key={i} value={opt} onChange={(e) => {
                          const next = [...pollOptions];
                          next[i] = e.target.value;
                          setPollOptions(next);
                        }} placeholder={`Lựa chọn ${i + 1}`} className="px-3 py-1.5 bg-white dark:bg-[#3a3b3c] border rounded-md text-xs dark:text-white" />
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2.5 w-full">
                    <div className="flex-1 flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Vị trí</span>
                      <input
                        type="text"
                        placeholder="Bạn đang ở đâu?"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-[#3a3b3c] border border-slate-250 dark:border-[#3e4042] rounded-md text-xs focus:border-[#1877f2] focus:outline-none dark:text-white"
                      />
                    </div>

                    <div className="flex-1 flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cảm xúc</span>
                      <input
                        type="text"
                        placeholder="Vui, thư giãn..."
                        value={feeling}
                        onChange={(e) => setFeeling(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-[#3a3b3c] border border-slate-250 dark:border-[#3e4042] rounded-md text-xs focus:border-[#1877f2] focus:outline-none dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Add to your post panel */}
              <div className="border border-slate-200 dark:border-[#3e4042] rounded-lg p-3.5 flex items-center justify-between shadow-sm">
                <span className="text-[13px] font-bold text-slate-700 dark:text-slate-350">Thêm vào bài viết của bạn</span>
                
                <div className="flex gap-1.5">
                  {/* Photo attachment option */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-[#3a3b3c] rounded-full transition-colors"
                    title="Ảnh/Video"
                  >
                    <Image className="w-5 h-5 text-[#45bd62]" />
                  </button>

                  {/* Activity option toggle */}
                  <button
                    type="button"
                    onClick={() => setShowExtra(!showExtra)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-[#3a3b3c] rounded-full transition-colors"
                    title="Cảm xúc/Hoạt động"
                  >
                    <Smile className="w-5 h-5 text-[#f7b928]" />
                  </button>

                  {/* Emoji selection dropdown */}
                  <div className="relative" ref={emojiRef}>
                    <button
                      type="button"
                      onClick={() => setShowEmoji(!showEmoji)}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-[#3a3b3c] rounded-full transition-colors text-lg leading-none"
                      title="Biểu tượng"
                    >
                      😊
                    </button>
                    {showEmoji && (
                      <div className="absolute bottom-full right-0 mb-2 bg-white dark:bg-[#242526] border border-slate-200 dark:border-[#3e4042] rounded-xl shadow-lg grid grid-cols-5 gap-1 z-50 p-2">
                        {QUICK_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleEmojiSelect(emoji)}
                            className="w-8 h-8 hover:bg-slate-100 dark:hover:bg-[#3a3b3c] rounded text-lg"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Gắn thẻ bạn bè */}
                  <div className="relative" ref={tagRef}>
                    <button
                      type="button"
                      onClick={() => setShowTagFriends(!showTagFriends)}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-[#3a3b3c] rounded-full transition-colors"
                      title="Gắn thẻ bạn bè"
                    >
                      <UserPlus className="w-5 h-5 text-[#1877f2]" />
                    </button>
                    {showTagFriends && (
                      <div className="absolute bottom-full right-0 mb-2 w-56 max-h-48 overflow-y-auto bg-white dark:bg-[#242526] border border-slate-200 dark:border-[#3e4042] rounded-xl shadow-lg z-50 p-1">
                        {friends.length === 0 ? (
                          <p className="text-xs text-slate-500 p-3 text-center">Chưa có bạn bè để gắn thẻ</p>
                        ) : (
                          friends.map((friend) => (
                            <button
                              key={friend.id}
                              type="button"
                              onClick={() => handleTagFriend(friend)}
                              className="w-full flex items-center gap-2 px-2 py-2 hover:bg-slate-100 dark:hover:bg-[#3a3b3c] rounded-lg text-left"
                            >
                              <OptimizedAvatar
                                src={friend.profile?.avatarUrl}
                                alt={friend.profile?.displayName}
                                size={28}
                                className="w-7 h-7 rounded-full object-cover"
                              />
                              <span className="text-xs font-semibold truncate">{friend.profile?.displayName}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-[#3e4042]">
              <button
                onClick={(e) => {
                  handleSubmit(e);
                  setIsModalOpen(false);
                }}
                disabled={isLoading || (!content.trim() && files.length === 0)}
                className="w-full py-2.5 bg-[#1877f2] hover:bg-[#166fe5] text-white font-bold rounded-lg text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:hover:scale-100 active:scale-[0.98]"
              >
                {isLoading ? 'Đang đăng...' : 'Đăng'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
