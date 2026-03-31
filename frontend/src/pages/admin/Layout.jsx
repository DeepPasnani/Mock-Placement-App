import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { Shield, LayoutDashboard, FileText, BarChart2, Users, UserCog, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

const NAV = [
  { to: '/admin',         label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/tests',   label: 'Tests',     icon: FileText },
  { to: '/admin/results', label: 'Results',   icon: BarChart2 },
  { to: '/admin/users',   label: 'Students',  icon: Users },
  { to: '/admin/admins',  label: 'Admins',    icon: UserCog },
];

export default function AdminLayout() {
  const { user, logout } = useStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand rounded-xl flex items-center justify-center shrink-0">
            <Shield size={19} color="white" />
          </div>
          <div>
            <div className="font-bold text-sm text-gray-900">PlacementPro</div>
            <div className="text-xs text-gray-400">Admin Panel</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
               ${isActive ? 'bg-brand-light text-brand' : 'text-gray-600 hover:bg-gray-100'}`
            }>
            {({ isActive }) => <>
              <Icon size={17} className={isActive ? 'text-brand' : 'text-gray-400'} />
              {label}
            </>}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 bg-brand-light rounded-full flex items-center justify-center text-brand font-bold text-sm shrink-0">
            {(user?.name || user?.email || 'A')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-gray-900 truncate">{user?.name || 'Admin'}</div>
            <div className="text-xs text-gray-400 truncate">{user?.email}</div>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors">
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-white border-r border-gray-200 shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
            <div className="flex justify-end p-3">
              <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <SidebarContent />
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile header */}
        <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-lg hover:bg-gray-100"><Menu size={20} /></button>
          <span className="font-bold text-gray-900">PlacementPro</span>
        </div>
        <div className="p-6 max-w-7xl mx-auto page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
