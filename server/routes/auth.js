const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// El login directo del backend queda deshabilitado: la sesion la maneja Supabase Auth.
router.post('/login', async (req, res) => {
  res.status(410).json({
    error: 'El login local fue deshabilitado. Usa Supabase Auth desde el frontend.'
  });
});

// Verificar token.
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    valid: true,
    user: req.user
  });
});

// El cambio de contrasena se maneja del lado cliente con Supabase Auth.
router.post('/change-password', authenticateToken, async (req, res) => {
  res.status(400).json({
    error: 'La contrasena debe cambiarse usando Supabase Auth desde el cliente autenticado.'
  });
});

// Logout.
router.post('/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Logout exitoso' });
});

module.exports = router;
