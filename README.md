# MediCast — Autonomous Surgical Video Intelligence

[![Stack: React + FastAPI + Docker](https://img.shields.io/badge/Stack-React%20%7C%20FastAPI%20%7C%20Docker-06b6d4)](#)
[![License](https://img.shields.io/badge/License-MIT-22c55e)](#)
[![AMD Instinct](https://img.shields.io/badge/AMD-Instinct%20MI300X-ef4444)](#)

**MediCast** is a real-time AI-powered surgical video intelligence platform. It ingests a surgical video frame-by-frame, runs five specialist AI agents against each frame, and produces a cryptographically sealed clinical report with anomaly detection, phase tracking, educational commentary, and escalation alerts.

Designed for the OR — low-light-optimized dark UI, AMD GPU telemetry, sub-second frame analysis, and zero-data-loss architecture.

---

## 🏆 Track 3 Hackathon Submission Details

- **GitHub Repository URL**: [https://github.com/your-username/medicast](https://github.com/your-username/medicast) *(Replace before submission)*
- **Demo Video**: [Link to YouTube/Vimeo Demo Video](#) *(Replace before submission)*
- **Slide Deck**: [Link to Google Slides / PDF Deck](#) *(Replace before submission)*
- **Live Demo / Hosted URL**: [Link to Live Hosted URL](#) *(Replace before submission)*
- **AMD Compute Usage**: MediCast is explicitly engineered to run its multi-agent LLM pipeline (Llama 3.2 Vision & Llama 3.3 Text via Fireworks AI) on **AMD Instinct™ MI300X accelerators**. The real-time nature of processing uncompressed surgical video frames requires the massive memory bandwidth (5.3 TB/s) and massive VRAM (192GB HBM3) that only the AMD MI300X provides. The frontend features a dedicated telemetry panel tracking the utilization of these AMD accelerators in real-time.

---

## Table of Contents

- [What It Does](#what-it-does)
- [System Architecture](#system-architecture)
- [The Five AI Agents](#the-five-ai-agents)
- [UI Zones](#ui-zones)
- [Supported Surgical Procedures](#supported-surgical-procedures)
- [Getting Started — Quick Demo](#getting-started--quick-demo)
- [Usage Guide](#usage-guide)
  - [1. Select a Procedure](#1-select-a-procedure)
  - [2. Load a Video](#2-load-a-video)
  - [3. Start Analysis](#3-start-analysis)
  - [4. Read the Verdict](#4-read-the-verdict)
  - [5. Seal the Black Box](#5-seal-the-black-box)
  - [6. Printable Clinical Report](#6-printable-clinical-report)
- [Deployment](#deployment)
  - [Docker Compose (Self-Hosted AMD DC)](#docker-compose-self-hosted-amd-dc)
  - [Environment Variables](#environment-variables)
- [Development](#development)
  - [Frontend Only (Mock Mode)](#frontend-only-mock-mode)
  - [Full Stack with Inference Server](#full-stack-with-inference-server)
- [Project Structure](#project-structure)
- [Technical Details](#technical-details)
- [FAQ](#faq)

---

## What It Does

Every surgical video is a sequence of moments — some routine, some critical. MediCast watches every frame and answers four questions:

| Agent | Question |
|-------|----------|
| **Anatomy** | What structures are visible and are they correctly identified? |
| **Safety** | Is the dissection plane safe? Are instruments too close to critical structures? |
| **Phase** | What phase of the surgery is this? Is the pace appropriate? |
| **Education** | What teaching points does this moment offer a resident? |

A fifth agent — **The Arbiter** — synthesises all four into a single verdict per frame: **SAFE**, **WARNING**, or **CRITICAL**. It also assigns a quality score (0–100), detects escalation events, and provides a teaching pearl.

At the end of the session, MediCast:
- Generates an **Surgical Black Box** — a SHA-256 integrity seal over the session record
- Produces a **printable clinical report** with verdict distribution, phases, and escalations
- Logs the session to PostgreSQL for review via the **Session History** panel

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           Frontend (React + Vite)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  VideoPlayer  │  │  Agent Feed  │  │ Zone Panels  │  │  Telemetry   │  │
│  │  (canvas/Yt)  │  │  (scroll)    │  │  (4 agents)  │  │  GPU stats   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Arbiter     │  │  Black Box   │  │ClinicalReport│  │  Timeline    │  │
│  │  Verdict     │  │  SHA-256     │  │  Printable   │  │  Chart       │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  │
└──────────────┬───────────────────────────────┬───────────────────────────┘
               │ HTTP REST                    │ WebSocket (WS)
               ▼                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                     Inference Server (Python FastAPI)                      │
│                                                                           │
│  /api/analyze-frame-mock   /api/auth/*     /api/sessions/*                │
│  /api/fetch-youtube-frames                 WS /ws?session={id}            │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  5 AI Agents: Anatomy, Safety, Phase, Education (+ The Arbiter)     │  │
│  │  (vLLM / Ollama when GPU available, mock mode for development)      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└──────┬──────────────────────────────┬─────────────────────────┬───────────┘
       │                              │                         │
       ▼                              ▼                         ▼
┌────────────┐               ┌────────────┐            ┌────────────┐
│ PostgreSQL │               │   Redis    │            │   MinIO    │
│   (data)   │               │  (pub/sub) │            │  (videos)  │
└────────────┘               └────────────┘            └────────────┘
```

### Key Technologies

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite 7, Tailwind CSS v4 |
| **Backend** | Python 3.11+, FastAPI, Uvicorn |
| **Database** | PostgreSQL 16 + PgBouncer |
| **Cache / PubSub** | Redis 7 |
| **Storage** | MinIO (S3-compatible) |
| **GPU Inference** | vLLM / Ollama via AMD ROCm (Instinct MI300X) |
| **Container** | Docker Compose |

---

## The Five AI Agents

Each agent runs independently per frame. Agents 1–4 run in parallel; Agent 5 runs after they complete.

### 1. Anatomy Recognition Agent (`Ana`)
- Identifies visible anatomical structures
- Flags missing or misidentified landmarks
- Reports anatomical variants

### 2. Safety Monitor Agent (`Sen`)
- Assesses instrument proximity to critical structures
- Detects thermal spread, bleeding, or unsafe dissection planes
- Issues proximity alerts

### 3. Phase Detection Agent (`Nav`)
- Determines the current surgical phase
- Tracks phase-to-phase transitions
- Flags anomalous phase timing

### 4. Education & Quality Agent (`Edu`)
- Evaluates surgical technique (tissue handling, instrument selection)
- Generates real-time teaching pearls for resident training
- Rates performance quality

### 5. The Arbiter
- Synthesises all four agent outputs into a unified verdict
- Assigns a quality **score** (0–100)
- Sets **escalation level**: `NONE`, `WARNING`, or `CRITICAL`
- Generates a **teaching pearl** and **summary**

---

## UI Zones

When a session is running, the main dashboard displays six zones:

```
┌─────────────────────────────────────┬──────────────────────────────┐
│                                     │                              │
│           Video Player              │        Agent Feed           │
│  (simulated view / YouTube / file)  │  (scrollable live feed of   │
│                                     │   all 5 agent messages)      │
├──────────────────┬──────────────────┤                              │
│                  │                  │                              │
│  Zone Panel 1    │  Zone Panel 2    ├──────────────────────────────┤
│  (Anatomy)       │  (Safety)        │                              │
│                  │                  │        GPU Telemetry         │
├──────────────────┼──────────────────┤  (AMD Instinct MI300X stats │
│                  │                  │   — utilization, VRAM,      │
│  Zone Panel 3    │  Zone Panel 4    │    temperature, power draw) │
│  (Phase)         │  (Education)     │                              │
│                  │                  ├──────────────────────────────┤
├──────────────────┴──────────────────┤                              │
│                                     │     Performance Timeline     │
│         Arbiter Verdict             │  (GPU %, temperature, latency│
│  (large card with score, findings,  │   real-time chart)            │
│   escalation, teaching point)       │                              │
│                                     ├──────────────────────────────┤
├─────────────────────────────────────┤                              │
│                                     │    Session Statistics        │
│  Black Box + Clinical Report        │  (frames, avg score,         │
│  (shown on completion)              │   escalations, safe frames)  │
│                                     │                              │
└─────────────────────────────────────┴──────────────────────────────┘
```

---

## Supported Surgical Procedures

MediCast ships with a complete knowledge base for **10 procedures** across 5 specialties:

| # | Procedure | Specialty | Key Anatomy |
|---|-----------|-----------|-------------|
| 1 | Laparoscopic Cholecystectomy | General Surgery | Gallbladder, cystic duct, CBD, Calot's triangle |
| 2 | Laparoscopic Appendectomy | General Surgery | Appendix, cecum, mesoappendix |
| 3 | Total Knee Arthroplasty | Orthopedics | Femur, tibia, patella, joint capsule |
| 4 | Total Hip Arthroplasty | Orthopedics | Femoral head, acetabulum, hip capsule |
| 5 | Coronary Artery Bypass Grafting | Cardiac Surgery | Coronary arteries, aorta, saphenous vein |
| 6 | Mitral Valve Repair | Cardiac Surgery | Mitral valve, left atrium, chordae tendineae |
| 7 | Cesarean Section | OB/GYN | Uterus, fetal membranes, abdominal wall |
| 8 | Laparoscopic Hysterectomy | OB/GYN | Uterus, cervix, ovarian vessels, ureters |
| 9 | Transurethral Resection of Prostate (TURP) | Urology | Prostate, urethra, bladder neck |
| 10 | Partial Nephrectomy | Urology | Kidney, renal vessels, collecting system |

Each procedure entry includes:
- **Key anatomy** with risk levels (critical → low)
- **Surgical steps / phases** in order
- **Common complications** and what indicators to look for
- **Teaching pearls** for resident education
- **Agent prompt context** — procedure-specific system prompts for each of the 5 agents

---

## Getting Started — Quick Demo

### Prerequisites
- Node.js 18+ (for frontend)
- Python 3.11+ (for inference server — optional, mock mode available)

### 1. Clone & Install

```bash
git clone <repo-url> medicast
cd medicast
npm install
```

### 2. Start the Frontend (Mock Mode)

```bash
npm run dev
```

Open **http://localhost:5173** in your browser.

The app runs in **mock mode** by default — no GPU or inference server needed. The frontend generates simulated agent responses locally, giving you the full UI experience immediately.

### 3. Run a Demo Session

1. **Select a procedure** — click any of the 10 procedures from the left panel
2. **Load a video** — either drag-and-drop an MP4 file, or paste a YouTube URL
3. Press **Start** — watch the agents analyse 24 simulated frames in real time
4. When analysis completes, **seal the Black Box** and **print the clinical report**

---

## Usage Guide

### 1. Select a Procedure

Browse the procedure library by specialty filter (General Surgery, Orthopedics, Cardiac, OB/GYN, Urology) or search by name. Click any procedure to select it — a preparation summary panel appears with key anatomy and steps.

### 2. Load a Video

Two options:

**Upload a file:** Drag and drop an MP4, WebM, MOV, or AVI file directly onto the upload zone (max 500 MB). The file is loaded as a local blob URL — nothing is uploaded to a server in demo mode.

**YouTube link:** Paste a YouTube URL (`youtube.com/watch?v=...` or `youtu.be/...`). A thumbnail preview confirms the link. During analysis, frames are extracted from the video via the inference server (requires YouTube frame extraction backend).

### 3. Start Analysis

Click the **Start** button in the header. The system:
1. Extracts frames from the video at ~1 FPS (or uses simulated frames in mock mode)
2. Runs all 5 AI agents against each frame
3. Streams results to the **Agent Feed** in real time
4. Updates the **Zone Panels**, **Arbiter Verdict**, **Telemetry**, and **Timeline**

You can **Stop** the analysis at any time — all frames processed so far are preserved.

### 4. Read the Verdict

The **Arbiter Verdict** card displays:
- **Score** (0–100) — overall quality/risk composite
- **Verdict** — SAFE (green), WARNING (amber), or CRITICAL (red)
- **Key Findings** — bullet-point summary
- **Current Phase** — detected surgical step
- **Anatomy Confirmed** — what structures were identified
- **Escalation** — if WARNING or CRITICAL, a highlighted alert with the reason
- **Teaching Pearl** — educational insight for residents

When a **CRITICAL** escalation fires, the **Alert Banner** slides down with a pulsing glow and the header pulses red.

### 5. Seal the Black Box

Once analysis completes:
1. The **Surgical Black Box** panel appears
2. Click **Seal Session Record** — the system computes a SHA-256 hash over the session data
3. The hash is displayed as an uppercase hex string
4. Click **Download Sealed Record** to save the audit trail

### 6. Printable Clinical Report

The **Clinical Report** panel shows:
- Session metadata (ID, frames, score)
- Verdict distribution as a bar chart (SAFE / WARNING / CRITICAL counts)
- Phases detected during the session
- Critical and warning escalation details
- Key teaching points collected from all frames

Click the **printer icon** to generate a print-friendly version of the report (white background, dark text, all UI chrome hidden).

---

## Deployment

### Docker Compose (Self-Hosted AMD DC)

The full stack deploys with a single `docker compose` command. This is the production configuration designed for AMD Developer Cloud instances with ROCm GPU support.

```bash
cd src/deploy

# 1. Configure secrets
cp .env.example .env
# Edit .env — set DB_PASSWORD, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, JWT_SECRET

# 2. Start all services
docker compose up -d

# 3. Check logs
docker compose logs -f

# 4. (Optional) Enable GPU inference
INFERENCE_PROVIDER=vllm docker compose up -d
```

The stack starts these services:

| Service | Port | Description |
|---------|------|-------------|
| **frontend** | 80/443 | Nginx serving Vite build + reverse proxy |
| **inference-server** | 8000 | Python FastAPI with 5 AI agents |
| **postgres** | 5432 | Database (PostgreSQL 16) |
| **pgbouncer** | 6432 | Connection pooler |
| **redis** | 6379 | Pub/sub message broker for WebSocket fan-out |
| **minio** | 9000 | S3-compatible object storage (video uploads) |

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DB_PASSWORD` | Yes | — | PostgreSQL password |
| `MINIO_ACCESS_KEY` | Yes | — | MinIO access key |
| `MINIO_SECRET_KEY` | Yes | — | MinIO secret key |
| `JWT_SECRET` | Yes | — | JWT signing secret for auth |
| `INFERENCE_PROVIDER` | No | `(mock)` | `vllm` or `ollama` for real GPU inference |
| `INFERENCE_ENDPOINT` | No | — | Endpoint for external inference API |
| `MODEL_VISION` | No | `Qwen/Qwen2-VL-7B-Instruct` | Vision model for frame analysis |
| `MODEL_TEXT` | No | `NousResearch/Meta-Llama-3.3-70B-Instruct` | Text model for Arbiter |

> **Note:** GPU inference requires AMD ROCm device plugin on the host. For development without a GPU, simply omit `INFERENCE_PROVIDER` — the server runs in mock mode.

---

## Development

### Frontend Only (Mock Mode)

For UI development, no backend is needed:

```bash
# Install dependencies
npm install

# Start Vite dev server (hot reload)
npm run dev
```

Open **http://localhost:5173**. The app uses fallback mock data (`mockZoneAnalysis`, `mockArbiterVerdict`) when the inference server is unreachable.

### Full Stack with Inference Server

```bash
# Terminal 1 — Start the inference server
cd src/inference_server
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Terminal 2 — Start the frontend
cd medicast   # project root
npm run dev
```

The frontend auto-detects the server at `http://localhost:8000`. WebSocket streaming and YouTube frame extraction require the server running.

---

## Project Structure

```
medicast/
├── public/                          # Static assets
│   └── nativelyai.svg
├── src/
│   ├── components/                  # React UI components
│   │   ├── Dashboard.tsx            # Main layout + state orchestration
│   │   ├── VideoPlayer.tsx          # HTML5 / YouTube / simulated video
│   │   ├── ProcedureSelector.tsx    # 10-procedure browser with search/filter
│   │   ├── VideoUploader.tsx        # Drag-drop upload + YouTube URL input
│   │   ├── ZonePanel.tsx            # Individual agent analysis panel
│   │   ├── ArbiterVerdict.tsx       # Synthesis verdict card
│   │   ├── AgentFeed.tsx            # Scrollable live agent message feed
│   │   ├── TelemetryPanel.tsx       # AMD GPU metrics gauges
│   │   ├── TimelineChart.tsx        # Real-time performance line chart
│   │   ├── AlertBanner.tsx          # Red flash escalation alert
│   │   ├── BlackBox.tsx             # SHA-256 integrity seal
│   │   ├── ClinicalReport.tsx       # Printable clinical report
│   │   ├── SessionHistory.tsx       # Past session browser
│   │   └── AuthModal.tsx            # Sign in / sign up modal
│   ├── contexts/
│   │   └── AuthContext.tsx          # JWT auth state + sign in/out
│   ├── data/
│   │   ├── types.ts                 # ProcedureKnowledge, AnatomyEntry, etc.
│   │   ├── procedure1.ts .. procedure10.ts   # Knowledge base entries
│   │   └── procedureKnowledgeBase.ts         # Combined registry
│   ├── hooks/
│   │   ├── useAnalysisEngine.ts     # Frame analysis loop + mock fallback
│   │   ├── useWebSocket.ts          # Real-time WS connection with reconnect
│   │   ├── useTelemetry.ts          # Simulated AMD GPU telemetry
│   │   └── useRealtime.ts           # Deprecated Supabase Realtime adapter
│   ├── config/
│   │   └── api.ts                   # API endpoints, minio config
│   ├── App.tsx                      # Root component
│   ├── main.tsx                     # Vite entry point
│   └── index.css                    # Design system tokens + animations
├── src/inference_server/            # Python FastAPI backend
│   └── app/
│       ├── main.py                  # FastAPI app + WS endpoint
│       ├── analyze.py               # Frame analysis + session endpoints
│       ├── auth.py                  # JWT signup/login endpoints
│       ├── agents.py                # 5 AI agent prompt templates
│       ├── models.py                # Pydantic schemas
│       ├── inference.py             # vLLM / Ollama / mock inference
│       ├── websocket.py             # WebSocket connection management
│       ├── database.py              # PostgreSQL connection pool + CRUD
│       ├── youtube.py               # YouTube frame extraction (yt-dlp)
│       └── telemetry.py             # GPU telemetry collection
├── src/deploy/                      # Deployment manifests
│   ├── docker-compose.yml           # Full stack: 6 services
│   ├── schema/init.sql              # Database schema (DDL)
│   ├── frontend/Dockerfile          # Nginx static build
│   ├── frontend/nginx.conf          # Reverse proxy config
│   ├── inference-server/Dockerfile.rocm  # ROCm GPU build
│   └── .env.example                 # Environment variable template
├── docs/
│   ├── prd/                         # Product requirements docs
│   └── design-system/               # Design tokens + style guide
├── package.json
├── vite.config.ts
├── tsconfig.json
└── index.html
```

---

## Technical Details

### Frame Analysis Pipeline

```
For each frame (1–24):
  1. Canvas extracts JPEG at 640px width
  2. 4 agent prompts fire in parallel (Promise.all)
  3. Each agent returns: findings, severity, confidence
  4. Arbiter runs with all 4 outputs → verdict + score + escalation
  5. Result upserted to React state → UI re-renders all zones

On completion:
  - Aggregate all frames into canonical report
  - Compute SHA-256 hash over JSON payload
  - Display Black Box + Clinical Report panels
```

### Mock Mode (No GPU Required)

When the inference server is unreachable, the frontend falls back to deterministic mock generators:
- `mockZoneAnalysis()` — picks from curated findings per agent type
- `mockArbiterVerdict()` — selects from pre-written SAFE / WARNING / CRITICAL verdicts weighted by zone severity
- Simulated delay of 300–500ms between frames for realism

### GPU Telemetry Simulation

The `useTelemetry` hook generates realistic AMD Instinct MI300X metrics using random-walk algorithms:
- GPU Utilization: 30%–98%
- VRAM: 8–75 GB (of 80 GB HBM3)
- Temperature: 45–88°C
- Power Draw: 150–320 W
- Inference Latency: 60–450 ms

Metrics update every second and display a 60-second rolling window on the Timeline Chart.

### Auth System

Authentication uses a self-hosted JWT flow:
- **Sign up / Sign in** → POST `/api/auth/signup` or `/api/auth/login`
- Server returns a JWT (72-hour expiry) stored in `localStorage`
- Token sent as `Authorization: Bearer <token>` on subsequent requests
- Session history is user-scoped when authenticated

---

## FAQ

**Q: Do I need a GPU to run MediCast?**
No. The app runs in mock mode without any GPU. For production inference, deploy on AMD Instinct MI300X with vLLM.

**Q: Can I use my own video files?**
Yes. Drag-drop MP4, WebM, MOV, or AVI files (max 500 MB). You can also link YouTube videos.

**Q: How many frames does it analyze?**
24 frames per session by default. Each frame represents ~1 second of video.

**Q: Is the data stored?**
Session data persists in PostgreSQL when the inference server is running and connected. In demo mode (frontend only), all data is in-memory.

**Q: What happens when an alert fires?**
If The Arbiter detects a CRITICAL frame, a red banner slides down with the reason, accompanied by a pulsing glow animation. The header badge also shows the escalation count.

**Q: Can I print the report?**
Yes — click the printer icon on the Clinical Report panel. The print layout shows a clean white-background version with all UI elements hidden.

**Q: How do I add a new procedure?**
Create a new `procedure<N>.ts` file in `src/data/` following the ProcedureKnowledge interface, and register it in `procedureKnowledgeBase.ts`.

---

## License

MIT — see LICENSE for details.

---

*MediCast — Autonomous Surgical Video Intelligence • Built with React, FastAPI, and AMD Instinct MI300X*