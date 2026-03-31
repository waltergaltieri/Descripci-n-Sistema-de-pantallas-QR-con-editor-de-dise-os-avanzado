import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { initResizeSensorFix } from './utils/resizeSensorFix';

const shouldInitInternalResizeFix =
  typeof window !== 'undefined' &&
  ['/internal-designs/editor', '/internal-editor/hidden'].some((path) =>
    window.location.pathname.startsWith(path)
  );

if (shouldInitInternalResizeFix) {
  initResizeSensorFix();
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <App />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
