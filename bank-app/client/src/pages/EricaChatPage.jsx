import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatStore, getEricaReply } from '../store/chatStore';
import { supportService } from '../services/supportService.js';
import ChatHeader from '../components/chat/ChatHeader';
import ChatBubble from '../components/chat/ChatBubble';
import EricaBubble from '../components/chat/EricaBubble';
import TypingIndicator from '../components/chat/TypingIndicator';
import TipCard from '../components/chat/TipCard';
import ChatInput from '../components/chat/ChatInput';

export default function EricaChatPage() {
  const navigate = useNavigate();
  const {
    ericaMessages,
    ericaTyping,
    initErica,
    pushErica,
    setEricaTyping,
    setConversationId,
  } = useChatStore();

  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => { initErica(); }, [initErica]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ericaMessages, ericaTyping]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;

    pushErica({ kind: 'user', text });
    setInput('');
    setEricaTyping(true);

    const reply = getEricaReply(text);
    const delay = 900 + Math.random() * 600;

    setTimeout(() => {
      setEricaTyping(false);
      if (reply === null) {
        // Transfer to agent — create backend conversation then navigate
        pushErica({ kind: 'erica', text: "Okay, I'll connect you to a specialist." });
        supportService.startConversation({ source: 'erica' })
          .then((res) => { setConversationId(res.data.conversationId); })
          .catch(() => {})
          .finally(() => setTimeout(() => navigate('/live-chat'), 1500));
      } else {
        pushErica({ kind: 'erica', text: reply });
      }
    }, delay);
  }, [input, pushErica, setEricaTyping, navigate, setConversationId]);

  // Compute which Erica messages should show the avatar (first in consecutive group)
  const withAvatar = ericaMessages.map((msg, i) => {
    const prev = ericaMessages[i - 1];
    return {
      ...msg,
      showAvatar: msg.kind === 'erica' && (!prev || prev.kind !== 'erica'),
    };
  });

  return (
    <div
      className="flex flex-col h-screen font-sans"
      style={{ background: 'linear-gradient(180deg, #000B3D 0%, #001B6B 100%)' }}
    >
      <ChatHeader variant="erica" onClose={() => navigate(-1)} />

      {/* Scrollable message area */}
      <div className="flex-1 overflow-y-auto pt-[60px] pb-[80px]">
        <div className="py-5 flex flex-col">
          {withAvatar.map((msg) => {
            if (msg.kind === 'user-action') {
              return <ChatBubble key={msg.id} text={msg.text} isAction />;
            }
            if (msg.kind === 'user') {
              return <ChatBubble key={msg.id} text={msg.text} />;
            }
            if (msg.kind === 'erica') {
              return (
                <EricaBubble key={msg.id} text={msg.text} showAvatar={msg.showAvatar} />
              );
            }
            if (msg.kind === 'tip') {
              return <TipCard key={msg.id} text={msg.text} />;
            }
            return null;
          })}

          {ericaTyping && <TypingIndicator showAvatar />}
          <div ref={bottomRef} />
        </div>
      </div>

      <ChatInput
        value={input}
        onChange={setInput}
        onSend={handleSend}
        placeholder="Type or ask me something"
        showMic
        showSendButton
      />
    </div>
  );
}
