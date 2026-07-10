import { create } from 'zustand';
import { api } from '../services/api';

interface Conversation {
  id: string;
  name: string | null;
  isGroup: boolean;
  creatorId: string | null;
  createdAt: string;
  updatedAt: string;
  lastMessage: any;
  members: Array<{ userId: string; displayName: string; avatarUrl: string | null; isAdmin: boolean }>;
  chatPartner: { userId: string; displayName: string; avatarUrl: string | null } | null;
  myRole: { isAdmin: boolean } | null;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string | null;
  mediaUrl: string | null;
  mediaType: 'IMAGE' | 'VIDEO' | null;
  isRead: boolean;
  replyToId?: string | null;
  replyTo?: Message | null;
  createdAt: string;
  sender: {
    id: string;
    profile: {
      displayName: string;
      avatarUrl: string | null;
    } | null;
  };
}

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Message[];
  typingUsers: Record<string, Record<string, string>>; // convId -> { userId: displayName }
  isLoadingConvs: boolean;
  isLoadingMsgs: boolean;
  
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  setActiveConversationId: (id: string | null) => void;
  sendMessage: (conversationId: string, content: string, file?: File, replyToId?: string) => Promise<void>;
  receiveMessage: (message: Message) => void;
  setTypingStatus: (conversationId: string, userId: string, displayName: string, isTyping: boolean) => void;
  removeMessage: (messageId: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  typingUsers: {},
  isLoadingConvs: false,
  isLoadingMsgs: false,

  fetchConversations: async () => {
    try {
      set({ isLoadingConvs: true });
      const res = await api.get('/messages/conversations');
      if (res.data?.status === 'success') {
        set({ conversations: res.data.data });
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      set({ isLoadingConvs: false });
    }
  },

  fetchMessages: async (conversationId) => {
    try {
      set({ isLoadingMsgs: true, activeConversationId: conversationId });
      const res = await api.get(`/messages/${conversationId}/messages`);
      if (res.data?.status === 'success') {
        const payload = Array.isArray(res.data.data) ? res.data.data : res.data.data?.messages || [];
        set({ messages: payload });
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      set({ isLoadingMsgs: false });
    }
  },

  setActiveConversationId: (id) => {
    set({ activeConversationId: id, messages: id ? get().messages : [] });
  },

  sendMessage: async (conversationId, content, file, replyToId) => {
    try {
      let res;
      if (file) {
        const formData = new FormData();
        formData.append('content', content);
        formData.append('media', file);
        if (replyToId) formData.append('replyToId', replyToId);
        res = await api.post(`/messages/${conversationId}/messages`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        res = await api.post(`/messages/${conversationId}/messages`, { content, replyToId });
      }

      if (res.data?.status === 'success') {
        const newMessage = res.data.data;
        if (get().activeConversationId === conversationId) {
          set((state) => {
            const exists = state.messages.some((m) => m.id === newMessage.id);
            if (exists) return {};
            return { messages: [...state.messages, newMessage] };
          });
        }
        
        // update lastMessage in conversation sidebar list
        set({
          conversations: get().conversations.map((c) =>
            c.id === conversationId ? { ...c, lastMessage: newMessage } : c
          ),
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  },

  receiveMessage: (message) => {
    const { conversationId } = message;
    
    // If active chat conversation
    if (get().activeConversationId === conversationId) {
      set((state) => {
        const exists = state.messages.some((m) => m.id === message.id);
        if (exists) return {};
        return { messages: [...state.messages, message] };
      });
    }

    // Update conversation list preview
    set({
      conversations: get().conversations.map((c) =>
        c.id === conversationId ? { ...c, lastMessage: message } : c
      ),
    });
  },

  setTypingStatus: (conversationId, userId, displayName, isTyping) => {
    set((state) => {
      const convTypers = { ...(state.typingUsers[conversationId] || {}) };
      if (isTyping) {
        convTypers[userId] = displayName;
      } else {
        delete convTypers[userId];
      }

      return {
        typingUsers: {
          ...state.typingUsers,
          [conversationId]: convTypers,
        },
      };
    });
  },

  removeMessage: (messageId) => {
    set({
      messages: get().messages.filter((m) => m.id !== messageId),
    });
  },
}));
