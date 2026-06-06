# ShopEasy AI Live Chat Agent

A production-ready mini AI customer support agent built with **Node.js + TypeScript** (backend), **React + TypeScript** (frontend), **PostgreSQL + Redis** (persistence + caching), and **Google Gemini 2.5 Flash** (LLM).

---

## Features

### Frontend
- Clean, responsive live chat widget
- Distinct user vs. AI message bubbles (right/left aligned)
- "Agent is typing…" animated indicator while waiting for a response
- Send button disabled during in-flight requests
- Enter to send (Shift+Enter for newline)
- Auto-scroll to latest message
- Conversation history restored on page reload via localStorage sessionId
- Markdown rendering for AI responses (tables, bold, lists)
- Inline error bubbles for API/network failures

### Backend
- `POST /chat/message` — accepts message + optional sessionId, returns AI reply + sessionId
- `GET /chat/history/:sessionId` — fetch full past conversation
- PostgreSQL persistence (Supabase)
- Redis caching (sessions, history, LLM responses)
- Last 20 messages sent as context to LLM (configurable)
- Input validation middleware (empty, type, length)
- Global error handler — backend never crashes on bad input
- Graceful LLM error handling with user-friendly messages
- Structured logging at every step

### LLM / AI
- Google Gemini 2.5 Flash (free tier available)
- System prompt with fictional store knowledge (ShopEasy)
- Conversation history passed per request for contextual replies
- Max 300 output tokens per response (cost control)
- LLM response cache (reduces duplicate API calls)
- Error classification: API key errors, quota/rate limit, generic timeout

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend runtime | Node.js + TypeScript |
| HTTP framework | Express.js |
| Database | PostgreSQL via Supabase |
| Cache | Redis (Redis Cloud) |
| LLM provider | Google Gemini 2.5 Flash |
| Frontend | React 18 + TypeScript + Vite |
| Markdown rendering | react-markdown |
| Styling | Plain CSS (CSS variables) |

---

## Project Structure

```
assignment/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema.sql          # Table definitions
│   │   │   └── client.ts           # PostgreSQL pool + schema init
│   │   ├── services/
│   │   │   ├── llm.service.ts      # Gemini API wrapper + prompt
│   │   │   └── redis.service.ts    # Redis cache client
│   │   ├── routes/
│   │   │   └── chat.routes.ts      # POST /chat/message, GET /chat/history
│   │   ├── middleware/
│   │   │   └── validate.ts         # Input validation middleware
│   │   └── index.ts                # Express app entry point
│   ├── .env                        # Local credentials (gitignored)
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── chat.ts             # fetch wrappers for backend
│   │   ├── components/
│   │   │   ├── ChatWidget.tsx      # Outer shell (header + layout)
│   │   │   ├── MessageList.tsx     # Scrollable message area
│   │   │   ├── MessageBubble.tsx   # Single message with markdown support
│   │   │   └── InputBar.tsx        # Textarea + send button
│   │   ├── App.tsx                 # Root — session state + history load
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.tsx
│   ├── index.html
│   ├── .gitignore
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
└── README.md
```

---

## Prerequisites

| Tool | Version | Download |
|---|---|---|
| Node.js | 20+ | https://nodejs.org |
| npm | 9+ | Comes with Node |

**Free accounts needed:**
- **Supabase** → https://supabase.com (PostgreSQL database)
- **Google AI Studio** → https://aistudio.google.com (Gemini API key)
- **Redis Cloud** → https://redis.com/try-free/ (optional, for caching)

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/your-username/assignment.git
cd assignment
```

### 2. Set up the backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your credentials:

```
GEMINI_API_KEY=your_gemini_api_key
PORT=3001
DATABASE_URL=postgresql://postgres:password@db.project.supabase.co:5432/postgres
REDIS_URL=redis://default:password@host:port
```

Install dependencies and start:

```bash
npm install
npm run dev
```

Backend starts at `http://localhost:3001`. The database schema (tables + indexes) is auto-created on first run.

### 3. Set up the frontend

Open a **new terminal tab**:

```bash
cd frontend
npm install
npm run dev
```

Frontend starts at `http://localhost:5173`.

### 4. Open in browser

Visit `http://localhost:5173` and start chatting.

---

## Environment Variables

### Backend — `backend/.env`

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Google Gemini API key from AI Studio |
| `DATABASE_URL` | Yes | PostgreSQL connection string (Supabase) |
| `REDIS_URL` | No | Redis connection string (caching is a no-op if absent) |
| `PORT` | No | Express server port (default: `3001`) |

### Frontend — `frontend/.env`

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | No | Backend URL (default: `http://localhost:3001`) |

---

## API Reference

### `POST /chat/message`

Send a user message and get an AI reply.

**Request body:**
```json
{
  "message": "What is your return policy?",
  "sessionId": "optional-existing-session-uuid"
}
```

**Success response `200`:**
```json
{
  "reply": "We offer a 7-day hassle-free return policy...",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Error response `400` (bad input):**
```json
{ "error": "Message cannot be empty." }
```

**Error response `502` (LLM failure):**
```json
{ "error": "Our AI agent is temporarily unavailable. Please try again in a moment." }
```

### `GET /chat/history/:sessionId`

Fetch all past messages for a session (used on page reload).

**Success response `200`:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "messages": [
    { "sender": "user", "text": "Hi!", "timestamp": "2026-06-06T10:00:00Z" },
    { "sender": "ai",   "text": "Hello! How can I help?", "timestamp": "2026-06-06T10:00:01Z" }
  ]
}
```

---

## Data Model

### `conversations`

| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | UUID v4 |
| `created_at` | TIMESTAMPTZ | Auto-set on insert |
| `metadata` | JSONB | Reserved for future use |

### `messages`

| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | UUID v4 |
| `conversation_id` | UUID (FK) | References `conversations.id` on delete cascade |
| `sender` | TEXT | `'user'` or `'ai'` (enforced via CHECK constraint) |
| `text` | TEXT | The message content |
| `timestamp` | TIMESTAMPTZ | Auto-set on insert |

**Indexes:**
- `idx_messages_conversation_id` on `messages(conversation_id)`
- `idx_messages_timestamp` on `messages(timestamp)`

---

## LLM Integration

### Provider
**Google Gemini 2.5 Flash** via `@google/generative-ai` SDK.

Free tier limits:
- 15 requests per minute
- 1,000,000 tokens per day
- No credit card required

### Prompt Design

The system prompt is defined in `backend/src/services/llm.service.ts`:

```
You are a helpful support agent for "ShopEasy", a fictional e-commerce store.
Answer clearly and concisely. Only answer support-related questions.
Format your response with proper markdown — use tables, bold, headings,
and bullet points to make info easy to read.

STORE KNOWLEDGE:
- Shipping: Free shipping on orders above ₹499. Standard: 3–5 business days.
- Returns: 7-day hassle-free returns. Refunds in 5–7 business days.
- Support hours: Mon–Sat, 9 AM–6 PM IST.
- Payment: UPI, cards, net banking, COD, EMI on orders above ₹2000.
- Cancellations: Within 2 hours of placing the order.
```

### Caching Strategy

| Cache | Key Pattern | TTL | Purpose |
|---|---|---|---|
| Session | `session:{id}` | 2h | Avoid DB lookups on repeated requests |
| History | `history:{id}` | 1h | Avoid DB reads on page reload |
| LLM response | `llm:{hash(userMsg+lastAi)}` | 30min | Avoid duplicate Gemini calls |

Redis is **optional** — if unavailable, all cache functions silently fall back to DB queries.

### Cost Controls

| Control | Value | Where |
|---|---|---|
| Max output tokens | 300 | `generationConfig.maxOutputTokens` |
| History window | 20 messages | Array slice in `llm.service.ts` |
| Input message cap | 1000 chars | `validate.ts` middleware |
| Body size limit | 10 KB | `express.json({ limit: '10kb' })` |

---

## Error Handling

### Input validation (backend)

| Scenario | Status | Response |
|---|---|---|
| Missing `message` field | `400` | `"Message is required and must be a string."` |
| Empty string after trim | `400` | `"Message cannot be empty."` |
| Message > 1000 chars | — | Silently truncated, request proceeds |
| Invalid sessionId | `404` | `"Session not found."` |

### LLM errors (backend)

| Scenario | Status | User-facing message |
|---|---|---|
| Invalid API key | `502` | `"Invalid API key configured."` |
| Rate limit / quota exceeded | `502` | `"Rate limit reached. Please try again shortly."` |
| Timeout / network error | `502` | `"Our AI agent is temporarily unavailable..."` |

### Frontend

| Scenario | UI behavior |
|---|---|
| API error | Red error bubble appears in chat — never a blank screen |
| Network failure | Same error bubble with connection message |
| Empty input on submit | Send button is disabled — nothing happens |
| Loading state | Send button disabled + "Agent is typing…" indicator |

---

## Assumptions & Trade-offs

| Decision | Chosen approach | Reason / Trade-off |
|---|---|---|
| **Database** | PostgreSQL (Supabase) | Production-grade, connection pooling, managed backups |
| **LLM provider** | Google Gemini 2.5 Flash | Free tier available, no credit card required |
| **Auth** | None (sessionId in localStorage) | Scope of project. Real app would use JWT or session cookies |
| **Redis caching** | Redis Cloud (free 30MB) | Reduces DB reads and duplicate LLM calls. Graceful fallback if unavailable |
| **History window** | Last 20 messages | Balances context quality vs. token cost |
| **Truncation** | 1000 char server-side cap | Prevents prompt injection and runaway costs |
| **Styling** | Plain CSS, no UI library | No bundle bloat. Tailwind or shadcn fine for team projects |
| **Store knowledge** | Hardcoded in system prompt | Simplest approach. Could be stored in DB for multi-tenant use |

---

## Deployment

### Backend → Render / Railway

1. Push repo to GitHub
2. Create a **Web Service** on Render or Railway
3. Point to `backend/` directory
4. Build: `npm install && npm run build`
5. Start: `node dist/index.js`
6. Set environment variables:
   ```
   GEMINI_API_KEY, DATABASE_URL, REDIS_URL, PORT=10000
   ```

### Frontend → Vercel

1. On Vercel, import the GitHub repo
2. Set root directory to `frontend/`
3. Framework: Vite
4. Environment variable:
   ```
   VITE_API_URL=https://your-backend-url.com
   ```
5. Deploy

---

## What I'd Add With More Time

- **Rate limiting** — per-IP rate limiting via Redis
- **Auth** — lightweight JWT so users own their conversations
- **Multi-tenant** — per-client system prompts + knowledge bases
- **Streaming** — stream Gemini tokens to frontend via SSE for faster perceived response
- **Webhook support** — emit conversation events to external systems (Shopify, Zoho, etc.)
- **Admin panel** — view all conversations, flag problematic exchanges
- **Tests** — Jest unit tests for `llm.service.ts` and route handlers with mocked Gemini
