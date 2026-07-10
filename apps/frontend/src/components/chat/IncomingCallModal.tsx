'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff } from 'lucide-react';
import { Socket } from 'socket.io-client';

interface IncomingCallModalProps {
  socket: Socket | null;
  fromUserId: string;
  callerName: string;
  callType: 'audio' | 'video';
  offer: RTCSessionDescriptionInit;
  onAccept: () => void;
  onDecline: () => void;
}

export default function IncomingCallModal({
  socket,
  fromUserId,
  callerName,
  callType,
  offer,
  onAccept,
  onDecline,
}: IncomingCallModalProps) {
  const handleDecline = () => {
    socket?.emit('call:end', { toUserId: fromUserId });
    onDecline();
  };

  return (
    <div className="fixed inset-0 z-[190] bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#242526] rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
        <div className="w-16 h-16 bg-[#1877f2]/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          {callType === 'video' ? '📹' : '📞'}
        </div>
        <h3 className="font-bold text-lg mb-1">{callerName}</h3>
        <p className="text-sm text-slate-500 mb-6">
          Cuộc gọi {callType === 'video' ? 'video' : 'thoại'} đến...
        </p>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={handleDecline}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-full font-semibold text-sm"
          >
            <PhoneOff className="w-4 h-4" />
            Từ chối
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-full font-semibold text-sm"
          >
            <Phone className="w-4 h-4" />
            Trả lời
          </button>
        </div>
      </div>
    </div>
  );
}
