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

// Creo la instancia de Express
const app = express();

// --- Middlewares ---
app.use(cors()); // <-- Usar CORS para permitir peticiones
app.use(express.json()); // <-- Usar el middleware para "entender" JSON
// ---------------------

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

// Endpoint: GET /api/libros (Listar Y BUSCAR libros)
// Ruta pública, no necesita "verificarToken"
app.get('/api/libros', async (req, res) => {
    try {
        // 1. Obtenemos los "query parameters" de la URL
        // ej: /api/libros?titulo=anillos&autor=tolkien
        const { titulo, autor } = req.query;

        // 2. Empezamos con la consulta SQL base
        let sql = 'SELECT * FROM Libros';
        const params = []; // Un array para nuestros parámetros seguros

        // 3. Añadimos filtros a la consulta DINÁMICAMENTE
        if (titulo || autor) {
            sql += ' WHERE'; // Añadimos el WHERE
            let firstFilter = true;

            if (titulo) {
                sql += ' titulo LIKE ?'; // "LIKE" es para búsqueda parcial
                params.push(`%${titulo}%`); // Los '%' son comodines (contiene)
                firstFilter = false;
            }

            if (autor) {
                if (!firstFilter) {
                    sql += ' AND'; // Si ya pusimos un filtro, usamos AND
                }
                sql += ' autor LIKE ?';
                params.push(`%${autor}%`);
            }
        }

        // 4. Añadimos el ordenamiento al final
        sql += ' ORDER BY titulo';

        // 5. Ejecutamos la consulta final
        const [libros] = await db.query(sql, params);

        res.status(200).json(libros);

    } catch (error) {
        console.error('Error al obtener libros:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint: GET /api/libros/:id (Ver detalle de un libro)
// Ruta pública, tampoco necesita "verificarToken"
app.get('/api/libros/:id', async (req, res) => {
    try {
        // 1. Obtenemos el ID de los "parámetros" de la URL
        const { id } = req.params;

        // 2. Buscamos el libro por su ID
        const sql = 'SELECT * FROM Libros WHERE id = ?';
        const [libros] = await db.query(sql, [id]);

        // 3. Verificar si el libro existe
        if (libros.length === 0) {
            return res.status(404).json({ error: 'Libro no encontrado' });
        }

        // 4. Devolvemos el primer (y único) resultado
        res.status(200).json(libros[0]);

    } catch (error) {
        console.error('Error al obtener el libro:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Endpoint: POST /api/libros (Crear un nuevo libro)
// ¡Ruta protegida! Primero verifica token, LUEGO verifica si es admin.
app.post('/api/libros', [verificarToken, verificarAdmin], async (req, res) => {
    try {
        // Obtenemos los datos del libro del cuerpo de la petición
        const { titulo, autor, categoria, descripcion, fecha_publicacion, portada_url } = req.body;

        // Validación simple
        if (!titulo || !autor) {
            return res.status(400).json({ error: 'El título y el autor son obligatorios.' });
        }

        const sql = `
      INSERT INTO Libros (titulo, autor, categoria, descripcion, fecha_publicacion, portada_url) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;

        const [result] = await db.query(sql, [
            titulo,
            autor,
            categoria || null, // Permite valores nulos si no se envían
            descripcion || null,
            fecha_publicacion || null,
            portada_url || null
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

// Endpoint: PUT /api/libros/:id (Actualizar un libro existente)
// ¡Ruta protegida!
app.put('/api/libros/:id', [verificarToken, verificarAdmin], async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, autor, categoria, descripcion, fecha_publicacion, portada_url } = req.body;

        if (!titulo || !autor) {
            return res.status(400).json({ error: 'El título y el autor son obligatorios.' });
        }

        const sql = `
      UPDATE Libros SET 
        titulo = ?, 
        autor = ?, 
        categoria = ?, 
        descripcion = ?, 
        fecha_publicacion = ?, 
        portada_url = ? 
      WHERE id = ?
    `;

        const [result] = await db.query(sql, [
            titulo,
            autor,
            categoria,
            descripcion,
            fecha_publicacion,
            portada_url,
            id
        ]);

        // "affectedRows" nos dice cuántas filas fueron actualizadas.
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Libro no encontrado o datos idénticos.' });
        }

        res.status(200).json({ mensaje: 'Libro actualizado exitosamente.' });

    } catch (error) {
        console.error('Error al actualizar el libro:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint: DELETE /api/libros/:id (Borrar un libro)
// ¡Ruta protegida!
app.delete('/api/libros/:id', [verificarToken, verificarAdmin], async (req, res) => {
    try {
        const { id } = req.params;
        const sql = 'DELETE FROM Libros WHERE id = ?';
        const [result] = await db.query(sql, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Libro no encontrado.' });
        }

        res.status(200).json({ mensaje: 'Libro eliminado exitosamente.' });

    } catch (error) {
        // Manejar error de llave foránea (si el libro tiene préstamos)
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ error: 'No se puede eliminar el libro porque tiene préstamos asociados.' });
        }
        console.error('Error al eliminar el libro:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ===============================================
//           MÓDULO DE PRÉSTAMOS
// ===============================================

// Endpoint: POST /api/prestamos (Usuario solicita un préstamo)
// Ruta protegida, pero para CUALQUIER usuario logueado.
app.post('/api/prestamos', verificarToken, async (req, res) => {
    try {
        // 1. Obtenemos el ID del libro que quieren prestar (del body)
        const { id_libro } = req.body;

        // 2. Obtenemos el ID del usuario (del TOKEN)
        const id_usuario = req.usuario.id;

        // 3. Validación
        if (!id_libro) {
            return res.status(400).json({ error: 'Se requiere el ID del libro.' });
        }

        // 4. (Opcional) Verificar si el libro existe
        const [libros] = await db.query('SELECT * FROM Libros WHERE id = ?', [id_libro]);
        if (libros.length === 0) {
            return res.status(404).json({ error: 'El libro solicitado no existe.' });
        }

        // 5. Crear la consulta SQL
        // No necesitamos 'fecha_prestamo' ni 'estado' porque tienen valores DEFAULT
        const sql = 'INSERT INTO Prestamos (id_usuario, id_libro) VALUES (?, ?)';

        // 6. Ejecutar la consulta
        const [result] = await db.query(sql, [id_usuario, id_libro]);

        // 7. Enviar respuesta de éxito
        res.status(201).json({
            mensaje: 'Préstamo registrado exitosamente',
            idPrestamo: result.insertId
        });

    } catch (error) {
        // Manejar error común: ¿Qué pasa si el usuario pide el mismo libro dos veces?
        // Esto dependería de las reglas de tu negocio. Por ahora, lo dejamos.
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
        // Esta consulta es la más compleja: une las TRES tablas.
        const sql = `
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
      ORDER BY P.fecha_prestamo DESC
    `;

        const [prestamos] = await db.query(sql);
        res.status(200).json(prestamos);

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

// ===============================================
//           MÓDULO DE REPORTES
// ===============================================

// Endpoint: GET /api/reportes/populares (Admin: Ver libros más prestados)
// Ruta protegida, SOLO para Administradores.
app.get('/api/reportes/populares', [verificarToken, verificarAdmin], async (req, res) => {
    try {
        // Esta es la consulta SQL más avanzada que hemos hecho:
        // 1. Une Libros (L) y Prestamos (P).
        // 2. Agrupa (GROUP BY) todas las filas por el ID del libro.
        // 3. Cuenta (COUNT) cuántos préstamos (P.id) hay en cada grupo.
        // 4. Ordena (ORDER BY) los resultados de mayor a menor (DESC).
        // 5. Limita (LIMIT) el resultado a los 10 primeros (un "Top 10").
        const sql = `
      SELECT 
        L.titulo,
        L.autor,
        COUNT(P.id) AS numero_de_prestamos
      FROM Prestamos AS P
      JOIN Libros AS L ON P.id_libro = L.id
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

// ===============================================
//           MÓDULO DE USUARIOS (Admin)
// ===============================================

// Endpoint: GET /api/usuarios (Admin: Listar todos los usuarios)
// Ruta protegida, SOLO para Administradores.
app.get('/api/usuarios', [verificarToken, verificarAdmin], async (req, res) => {
    try {
        // ¡MUY IMPORTANTE!
        // NUNCA, NUNCA envíes la columna "password" al frontend.
        // Ni siquiera el hash. Es un riesgo de seguridad innecesario.
        const sql = 'SELECT id, nombre, email, rol FROM Usuarios ORDER BY nombre';

        const [usuarios] = await db.query(sql);
        res.status(200).json(usuarios);

    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint: PUT /api/usuarios/:id (Admin: Cambiar rol de un usuario)
// Ruta protegida, SOLO para Administradores.
app.put('/api/usuarios/:id', [verificarToken, verificarAdmin], async (req, res) => {
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
