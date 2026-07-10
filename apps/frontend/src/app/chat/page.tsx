'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Layout from '../../components/Layout';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { useSocket } from '../../context/SocketContext';
import { MessageSquare, Send, Paperclip, Smile, Group, UserPlus, Trash, X, Plus, Loader2, Phone, Video, Reply } from 'lucide-react';
import { api } from '../../services/api';
import { resolveMediaUrl } from '../../utils/media';
import { resolveAvatarUrl } from '../../utils/avatar';
import OptimizedAvatar from '../../components/OptimizedAvatar';
import EmojiPicker from '../../components/chat/EmojiPicker';
import CallOverlay from '../../components/chat/CallOverlay';
import IncomingCallModal from '../../components/chat/IncomingCallModal';

function ChatPageContent() {
  const { user } = useAuthStore();
  const { socket } = useSocket();
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get('userId');

  const {
    conversations,
    activeConversationId,
    messages,
    typingUsers,
    fetchConversations,
    fetchMessages,
    setActiveConversationId,
    sendMessage,
    removeMessage,
  } = useChatStore();

  const [messageInput, setMessageInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [typingTimeout, setTypingTimeout] = useState<any>(null);

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [replyTo, setReplyTo] = useState<any>(null);
  const [activeCall, setActiveCall] = useState<{
    remoteUserId: string;
    remoteName: string;
    remoteAvatar?: string | null;
    callType: 'audio' | 'video';
    isIncoming?: boolean;
    offer?: RTCSessionDescriptionInit;
  } | null>(null);
  const [incomingCall, setIncomingCall] = useState<{
    fromUserId: string;
    callerName: string;
    callType: 'audio' | 'video';
    offer: RTCSessionDescriptionInit;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Initial conversations list fetching
  useEffect(() => {
    fetchConversations();
    const fetchFriends = async () => {
      try {
        const res = await api.get(`/users/friends/${user?.id}`);
        if (res.data?.status === 'success') {
          const rawFriends = res.data.data || [];
          const uniqueFriends = rawFriends.filter((item: any, idx: number, self: any[]) =>
            self.findIndex((t) => t.id === item.id) === idx
          );
          setFriends(uniqueFriends);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchFriends();
  }, []);

  // 2. React to dynamic userId query param changes
  useEffect(() => {
    if (!targetUserId) return;

    const startDirectChat = async () => {
      try {
        const res = await api.post('/messages/conversations', {
          isGroup: false,
          userIds: [targetUserId]
        });
        if (res.data?.status === 'success') {
          const conv = res.data.data;
          
          // Format conversation matching the expected structure of useChatStore conversations list
          const otherMember = conv.members?.find((m: any) => m.userId !== user?.id);
          const formattedConv = {
            id: conv.id,
            name: conv.name,
            isGroup: conv.isGroup,
            creatorId: conv.creatorId,
            createdAt: conv.createdAt,
            updatedAt: conv.updatedAt,
            lastMessage: conv.lastMessage || null,
            members: conv.members?.map((m: any) => ({
              userId: m.userId,
              displayName: m.user?.profile?.displayName || m.displayName,
              avatarUrl: m.user?.profile?.avatarUrl || m.avatarUrl,
              isAdmin: m.isAdmin,
            })) || [],
            chatPartner: otherMember ? {
              userId: otherMember.userId,
              displayName: otherMember.user?.profile?.displayName || otherMember.displayName,
              avatarUrl: otherMember.user?.profile?.avatarUrl || otherMember.avatarUrl,
            } : null,
            myRole: { isAdmin: conv.members?.find((m: any) => m.userId === user?.id)?.isAdmin || false },
          };

          // Seed the new/loaded conversation details in Zustand state array immediately to allow instant navigation
          const chatStore = useChatStore.getState();
          const exists = chatStore.conversations.some((c) => c.id === conv.id);
          if (!exists) {
            useChatStore.setState({ conversations: [formattedConv, ...chatStore.conversations] });
          }

          // Open the room and fetch history in parallel instantly
          setActiveConversationId(conv.id);
          fetchMessages(conv.id);
          
          // Fetch conversations list updates in the background without blocking
          fetchConversations();
        }
      } catch (e) {
        console.error('Error starting direct chat', e);
      }
    };

    startDirectChat();
  }, [targetUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (socket && activeConversationId) {
      socket.emit('chat:join', { conversationId: activeConversationId });
    }
  }, [activeConversationId, socket]);

  useEffect(() => {
    if (!socket) return;

    const onOffer = (data: any) => {
      if (activeCall) return;
      setIncomingCall({
        fromUserId: data.fromUserId,
        callerName: data.callerName || 'Người gọi',
        callType: data.callType || 'audio',
        offer: data.offer,
      });
    };

    socket.on('call:offer', onOffer);
    return () => { socket.off('call:offer', onOffer); };
  }, [socket, activeCall]);

  const startCall = (callType: 'audio' | 'video') => {
    const conv = conversations.find((c) => c.id === activeConversationId);
    if (!conv || conv.isGroup) return;
    const partnerId = conv.chatPartner?.userId;
    if (!partnerId) return;
    setActiveCall({
      remoteUserId: partnerId,
      remoteName: conv.chatPartner?.displayName || 'Người dùng',
      remoteAvatar: conv.chatPartner?.avatarUrl,
      callType,
    });
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    fetchMessages(id);
    api.put(`/messages/${id}/read`).catch(() => {});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    if (!socket || !activeConversationId) return;

    socket.emit('chat:typing', {
      conversationId: activeConversationId,
      displayName: user?.displayName,
    });

    if (typingTimeout) clearTimeout(typingTimeout);

    setTypingTimeout(
      setTimeout(() => {
        socket.emit('chat:stop-typing', { conversationId: activeConversationId });
      }, 2000)
    );
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setFilePreview(URL.createObjectURL(file));
  };

  const handleRemoveFile = () => {
    if (filePreview) URL.revokeObjectURL(filePreview);
    setSelectedFile(null);
    setFilePreview(null);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() && !selectedFile) return;
    if (!activeConversationId) return;

    if (socket) {
      socket.emit('chat:stop-typing', { conversationId: activeConversationId });
    }

    const fileToUpload = selectedFile || undefined;
    setMessageInput('');
    handleRemoveFile();
    const replyId = replyTo?.id;
    setReplyTo(null);

    await sendMessage(activeConversationId, messageInput, fileToUpload, replyId);
  };

  const handleCreateGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || selectedFriends.length === 0) return;

    try {
      const res = await api.post('/messages/conversations', {
        name: groupName,
        isGroup: true,
        userIds: selectedFriends,
      });

      if (res.data?.status === 'success') {
        const newGroup = res.data.data;
        setShowCreateGroup(false);
        setGroupName('');
        setSelectedFriends([]);
        fetchConversations();
        handleSelectConversation(newGroup.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSelectFriend = (friendId: string) => {
    setSelectedFriends((prev) =>
      prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]
    );
  };

  const handleAddMemberSubmit = async (friendId: string) => {
    if (!activeConversationId) return;
    try {
      await api.post(`/messages/${activeConversationId}/members`, { userIds: [friendId] });
      setShowAddMember(false);
      fetchConversations();
      fetchMessages(activeConversationId);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveMember = async (targetUserId: string) => {
    if (!activeConversationId) return;
    if (window.confirm('Xóa thành viên này khỏi nhóm chat?')) {
      try {
        await api.delete(`/messages/${activeConversationId}/members/${targetUserId}`);
        fetchConversations();
        fetchMessages(activeConversationId);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const activeConv = conversations.find((c) => c.id === activeConversationId);
  const activeTypers = activeConversationId ? Object.values(typingUsers[activeConversationId] || {}) : [];

  return (
    <Layout>
      <div className="h-[calc(100vh-110px)] flex rounded-xl overflow-hidden border border-slate-200 dark:border-[#3e4042] bg-white dark:bg-[#242526] shadow-[var(--panel-shadow)]">
        {/* Left conversations list */}
        <div className="w-80 border-r border-slate-200 dark:border-[#3e4042] flex flex-col bg-[#f7f8fa] dark:bg-[#242526]">
          <div className="p-4 border-b border-slate-200 dark:border-[#3e4042] flex items-center justify-between">
            <span className="font-bold text-lg text-black dark:text-white">Tin nhắn</span>
              <button
              onClick={() => setShowCreateGroup(true)}
              className="fb-icon-button text-[#1877f2] scale-90"
              title="Tạo nhóm chat"
            >
              <Group className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <p className="text-center text-xs text-slate-500 py-10">Chưa có cuộc trò chuyện nào.</p>
            ) : (
              conversations.map((conv) => {
                const partnerName = conv.isGroup ? conv.name : conv.chatPartner?.displayName;
                const partnerAvatar = conv.isGroup
                  ? resolveAvatarUrl(null)
                  : resolveAvatarUrl(conv.chatPartner?.avatarUrl);
                
                const isUnread = conv.lastMessage && !conv.lastMessage.isRead && conv.lastMessage.senderId !== user?.id;
                const isSelected = activeConversationId === conv.id;

                return (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={`w-full text-left p-3.5 flex items-center gap-3 border-b border-slate-100 dark:border-[#3e4042]/50 transition-colors hover:bg-slate-100 dark:hover:bg-[#3a3b3c] ${
                      isSelected ? 'bg-slate-100 dark:bg-[#3a3b3c]' : ''
                    }`}
                  >
                    <img
                      src={partnerAvatar}
                      alt={partnerName || 'Chat'}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-transparent flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <p className={`text-xs font-bold truncate ${isUnread ? 'text-[#1877f2]' : 'text-slate-800 dark:text-[#e4e6eb]'}`}>
                          {partnerName}
                        </p>
                        {conv.lastMessage && (
                          <span className="text-[9px] text-slate-550 flex-shrink-0">
                            {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <p className={`text-[11px] truncate ${isUnread ? 'text-[#1877f2] font-semibold' : 'text-slate-500'}`}>
                        {conv.lastMessage?.content || (conv.lastMessage?.mediaUrl ? 'Tệp đính kèm' : 'Chưa có tin nhắn')}
                      </p>
                    </div>
                    {isUnread && <span className="w-2.5 h-2.5 bg-[#1877f2] rounded-full flex-shrink-0"></span>}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Chat Panel */}
        <div className="flex-1 flex flex-col bg-slate-50/20 dark:bg-[#18191a]/30 relative">
          {activeConv ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-slate-200 dark:border-[#3e4042] flex items-center justify-between bg-white dark:bg-[#242526]">
                <div className="flex items-center gap-3">
                  <img
                    src={
                      activeConv.isGroup
                        ? resolveAvatarUrl(null)
                        : resolveAvatarUrl(activeConv.chatPartner?.avatarUrl)
                    }
                    alt={activeConv.isGroup ? activeConv.name || 'Group' : activeConv.chatPartner?.displayName}
                    className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-transparent flex-shrink-0"
                  />
                  <div>
                    <h3 className="text-xs font-bold text-black dark:text-[#e4e6eb]">
                      {activeConv.isGroup ? activeConv.name : activeConv.chatPartner?.displayName}
                    </h3>
                    <span className="text-[10px] text-slate-550">
                      {activeConv.isGroup ? `${activeConv.members.length} thành viên` : 'Tin nhắn trực tiếp'}
                    </span>
                  </div>
                </div>

                {activeConv.isGroup && activeConv.myRole?.isAdmin && (
                  <button
                    onClick={() => setShowAddMember(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#e7f3ff] hover:bg-[#dbeaff] text-[#1877f2] dark:bg-[#3a3b3c] dark:text-white rounded-md text-xs font-bold transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Quản lý thành viên
                  </button>
                )}

                {!activeConv.isGroup && activeConv.chatPartner && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => startCall('audio')}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-[#3a3b3c] rounded-full text-[#1877f2]"
                      title="Gọi thoại"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => startCall('video')}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-[#3a3b3c] rounded-full text-[#1877f2]"
                      title="Gọi video"
                    >
                      <Video className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5">
                {messages.length === 0 ? (
                  <div className="my-auto text-center py-10 flex flex-col items-center gap-2 text-slate-400">
                    <span className="text-3xl">👋</span>
                    <p className="text-xs">Gửi tin nhắn để bắt đầu trò chuyện.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.senderId === user?.id;
                    const avatar = resolveAvatarUrl(msg.sender?.profile?.avatarUrl);

                    return (
                      <div key={msg.id} className={`flex items-end gap-2.5 max-w-[80%] ${isMine ? 'self-end flex-row-reverse' : 'self-start'}`}>
                        {!isMine && (
                          <OptimizedAvatar src={avatar} alt={msg.sender?.profile?.displayName || 'User'} size={28} className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-transparent flex-shrink-0" />
                        )}
                        <div className="flex flex-col gap-1">
                          {msg.replyTo && (
                            <div className={`text-[10px] px-2 py-1 rounded-lg border-l-2 ${
                              isMine ? 'bg-white/20 border-white/50' : 'bg-slate-100 dark:bg-[#2a2b2c] border-[#1877f2]'
                            }`}>
                              <span className="font-semibold block opacity-80">
                                {msg.replyTo.sender?.profile?.displayName || 'Tin nhắn'}
                              </span>
                              <span className="opacity-70 truncate block max-w-[200px]">
                                {msg.replyTo.content || (msg.replyTo.mediaUrl ? 'Tệp đính kèm' : '')}
                              </span>
                            </div>
                          )}
                          <div className={`py-2 px-3.5 rounded-2xl text-xs ${
                            isMine
                              ? 'bg-[#1877f2] text-white rounded-br-none'
                              : 'bg-slate-200 dark:bg-[#3a3b3c] text-slate-800 dark:text-[#e4e6eb] rounded-bl-none'
                          }`}>
                            {msg.content && <p className="leading-normal break-words whitespace-pre-wrap">{msg.content}</p>}

                            {msg.mediaUrl && (
                              <div className="mt-1.5 max-w-sm rounded-lg overflow-hidden border border-slate-350 dark:border-transparent">
                                {msg.mediaType === 'VIDEO' ? (
                                  <video src={resolveMediaUrl(msg.mediaUrl)} controls preload="metadata" className="max-h-48 object-cover" />
                                ) : (
                                  <img src={resolveMediaUrl(msg.mediaUrl)} alt="Đính kèm" loading="lazy" decoding="async" className="max-h-48 object-cover" />
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className={`flex items-center gap-1.5 text-[9px] text-slate-550 px-1.5 ${isMine ? 'justify-end' : ''}`}>
                            <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {!isMine && (
                              <button onClick={() => setReplyTo(msg)} className="text-slate-400 hover:text-[#1877f2] flex items-center gap-0.5">
                                <Reply className="w-2.5 h-2.5" /> Trả lời
                              </button>
                            )}
                            {isMine && (
                              <button onClick={() => removeMessage(msg.id)} className="text-red-500 hover:underline">
                                Xóa
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Typing box */}
              {activeTypers.length > 0 && (
                <div className="absolute bottom-16 left-4 text-[10px] text-slate-500 italic animate-pulse">
                  {activeTypers.join(', ')} đang nhập...
                </div>
              )}

              {/* Chat Composer footer */}
              <div className="p-3 border-t border-slate-200 dark:border-[#3e4042] bg-white dark:bg-[#242526] relative">
                {replyTo && (
                  <div className="mb-2 px-3 py-2 bg-slate-100 dark:bg-[#3a3b3c] rounded-lg flex items-center justify-between text-xs">
                    <div className="border-l-2 border-[#1877f2] pl-2">
                      <span className="font-semibold text-[#1877f2] block">Trả lời {replyTo.sender?.profile?.displayName}</span>
                      <span className="text-slate-500 truncate block max-w-[250px]">{replyTo.content}</span>
                    </div>
                    <button type="button" onClick={() => setReplyTo(null)} className="p-1 hover:bg-slate-200 rounded-full">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                {filePreview && (
                  <div className="p-2 mb-2 bg-slate-100 dark:bg-[#3a3b3c] rounded-lg border border-slate-200 dark:border-[#3e4042] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {selectedFile?.type.startsWith('video/') ? (
                        <video src={filePreview} className="w-12 h-12 object-cover rounded" />
                      ) : (
                        <img src={filePreview} alt="upload preview" className="w-12 h-12 object-cover rounded" />
                      )}
                      <span className="text-[10px] text-slate-550 truncate max-w-[150px]">{selectedFile?.name}</span>
                    </div>
                    <button onClick={handleRemoveFile} className="p-1 hover:bg-slate-200 dark:hover:bg-[#3a3b3c] text-slate-650 rounded-full">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <form onSubmit={handleSend} className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 hover:bg-slate-150 dark:hover:bg-[#3a3b3c] text-slate-500 hover:text-[#1877f2] rounded-full transition-colors"
                  >
                    <Paperclip className="w-5 h-5" />
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,video/*" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowEmoji(!showEmoji)}
                    className="p-2 hover:bg-slate-150 dark:hover:bg-[#3a3b3c] text-slate-500 hover:text-[#1877f2] rounded-full transition-colors"
                  >
                    <Smile className="w-5 h-5" />
                  </button>

                  {showEmoji && (
                    <div className="absolute bottom-14 left-3">
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
                    onChange={handleInputChange}
                    className="flex-1 px-4 py-2 bg-[#f0f2f5] dark:bg-[#3a3b3c] border-0 rounded-full text-xs focus:outline-none dark:text-white placeholder-slate-500"
                  />

                  <button
                    type="submit"
                    className="p-2 text-[#1877f2] hover:bg-slate-150 dark:hover:bg-[#3a3b3c] rounded-full flex items-center justify-center transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 gap-3.5 text-slate-500">
              <MessageSquare className="w-16 h-16 text-slate-350 stroke-1" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Hộp thư đến</h3>
              <p className="text-xs text-slate-550 max-w-xs leading-normal">
                Chọn cuộc trò chuyện bên trái hoặc bắt đầu chat mới với bạn bè.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateGroup && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#242526] p-6 rounded-lg border border-slate-200 dark:border-[#3e4042] flex flex-col gap-4 shadow-lg">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-[#3e4042] pb-2">
              <h3 className="text-sm font-bold text-black dark:text-white">Nhóm chat mới</h3>
              <button onClick={() => setShowCreateGroup(false)} className="p-1 hover:bg-slate-200 dark:hover:bg-[#3a3b3c] rounded-full text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleCreateGroupSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Tên nhóm</label>
                <input
                  type="text"
                  placeholder="VD: Nhóm công việc"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#3a3b3c] border border-slate-200 dark:border-[#3e4042] rounded-md text-xs dark:text-white focus:border-[#1877f2] focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Chọn thành viên</label>
                <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-[#3e4042] rounded bg-slate-50 dark:bg-[#3a3b3c]/50 p-2 flex flex-col gap-1.5">
                  {friends.length === 0 ? (
                    <span className="text-xs text-slate-500 text-center py-4 block">Chưa có bạn bè để mời</span>
                  ) : (
                    friends.map((friend) => (
                      <button
                        key={friend.id}
                        type="button"
                        onClick={() => handleToggleSelectFriend(friend.id)}
                        className={`w-full text-left p-2 flex items-center justify-between rounded text-xs hover:bg-slate-200 dark:hover:bg-[#3a3b3c] transition-colors ${
                          selectedFriends.includes(friend.id) ? 'bg-[#e7f3ff] text-[#1877f2] dark:bg-brand-950/20' : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={resolveAvatarUrl(friend.profile?.avatarUrl)}
                            alt={friend.profile?.displayName}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <span>{friend.profile?.displayName}</span>
                        </div>
                        {selectedFriends.includes(friend.id) ? (
                          <span className="text-[10px] bg-[#1877f2] text-white font-bold px-2 py-0.5 rounded-full">Đã chọn</span>
                        ) : (
                          <Plus className="w-3.5 h-3.5 text-slate-455" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={!groupName.trim() || selectedFriends.length === 0}
                className="w-full mt-2 py-2.5 bg-[#1877f2] hover:bg-[#166fe5] disabled:opacity-40 text-white font-bold rounded-md text-xs transition-all"
              >
                Tạo nhóm chat
              </button>
            </form>
          </div>
        </div>
      )}

      {showAddMember && activeConv && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#242526] p-6 rounded-lg border border-slate-200 dark:border-[#3e4042] flex flex-col gap-4 shadow-lg">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-[#3e4042] pb-2">
              <h3 className="text-sm font-bold text-black dark:text-white">Quản lý thành viên</h3>
              <button onClick={() => setShowAddMember(false)} className="p-1 hover:bg-slate-200 dark:hover:bg-[#3a3b3c] rounded-full text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Thành viên ({activeConv.members.length})</span>
              <div className="max-h-36 overflow-y-auto border border-slate-200 dark:border-[#3e4042] rounded bg-slate-50 dark:bg-[#3a3b3c]/50 p-2 flex flex-col gap-2">
                {activeConv.members.map((m, idx) => (
                  <div key={`${m.userId}-${idx}`} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <img src={resolveAvatarUrl(m.avatarUrl)} className="w-6 h-6 rounded-full object-cover" />
                      <span className={m.isAdmin ? 'font-bold text-[#1877f2]' : 'text-slate-700 dark:text-slate-300'}>
                        {m.displayName} {m.isAdmin && '(Quản trị)'}
                      </span>
                    </div>
                    {activeConv.creatorId === user?.id && m.userId !== user?.id && (
                      <button onClick={() => handleRemoveMember(m.userId)} className="p-1 text-red-500 hover:bg-slate-200 dark:hover:bg-red-950/20 rounded">
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Mời bạn bè</span>
              <div className="max-h-36 overflow-y-auto border border-slate-200 dark:border-[#3e4042] rounded bg-slate-50 dark:bg-[#3a3b3c]/50 p-2 flex flex-col gap-2">
                {friends.filter(f => !activeConv.members.some(m => m.userId === f.id)).length === 0 ? (
                  <span className="text-xs text-slate-500 text-center py-3">Đã mời hết bạn bè.</span>
                ) : (
                  friends
                    .filter((f) => !activeConv.members.some((m) => m.userId === f.id))
                    .map((friend, idx) => (
                      <div key={`${friend.id}-${idx}`} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <img src={resolveAvatarUrl(friend.profile?.avatarUrl)} className="w-6 h-6 rounded-full object-cover" />
                          <span className="text-slate-700 dark:text-slate-300">{friend.profile?.displayName}</span>
                        </div>
                        <button
                          onClick={() => handleAddMemberSubmit(friend.id)}
                          className="px-2.5 py-1 bg-[#1877f2] hover:bg-[#166fe5] text-white rounded text-[10px] font-semibold"
                        >
                          Mời
                        </button>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {incomingCall && !activeCall && (
        <IncomingCallModal
          socket={socket}
          fromUserId={incomingCall.fromUserId}
          callerName={incomingCall.callerName}
          callType={incomingCall.callType}
          offer={incomingCall.offer}
          onDecline={() => setIncomingCall(null)}
          onAccept={() => {
            setActiveCall({
              remoteUserId: incomingCall.fromUserId,
              remoteName: incomingCall.callerName,
              callType: incomingCall.callType,
              isIncoming: true,
              offer: incomingCall.offer,
            });
            setIncomingCall(null);
          }}
        />
      )}

      {activeCall && user && (
        <CallOverlay
          socket={socket}
          localUserId={user.id}
          localUserName={user.displayName || 'Bạn'}
          remoteUserId={activeCall.remoteUserId}
          remoteName={activeCall.remoteName}
          remoteAvatar={activeCall.remoteAvatar}
          callType={activeCall.callType}
          isIncoming={activeCall.isIncoming}
          incomingOffer={activeCall.offer}
          onClose={() => setActiveCall(null)}
        />
      )}
    </Layout>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-10 h-10 border-4 border-[#1877f2] border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    }>
      <ChatPageContent />
    </Suspense>
  );
}
