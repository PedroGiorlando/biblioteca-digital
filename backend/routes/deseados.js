const express = require('express');
const router = express.Router();
const db = require('../db');
const verificarToken = require('../middleware/authMiddleware');

// GET / (Ver mi wishlist)
router.get('/', verificarToken, async (req, res) => {
    try {
        const sql = `
            SELECT L.* FROM Deseados D
            JOIN Libros L ON D.id_libro = L.id
            WHERE D.id_usuario = ?
            AND L.activo = 1 
        `;
        // Explicación: 'AND L.activo = 1' filtra los libros que fueron dados de baja
        
        const [rows] = await db.query(sql, [req.usuario.id]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener deseados' });
    }
});

// POST / (Agregar a wishlist)
router.post('/', verificarToken, async (req, res) => {
    try {
        const { id_libro } = req.body;
        // Evitar duplicados
        const [existe] = await db.query(
            'SELECT * FROM Deseados WHERE id_usuario = ? AND id_libro = ?',
            [req.usuario.id, id_libro]
        );

        if (existe.length === 0) {
            await db.query('INSERT INTO Deseados (id_usuario, id_libro) VALUES (?, ?)', [req.usuario.id, id_libro]);
        }
        
        res.status(201).json({ mensaje: 'Agregado a deseados' });
    } catch (error) {
        res.status(500).json({ error: 'Error interno' });
    }
});

// DELETE /:id_libro (Quitar de wishlist)
router.delete('/:id_libro', verificarToken, async (req, res) => {
    try {
        await db.query(
            'DELETE FROM Deseados WHERE id_usuario = ? AND id_libro = ?',
            [req.usuario.id, req.params.id_libro]
        );
        res.json({ mensaje: 'Eliminado de deseados' });
    } catch (error) {
        res.status(500).json({ error: 'Error interno' });
    }
});

// GET /check/:id_libro (Para pintar el corazón en el frontend)
router.get('/check/:id_libro', verificarToken, async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM Deseados WHERE id_usuario = ? AND id_libro = ?',
            [req.usuario.id, req.params.id_libro]
        );
        res.json({ esDeseado: rows.length > 0 });
    } catch (error) {
        res.status(500).json({ error: 'Error interno' });
    }
});

module.exports = router; 