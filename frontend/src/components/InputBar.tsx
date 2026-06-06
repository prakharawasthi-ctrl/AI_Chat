import { useState, useRef, KeyboardEvent } from 'react';

interface InputBarProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

const MAX_LIMIT = 1000;

export function InputBar({ onSend, disabled }: InputBarProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const currentLength = text.length;
  const isCloseToLimit = currentLength > MAX_LIMIT - 100;

  return (
    <div className="input-bar-container">
      <div className="input-bar">
        <textarea
          ref={textareaRef}
          className="input-textarea"
          placeholder="Type your message..."
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_LIMIT))}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          rows={1}
          disabled={disabled}
        />
        
        <div className="input-actions">
          {currentLength > 0 && (
            <span className={`char-counter ${isCloseToLimit ? 'warning' : ''}`}>
              {currentLength}/{MAX_LIMIT}
            </span>
          )}
          
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={disabled || !text.trim()}
            title="Send Message"
          >
            {disabled ? (
              <div className="spinner" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
