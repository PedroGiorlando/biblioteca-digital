const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const verificarToken = require('../middleware/authMiddleware');
const verificarAdmin = require('../middleware/adminMiddleware');

// Configuración de Multer para libros
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'libro-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// RUTAS 

// GET / (Listar)
router.get('/', async (req, res) => {
    try {
        const { q, categoria } = req.query;
        const page = parseInt(req.query.page || '1', 10);
        const limit = 12;
        const offset = (page - 1) * limit;

        let whereClause = ' WHERE activo = TRUE';
        const params = [];

        if (q) {
            whereClause += ' AND (titulo LIKE ? OR autor LIKE ?)';
            const searchTerm = `%${q}%`;
            params.push(searchTerm, searchTerm);
        }
        if (categoria) {
            whereClause += ' AND categoria = ?';
            params.push(categoria);
        }

        const sqlCount = `SELECT COUNT(*) AS totallibros FROM libros${whereClause}`;
        const [ [countResult] ] = await db.query(sqlCount, params);
        const totallibros = countResult.totallibros;
        const totalPages = Math.ceil(totallibros / limit);

        const sqlSelect = `SELECT * FROM libros${whereClause} ORDER BY titulo LIMIT ? OFFSET ?`;
        const paramsSelect = [...params, limit, offset];
        const [libros] = await db.query(sqlSelect, paramsSelect);

        res.json({ libros, totalPages, currentPage: page });
    } catch (error) {
        res.status(500).json({ error: 'Error interno' });
    }
});

// GET /:id (Detalle)
router.get('/:id', async (req, res) => {
    try {
        const [libros] = await db.query('SELECT * FROM libros WHERE id = ? AND activo = TRUE', [req.params.id]);
        if (libros.length === 0) return res.status(404).json({ error: 'Libro no encontrado' });
        res.json(libros[0]);
    } catch (error) {
        res.status(500).json({ error: 'Error interno' });
    }
});

// POST / (Crear - Admin)
router.post('/', [verificarToken, verificarAdmin, upload.single('portada')], async (req, res) => {
    try {
        const { titulo, autor, categoria, descripcion, fecha_publicacion } = req.body;
        let portada_url = null;
        if (req.file) portada_url = req.file.path.replace(/\\/g, "/");

        const [result] = await db.query(
            'INSERT INTO libros (titulo, autor, categoria, descripcion, fecha_publicacion, portada_url) VALUES (?, ?, ?, ?, ?, ?)',
            [titulo, autor, categoria || null, descripcion || null, fecha_publicacion || null, portada_url]
        );
        res.status(201).json({ mensaje: 'Libro creado', idLibro: result.insertId });
    } catch (error) {
        res.status(500).json({ error: 'Error interno' });
    }
});

// PUT /:id (Editar - Admin)
router.put('/:id', [verificarToken, verificarAdmin, upload.single('portada')], async (req, res) => {
    try {
        const { titulo, autor, categoria, descripcion, fecha_publicacion } = req.body;
        let portada_url = null;
        if (req.file) portada_url = req.file.path.replace(/\\/g, "/");

        let sql = 'UPDATE libros SET titulo=?, autor=?, categoria=?, descripcion=?, fecha_publicacion=?';
        const params = [titulo, autor, categoria, descripcion, fecha_publicacion || null];
        if (portada_url) {
            sql += ', portada_url=?';
            params.push(portada_url);
        }
        sql += ' WHERE id=?';
        params.push(req.params.id);

        await db.query(sql, params);
        res.json({ mensaje: 'Libro actualizado' });
    } catch (error) {
        res.status(500).json({ error: 'Error interno' });
    }
});

// DELETE /:id (Borrar lógico - Admin)
router.delete('/:id', [verificarToken, verificarAdmin], async (req, res) => {
    await db.query('UPDATE libros SET activo = FALSE WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Libro eliminado logicamente' });
});

// GET /:id/relacionados (Obtener 3 libros de la misma categoría)
router.get('/:id/relacionados', async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Primero averiguamos la categoría del libro actual
        const [libroActual] = await db.query('SELECT categoria FROM libros WHERE id = ?', [id]);
        
        if (libroActual.length === 0) return res.status(404).json({ error: 'Libro no encontrado' });
        
        const categoria = libroActual[0].categoria;

        // 2. Buscamos otros libros de esa misma categoría, EXCLUYENDO el actual
        // LIMIT 3 para no saturar
        const sql = `
            SELECT * FROM libros 
            WHERE categoria = ? AND id != ? AND activo = TRUE 
            ORDER BY RAND() 
            LIMIT 3
        `;
        
        const [relacionados] = await db.query(sql, [categoria, id]);
        res.json(relacionados);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener relacionados' });
    }
});

module.exports = router;