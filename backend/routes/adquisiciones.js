const express = require('express');
const router = express.Router();
const db = require('../db');
const verificarToken = require('../middleware/authMiddleware');
const verificarAdmin = require('../middleware/adminMiddleware');

// POST /comprar (Usuario compra)
router.post('/comprar', verificarToken, async (req, res) => {
    const { items } = req.body;
    const id_usuario = req.usuario.id;

    if (!items || items.length === 0) return res.status(400).json({ error: 'Carro vacío' });

    try {
        for (const item of items) {
            // Verificar si ya lo tiene comprado
            const [existe] = await db.query('SELECT * FROM adquisiciones WHERE id_usuario = ? AND id_libro = ?', [id_usuario, item.id]);
            
            if (existe.length === 0) {
                // 1. Guardamos la compra (INSERT)
                await db.query('INSERT INTO adquisiciones (id_usuario, id_libro, monto_pagado) VALUES (?, ?, ?)', [id_usuario, item.id, item.precio]);

                // 2. 🔥 NUEVO: Borramos de la lista de deseados automáticamente
                await db.query('DELETE FROM deseados WHERE id_usuario = ? AND id_libro = ?', [id_usuario, item.id]);
            }
        }
        res.status(201).json({ mensaje: 'Compra exitosa' });
    } catch (error) {
        console.error(error); // Agregué el console.error para que veas si algo falla
        res.status(500).json({ error: 'Error en la compra' });
    }
});

// GET /mis-libros (Usuario ve SU historial)
router.get('/mis-libros', verificarToken, async (req, res) => {
    try {
        const sql = `SELECT L.*, A.fecha_compra FROM adquisiciones A JOIN libros L ON A.id_libro = L.id WHERE A.id_usuario = ? ORDER BY A.fecha_compra DESC`;
        const [rows] = await db.query(sql, [req.usuario.id]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error interno' });
    }
});

// GET /check/:idLibro (Verificar compra individual)
router.get('/check/:idLibro', verificarToken, async (req, res) => {
    const [rows] = await db.query('SELECT * FROM adquisiciones WHERE id_usuario = ? AND id_libro = ?', [req.usuario.id, req.params.idLibro]);
    res.json({ comprado: rows.length > 0 });
});

// GET / (Admin ve TODAS las ventas)
router.get('/', [verificarToken, verificarAdmin], async (req, res) => {
    try {
        // Hacemos JOIN con usuarios y libros para saber QUIÉN compró QUÉ
        const sql = `
            SELECT 
                A.id,
                A.fecha_compra,
                A.monto_pagado,
                U.nombre AS usuario,
                U.email,
                L.titulo AS libro
            FROM adquisiciones A
            JOIN usuarios U ON A.id_usuario = U.id
            JOIN libros L ON A.id_libro = L.id
            ORDER BY A.fecha_compra DESC
        `;
        const [ventas] = await db.query(sql);
        res.json(ventas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener el historial de ventas' });
    }
});

module.exports = router;