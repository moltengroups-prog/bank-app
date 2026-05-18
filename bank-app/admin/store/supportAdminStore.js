import { create } from 'zustand';
import { supportService } from '../services/adminService.js';

export const useSupportAdminStore = create((set, get) => ({
  conversations:   [],
  selectedId:      null,
  messages:        [],
  loadingList:     false,
  loadingMessages: false,
  sending:         false,
  statusFilter:    '',
  // Typing state: { userId, firstName, role }[]
  typingUsers:     [],

  setStatusFilter: (v) => set({ statusFilter: v }),

  setSelectedId: (id) => {
    const prev = get().selectedId;
    set({ selectedId: id, messages: [] });
    if (id && id !== prev) get().fetchMessages(id);
  },

  fetchConversations: async (status = '') => {
    set({ loadingList: true });
    try {
      const res = await supportService.getConversations(status ? { status } : {});
      set({ conversations: res.data || [] });
    } catch {
      // silently fail
    } finally {
      set({ loadingList: false });
    }
  },

  fetchMessages: async (id) => {
    set({ loadingMessages: true });
    try {
      const res = await supportService.getMessages(id);
      set({ messages: res.data || [] });
    } catch {
      // silently fail
    } finally {
      set({ loadingMessages: false });
    }
  },

  // Append a single new message — deduplicates by id
  pushMessage: (msg) => {
    set((state) => {
      const id = String(msg.id || msg._id);
      if (state.messages.some((m) => String(m.id || m._id) === id)) return {};
      return { messages: [...state.messages, msg] };
    });
  },

  // Handle real-time conversation activity (status/lastMessageAt update)
  updateConversationActivity: ({ conversationId, status, lastMessageAt }) => {
    set((state) => ({
      conversations: state.conversations.map((c) => {
        if (String(c.id) !== String(conversationId)) return c;
        return {
          ...c,
          ...(status        ? { status }        : {}),
          ...(lastMessageAt ? { lastMessageAt } : {}),
        };
      }),
    }));
  },

  // Prepend a new conversation arriving from socket (admin:newSupportConversation)
  prependConversation: (conversation) => {
    set((state) => {
      if (state.conversations.some((c) => String(c.id) === String(conversation.id))) return {};
      // Only show if current filter matches
      const { statusFilter } = state;
      if (statusFilter && conversation.status !== statusFilter) return {};
      return { conversations: [conversation, ...state.conversations] };
    });
  },

  setTypingUser: ({ userId, firstName, role, isTyping }) => {
    set((state) => {
      const filtered = state.typingUsers.filter((u) => String(u.userId) !== String(userId));
      return { typingUsers: isTyping ? [...filtered, { userId, firstName, role }] : filtered };
    });
  },

  sendMessage: async (message) => {
    const { selectedId } = get();
    if (!selectedId || !message.trim()) return;
    set({ sending: true });
    try {
      const res = await supportService.postMessage(selectedId, message);
      // The socket will broadcast the message back to the conversation room,
      // so pushMessage will be called via the socket listener.
      // But if the socket isn't connected, we push it manually here.
      if (res?.data) get().pushMessage(res.data);
    } finally {
      set({ sending: false });
    }
  },

  assignToMe: async () => {
    const { selectedId } = get();
    if (!selectedId) return;
    await supportService.assignConversation(selectedId);
    await get().fetchConversations(get().statusFilter);
  },

  closeSelected: async () => {
    const { selectedId } = get();
    if (!selectedId) return;
    await supportService.closeConversation(selectedId);
    set({ selectedId: null, messages: [] });
    await get().fetchConversations(get().statusFilter);
  },
}));
