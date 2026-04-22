require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const connection = require('./db');
const path = require('path');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000;

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser()); // Parsear cookies
app.use(express.static(path.join(__dirname, 'frontend')));

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('⚠️ ADVERTENCIA: JWT_SECRET no está configurado. Define JWT_SECRET en .env');
  process.exit(1);
}

// Rate limiting para login - máximo 5 intentos por 15 minutos
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos
  message: 'Demasiados intentos de login. Intenta más tarde.',
  standardHeaders: true, // retorna info en `RateLimit-*` headers
  legacyHeaders: false, // deshabilita `X-RateLimit-*` headers
  skip: (req, res) => {
    // Permitir acceso desde localhost en desarrollo
    return process.env.NODE_ENV === 'development' && req.ip === '::1';
  }
});

// login con rate limiting
app.post('/api/login', loginLimiter, (req, res) => {
  const { usuario, password } = req.body;

  if (!usuario || !password) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  connection.query(
    'SELECT id, usuario, password, rol FROM usuarios WHERE usuario = ?',
    [usuario],
    async (err, rows) => {
      if (err) {
        console.error('Error BD:', err);
        return res.status(500).json({ error: 'Error en BD' });
      }

      if (rows.length === 0) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const user = rows[0];

      // 🔑 Comparar hash
      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const token = jwt.sign(
        { id: user.id, usuario: user.usuario, rol: user.rol },
        JWT_SECRET,
        { expiresIn: '2h' }
      );

      res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
      maxAge: 2 * 60 * 60 * 1000 // ✅ 2 horas
    });

      res.json({ usuario: user.usuario, rol: user.rol });
    }
  );
});

// Middleware auth - Lee token de cookies (más seguro que localStorage)
function auth(req, res, next) {
  const token = req.cookies.token;
  
  if (!token) {
    console.log('Error: No autorizado - token no encontrado en cookies');
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    console.log('Token válido para:', req.user.usuario);
    next();
  } catch (error) {
    console.log('Error de token:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      res.clearCookie('token'); // Limpiar cookie expirada
      return res.status(401).json({ error: 'Token expirado' });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }
}

function requireRole(...roles) { //permitir más usuarios
  return (req, res, next) => {

    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    next();
  };
}

app.get('/api/proyectos', auth,requireRole('admin'), (req, res) => {
    const query = 'SELECT * FROM proyectos ORDER BY fecha DESC';
    
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error:', err);
            return res.status(500).json({ error: 'Error al obtener proyectos' });
        }
        res.json(results);
    });
});

// Crear proyecto 
app.post('/api/proyectos', auth, requireRole('admin'), (req, res) => {
    const { nombre, descripcion, fecha, prioridad } = req.body;
  
    console.log('Recibido:', { nombre, descripcion, fecha, prioridad });
    
    if (!nombre || !fecha || !prioridad) {
        return res.status(400).json({ error: 'Campos obligatorios faltantes' });
    }
    
    const prioridadesValidas = ['baja', 'media', 'alta'];
    if (!prioridadesValidas.includes(prioridad)) {
        return res.status(400).json({ error: 'Prioridad debe ser: baja, media o alta' });
    }
    
    const query = 'INSERT INTO proyectos (nombre, descripcion, fecha, prioridad) VALUES (?, ?, ?, ?)';
    
    connection.query(query, [nombre, descripcion, fecha, prioridad], (err, result) => {
        if (err) {
            console.error('Error SQL:', err);
            /*if (err.code === 'ER_TRUNCATED_WRONG_VALUE') {
                return res.status(400).json({ error: 'Formato de fecha inválido' });
            }
            if (err.code === 'ER_DATA_TOO_LONG') {
                return res.status(400).json({ error: 'Valor de prioridad no válido' });
            }*/
            return res.status(500).json({ error: 'Error al crear proyecto' });
        }
        
        res.json({ 
            mensaje: 'Proyecto creado',
            id: result.insertId
        });
    });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'portada.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});

// OBTENER USUARIOS
app.get('/api/usuarios', auth, requireRole('admin'), (req, res) => {
  connection.query('SELECT id, usuario, rol, password FROM usuarios', (err, results) => {
    if (err) return res.status(500).json({ error: 'Error BD' });
    res.json(results);
  });
});

// CREAR USUARIO
app.post('/api/usuarios', auth, requireRole('admin'), async (req, res) => {
  const { usuario, password, rol } = req.body;
  const hash = await bcrypt.hash(password, 10);
  connection.query(
    'INSERT INTO usuarios (usuario, password, rol) VALUES (?, ?, ?)',
    [usuario, hash, rol],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Error BD' });
      res.json({ mensaje: 'Usuario creado' });
    }
  );
});

// ELIMINAR
app.delete('/api/usuarios/:id', auth, requireRole('admin'), (req, res) => {
  connection.query(
    'DELETE FROM usuarios WHERE id = ?',
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: 'Error BD' });
      res.json({ mensaje: 'Eliminado' });
    }
  );
});

// ACTUALIZAR
app.put('/api/usuarios/:id', auth, requireRole('admin'), (req, res) => {
  const { usuario, rol } = req.body;

  connection.query(
    'UPDATE usuarios SET usuario=?, rol=? WHERE id=?',
    [usuario, rol, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: 'Error BD' });
      res.json({ mensaje: 'Actualizado' });
    }
  );
});

// CAMBIAR CONTRASEÑA — solo admin
app.post('/api/cambiar_password', auth, requireRole('admin'), async (req, res) => {
  try {
    const { usuario, passwordActual, nuevaPassword } = req.body;

    if (!usuario || !passwordActual || !nuevaPassword) {
      return res.status(400).json({ error: 'Faltan datos' });
    }

    //usar connection en lugar de db
    connection.query(
      'SELECT * FROM usuarios WHERE usuario = ?',
      [usuario],
      async (err, results) => {
        if (err) return res.status(500).json({ error: 'Error al buscar usuario' });

        if (results.length === 0) {
          return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const user = results[0];
        const esBcrypt = user.password.startsWith('$2b$') || user.password.startsWith('$2a$');
        const coincide = esBcrypt
          ? await bcrypt.compare(passwordActual, user.password)
          : passwordActual === user.password;

        if (!coincide) {
          return res.status(401).json({ error: 'Contraseña actual incorrecta' });
        }

        const nuevoHash = await bcrypt.hash(nuevaPassword, 10);

        connection.query(
          'UPDATE usuarios SET password = ? WHERE id = ?',
          [nuevoHash, user.id],
          (err) => {
            if (err) return res.status(500).json({ error: 'Error al actualizar contraseña' });
            res.json({ mensaje: 'Contraseña actualizada correctamente' });
          }
        );
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.post('/api/registro-publico', async (req, res) => {
  try {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
      return res.status(400).json({ error: 'Faltan datos' });
    }

    connection.query(
      'SELECT * FROM usuarios WHERE usuario = ?',
      [usuario],
      async (err, results) => {
        if (err) return res.status(500).json({ error: 'Error al consultar usuario' });

        if (results.length > 0) {
          return res.status(409).json({ error: 'Usuario ya existe' });
        }

        const hash = await bcrypt.hash(password, 10);

        connection.query(
          'INSERT INTO usuarios (usuario, password, rol) VALUES (?, ?, ?)',
          [usuario, hash, 'invitado'], 
          (err) => {
            if (err) return res.status(500).json({ error: 'Error al registrar' });
            res.json({ mensaje: 'Cuenta creada correctamente' });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});