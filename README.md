# CampusTrack

**A full-stack mock placement platform built for college T&P cells.**  
Aptitude tests, live coding challenges, Google OAuth, real-time timers, and auto-grading — built to handle 1000+ simultaneous students.

🌐 **Live:** [campustrack.deadpan.qzz.io/login](https://campustrack.deadpan.qzz.io/login)

![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)

---

## Overview

CampusTrack is a self-hosted placement test platform designed for engineering college Training & Placement cells. It replaces fragmented tools — HackerRank, Google Forms, manual spreadsheets — with a single controlled system.

Two roles: **Admin** (T&P coordinators) and **Student**, with completely separate interfaces. Admins create and publish tests; students take them under timed, proctored conditions.

---

## Features

### Admin Panel

- **Test builder** — 3-step wizard (Config → Questions → Publish) with multi-section support
- **Aptitude questions** — MCQ, Multi-select, True/False, Fill-in-the-blank, Numerical
- **Coding problems** — structured editor with description, I/O format, constraints, sample cases, hidden test cases, per-language starter code, and time/memory limits
- **Image support** — attach diagrams to questions or answer options (Cloudinary CDN)
- **Test scheduling** — set start/end times, duration, and restrict by branch
- **Test settings** — shuffle questions/options, negative marking, custom passing score
- **Results & analytics** — score distribution chart, leaderboard, one-click CSV export
- **User management** — bulk import students via CSV, activate/deactivate accounts
- **Admin accounts** — create and manage multiple admin accounts

### Student Interface

- Google OAuth + email/password login
- Full-screen exam UI with dark-mode Monaco code editor (same engine as VS Code)
- Real-time countdown timer with WebSocket heartbeat and auto-submit on expiry
- Question palette — visual grid showing answered, unanswered, and flagged questions
- **Live code execution** — Run button with custom stdin, shows stdout/stderr instantly
- Multi-language support: Python, JavaScript, Java, C++
- Auto-save every 30 seconds
- Results page with per-test-case breakdown for coding problems

### Engineering

- JWT authentication with Redis-cached sessions
- WebSocket server for real-time active user tracking
- PostgreSQL connection pooling (handles 1000 concurrent users)
- Rate limiting on auth (20 req/15 min) and code execution (10 req/min)
- Gzip compression, Helmet.js security headers, CORS
- Docker Compose for one-command local setup

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS |
| State | Zustand + React Query |
| Code Editor | Monaco Editor (`@monaco-editor/react`) |
| Backend | Node.js 20, Express 4 |
| Database | PostgreSQL 16 |
| Cache / Sessions | Redis 7 |
| Auth | JWT + Google OAuth 2.0 |
| Image Hosting | Cloudinary |
| Code Execution | Judge0 (RapidAPI or self-hosted) |
| Containerisation | Docker + Docker Compose |
| Web Server | Nginx |

---

## Project Structure

```
campustrack/
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
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/shared/
│   │   │   ├── UI.jsx           # Btn, Input, Modal, Table, Badge, Alert, etc.
│   │   │   └── Timer.jsx        # Countdown with WebSocket heartbeat
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── admin/
│   │   │   │   ├── Layout.jsx
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── Tests.jsx
│   │   │   │   ├── TestCreator.jsx
│   │   │   │   ├── Results.jsx
│   │   │   │   ├── Users.jsx
│   │   │   │   └── Admins.jsx
│   │   │   └── student/
│   │   │       ├── Layout.jsx
│   │   │       ├── Tests.jsx
│   │   │       ├── TestInterface.jsx
│   │   │       ├── Results.jsx
│   │   │       └── ResultDetail.jsx
│   │   ├── services/api.js      # Axios instance + all API call methods
│   │   ├── App.jsx              # Router + protected route guards
│   │   ├── store.js             # Zustand global state (auth)
│   │   ├── main.jsx
│   │   └── index.css
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

## Local Development Setup

### Prerequisites

- Node.js 20+
- Git
- Docker Desktop (for PostgreSQL and Redis)

### 1. Clone

```bash
git clone https://github.com/DeepPasnani/Mock-Placement-App.git
cd Mock-Placement-App
```

### 2. Install dependencies

```bash
npm run install:all
```

### 3. Configure environment variables

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Minimum required for local dev:

**`backend/.env`**
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/placementpro
REDIS_URL=redis://localhost:6379
JWT_SECRET=<32+ char random string>
REFRESH_TOKEN_SECRET=<32+ char random string>
```

**`frontend/.env`**
```
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=ws://localhost:5000/ws
VITE_APP_NAME=CampusTrack
```

### 4. Start database and cache

```bash
docker compose up postgres redis -d
```

### 5. Run migrations and seed

```bash
cd backend
npm run db:migrate
npm run db:seed
cd ..
```

### 6. Start dev servers

```bash
npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000/api |
| Health check | http://localhost:5000/api/health |

### Default credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@college.edu` | `Admin@123` |

> ⚠️ Change the admin password immediately after first login.

---

## Environment Variables

### Backend — `backend/.env`

| Variable | Required | Notes |
|---|---|---|
| `NODE_ENV` | Yes | `development` or `production` |
| `PORT` | No | Default: `5000` |
| `FRONTEND_URL` | Yes | Frontend origin for CORS |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `JWT_SECRET` | Yes | `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `REFRESH_TOKEN_SECRET` | Yes | Same as above |
| `GOOGLE_CLIENT_ID` | For Google login | Google Cloud Console → OAuth 2.0 |
| `GOOGLE_CLIENT_SECRET` | For Google login | Google Cloud Console |
| `CLOUDINARY_CLOUD_NAME` | For image uploads | Cloudinary Dashboard |
| `CLOUDINARY_API_KEY` | For image uploads | Cloudinary Dashboard |
| `CLOUDINARY_API_SECRET` | For image uploads | Cloudinary Dashboard |
| `JUDGE0_API_URL` | For code execution | `https://judge0-ce.p.rapidapi.com` or self-hosted |
| `JUDGE0_API_KEY` | For code execution | RapidAPI — Judge0 CE |
| `JUDGE0_API_HOST` | For code execution | `judge0-ce.p.rapidapi.com` (omit if self-hosted) |

### Frontend — `frontend/.env`

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Yes | Backend API base URL |
| `VITE_WS_URL` | Yes | Backend WebSocket URL (`wss://` in production) |
| `VITE_GOOGLE_CLIENT_ID` | For Google login | Same Client ID as backend |
| `VITE_APP_NAME` | No | Platform name shown in the UI |
| `VITE_COLLEGE_NAME` | No | College name shown on the login page |

---

## API Reference

All endpoints are prefixed with `/api`. Authenticated routes require:
```
Authorization: Bearer <token>
```

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/login` | Public | Email/password login. Returns `{ token, user }`. |
| `POST` | `/auth/google` | Public | Google OAuth login with credential token. |
| `POST` | `/auth/logout` | User | Clears the Redis session for this user. |
| `GET` | `/auth/me` | User | Returns the authenticated user object. |
| `POST` | `/auth/change-password` | User | Verifies old password, saves new hash. |

### Tests

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/tests` | User | Admins see all; students see only published. |
| `GET` | `/tests/:id` | User | Full test with sections and questions. Correct answers hidden from students. |
| `POST` | `/tests` | Admin | Create test with sections and questions in a single transaction. |
| `PUT` | `/tests/:id` | Admin | Update test metadata and settings. Invalidates Redis cache. |
| `DELETE` | `/tests/:id` | Admin | Cascades to sections, questions, and submissions. |
| `POST` | `/tests/:id/duplicate` | Admin | Copy test as draft with "(Copy)" appended to the title. |

### Submissions

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/submissions/start` | Student | Start or resume a session. Returns `remainingSeconds`. |
| `POST` | `/submissions/save` | Student | Auto-save answers without grading (every 30 seconds). |
| `POST` | `/submissions/submit` | Student | Submit, grade via Judge0, calculate final score. |
| `POST` | `/submissions/run-code` | Student | Execute code against sample input. Not graded. |
| `GET` | `/submissions/my` | Student | Own submission history with test titles. |
| `GET` | `/submissions/test/:testId` | Admin | All submissions for a test, ordered by score. |
| `GET` | `/submissions/:id` | User | Single submission. Students can only access their own. |

### Users

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/users` | Admin | Paginated list with `role` and `search` query params. |
| `GET` | `/users/stats` | Admin | Dashboard stats: user counts, test counts, submission averages. |
| `POST` | `/users/admin` | Admin | Create a new admin account. |
| `POST` | `/users/bulk-import` | Admin | Import array of `{ name, email, branch, rollNumber }`. |
| `PATCH` | `/users/:id` | Admin | Update name, branch, roll number, or `isActive` status. |
| `DELETE` | `/users/:id` | Admin | Delete user. Self-deletion blocked. |

### Upload

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/upload/image` | Admin | Multipart upload to Cloudinary. Returns `{ url, publicId }`. |
| `DELETE` | `/upload/image/:publicId` | Admin | Delete image from Cloudinary. |

---

## Deployment

### Docker on a VPS

```bash
# Ubuntu 22.04
sudo apt update && sudo apt install -y docker.io docker-compose-v2 git

git clone https://github.com/DeepPasnani/Mock-Placement-App.git
cd Mock-Placement-App

cp backend/.env.example backend/.env  && nano backend/.env
cp frontend/.env.example frontend/.env && nano frontend/.env

docker compose up -d --build

# First time only
docker compose exec backend node src/db/migrate.js
docker compose exec backend node src/db/seed.js
```

For HTTPS (required for Google OAuth in production):
```bash
sudo apt install certbot nginx
sudo certbot --nginx -d yourdomain.com
```

---

## Scaling for 1000+ Students

The main constraint on exam day is code execution capacity.

### Judge0 options

| Option | Cost | Capacity |
|---|---|---|
| RapidAPI Free | $0 | 50 req/day |
| RapidAPI Basic | $10/month | 1,000 req/day |
| RapidAPI Ultra | $50/month | Unlimited |
| Self-hosted Judge0 | Server cost only | Unlimited |

**Self-hosting Judge0** (requires 4 GB RAM):
```bash
git clone https://github.com/judge0/judge0.git
cd judge0
cp judge0.conf.example judge0.conf
docker compose up -d
```
Set `JUDGE0_API_URL=http://YOUR_SERVER_IP:2358` and remove the `JUDGE0_API_KEY` and `JUDGE0_API_HOST` variables.

### Other bottlenecks

**Database** — connection pool is capped at 20. Supabase free tier supports up to 60 simultaneous connections (3 backend replicas with headroom).

**Redis** — Upstash free tier covers small exams. For 1000-student exams, the $10/month plan (1M req/day) is more than sufficient.

**Backend** — run 2–3 replicas behind a load balancer (Railway, Render) for peak concurrent traffic.

---

## License

[MIT](./LICENSE) — built for placement cells that deserve better tooling.

---

**[Report a Bug](https://github.com/DeepPasnani/Mock-Placement-App/issues)** · **[Request a Feature](https://github.com/DeepPasnani/Mock-Placement-App/issues)**
