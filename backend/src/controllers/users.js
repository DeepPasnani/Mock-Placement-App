const bcrypt = require('bcryptjs');
const { query } = require('../db');
const { cacheDel } = require('../db/redis');

// GET /api/users
async function listUsers(req, res) {
  const { role, search, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  const params = [];
  let where = 'WHERE 1=1';

  if (role) { params.push(role); where += ` AND role=$${params.length}`; }
  if (search) { params.push(`%${search}%`); where += ` AND (name ILIKE $${params.length} OR email ILIKE $${params.length})`; }

  params.push(limit, offset);
  const { rows } = await query(
    `SELECT id, name, email, role, branch, roll_number, is_active, avatar_url, last_login, created_at
     FROM users ${where} ORDER BY created_at DESC LIMIT $${params.length-1} OFFSET $${params.length}`,
    params
  );

  const { rows: [{ count }] } = await query(`SELECT COUNT(*) FROM users ${where}`, params.slice(0, -2));
  res.json({ users: rows, total: parseInt(count), page: parseInt(page), limit: parseInt(limit) });
}

// POST /api/users/admin (create admin account)
async function createAdmin(req, res) {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password required' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const existing = await query('SELECT id FROM users WHERE email=$1', [email.toLowerCase()]);
  if (existing.rows.length) return res.status(400).json({ error: 'Email already registered' });

  const hash = await bcrypt.hash(password, 12);
  const { rows: [user] } = await query(
    `INSERT INTO users (name, email, password_hash, role, created_by)
     VALUES ($1,$2,$3,'admin',$4) RETURNING id, name, email, role, created_at`,
    [name, email.toLowerCase(), hash, req.user.id]
  );
  res.status(201).json({ user });
}

// POST /api/users/bulk-import (CSV import of students)
async function bulkImport(req, res) {
  const { students } = req.body; // [{name, email, branch, rollNumber}]
  if (!Array.isArray(students) || !students.length) return res.status(400).json({ error: 'Student list required' });

  const results = { created: 0, skipped: 0, errors: [] };

  for (const s of students) {
    if (!s.email) { results.errors.push(`Missing email for ${s.name}`); continue; }
    try {
      const tempPass = Math.random().toString(36).slice(2, 10);
      const hash = await bcrypt.hash(tempPass, 10);
      await query(
        `INSERT INTO users (name, email, password_hash, role, branch, roll_number)
         VALUES ($1,$2,$3,'student',$4,$5)
         ON CONFLICT (email) DO NOTHING`,
        [s.name, s.email.toLowerCase(), hash, s.branch, s.rollNumber]
      );
      results.created++;
    } catch (e) {
      results.errors.push(`${s.email}: ${e.message}`);
      results.skipped++;
    }
  }

  res.json(results);
}

// PATCH /api/users/:id
async function updateUser(req, res) {
  const { id } = req.params;
  const { name, branch, rollNumber, isActive } = req.body;

  const { rows } = await query(
    `UPDATE users SET name=COALESCE($1,name), branch=COALESCE($2,branch),
     roll_number=COALESCE($3,roll_number), is_active=COALESCE($4,is_active),
     updated_at=NOW() WHERE id=$5 RETURNING id, name, email, role, branch, roll_number, is_active`,
    [name, branch, rollNumber, isActive, id]
  );
  if (!rows.length) return res.status(404).json({ error: 'User not found' });
  await cacheDel(`user:${id}`);
  res.json({ user: rows[0] });
}

// DELETE /api/users/:id
async function deleteUser(req, res) {
  const { id } = req.params;
  if (id === req.user.id) return res.status(400).json({ error: 'Cannot delete your own account' });
  await query('DELETE FROM users WHERE id=$1', [id]);
  await cacheDel(`user:${id}`);
  res.json({ message: 'User deleted' });
}

// GET /api/users/stats (admin dashboard stats)
async function getStats(req, res) {
  const [users, tests, submissions, recentSubs] = await Promise.all([
    query("SELECT role, COUNT(*) FROM users GROUP BY role"),
    query("SELECT status, COUNT(*) FROM tests GROUP BY status"),
    query("SELECT COUNT(*), AVG(score/NULLIF(max_score,0)*100) as avg_pct FROM submissions WHERE status='submitted'"),
    query(`SELECT s.*, u.name as user_name, t.title as test_title
           FROM submissions s JOIN users u ON s.user_id=u.id JOIN tests t ON s.test_id=t.id
           WHERE s.status='submitted' ORDER BY s.submitted_at DESC LIMIT 10`),
  ]);

  res.json({
    users: Object.fromEntries(users.rows.map(r => [r.role, parseInt(r.count)])),
    tests: Object.fromEntries(tests.rows.map(r => [r.status, parseInt(r.count)])),
    submissions: {
      total: parseInt(submissions.rows[0].count),
      avgPercentage: parseFloat(submissions.rows[0].avg_pct || 0).toFixed(1),
    },
    recentSubmissions: recentSubs.rows,
  });
}

module.exports = { listUsers, createAdmin, bulkImport, updateUser, deleteUser, getStats, listAdmins };

// GET /api/admins (super_admin only)
async function listAdmins(req, res) {
  const { rows } = await query(`
    SELECT id, name, email, role, is_active, created_at
    FROM users
    WHERE role = 'admin'
    ORDER BY created_at DESC
  `);
  res.json({ admins: rows });
}
