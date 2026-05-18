'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import AdminTopbar from '../../../components/AdminTopbar.jsx';
import AdminBadge from '../../../components/AdminBadge.jsx';
import { useSupportAdminStore } from '../../../store/supportAdminStore.js';
import { useAdminStore } from '../../../store/adminStore.js';
import { connectAdminSocket } from '../../../services/socket/socket.js';
import {
  joinConversation,
  leaveConversation,
  onNewMessage,
  onTyping,
  onConversationAssigned,
  onConversationActivity,
  sendTyping,
} from '../../../services/socket/supportSocket.js';
import { onNewSupportConversation } from '../../../services/socket/adminSocket.js';

const fmtRelative = (d) => {
  if (!d) return '';
  const mins = Math.floor((Date.now() - new Date(d)) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
};

const STATUS_FILTERS = [
  { value: '',        label: 'All' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'active',  label: 'Active' },
  { value: 'closed',  label: 'Closed' },
];

function ConversationRow({ convo, selected, onClick, hasUnread }) {
  const isNew = convo.status === 'waiting';
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      className={`w-full text-left px-4 py-3.5 border-b border-slate-100 transition-colors ${
        selected ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'hover:bg-slate-50'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${isNew ? 'bg-amber-400' : convo.status === 'active' ? 'bg-green-400' : 'bg-slate-300'}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <p className="text-xs font-semibold text-slate-900 truncate">
              {convo.user ? `${convo.user.firstName} ${convo.user.lastName}` : 'Anonymous'}
            </p>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {hasUnread && <span className="w-2 h-2 rounded-full bg-blue-500" aria-label="Unread messages" />}
              <span className="text-[10px] text-slate-400">{fmtRelative(convo.lastMessageAt)}</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 truncate">{convo.user?.email}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <AdminBadge label={convo.status} variant={convo.status} />
            <AdminBadge label={convo.priority} variant={convo.priority} />
            <span className="text-[10px] text-slate-400">{convo.source}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

function MessageBubble({ msg }) {
  const isUser   = msg.senderType === 'user';
  const isSystem = msg.senderType === 'system';

  if (isSystem) {
    return (
      <div className="flex items-center gap-3 py-2 px-4">
        <div className="flex-1 h-px bg-slate-200" />
        <p className="text-[11px] text-slate-400 flex-shrink-0">{msg.message}</p>
        <div className="flex-1 h-px bg-slate-200" />
      </div>
    );
  }

  return (
    <div className={`flex mb-3 ${isUser ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[80%] sm:max-w-[70%] ${isUser ? 'items-start' : 'items-end'} flex flex-col`}>
        <p className="text-[10px] text-slate-400 mb-1 px-1">
          {isUser ? 'Customer' : `${msg.sender?.firstName || 'Agent'}`} · {fmtRelative(msg.createdAt)}
        </p>
        <div className={`px-3 py-2 rounded-lg text-xs leading-relaxed ${
          isUser
            ? 'bg-white border border-slate-200 text-slate-800'
            : 'bg-blue-600 text-white'
        }`}>
          {msg.message}
        </div>
      </div>
    </div>
  );
}

function TypingDots({ name }) {
  return (
    <div className="flex justify-start mb-3">
      <div className="flex flex-col items-start">
        <p className="text-[10px] text-slate-400 mb-1 px-1">{name} is typing…</p>
        <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SupportPage() {
  const { user } = useAdminStore();
  const {
    conversations, selectedId, messages, loadingList, loadingMessages,
    sending, statusFilter,
    setStatusFilter, setSelectedId, fetchConversations,
    sendMessage, assignToMe, closeSelected,
    pushMessage, updateConversationActivity, prependConversation, setTypingUser,
    typingUsers,
  } = useSupportAdminStore();

  const [input,       setInput]       = useState('');
  const [unreadIds,   setUnreadIds]   = useState(new Set());
  const [mobileView,  setMobileView]  = useState('list'); // 'list' | 'chat'
  const bottomRef                     = useRef(null);
  const prevSelectedRef               = useRef(null);
  const typingTimerRef                = useRef(null);

  // ── Connect socket and wire up event listeners ─────────────────────
  useEffect(() => {
    let cleanups = [];

    connectAdminSocket().then((socket) => {
      if (!socket) return;

      cleanups.push(onNewMessage((msg) => {
        const cid = String(msg.conversation || msg.conversationId || selectedId);
        pushMessage({ ...msg, conversation: cid });
        if (cid !== String(selectedId)) {
          setUnreadIds((prev) => new Set([...prev, cid]));
        }
        updateConversationActivity({ conversationId: cid, lastMessageAt: msg.createdAt });
      }));

      cleanups.push(onTyping(({ userId, firstName, role, isTyping }) => {
        setTypingUser({ userId, firstName, role, isTyping });
      }));

      cleanups.push(onConversationAssigned(({ conversationId, status }) => {
        updateConversationActivity({ conversationId, status });
      }));

      cleanups.push(onConversationActivity(({ conversationId, status, lastMessageAt }) => {
        updateConversationActivity({ conversationId, status, lastMessageAt });
      }));

      cleanups.push(onNewSupportConversation((convo) => {
        prependConversation({ ...convo, id: String(convo.id || convo._id) });
      }));
    });

    return () => cleanups.forEach((fn) => fn());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Join/leave conversation room when selection changes ────────────
  useEffect(() => {
    const prev = prevSelectedRef.current;
    if (prev) leaveConversation(prev);

    if (selectedId) {
      joinConversation(selectedId);
      setUnreadIds((prev) => {
        const next = new Set(prev);
        next.delete(selectedId);
        return next;
      });
    }

    prevSelectedRef.current = selectedId;
  }, [selectedId]);

  // ── Initial data fetch ────────────────────────────────────────────
  useEffect(() => {
    fetchConversations(statusFilter);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // ── Auto-scroll ───────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const handleSelectConversation = (id) => {
    setSelectedId(id);
    setMobileView('chat');
  };

  const handleBackToList = () => {
    setMobileView('list');
  };

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    if (selectedId) sendTyping(selectedId, false);
    await sendMessage(text);
  }, [input, sendMessage, selectedId]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (selectedId) {
      sendTyping(selectedId, e.target.value.length > 0);
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => sendTyping(selectedId, false), 2000);
    }
  };

  const selected = conversations.find((c) => c.id === selectedId);

  const activeTypers = typingUsers.filter(
    (u) => String(u.userId) !== String(user?.id) && u.role === 'user'
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <AdminTopbar
        title="Support Queue"
        subtitle={`${conversations.length} conversations`}
      />

      {/* Status filter bar */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2 flex items-center gap-1.5 flex-shrink-0 flex-wrap">
        {STATUS_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => { setStatusFilter(value); setSelectedId(null); setMobileView('list'); }}
            className={`px-3 py-1.5 text-xs rounded border transition-colors ${
              statusFilter === value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
        <span className="ml-auto text-[11px] text-slate-400 hidden sm:block">
          {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Main area: conversation list + chat */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* Conversation list */}
        <div className={`
          flex-shrink-0 border-r border-slate-200 bg-white overflow-y-auto flex-col
          ${mobileView === 'chat' ? 'hidden lg:flex' : 'flex'}
          w-full lg:w-72
        `}>
          {loadingList ? (
            <div className="p-6 text-center text-xs text-slate-400">Loading…</div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">No conversations</div>
          ) : (
            conversations.map((c) => (
              <ConversationRow
                key={c.id}
                convo={c}
                selected={c.id === selectedId}
                hasUnread={unreadIds.has(c.id)}
                onClick={() => handleSelectConversation(c.id)}
              />
            ))
          )}
        </div>

        {/* Chat panel */}
        <div className={`
          flex-1 min-h-0 flex-col
          ${mobileView === 'list' ? 'hidden lg:flex' : 'flex'}
        `}>
          {!selectedId ? (
            /* Desktop empty state */
            <div className="flex-1 hidden lg:flex items-center justify-center bg-slate-50">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-700">Select a conversation</p>
                <p className="text-xs text-slate-400 mt-1">Choose from the list to begin</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
              {/* Chat header */}
              <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between flex-shrink-0 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {/* Back button — mobile only */}
                  <button
                    onClick={handleBackToList}
                    className="lg:hidden p-1.5 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors flex-shrink-0"
                    aria-label="Back to conversation list"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {selected?.user ? `${selected.user.firstName} ${selected.user.lastName}` : 'Customer'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <AdminBadge label={selected?.status} variant={selected?.status} />
                      <span className="text-[11px] text-slate-400 truncate hidden sm:block">{selected?.user?.email}</span>
                      {activeTypers.length > 0 && (
                        <span className="text-[11px] text-blue-500 animate-pulse">
                          {activeTypers[0].firstName} is typing…
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {selected?.status !== 'closed' && (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={assignToMe}
                      className="text-xs px-2.5 sm:px-3 py-1.5 border border-blue-200 text-blue-700 rounded hover:bg-blue-50 transition-colors font-medium whitespace-nowrap"
                    >
                      <span className="hidden sm:inline">Assign to Me</span>
                      <span className="sm:hidden">Assign</span>
                    </button>
                    <button
                      onClick={closeSelected}
                      className="text-xs px-2.5 sm:px-3 py-1.5 border border-slate-200 text-slate-600 rounded hover:bg-slate-100 transition-colors whitespace-nowrap"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4" role="log" aria-live="polite" aria-label="Conversation messages">
                {loadingMessages ? (
                  <div className="text-center text-xs text-slate-400 py-8">Loading messages…</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-xs text-slate-400 py-8">No messages yet</div>
                ) : (
                  messages.map((m) => (
                    <MessageBubble key={String(m.id || m._id)} msg={m} />
                  ))
                )}
                {activeTypers.map((u) => (
                  <TypingDots key={String(u.userId)} name={u.firstName} />
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              {selected?.status !== 'closed' && (
                <div className="bg-white border-t border-slate-200 px-4 py-3 flex-shrink-0">
                  <div className="flex items-end gap-2">
                    <textarea
                      value={input}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message… (Enter to send)"
                      rows={2}
                      aria-label="Message input"
                      className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-blue-400 bg-white"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || sending}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors flex-shrink-0 min-h-[40px]"
                    >
                      {sending ? '…' : 'Send'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
