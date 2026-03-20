import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useSocket } from '../../contexts/SocketContext';
import {
  getCurrentAdminModule,
  getModeSwitchOptions,
  getPageMetadata
} from '../../utils/adminModules';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { connected } = useSocket();
  const pageMetadata = getPageMetadata(location.pathname);
  const currentModule = getCurrentAdminModule(location.pathname);
  const modeSwitchOptions = getModeSwitchOptions(location.pathname);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
      >
        <Sidebar
          moduleConfig={currentModule}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          title={pageMetadata.title}
          currentModule={currentModule}
          modeSwitchOptions={modeSwitchOptions}
          searchPlaceholder={currentModule.searchPlaceholder}
        />

        {!connected && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Conexión perdida con el servidor. Las actualizaciones en tiempo real no
                  están disponibles.
                </p>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-auto">
          <div className="py-6">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
