import { create } from 'zustand';

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// ── Erica response engine ─────────────────────────────────────────

const AGENT_KW = [
  'agent', 'specialist', 'representative', 'human', 'support',
  'help', 'person', 'live', 'someone', 'real',
];

const RESPONSE_MAP = [
  {
    kw: ['zelle', 'send money', 'send cash'],
    resp: "For Zelle, go to Pay & Transfer → Send with Zelle. You can send instantly to any phone number or email. Need help starting a Zelle transfer?",
  },
  {
    kw: ['wire', 'international', 'overseas', 'swift'],
    resp: "Wire transfers are in Pay & Transfer → Wire Transfer. Domestic wires settle same business day before 5 PM ET. Is there a specific wire I can help with?",
  },
  {
    kw: ['card', 'credit card', 'debit card', 'replace', 'replacement', 'lost', 'stolen', 'block', 'freeze'],
    resp: "I can help with your card right away. If it's lost or stolen, I can freeze it and order a replacement immediately. What's the issue with your card?",
  },
  {
    kw: ['login', 'password', 'locked', 'access', 'sign in', 'forgot', 'locked out'],
    resp: "For account access issues, tap 'Forgot ID/Password' on the sign-in screen to reset your credentials securely. Still having trouble after that?",
  },
  {
    kw: ['bill', 'pay bill', 'payee', 'payment', 'schedule payment'],
    resp: "Bill Pay is in Pay & Transfer → Bill Pay. You can add payees, schedule one-time or recurring payments. What specifically do you need help with?",
  },
  {
    kw: ['balance', 'account', 'statement', 'transaction', 'history', 'charge', 'fee'],
    resp: "Your balances and transaction history are on the Accounts tab. If you see an unrecognized charge, I can help you dispute it. What are you looking for?",
  },
  {
    kw: ['transfer', 'move money', 'between accounts'],
    resp: "To transfer between your Bank of America accounts, go to Pay & Transfer → Transfer. Transfers between your accounts are instant and free!",
  },
  {
    kw: ['mortgage', 'home loan', 'refinance', 'home equity'],
    resp: "For mortgage and home loan questions, our specialists can help 24/7. Would you like me to connect you with a home loan specialist right now?",
  },
  {
    kw: ['invest', 'merrill', 'portfolio', 'stock', 'market', 'trade'],
    resp: "For investment questions, our Merrill advisors are available to help. You can also view your portfolio in the Invest section. Want to speak with a Merrill advisor?",
  },
  {
    kw: ['deposit', 'check', 'mobile deposit'],
    resp: "Mobile check deposit is available under Deposit Checks in the main menu. Most deposits are available within minutes. Do you have a check to deposit?",
  },
];

const DEFAULT_RESP =
  "I'm here to help with all your Bank of America needs. Could you tell me a bit more about what you're looking for? I want to make sure I get you the right help.";

export function getEricaReply(text) {
  const lower = text.toLowerCase();
  if (AGENT_KW.some((k) => lower.includes(k))) return null; // null = transfer to agent
  const match = RESPONSE_MAP.find(({ kw }) => kw.some((k) => lower.includes(k)));
  return match ? match.resp : DEFAULT_RESP;
}

const SPECIALIST_REPLIES = [
  "I can see your account details on my end. Let me take a look and help you resolve this quickly.",
  "I completely understand your concern. Let me access your account securely to assist you further.",
  "I've reviewed the information and I'll make sure we get this sorted out for you right away.",
  "Is there anything else I can help you with today? I'm happy to assist with any other questions.",
];

export function getSpecialistReply(count) {
  return SPECIALIST_REPLIES[count % SPECIALIST_REPLIES.length];
}

// ── Store ─────────────────────────────────────────────────────────

export const useChatStore = create((set, get) => ({
  // ── Erica Chat ────────────────────────────────────────────────
  ericaMessages: [],
  ericaTyping: false,
  ericaReady: false,

  initErica: () => {
    if (get().ericaReady) return;
    set({
      ericaReady: true,
      ericaMessages: [
        { id: uid(), kind: 'user-action', text: 'Connect with an agent' },
        { id: uid(), kind: 'erica', text: "I'll connect you to a specialist now." },
        {
          id: uid(),
          kind: 'erica',
          text: "To make sure I get you to the right person, tell me a little more about what you need.",
        },
        {
          id: uid(),
          kind: 'tip',
          text: 'You can say things like, "credit card payment" or "where\'s my replacement card?"',
        },
      ],
    });
  },

  pushErica: (msg) =>
    set((s) => ({ ericaMessages: [...s.ericaMessages, { id: uid(), ...msg }] })),

  setEricaTyping: (v) => set({ ericaTyping: v }),

  resetErica: () => set({ ericaMessages: [], ericaTyping: false, ericaReady: false }),

  // ── Live Chat ─────────────────────────────────────────────────
  conversationId: localStorage.getItem('supportConversationId') || null,
  liveMessages: [],
  liveTyping: false,
  specialistConnected: false,
  connectionStatus: 'idle', // 'idle' | 'connecting' | 'connected'
  liveUserCount: 0,
  specialistReplyCount: 0,
  liveReady: false,

  setConversationId: (id) => {
    if (id) localStorage.setItem('supportConversationId', id);
    else localStorage.removeItem('supportConversationId');
    set({ conversationId: id });
  },

  setLiveMessages: (messages) => set({ liveMessages: messages }),

  initLive: () => {
    if (get().liveReady) return;
    set({
      liveReady: true,
      connectionStatus: 'connecting',
      liveMessages: [
        {
          id: uid(),
          kind: 'boa',
          text: "Hey, while we connect you to a specialist, tell us what you'd like to chat about?",
        },
      ],
    });
  },

  pushLive: (msg) =>
    set((s) => ({
      liveMessages: [...s.liveMessages, { id: uid(), ...msg }],
      liveUserCount: msg.kind === 'user' ? s.liveUserCount + 1 : s.liveUserCount,
    })),

  setLiveTyping: (v) => set({ liveTyping: v }),

  connectSpecialist: () => {
    if (get().specialistConnected) return;
    set({ specialistConnected: true, connectionStatus: 'connected' });
    get().pushLive({ kind: 'system', text: "You're now connected with a specialist." });
    set({ liveTyping: true });
    setTimeout(() => {
      get().setLiveTyping(false);
      get().pushLive({
        kind: 'specialist',
        text: "Hi, my name is Sarah. I'd be happy to help you today. What can I assist you with?",
      });
    }, 2500);
  },

  sendSpecialistReply: () => {
    const { specialistReplyCount } = get();
    get().setLiveTyping(true);
    setTimeout(() => {
      get().setLiveTyping(false);
      get().pushLive({ kind: 'specialist', text: getSpecialistReply(specialistReplyCount) });
      set((s) => ({ specialistReplyCount: s.specialistReplyCount + 1 }));
    }, 1800 + Math.random() * 1200);
  },

  resetLive: () => {
    localStorage.removeItem('supportConversationId');
    set({
      conversationId: null,
      liveMessages: [],
      liveTyping: false,
      specialistConnected: false,
      connectionStatus: 'idle',
      liveUserCount: 0,
      specialistReplyCount: 0,
      liveReady: false,
    });
  },

  // Future WebSocket/admin integration hooks:
  // connectWebSocket: (url) => { ... }
  // setTypingStatus: (chatId, isTyping) => { ... }
  // markMessagesRead: (chatId) => { ... }
}));
