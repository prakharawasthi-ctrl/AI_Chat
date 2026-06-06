import { MessageList } from './MessageList';
import { InputBar } from './InputBar';
import { Message, ChatSession } from '../App';

interface ChatWidgetProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  messages: Message[];
  isTyping: boolean;
  theme: 'dark' | 'light';
  sidebarOpen: boolean;
  onSend: (message: string) => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onNewChat: () => void;
  onToggleTheme: () => void;
  onSidebarToggle: () => void;
  onClearHistory: () => void;
}

export function ChatWidget({
  sessions,
  activeSessionId,
  messages,
  isTyping,
  theme,
  sidebarOpen,
  onSend,
  onSelectSession,
  onDeleteSession,
  onNewChat,
  onToggleTheme,
  onSidebarToggle,
  onClearHistory,
}: ChatWidgetProps) {
  return (
    <div className="dashboard-container">
      {/* Mobile Sidebar Overlay Backdrop */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} 
        onClick={onSidebarToggle}
      />

      {/* Sidebar Panel */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <span className="sidebar-logo-text">ShopEasy Support</span>
          </div>
          
          <button className="new-chat-btn" onClick={onNewChat}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            New Chat
          </button>
        </div>

        {/* Sessions List */}
        <div className="sessions-list">
          {sessions.length === 0 ? (
            <div style={{ padding: '20px 8px', textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
              No recent chats
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`session-item ${activeSessionId === session.id ? 'active' : ''}`}
                onClick={() => onSelectSession(session.id)}
              >
                <div className="session-info">
                  <span className="session-title">{session.title}</span>
                  <span className="session-time">
                    {new Date(session.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <button
                  className="delete-session-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  title="Delete Conversation"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Sidebar Footer Store Facts */}
        <div className="sidebar-footer">
          <div className="store-info-title">Store Guidelines</div>
          <div className="store-info-item">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-color)' }}>
              <rect x="1" y="3" width="15" height="13"></rect>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
              <circle cx="5.5" cy="18.5" r="2.5"></circle>
              <circle cx="18.5" cy="18.5" r="2.5"></circle>
            </svg>
            <span>Free ship above ₹499</span>
          </div>
          <div className="store-info-item">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-color)' }}>
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
            </svg>
            <span>7-day easy returns</span>
          </div>
          <div className="store-info-item">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-color)' }}>
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>Mon–Sat, 9AM–6PM IST</span>
          </div>
        </div>
      </aside>

      {/* Main Chat Screen Area */}
      <div className="chat-widget">
        <header className="chat-header">
          <div className="chat-header-info">
            <button className="mobile-menu-btn" onClick={onSidebarToggle} aria-label="Toggle Sidebar">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <div className="agent-avatar-container">
              <div className="agent-avatar">
                🤖
              </div>
              <span className="status-dot" />
            </div>
            <div className="agent-meta">
              <h2>ShopEasy AI Assistant</h2>
              <span className="agent-status">Online • Answers instantly</span>
            </div>
          </div>

          <div className="header-actions">
            {/* Theme Toggle Switcher */}
            <button className="theme-toggle-btn" onClick={onToggleTheme} title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              {theme === 'dark' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              )}
            </button>
            
            {/* Clear History Button */}
            <button className="clear-chat-btn" onClick={onClearHistory} title="Clear Chat Details" disabled={messages.length === 0}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </header>

        <MessageList messages={messages} isTyping={isTyping} onSuggestionClick={onSend} />
        <InputBar onSend={onSend} disabled={isTyping} />
      </div>
    </div>
  );
}
