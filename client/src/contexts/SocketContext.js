import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

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
  const { user, token } = useAuth();

  useEffect(() => {
    // Solo conectar si hay un usuario autenticado
    if (user && token) {
      const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000', {
        auth: {
          token
        },
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
        console.error('Error de conexión Socket.io:', error);
        setConnected(false);
      });

      // Eventos globales del sistema
      newSocket.on('screens-updated', (data) => {
        console.log('Pantallas actualizadas:', data);
        // Este evento será manejado por los componentes específicos
      });

      newSocket.on('designs-updated', (data) => {
        console.log('Diseños actualizados:', data);
        // Este evento será manejado por los componentes específicos
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
        setSocket(null);
        setConnected(false);
      };
    } else {
      // Si no hay usuario, cerrar conexión existente
      if (socket) {
        socket.close();
        setSocket(null);
        setConnected(false);
      }
    }
  }, [user, token]);

  // Función para unirse a una sala de pantalla específica
  const joinScreen = (screenId) => {
    if (socket && connected) {
      socket.emit('join-screen', screenId);
      console.log(`Uniéndose a la pantalla ${screenId}`);
    }
  };

  // Función para salir de una sala de pantalla
  const leaveScreen = (screenId) => {
    if (socket && connected) {
      socket.emit('leave-screen', screenId);
      console.log(`Saliendo de la pantalla ${screenId}`);
    }
  };

  // Función para emitir eventos personalizados
  const emit = (event, data) => {
    if (socket && connected) {
      socket.emit(event, data);
    } else {
      console.warn('Socket no conectado. No se puede emitir evento:', event);
    }
  };

  // Función para escuchar eventos
  const on = (event, callback) => {
    if (socket) {
      socket.on(event, callback);
      return () => socket.off(event, callback);
    }
    return () => {};
  };

  // Función para escuchar eventos una sola vez
  const once = (event, callback) => {
    if (socket) {
      socket.once(event, callback);
    }
  };

  // Función para dejar de escuchar eventos
  const off = (event, callback) => {
    if (socket) {
      socket.off(event, callback);
    }
  };

  // Hook personalizado para escuchar eventos específicos
  const useSocketEvent = (event, callback, dependencies = []) => {
    useEffect(() => {
      if (socket && connected) {
        socket.on(event, callback);
        return () => socket.off(event, callback);
      }
    }, [socket, connected, event, ...dependencies]);
  };

  // Función para notificar cambios en pantallas
  const notifyScreenUpdate = (action, data) => {
    if (socket && connected) {
      socket.emit('screen-update', { action, data });
    }
  };

  // Función para notificar cambios en diseños
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

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};