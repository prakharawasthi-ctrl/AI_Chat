import { useState, useEffect, useCallback } from 'react';
import { ChatWidget } from './components/ChatWidget';
import { sendMessage, getHistory, MessageData } from './api/chat';
import './App.css';

export interface Message {
  sender: 'user' | 'ai' | 'error';
  text: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  title: string;
  timestamp: number;
}

const SESSIONS_KEY = 'shopeasy_sessions_list';
const ACTIVE_SESSION_KEY = 'shopeasy_active_session_id';
const THEME_KEY = 'shopeasy_theme';

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Theme state: dark (default) or light
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem(THEME_KEY) as 'dark' | 'light') || 'dark';
  });

  // Apply theme to document element
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // Load session list and active session on mount
  useEffect(() => {
    const savedSessions = localStorage.getItem(SESSIONS_KEY);
    const parsedSessions: ChatSession[] = savedSessions ? JSON.parse(savedSessions) : [];
    setSessions(parsedSessions);

    const savedActiveId = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (savedActiveId && parsedSessions.some(s => s.id === savedActiveId)) {
      setActiveSessionId(savedActiveId);
    }
  }, []);

  // Fetch history when active session changes
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }

    getHistory(activeSessionId)
      .then((data) => {
        const mapped: Message[] = data.messages.map((m) => ({
          sender: m.sender === 'ai' ? 'ai' : 'user',
          text: m.text,
          timestamp: m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }));
        setMessages(mapped);
      })
      .catch((err) => {
        console.error('Failed to load history', err);
        // If session not found, clear it
        handleDeleteSession(activeSessionId);
      });
  }, [activeSessionId]);

  // Save active session key when it changes
  useEffect(() => {
    if (activeSessionId) {
      localStorage.setItem(ACTIVE_SESSION_KEY, activeSessionId);
    } else {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    }
  }, [activeSessionId]);

  // Save sessions list when it changes
  useEffect(() => {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  }, [sessions]);

  const handleSelectSession = useCallback((id: string) => {
    setActiveSessionId(id);
    setSidebarOpen(false);
  }, []);

  const handleStartNewChat = useCallback(() => {
    setActiveSessionId(null);
    setMessages([]);
    setSidebarOpen(false);
  }, []);

  const handleDeleteSession = useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSessionId === id) {
      setActiveSessionId(null);
      setMessages([]);
    }
  }, [activeSessionId]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  const handleSend = useCallback(
    async (text: string) => {
      const nowString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      // Instantly add user message to list
      setMessages((prev) => [...prev, { sender: 'user', text, timestamp: nowString }]);
      setIsTyping(true);

      const targetSessionId = activeSessionId;

      try {
        const data = await sendMessage(text, targetSessionId || undefined);
        const aiNowString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        setMessages((prev) => [...prev, { sender: 'ai', text: data.reply, timestamp: aiNowString }]);

        // If it was a new session, register it in sessions list
        if (!targetSessionId) {
          const newSession: ChatSession = {
            id: data.sessionId,
            title: text.length > 35 ? `${text.slice(0, 35)}...` : text,
            timestamp: Date.now(),
          };
          setSessions((prev) => [newSession, ...prev]);
          setActiveSessionId(data.sessionId);
        } else {
          // Move current session to top of list & update timestamp
          setSessions((prev) => {
            const filtered = prev.filter((s) => s.id !== targetSessionId);
            const target = prev.find((s) => s.id === targetSessionId);
            if (target) {
              return [{ ...target, timestamp: Date.now() }, ...filtered];
            }
            return prev;
          });
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Connection failed. Please verify API server status.';
        setMessages((prev) => [
          ...prev,
          { sender: 'error', text: errorMsg, timestamp: nowString },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [activeSessionId],
  );

  const handleClearHistory = useCallback(() => {
    if (activeSessionId) {
      // Just start a new chat in terms of state, but keep the session sidebar element.
      // Alternatively, delete the active session to fully clear.
      handleDeleteSession(activeSessionId);
    } else {
      setMessages([]);
    }
  }, [activeSessionId, handleDeleteSession]);

  return (
    <div className="app">
      <ChatWidget
        sessions={sessions}
        activeSessionId={activeSessionId}
        messages={messages}
        isTyping={isTyping}
        theme={theme}
        sidebarOpen={sidebarOpen}
        onSend={handleSend}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onNewChat={handleStartNewChat}
        onToggleTheme={toggleTheme}
        onSidebarToggle={() => setSidebarOpen(prev => !prev)}
        onClearHistory={handleClearHistory}
      />
    </div>
  );
}
