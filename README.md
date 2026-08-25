# AIVOA Pharma QMS - Customer Complaint Management System

An AI-powered QMS Customer Complaint Intake and Triage System built for the Pharmaceutical Industry. Features automated complaint extraction, severity & risk assessment, CAPA recommendations, duplicate detection, and analytics.

---

## 🚀 Deployment Options

This project supports **two deployment methods**:

---

### Option 1: Unified Single-Service Deployment (Recommended)
Deploy both the React Frontend and FastAPI Backend together as a **single web service**. This eliminates CORS issues and simplifies hosting.

#### A. Deploying on Render (using Render Blueprint)
1. Fork or push this repository to GitHub.
2. Log in to [Render.com](https://render.com).
3. Click **New +** -> **Blueprint**.
4. Connect your GitHub repository.
5. Set `GROQ_API_KEY` under Environment Variables.
6. Click **Apply**. Render will automatically build the React frontend and run the Python backend.

#### B. Deploying via Docker
Build and run the production Docker image locally or on Cloud providers (AWS ECS, GCP Cloud Run, Fly.io, Koyeb):

```bash
# Build the multi-stage Docker image
docker build -t aivoa-qms-app .

# Run the container
docker run -p 8000:8000 -e GROQ_API_KEY="your_groq_api_key" aivoa-qms-app
```

#### C. Manual Production Build & Run
```bash
# 1. Build the frontend static assets
npm run build

# 2. Run the FastAPI server (which automatically serves frontend/dist)
python backend/main.py
```

---

### Option 2: Separate Deployment (Frontend & Backend Separately)
If you prefer hosting the **Frontend** on Vercel/Netlify and the **Backend** on Render/Railway:

#### Step 1: Deploy Backend (Render / Railway / Heroku)
- **Build Command:** `pip install -r backend/requirements.txt`
- **Start Command:** `gunicorn backend.main:app -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`
- **Environment Variables:**
  - `GROQ_API_KEY`: Your Groq API key.
  - `ALLOWED_ORIGINS`: `https://your-frontend-domain.vercel.app` (or `*`).

#### Step 2: Deploy Frontend (Vercel / Netlify)
- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Environment Variables:**
  - `VITE_API_BASE_URL`: `https://your-backend-service.onrender.com`

---

## 💻 Local Development Setup

### 1. Clone Repository & Install Dependencies
```bash
# Backend dependencies
pip install -r backend/requirements.txt

# Frontend dependencies
cd frontend
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
GROQ_API_KEY=your_groq_api_key_here
```

### 3. Run Locally
**Terminal 1 (Backend):**
```bash
python backend/main.py
```
*(Runs on http://localhost:8000)*

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```
*(Runs on http://localhost:3000)*

---

## 🛠 Tech Stack
- **Frontend:** React 18, Vite, Redux Toolkit, Lucide React, Recharts
- **Backend:** Python 3.11, FastAPI, SQLAlchemy, SQLite/PostgreSQL
- **AI Agent Framework:** LangGraph, LangChain, Groq LLM (llama-3.3-70b-versatile) / Gemini API
- **Document Extractors:** PyPDF, python-docx, email (EML parsing)
