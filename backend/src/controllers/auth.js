const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { query } = require('../db');
const { cacheSet, cacheDel } = require('../db/redis');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function signToken(userId, role) {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// POST /api/auth/login
async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const { rows } = await query(
    'SELECT id, name, email, role, password_hash, is_active, avatar_url FROM users WHERE email = $1',
    [email.toLowerCase().trim()]
  );

  const user = rows[0];
  if (!user || !user.password_hash) return res.status(401).json({ error: 'Invalid credentials' });
  if (!user.is_active) return res.status(403).json({ error: 'Account is deactivated' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  // Update last login
  await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

  const token = signToken(user.id, user.role);
  const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role, avatar_url: user.avatar_url };

  res.json({ token, user: safeUser });
}

// POST /api/auth/google
async function googleLogin(req, res) {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: 'Google credential required' });

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    return res.status(401).json({ error: 'Invalid Google token' });
  }

  const { sub: googleId, email, name, picture } = payload;

  // Upsert user
  const { rows } = await query(`
    INSERT INTO users (google_id, email, name, avatar_url, role)
    VALUES ($1, $2, $3, $4, 'student')
    ON CONFLICT (google_id) DO UPDATE SET
      email = EXCLUDED.email, name = EXCLUDED.name,
      avatar_url = EXCLUDED.avatar_url, last_login = NOW()
    RETURNING id, name, email, role, avatar_url, is_active
  `, [googleId, email.toLowerCase(), name, picture]);

  const user = rows[0];
  if (!user.is_active) return res.status(403).json({ error: 'Account is deactivated' });

  const token = signToken(user.id, user.role);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar_url: user.avatar_url } });
}

// POST /api/auth/logout
async function logout(req, res) {
  await cacheDel(`user:${req.user.id}`);
  res.json({ message: 'Logged out successfully' });
}

// GET /api/auth/me
async function getMe(req, res) {
  res.json({ user: req.user });
}

// POST /api/auth/change-password
async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords required' });
  if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const { rows } = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
  if (!rows[0]?.password_hash) return res.status(400).json({ error: 'Cannot change password for Google accounts' });

  const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
  if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

  const hash = await bcrypt.hash(newPassword, 12);
  await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);
  await cacheDel(`user:${req.user.id}`);

  res.json({ message: 'Password changed successfully' });
}

module.exports = { login, googleLogin, logout, getMe, changePassword, register };

// POST /api/auth/register
async function register(req, res) {
  const { name, email, password, department } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const validDepartments = [
    'Computer Engineering',
    'Computer Science and Design',
    'Aeronautical Engineering',
    'Electrical Engineering',
    'Electronics and Communication Engineering',
    'Civil Engineering'
  ];

  const emailLower = email.toLowerCase().trim();

  // Check if user already exists
  const existing = await query('SELECT id FROM users WHERE email = $1', [emailLower]);
  if (existing.rows.length > 0) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  const hash = await bcrypt.hash(password, 12);
  
  const { rows } = await query(
    'INSERT INTO users (name, email, password_hash, role, department, is_active) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, role, department, avatar_url',
    [name.trim(), emailLower, hash, 'student', department || null, true]
  );

  const user = rows[0];
  const token = signToken(user.id, user.role);
  
  res.status(201).json({ 
    token, 
    user: { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department, avatar_url: user.avatar_url }
  });
}
