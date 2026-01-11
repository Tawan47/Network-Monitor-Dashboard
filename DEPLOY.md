# Deployment Guide

This project is containerized using Docker and Docker Compose.

## Prerequisites

- Docker
- Docker Compose

## Quick Start (Local)

1. Ensure `backend/.env` is configured correctly.
2. Run the following command:

```bash
docker-compose up --build -d
```

3. Access the application:
   - Frontend: [http://localhost](http://localhost)
   - Backend API: [http://localhost:3000](http://localhost:3000)

## Production Deployment

When deploying to a remote server (e.g., EC2, DigitalOcean Droplet):

1. **Update `docker-compose.yml`**:
   Change the `VITE_API_URL` and `VITE_WS_URL` build arguments to your server's public IP or Domain.

   ```yaml
   args:
     VITE_API_URL: "http://your-server-ip:3000"
     VITE_WS_URL: "ws://your-server-ip:3000"
   ```

2. **Security**:
   - Ensure the backend ports are firewalled if using a reverse proxy.
   - Use HTTPS in production (requires setting up SSL, e.g., with Certbot and adjusting Nginx config).

## Project Structure

- **backend/**: Node.js Express API
- **frontend/**: React Vite App (Served via Nginx)
- **docker-compose.yml**: Orchestration
