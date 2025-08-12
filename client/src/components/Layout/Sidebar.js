import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Monitor, 
  Palette, 
  Settings, 
  LogOut,
  X
} from 'lucide-react';

const Sidebar = ({ onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Pantallas',
      href: '/screens',
      icon: Monitor,
    },
    {
      name: 'Diseños',
      href: '/designs',
      icon: Palette,
    },
  ];

  return (
    <div className="flex h-full flex-col bg-white shadow-xl">
      {/* Header del sidebar */}
      <div className="flex h-16 flex-shrink-0 items-center justify-between px-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Monitor className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="ml-3">
            <h1 className="text-lg font-semibold text-gray-900">PantallasQR</h1>
          </div>
        </div>
        
        {/* Botón de cerrar para móvil */}
        <button
          type="button"
          className="lg:hidden rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
          onClick={onClose}
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Navegación */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150 ${
                  isActive
                    ? 'bg-primary-100 text-primary-900 border-r-2 border-primary-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
              onClick={onClose} // Cerrar sidebar en móvil al hacer clic
            >
              <Icon
                className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-150`}
                aria-hidden="true"
              />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      {/* Información del usuario y logout */}
      <div className="flex-shrink-0 border-t border-gray-200 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-700">
                {user?.username?.charAt(0).toUpperCase() || 'A'}
              </span>
            </div>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900">
              {user?.username || 'Administrador'}
            </p>
            <p className="text-xs text-gray-500">
              {user?.role === 'admin' ? 'Administrador' : 'Usuario'}
            </p>
          </div>
        </div>
        
        {/* Botones de acción */}
        <div className="mt-3 space-y-1">
          <button
            type="button"
            className="group flex w-full items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150"
            onClick={() => {
              // TODO: Implementar configuración de usuario
              console.log('Abrir configuración');
            }}
          >
            <Settings className="mr-3 h-4 w-4" />
            Configuración
          </button>
          
          <button
            type="button"
            className="group flex w-full items-center px-2 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 hover:text-red-700 transition-colors duration-150"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-4 w-4" />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;