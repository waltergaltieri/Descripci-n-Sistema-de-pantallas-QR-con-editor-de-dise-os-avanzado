const { db } = require('../config/database');
const { resolveAuthenticatedAppUser } = require('../utils/supabaseAuth');

const extractBearerToken = (req) => {
  const authHeader = req.headers['authorization'];
  return authHeader && authHeader.split(' ')[1];
};

const tryResolveSupabaseUser = async (token) => {
  if (!token) {
    return null;
  }

  return resolveAuthenticatedAppUser({
    accessToken: token,
    dbConnection: db()
  });
};

// Middleware para verificar token de Supabase y resolver el perfil de aplicacion.
const authenticateToken = async (req, res, next) => {
  const token = extractBearerToken(req);

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  try {
    const supabaseUser = await tryResolveSupabaseUser(token);

    if (!supabaseUser) {
      return res.status(401).json({
        error: 'Sesion invalida o no registrada en Supabase Auth'
      });
    }

    req.user = supabaseUser;
    next();
  } catch (error) {
    console.error('Error en autenticacion:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Middleware para verificar rol de administrador.
const requireAdmin = (req, res, next) => {
  const isSuperAdmin = req.user?.actorType === 'super_admin';
  const isBusinessOwner = req.user?.actorType === 'business_user' && ['owner', 'admin'].includes(req.user?.role);

  if (!isSuperAdmin && !isBusinessOwner) {
    return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador.' });
  }

  next();
};

// Middleware opcional de autenticacion para rutas publicas.
const optionalAuth = async (req, res, next) => {
  const token = extractBearerToken(req);

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    req.user = await tryResolveSupabaseUser(token);
  } catch (error) {
    req.user = null;
  }

  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  optionalAuth
};
