# TANMAY — Full-Stack Brand Voice Generator & Auditor

An AI-powered brand voice engineering workspace built to satisfy and exceed all requirements of the **Handshake "Set Up a Brand Voice Generator"** mission.

---

## 🎯 Handshake Mission Objectives Achieved

| Mission Requirement | Implementation in Application |
|---|---|
| **I. Build the Voice Guide** | 3 authoritative writing samples analyzed, personality & cadence rules extracted, and ready-to-copy **ChatGPT Project Instructions** generated. |
| **II. Draft the Same Message in Two Formats** | **Dual-Format Drafter** generates side-by-side drafts (e.g. Executive Email vs. Casual LinkedIn/Social post) from a single core idea. |
| **III. Check Drafts for Drift & Fix Guide** | **Drift Detector & Consistency Auditor** evaluates text against the guide, flags AI jargon/robotic syntax, and features a **1-click "Fix in Guide"** button that dynamically adds negative constraints to `core_voice.yaml`. |
| **IV. Create a Real Post / Ad** | **Real Post Studio** produces high-performing publications with 1-click refinement chips (*More Natural*, *More Concise*, *Punchier Hook*). |
| **V. Handshake Mission Submission Pack** | **Submission Pack Hub** compiles samples, ChatGPT Project instructions, dual test drafts, drift fixes, and final post into an exportable markdown report. |

---

## 🏗️ Architecture & Technology Stack

- **Backend**: FastAPI (Python 3.14 / 3.11+), Pydantic v2 schemas, PyYAML voice profile engine, and rule-based + LLM linguistic drift auditor.
- **Frontend**: React 19 + TypeScript + Vite, modern dark/glassmorphic responsive UI, custom design tokens, and typed REST client.
- **Voice Storage Boundary**: Modular YAML configuration (`voice_profile/`) and raw transcript vault (`voice_samples/`).
- **Reliability Engine**: Built-in intelligent offline voice synthesis fallback matching Tanmay's authentic cadence when no `OPENAI_API_KEY` is configured, plus full OpenAI GPT-4o-mini integration when enabled.

---

## 🚀 Quick Start

### 1. Backend Setup
```bash
# Optional: create virtualenv
python -m pip install -r backend/requirements.txt

# Start FastAPI server on port 8000
python -m uvicorn app.main:app --app-dir backend --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open **http://localhost:5173** in your browser.

### 3. Run Test Suite
```bash
python -m pytest backend/tests -q
```

---

## 📡 Complete REST API Endpoints

- `GET /health` — Health check & model status.
- `GET /api/voice-profile` — Load core voice rules, mode overrides, and ChatGPT Project instructions.
- `POST /api/voice-profile` — Save updated core voice rules.
- `POST /api/dual-draft` — Generate the same message into two contrasting formats simultaneously.
- `POST /api/generate` — Single-format generation.
- `POST /api/rewrite` — Rewrite draft into authentic voice.
- `POST /api/refine` — Micro-adjust draft (natural, concise, punchy, etc.).
- `POST /api/evaluate` — Linguistic drift analysis & scorecard.
- `POST /api/fix-drift-in-guide` — 1-click patch to add forbidden patterns to the persistent voice guide.
- `GET /api/samples` / `POST /api/samples` — Retrieve and add authoritative writing samples.
- `GET /api/export-project-instructions` — Export finalized ChatGPT Project system prompt.
- `POST /api/submission-pack` — Compile the complete Handshake mission submission report.

---

## 💡 Core Voice Principle
> **"Clarity before sophistication. Naturalness before perfection."**
