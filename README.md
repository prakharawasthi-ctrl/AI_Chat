# 🤖 ShopEasy AI Live Chat Agent
### Spur Founding Full-Stack Engineer — Take-Home Assignment

A production-ready mini AI customer support agent built with **Node.js + TypeScript** (backend), **React + TypeScript** (frontend), **SQLite** (persistence), and **Google Gemini 1.5 Flash** (LLM — free tier).

---

## 📋 Table of Contents

- [Demo](#-demo)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Data Model](#-data-model)
- [LLM Integration](#-llm-integration)
- [Error Handling](#-error-handling)
- [Assumptions & Trade-offs](#-assumptions--trade-offs)
- [Deployment](#-deployment)
- [What I'd Add With More Time](#-what-id-add-with-more-time)

---

## 🎬 Demo

```
User:  "What's your return policy?"
Agent: "We offer a 7-day hassle-free return policy. Items must be unused
        and in original packaging. Refunds are processed within 5–7 business days."

User:  "Do you ship to the US?"
Agent: "Currently, ShopEasy ships within India only. Standard delivery takes
        3–5 business days. Free shipping on orders above ₹499!"
```

Sessions persist across page reloads — your conversation is still there when you come back.

---

## ✅ Features

### Frontend
- 💬 Clean, responsive live chat widget
- 👤 / 🤖 Distinct user vs. AI message bubbles (right/left aligned)
- ⌨️  "Agent is typing…" animated indicator while waiting for a response
- 🔒 Send button disabled during in-flight requests
- ↩️  Enter to send (Shift+Enter for newline)
- 📜 Auto-scroll to latest message
- 🔁 Conversation history restored on page reload via `localStorage` sessionId
- ❌ Inline error bubbles for API/network failures — no silent failures

### Backend
- `POST /chat/message` — accepts message + optional sessionId, returns AI reply + sessionId
- `GET /chat/history/:sessionId` — fetch full past conversation
- Full conversation persistence (SQLite)
- Last 20 messages sent as context to LLM (configurable)
- Input validation middleware (empty, type, length)
- Global error handler — backend never crashes on bad input
- Graceful LLM error handling with user-friendly messages

### LLM / AI
- Google Gemini 1.5 Flash (free tier — no credit card needed)
- System prompt with fictional store knowledge (ShopEasy)
- Conversation history passed per request for contextual replies
- Max 300 output tokens per response (cost control)
- Error classification: API key errors, quota/rate limit, generic timeout

---

## 🛠 Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Backend runtime | Node.js 20 + TypeScript | Type safety, fast iteration |
| HTTP framework | Express.js | Lightweight, well-known |
| Database | SQLite via `better-sqlite3` | Zero config, sync API, file-based |
| LLM provider | Google Gemini 1.5 Flash | **Free tier**, 15 RPM, 1M TPD |
| Frontend | React 18 + TypeScript + Vite | Fast HMR, familiar ecosystem |
| Styling | Plain CSS (CSS variables) | No dependency overhead |
| Session storage | Browser `localStorage` | Simple, no auth needed |

---

## 📁 Project Structure

```
spur-chat/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema.sql          # Table definitions
│   │   │   └── client.ts           # SQLite connection + schema init
│   │   ├── services/
│   │   │   └── llm.service.ts      # Gemini API wrapper + prompt
│   │   ├── routes/
│   │   │   └── chat.routes.ts      # POST /chat/message, GET /chat/history
│   │   ├── middleware/
│   │   │   └── validate.ts         # Input validation middleware
│   │   └── index.ts                # Express app entry point
│   ├── .env.example
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
│   │   │   ├── MessageBubble.tsx   # Single message (user | ai | error)
│   │   │   └── InputBar.tsx        # Textarea + send button
│   │   ├── App.tsx                 # Root — session state + history load
│   │   └── main.tsx
│   ├── index.html
│   └── package.json
│
└── README.md
```

---

## 🔧 Prerequisites

Make sure you have these installed:

| Tool | Version | Download |
|---|---|---|
| Node.js | 20+ | https://nodejs.org |
| npm | 9+ | Comes with Node |
| Git | any | https://git-scm.com |

**Free account needed:**
- **Google AI Studio** → https://aistudio.google.com — click "Get API key" (no credit card required)

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/your-username/spur-chat.git
cd spur-chat
```

### 2. Set up the backend

```bash
cd backend
cp .env.example .env
```

Open `.env` and fill in your Gemini API key:

```
GEMINI_API_KEY=your_actual_key_here
PORT=3001
```

Install dependencies and start:

```bash
npm install
npm run dev
```

Backend will start at `http://localhost:3001`.
SQLite database file (`chat.db`) is auto-created on first run.

### 3. Set up the frontend

Open a **new terminal tab**:

```bash
cd frontend
npm install
npm run dev
```

Frontend will start at `http://localhost:5173`.

### 4. Open in browser

Visit `http://localhost:5173` and start chatting.

---

## 🔐 Environment Variables

### Backend — `backend/.env`

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ Yes | Your Google Gemini API key from AI Studio |
| `PORT` | ❌ No | Port for Express server (default: `3001`) |

**Never commit your `.env` file.** It is already in `.gitignore`.

`.env.example` (safe to commit):
```
GEMINI_API_KEY=your_key_here
PORT=3001
```

---

## 📡 API Reference

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

---

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

## 🗄 Data Model

### `conversations`

| Column | Type | Description |
|---|---|---|
| `id` | TEXT (PK) | UUID v4 |
| `created_at` | DATETIME | Auto-set on insert |
| `metadata` | TEXT | Reserved for future use (e.g. user agent) |

### `messages`

| Column | Type | Description |
|---|---|---|
| `id` | TEXT (PK) | UUID v4 |
| `conversation_id` | TEXT (FK) | References `conversations.id` |
| `sender` | TEXT | `'user'` or `'ai'` (enforced via CHECK constraint) |
| `text` | TEXT | The message content |
| `timestamp` | DATETIME | Auto-set on insert |

---

## 🧠 LLM Integration

### Provider
**Google Gemini 1.5 Flash** via `@google/generative-ai` SDK.

Free tier limits:
- 15 requests per minute
- 1,000,000 tokens per day
- No credit card required

### Prompt Design

The system prompt is defined in `backend/src/services/llm.service.ts`:

```
You are a helpful support agent for "ShopEasy", a fictional e-commerce store.
Answer clearly and concisely. Only answer support-related questions.

STORE KNOWLEDGE:
- Shipping: Free shipping on orders above ₹499. Standard: 3–5 business days.
- Returns: 7-day hassle-free returns. Refunds in 5–7 business days.
- Support hours: Mon–Sat, 9 AM–6 PM IST.
- Payment: UPI, cards, net banking, COD, EMI on orders above ₹2000.
- Cancellations: Within 2 hours of placing the order.
```

### Context window strategy
- Last **20 messages** (10 pairs) fetched from DB per request
- Passed as `history` to Gemini's `startChat()`
- Keeps costs low while maintaining meaningful conversational context

### Cost controls
| Control | Value | Where |
|---|---|---|
| Max output tokens | 300 | `generationConfig.maxOutputTokens` |
| History window | 20 messages | SQL `LIMIT 20` |
| Input message cap | 1000 chars | `validate.ts` middleware |
| Body size limit | 10 KB | `express.json({ limit: '10kb' })` |

---

## 🛡 Error Handling

### Input validation (backend)

| Scenario | Status | Response |
|---|---|---|
| Missing `message` field | `400` | `"Message is required and must be a string."` |
| Empty string after trim | `400` | `"Message cannot be empty."` |
| Message > 1000 chars | — | Silently truncated, request proceeds |
| Request body > 10 KB | `413` | Express built-in rejection |

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

## 📐 Assumptions & Trade-offs

| Decision | Chosen approach | Reason / Trade-off |
|---|---|---|
| **Database** | SQLite (`better-sqlite3`) | Zero config for local dev. In production, swap for PostgreSQL — schema is compatible. |
| **LLM provider** | Google Gemini 1.5 Flash | Only major LLM with a genuinely free tier (no card needed). OpenAI/Claude require billing. |
| **Auth** | None (sessionId in localStorage) | Scope of assignment. Real app would use JWT or session cookies. |
| **Redis** | Omitted | No caching needed at this scale. Would add for rate limiting or response caching in production. |
| **History window** | Last 20 messages | Balances context quality vs. token cost. Configurable via constant. |
| **Truncation** | 1000 char server-side cap | Prevents prompt injection and runaway costs. Frontend can show a character counter. |
| **Styling** | Plain CSS, no UI library | Faster to control, no bundle bloat. Tailwind or shadcn would be fine for a team project. |
| **Frontend framework** | React + Vite | Assignment allows React; faster to produce clean code here than learning Svelte under deadline. |
| **Store knowledge** | Hardcoded in system prompt | Simplest approach. Could be stored in DB table and injected dynamically for multi-tenant use. |

---

## ☁️ Deployment

### Backend → Railway (free)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
cd backend
railway init
railway up
```

Set environment variable in Railway dashboard:
```
GEMINI_API_KEY = your_key_here
```

### Frontend → Vercel (free)

```bash
npm install -g vercel
cd frontend
vercel
```

Update `frontend/src/api/chat.ts` — replace `localhost:3001` with your Railway backend URL:

```ts
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
```

Add to `frontend/.env`:
```
VITE_API_URL=https://your-app.railway.app
```

---

## 🔮 What I'd Add With More Time

- **PostgreSQL** — swap SQLite for production-grade DB with proper connection pooling
- **Redis** — rate limiting per IP, cache frequent FAQ responses
- **Auth** — lightweight JWT so users own their conversations
- **Multi-tenant** — per-client system prompts + knowledge bases (core to Spur's model)
- **Streaming** — stream Gemini tokens to frontend via SSE for faster perceived response
- **Webhook support** — emit conversation events to external systems (Shopify, Zoho, etc.)
- **Admin panel** — view all conversations, flag problematic exchanges
- **Tests** — Jest unit tests for `llm.service.ts` and route handlers with mocked Gemini

---

## 📄 License

MIT — built for the Spur take-home assignment.
