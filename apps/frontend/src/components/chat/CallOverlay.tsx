'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff } from 'lucide-react';
import { Socket } from 'socket.io-client';
import OptimizedAvatar from '../OptimizedAvatar';

interface CallOverlayProps {
  socket: Socket | null;
  localUserId: string;
  localUserName: string;
  remoteUserId: string;
  remoteName: string;
  remoteAvatar?: string | null;
  callType: 'audio' | 'video';
  isIncoming?: boolean;
  incomingOffer?: RTCSessionDescriptionInit;
  onClose: () => void;
}

export default function CallOverlay({
  socket,
  localUserId,
  localUserName,
  remoteUserId,
  remoteName,
  remoteAvatar,
  callType,
  isIncoming = false,
  incomingOffer,
  onClose,
}: CallOverlayProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [status, setStatus] = useState(isIncoming ? 'Đang đổ chuông...' : 'Đang kết nối...');
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(callType === 'audio');
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (status !== 'Đã kết nối') return;
    const t = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(t);
  }, [status]);

  useEffect(() => {
    if (!socket) return;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });
    pcRef.current = pc;

    pc.ontrack = (e) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = e.streams[0];
      }
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit('call:ice-candidate', {
          toUserId: remoteUserId,
          candidate: e.candidate,
        });
      }
    };

    const startCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callType === 'video',
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        const onAnswer = async ({ fromUserId, answer }: any) => {
          if (fromUserId !== remoteUserId) return;
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          setStatus('Đã kết nối');
        };

        const onIce = async ({ fromUserId, candidate }: any) => {
          if (fromUserId !== remoteUserId || !candidate) return;
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        };

        socket.on('call:answer', onAnswer);
        socket.on('call:ice-candidate', onIce);

        if (isIncoming && incomingOffer) {
          await pc.setRemoteDescription(new RTCSessionDescription(incomingOffer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('call:answer', { toUserId: remoteUserId, answer });
          setStatus('Đã kết nối');
        } else {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('call:offer', {
            toUserId: remoteUserId,
            offer,
            callType,
            callerName: localUserName,
          });
          setStatus('Đang đổ chuông...');
        }

        return () => {
          socket.off('call:answer', onAnswer);
          socket.off('call:ice-candidate', onIce);
        };
      } catch {
        setStatus('Không thể truy cập mic/camera');
      }
    };

    const cleanupListeners = startCall();

    const handleEnd = ({ fromUserId }: any) => {
      if (fromUserId === remoteUserId) onClose();
    };
    socket.on('call:end', handleEnd);

    return () => {
      socket.off('call:end', handleEnd);
      cleanupListeners?.then?.((fn) => fn?.());
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      pc.close();
      socket.emit('call:end', { toUserId: remoteUserId });
    };
  }, [socket, remoteUserId, callType, isIncoming, incomingOffer, onClose, localUserName]);

  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = muted;
    });
    setMuted(!muted);
  };

  const toggleVideo = () => {
    localStreamRef.current?.getVideoTracks().forEach((t) => {
      t.enabled = videoOff;
    });
    setVideoOff(!videoOff);
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-6">
        <OptimizedAvatar src={remoteAvatar} alt={remoteName} size={80} className="w-20 h-20 rounded-full mx-auto mb-3" />
        <h3 className="text-white text-lg font-bold">{remoteName}</h3>
        <p className="text-slate-400 text-sm mt-1">
          {status}
          {status === 'Đã kết nối' && ` · ${formatDuration(duration)}`}
        </p>
        <p className="text-[10px] text-slate-500 mt-1">Cuộc gọi demo WebRTC</p>
      </div>

      <div className="relative w-full max-w-lg aspect-video bg-slate-900 rounded-xl overflow-hidden mb-6">
        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
        {!videoOff && (
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="absolute bottom-3 right-3 w-28 h-20 object-cover rounded-lg border-2 border-white/30"
          />
        )}
      </div>

      <div className="flex items-center gap-4">
        <button type="button" onClick={toggleMute} className={`p-4 rounded-full ${muted ? 'bg-red-500' : 'bg-slate-700'} text-white`}>
          {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
        {callType === 'video' && (
          <button type="button" onClick={toggleVideo} className={`p-4 rounded-full ${videoOff ? 'bg-red-500' : 'bg-slate-700'} text-white`}>
            {videoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>
        )}
        <button type="button" onClick={onClose} className="p-4 rounded-full bg-red-600 hover:bg-red-500 text-white">
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
