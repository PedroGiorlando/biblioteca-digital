const mysql = require('mysql2');

// Creamos un "pool" de conexiones.
// Es más eficiente que crear una conexión nueva cada vez.
const pool = mysql.createPool({
    host: 'localhost',      
    user: 'root',         
    password: 'root', 
    database: 'biblioteca_digital' 
});

// Exportamos una versión del pool que usa "promesas"
// Esto hará nuestro código mucho más limpio en el futuro.
module.exports = pool.promise();