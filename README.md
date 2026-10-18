# LedgerLoop — Receivables Intelligence Desk (C28)

An enterprise-grade B2B Accounts Receivable (AR) intelligence and operations platform designed for distributors, logistics providers, and supply-chain enterprises. Built with a high-performance **FastAPI** backend and a responsive **React (Vite + TypeScript)** frontend.

---

## 🚀 1-Click Deployment to Netlify

This repository is pre-configured with **`netlify.toml`**, a Netlify Serverless Python function (`netlify/functions/api.py` powered by `mangum`), and SPA routing rules (`_redirects`). Both the frontend and backend can be hosted seamlessly together on Netlify.

### Steps to Deploy on Netlify:
1. Log in to [Netlify](https://app.netlify.com/).
2. Click **"Add new site"** → **"Import an existing project"**.
3. Choose **GitHub** and authorize access to **[`faizsayeed/LedgerLoop`](https://github.com/faizsayeed/LedgerLoop)**.
4. Netlify will automatically detect the settings from `netlify.toml`:
   - **Build command**: `cd frontend && npm install && npm run build`
   - **Publish directory**: `frontend/dist`
   - **Functions directory**: `netlify/functions`
5. Click **"Deploy site"**!

Netlify will build your React application and deploy the serverless Python backend API. All requests to `/api/*` are automatically proxied to the serverless function.

---

## ⚡ Alternative Free Cloud Backend (Render / Railway)

If you prefer a persistent 24/7 Python container (instead of serverless execution limits), you can also run the backend on **Render.com** or **Railway.app** for free:

1. **Deploy Backend on Render**:
   - Create a new **Web Service** on [Render.com](https://render.com/).
   - Connect your `faizsayeed/LedgerLoop` repository.
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
2. **Point Netlify Frontend to Render**:
   - In your Netlify site settings: **Site configuration** → **Environment variables**.
   - Add `VITE_API_URL` with your Render backend URL (e.g. `https://ledgerloop-backend.onrender.com/api`).
   - Trigger a deploy on Netlify.

---

## 💻 Local Development

### 1. Backend Setup (FastAPI)
```bash
# Install dependencies
pip install -r requirements.txt

# Run backend with hot reload
uvicorn backend.app.main:app --reload --port 8000
```
API Documentation will be available at: `http://localhost:8000/docs`

### 2. Frontend Setup (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173/` in your browser.

### 3. Run Automated Tests
```bash
python -m pytest backend/tests
```
14 comprehensive business rule, audit trail, reconciliation, and Netlify serverless tests are included.