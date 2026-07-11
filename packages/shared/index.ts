/** Shared types between frontend and backend */

export const REACTION_TYPES = ['LIKE', 'LOVE', 'HAHA', 'WOW', 'SAD', 'ANGRY'] as const;
export type ReactionType = (typeof REACTION_TYPES)[number];

export const NOTIFICATION_TYPES = [
  'LIKE',
  'COMMENT',
  'FRIEND_REQUEST',
  'FRIEND_ACCEPT',
  'NEW_MESSAGE',
  'SHARE',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export type FeedSort = 'recent' | 'top';

export const REACTION_EMOJI: Record<ReactionType, string> = {
  LIKE: '👍',
  LOVE: '❤️',
  HAHA: '😆',
  WOW: '😮',
  SAD: '😢',
  ANGRY: '😡',
};
