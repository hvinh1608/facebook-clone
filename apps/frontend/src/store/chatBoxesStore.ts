import { create } from 'zustand';

interface ChatBoxEntry {
  userId: string;
  minimized: boolean;
  unreadCount: number;
}

interface ChatBoxesState {
  openBoxes: ChatBoxEntry[];
  openBox: (userId: string) => void;
  closeBox: (userId: string) => void;
  minimizeBox: (userId: string) => void;
  restoreBox: (userId: string) => void;
  incrementUnread: (userId: string) => void;
  resetUnread: (userId: string) => void;
}

export const useChatBoxesStore = create<ChatBoxesState>((set) => ({
  openBoxes: [],

  openBox: (userId) =>
    set((state) => {
      const existing = state.openBoxes.find((b) => b.userId === userId);
      if (existing) {
        // If already open but minimized, restore it
        return {
          openBoxes: state.openBoxes.map((b) =>
            b.userId === userId ? { ...b, minimized: false, unreadCount: 0 } : b
          ),
        };
      }
      const nextBoxes: ChatBoxEntry[] = [
        ...state.openBoxes,
        { userId, minimized: false, unreadCount: 0 },
      ];
      // Cap at 5 total (3 open + 2 bubbles is reasonable)
      if (nextBoxes.length > 5) {
        nextBoxes.shift();
      }
      return { openBoxes: nextBoxes };
    }),

  closeBox: (userId) =>
    set((state) => ({
      openBoxes: state.openBoxes.filter((b) => b.userId !== userId),
    })),

  minimizeBox: (userId) =>
    set((state) => ({
      openBoxes: state.openBoxes.map((b) =>
        b.userId === userId ? { ...b, minimized: true } : b
      ),
    })),

  restoreBox: (userId) =>
    set((state) => ({
      openBoxes: state.openBoxes.map((b) =>
        b.userId === userId ? { ...b, minimized: false, unreadCount: 0 } : b
      ),
    })),

  incrementUnread: (userId) =>
    set((state) => ({
      openBoxes: state.openBoxes.map((b) =>
        b.userId === userId && b.minimized
          ? { ...b, unreadCount: b.unreadCount + 1 }
          : b
      ),
    })),

  resetUnread: (userId) =>
    set((state) => ({
      openBoxes: state.openBoxes.map((b) =>
        b.userId === userId ? { ...b, unreadCount: 0 } : b
      ),
    })),
}));
