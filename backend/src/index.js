require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const compression = require('compression');
const morgan  = require('morgan');
const http    = require('http');
const WebSocket = require('ws');
const { apiLimiter } = require('./middleware/rateLimit');
const routes  = require('./routes');
const { getRedis } = require('./db/redis');

const app = express();
const server = http.createServer(app);

// ── Security & Performance Middleware ─────────────────────────────────────────
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    /\.vercel\.app$/,
    /\.netlify\.app$/,
  ],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use('/api', apiLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api', routes);

// ── WebSocket for real-time timer sync ────────────────────────────────────────
const wss = new WebSocket.Server({ server, path: '/ws' });
const clients = new Map(); // userId -> ws

wss.on('connection', (ws, req) => {
  const token = new URL(req.url, 'http://x').searchParams.get('token');
  if (!token) { ws.close(); return; }

  try {
    const jwt = require('jsonwebtoken');
    const { userId } = jwt.verify(token, process.env.JWT_SECRET);
    clients.set(userId, ws);

    ws.on('message', async (raw) => {
      try {
        const msg = JSON.parse(raw);
        if (msg.type === 'PING') ws.send(JSON.stringify({ type: 'PONG' }));
        if (msg.type === 'HEARTBEAT' && msg.testId) {
          const { trackActiveUser, getActiveUserCount } = require('./db/redis');
          await trackActiveUser(msg.testId, userId);
          ws.send(JSON.stringify({ type: 'ACTIVE_COUNT', count: await getActiveUserCount(msg.testId) }));
        }
      } catch {}
    });

    ws.on('close', () => clients.delete(userId));
  } catch { ws.close(); }
});

// Broadcast to all connected clients (used by admin for announcements)
function broadcast(testId, message) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ ...message, testId }));
    }
  });
}

// ── Error Handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err);
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File too large. Max 5MB.' });
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await getRedis(); // ensure Redis connects on boot
    server.listen(PORT, () => {
      console.log(`\n🚀 PlacementPro server running on port ${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV}`);
      console.log(`   Frontend:    ${process.env.FRONTEND_URL}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
module.exports = { app, broadcast };
