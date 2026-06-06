const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface MessageData {
  sender: 'user' | 'ai';
  text: string;
  timestamp?: string;
}

export interface SendMessageResponse {
  reply: string;
  sessionId: string;
}

export interface HistoryResponse {
  sessionId: string;
  messages: MessageData[];
}

export async function sendMessage(
  message: string,
  sessionId?: string,
): Promise<SendMessageResponse> {
  const res = await fetch(`${BASE}/chat/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sessionId }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to send message.');
  }

  return data;
}

export async function getHistory(
  sessionId: string,
): Promise<HistoryResponse> {
  const res = await fetch(`${BASE}/chat/history/${encodeURIComponent(sessionId)}`);

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch history.');
  }

  return data;
}
