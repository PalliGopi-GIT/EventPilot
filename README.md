# EventPilot — Autonomous Agentic Event Automation Platform

> A real 36-hour Hackathon Build: The smallest, most complete agentic AI system that understands, plans, asks permission, acts, observes, and reports — on real event data with real Google Forms.

## Project Overview

**EventPilot** is a production-ready agentic AI platform that transforms uploaded event posters, PDFs, or raw announcements into real deployed Google Forms, collects real participant responses, and delivers AI-synthesized event intelligence dashboards — all with mandatory human-in-the-loop approval at every external action.

### Agentic Workflow

```
REAL SOURCE (poster/PDF/text)
     ↓
PERCEIVE: Agent 1 ingests & classifies the source
     ↓
UNDERSTAND: GLM-4 extracts structured event data + confidence
     ↓
SAFETY CHECKPOINT: Human event review & correction
     ↓
PLAN: GLM-4 synthesizes form schema (Registration/Feedback)
     ↓
NL EDIT: Conversational refinement ("add phone number", etc.)
     ↓
PLAN: Agent 2 creates deterministic Action Plan
     ↓
APPROVE: Human-in-the-Loop authorization gate
     ↓
EXECUTE: Deterministic Google Forms API deployment
     ↓
OBSERVE: Fetch real participant submissions
     ↓
REPORT: GLM-4 response intelligence dashboard
     ↓
REAL INSIGHTS (verified from actual participant data)
```

## Architecture

```
Next.js 15 (App Router)
│
├── app/                 # Pages & API Routes
│   ├── api/auth/        # Google OAuth 2.0 flow
│   ├── api/sources/     # Source ingestion & Agent 1
│   ├── api/events/      # Human review & event management
│   ├── api/forms/       # Form generation, NL edit & approval
│   ├── api/google/      # Real Google Forms create & responses
│   └── api/insights/    # GLM response analysis
│
├── lib/
│   ├── ai/              # TokenRouter → GLM client + all AI functions
│   ├── agents/          # Source Analyzer Agent + Action Planner
│   ├── google/          # OAuth + Google Forms API + responses sync
│   ├── security/        # AES-256-GCM encryption, rate limiting, sanitize
│   ├── validation/      # Zod-validated API schemas
│   ├── auth/            # Session state management + audit logging
│   └── db/              # Prisma singleton client
│
├── components/          # React UI components
│   ├── agent/           # AgentTrace loop UI + status bar
│   ├── source/          # SourceUploader + SourceAnalysis
│   ├── event/           # EventReview human checkpoint
│   ├── form/            # FormBuilder + NaturalLanguageEditor + FormQuestion
│   ├── approval/        # ApprovalPanel with Idempotency + OAuth gate
│   ├── insights/        # ResponseStats + Themes + Recommendations
│   └── layout/          # Navbar
│
└── prisma/
    └── schema.prisma    # Full PostgreSQL schema (User, Form, Response, ...)
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript 5, Tailwind CSS 4 |
| Backend | Next.js Route Handlers |
| Database | PostgreSQL + Prisma ORM |
| Hosting (DB) | Supabase PostgreSQL |
| AI | TokenRouter → GLM-4-Plus |
| Google Integration | Google OAuth 2.0, Google Forms API v1 |
| Security | AES-256-GCM token encryption, Zod validation, rate limiting |
| Deployment | Vercel |

## Local Development Setup

### Requirements

- Node.js 18+
- PostgreSQL-compatible database (Supabase recommended)
- Google Cloud project with Forms API enabled
- TokenRouter API key

### 1. Clone and Install

```bash
git clone https://github.com/<your-username>/eventpilot
cd eventpilot
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Fill in the following in `.env`:

| Variable | Description |
|---|---|
| `AI_API_KEY` | Your TokenRouter API key |
| `AI_MODEL` | e.g. `glm-4-plus` |
| `DATABASE_URL` | PostgreSQL URL from Supabase |
| `NEXTAUTH_SECRET` | Random 32-char secret for sessions (`openssl rand -base64 32`) |
| `ENCRYPTION_KEY` | Random key for AES-256-GCM OAuth token encryption |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `GOOGLE_REDIRECT_URI` | `http://localhost:3000/api/auth/google/callback` |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` (or production domain) |

### 3. Database Migration

```bash
# Generate Prisma client
npm run prisma:generate

# Push schema to database (development)
npm run prisma:push

# For production migrations
npm run prisma:migrate
```

### 4. Run Development Server

```bash
npm run dev
```

Navigate to `http://localhost:3000` to use the Agent Workspace.

---

## Google Cloud Setup

### Step-by-Step

1. **Go to Google Cloud Console**: https://console.cloud.google.com
2. **Create New Project** (or use existing)
3. **Enable APIs**:
   - Google Forms API
   - Google Sheets API (optional)
   - People API / OAuth2 API
4. **OAuth Consent Screen**:
   - User Type: **External**
   - Status: **Testing** (for hackathon)
   - Add demo Google accounts to **Test Users**
     > ⚠️ Without Test Users, participants see "Google hasn't verified this app" warning
5. **Create OAuth 2.0 Client ID**:
   - Application Type: Web Application
   - Authorized Redirect URIs: `http://localhost:3000/api/auth/google/callback` (development)
   - Also add production URI: `https://your-eventpilot.vercel.app/api/auth/google/callback`

### Required Scopes

```
https://www.googleapis.com/auth/forms.body
https://www.googleapis.com/auth/forms.responses.readonly
https://www.googleapis.com/auth/userinfo.email
https://www.googleapis.com/auth/userinfo.profile
```

---

## AI Setup (TokenRouter → GLM)

1. Register at TokenRouter
2. Get your API key
3. Set `AI_API_KEY` in `.env`
4. Set `AI_MODEL=glm-4-plus` (or appropriate model name)
5. Set `AI_BASE_URL` if using a custom endpoint (otherwise defaults to `https://api.tokenrouter.io/v1`)

### Why GLM?
GLM-4-Plus by Zhipu AI supports:
- Multimodal input (text + image) — essential for poster analysis
- Structured JSON output
- Strong Chinese/English bilingual comprehension

---

## Security Architecture

### Token Encryption (AES-256-GCM)

OAuth access tokens and refresh tokens are **never stored in plaintext**.

```
OAuth Token Received
       ↓
crypto.createCipheriv('aes-256-gcm', derivedKey, randomIV)
       ↓
Ciphertext + IV + Authentication Tag stored in DB
No plaintext ever written

On retrieval:
DB load encrypted + IV + tag
       ↓
crypto.createDecipheriv + setAuthTag()
       ↓
Authentication verified → Plaintext token
```

### Idempotency Protection

Prevents double-creation from:
- Double-click events
- Browser retries
- Network timeouts

Each form creation request carries a client-generated `requestId`. The backend checks an `IdempotencyRecord` table with a `UNIQUE(key)` constraint before executing the Google API call.

### Security Policies

- No LLM shell access
- No LLM filesystem access
- No LLM direct database access
- User owns their own Google connection
- Audit logs strip all secrets before writing
- Rate limiting on all AI endpoints (20 req/min)
- File validation (type + size, no execution)

---

## Database Setup (Supabase)

1. Create Supabase account: https://supabase.com
2. Create new project
3. Copy `DATABASE_URL` from **Settings → Database → Connection string → URI**
4. Run: `npm run prisma:push` to create all tables

---

## Testing

```bash
# Run unit tests
node tests/security/encryption.test.js
node tests/ai/jsonParsing.test.js
node tests/security/rateLimit.test.js
```

---

## Deployment to Vercel

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy (link to your GitHub repo for CI)
vercel

# 3. Configure Environment Variables in Vercel Dashboard
# Add all variables from .env.example

# 4. Update Google OAuth Redirect URI to include production domain:
# https://your-eventpilot.vercel.app/api/auth/google/callback

# 5. Run Prisma migrations against production
npx prisma migrate deploy
```

---

## Hackathon Demo Flow

### Real End-to-End Demo

1. **Upload AI Agents Workshop Poster** → PNG or event announcement text
2. **Agent 1 Analyzes**: Classifies source, extracts entities, computes real confidence
3. **Human Reviews & Corrects**: Safety checkpoint before any AI action
4. **Select Form Type**: "Feedback Form"
5. **GLM Generates Form**: Real question schema with rating scales, text fields
6. **NL Edit**: Type "Add a question about next workshop topics"
7. **GLM Applies Change**: Preserves existing questions, adds new one
8. **Review Action Plan**: Agent 2 creates deterministic PLAN (no external calls yet)
9. **Connect Google Account**: OAuth 2.0 login to organizer@demo.com
10. **Approve & Deploy**: First and only time Google Forms API is called
11. **Real Form URL**: `https://docs.google.com/forms/d/e/.../viewform`
12. **10-20 Participants Submit**: Real Google Form responses
13. **Sync Responses**: Google Forms Responses API called → synced to PostgreSQL
14. **Run GLM Analysis**: Synthesizes real themes, rating, sentiment, recommendations
15. **Dashboard Shows**: 100% real data, zero fabricated analytics

---

## Known Limitations (v1)

| Limitation | Notes |
|---|---|
| Google OAuth in Testing | Requires manual pre-registration of demo accounts as Test Users |
| No background polling | Response sync is manual (click "Sync Live Responses") |
| File extraction | PPT/PPTX extraction uses placeholder (PDF and image/text work) |
| Rate limits | Subject to TokenRouter and Google APIs rate limits |
| No auth middleware | Session is cookie-based without JWT |

---

## Project Structure

```
eventpilot/
├── app/
│   ├── api/{auth,sources,events,forms,google,insights,dashboard}/
│   ├── {dashboard,approval}/page.tsx
│   ├── layout.tsx
│   └── page.tsx  (Main Agent Workspace)
├── components/{agent,source,event,form,approval,insights,layout}/
├── lib/{ai,agents,google,security,validation,auth,db,utils}/
├── prisma/schema.prisma
├── tests/{security,ai}/
├── .env.example
├── .gitignore
├── README.md
├── vercel.json
├── package.json
└── tsconfig.json
```

---

*Built with ❤️ as a 36-hour hackathon project. Powered by GLM-4 + Google Forms API + Supabase PostgreSQL + Vercel.*
"# EventPilot" 
