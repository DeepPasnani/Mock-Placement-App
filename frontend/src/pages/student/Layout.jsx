import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { Shield, ClipboardList, Award, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentLayout() {
  const { user, logout } = useStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-brand rounded-lg flex items-center justify-center">
                <Shield size={14} color="white" />
              </div>
              <span className="font-bold text-sm text-gray-900 hidden sm:block">PlacementPro</span>
            </div>
            <nav className="flex gap-1">
              <NavLink to="/student" end className={({ isActive }) => `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-brand-light text-brand' : 'text-gray-600 hover:bg-gray-100'}`}>
                <ClipboardList size={15}/> Tests
              </NavLink>
              <NavLink to="/student/results" className={({ isActive }) => `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-brand-light text-brand' : 'text-gray-600 hover:bg-gray-100'}`}>
                <Award size={15}/> My Results
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-gray-800">{user?.name || 'Student'}</div>
              <div className="text-xs text-gray-400">{user?.email}</div>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors">
              <LogOut size={15}/> <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 page-enter">
        <Outlet />
      </main>
    </div>
  );
}
