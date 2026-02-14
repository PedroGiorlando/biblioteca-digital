const jwt = require('jsonwebtoken');
require('dotenv').config(); // <--- 1. IMPORTANTE: Agrega esto para leer el .env

const verificarToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Acceso denegado. No se proporcionó token.' });
    }

    try {
        const token = authHeader.split(' ')[1];

        // 2. CAMBIO AQUÍ: En lugar del texto fijo, usamos la variable de entorno
        const payload = jwt.verify(token, process.env.JWT_SECRET);

        req.usuario = payload;
        next();

    } catch (error) {
        console.error("Error de token:", error.message); // Tip: Agrega esto para ver por qué falla en consola
        res.status(401).json({ error: 'Token no válido.' });
    }
};

module.exports = verificarToken;