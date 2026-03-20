import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, Menu, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';

const Header = ({
  onMenuClick,
  title,
  currentModule,
  modeSwitchOptions,
  searchPlaceholder
}) => {
  const { user } = useAuth();
  const { connected } = useSocket();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex h-auto min-h-16 flex-col gap-4 px-4 py-3 sm:px-6 lg:px-8 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <button
              type="button"
              className="lg:hidden rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
              onClick={onMenuClick}
            >
              <Menu className="h-6 w-6" />
            </button>

            <div>
              <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-gray-500 mt-1">
                Módulo {currentModule.label}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 xl:hidden">
            <div
              className={`h-2 w-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`}
            />
            <button
              type="button"
              className="rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <Bell className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 xl:flex-1 xl:flex-row xl:items-center xl:justify-end">
          <nav
            aria-label="Cambiar de módulo"
            className="inline-flex items-center rounded-xl bg-gray-100 p-1 self-start"
          >
            {modeSwitchOptions.map((option) => (
              <Link
                key={option.key}
                to={option.href}
                aria-label={`Cambiar al módulo ${option.label}`}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                  option.active
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {option.label}
              </Link>
            ))}
          </nav>

          <div className="flex-1 xl:max-w-md">
            <label htmlFor="search" className="sr-only">
              Buscar
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="search"
                name="search"
                className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder={searchPlaceholder}
                type="search"
              />
            </div>
          </div>

          <div className="hidden xl:flex items-center space-x-4">
            <div className="flex items-center">
              <div
                className={`h-2 w-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`}
              />
              <span className="ml-2 text-sm text-gray-500">
                {connected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>

            <button
              type="button"
              className="rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <Bell className="h-6 w-6" />
            </button>

            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.username?.charAt(0).toUpperCase() || 'A'}
                  </span>
                </div>
              </div>
              <div className="ml-3 hidden sm:block">
                <p className="text-sm font-medium text-gray-900">
                  {user?.username || 'Administrador'}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.role === 'admin' ? 'Administrador' : 'Usuario'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
