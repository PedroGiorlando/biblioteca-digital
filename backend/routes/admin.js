const express = require('express');
const router = express.Router();
const db = require('../db');
const verificarToken = require('../middleware/authMiddleware');
const verificarAdmin = require('../middleware/adminMiddleware');

// GET /stats (Dashboard)
router.get('/stats', [verificarToken, verificarAdmin], async (req, res) => {
    try {
        // 1. Total Usuarios
        const [ [u] ] = await db.query('SELECT COUNT(*) as t FROM Usuarios');
        
        // 2. Total Libros en Catálogo
        const [ [l] ] = await db.query('SELECT COUNT(*) as t FROM Libros WHERE activo=1');
        
        // 3. CAMBIO: Total Ventas (Cantidad de libros vendidos)
        const [ [v] ] = await db.query('SELECT COUNT(*) as t FROM Adquisiciones');

        // 4. CAMBIO: Ganancias Totales (Suma del dinero)
        const [ [g] ] = await db.query('SELECT SUM(monto_pagado) as t FROM Adquisiciones');
        
        res.json({ 
            totalUsuarios: u.t, 
            totalLibros: l.t, 
            totalVentas: v.t, 
            gananciasTotales: g.t || 0 // Si es null, devuelve 0
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});

// GET /categorias
router.get('/categorias', async (req, res) => {
    const [rows] = await db.query('SELECT DISTINCT categoria FROM Libros WHERE categoria IS NOT NULL');
    res.json(rows.map(r => r.categoria));
});

// GET /reportes/top-libros (Los 5 libros más vendidos)
router.get('/reportes/top-libros', [verificarToken, verificarAdmin], async (req, res) => {
    try {
        const sql = `
            SELECT 
                L.titulo, 
                COUNT(A.id) as total_ventas,
                SUM(A.monto_pagado) as ingresos_generados
            FROM Adquisiciones A
            JOIN Libros L ON A.id_libro = L.id
            GROUP BY L.id, L.titulo
            ORDER BY total_ventas DESC
            LIMIT 5
        `;
        const [rows] = await db.query(sql);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener top libros' });
    }
});

// GET /reportes/top-usuarios (Los 5 clientes que más gastaron)
router.get('/reportes/top-usuarios', [verificarToken, verificarAdmin], async (req, res) => {
    try {
        const sql = `
            SELECT 
                U.nombre, 
                U.email,
                COUNT(A.id) as libros_comprados,
                SUM(A.monto_pagado) as total_gastado
            FROM Adquisiciones A
            JOIN Usuarios U ON A.id_usuario = U.id
            GROUP BY U.id, U.nombre, U.email
            ORDER BY total_gastado DESC
            LIMIT 5
        `;
        const [rows] = await db.query(sql);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener top usuarios' });
    }
});

module.exports = router;