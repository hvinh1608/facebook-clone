'use client';

import React from 'react';
import { useChatBoxesStore } from '../store/chatBoxesStore';
import ChatBox from './ChatBox';

export default function ChatBoxesContainer() {
  const { openBoxes } = useChatBoxesStore();

  if (openBoxes.length === 0) return null;

  const expandedBoxes = openBoxes.filter((b) => !b.minimized);
  const minimizedBubbles = openBoxes.filter((b) => b.minimized);

  return (
    <>
      {/* Expanded chatboxes — fixed at bottom, stacked left from right edge */}
      {expandedBoxes.length > 0 && (
        <div className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] md:bottom-0 right-2 md:right-4 z-50 flex gap-2 md:gap-3 items-end pointer-events-none max-w-[calc(100vw-1rem)]">
          {expandedBoxes.map((box) => (
            <ChatBox
              key={box.userId}
              partnerUserId={box.userId}
              isMinimized={false}
              unreadCount={box.unreadCount}
            />
          ))}
        </div>
      )}

      {/* Minimized bubbles — stacked vertically at right edge */}
      {minimizedBubbles.length > 0 && (
        <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:bottom-4 right-2 md:right-4 z-50 flex flex-col-reverse gap-2 md:gap-3 items-center pointer-events-none">
          {minimizedBubbles.map((box) => (
            <ChatBox
              key={box.userId}
              partnerUserId={box.userId}
              isMinimized={true}
              unreadCount={box.unreadCount}
            />
          ))}
        </div>
      )}
    </>
  );
}
