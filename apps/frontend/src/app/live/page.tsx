'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../../components/Layout';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useSocket } from '../../context/SocketContext';
import OptimizedAvatar from '../../components/OptimizedAvatar';
import { Radio, Video, X, Users, Send } from 'lucide-react';

interface LiveSession {
  id: string;
  title: string;
  hostId: string;
  status: string;
  startedAt: string;
  host: {
    profile?: { displayName: string; avatarUrl: string | null };
  };
}

interface ChatMessage {
  id: string;
  userId: string;
  displayName: string;
  content: string;
  createdAt: string;
}

export default function LivePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { socket } = useSocket();

  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [activeSession, setActiveSession] = useState<LiveSession | null>(null);
  const [isHosting, setIsHosting] = useState(false);
  const [title, setTitle] = useState('');
  const [viewerCount, setViewerCount] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await api.get('/live');
      if (res.data?.status === 'success') {
        setSessions(res.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchSessions();
    const interval = setInterval(fetchSessions, 15000);
    return () => clearInterval(interval);
  }, [isAuthenticated, router, fetchSessions]);

  useEffect(() => {
    if (!socket || !activeSession) return;

    const handleChatMessage = (msg: ChatMessage) => {
      setChatMessages((prev) => [...prev, msg]);
    };

    socket.on('live:chat-message', handleChatMessage);
    return () => {
      socket.off('live:chat-message', handleChatMessage);
    };
  }, [socket, activeSession]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeSession || !user) return;

    const msg: ChatMessage = {
      id: `local-${Date.now()}`,
      userId: user.id,
      displayName: user.displayName,
      content: chatInput.trim(),
      createdAt: new Date().toISOString(),
    };

    if (socket) {
      socket.emit('live:chat-message', {
        sessionId: activeSession.id,
        content: chatInput.trim(),
      });
    }

    setChatMessages((prev) => [...prev, msg]);
    setChatInput('');
  };

  const startBroadcast = async () => {
    if (!title.trim()) return;
    try {
      const res = await api.post('/live', { title: title.trim() });
      if (res.data?.status === 'success') {
        const session = res.data.data;
        setActiveSession(session);
        setIsHosting(true);
        setChatMessages([]);

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        socket?.emit('live:join', { sessionId: session.id });

        socket?.on('live:viewer-joined', async ({ userId: viewerId }: any) => {
          if (!pcRef.current) {
            pcRef.current = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
            stream.getTracks().forEach((t) => pcRef.current!.addTrack(t, stream));
            pcRef.current.onicecandidate = (e) => {
              if (e.candidate) {
                socket?.emit('live:ice-candidate', { sessionId: session.id, toUserId: viewerId, candidate: e.candidate });
              }
            };
          }
          const offer = await pcRef.current.createOffer();
          await pcRef.current.setLocalDescription(offer);
          socket?.emit('live:offer', { sessionId: session.id, toUserId: viewerId, offer });
          setViewerCount((c) => c + 1);
        });

        fetchSessions();
      }
    } catch (e) {
      console.error('Cannot start live', e);
    }
  };

  const watchLive = async (session: LiveSession) => {
    setActiveSession(session);
    setIsHosting(false);
    setChatMessages([]);

    socket?.emit('live:join', { sessionId: session.id });

    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    pcRef.current = pc;

    pc.ontrack = (e) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
    };

    const onOffer = async ({ fromUserId, offer }: any) => {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket?.emit('live:answer', { sessionId: session.id, toUserId: fromUserId, answer });
    };

    const onIce = async ({ candidate }: any) => {
      if (candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
    };

    socket?.on('live:offer', onOffer);
    socket?.on('live:ice-candidate', onIce);
  };

  const endLive = async () => {
    if (activeSession && isHosting) {
      await api.put(`/live/${activeSession.id}/end`).catch(() => {});
    }
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    socket?.emit('live:leave', { sessionId: activeSession?.id });
    setActiveSession(null);
    setIsHosting(false);
    setTitle('');
    setViewerCount(0);
    setChatMessages([]);
    fetchSessions();
  };

  const renderChatSidebar = () => (
    <div className="flex flex-col h-full bg-[#242526] rounded-xl border border-[#3e4042] overflow-hidden">
      <div className="px-4 py-3 border-b border-[#3e4042]">
        <h3 className="text-sm font-bold text-white">Trò chuyện trực tiếp</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 min-h-[200px] max-h-[400px]">
        {chatMessages.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">Chưa có tin nhắn. Hãy là người đầu tiên!</p>
        ) : (
          chatMessages.map((msg) => (
            <div key={msg.id} className="flex flex-col">
              <span className="text-xs font-semibold text-[#1877f2]">{msg.displayName}</span>
              <span className="text-sm text-slate-200">{msg.content}</span>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>
      <form onSubmit={sendChatMessage} className="p-3 border-t border-[#3e4042] flex gap-2">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Bình luận..."
          className="flex-1 px-3 py-2 bg-[#3a3b3c] rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!chatInput.trim()}
          className="p-2 bg-[#1877f2] hover:bg-[#166fe5] text-white rounded-lg disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );

  if (activeSession) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-4">
          <div className="flex-1 min-w-0">
          <div className="bg-black rounded-2xl overflow-hidden relative aspect-video">
            {isHosting ? (
              <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            ) : (
              <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            )}
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold">
              <Radio className="w-3 h-3 animate-pulse" /> TRỰC TIẾP
            </div>
            <button type="button" onClick={endLive} className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70">
              <X className="w-5 h-5" />
            </button>
            <div className="absolute bottom-4 left-4 right-4">
              <h2 className="text-white font-bold text-lg">{activeSession.title}</h2>
              <p className="text-slate-300 text-sm flex items-center gap-1">
                <Users className="w-4 h-4" /> {isHosting ? `${viewerCount} người xem` : activeSession.host.profile?.displayName}
              </p>
            </div>
          </div>
          {isHosting && (
            <button type="button" onClick={endLive} className="mt-4 w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl">
              Kết thúc phát trực tiếp
            </button>
          )}
          </div>
          <div className="w-full lg:w-80 flex-shrink-0">
            {renderChatSidebar()}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold dark:text-white flex items-center gap-2">
            <Video className="w-6 h-6 text-red-500" /> Phát trực tiếp
          </h1>
        </div>

        <div className="bg-white dark:bg-[#242526] rounded-xl border border-slate-200 dark:border-[#3e4042] p-4 flex flex-col gap-3">
          <h3 className="font-semibold text-sm dark:text-white">Bắt đầu buổi live của bạn</h3>
          <input
            type="text"
            placeholder="Tiêu đề buổi phát trực tiếp..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 bg-[#f0f2f5] dark:bg-[#3a3b3c] rounded-lg text-sm focus:outline-none dark:text-white"
          />
          <button
            type="button"
            onClick={startBroadcast}
            disabled={!title.trim()}
            className="py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Radio className="w-4 h-4" /> Phát trực tiếp ngay
          </button>
        </div>

        <div>
          <h3 className="font-semibold text-sm mb-3 dark:text-white">Đang phát trực tiếp</h3>
          {sessions.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">Chưa có buổi phát trực tiếp nào</p>
          ) : (
            <div className="grid gap-3">
              {sessions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => watchLive(s)}
                  className="flex items-center gap-3 p-3 bg-white dark:bg-[#242526] rounded-xl border border-slate-200 dark:border-[#3e4042] hover:border-[#1877f2] text-left transition-colors"
                >
                  <OptimizedAvatar src={s.host.profile?.avatarUrl} alt={s.host.profile?.displayName} size={48} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm dark:text-white truncate">{s.title}</p>
                    <p className="text-xs text-slate-500">{s.host.profile?.displayName}</p>
                  </div>
                  <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-950/30 px-2 py-1 rounded-full flex items-center gap-1">
                    <Radio className="w-2.5 h-2.5" /> LIVE
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
