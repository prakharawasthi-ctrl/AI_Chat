import { GoogleGenerativeAI } from '@google/generative-ai';

const SYSTEM_PROMPT = `You are a helpful support agent for "ShopEasy", a fictional e-commerce store.
Answer clearly and concisely. Only answer support-related questions.
Format your response with proper markdown — use tables, bold, headings, and bullet points to make info easy to read.

STORE KNOWLEDGE:
- Shipping: Free shipping on orders above ₹499. Standard: 3–5 business days.
- Returns: 7-day hassle-free returns. Refunds in 5–7 business days.
- Support hours: Mon–Sat, 9 AM–6 PM IST.
- Payment: UPI, cards, net banking, COD, EMI on orders above ₹2000.
- Cancellations: Within 2 hours of placing the order.

When asked about store policies, present them in a well-structured table.`;

const MAX_HISTORY_MESSAGES = 20;
const MAX_OUTPUT_TOKENS = 300;

interface Message {
  sender: string;
  text: string;
}

export enum LlmErrorType {
  InvalidKey = 'invalid_key',
  RateLimit = 'rate_limit',
  Timeout = 'timeout',
}

export class LlmError extends Error {
  constructor(
    public readonly type: LlmErrorType,
    message: string,
  ) {
    super(message);
    this.name = 'LlmError';
  }
}

function classifyError(error: unknown): LlmError {
  const msg = String(error);

  if (
    msg.includes('API_KEY_INVALID') ||
    msg.includes('API key not valid') ||
    msg.includes('invalid api key')
  ) {
    return new LlmError(
      LlmErrorType.InvalidKey,
      'Invalid API key configured.',
    );
  }

  if (
    msg.includes('429') ||
    msg.includes('RATE_LIMIT') ||
    msg.includes('quota') ||
    msg.includes('SAFETY') ||
    msg.includes('finish_reason')
  ) {
    return new LlmError(
      LlmErrorType.RateLimit,
      'Rate limit reached. Please try again shortly.',
    );
  }

  return new LlmError(
    LlmErrorType.Timeout,
    'Our AI agent is temporarily unavailable. Please try again in a moment.',
  );
}

const log = (msg: string, data?: unknown) => {
  console.log(`[${new Date().toISOString()}] [LLM] ${msg}`, data ?? '');
};

export async function getLlmResponse(
  apiKey: string,
  userMessage: string,
  history: Message[],
): Promise<string> {
  log('Building Gemini request', { historyLen: history.length, userMessage: userMessage.slice(0, 50) });

  const genAI = new GoogleGenerativeAI(apiKey);

  const contents: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];

  const recentHistory = history.slice(-MAX_HISTORY_MESSAGES);
  log('History trimmed', { original: history.length, trimmed: recentHistory.length });

  for (const msg of recentHistory) {
    contents.push({
      role: msg.sender === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.text }],
    });
  }

  contents.push({
    role: 'user',
    parts: [{ text: userMessage }],
  });

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    },
  });

  log('Calling Gemini generateContent');
  try {
    const result = await model.generateContent({ contents });
    const response = result.response;
    const text = response.text().trim();
    log('Gemini raw response received', { textLength: text.length });

    if (!text) {
      log('Gemini returned empty text');
      throw new Error('Empty response from LLM');
    }

    return text;
  } catch (error: unknown) {
    log('Gemini request failed', { error: String(error).slice(0, 200) });
    throw classifyError(error);
  }
}
