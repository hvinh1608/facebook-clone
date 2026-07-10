'use client';

import React, { useMemo, useState } from 'react';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';

export interface PollOption {
  id: string;
  text: string;
  voterIds?: string[];
}

interface PostPollProps {
  postId: string;
  pollOptions: PollOption[] | string[] | null | undefined;
  onVoted?: (options: PollOption[]) => void;
}

function normalizeOptions(raw: PollOption[] | string[] | null | undefined): PollOption[] {
  if (!raw || !Array.isArray(raw)) return [];
  if (raw.length === 0) return [];
  if (typeof raw[0] === 'string') {
    return (raw as string[]).map((text, i) => ({ id: String(i), text, voterIds: [] }));
  }
  return (raw as PollOption[]).map((o, i) => ({
    id: o.id ?? String(i),
    text: o.text,
    voterIds: o.voterIds || [],
  }));
}

export default function PostPoll({ postId, pollOptions, onVoted }: PostPollProps) {
  const { user } = useAuthStore();
  const [options, setOptions] = useState<PollOption[]>(() => normalizeOptions(pollOptions));
  const [voting, setVoting] = useState(false);

  const totalVotes = useMemo(
    () => options.reduce((sum, o) => sum + (o.voterIds?.length || 0), 0),
    [options]
  );

  const myVoteId = useMemo(() => {
    if (!user?.id) return null;
    const mine = options.find((o) => o.voterIds?.includes(user.id));
    return mine?.id ?? null;
  }, [options, user?.id]);

  const handleVote = async (optionId: string) => {
    if (voting) return;
    setVoting(true);
    try {
      const res = await api.post(`/posts/${postId}/vote`, { optionId });
      if (res.data?.status === 'success') {
        const updated = normalizeOptions(res.data.data.pollOptions);
        setOptions(updated);
        onVoted?.(updated);
      }
    } catch (e) {
      console.error('Poll vote failed', e);
    } finally {
      setVoting(false);
    }
  };

  if (options.length === 0) return null;

  return (
    <div className="mt-3 flex flex-col gap-2">
      {options.map((opt) => {
        const votes = opt.voterIds?.length || 0;
        const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
        const isSelected = myVoteId === opt.id;
        const hasVoted = !!myVoteId;

        return (
          <button
            key={opt.id}
            type="button"
            disabled={voting}
            onClick={() => !hasVoted && handleVote(opt.id)}
            className={`relative w-full text-left rounded-lg border overflow-hidden transition-colors ${
              hasVoted
                ? 'border-slate-200 dark:border-[#3e4042] cursor-default'
                : 'border-[#1877f2]/40 hover:border-[#1877f2] hover:bg-[#e7f3ff]/50 dark:hover:bg-[#263951]/30'
            } ${isSelected ? 'border-[#1877f2] bg-[#e7f3ff]/30 dark:bg-[#263951]/20' : ''}`}
          >
            {hasVoted && (
              <div
                className="absolute inset-y-0 left-0 bg-[#1877f2]/15 dark:bg-[#1877f2]/25 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            )}
            <div className="relative flex items-center justify-between px-3 py-2.5 text-sm">
              <span className={`font-semibold ${isSelected ? 'text-[#1877f2]' : 'text-slate-800 dark:text-[#e4e6eb]'}`}>
                {opt.text}
              </span>
              {hasVoted && (
                <span className="text-xs font-bold text-slate-500">{pct}%</span>
              )}
            </div>
          </button>
        );
      })}
      <p className="text-xs text-slate-500 font-medium">
        {totalVotes} lượt bình chọn{myVoteId ? ' · Bạn đã bình chọn' : ''}
      </p>
    </div>
  );
}
