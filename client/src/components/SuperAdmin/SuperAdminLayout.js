import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, ShieldCheck, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/super-admin/dashboard', icon: LayoutDashboard },
  { name: 'Clientes', href: '/super-admin/clients', icon: Users }
];

const SuperAdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const displayName = user?.fullName || user?.email || 'Super Admin';
  const initial = displayName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto flex min-h-screen max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <aside className="hidden w-72 shrink-0 rounded-3xl bg-slate-950 p-6 text-white shadow-2xl lg:flex lg:flex-col">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                  Control Central
                </p>
                <h1 className="text-xl font-semibold">Super Admin</h1>
              </div>
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-300">
              Alta de clientes, control manual de acceso y seguimiento de vencimientos.
            </p>
          </div>

          <nav className="mt-8 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? 'bg-white text-slate-950 shadow-lg'
                        : 'text-slate-200 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-400 text-slate-950 font-semibold">
                {initial}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{displayName}</p>
                <p className="truncate text-xs text-slate-400">{user?.email || 'super admin'}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesion
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Super Admin</p>
                <p className="text-base font-semibold text-slate-900">{displayName}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `rounded-2xl px-3 py-2 text-center text-sm font-medium transition ${
                      isActive ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-700'
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              ))}
            </div>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
