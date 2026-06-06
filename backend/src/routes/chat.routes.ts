import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/client';
import { getLlmResponse, LlmError, LlmErrorType } from '../services/llm.service';
import { validateMessage } from '../middleware/validate';
import {
  getCache,
  setCache,
  delCache,
  historyKey,
  sessionKey,
  llmCacheKey,
  HISTORY_TTL,
  LLM_CACHE_TTL,
  SESSION_TTL,
} from '../services/redis.service';

const log = (msg: string, data?: unknown) => {
  console.log(`[${new Date().toISOString()}] [CHAT] ${msg}`, data ?? '');
};

const router = Router();

router.post('/message', validateMessage, async (req: Request, res: Response) => {
  const { message, sessionId } = req.body;
  log('POST /chat/message hit', { message: message?.slice(0, 50), sessionId });

  try {
    const db = getDb();

    let convId: string;

    if (sessionId) {
      log('Looking up existing session', { sessionId });
      const cached = await getCache<{ id: string }>(sessionKey(sessionId));
      const exists = cached
        ? cached
        : (
            await db.query('SELECT id FROM conversations WHERE id = $1', [
              sessionId,
            ])
          ).rows[0];

      if (!exists) {
        log('Session not found', { sessionId });
        res.status(404).json({ error: 'Session not found.' });
        return;
      }

      if (!cached) {
        log('Session cache miss, writing to cache', { sessionId });
        await setCache(sessionKey(sessionId), exists, SESSION_TTL);
      } else {
        log('Session cache hit', { sessionId });
      }
      convId = sessionId;
    } else {
      convId = uuidv4();
      log('Creating new conversation', { convId });
      await db.query('INSERT INTO conversations (id) VALUES ($1)', [convId]);
      await setCache(sessionKey(convId), { id: convId }, SESSION_TTL);
    }

    log('Inserting user message', { convId });
    await db.query(
      'INSERT INTO messages (id, conversation_id, sender, text) VALUES ($1, $2, $3, $4)',
      [uuidv4(), convId, 'user', message],
    );

    log('Invalidating history cache', { convId });
    await delCache(historyKey(convId));

    log('Fetching conversation history from DB', { convId });
    const history = (
      await db.query(
        'SELECT sender, text FROM messages WHERE conversation_id = $1 ORDER BY timestamp ASC',
        [convId],
      )
    ).rows;

    const lastAiMessage = [...history]
      .reverse()
      .find((m) => m.sender === 'ai');

    const cacheKey = llmCacheKey(message, lastAiMessage?.text);
    log('Checking LLM response cache', { cacheKey });
    const cachedReply = await getCache<string>(cacheKey);
    if (cachedReply) {
      log('LLM cache hit — returning cached reply', { convId });
      await db.query(
        'INSERT INTO messages (id, conversation_id, sender, text) VALUES ($1, $2, $3, $4)',
        [uuidv4(), convId, 'ai', cachedReply],
      );
      // Invalidate history cache again because we added AI message
      await delCache(historyKey(convId));
      res.json({ reply: cachedReply, sessionId: convId });
      return;
    }
    log('LLM cache miss — calling Gemini');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      log('GEMINI_API_KEY not configured');
      res.status(500).json({ error: 'LLM API key not configured.' });
      return;
    }

    let reply: string;
    try {
      reply = await getLlmResponse(apiKey, message, history);
      log('Gemini response received', { replyLength: reply.length });
    } catch (err) {
      if (err instanceof LlmError) {
        log('Gemini error', { type: err.type, message: err.message });
        res.status(502).json({ error: err.message });
        return;
      }
      throw err;
    }

    log('Inserting AI response into DB', { convId });
    await db.query(
      'INSERT INTO messages (id, conversation_id, sender, text) VALUES ($1, $2, $3, $4)',
      [uuidv4(), convId, 'ai', reply],
    );
    await setCache(cacheKey, reply, LLM_CACHE_TTL);
    // Invalidate history cache because we added AI message
    await delCache(historyKey(convId));

    log('Message flow complete', { convId });
    res.json({ reply, sessionId: convId });
  } catch (error) {
    log('Unhandled error in POST /chat/message', error);
    res.status(502).json({
      error: 'Our AI agent is temporarily unavailable. Please try again in a moment.',
    });
  }
});

router.get('/history/:sessionId', async (req: Request, res: Response) => {
  const sessionId = req.params.sessionId as string;
  log('GET /chat/history/:sessionId hit', { sessionId });

  try {
    const db = getDb();

    log('Checking history cache', { sessionId });
    const cached = await getCache<{
      sessionId: string;
      messages: { sender: string; text: string; timestamp: string }[];
    }>(historyKey(sessionId));

    if (cached) {
      log('History cache hit — returning cached', { sessionId, msgCount: cached.messages.length });
      res.json(cached);
      return;
    }
    log('History cache miss — querying DB', { sessionId });

    const conversation = (
      await db.query('SELECT id FROM conversations WHERE id = $1', [sessionId])
    ).rows[0];

    if (!conversation) {
      log('Session not found in DB', { sessionId });
      res.status(404).json({ error: 'Session not found.' });
      return;
    }

    log('Fetching messages from DB', { sessionId });
    const messages = (
      await db.query(
        'SELECT sender, text, timestamp FROM messages WHERE conversation_id = $1 ORDER BY timestamp ASC',
        [sessionId],
      )
    ).rows;

    const result = { sessionId, messages };
    log('Writing history to cache', { sessionId, msgCount: messages.length });
    await setCache(historyKey(sessionId), result, HISTORY_TTL);

    res.json(result);
  } catch (error) {
    log('Unhandled error in GET /chat/history/:sessionId', error);
    res.status(500).json({ error: 'Failed to fetch conversation history.' });
  }
});

export default router;
