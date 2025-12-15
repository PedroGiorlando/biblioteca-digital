// Importar Express
const express = require('express');
// Importar Cors
const cors = require('cors');
// Importar la db
const db = require('./db');
// Importar bcrypt para hashear passwords
const bcrypt = require('bcryptjs');
// Importar jsonwebtoken para crear tokens
const jwt = require('jsonwebtoken');
// Importar middleware
const verificarToken = require('./middleware/authMiddleware');
const verificarAdmin = require('./middleware/adminMiddleware.js');
const path = require('path'); // Para manejar rutas de archivos
const multer = require('multer'); // Para subir imágenes

// Creo la instancia de Express
const app = express();

app.use(cors()); // <-- Usar CORS para permitir peticiones
app.use(express.json()); // <-- Usar el middleware para "entender" JSON
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- CONFIGURACIÓN DE MULTER (SUBIDA DE IMÁGENES) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Carpeta donde se guardan
    },
    filename: (req, file, cb) => {
        // Creamos un nombre único: fecha + nombre original
        // Ej: 163456789-mi-foto.jpg
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });


// Definimos puerto
const PORT = 3000;

//  Definir una "ruta" de prueba (la ruta raíz '/')
// app.get() significa que responderá a una petición GET (la que usa el navegador)
// (req, res) son "request" (lo que llega) y "response" (lo que enviamos)
app.get('/', (req, res) => {
    res.send('¡Hola Biblioteca Digital!, La API está funcionando.');
});

// Rutas

// Endpoint: GET /api/ruta-protegida (SOLO PARA PROBAR)
// Nota cómo "verificarToken" se pone en el medio, ANTES del (req, res)
app.get('/api/ruta-protegida', verificarToken, (req, res) => {

    // Gracias al middleware, ahora tenemos acceso a "req.usuario"
    res.json({
        mensaje: '¡Felicidades! Has accedido a una ruta protegida.',
        usuarioAutenticado: req.usuario // Devolvemos el payload del token
    });
});
// Endpoint: POST /api/usuarios/registro
// Se usa POST porque vamos a "crear" un nuevo recurso (un usuario)
app.post('/api/usuarios/registro', async (req, res) => {
    try {
        // 1. Obtener los datos del "body" (cuerpo) de la petición
        const { nombre, email, password } = req.body;

        // 2. Validar que los datos llegaron
        if (!nombre || !email || !password) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }

        // 3. Hashear la contraseña
        // "salt" es un valor aleatorio que se añade para que dos contraseñas iguales
        // (ej: "123456") no generen el mismo hash.
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Crear la consulta SQL para insertar el usuario
        // Usamos "rol" por defecto, como definimos en la BD.
        const sql = 'INSERT INTO Usuarios (nombre, email, password) VALUES (?, ?, ?)';

        // 5. Ejecutar la consulta en la BD
        // Usamos [ ] para pasar los valores de forma segura (evita "Inyección SQL")
        const [result] = await db.query(sql, [nombre, email, hashedPassword]);

        // 6. Enviar una respuesta de éxito
        res.status(201).json({
            mensaje: 'Usuario registrado exitosamente',
            idUsuario: result.insertId
        });

    } catch (error) {
        // 7. Manejar errores
        console.error('Error en el registro:', error);

        // Error común: email duplicado (UNIQUE en la BD)
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }

        res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Endpoint: POST /api/usuarios/login
// Se usa POST porque el usuario "envía" credenciales
app.post('/api/usuarios/login', async (req, res) => {
    try {
        // 1. Obtener los datos del "body"
        const { email, password } = req.body;

        // 2. Validar que los datos llegaron
        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
        }

        // 3. Buscar al usuario en la BD por su email
        const sql = 'SELECT * FROM Usuarios WHERE email = ?';
        const [usuarios] = await db.query(sql, [email]);

        // 4. Verificar si el usuario existe
        if (usuarios.length === 0) {
            // Usamos un mensaje genérico por seguridad (no dar pistas a atacantes)
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const usuario = usuarios[0]; // El usuario encontrado

        // 5. Comparar la contraseña enviada con la contraseña "hasheada" de la BD
        const passwordCorrecta = await bcrypt.compare(password, usuario.password);

        if (!passwordCorrecta) {
            // Misma razón de seguridad
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // 6. ¡ÉXITO! El usuario es válido. Ahora, creamos un Token (JWT).
        // El "payload" es la información que guardamos DENTRO del token
        const payload = {
            id: usuario.id,
            rol: usuario.rol
        };

        // 7. Firmar el token con una "palabra secreta"
        // ESTA PALABRA DEBE SER SECRETA Y MÁS COMPLEJA EN PRODUCCIÓN (.env)
        const token = jwt.sign(payload, 'miPalabraSecretaSuperSecreta123', {
            expiresIn: '1h' // El token expira en 1 hora
        });

        // 8. Enviar el token (y datos del usuario) al cliente
        res.status(200).json({
            mensaje: 'Login exitoso',
            token: token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol
            }
        });

    } catch (error) {
        console.error('Error en el login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// ===============================================
//           MÓDULO DE LIBROS (CRUD)
// ===============================================

// Endpoint: GET /api/libros (¡ACTUALIZADO CON PAGINACIÓN!)
app.get('/api/libros', async (req, res) => {
    try {
        // 1. Obtenemos los filtros Y los nuevos parámetros de paginación
        const { q, categoria } = req.query;
        const page = parseInt(req.query.page || '1', 10); // <-- LÍNEA CORREGIDA// Página actual, por defecto 1
        const limit = 10;
        const offset = (page - 1) * limit;

        // 2. Construimos la cláusula WHERE (igual que antes)
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

        // --- ¡NUEVA LÓGICA DE DOBLE CONSULTA! ---

        // 3. CONSULTA 1: Contar el TOTAL de libros (con filtros)
        const sqlCount = `SELECT COUNT(*) AS totalLibros FROM Libros${whereClause}`;
        const [ [countResult] ] = await db.query(sqlCount, params);
        const totalLibros = countResult.totalLibros;
        const totalPages = Math.ceil(totalLibros / limit); // Calcular total de páginas

        // 4. CONSULTA 2: Obtener los libros de la PÁGINA ACTUAL
        const sqlSelect = `SELECT * FROM Libros${whereClause} ORDER BY titulo LIMIT ? OFFSET ?`;

        // Añadimos los parámetros de paginación AL FINAL
        const paramsSelect = [...params, limit, offset];

        const [libros] = await db.query(sqlSelect, paramsSelect);

        // 5. Devolvemos el nuevo objeto de respuesta
        res.status(200).json({
            libros: libros,
            totalPages: totalPages,
            currentPage: page
        });

    } catch (error) {
        console.error('Error al obtener libros:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint: GET /api/libros/:id (Ver detalle de un libro)
// ESTA ES LA VERSIÓN FINAL Y CORRECTA
app.get('/api/libros/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // 3. ¡Nos aseguramos de que busque por ID y TAMBIÉN por ACTIVO!
        const sql = 'SELECT * FROM Libros WHERE id = ? AND activo = TRUE';
        const [libros] = await db.query(sql, [id]);

        if (libros.length === 0) {
            return res.status(404).json({ error: 'Libro no encontrado o inactivo.' });
        }
        res.status(200).json(libros[0]);

    } catch (error) {
        console.error('Error al obtener el libro:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Endpoint: POST /api/libros (Crear libro CON FOTO)
app.post('/api/libros', [verificarToken, verificarAdmin, upload.single('portada')], async (req, res) => {
    try {
        // Ahora los datos vienen en req.body (como strings) y el archivo en req.file
        const { titulo, autor, categoria, descripcion, fecha_publicacion } = req.body;
        let portada_url = null;

        // Validaciones básicas
        if (!titulo || !autor) {
            return res.status(400).json({ error: 'El título y el autor son obligatorios.' });
        }

        // Procesar la imagen si existe
        if (req.file) {
            portada_url = req.file.path.replace(/\\/g, "/");
        }

        const sql = `
      INSERT INTO Libros (titulo, autor, categoria, descripcion, fecha_publicacion, portada_url) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;

        // Nota: fecha_publicacion puede venir como string vacío "", lo convertimos a null si es necesario
        const fechaFinal = fecha_publicacion || null;

        const [result] = await db.query(sql, [
            titulo, autor, categoria || null, descripcion || null, fechaFinal, portada_url
        ]);

        res.status(201).json({
            mensaje: 'Libro creado exitosamente',
            idLibro: result.insertId
        });

    } catch (error) {
        console.error('Error al crear el libro:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});


// ¡Ruta protegida!
// Endpoint: PUT /api/libros/:id (Actualizar libro CON FOTO)
app.put('/api/libros/:id', [verificarToken, verificarAdmin, upload.single('portada')], async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, autor, categoria, descripcion, fecha_publicacion } = req.body;
        let portada_url = null;

        if (req.file) {
            portada_url = req.file.path.replace(/\\/g, "/");
        }

        // Lógica dinámica: Solo actualizamos la portada si el usuario subió una nueva.
        // Si no subió nada (portada_url es null), mantenemos la que ya estaba.

        let sql = 'UPDATE Libros SET titulo=?, autor=?, categoria=?, descripcion=?, fecha_publicacion=?';
        const params = [titulo, autor, categoria, descripcion, fecha_publicacion || null];

        if (portada_url) {
            sql += ', portada_url=?'; // Agregamos campo a actualizar
            params.push(portada_url);
        }

        sql += ' WHERE id=?';
        params.push(id);

        const [result] = await db.query(sql, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Libro no encontrado.' });
        }

        res.status(200).json({ mensaje: 'Libro actualizado exitosamente.' });

    } catch (error) {
        console.error('Error al actualizar el libro:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint: DELETE /api/libros/:id (BAJA LÓGICA)
app.delete('/api/libros/:id', [verificarToken, verificarAdmin], async (req, res) => {
    try {
        const { id } = req.params;

        // ¡Ya no borramos! Solo actualizamos el estado
        const sql = 'UPDATE Libros SET activo = FALSE WHERE id = ?';
        const [result] = await db.query(sql, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Libro no encontrado.' });
        }

        res.status(200).json({ mensaje: 'Libro marcado como inactivo (baja lógica).' });

    } catch (error) {
        console.error('Error en la baja lógica del libro:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ===============================================
//           MÓDULO DE PRÉSTAMOS
// ===============================================

// Endpoint: POST /api/prestamos (Usuario solicita un préstamo)
// ¡LÓGICA MEJORADA! (Evita duplicados activos)
app.post('/api/prestamos', verificarToken, async (req, res) => {
    try {
        // 1. Obtenemos los IDs
        const { id_libro } = req.body;
        const id_usuario = req.usuario.id;

        // 2. Validación
        if (!id_libro) {
            return res.status(400).json({ error: 'Se requiere el ID del libro.' });
        }

        // 3. (Opcional) Verificar si el libro existe
        const [libros] = await db.query('SELECT * FROM Libros WHERE id = ?', [id_libro]);
        if (libros.length === 0) {
            return res.status(404).json({ error: 'El libro solicitado no existe.' });
        }

        // --- INICIO DE NUESTRA LÓGICA DE NEGOCIO ---

        // 4. Revisamos si ESE usuario ya tiene ESE libro en estado "Activo"
        const sqlCheck = 'SELECT * FROM Prestamos WHERE id_usuario = ? AND id_libro = ? AND estado = "Activo"';
        const [prestamosActivos] = await db.query(sqlCheck, [id_usuario, id_libro]);

        // 5. Si la consulta devuelve algo (length > 0), bloqueamos
        if (prestamosActivos.length > 0) {
            return res.status(400).json({
                error: 'Ya tienes un préstamo activo para este libro. No puedes volver a solicitarlo hasta que lo devuelvas.'
            });
        }

        // --- FIN DE LA LÓGICA DE NEGOCIO ---

        // 6. Si llegamos aquí, ¡luz verde! Creamos el préstamo.
        const sqlInsert = 'INSERT INTO Prestamos (id_usuario, id_libro) VALUES (?, ?)';
        const [result] = await db.query(sqlInsert, [id_usuario, id_libro]);

        // 7. Enviar respuesta de éxito
        res.status(201).json({
            mensaje: 'Préstamo registrado exitosamente',
            idPrestamo: result.insertId
        });

    } catch (error) {
        console.error('Error al registrar el préstamo:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint: GET /api/prestamos/mis-prestamos (Ver historial del propio usuario)
// Ruta protegida, para cualquier usuario logueado
app.get('/api/prestamos/mis-prestamos', verificarToken, async (req, res) => {
    try {
        // 1. Obtenemos el ID del usuario (del TOKEN)
        const id_usuario = req.usuario.id;

        // 2. Esta es la consulta clave.
        // Hacemos un "JOIN" para combinar la tabla Prestamos con la tabla Libros
        // y así obtener los detalles del libro (ej. título, autor).
        const sql = `
            SELECT
                P.id AS id_prestamo,
                P.id_libro,  
                P.fecha_prestamo,
                P.fecha_devolucion,
                P.estado,
                L.titulo,
                L.autor,
                L.portada_url
            FROM Prestamos AS P
                     JOIN Libros AS L ON P.id_libro = L.id
            WHERE P.id_usuario = ?
            ORDER BY P.fecha_prestamo DESC
        `;

        // 3. Ejecutar la consulta
        const [prestamos] = await db.query(sql, [id_usuario]);

        // 4. Enviar respuesta
        // Si no tiene préstamos, esto devolverá un array vacío [], lo cual es correcto.
        res.status(200).json(prestamos);

    } catch (error) {
        console.error('Error al obtener mis préstamos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint: GET /api/prestamos/todos (Admin: Ver TODOS los préstamos)
// Ruta protegida, SOLO para Administradores.
app.get('/api/prestamos/todos', [verificarToken, verificarAdmin], async (req, res) => {
    try {
        // 1. Obtenemos filtros y paginación
        const { q } = req.query;
        const page = parseInt(req.query.page || '1', 10);
        const limit = 10; // 10 préstamos por página
        const offset = (page - 1) * limit;

        // 2. Construimos la cláusula WHERE
        let whereClause = '';
        const params = [];

        if (q) {
            // Buscamos en las 3 columnas que pediste
            whereClause = ' WHERE (L.titulo LIKE ? OR U.nombre LIKE ? OR U.email LIKE ?)';
            const searchTerm = `%${q}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        // 3. CONSULTA 1: Contar el TOTAL
        const sqlCount = `SELECT COUNT(P.id) AS totalPrestamos 
                      FROM Prestamos AS P
                      JOIN Libros AS L ON P.id_libro = L.id
                      JOIN Usuarios AS U ON P.id_usuario = U.id
                      ${whereClause}`;
        const [ [countResult] ] = await db.query(sqlCount, params);
        const totalPrestamos = countResult.totalPrestamos;
        const totalPages = Math.ceil(totalPrestamos / limit);

        // 4. CONSULTA 2: Obtener la PÁGINA
        // ¡Nos aseguramos de que U.email esté en el SELECT!
        const sqlSelect = `
      SELECT 
        P.id AS id_prestamo,
        P.fecha_prestamo,
        P.fecha_devolucion,
        P.estado,
        L.titulo AS titulo_libro,
        U.nombre AS nombre_usuario,
        U.email AS email_usuario
      FROM Prestamos AS P
      JOIN Libros AS L ON P.id_libro = L.id
      JOIN Usuarios AS U ON P.id_usuario = U.id
      ${whereClause}
      ORDER BY P.fecha_prestamo DESC
      LIMIT ? OFFSET ?
    `;

        // Añadimos params de paginación
        const paramsSelect = [...params, limit, offset];
        const [prestamos] = await db.query(sqlSelect, paramsSelect);

        // 5. Devolvemos el objeto de respuesta
        res.status(200).json({
            prestamos: prestamos,
            totalPages: totalPages,
            currentPage: page
        });

    } catch (error) {
        console.error('Error al obtener todos los préstamos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint: PUT /api/prestamos/:id (Admin: Actualizar estado de un préstamo)
// Ruta protegida, SOLO para Administradores.
app.put('/api/prestamos/:id', [verificarToken, verificarAdmin], async (req, res) => {
    try {
        const { id } = req.params; // El ID del préstamo
        const { estado } = req.body;   // El nuevo estado (ej: "Devuelto")

        // 1. Validar que el estado sea uno de los permitidos en el ENUM
        const estadosValidos = ['Activo', 'Devuelto', 'Vencido'];
        if (!estado || !estadosValidos.includes(estado)) {
            return res.status(400).json({
                error: 'Estado no válido. Debe ser "Activo", "Devuelto" o "Vencido".'
            });
        }

        // 2. Lógica de negocio:
        // Si el estado es "Devuelto", ponemos la fecha de hoy.
        // Si se revierte a "Activo" o "Vencido", quitamos la fecha de devolución.
        let sql;
        let params;

        if (estado === 'Devuelto') {
            sql = 'UPDATE Prestamos SET estado = ?, fecha_devolucion = CURDATE() WHERE id = ?';
            params = [estado, id];
        } else {
            sql = 'UPDATE Prestamos SET estado = ?, fecha_devolucion = NULL WHERE id = ?';
            params = [estado, id];
        }

        // 3. Ejecutar la consulta
        const [result] = await db.query(sql, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Préstamo no encontrado.' });
        }

        res.status(200).json({ mensaje: 'Estado del préstamo actualizado exitosamente.' });

    } catch (error) {
        console.error('Error al actualizar el préstamo:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Endpoint: PUT /api/prestamos/devolver/:id (Usuario devuelve su propio libro)
app.put('/api/prestamos/devolver/:id', verificarToken, async (req, res) => {
    try {
        const idPrestamo = req.params.id;
        const idUsuario = req.usuario.id; // El ID del token (quien hace la petición)

        // 1. Validar que ese préstamo pertenezca a ESTE usuario y esté Activo
        // (Seguridad para que nadie devuelva los libros de otro)
        const sqlCheck = 'SELECT * FROM Prestamos WHERE id = ? AND id_usuario = ? AND estado = "Activo"';
        const [prestamo] = await db.query(sqlCheck, [idPrestamo, idUsuario]);

        if (prestamo.length === 0) {
            return res.status(404).json({ error: 'Préstamo no encontrado o no te pertenece.' });
        }

        // 2. Proceder a la devolución
        const sqlUpdate = 'UPDATE Prestamos SET estado = "Devuelto", fecha_devolucion = CURDATE() WHERE id = ?';
        await db.query(sqlUpdate, [idPrestamo]);

        res.json({ mensaje: 'Libro devuelto exitosamente. ¡Gracias por leer!' });

    } catch (error) {
        console.error('Error al devolver el préstamo:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ===============================================
//           MÓDULO DE REPORTES
// ===============================================

// Endpoint: GET /api/reportes/populares (¡Ahora con filtros de tiempo!)
app.get('/api/reportes/populares', [verificarToken, verificarAdmin], async (req, res) => {
    try {
        // 1. Leemos el nuevo filtro de la URL
        const { tipo } = req.query; // 'actual' o 'historico'

        let sql = `
      SELECT 
        L.titulo,
        L.autor,
        COUNT(P.id) AS numero_de_prestamos
      FROM Prestamos AS P
      JOIN Libros AS L ON P.id_libro = L.id
    `;

        // 2. LÓGICA CONDICIONAL:
        // Por defecto (o si ?tipo=actual), mostramos solo los libros activos.
        if (!tipo || tipo === 'actual') {
            sql += ' WHERE L.activo = TRUE ';
        }
        // Si ?tipo=historico, NO añadimos el WHERE,
        // por lo que los contará a TODOS.

        // 3. El resto de la consulta es la misma
        sql += `
      GROUP BY P.id_libro, L.titulo, L.autor
      ORDER BY numero_de_prestamos DESC
      LIMIT 10
    `;

        const [reporte] = await db.query(sql);
        res.status(200).json(reporte);

    } catch (error) {
        console.error('Error al generar el reporte de popularidad:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Endpoint: PUT /api/usuarios/perfil (Actualizar datos y foto)
// 'upload.single' maneja el archivo que viene en el campo 'foto'
app.put('/api/usuarios/perfil', [verificarToken, upload.single('foto')], async (req, res) => {
    try {
        const { nombre } = req.body;
        const idUsuario = req.usuario.id;
        let foto_url = null;

        // Si el usuario subió una foto nueva, multer la pone en 'req.file'
        if (req.file) {
            // Guardamos la ruta relativa (ej: 'uploads/123.jpg')
            // Nota: En Windows las rutas usan '\', las cambiamos a '/' para web
            foto_url = req.file.path.replace(/\\/g, "/");
        }

        // Construimos la consulta dinámicamente
        let sql = 'UPDATE Usuarios SET nombre = ?';
        const params = [nombre];

        if (foto_url) {
            sql += ', foto_url = ?';
            params.push(foto_url);
        }

        sql += ' WHERE id = ?';
        params.push(idUsuario);

        await db.query(sql, params);

        // Devolvemos los datos actualizados al frontend
        res.json({
            mensaje: 'Perfil actualizado',
            usuario: { id: idUsuario, nombre, foto_url } // Devolvemos la nueva foto
        });

    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint: PUT /api/usuarios/password (Cambiar contraseña)
app.put('/api/usuarios/password', verificarToken, async (req, res) => {
    try {
        const { passwordActual, passwordNueva } = req.body;
        const idUsuario = req.usuario.id;

        // 1. Buscar al usuario para obtener su hash actual
        const [usuarios] = await db.query('SELECT * FROM Usuarios WHERE id = ?', [idUsuario]);
        const usuario = usuarios[0];

        // 2. Verificar que la contraseña actual sea correcta
        const passwordCorrecta = await bcrypt.compare(passwordActual, usuario.password);
        if (!passwordCorrecta) {
            return res.status(400).json({ error: 'La contraseña actual es incorrecta.' });
        }

        // 3. Hashear la NUEVA contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(passwordNueva, salt);

        // 4. Actualizar en la BD
        await db.query('UPDATE Usuarios SET password = ? WHERE id = ?', [hashedPassword, idUsuario]);

        res.json({ mensaje: 'Contraseña actualizada correctamente.' });

    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// ===============================================
//           MÓDULO DE USUARIOS (Admin)
// ===============================================

// Endpoint: GET /api/usuarios (Admin: Listar todos los usuarios)
// Ruta protegida, SOLO para Administradores.
app.get('/api/usuarios', [verificarToken, verificarAdmin], async (req, res) => {
    try {
        // 1. Obtenemos filtros y paginación
        const { q } = req.query;
        const page = parseInt(req.query.page || '1');
        const limit = 10; // 10 usuarios por página
        const offset = (page - 1) * limit;

        // 2. Construimos la cláusula WHERE
        let whereClause = '';
        const params = [];

        if (q) {
            whereClause = ' WHERE (nombre LIKE ? OR email LIKE ?)';
            const searchTerm = `%${q}%`;
            params.push(searchTerm, searchTerm);
        }

        // 3. CONSULTA 1: Contar el TOTAL
        const sqlCount = `SELECT COUNT(*) AS totalUsuarios FROM Usuarios${whereClause}`;
        const [ [countResult] ] = await db.query(sqlCount, params);
        const totalUsuarios = countResult.totalUsuarios;
        const totalPages = Math.ceil(totalUsuarios / limit);

        // 4. CONSULTA 2: Obtener la PÁGINA
        // ¡IMPORTANTE! NUNCA enviar el password
        const sqlSelect = `SELECT id, nombre, email, rol FROM Usuarios${whereClause} ORDER BY nombre LIMIT ? OFFSET ?`;

        // Añadimos params de paginación
        const paramsSelect = [...params, limit, offset];
        const [usuarios] = await db.query(sqlSelect, paramsSelect);

        // 5. Devolvemos el objeto de respuesta
        res.status(200).json({
            usuarios: usuarios,
            totalPages: totalPages,
            currentPage: page
        });

    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint: PUT /api/usuarios/:id (Admin: Cambiar rol de un usuario)
// Ruta protegida, SOLO para Administradores.
app.put('/api/usuarios/:id', [verificarToken, verificarAdmin], async (req, res) => {
    // --- DEBUGGING ---
    console.log('Headers:', req.headers);
    console.log('Body recibido:', req.body);
    // -----------------
    try {
        const { id } = req.params; // ID del usuario a modificar
        const { rol } = req.body;   // Nuevo rol (ej: "Administrador")

        // 1. Validar el rol
        const rolesValidos = ['Administrador', 'Usuario Registrado'];
        if (!rol || !rolesValidos.includes(rol)) {
            return res.status(400).json({ error: 'Rol no válido. Debe ser "Administrador" o "Usuario Registrado".' });
        }

        // 2. Medida de seguridad: Evitar que el admin se quite el rol a sí mismo
        // Comparamos el ID del token (quién hace la petición) con el ID de la URL (a quién se modifica)
        if (Number(req.usuario.id) === Number(id)) {
            return res.status(400).json({ error: 'No puedes modificar tu propio rol.' });
        }

        // 3. Actualizar la BD
        const sql = 'UPDATE Usuarios SET rol = ? WHERE id = ?';
        const [result] = await db.query(sql, [rol, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        res.status(200).json({ mensaje: 'Rol del usuario actualizado exitosamente.' });

    } catch (error) {
        console.error('Error al actualizar rol de usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint: DELETE /api/usuarios/:id (Admin: Borrar un usuario)
// Ruta protegida, SOLO para Administradores.
app.delete('/api/usuarios/:id', [verificarToken, verificarAdmin], async (req, res) => {
    try {
        const { id } = req.params; // ID del usuario a borrar

        // 1. Medida de seguridad: Evitar que el admin se borre a sí mismo
        if (Number(req.usuario.id) === Number(id)) {
            return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta.' });
        }

        // 2. Intentar borrar
        const sql = 'DELETE FROM Usuarios WHERE id = ?';
        const [result] = await db.query(sql, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        res.status(200).json({ mensaje: 'Usuario eliminado exitosamente.' });

    } catch (error) {
        // 3. Manejar error de llave foránea (si el usuario tiene préstamos activos)
        // La BD nos protege de borrar un usuario que tiene registros en la tabla "Prestamos"
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ error: 'No se puede eliminar el usuario porque tiene préstamos asociados. Primero debe gestionar sus préstamos.' });
        }
        console.error('Error al eliminar el usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// ===============================================
//           MÓDULO DE CATEGORÍAS (NUEVO)
// ===============================================

// Endpoint: GET /api/categorias
// Devuelve una lista única de todas las categorías
app.get('/api/categorias', async (req, res) => {
    try {
        // 'SELECT DISTINCT' asegura que no haya duplicados
        // 'WHERE ... IS NOT NULL' evita que "null" aparezca como categoría
        const sql = 'SELECT DISTINCT categoria FROM Libros WHERE categoria IS NOT NULL ORDER BY categoria ASC';

        const [categorias] = await db.query(sql);

        const listaCategorias = categorias.map(row => row.categoria);

        res.status(200).json(listaCategorias);

    } catch (error) {
        console.error('Error al obtener categorías:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// ===============================================
//           MÓDULO DE ADMIN (Dashboard)
// ===============================================

// Endpoint: GET /api/admin/stats
app.get('/api/admin/stats', [verificarToken, verificarAdmin], async (req, res) => {
    try {
        const qUsuarios = 'SELECT COUNT(*) AS totalUsuarios FROM Usuarios';
        const qLibrosActivos = 'SELECT COUNT(*) AS totalLibros FROM Libros WHERE activo = TRUE';
        const qPrestamosActivos = 'SELECT COUNT(*) AS totalPrestamos FROM Prestamos WHERE estado = "Activo"';
        const qLibrosInactivos = 'SELECT COUNT(*) AS librosInactivos FROM Libros WHERE activo = FALSE';

        const [
            [ [usuariosResult] ],
            [ [librosResult] ],
            [ [prestamosResult] ],
            [ [inactivosResult] ]
        ] = await Promise.all([
            db.query(qUsuarios),
            db.query(qLibrosActivos),
            db.query(qPrestamosActivos),
            db.query(qLibrosInactivos)
        ]);

        const stats = {
            totalUsuarios: usuariosResult.totalUsuarios,
            totalLibros: librosResult.totalLibros,
            totalPrestamosActivos: prestamosResult.totalPrestamos,
            librosInactivos: inactivosResult.librosInactivos
        };

        // Este log ahora debería mostrar los NÚMEROS
        console.log('[STATS_BACKEND] Enviando al frontend:', stats);

        res.status(200).json(stats);

    } catch (error) {
        console.error('Error al generar estadísticas del dashboard:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ===============================================
//           MÓDULO DE LISTA DE DESEADOS
// ===============================================

// Endpoint: GET /api/deseados (Ver mi lista)
app.get('/api/deseados', verificarToken, async (req, res) => {
    try {
        const id_usuario = req.usuario.id;
        const sql = `
      SELECT L.*, D.id as id_deseado 
      FROM Deseados D
      JOIN Libros L ON D.id_libro = L.id
      WHERE D.id_usuario = ?
      ORDER BY D.fecha_agregado DESC
    `;
        const [libros] = await db.query(sql, [id_usuario]);
        res.json(libros);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener deseados' });
    }
});

// Endpoint: GET /api/deseados/check/:id_libro (¿Es deseado este libro?)
app.get('/api/deseados/check/:id_libro', verificarToken, async (req, res) => {
    try {
        const { id_libro } = req.params;
        const id_usuario = req.usuario.id;
        const sql = 'SELECT * FROM Deseados WHERE id_usuario = ? AND id_libro = ?';
        const [rows] = await db.query(sql, [id_usuario, id_libro]);

        // Devuelve true si encontró algo, false si no
        res.json({ esDeseado: rows.length > 0 });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al verificar deseado' });
    }
});

// Endpoint: POST /api/deseados (Toggle: Agregar o Quitar)
app.post('/api/deseados', verificarToken, async (req, res) => {
    try {
        const { id_libro } = req.body;
        const id_usuario = req.usuario.id;

        // 1. Revisamos si ya existe
        const sqlCheck = 'SELECT * FROM Deseados WHERE id_usuario = ? AND id_libro = ?';
        const [existe] = await db.query(sqlCheck, [id_usuario, id_libro]);

        if (existe.length > 0) {
            // 2. Si existe, LO BORRAMOS (Quitar de deseados)
            await db.query('DELETE FROM Deseados WHERE id_usuario = ? AND id_libro = ?', [id_usuario, id_libro]);
            res.json({ mensaje: 'Eliminado de deseados', esDeseado: false });
        } else {
            // 3. Si no existe, LO AGREGAMOS
            await db.query('INSERT INTO Deseados (id_usuario, id_libro) VALUES (?, ?)', [id_usuario, id_libro]);
            res.json({ mensaje: 'Agregado a deseados', esDeseado: true });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar deseados' });
    }
});

// ===============================================
//           MÓDULO DE RESEÑAS
// ===============================================

// Endpoint: POST /api/resenas (Crear una reseña)
app.post('/api/resenas', verificarToken, async (req, res) => {
    try {
        const { id_libro, calificacion, comentario } = req.body;
        const id_usuario = req.usuario.id;

        // Validaciones
        if (!calificacion || calificacion < 1 || calificacion > 5) {
            return res.status(400).json({ error: 'La calificación debe ser entre 1 y 5.' });
        }

        const sql = 'INSERT INTO Resenas (id_usuario, id_libro, calificacion, comentario) VALUES (?, ?, ?, ?)';
        await db.query(sql, [id_usuario, id_libro, calificacion, comentario]);

        res.status(201).json({ mensaje: 'Reseña guardada exitosamente.' });

    } catch (error) {
        // Manejar el caso de "Ya opinaste sobre este libro"
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Ya has publicado una reseña para este libro.' });
        }
        console.error('Error al guardar reseña:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint: GET /api/resenas/:id_libro (Ver reseñas de un libro)
app.get('/api/resenas/:id_libro', async (req, res) => {
    try {
        const { id_libro } = req.params;
        // Hacemos JOIN con Usuarios para mostrar el nombre de quien opinó
        const sql = `
      SELECT R.*, U.nombre as autor_resena 
      FROM Resenas R
      JOIN Usuarios U ON R.id_usuario = U.id
      WHERE R.id_libro = ?
      ORDER BY R.fecha DESC
    `;
        const [resenas] = await db.query(sql, [id_libro]);
        res.status(200).json(resenas);
    } catch (error) {
        console.error('Error al obtener reseñas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Poner el servidor a "escuchar" en el puerto definido
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// Probar la conexión a la DB al arrancar
db.getConnection()
    .then(connection => {
        console.log('¡Conectado exitosamente a la base de datos MySQL!');
        connection.release(); // Soltamos la conexión para que el pool la reutilice
    })
    .catch(err => {
        console.error('Error al conectar a la base de datos:', err);
    });
