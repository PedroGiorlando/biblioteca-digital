const jwt = require('jsonwebtoken');

// Esta es nuestra función "guardiana"
const verificarToken = (req, res, next) => {
    // 1. Obtener el token del "header" (encabezado) de la petición
    // El formato estándar es: "Authorization: Bearer <token>"
    const authHeader = req.headers.authorization;

    // 2. Comprobar si el token fue enviado
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Acceso denegado. No se proporcionó token.' });
    }

    try {
        // 3. Extraer el token (quitando "Bearer ")
        const token = authHeader.split(' ')[1]; // [ 'Bearer', '<token>' ]

        // 4. Verificar el token usando nuestra palabra secreta
        const payload = jwt.verify(token, 'miPalabraSecretaSuperSecreta123');

        // 5. ¡IMPORTANTE! Añadimos el "payload" (con id y rol) al objeto 'req'
        // para que las rutas que SÍGAN después puedan saber QUIÉN es el usuario.
        req.usuario = payload;

        // 6. Si todo está bien, llamamos a next() para que la petición continúe
        next();

    } catch (error) {
        // 7. Si el token no es válido (firmada mal, expirado, etc.)
        res.status(401).json({ error: 'Token no válido.' });
    }
};

// Exportamos la función para poder usarla en index.js
module.exports = verificarToken;