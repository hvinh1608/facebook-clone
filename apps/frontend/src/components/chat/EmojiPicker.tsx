'use client';

import React from 'react';

const EMOJI_GROUPS = [
  ['😀', '😂', '🥰', '😍', '😊', '😎', '🤔', '😢', '😡', '👍'],
  ['❤️', '🔥', '✨', '🎉', '👏', '🙏', '💯', '⭐', '🎵', '☕'],
  ['👋', '🤝', '💪', '🙌', '😴', '🤣', '😭', '😱', '🥳', '🤩'],
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose?: () => void;
  className?: string;
}

export default function EmojiPicker({ onSelect, onClose, className = '' }: EmojiPickerProps) {
  return (
    <div className={`bg-white dark:bg-[#242526] border border-slate-200 dark:border-[#3e4042] rounded-xl shadow-xl p-2 z-50 ${className}`}>
      <div className="flex items-center justify-between px-1 pb-1 mb-1 border-b border-slate-100 dark:border-[#3e4042]">
        <span className="text-[10px] font-bold text-slate-500 uppercase">Biểu tượng</span>
        {onClose && (
          <button type="button" onClick={onClose} className="text-xs text-slate-400 hover:text-slate-600">
            Đóng
          </button>
        )}
      </div>
      {EMOJI_GROUPS.map((row, i) => (
        <div key={i} className="flex flex-wrap gap-0.5 mb-0.5">
          {row.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onSelect(emoji)}
              className="w-8 h-8 hover:bg-slate-100 dark:hover:bg-[#3a3b3c] rounded text-lg transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
