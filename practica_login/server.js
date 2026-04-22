const express = require('express');
const cors = require('cors');
const connection = require('./db');
const jwt = require('jsonwebtoken');
const path = require('path');

const uploadDir = path.join(__dirname, 'uploads');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'frontend')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'login.html'));
});

const JWT_SECRET = 'esto-es-una-contraseña-segura';

app.post('/api/login', (req, res) => {
  const { usuario, password } = req.body;

  const query = 'SELECT * FROM usuarios WHERE usuario = ? AND password = ?';

  connection.query(query, [usuario, password], (err, results) => {

    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error en el servidor' });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = results[0];

    const token = jwt.sign(
      { id: user.id, usuario: user.usuario, rol: user.rol },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      token: token,
      usuario: user.usuario,
      rol: user.rol
    });

  });
});

// Middleware auth
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado' });
  }
 
  try {
    req.user = jwt.verify(header.split(' ')[1], JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'No autenticado' });
    if (req.user.rol !== role) return res.status(403).json({ error: 'No autorizado' });
    next();
  };
}

// GET – Obtener proyectos
app.get('/api/proyectos', auth, (req, res) => {
    const query = `
        SELECT
            p.*,
            r.nombre AS nombre_responsable
        FROM proyectos p
        LEFT JOIN responsables r ON p.responsable = r.id
        ORDER BY p.fecha DESC
    `;

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error:', err);
            return res.status(500).json({ error: 'Error al obtener proyectos' });
        }
        res.json(results);
    });
});

// POST – Crear proyecto
app.post('/api/proyectos', auth, requireRole('admin'),  (req, res) => {
    const { nombre, descripcion, fecha, prioridad, responsable } = req.body;

    if (!nombre || !fecha || !prioridad || !responsable) {
        return res.status(400).json({ error: 'Campos obligatorios faltantes' });
    }

    const query =
        'INSERT INTO proyectos (nombre, descripcion, fecha, prioridad, responsable) VALUES (?, ?, ?, ?, ?)';
    
   

    connection.query(query, [nombre, descripcion, fecha, prioridad, responsable], (err, result) => {
        if (err) {
            console.error('Error:', err);
            return res.status(500).json({ error: 'Error al crear proyecto' });
        }

        res.status(201).json({
            mensaje: 'Proyecto creado',
            id: result.insertId
        });
    });
});

// PUT – Editar proyecto
app.put('/api/proyectos/:id', auth, requireRole('admin'), (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, fecha, prioridad, responsable } = req.body;

    if (!nombre || !fecha || !prioridad) {
        return res.status(400).json({ error: 'Campos obligatorios faltantes' });
    }

    const query =
        'UPDATE proyectos SET nombre = ?, descripcion = ?, fecha = ?, prioridad = ?, responsable = ? WHERE id = ?';

    connection.query(
        query,
        [nombre, descripcion || '', fecha, prioridad, responsable, id],
        (err, result) => {
            if (err) {
                console.error('Error:', err);
                return res.status(500).json({ error: 'Error al editar proyecto' });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Proyecto no encontrado' });
            }

            res.json({ mensaje: 'Proyecto actualizado' });
        }
    );
});

// DELETE – Eliminar proyecto
app.delete('/api/proyectos/:id', auth, requireRole('admin'), (req, res) => {
    const { id } = req.params;

    const query = 'DELETE FROM proyectos WHERE id = ?';

    connection.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error:', err);
            return res.status(500).json({ error: 'Error al eliminar proyecto' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Proyecto no encontrado' });
        }

        res.json({ mensaje: 'Proyecto eliminado' });
    });
});

// Get obtener responsables
app.get('/api/responsables', (req, res) => {
    const query = 'SELECT * FROM responsables';

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error:', err);
            return res.status(500).json({ error: 'Error al obtener responsables' });
        }
        res.json(results);
    });
});

// rutas frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor: http://localhost:${PORT}`);
    console.log(`Uploads: ${uploadDir}\n`);
});