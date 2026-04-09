import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pp_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global error handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.error || 'Something went wrong';
    if (err.response?.status === 401) {
      localStorage.removeItem('pp_token');
      window.location.href = '/login';
    } else if (err.response?.status !== 400) {
      toast.error(msg);
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  login:          (data) => api.post('/auth/login', data).then(r => r.data),
  register:       (data) => api.post('/auth/register', data).then(r => r.data),
  googleLogin:    (credential) => api.post('/auth/google', { credential }).then(r => r.data),
  logout:         () => api.post('/auth/logout').then(r => r.data),
  getMe:          () => api.get('/auth/me').then(r => r.data),
  changePassword: (data) => api.post('/auth/change-password', data).then(r => r.data),
};

// ── Tests ─────────────────────────────────────────────────────────────────────
export const testsAPI = {
  list:       () => api.get('/tests').then(r => r.data),
  get:        (id) => api.get(`/tests/${id}`).then(r => r.data),
  create:     (data) => api.post('/tests', data).then(r => r.data),
  update:     (id, data) => api.put(`/tests/${id}`, data).then(r => r.data),
  delete:     (id) => api.delete(`/tests/${id}`).then(r => r.data),
  duplicate:  (id) => api.post(`/tests/${id}/duplicate`).then(r => r.data),
};

// ── Submissions ───────────────────────────────────────────────────────────────
export const submissionsAPI = {
  start:       (testId) => api.post('/submissions/start', { testId }).then(r => r.data),
  save:        (data) => api.post('/submissions/save', data).then(r => r.data),
  submit:      (data) => api.post('/submissions/submit', data).then(r => r.data),
  runCode:     (data) => api.post('/submissions/run-code', data).then(r => r.data),
  getMy:       () => api.get('/submissions/my').then(r => r.data),
  getForTest:  (testId) => api.get(`/submissions/test/${testId}`).then(r => r.data),
  get:         (id) => api.get(`/submissions/${id}`).then(r => r.data),
  delete:      (id) => api.delete(`/submissions/${id}`).then(r => r.data),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersAPI = {
  list:        (params) => api.get('/users', { params }).then(r => r.data),
  stats:       () => api.get('/users/stats').then(r => r.data),
  createAdmin: (data) => api.post('/users/admin', data).then(r => r.data),
  bulkImport:  (data) => api.post('/users/bulk-import', data).then(r => r.data),
  update:      (id, data) => api.patch(`/users/${id}`, data).then(r => r.data),
  delete:      (id) => api.delete(`/users/${id}`).then(r => r.data),
  listAdmins:  () => api.get('/admins').then(r => r.data),
};

// ── Upload ────────────────────────────────────────────────────────────────────
export const uploadAPI = {
  image: (file) => {
    const fd = new FormData();
    fd.append('image', file);
    return api.post('/upload/image', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },
  deleteImage: (publicId) => api.delete(`/upload/image/${encodeURIComponent(publicId)}`).then(r => r.data),
};

export default api;
