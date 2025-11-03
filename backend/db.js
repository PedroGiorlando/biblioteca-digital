// backend/db.js
const mysql = require('mysql2');

// Creamos un "pool" de conexiones.
// Es más eficiente que crear una conexión nueva cada vez.
const pool = mysql.createPool({
    host: 'localhost',      // Tu servidor de MySQL está en tu máquina
    user: 'root',           // El usuario que creaste
    password: 'root', // LA CONTRASEÑA que pusiste al instalar MySQL
    database: 'biblioteca_digital' // El nombre de la BD que acabamos de crear
});

// Exportamos una versión del pool que usa "promesas"
// Esto hará nuestro código mucho más limpio en el futuro.
module.exports = pool.promise();