import { Request, Response, NextFunction } from 'express';

const log = (msg: string, data?: unknown) => {
  console.log(`[${new Date().toISOString()}] [VALIDATE] ${msg}`, data ?? '');
};

const MAX_MESSAGE_LENGTH = 1000;

export function validateMessage(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const { message, sessionId } = req.body;
  log('Validating message', { hasSessionId: !!sessionId });

  if (message === undefined || message === null || typeof message !== 'string') {
    log('Validation failed — message type invalid', { type: typeof message });
    res.status(400).json({ error: 'Message is required and must be a string.' });
    return;
  }

  const trimmed = message.trim();

  if (trimmed.length === 0) {
    log('Validation failed — empty message');
    res.status(400).json({ error: 'Message cannot be empty.' });
    return;
  }

  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    log('Message truncated', { originalLength: trimmed.length, maxLength: MAX_MESSAGE_LENGTH });
    req.body.message = trimmed.slice(0, MAX_MESSAGE_LENGTH);
  } else {
    req.body.message = trimmed;
  }

  if (sessionId !== undefined) {
    if (typeof sessionId !== 'string') {
      log('Validation failed — sessionId type invalid');
      res.status(400).json({ error: 'sessionId must be a string if provided.' });
      return;
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionId)) {
      log('Validation failed — sessionId is not a valid UUID', { sessionId });
      res.status(400).json({ error: 'sessionId must be a valid UUID format.' });
      return;
    }
  }

  log('Validation passed');
  next();
}

