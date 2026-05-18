import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../store/chatStore';
import { supportService } from '../services/supportService.js';
import { connectSocket } from '../socket/socket.js';
import {
  joinConversation,
  leaveConversation,
  onNewMessage,
  onTyping,
  sendTyping,
  sendMessage as socketSendMessage,
} from '../socket/supportSocket.js';
import ChatHeader from '../components/chat/ChatHeader';
import ChatBubble from '../components/chat/ChatBubble';
import EricaBubble from '../components/chat/EricaBubble';
import SpecialistBubble from '../components/chat/SpecialistBubble';
import TypingIndicator from '../components/chat/TypingIndicator';
import ChatInput from '../components/chat/ChatInput';

function SystemMessage({ text }) {
  return (
    <div className="flex items-center gap-3 px-6 py-4 msg-appear">
      <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />
      <p className="text-[11px] tracking-wide flex-shrink-0" style={{ color: 'rgba(255,255,255,0.45)' }}>
        {text}
      </p>
      <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />
    </div>
  );
}

function backendMsgToLocal(m) {
  if (m.senderType === 'user')   return { id: String(m.id), kind: 'user',       text: m.message };
  if (m.senderType === 'agent')  return { id: String(m.id), kind: 'specialist', text: m.message };
  if (m.senderType === 'system') return { id: String(m.id), kind: 'system',     text: m.message };
  if (m.senderType === 'erica')  return { id: String(m.id), kind: 'boa',        text: m.message };
  return { id: String(m.id), kind: 'boa', text: m.message };
}

export default function LiveChatPage() {
  const navigate = useNavigate();
  const {
    conversationId,
    liveMessages,
    liveTyping,
    liveUserCount,
    specialistConnected,
    initLive,
    pushLive,
    setLiveMessages,
    connectSpecialist,
    sendSpecialistReply,
  } = useChatStore();

  const [input, setInput]       = useState('');
  const [agentTyping, setAgentTyping] = useState(false);
  const bottomRef               = useRef(null);
  const specialistTimerRef      = useRef(null);
  const typingTimerRef          = useRef(null);
  const seenIdsRef              = useRef(new Set());

  // Track seen message IDs to prevent duplicates
  const addMessage = useCallback((msg) => {
    const id = String(msg.id || msg._id);
    if (seenIdsRef.current.has(id)) return;
    seenIdsRef.current.add(id);
    pushLive(msg);
  }, [pushLive]);

  useEffect(() => {
    if (!conversationId) {
      // No backend conversation — local simulation mode
      initLive();
      specialistTimerRef.current = setTimeout(
        () => connectSpecialist(),
        25000 + Math.random() * 15000,
      );
      return () => clearTimeout(specialistTimerRef.current);
    }

    // Backend-connected mode — load history then switch to socket
    supportService.getConversationMessages(conversationId)
      .then((res) => {
        const msgs = (res.data || []).map(backendMsgToLocal);
        msgs.forEach((m) => seenIdsRef.current.add(m.id));
        if (msgs.length > 0) {
          setLiveMessages(msgs);
        } else {
          initLive();
        }
      })
      .catch(() => initLive());

    // Connect socket and join conversation room
    connectSocket();
    joinConversation(conversationId);

    // Listen for incoming messages
    const offMessage = onNewMessage((msg) => {
      addMessage(backendMsgToLocal(msg));
    });

    // Listen for agent typing indicator
    const offTyping = onTyping(({ role, isTyping }) => {
      if (role === 'agent' || role === 'admin' || role === 'support-agent') {
        setAgentTyping(isTyping);
        // Auto-clear after 4s in case disconnect event is missed
        clearTimeout(typingTimerRef.current);
        if (isTyping) {
          typingTimerRef.current = setTimeout(() => setAgentTyping(false), 4000);
        }
      }
    });

    return () => {
      offMessage();
      offTyping();
      leaveConversation(conversationId);
      clearTimeout(specialistTimerRef.current);
      clearTimeout(typingTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Local-only: connect specialist after 3 messages
  useEffect(() => {
    if (!conversationId && !specialistConnected && liveUserCount >= 3) {
      clearTimeout(specialistTimerRef.current);
      connectSpecialist();
    }
  }, [liveUserCount, specialistConnected, connectSpecialist, conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveMessages, agentTyping]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');

    if (conversationId) {
      // Optimistically add the message locally
      const tempId = `temp-${Date.now()}`;
      seenIdsRef.current.add(tempId);
      pushLive({ id: tempId, kind: 'user', text });

      // Send via socket; fallback to HTTP if socket is unavailable
      try {
        const saved = await socketSendMessage(conversationId, text);
        // Replace temp ID with real server ID
        if (saved?.id) {
          seenIdsRef.current.add(String(saved.id));
        }
      } catch {
        // Socket failed — use HTTP as fallback
        supportService.addMessage(conversationId, text).catch(() => {});
      }

      // Stop typing indicator
      sendTyping(conversationId, false);
    } else if (specialistConnected) {
      pushLive({ kind: 'user', text });
      sendSpecialistReply();
    } else {
      pushLive({ kind: 'user', text });
    }
  }, [input, pushLive, specialistConnected, sendSpecialistReply, conversationId]);

  const handleInputChange = useCallback((val) => {
    setInput(val);
    if (conversationId) {
      sendTyping(conversationId, val.length > 0);
      // Stop typing after 2s of inactivity
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => sendTyping(conversationId, false), 2000);
    }
  }, [conversationId]);

  const messagesWithMeta = liveMessages.map((msg, i) => {
    const prev = liveMessages[i - 1];
    return { ...msg, isFirstInGroup: !prev || prev.kind !== msg.kind };
  });

  const [welcomeMsg, ...restMsgs] = messagesWithMeta;

  return (
    <div
      className="flex flex-col h-screen font-sans"
      style={{ background: 'linear-gradient(180deg, #000B3D 0%, #001B6B 100%)' }}
    >
      <ChatHeader variant="live" onBack={() => navigate(-1)} />

      <div className="flex-1 overflow-y-auto pt-[60px] pb-[76px]">
        <div className="py-5">
          {welcomeMsg && (
            <>
              <p className="px-4 mb-1.5 text-[12px] tracking-wide" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Bank of America
              </p>
              <EricaBubble text={welcomeMsg.text} showAvatar />
              <p className="px-6 mt-2 mb-4 text-[12px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Your chat may be recorded and monitored for quality purposes.
              </p>
            </>
          )}

          {restMsgs.map((msg) => {
            if (msg.kind === 'user')       return <ChatBubble key={msg.id} text={msg.text} />;
            if (msg.kind === 'boa')        return <EricaBubble key={msg.id} text={msg.text} showAvatar={msg.isFirstInGroup} />;
            if (msg.kind === 'specialist') return <SpecialistBubble key={msg.id} text={msg.text} showAvatar={msg.isFirstInGroup} showLabel={msg.isFirstInGroup} />;
            if (msg.kind === 'system')     return <SystemMessage key={msg.id} text={msg.text} />;
            return null;
          })}

          {/* Show agent typing OR local liveTyping indicator */}
          {(agentTyping || liveTyping) && <TypingIndicator showAvatar={false} />}
          <div ref={bottomRef} />
        </div>
      </div>

      <ChatInput
        value={input}
        onChange={handleInputChange}
        onSend={handleSend}
        placeholder="Type something"
        showMic={false}
        showSendButton={false}
      />
    </div>
  );
}
