import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { resolveServerBaseUrl } from '../utils/runtimeUrls';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket debe ser usado dentro de un SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    const newSocket = io(resolveServerBaseUrl(), {
      auth: token ? { token } : undefined,
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Conectado al servidor Socket.io');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Desconectado del servidor Socket.io');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Error de conexion Socket.io:', error);
      setConnected(false);
    });

    newSocket.on('screens-updated', (data) => {
      console.log('Pantallas actualizadas:', data);
    });

    newSocket.on('designs-updated', (data) => {
      console.log('Disenos actualizados:', data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
      setSocket(null);
      setConnected(false);
    };
  }, [token]);

  const normalizeScreenId = (screenId) => String(screenId).replace(/^screen-/, '');

  const joinScreen = (screenId) => {
    if (socket && connected) {
      const normalizedId = normalizeScreenId(screenId);
      socket.emit('join-screen', normalizedId);
      console.log(`Uniendose a la pantalla ${normalizedId}`);
    }
  };

  const leaveScreen = (screenId) => {
    if (socket && connected) {
      const normalizedId = normalizeScreenId(screenId);
      socket.emit('leave-screen', normalizedId);
      console.log(`Saliendo de la pantalla ${normalizedId}`);
    }
  };

  const emit = (event, data) => {
    if (socket && connected) {
      socket.emit(event, data);
    } else {
      console.warn('Socket no conectado. No se puede emitir evento:', event);
    }
  };

  const on = (event, callback) => {
    if (socket) {
      socket.on(event, callback);
      return () => socket.off(event, callback);
    }
    return () => {};
  };

  const once = (event, callback) => {
    if (socket) {
      socket.once(event, callback);
    }
  };

  const off = (event, callback) => {
    if (socket) {
      socket.off(event, callback);
    }
  };

  const useSocketEvent = (event, callback, dependencies = []) => {
    const callbackRef = useRef(callback);
    const dependencyKey = JSON.stringify(dependencies);

    useEffect(() => {
      callbackRef.current = callback;
    }, [callback, dependencyKey]);

    useEffect(() => {
      if (socket && connected) {
        const handler = (...args) => callbackRef.current?.(...args);
        socket.on(event, handler);
        return () => socket.off(event, handler);
      }
      return undefined;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socket, connected, event]);
  };

  const notifyScreenUpdate = (action, data) => {
    if (socket && connected) {
      socket.emit('screen-update', { action, data });
    }
  };

  const notifyDesignUpdate = (action, data) => {
    if (socket && connected) {
      socket.emit('design-update', { action, data });
    }
  };

  const value = {
    socket,
    connected,
    joinScreen,
    leaveScreen,
    emit,
    on,
    once,
    off,
    useSocketEvent,
    notifyScreenUpdate,
    notifyDesignUpdate
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
