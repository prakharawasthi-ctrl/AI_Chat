import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { Message } from '../App';

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
  onSuggestionClick: (message: string) => void;
}

const FAQ_SUGGESTIONS = [
  '📦 What is your shipping policy?',
  '🔄 What is the return/refund policy?',
  '🕒 What are your support hours?',
  '💳 What payment options do you support?',
];

export function MessageList({ messages, isTyping, onSuggestionClick }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="message-list">
      {messages.length === 0 ? (
        <div className="welcome-screen">
          <div className="welcome-icon">💬</div>
          <h1 className="welcome-title">Welcome to ShopEasy!</h1>
          <p className="welcome-desc">
            Ask me anything about our shipping, 7-day hassle-free return policy, payment options, or support hours.
          </p>
          <div className="suggestions-container">
            {FAQ_SUGGESTIONS.map((faq) => (
              <button
                key={faq}
                className="suggestion-chip"
                onClick={() => onSuggestionClick(faq.replace(/^[^\s]+\s/, ''))} // strip emoji prefix
              >
                {faq}
              </button>
            ))}
          </div>
        </div>
      ) : (
        messages.map((msg, i) => (
          <MessageBubble key={i} sender={msg.sender} text={msg.text} timestamp={msg.timestamp} />
        ))
      )}
      
      {isTyping && (
        <div className="message-wrapper">
          <div className="bubble-avatar">🤖</div>
          <div className="bubble-container">
            <div className="bubble typing">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
