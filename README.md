<div align="center">

<img src="https://img.shields.io/badge/PlacementPro-1.0.0-1a56db?style=for-the-badge&logo=shield&logoColor=white" alt="PlacementPro" />

# PlacementPro

**A full-stack college placement test platform built for scale.**  
Aptitude tests, live coding challenges, Google OAuth, real-time timers, and auto-grading — engineered to handle 1000+ simultaneous students.

<br/>

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Scaling for 1000+ Students](#scaling-for-1000-students)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

PlacementPro is an open-source placement test platform designed for engineering colleges running campus recruitment drives. It replaces paper-based tests and fragmented tools (HackerRank, Google Forms, manual spreadsheets) with a single, self-hosted system that your placement cell fully controls.

The platform supports two user roles — **Admin** (placement coordinators) and **Student** — with completely separate interfaces. Admins create and publish tests; students take them under timed, proctored conditions.

---

## Features

### Admin Panel
- **Test builder** — 3-step wizard (Config → Questions → Publish) with multi-section support
- **Aptitude questions** — MCQ, Multi-select (MSQ), True/False, Fill-in-the-blank, Numerical
- **Coding problems** — full structured editor with description, input/output format, constraints, sample I/O, visible + hidden test cases, per-language starter code, time/memory limits
- **Image support** — attach diagrams or figures to any question or individual answer option (Cloudinary CDN)
- **Test scheduling** — set start/end times, duration, and restrict by branch
- **Test settings** — shuffle questions/options, negative marking, custom passing score
- **Results & analytics** — score distribution chart, leaderboard, one-click CSV export
- **User management** — bulk import students via CSV, activate/deactivate accounts
- **Admin accounts** — create and manage multiple admin accounts

### Student Interface
- **Google OAuth** + email/password login
- Full-screen exam UI with dark-mode code editor (Monaco — same engine as VS Code)
- Real-time countdown timer with WebSocket heartbeat and auto-submit on expiry
- Question palette — visual grid showing answered, unanswered, and flagged questions
- **Live code execution** — Run button with custom stdin, shows stdout/stderr instantly
- Multi-language support — Python, JavaScript, Java, C++
- Auto-save every 30 seconds
- Results page with per-test-case breakdown for coding problems

### Engineering
- JWT authentication with Redis-cached sessions
- WebSocket server for real-time active user tracking
- PostgreSQL connection pooling (handles 1000 concurrent users)
- Rate limiting on auth (20 req/15 min) and code execution (10 req/min)
- Gzip compression, security headers (Helmet.js), CORS
- Docker Compose for one-command local setup

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 18, Vite, Tailwind CSS | SPA with fast HMR dev experience |
| State | Zustand + React Query | Global auth state + server data caching |
| Code Editor | Monaco Editor (`@monaco-editor/react`) | VS Code-quality in-browser editor |
| Backend | Node.js 20, Express 4 | REST API + WebSocket server |
| Database | PostgreSQL 16 | Primary data store |
| Cache / Sessions | Redis 7 | Session store, user cache, active user tracking |
| Auth | JWT + Google OAuth 2.0 | Stateless auth + social login |
| Image Hosting | Cloudinary | CDN-served question images |
| Code Execution | Judge0 (RapidAPI or self-hosted) | Isolated sandbox for student code |
| Containerisation | Docker + Docker Compose | Dev parity and production deployment |
| Web Server | Nginx | Static file serving + reverse proxy |

---

## Project Structure

```
placementpro/
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.js          # Login, Google OAuth, logout, change password
│   │   │   ├── tests.js         # Test CRUD — sections, questions, duplicate
│   │   │   ├── submissions.js   # Start/save/submit exam, Judge0 grading, run code
│   │   │   ├── users.js         # User management, bulk import, dashboard stats
│   │   │   └── upload.js        # Cloudinary image upload/delete
│   │   ├── db/
│   │   │   ├── index.js         # PostgreSQL connection pool (max 20 connections)
│   │   │   ├── migrate.js       # Creates all tables and indexes — run once
│   │   │   ├── seed.js          # Inserts default admin account — run once
│   │   │   └── redis.js         # Redis client, session helpers, cache utils
│   │   ├── middleware/
│   │   │   ├── auth.js          # JWT verification, requireAdmin guard
│   │   │   └── rateLimit.js     # Auth, API, and code execution limiters
│   │   ├── routes/
│   │   │   └── index.js         # All route definitions wired to controllers
│   │   ├── services/
│   │   │   ├── cloudinary.js    # Multer + Cloudinary storage config
│   │   │   └── judge0.js        # Code execution API client, test case grader
│   │   └── index.js             # Express app entry — middleware, routes, WebSocket
│   ├── .env.example             # All required environment variables with comments
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/shared/
│   │   │   ├── UI.jsx           # Btn, Input, Modal, Table, Badge, Alert, etc.
│   │   │   └── Timer.jsx        # Countdown with WebSocket heartbeat
│   │   ├── pages/
│   │   │   ├── Login.jsx        # Email + Google Sign-In
│   │   │   ├── admin/
│   │   │   │   ├── Layout.jsx       # Sidebar navigation wrapper
│   │   │   │   ├── Dashboard.jsx    # Stats cards + recent activity
│   │   │   │   ├── Tests.jsx        # Test list with actions
│   │   │   │   ├── TestCreator.jsx  # 3-step test builder wizard
│   │   │   │   ├── Results.jsx      # Leaderboard + score distribution chart
│   │   │   │   ├── Users.jsx        # Student management + bulk CSV import
│   │   │   │   └── Admins.jsx       # Admin account management
│   │   │   └── student/
│   │   │       ├── Layout.jsx       # Top navbar wrapper
│   │   │       ├── Tests.jsx        # Available tests list
│   │   │       ├── TestInterface.jsx # Full-screen exam UI
│   │   │       ├── Results.jsx      # Submission history
│   │   │       └── ResultDetail.jsx # Per-submission breakdown
│   │   ├── services/api.js      # Axios instance + all API call methods
│   │   ├── App.jsx              # Router + protected route guards
│   │   ├── store.js             # Zustand global state (auth)
│   │   ├── main.jsx             # React entry point
│   │   └── index.css            # Tailwind imports + global styles
│   ├── .env.example
│   ├── Dockerfile
│   ├── nginx.conf               # Static serving + /api and /ws reverse proxy
│   ├── vite.config.js
│   └── package.json
│
├── docker-compose.yml           # PostgreSQL + Redis + Backend + Frontend
├── package.json                 # Monorepo root — runs both servers concurrently
└── README.md
```

---

## Prerequisites

- [Node.js 20+](https://nodejs.org/en/download)
- [Git](https://git-scm.com)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) *(for local PostgreSQL and Redis — optional if you have them already)*

---

## Local Development Setup

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/placementpro.git
cd placementpro
```

### 2. Install all dependencies

```bash
npm run install:all
```

This runs `npm install` in the root, `backend/`, and `frontend/` directories.

### 3. Configure environment variables

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit both files. At minimum for local development you need:

**`backend/.env`**
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/placementpro
REDIS_URL=redis://localhost:6379
JWT_SECRET=any_long_random_string_at_least_32_characters
REFRESH_TOKEN_SECRET=another_long_random_string
```

**`frontend/.env`**
```env
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=ws://localhost:5000/ws
```

> See the full [Environment Variables](#environment-variables) table below for Google OAuth, Cloudinary, and Judge0 setup.

### 4. Start the local database and cache

```bash
docker compose up postgres redis -d
```

Starts PostgreSQL on port `5432` and Redis on port `6379`.

### 5. Run database migrations and seed

```bash
cd backend
npm run db:migrate   # Creates all tables and indexes
npm run db:seed      # Inserts the default admin account
cd ..
```

### 6. Start both development servers

```bash
npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000/api |
| Health check | http://localhost:5000/api/health |

### Default login credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@college.edu` | `Admin@123` |

> ⚠️ **Change the admin password immediately after first login.**

---

## Environment Variables

### Backend — `backend/.env`

| Variable | Required | Where to get it |
|---|---|---|
| `NODE_ENV` | Yes | `development` or `production` |
| `PORT` | No | Default: `5000` |
| `FRONTEND_URL` | Yes | Frontend origin for CORS |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `JWT_SECRET` | Yes | Generate: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `JWT_EXPIRES_IN` | No | Default: `7d` |
| `REFRESH_TOKEN_SECRET` | Yes | Generate same way as `JWT_SECRET` |
| `GOOGLE_CLIENT_ID` | For Google login | [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → OAuth 2.0 Client IDs |
| `GOOGLE_CLIENT_SECRET` | For Google login | Same as above |
| `CLOUDINARY_CLOUD_NAME` | For image uploads | [Cloudinary Dashboard](https://cloudinary.com) |
| `CLOUDINARY_API_KEY` | For image uploads | Cloudinary Dashboard |
| `CLOUDINARY_API_SECRET` | For image uploads | Cloudinary Dashboard |
| `JUDGE0_API_URL` | For code execution | `https://judge0-ce.p.rapidapi.com` or your self-hosted URL |
| `JUDGE0_API_KEY` | For code execution | [RapidAPI — Judge0 CE](https://rapidapi.com/judge0-official/api/judge0-ce) |
| `JUDGE0_API_HOST` | For code execution | `judge0-ce.p.rapidapi.com` (omit if self-hosted) |

### Frontend — `frontend/.env`

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Yes | Backend API base URL |
| `VITE_WS_URL` | Yes | Backend WebSocket URL (use `wss://` in production) |
| `VITE_GOOGLE_CLIENT_ID` | For Google login | Same Client ID as backend |
| `VITE_APP_NAME` | No | Platform name shown in the UI (default: `PlacementPro`) |
| `VITE_COLLEGE_NAME` | No | Your college name shown on the login page |

---

## API Reference

All endpoints are prefixed with `/api`. Authenticated routes require the header:
```
Authorization: Bearer <token>
```

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/login` | Public | Email and password login. Returns `{ token, user }`. |
| `POST` | `/auth/google` | Public | Google OAuth login with credential token. Returns `{ token, user }`. |
| `POST` | `/auth/logout` | User | Clears the Redis session cache for this user. |
| `GET` | `/auth/me` | User | Returns the currently authenticated user object. |
| `POST` | `/auth/change-password` | User | Verifies old password, hashes and saves new one. |

### Tests

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/tests` | User | List tests. Admins see all; students see only published. |
| `GET` | `/tests/:id` | User | Full test with sections and questions. Correct answers hidden from students. |
| `POST` | `/tests` | Admin | Create test with sections and questions in a single transaction. |
| `PUT` | `/tests/:id` | Admin | Update test metadata and settings. Invalidates Redis cache. |
| `DELETE` | `/tests/:id` | Admin | Delete test. Cascades to sections, questions, and submissions. |
| `POST` | `/tests/:id/duplicate` | Admin | Copy test as a draft with "(Copy)" appended to the title. |

### Submissions

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/submissions/start` | Student | Start or resume a session. Returns `remainingSeconds`. |
| `POST` | `/submissions/save` | Student | Auto-save answers without grading (called every 30 seconds). |
| `POST` | `/submissions/submit` | Student | Submit, grade all sections via Judge0, calculate final score. |
| `POST` | `/submissions/run-code` | Student | Execute code against sample input. Returns stdout/stderr. Not graded. |
| `GET` | `/submissions/my` | Student | Student's own submission history with test titles. |
| `GET` | `/submissions/test/:testId` | Admin | All submissions for a test, ordered by score (leaderboard). |
| `GET` | `/submissions/:id` | User | Single submission detail. Students can only access their own. |

### Users

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/users` | Admin | Paginated list with `role` and `search` query params. |
| `GET` | `/users/stats` | Admin | Dashboard stats: user counts, test counts, submission averages. |
| `POST` | `/users/admin` | Admin | Create a new admin account with name, email, password. |
| `POST` | `/users/bulk-import` | Admin | Import array of `{ name, email, branch, rollNumber }` objects. |
| `PATCH` | `/users/:id` | Admin | Update name, branch, roll number, or `isActive` status. |
| `DELETE` | `/users/:id` | Admin | Delete user. Self-deletion is blocked. |

### Upload

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/upload/image` | Admin | Multipart upload to Cloudinary. Returns `{ url, publicId }`. |
| `DELETE` | `/upload/image/:publicId` | Admin | Delete image from Cloudinary by public ID. |

---

## Deployment

### Option A — Railway + Vercel (Recommended)

Both platforms have generous free tiers and deploy directly from GitHub.

**Backend on [Railway](https://railway.app):**

```bash
npm install -g @railway/cli
railway login
railway init   # run from project root
railway up
```

In the Railway dashboard:
1. Add a **PostgreSQL** plugin → `DATABASE_URL` is injected automatically
2. Add a **Redis** plugin → `REDIS_URL` is injected automatically
3. Go to **Variables** and add all remaining env vars from the table above
4. Open **Settings → Deploy → Shell** and run:
   ```bash
   node src/db/migrate.js && node src/db/seed.js
   ```
5. Copy the generated domain from **Settings → Networking**

**Frontend on [Vercel](https://vercel.com):**

```bash
npm install -g vercel
cd frontend
vercel
```

In the Vercel dashboard → **Settings → Environment Variables**, add:

```
VITE_API_URL   = https://YOUR-RAILWAY-DOMAIN.up.railway.app/api
VITE_WS_URL    = wss://YOUR-RAILWAY-DOMAIN.up.railway.app/ws
VITE_GOOGLE_CLIENT_ID = your_google_client_id
VITE_COLLEGE_NAME     = Your College Name
```

Redeploy with `vercel --prod`.

Finally, add your Vercel domain to **Authorized JavaScript Origins** and **Authorized Redirect URIs** in [Google Cloud Console](https://console.cloud.google.com) → Credentials.

---

### Option B — Docker on a VPS

Suitable for a college-owned server or a cheap cloud VPS (DigitalOcean, Hetzner, AWS EC2).

```bash
# On an Ubuntu 22.04 server
sudo apt update && sudo apt install -y docker.io docker-compose-v2 git

git clone https://github.com/YOUR_USERNAME/placementpro.git
cd placementpro

# Fill in your environment variables
cp backend/.env.example backend/.env  && nano backend/.env
cp frontend/.env.example frontend/.env && nano frontend/.env

# Build and start all four services
docker compose up -d --build

# Run database setup (first time only)
docker compose exec backend node src/db/migrate.js
docker compose exec backend node src/db/seed.js
```

The app is now available at `http://YOUR_SERVER_IP`.

**For HTTPS** (required for Google OAuth in production):

```bash
sudo apt install certbot nginx
sudo certbot --nginx -d yourdomain.com
```

---

## Scaling for 1000+ Students

The main constraint on exam day is code execution capacity.

### Judge0 options

| Option | Cost | Capacity | Setup effort |
|---|---|---|---|
| RapidAPI Free | $0 | 50 req/day | None |
| RapidAPI Basic | $10/month | 1,000 req/day | None |
| RapidAPI Ultra | $50/month | Unlimited | None |
| Self-hosted Judge0 | Server cost only | Unlimited | Medium |

**Self-hosting Judge0** (requires a server with 4 GB RAM):

```bash
git clone https://github.com/judge0/judge0.git
cd judge0
cp judge0.conf.example judge0.conf
docker compose up -d
```

Set `JUDGE0_API_URL=http://YOUR_JUDGE0_SERVER_IP:2358` and remove `JUDGE0_API_KEY` and `JUDGE0_API_HOST` from your `.env`.

### Other bottlenecks

**Database** — the connection pool is capped at 20 connections. Supabase's free tier supports up to 60 simultaneous connections, which handles 3 backend replicas with headroom.

**Redis** — Upstash free tier (10,000 requests/day) covers testing and small exams. For a 1,000-student exam, the $10/month plan (1M requests/day) is more than sufficient.

**Backend replicas** — Railway and Render support horizontal scaling. Running 2–3 replicas behind their load balancer handles concurrent exam traffic comfortably.

---

## Contributing

Contributions are welcome. Please open an issue first to discuss what you would like to change.

```bash
# 1. Fork the repository on GitHub

# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/placementpro.git
cd placementpro

# 3. Create a feature branch
git checkout -b feature/your-feature-name

# 4. Make your changes and commit
git commit -m "feat: describe your change"

# 5. Push and open a pull request
git push origin feature/your-feature-name
```

Please follow the existing code style and test your changes locally with the full Docker stack before submitting.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

Built for placement cells that deserve better tooling.

**[Report a Bug](https://github.com/YOUR_USERNAME/placementpro/issues)** · **[Request a Feature](https://github.com/YOUR_USERNAME/placementpro/issues)** · **[Discussions](https://github.com/YOUR_USERNAME/placementpro/discussions)**

</div>
