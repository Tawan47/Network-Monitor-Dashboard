# Deploying Network Monitor

## Architecture Overview
This application consist of two parts:
1.  **Frontend (React/Vite)**: Can be deployed on **Vercel**.
2.  **Backend (Node.js/Express)**: Requires a persistent server for **WebSockets** and **Monitoring Loop**. It **CANNOT** run on standard Vercel Serverless Functions.

---

## 1. Frontend Deployment (Vercel)

1.  Push your code to GitHub (you have already done this).
2.  Go to [Vercel Dashboard](https://vercel.com/new).
3.  Import your repository `Network-Monitor-Dashboard`.
4.  Configure the project:
    *   **Root Directory**: Click "Edit" and select `frontend`.
    *   **Framework Preset**: Select `Vite`.
    *   **Environment Variables**:
        *   `VITE_API_URL`: The URL of your deployed backend (see below, e.g., `https://my-backend.onrender.com`).
        *   `VITE_WS_URL`: The WebSocket URL (e.g., `wss://my-backend.onrender.com`).
5.  Click **Deploy**.

> **Note**: For the initial deploy, you can leave the Env Vars empty, but the app won't connect to the backend until you update them.

---

## 2. Backend Deployment (Recommended: Render / Railway)

Since the backend needs to run continuously to monitor networks and maintain WebSocket connections, use a service like **Render** or **Railway**.

### Option A: Render (Free Tier available)
1.  Sign up at [render.com](https://render.com).
2.  Click **New +** -> **Web Service**.
3.  Connect your GitHub repo.
4.  Settings:
    *   **Root Directory**: `backend`
    *   **Runtime**: `Docker` (It will use the `backend/Dockerfile` we created).
    *   **Environment Variables**:
        *   `DATABASE_URL`: Your Neon DB URL.
        *   `SECRET_KEY`: A random strong string for JWT.
5.  Click **Create Web Service**.
6.  Copy the URL (e.g., `https://network-monitor.onrender.com`) and update your **Frontend Vercel Environment Variables**.

### Option B: VPS (DigitalOcean/EC2)
Use the `docker-compose.yml` file provided in the repo to run both on a single server. See `DEPLOY.md`.
