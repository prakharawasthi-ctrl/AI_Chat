import { useState, useCallback } from 'react';
import Markdown from 'react-markdown';

interface MessageBubbleProps {
  sender: 'user' | 'ai' | 'error';
  text: string;
  timestamp: string;
}

export function MessageBubble({ sender, text, timestamp }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  const isUser = sender === 'user';
  const isError = sender === 'error';

  return (
    <div className={`message-wrapper ${isUser ? 'user' : ''}`}>
      {/* Avatars */}
      {!isError && (
        <div className="bubble-avatar">
          {isUser ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-color)' }}>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          ) : (
            '🤖'
          )}
        </div>
      )}

      {/* Bubble + Actions Container */}
      <div className="bubble-container">
        <div 
          className={`bubble ${
            isUser ? 'user' : isError ? 'error' : 'ai'
          }`}
        >
          {isUser || isError ? (
            text
          ) : (
            <Markdown>{text}</Markdown>
          )}
        </div>

        {/* Timestamp & Copy to Clipboard Actions */}
        <div className="bubble-actions">
          <span className="bubble-timestamp">{timestamp}</span>
          {!isUser && !isError && (
            <button className="bubble-action-btn" onClick={handleCopy}>
              {copied ? (
                <>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#10b981' }}>
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  Copy
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
