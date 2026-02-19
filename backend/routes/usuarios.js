const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); 
const verificarToken = require('../middleware/authMiddleware');
const verificarAdmin = require('../middleware/adminMiddleware'); 
const multer = require('multer');
const path = require('path');

// --- CONFIGURACIÓN MULTER (FOTO PERFIL) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'foto-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// ==========================================
//             RUTAS DE AUTENTICACIÓN
// ==========================================

// 1. REGISTRO
// OJO: Aquí ponemos solo '/registro', NO '/api/usuarios/registro'
router.post('/registro', async (req, res) => {
    try {
        const { nombre, email, password } = req.body;
        if (!nombre || !email || !password) {
            return res.status(400).json({ error: 'Faltan datos' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const sql = 'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)';
        const [result] = await db.query(sql, [nombre, email, hashedPassword]);
        
        res.status(201).json({ mensaje: 'Usuario registrado', idUsuario: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'El email ya existe' });
        }
        res.status(500).json({ error: 'Error interno' });
    }
});

// 2. LOGIN
// OJO: Aquí ponemos solo '/login'
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Faltan datos' });

        const [usuarios] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
        if (usuarios.length === 0) return res.status(401).json({ error: 'Credenciales inválidas' });

        const usuario = usuarios[0];
        const passwordCorrecta = await bcrypt.compare(password, usuario.password);
        if (!passwordCorrecta) return res.status(401).json({ error: 'Credenciales inválidas' });

        const payload = { id: usuario.id, rol: usuario.rol };
        const token = jwt.sign(payload, 'miPalabraSecretaSuperSecreta123', { expiresIn: '1h' });

        res.status(200).json({
            mensaje: 'Login exitoso',
            token: token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol,
                foto_url: usuario.foto_url
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno' });
    }
});

// ==========================================
//             RUTAS DE PERFIL Y GESTIÓN
// ==========================================

// 3. ACTUALIZAR PERFIL (CON FOTO)
router.put('/perfil', verificarToken, upload.single('foto'), async (req, res) => {
    const id_usuario = req.usuario.id;
    const { nombre } = req.body;
    let foto_url = null;

    try {
        if (req.file) foto_url = req.file.path.replace(/\\/g, "/");

        let sql = 'UPDATE usuarios SET nombre = ?';
        const params = [nombre];

        if (foto_url) {
            sql += ', foto_url = ?';
            params.push(foto_url);
        }
        sql += ' WHERE id = ?';
        params.push(id_usuario);

        await db.query(sql, params);
        
        // Devolvemos los datos actualizados
        res.json({ 
            mensaje: 'Perfil actualizado', 
            usuario: { id: id_usuario, nombre, foto_url } 
        });

    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar perfil' });
    }
});

// 4. CAMBIAR PASSWORD
router.put('/password', verificarToken, async (req, res) => {
    try {
        const { passwordActual, passwordNueva } = req.body;
        const [u] = await db.query('SELECT * FROM usuarios WHERE id=?', [req.usuario.id]);
        const valida = await bcrypt.compare(passwordActual, u[0].password);
        if(!valida) return res.status(400).json({ error: 'Pass actual incorrecta' });

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(passwordNueva, salt);
        await db.query('UPDATE usuarios SET password=? WHERE id=?', [hash, req.usuario.id]);
        res.json({ mensaje: 'Pass actualizada' });
    } catch(e) { res.status(500).json({error: 'Error'}); }
});

// GET / (Listar usuarios con filtro de búsqueda)
router.get('/', [verificarToken, verificarAdmin], async (req, res) => {
    try {
        const { q } = req.query; // Leemos lo que viene en la URL (?q=pedro)
        
        let sql = 'SELECT id, nombre, email, rol, foto_url FROM usuarios';
        const params = [];

        // Si hay búsqueda, agregamos el WHERE
        if (q) {
            sql += ' WHERE nombre LIKE ? OR email LIKE ?';
            const termino = `%${q}%`; // Los % son para buscar coincidencias parciales
            params.push(termino, termino);
        }

        sql += ' LIMIT 20'; // Límite por seguridad

        const [users] = await db.query(sql, params);
        res.json({ usuarios: users }); 
    } catch(e) { 
        console.error(e);
        res.status(500).json({error: 'Error al buscar usuarios'}); 
    }
});

// --- ADMIN CAMBIA ROL ---
// PUT /:id (Ej: /api/usuarios/8)
router.put('/:id', [verificarToken, verificarAdmin], async (req, res) => {
    try {
        const { id } = req.params; // El ID del usuario a modificar (ej: 8)
        const { rol } = req.body;  // El nuevo rol (ej: 'Administrador')

        // 1. Validar que el rol sea correcto
        if (!['Administrador', 'Usuario Registrado'].includes(rol)) {
            return res.status(400).json({ error: 'Rol no válido' });
        }

        // 2. Seguridad: Evitar que el admin se quite el rol a sí mismo por error
        // Comparamos el ID del token (req.usuario.id) con el ID de la URL (id)
        if (Number(req.usuario.id) === Number(id)) {
            return res.status(400).json({ error: 'No puedes cambiar tu propio rol aquí.' });
        }

        // 3. Actualizar en la Base de Datos
        const sql = 'UPDATE usuarios SET rol = ? WHERE id = ?';
        const [result] = await db.query(sql, [rol, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({ mensaje: 'Rol actualizado exitosamente' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno al cambiar rol' });
    }
});
// --- RUTA PARA ACTUALIZAR MI PROPIO PERFIL (Nombre y Foto) ---
// PUT /perfil
router.put('/perfil', [verificarToken, upload.single('foto')], async (req, res) => {
    try {
        const idUsuario = req.usuario.id;
        const { nombre } = req.body;
        let sql, params;

        // 1. Si subió una foto nueva
        if (req.file) {
            // Guardamos la ruta relativa (ej: 'uploads/foto-123.jpg')
            const fotoUrl = req.file.path.replace(/\\/g, "/"); // Fix para Windows
            
            sql = 'UPDATE usuarios SET nombre = ?, foto_url = ? WHERE id = ?';
            params = [nombre, fotoUrl, idUsuario];

        } else {
            // 2. Si solo cambió el nombre (sin foto nueva)
            sql = 'UPDATE usuarios SET nombre = ? WHERE id = ?';
            params = [nombre, idUsuario];
        }

        await db.query(sql, params);

        // 3. ¡IMPORTANTE! Devolver los datos actualizados al frontend
        // Hacemos un SELECT rápido para devolver el usuario fresco
        const [rows] = await db.query('SELECT id, nombre, email, rol, foto_url FROM usuarios WHERE id = ?', [idUsuario]);
        
        res.json({ 
            mensaje: 'Perfil actualizado', 
            usuario: rows[0] 
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar perfil' });
    }
});

module.exports = router;