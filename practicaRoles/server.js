const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");  
const connection = require("./db");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "frontend")));

const JWT_SECRET = "esto-es-una-clave-secreta"; 

app.post("/api/login", (req, res) => {
  
  const { usuario, password } = req.body;
  console.log("Intento de login:", usuario);

  if(!usuario || !password) {
    return res.status(400).json({ error: "Usuario y contraseña son requeridos" });
  }

  connection.query(
    'SELECT * FROM usuarios WHERE usuario = ?',
    [usuario],
    (err, rows) => {
      if (err) {
        console.error("Error:", err);
        return res.status(500).json({ error: "Error en BD" });
      }

      if (rows.length === 0) {
        return res.status(401).json({ error: "Credenciales inválidas" });
      }

      const u = rows[0];
      const token = jwt.sign(
        { id: u.id, usuario: u.usuario, rol: u.rol },
        JWT_SECRET,
        { expiresIn: "2h" }
      );
      res.json({ token, usuario: u.usuario, rol: u.rol});
    }
  )
});

// Middleware auth
function auth(req, res, next) {
  const header= req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No autorizado" });
  }
  try {
    req.user = jwt.verify(header.split(" ")[1], JWT_SECRET);
    next();
  }catch {
    return res.status(401).json({ error: "Token inválido" });
  }
}

// Obtener proyectos (incluye nombre de responsable mediante JOIN)
app.get("/api/proyectos",auth, (req, res) => {
  const query = `SELECT p.*, r.nombre AS responsable_nombre, r.puesto AS responsable_puesto
                 FROM proyectos p
                 LEFT JOIN responsables r ON p.responsable = r.id
                 ORDER BY p.fecha DESC`;

  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error:", err);
      return res.status(500).json({ error: "Error al obtener proyectos" });
    }
    res.json(results);
  });
});

//obtener Responsables
app.get('/api/proyectos/responsables', (req, res) => {
  const query = 'SELECT * FROM responsables';
  console.log("Obteniendo responsables...");
  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error:", err);
      return res.status(500).json({ error: "Error al obtener responsables" });
    }
    res.json(results);
  });
});

// Crear proyecto
app.post("/api/proyectos", (req, res) => {
  const { nombre, descripcion, fecha, prioridad, responsable} = req.body;
  console.log("Creando proyecto:", req.body);
  if (!nombre || !fecha || !prioridad) {
    return res.status(400).json({ error: "Campos obligatorios faltantes" });
  }

  const query =
    "INSERT INTO proyectos (nombre, descripcion, fecha, prioridad, responsable) VALUES (?, ?, ?, ?, ?)";

  connection.query(
    query,
    [nombre, descripcion, fecha, prioridad, responsable],
    (err, result) => {
      if (err) {
        console.error("Error:", err);
        return res.status(500).json({ error: "Error al crear proyecto" });
      }

      res.json({
        mensaje: "Proyecto creado",
        id: result.insertId,
      });
    },
  );
});


// PUT - Editar proyecto
app.put('/api/proyectos/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, fecha, prioridad, responsable } = req.body;

  if (!nombre || !fecha || !prioridad) {
    return res.status(400).json({ error: 'Campos obligatorios faltantes' });
  }

  const query =
    'UPDATE proyectos SET nombre = ?, descripcion = ?, fecha = ?, prioridad = ?, responsable = ? WHERE id = ?';

  connection.query(
    query,
    [nombre, descripcion || '', fecha, prioridad, responsable || null, id],
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

// DELETE - Eliminar proyecto
app.delete('/api/proyectos/:id', (req, res) => {
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



app.listen(PORT, () => {
  console.log(`Servidor: http://localhost:${PORT}`);
});
