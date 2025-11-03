// backend/middleware/adminMiddleware.js

const verificarAdmin = (req, res, next) => {
    // IMPORTANTE: Este middleware debe correr SIEMPRE DESPUÉS de "verificarToken".
    // Confiamos en que "req.usuario" ya fue añadido por el middleware anterior.

    if (!req.usuario) {
        // Esto es un error de servidor (mala configuración de rutas), no del cliente
        return res.status(500).json({ error: 'Error de autenticación interna.' });
    }

    if (req.usuario.rol !== 'Administrador') {
        return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de Administrador.' });
    }

    // Si llegó hasta aquí, es un Admin. ¡Adelante!
    next();
};

module.exports = verificarAdmin;