'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Globe, Lock, MessageCircle, Users, X, Copy, Check } from 'lucide-react';
import { api } from '../services/api';
import OptimizedAvatar from './OptimizedAvatar';
import { resolveAvatarUrl } from '../utils/avatar';
import { useAuthStore } from '../store/authStore';

type ShareTab = 'feed' | 'messenger' | 'group';
type Privacy = 'PUBLIC' | 'FRIENDS' | 'ONLY_ME';

interface SharePostModalProps {
  postId: string;
  onClose: () => void;
  onShared?: (post: any) => void;
}

export default function SharePostModal({ postId, onClose, onShared }: SharePostModalProps) {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<ShareTab>('feed');
  const [shareContent, setShareContent] = useState('');
  const [sharePrivacy, setSharePrivacy] = useState<Privacy>('PUBLIC');
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const [friends, setFriends] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const postUrl = typeof window !== 'undefined' ? `${window.location.origin}/posts/${postId}` : '';

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      try {
        const [friendsRes, groupsRes] = await Promise.all([
          api.get(`/users/friends/${user.id}`),
          api.get('/groups/joined'),
        ]);
        if (friendsRes.data?.status === 'success') {
          setFriends(friendsRes.data.data || []);
        }
        if (groupsRes.data?.status === 'success') {
          setGroups(groupsRes.data.data || []);
        }
      } catch (e) {
        console.error('Error loading share targets', e);
      }
    };
    load();
  }, [user?.id]);

  const handleShareToFeed = useCallback(async () => {
    setIsSharing(true);
    try {
      const res = await api.post(`/posts/${postId}/share`, {
        content: shareContent,
        privacy: sharePrivacy,
      });
      if (res.data?.status === 'success') {
        onShared?.(res.data.data);
        onClose();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSharing(false);
    }
  }, [onClose, onShared, postId, shareContent, sharePrivacy]);

  const handleShareToMessenger = useCallback(async () => {
    if (!selectedFriendId) return;
    setIsSharing(true);
    try {
      const convRes = await api.post('/messages/conversations', {
        isGroup: false,
        userIds: [selectedFriendId],
      });
      const conv = convRes.data?.data;
      if (conv?.id) {
        const text = shareContent.trim()
          ? `${shareContent}\n\n🔗 ${postUrl}`
          : `Đã chia sẻ bài viết với bạn:\n🔗 ${postUrl}`;
        await api.post(`/messages/${conv.id}/messages`, { content: text });
        onClose();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSharing(false);
    }
  }, [onClose, postUrl, selectedFriendId, shareContent]);

  const handleShareToGroup = useCallback(async () => {
    if (!selectedGroupId) return;
    setIsSharing(true);
    try {
      const res = await api.post(`/posts/${postId}/share`, {
        content: shareContent,
        groupId: selectedGroupId,
      });
      if (res.data?.status === 'success') {
        onShared?.(res.data.data);
        onClose();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSharing(false);
    }
  }, [onClose, onShared, postId, selectedGroupId, shareContent]);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(postUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredFriends = friends.filter((f) =>
    f.profile?.displayName?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredGroups = groups.filter((g) =>
    g.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white dark:bg-[#242526] rounded-xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-slate-200 dark:border-[#3e4042] flex items-center justify-between">
          <h3 className="font-bold text-sm">Chia sẻ bài viết</h3>
          <button type="button" onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-[#3a3b3c] rounded-full">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="flex border-b border-slate-200 dark:border-[#3e4042]">
          {[
            { id: 'feed' as const, label: 'Bảng tin', icon: Globe },
            { id: 'messenger' as const, label: 'Messenger', icon: MessageCircle },
            { id: 'group' as const, label: 'Nhóm', icon: Users },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex-1 py-2.5 text-[11px] font-semibold flex items-center justify-center gap-1 ${
                  tab === t.id
                    ? 'text-[#1877f2] border-b-2 border-[#1877f2]'
                    : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-[#3a3b3c]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="p-4 flex flex-col gap-3">
          <textarea
            value={shareContent}
            onChange={(e) => setShareContent(e.target.value)}
            placeholder="Viết gì đó về bài viết này..."
            rows={2}
            className="w-full px-3 py-2 bg-[#f0f2f5] dark:bg-[#3a3b3c] border-0 rounded-lg text-sm focus:outline-none dark:text-white resize-none"
          />

          {tab === 'feed' && (
            <>
              <div className="flex gap-2 flex-wrap">
                {[
                  { type: 'PUBLIC' as const, label: 'Công khai', icon: Globe },
                  { type: 'FRIENDS' as const, label: 'Bạn bè', icon: Users },
                  { type: 'ONLY_ME' as const, label: 'Chỉ mình tôi', icon: Lock },
                ].map((p) => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.type}
                      type="button"
                      onClick={() => setSharePrivacy(p.type)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                        sharePrivacy === p.type ? 'bg-[#1877f2] text-white' : 'bg-slate-100 dark:bg-[#3a3b3c] text-slate-600'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      {p.label}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={handleShareToFeed}
                disabled={isSharing}
                className="w-full py-2.5 bg-[#1877f2] hover:bg-[#166fe5] text-white font-bold rounded-lg text-sm disabled:opacity-50"
              >
                {isSharing ? 'Đang chia sẻ...' : 'Chia sẻ lên bảng tin'}
              </button>
            </>
          )}

          {tab === 'messenger' && (
            <>
              <input
                type="text"
                placeholder="Tìm bạn bè..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 bg-[#f0f2f5] dark:bg-[#3a3b3c] rounded-lg text-xs focus:outline-none dark:text-white"
              />
              <div className="max-h-48 overflow-y-auto flex flex-col gap-1">
                {filteredFriends.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">Không có bạn bè</p>
                ) : (
                  filteredFriends.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setSelectedFriendId(f.id)}
                      className={`flex items-center gap-2 p-2 rounded-lg text-left ${
                        selectedFriendId === f.id ? 'bg-[#e7f3ff] dark:bg-[#263951]' : 'hover:bg-slate-50 dark:hover:bg-[#3a3b3c]'
                      }`}
                    >
                      <OptimizedAvatar src={f.profile?.avatarUrl} alt={f.profile?.displayName} size={36} />
                      <span className="text-sm font-semibold">{f.profile?.displayName}</span>
                    </button>
                  ))
                )}
              </div>
              <button
                type="button"
                onClick={handleShareToMessenger}
                disabled={isSharing || !selectedFriendId}
                className="w-full py-2.5 bg-[#1877f2] text-white font-bold rounded-lg text-sm disabled:opacity-50"
              >
                {isSharing ? 'Đang gửi...' : 'Gửi qua Messenger'}
              </button>
            </>
          )}

          {tab === 'group' && (
            <>
              <input
                type="text"
                placeholder="Tìm nhóm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 bg-[#f0f2f5] dark:bg-[#3a3b3c] rounded-lg text-xs focus:outline-none dark:text-white"
              />
              <div className="max-h-48 overflow-y-auto flex flex-col gap-1">
                {filteredGroups.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">Bạn chưa tham gia nhóm nào</p>
                ) : (
                  filteredGroups.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setSelectedGroupId(g.id)}
                      className={`flex items-center gap-2 p-2 rounded-lg text-left ${
                        selectedGroupId === g.id ? 'bg-[#e7f3ff] dark:bg-[#263951]' : 'hover:bg-slate-50 dark:hover:bg-[#3a3b3c]'
                      }`}
                    >
                      <img src={resolveAvatarUrl(g.avatarUrl)} alt={g.name} className="w-9 h-9 rounded-lg object-cover" />
                      <span className="text-sm font-semibold">{g.name}</span>
                    </button>
                  ))
                )}
              </div>
              <button
                type="button"
                onClick={handleShareToGroup}
                disabled={isSharing || !selectedGroupId}
                className="w-full py-2.5 bg-[#1877f2] text-white font-bold rounded-lg text-sm disabled:opacity-50"
              >
                {isSharing ? 'Đang chia sẻ...' : 'Chia sẻ vào nhóm'}
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full py-2.5 bg-slate-100 dark:bg-[#3a3b3c] hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-semibold rounded-lg text-sm flex items-center justify-center gap-2"
          >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Đã sao chép!' : 'Sao chép liên kết'}
          </button>
        </div>
      </div>
    </div>
  );
}
