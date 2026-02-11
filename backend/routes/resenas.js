const express = require('express');
const router = express.Router();
const db = require('../db');
const verificarToken = require('../middleware/authMiddleware');

// POST /
router.post('/', verificarToken, async (req, res) => {
    try {
        const { id_libro, calificacion, comentario } = req.body;
        await db.query('INSERT INTO Resenas (id_usuario, id_libro, calificacion, comentario) VALUES (?, ?, ?, ?)', [req.usuario.id, id_libro, calificacion, comentario]);
        res.status(201).json({ mensaje: 'Reseña guardada' });
    } catch (e) {
        res.status(400).json({ error: 'Error o ya opinaste' });
    }
});

// GET /:id_libro
router.get('/:id_libro', async (req, res) => {
    const [rows] = await db.query('SELECT R.*, U.nombre as autor_resena FROM Resenas R JOIN Usuarios U ON R.id_usuario = U.id WHERE R.id_libro = ? ORDER BY R.fecha DESC', [req.params.id_libro]);
    res.json(rows);
});

module.exports = router;