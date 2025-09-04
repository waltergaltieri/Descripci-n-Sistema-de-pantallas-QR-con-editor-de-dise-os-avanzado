const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config();

const db = require('./config/database');
const authRoutes = require('./routes/auth');
const screensRoutes = require('./routes/screens');
const designsRoutes = require('./routes/designs');
const uploadsRoutes = require('./routes/uploads');
const exportRoutes = require('./routes/export');
const figuresSeparationRoutes = require('./routes/figuresSeparation');
const autoSvgExportRoutes = require('./routes/autoSvgExport');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Rate limiting - more permissive in development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // More permissive in development
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for development
    return process.env.NODE_ENV !== 'production';
  }
});

// Middleware
app.use(helmet());
app.use(limiter);
app.use(cors());
app.use(express.json({ limit: '100mb', parameterLimit: 50000 }));
app.use(express.urlencoded({ extended: true, limit: '100mb', parameterLimit: 50000 }));

// Logging middleware removido - debugging completado

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/screens', screensRoutes);
app.use('/api/designs', designsRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/figures-separation', figuresSeparationRoutes);
app.use('/api/auto-svg-export', autoSvgExportRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  
  // Join screen room for real-time updates
  socket.on('join-screen', (screenId) => {
    socket.join(`screen-${screenId}`);
    console.log(`Cliente ${socket.id} se unió a la pantalla ${screenId}`);
  });
  
  // Leave screen room
  socket.on('leave-screen', (screenId) => {
    socket.leave(`screen-${screenId}`);
    console.log(`Cliente ${socket.id} dejó la pantalla ${screenId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Make io available to routes
app.set('io', io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo salió mal!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Initialize database and start server
async function startServer() {
  try {
    await db.initialize();
    console.log('Base de datos inicializada correctamente');
    
    server.listen(PORT, () => {
      console.log(`Servidor ejecutándose en puerto ${PORT}`);
      console.log(`Modo: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Error al inicializar el servidor:', error);
    process.exit(1);
  }
}

startServer();

module.exports = { app, io };