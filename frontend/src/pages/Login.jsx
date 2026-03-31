import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store';
import { Alert, Spinner } from '../components/shared/UI';
import { Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, googleLogin, isLoading } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const googleBtnRef = useRef(null);
  const { user } = useStore();

  const from = location.state?.from?.pathname || null;

  useEffect(() => {
    if (!window.google || !googleBtnRef.current) return;
    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse,
    });
    window.google.accounts.id.renderButton(googleBtnRef.current, {
      type: 'standard', shape: 'rectangular', theme: 'outline',
      size: 'large', text: 'continue_with', width: 340,
    });
  }, []);

  const handleGoogleResponse = async ({ credential }) => {
    setError('');
    try {
      const { user } = await googleLogin(credential);
      toast.success(`Welcome, ${user.name || user.email}!`);
      navigate(from || (user.role === 'admin' ? '/admin' : '/student'), { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Google login failed. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { user } = await login(email, password);
      toast.success(`Welcome back, ${user.name || user.email}!`);
      navigate(from || (user.role === 'admin' ? '/admin' : '/student'), { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1a56db 50%, #0e9f6e 100%)' }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-center px-16 flex-1 text-white">
        <div className="max-w-lg">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-8 backdrop-blur">
            <Shield size={30} />
          </div>
          <h1 className="text-4xl font-extrabold mb-4 leading-tight">
            {import.meta.env.VITE_APP_NAME || 'PlacementPro'}
          </h1>
          <p className="text-xl text-white/80 mb-10">{import.meta.env.VITE_COLLEGE_NAME || 'College'} — Placement Test Platform</p>
          <div className="space-y-4">
            {[
              ['🔐', 'Secure & proctored tests'],
              ['⚡', 'Real-time code execution in 4 languages'],
              ['📊', 'Instant scoring and detailed analytics'],
              ['👥', 'Supports 1000+ simultaneous students'],
            ].map(([icon, text]) => (
              <div key={text} className="flex items-center gap-3 text-white/85 text-sm">
                <span className="text-lg">{icon}</span> {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - Login card */}
      <div className="flex items-center justify-center w-full lg:w-[480px] p-6">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <div className="lg:hidden mb-6 text-center">
            <div className="w-12 h-12 bg-brand rounded-xl flex items-center justify-center mx-auto mb-3">
              <Shield size={24} color="white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">{import.meta.env.VITE_APP_NAME || 'PlacementPro'}</h1>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Sign in</h2>
          <p className="text-sm text-gray-500 mb-7">Enter your credentials to access the platform</p>

          {error && <Alert type="error" className="mb-4">{error}</Alert>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Email Address <span className="text-red-500">*</span></label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@college.edu" autoComplete="email"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Password <span className="text-red-500">*</span></label>
              <input
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password" autoComplete="current-password"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
              />
            </div>
            <button type="submit" disabled={isLoading}
              className="w-full bg-brand text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
              {isLoading ? <><Spinner size={16} className="text-white" />Signing in…</> : 'Sign In'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or continue with</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Google Sign-In button rendered by Google's SDK */}
          <div ref={googleBtnRef} className="flex justify-center" />

          {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
            <p className="text-xs text-center text-gray-400 mt-3">
              Google login not configured. Add VITE_GOOGLE_CLIENT_ID to .env
            </p>
          )}

          <div className="mt-6 p-3.5 bg-gray-50 rounded-xl text-xs text-gray-500 leading-relaxed">
            <strong className="text-gray-700">Demo credentials</strong><br />
            Admin: <code className="bg-gray-200 px-1 rounded">admin@college.edu</code> / <code className="bg-gray-200 px-1 rounded">Admin@123</code>
          </div>
        </div>
      </div>
    </div>
  );
}
