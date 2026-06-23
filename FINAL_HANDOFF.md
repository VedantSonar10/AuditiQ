# AuditIQ — Final Handoff

## Folder Structure

```
auditiq-next/
├── app/
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx       # Executive Overview + Onboarding
│   │   ├── investigation/page.tsx   # Risk Investigation Center
│   │   ├── employees/page.tsx       # Employee Risk Profiles
│   │   ├── departments/page.tsx     # Department Intelligence
│   │   ├── ai-insights/page.tsx     # AI Audit Narratives
│   │   ├── compliance/page.tsx      # Compliance Reports + PDF Export
│   │   └── settings/page.tsx        # Settings + Reset
│   ├── api/
│   │   ├── analyze/route.ts         # Proxy → FastAPI /analyze/*
│   │   └── pdf/route.ts             # Proxy → FastAPI /report/pdf
│   ├── globals.css                  # Tailwind v4 CSS-first design system
│   ├── layout.tsx                   # Root layout (Sidebar + Header)
│   └── page.tsx                     # Redirects / → /dashboard
├── backend/
│   ├── main.py                      # FastAPI app (all endpoints)
│   ├── requirements.txt
│   ├── risk_engine/                 # Anomaly + duplicate + risk scoring
│   ├── ai/                          # Gemini narrator + rule-based fallback
│   ├── workflows/                   # LangGraph pipeline
│   ├── utils/                       # Data loader
│   ├── reports/                     # PDF generator (FPDF2)
│   └── data/sample_expenses.json   # 120 built-in records
├── components/
│   ├── charts/index.tsx             # All Recharts visualizations
│   ├── dashboard/
│   │   ├── command-center.tsx       # Post-analysis executive view
│   │   └── onboarding.tsx           # Pre-analysis landing
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   └── provider.tsx             # React context (AppState)
│   └── ui/
│       ├── alert.tsx
│       ├── badge.tsx
│       ├── kpi-card.tsx
│       └── progress.tsx
├── lib/
│   ├── nav.ts                       # Route definitions
│   ├── store.ts                     # AppContext type
│   └── utils.ts                     # Formatters, transformers, risk helpers
└── types/index.ts                   # All TypeScript types
```

## Environment Variables

```env
# .env.local (Next.js)
BACKEND_URL=http://localhost:8000    # FastAPI base URL (default)
```

No other env vars required. Gemini API key is entered by the user in the UI.

## Run Instructions

### 1. Start the FastAPI backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Verify: `curl http://localhost:8000/health` → `{"status":"ok"}`

### 2. Start the Next.js frontend

```bash
# In project root
npm install
npm run dev       # development (localhost:3000)
npm run build && npm start   # production
```

### 3. Use the app

1. Open http://localhost:3000
2. Click **Load Sample Data** → analysis runs automatically
3. Or upload your own SAP Concur JSON export
4. Optionally paste a Gemini API key for AI narratives

## Build Status

- `npm run build` ✅ passes (13 routes, 0 errors)
- `npx tsc --noEmit` ✅ 0 TypeScript errors
- FastAPI imports ✅ all engine modules load cleanly

## Remaining Optional Enhancements

- **Auth**: Add NextAuth.js for SSO/SAML login (enterprise requirement)
- **Live Concur API**: Implement OAuth2 + SAP Concur REST API connector in FastAPI
- **Persistent storage**: Replace in-memory state with PostgreSQL + Prisma
- **Export to Excel**: Add `xlsx` library for CSV/Excel ledger downloads
- **Real-time updates**: WebSocket endpoint in FastAPI for streaming pipeline progress
- **Multi-tenant**: Add org/workspace scoping to the data model
- **Deployment**: Dockerfile + docker-compose provided structure; deploy backend to Cloud Run, frontend to Vercel
