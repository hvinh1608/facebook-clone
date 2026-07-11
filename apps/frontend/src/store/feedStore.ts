import { create } from 'zustand';
import { api } from '../services/api';
import { useAuthStore } from './authStore';

interface Post {
  id: string;
  content: string | null;
  privacy: 'PUBLIC' | 'FRIENDS' | 'ONLY_ME';
  location: string | null;
  feeling: string | null;
  isReported: boolean;
  groupId: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    profile: {
      displayName: string;
      avatarUrl: string | null;
    } | null;
  };
  media: Array<{ id: string; url: string; type: 'IMAGE' | 'VIDEO' }>;
  reactions: Array<{ id: string; userId: string; type: string }>;
  hasReacted: boolean;
  reactionType: string | null;
  _count: {
    comments: number;
  };
}

export type FeedSort = 'recent' | 'popular';

interface FeedState {
  posts: Post[];
  nextCursor: string | null;
  isLoading: boolean;
  hasInitialized: boolean;
  sort: FeedSort;
  hasNewPosts: boolean;
  fetchFeed: (reset?: boolean, sort?: FeedSort) => Promise<void>;
  refreshFeed: () => Promise<void>;
  markNewPostsAvailable: () => void;
  setSort: (sort: FeedSort) => void;
  addPost: (post: Post) => void;
  editPost: (postId: string, content: string, privacy: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  reactPost: (postId: string, type: string) => Promise<void>;
  incrementCommentCount: (postId: string) => void;
  decrementCommentCount: (postId: string) => void;
}

const mergeUniquePosts = (currentPosts: Post[], incomingPosts: Post[]) => {
  const existingPostIds = new Set(currentPosts.map((post) => post.id));
  return [...currentPosts, ...incomingPosts.filter((post) => !existingPostIds.has(post.id))];
};

const updatePostInList = (posts: Post[], postId: string, updater: (post: Post) => Post) =>
  posts.map((post) => (post.id === postId ? updater(post) : post));

export const useFeedStore = create<FeedState>((set, get) => ({
  posts: [],
  nextCursor: null,
  isLoading: false,
  hasInitialized: false,
  hasNewPosts: false,
  sort: 'recent' as FeedSort,

  setSort: (sort) => set({ sort }),

  markNewPostsAvailable: () => set({ hasNewPosts: true }),

  refreshFeed: async () => {
    await get().fetchFeed(true);
    set({ hasNewPosts: false });
  },

  fetchFeed: async (reset = false, sortOverride?: FeedSort) => {
    if (get().isLoading) return;
    if (!reset && !get().nextCursor && get().hasInitialized) return;

    const sort = sortOverride ?? get().sort;
    const apiSort = sort === 'popular' ? 'top' : 'recent';

    try {
      set({ isLoading: true });
      const cursor = reset ? '' : get().nextCursor || '';
      
      const response = await api.get(`/posts/feed?limit=10&cursor=${cursor}&sort=${apiSort}`);
      if (response.data?.status === 'success') {
        const { posts: newPosts, nextCursor } = response.data.data;
        const currentPosts = get().posts;
        set({
          posts: reset ? newPosts : mergeUniquePosts(currentPosts, newPosts),
          nextCursor,
          hasInitialized: true,
          sort,
          hasNewPosts: reset ? false : get().hasNewPosts,
        });
      }
    } catch (error) {
      console.error('Error fetching feed posts:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addPost: (post) => {
    set({ posts: [post, ...get().posts] });
  },

  editPost: async (postId, content, privacy) => {
    try {
      const res = await api.put(`/posts/${postId}`, { content, privacy });
      if (res.data?.status === 'success') {
        const updatedPost = res.data.data;
        set({
          posts: updatePostInList(get().posts, postId, (post) => ({ ...post, ...updatedPost })),
        });
      }
    } catch (error) {
      console.error('Error editing post:', error);
    }
  },

  deletePost: async (postId) => {
    try {
      const res = await api.delete(`/posts/${postId}`);
      if (res.data?.status === 'success') {
        set({
          posts: get().posts.filter((p) => p.id !== postId),
        });
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  },

  reactPost: async (postId, type) => {
    const previousPosts = get().posts;
    const currentUser = useAuthStore.getState().user;
    const currentUserId = currentUser?.id;

    if (!currentUserId) return;

    // Optimistic UI updates
    const updatedPosts = updatePostInList(previousPosts, postId, (post) => {
      let newReactions = [...post.reactions];
      let hasReacted = post.hasReacted;
      let reactionType = post.reactionType;

      if (hasReacted) {
        if (reactionType === type) {
          // Remove reaction
          newReactions = newReactions.filter((r) => r.userId !== currentUserId);
          hasReacted = false;
          reactionType = null;
        } else {
          // Update reaction type
          newReactions = newReactions.map((r) => (r.userId === currentUserId ? { ...r, type } : r));
          reactionType = type;
        }
      } else {
        // Add reaction
        newReactions.push({ id: `optimistic-${postId}-${currentUserId}`, userId: currentUserId, type });
        hasReacted = true;
        reactionType = type;
      }

      return {
        ...post,
        reactions: newReactions,
        hasReacted,
        reactionType,
      };
    });

    set({ posts: updatedPosts });

    try {
      await api.post(`/posts/${postId}/react`, { type });
    } catch (error) {
      // Revert if API fails
      console.error('Error reacting to post:', error);
      set({ posts: previousPosts });
    }
  },

  incrementCommentCount: (postId) => {
    set({
      posts: updatePostInList(get().posts, postId, (post) => ({
        ...post,
        _count: { ...post._count, comments: post._count.comments + 1 },
      })),
    });
  },

  decrementCommentCount: (postId) => {
    set({
      posts: updatePostInList(get().posts, postId, (post) => ({
        ...post,
        _count: { ...post._count, comments: Math.max(0, post._count.comments - 1) },
      })),
    });
  },
}));
