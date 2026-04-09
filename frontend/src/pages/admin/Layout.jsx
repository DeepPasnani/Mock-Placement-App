import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { GraduationCap, LayoutDashboard, FileText, BarChart2, Users, UserCog, LogOut, Menu, X, Crown } from 'lucide-react';
import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';

export default function AdminLayout() {
  const { user, logout } = useStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NAV = useMemo(() => {
    const items = [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/admin/tests', label: 'Tests', icon: FileText },
      { to: '/admin/results', label: 'Results', icon: BarChart2 },
      { to: '/admin/users', label: 'Students', icon: Users },
    ];
    if (user?.role === 'super_admin') {
      items.push({ to: '/admin/admins', label: 'Admins', icon: Crown });
    }
    return items;
  }, [user?.role]);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shrink-0">
            <GraduationCap size={19} className="text-white" />
          </div>
          <div>
            <div className="font-display font-bold text-sm text-white">CampusTrack</div>
            <div className="text-xs text-gray-500">Admin Panel</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
               ${isActive ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:bg-surface-light hover:text-white'}`
            }>
            {({ isActive }) => <>
              <Icon size={17} className={isActive ? 'text-primary' : 'text-gray-500'} />
              {label}
            </>}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-gray-800">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-sm shrink-0">
            {(user?.name || user?.email || 'A')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-white truncate">{user?.name || 'Admin'}</div>
            <div className="text-xs text-gray-500 truncate">{user?.email}</div>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-400 hover:bg-surface-light hover:text-white transition-colors">
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#0a0a0a] overflow-hidden">
      <aside className="hidden lg:flex flex-col w-56 bg-surface border-r border-gray-800 shrink-0">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-64 bg-surface border-r border-gray-800 flex flex-col">
            <div className="flex justify-end p-3">
              <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-surface-light"><X size={18} className="text-gray-400" /></button>
            </div>
            <SidebarContent />
          </div>
          <div className="flex-1 bg-black/60" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      <main className="flex-1 overflow-y-auto">
        <div className="lg:hidden sticky top-0 z-40 bg-surface border-b border-gray-800 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-lg hover:bg-surface-light"><Menu size={20} className="text-gray-400" /></button>
          <span className="font-display font-bold text-white">CampusTrack</span>
        </div>
        <div className="p-6 max-w-7xl mx-auto page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
