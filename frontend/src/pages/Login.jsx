import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store';
import { Spinner } from '../components/shared/UI';
import { GraduationCap, Code, Users, TrendingUp, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { googleLogin, login, isLoading } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const from = location.state?.from?.pathname || null;

  const handleEmailSubmit = async (e) => {
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

  const features = [
    { icon: Code, label: 'Code Execution', desc: 'Run code in Python, Java, C & C++' },
    { icon: Users, label: 'Auto Proctoring', desc: 'AI-powered cheating detection' },
    { icon: TrendingUp, label: 'Instant Results', desc: 'Real-time scoring & analytics' },
    { icon: GraduationCap, label: 'Scale Ready', desc: 'Handle 1000+ concurrent users' },
  ];

  return (
    <div className="min-h-screen flex bg-[#0a0a0a] relative overflow-hidden">
      <div className="absolute inset-0 noise-bg pointer-events-none" />
      
      <div className="hidden lg:flex flex-1 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(225,29,72,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(99,102,241,0.15),transparent_50%)]" />
        
        <div className="relative z-10 flex flex-col justify-center px-16 py-20 w-full">
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/25">
                <GraduationCap size={28} className="text-white" />
              </div>
              <span className="font-display text-2xl font-bold text-white tracking-tight">CampusTrack</span>
            </div>
            <h1 className="font-display text-5xl font-bold text-white mb-4 leading-tight">
              Placement<br />
              <span className="gradient-text">Assessment Portal</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-md">
              Secure, scalable, and intelligent placement testing platform for modern institutions.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="glass rounded-2xl p-5 hover:bg-surface-light/50 transition-all duration-300 group">
                <div className="w-10 h-10 rounded-xl bg-surface-light flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                  <Icon size={20} className="text-gray-400 group-hover:text-primary transition-colors" />
                </div>
                <h3 className="font-semibold text-white mb-1">{label}</h3>
                <p className="text-gray-500 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-[540px] flex items-center justify-center p-8 lg:p-12 relative z-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/25">
              <GraduationCap size={32} className="text-white" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">CampusTrack</h1>
            <p className="text-gray-500 text-sm mt-1">Placement Assessment Portal</p>
          </div>

          <div className="glass rounded-3xl p-8 lg:p-10">
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl font-bold text-white mb-2">Welcome back</h2>
              <p className="text-gray-500">Enter your credentials to access the portal</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            <form onSubmit={handleEmailSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Email Address</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@institution.edu"
                    className="w-full pl-10 pr-4 py-3 border border-gray-800 rounded-xl text-sm bg-surface-light text-white outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-gray-600"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-4 py-3 border border-gray-800 rounded-xl text-sm bg-surface-light text-white outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-gray-600"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? <Spinner size={18} className="text-white" /> : null}
                Sign In
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-800">
              <p className="text-center text-gray-600 text-xs">
                Protected by enterprise-grade security.<br />
                Only authorized institutional accounts allowed.
              </p>
            </div>
          </div>

          <p className="text-center text-gray-600 text-xs mt-6">
            © 2026 CampusTrack. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
