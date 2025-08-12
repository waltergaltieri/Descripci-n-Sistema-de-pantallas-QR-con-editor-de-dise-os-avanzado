import React from 'react';
import { Menu, Bell, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';

const Header = ({ onMenuClick, title }) => {
  const { user } = useAuth();
  const { connected } = useSocket();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Lado izquierdo */}
        <div className="flex items-center">
          {/* Botón de menú para móvil */}
          <button
            type="button"
            className="lg:hidden rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
            onClick={onMenuClick}
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Título de la página */}
          <h1 className="ml-4 lg:ml-0 text-xl font-semibold text-gray-900">
            {title}
          </h1>
        </div>

        {/* Centro - Barra de búsqueda (opcional) */}
        <div className="hidden md:flex flex-1 justify-center px-6">
          <div className="w-full max-w-lg">
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
                placeholder="Buscar pantallas, diseños..."
                type="search"
              />
            </div>
          </div>
        </div>

        {/* Lado derecho */}
        <div className="flex items-center space-x-4">
          {/* Indicador de conexión */}
          <div className="flex items-center">
            <div className={`h-2 w-2 rounded-full ${
              connected ? 'bg-green-400' : 'bg-red-400'
            }`} />
            <span className="ml-2 text-sm text-gray-500">
              {connected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>

          {/* Notificaciones */}
          <button
            type="button"
            className="rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            <Bell className="h-6 w-6" />
          </button>

          {/* Información del usuario */}
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
    </header>
  );
};

export default Header;