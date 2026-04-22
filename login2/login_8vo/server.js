const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const connection = require('./db');
const path = require('path');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

const JWT_SECRET = 'esto-es-una-contraseña-segura';

// ===================== LOGIN =====================
app.post('/api/login', async (req, res) => {
  const { usuario, password } = req.body;

  if (!usuario || !password) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  connection.query(
    'SELECT id, usuario, password, rol FROM usuarios WHERE usuario = ?',
    [usuario],
    async (err, rows) => {
      if (err) return res.status(500).json({ error: 'Error BD' });

      if (rows.length === 0) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const u = rows[0];
      let match = false;

      // Si el hash empieza con $2b$ o $2a$ es bcrypt, si no es plain text
      const esBcrypt = u.password.startsWith('$2b$') || u.password.startsWith('$2a$');

      if (esBcrypt) {
        match = await bcrypt.compare(password, u.password);
      } else {
        match = password === u.password; // plain text
      }

      if (!match) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const token = jwt.sign(
        { id: u.id, usuario: u.usuario, rol: u.rol },
        JWT_SECRET,
        { expiresIn: '2h' }
      );

      res.json({ token, usuario: u.usuario, rol: u.rol });
    }
  );
});

// ===================== AUTH MIDDLEWARE =====================
function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const token = header.split(' ')[1];

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }
    next();
  };
}

// ===================== GET PROYECTOS =====================
app.get('/api/proyectos', auth, (req, res) => {
  connection.query(
    `SELECT p.*, r.nombre AS responsable_nombre
     FROM proyectos p
     LEFT JOIN responsables r ON p.responsable = r.id
     ORDER BY p.fecha DESC`,
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Error BD' });
      res.json(results);
    }
  );
});

// ===================== CREAR PROYECTO (ADMIN) =====================
app.post('/api/proyectos', auth, requireRole('admin'), (req, res) => {
  const { nombre, descripcion, fecha, prioridad, responsable } = req.body;

  if (!nombre || !fecha || !prioridad || !responsable) {
    return res.status(400).json({ error: 'Campos faltantes' });
  }

  connection.query(
    `INSERT INTO proyectos (nombre, descripcion, fecha, prioridad, estado, responsable)
     VALUES (?, ?, ?, ?, 'creado', ?)`,
    [nombre, descripcion, fecha, prioridad, responsable],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Error al crear proyecto' });
      res.json({ mensaje: 'Proyecto creado', id: result.insertId });
    }
  );
});

// ===================== ACTUALIZAR ESTADO (ADMIN) =====================
app.put('/api/proyectos/:id/estado', auth, requireRole('admin'), (req, res) => {
  const { estado } = req.body;
  const { id } = req.params;

  const estadosValidos = ['creado', 'en_progreso', 'finalizado'];
  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }

  connection.query(
    'UPDATE proyectos SET estado = ? WHERE id = ?',
    [estado, id],
    (err) => {
      if (err) return res.status(500).json({ error: 'Error BD' });
      res.json({ mensaje: 'Estado actualizado' });
    }
  );
});

// ===================== GET RESPONSABLES =====================
app.get('/api/responsables', (req, res) => {
  connection.query('SELECT id, nombre FROM responsables', (err, results) => {
    if (err) return res.status(500).json({ error: 'Error BD' });
    res.json(results);
  });
});

// ===================== PRÁCTICA 3: USUARIOS =====================

// REGISTRAR — solo admin
app.post('/api/registrar', auth, requireRole('admin'), async (req, res) => {
  try {
    const { usuario, password, rol } = req.body;

    if (!usuario || !password || !rol) {
      return res.status(400).json({ error: 'Faltan datos' });
    }

    //usar connection en lugar de db
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
          [usuario, hash, rol],
          (err, result) => {
            if (err) return res.status(500).json({ error: 'Error al registrar usuario' });
            res.json({ mensaje: 'Usuario registrado correctamente' });
          }
        );
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
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

// VER USUARIOS — solo admin
app.get('/api/usuarios', auth, requireRole('admin'), (req, res) => {
  connection.query(
    'SELECT id, usuario, password, rol FROM usuarios',
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error al consultar usuarios');
      }

      const rows = results.map(u => `
        <tr>
          <td>${u.id}</td>
          <td>${u.usuario}</td>
          <td style="word-break: break-all; font-size: 0.75rem;">${u.password}</td>
          <td>${u.rol}</td>
        </tr>
      `).join('');

      res.send(`
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <div class="container mt-4">
          <h2>Usuarios</h2>
          <table class="table table-bordered">
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuario</th>
                <th>Password (hash)</th>
                <th>Rol</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <a href="/" class="btn btn-secondary">Volver</a>
        </div>
      `);
    }
  );
});

//NUEVO ENDPOINT DE LOGEO SOLO COMO USUARIO
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
          [usuario, hash, 'usuario'], // rol forzado, el usuario no puede elegirlo
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

// ===================== FRONT =====================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'portada.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});