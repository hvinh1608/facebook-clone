'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { X, Minus, Send, Loader2, Smile, Phone, Video } from 'lucide-react';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuthStore } from '../store/authStore';
import { useChatBoxesStore } from '../store/chatBoxesStore';
import OptimizedAvatar from './OptimizedAvatar';
import EmojiPicker from './chat/EmojiPicker';
import CallOverlay from './chat/CallOverlay';

interface ChatBoxProps {
  partnerUserId: string;
  isMinimized: boolean;
  unreadCount: number;
}

export default function ChatBox({ partnerUserId, isMinimized, unreadCount }: ChatBoxProps) {
  const { user } = useAuthStore();
  const { socket } = useSocket();
  const { closeBox, minimizeBox, restoreBox, incrementUnread } = useChatBoxesStore();

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [partnerProfile, setPartnerProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [activeCall, setActiveCall] = useState<'audio' | 'video' | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMinimizedRef = useRef(isMinimized);

  useEffect(() => {
    isMinimizedRef.current = isMinimized;
  }, [isMinimized]);

  useEffect(() => {
    let isMounted = true;

    const initChatBox = async () => {
      try {
        const profileRes = await api.get(`/users/profile/${partnerUserId}`);
        if (profileRes.data?.status === 'success' && isMounted) {
          setPartnerProfile(profileRes.data.data.user);
        }

        const convRes = await api.post('/messages/conversations', {
          isGroup: false,
          userIds: [partnerUserId],
        });

        if (convRes.data?.status === 'success' && isMounted) {
          const conv = convRes.data.data;
          setConversationId(conv.id);

          const msgRes = await api.get(`/messages/${conv.id}/messages`);
          if (msgRes.data?.status === 'success' && isMounted) {
            const payload = Array.isArray(msgRes.data.data) ? msgRes.data.data : msgRes.data.data?.messages || [];
            setMessages(payload);
          }
        }
      } catch (err) {
        console.error('Error initializing chatbox for partner:', partnerUserId, err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initChatBox();
    return () => { isMounted = false; };
  }, [partnerUserId]);

  useEffect(() => {
    if (!socket || !conversationId) return;

    socket.emit('chat:join', { conversationId });

    const handleIncomingMessage = (msg: any) => {
      if (msg.conversationId === conversationId) {
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === msg.id);
          if (exists) return prev;
          return [...prev, msg];
        });

        if (isMinimizedRef.current && msg.senderId !== user?.id) {
          incrementUnread(partnerUserId);
        }
      }
    };

    socket.on('message:received', handleIncomingMessage);
    return () => { socket.off('message:received', handleIncomingMessage); };
  }, [socket, conversationId, partnerUserId, user?.id, incrementUnread]);

  useEffect(() => {
    if (!isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isMinimized]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !conversationId || sending) return;

    const content = messageInput.trim();
    setMessageInput('');
    setSending(true);

    try {
      const res = await api.post(`/messages/${conversationId}/messages`, { content });
      if (res.data?.status === 'success') {
        const newMessage = res.data.data;
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === newMessage.id);
          if (exists) return prev;
          return [...prev, newMessage];
        });
      }
    } catch (err) {
      console.error('Error sending message from chatbox:', err);
    } finally {
      setSending(false);
    }
  };

  const displayName = partnerProfile?.profile?.displayName || 'Người dùng';
  const partnerAvatarUrl = partnerProfile?.profile?.avatarUrl ?? null;

  if (isMinimized) {
    return (
      <div className="relative group pointer-events-auto">
        <button
          onClick={() => restoreBox(partnerUserId)}
          className="relative w-[48px] h-[48px] rounded-full shadow-lg border-2 border-white dark:border-[#242526] hover:scale-110 transition-transform duration-150 focus:outline-none focus:ring-2 focus:ring-[#1877f2] focus:ring-offset-2 overflow-hidden"
          title={displayName}
        >
          <OptimizedAvatar
            src={partnerAvatarUrl}
            alt={displayName}
            size={48}
            className="w-full h-full rounded-full border-0"
          />
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#31a24c] border-2 border-white dark:border-[#242526] rounded-full"></span>
        </button>

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-[#e41e3f] text-white text-[10px] font-bold rounded-full shadow-md border border-white dark:border-[#18191a] animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            closeBox(partnerUserId);
          }}
          className="absolute -top-1 -left-1 w-[18px] h-[18px] bg-slate-600/80 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          title="Đóng"
        >
          <X className="w-2.5 h-2.5 text-white" />
        </button>

        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-[10px] font-medium rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
          {displayName}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-[290px] h-[370px] bg-white dark:bg-[#242526] rounded-t-lg border border-slate-200 dark:border-[#3e4042] shadow-lg flex items-center justify-center pointer-events-auto">
        <Loader2 className="w-6 h-6 text-[#1877f2] animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-[290px] h-[400px] bg-white dark:bg-[#242526] rounded-t-lg border border-slate-200 dark:border-[#3e4042] shadow-lg flex flex-col pointer-events-auto animate-chatbox-open">
      <div
        className="px-3 py-2 border-b border-slate-200 dark:border-[#3e4042] bg-white dark:bg-[#242526] rounded-t-lg flex items-center justify-between cursor-pointer"
        onDoubleClick={() => minimizeBox(partnerUserId)}
      >
        <Link
          href={`/profile/${partnerUserId}`}
          className="flex items-center gap-2 max-w-[170px] hover:underline"
        >
          <div className="relative flex-shrink-0">
            <OptimizedAvatar
              src={partnerAvatarUrl}
              alt={displayName}
              size={28}
              className="border border-slate-100 dark:border-transparent"
            />
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-[#31a24c] border border-white dark:border-[#242526] rounded-full"></span>
          </div>
          <span className="text-[12px] font-bold text-slate-800 dark:text-[#e4e6eb] truncate">
            {displayName}
          </span>
        </Link>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveCall('audio')}
            className="p-1 hover:bg-slate-100 dark:hover:bg-[#3a3b3c] rounded text-[#1877f2]"
            title="Gọi thoại"
          >
            <Phone className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setActiveCall('video')}
            className="p-1 hover:bg-slate-100 dark:hover:bg-[#3a3b3c] rounded text-[#1877f2]"
            title="Gọi video"
          >
            <Video className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => minimizeBox(partnerUserId)}
            className="p-1 hover:bg-slate-100 dark:hover:bg-[#3a3b3c] rounded text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
            title="Thu nhỏ"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => closeBox(partnerUserId)}
            className="p-1 hover:bg-slate-100 dark:hover:bg-[#3a3b3c] rounded text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
            title="Đóng"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-2.5 flex flex-col gap-2 bg-slate-50/50 dark:bg-[#18191a]/30">
        {messages.length === 0 ? (
          <div className="my-auto text-center text-[10px] text-slate-400 py-4 italic">
            Gửi tin nhắn để bắt đầu trò chuyện
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMine = msg.senderId === user?.id;
            return (
              <div
                key={`${msg.id || idx}`}
                className={`flex items-end gap-1.5 max-w-[85%] ${
                  isMine ? 'self-end flex-row-reverse' : 'self-start'
                }`}
              >
                {!isMine && (
                  <OptimizedAvatar
                    src={partnerAvatarUrl}
                    alt={displayName}
                    size={20}
                    className="flex-shrink-0"
                  />
                )}
                <div
                  className={`py-1.5 px-2.5 rounded-2xl text-[11px] leading-normal break-words whitespace-pre-wrap ${
                    isMine
                      ? 'bg-[#1877f2] text-white rounded-br-none'
                      : 'bg-slate-200 dark:bg-[#3a3b3c] text-slate-850 dark:text-[#e4e6eb] rounded-bl-none'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-2 border-t border-slate-200 dark:border-[#3e4042] bg-white dark:bg-[#242526] relative">
        <form onSubmit={handleSend} className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowEmoji(!showEmoji)}
            className="p-1.5 text-slate-500 hover:text-[#1877f2] rounded-full"
          >
            <Smile className="w-4 h-4" />
          </button>
          {showEmoji && (
            <div className="absolute bottom-12 left-2 z-50">
              <EmojiPicker
                onSelect={(emoji) => setMessageInput((prev) => prev + emoji)}
                onClose={() => setShowEmoji(false)}
              />
            </div>
          )}
          <input
            type="text"
            placeholder="Aa"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            className="flex-1 px-3 py-1.5 bg-[#f0f2f5] dark:bg-[#3a3b3c] border-0 rounded-full text-[11px] focus:outline-none dark:text-white placeholder-slate-500"
          />
          <button
            type="submit"
            disabled={sending}
            className="p-1.5 text-[#1877f2] hover:bg-slate-100 dark:hover:bg-[#3a3b3c] rounded-full flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {activeCall && user && (
        <CallOverlay
          socket={socket}
          localUserId={user.id}
          localUserName={user.displayName || 'Bạn'}
          remoteUserId={partnerUserId}
          remoteName={displayName}
          remoteAvatar={partnerAvatarUrl}
          callType={activeCall}
          onClose={() => setActiveCall(null)}
        />
      )}
    </div>
  );
}
