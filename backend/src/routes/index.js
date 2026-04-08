const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const { authLimiter, codeLimiter } = require('../middleware/rateLimit');
const { upload } = require('../services/cloudinary');

const authCtrl = require('../controllers/auth');
const testCtrl = require('../controllers/tests');
const subCtrl  = require('../controllers/submissions');
const userCtrl = require('../controllers/users');
const upCtrl   = require('../controllers/upload');

// ── Auth ──────────────────────────────────────────────────────────────────────
router.post('/auth/login',           authLimiter, authCtrl.login);
router.post('/auth/register',        authLimiter, authCtrl.register);
router.post('/auth/google',          authLimiter, authCtrl.googleLogin);
router.post('/auth/logout',          authenticate, authCtrl.logout);
router.get ('/auth/me',              authenticate, authCtrl.getMe);
router.post('/auth/change-password', authenticate, authCtrl.changePassword);

// ── Tests ─────────────────────────────────────────────────────────────────────
router.get ('/tests',           authenticate, testCtrl.listTests);
router.get ('/tests/:id',       authenticate, testCtrl.getTest);
router.post('/tests',           authenticate, requireAdmin, testCtrl.createTest);
router.put ('/tests/:id',       authenticate, requireAdmin, testCtrl.updateTest);
router.delete('/tests/:id',     authenticate, requireAdmin, testCtrl.deleteTest);
router.post('/tests/:id/duplicate', authenticate, requireAdmin, testCtrl.duplicateTest);

// ── Submissions ───────────────────────────────────────────────────────────────
router.post('/submissions/start',       authenticate, subCtrl.startTest);
router.post('/submissions/save',        authenticate, subCtrl.saveAnswers);
router.post('/submissions/submit',      authenticate, subCtrl.submitTest);
router.post('/submissions/run-code',    authenticate, codeLimiter, subCtrl.runCode);
router.get ('/submissions/my',          authenticate, subCtrl.getMySubmissions);
router.get ('/submissions/test/:testId',authenticate, requireAdmin, subCtrl.getTestSubmissions);
router.delete('/submissions/:id',     authenticate, requireAdmin, subCtrl.deleteSubmission);
router.get ('/submissions/:id',         authenticate, subCtrl.getSubmission);

// ── Users ─────────────────────────────────────────────────────────────────────
router.get ('/users',               authenticate, requireAdmin, userCtrl.listUsers);
router.get ('/users/stats',         authenticate, requireAdmin, userCtrl.getStats);
router.post('/users/admin',         authenticate, requireAdmin, userCtrl.createAdmin);
router.post('/users/bulk-import',   authenticate, requireAdmin, userCtrl.bulkImport);
router.patch('/users/:id',          authenticate, requireAdmin, userCtrl.updateUser);
router.delete('/users/:id',         authenticate, requireAdmin, userCtrl.deleteUser);

// ── Image Upload ──────────────────────────────────────────────────────────────
router.post('/upload/image',           authenticate, requireAdmin, upload.single('image'), upCtrl.uploadImage);
router.delete('/upload/image/:publicId', authenticate, requireAdmin, upCtrl.deleteImage);

// ── Health check ──────────────────────────────────────────────────────────────
router.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

module.exports = router;
