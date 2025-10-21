// 1. Importar Express
const express = require('express');

// 2. Creo la instancia de Express
const app = express();

// 3. Definimos puerto
const PORT = 3000;

// 4. Definir una "ruta" de prueba (la ruta raíz '/')
// app.get() significa que responderá a una petición GET (la que usa el navegador)
// (req, res) son "request" (lo que llega) y "response" (lo que enviamos)
app.get('/', (req, res) => {
    res.send('¡Hola Biblioteca Digital!');
});

// 5. Poner el servidor a "escuchar" en el puerto definido
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});