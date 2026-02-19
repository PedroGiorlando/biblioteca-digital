const express = require('express');
const cors = require('cors');
const path = require('path');

const usuariosRoutes = require('./routes/usuarios');      // Login, Perfil, usuarios
const librosRoutes = require('./routes/libros');          // Catálogo y Gestión
const resenasRoutes = require('./routes/resenas');        // Opiniones
const adquisicionesRoutes = require('./routes/adquisiciones'); // Compras (El corazón del negocio)
const deseadosRoutes = require('./routes/deseados');      // Wishlist
const adminRoutes = require('./routes/admin');            // Dashboard

const app = express();

// Middlewares Globales
app.use(cors());
app.use(express.json());

// Carpeta uploads pública (Para ver las fotos)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- CONECTAR RUTAS ---
app.use('/api/usuarios', usuariosRoutes);       
app.use('/api/libros', librosRoutes);           
app.use('/api/resenas', resenasRoutes);         
app.use('/api/adquisiciones', adquisicionesRoutes);
app.use('/api/deseados', deseadosRoutes);
app.use('/api/admin', adminRoutes);             

app.use('/api', adminRoutes);                   

// Ruta Base
app.get('/', (req, res) => res.send('API Biblioteca Digital (E-commerce) Funcionando 🚀'));

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});