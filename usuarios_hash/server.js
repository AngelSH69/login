const express = require('express');
const bcrypt = require('bcrypt');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/registrar', async (req, res) => {
  try {
    const { usuario, password, rol } = req.body;

    if (!usuario || !password || !rol) {
      return res.send('Faltan datos');
    }

    db.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario], async (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error al consultar usuario');
      }

      if (results.length > 0) {
        return res.send('Usuario ya existe');
      }

      const hash = await bcrypt.hash(password, 10);

      db.query(
        'INSERT INTO usuarios (usuario, password, rol) VALUES (?, ?, ?)',
        [usuario, hash, rol],
        (err, result) => {
          if (err) {
            console.error(err);
            return res.status(500).send('Error al registrar usuario');
          }

          res.send('<h3>Usuario registrado correctamente</h3><a href="/">Volver</a>');
        }
      );
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error del servidor');
  }
});

app.post('/cambiar-password', async (req, res) => {
  try {
    const { usuario, passwordActual, nuevaPassword } = req.body;

    if (!usuario || !passwordActual || !nuevaPassword) {
      return res.send('Faltan datos');
    }

    db.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario], async (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error al buscar usuario');
      }

      if (results.length === 0) {
        return res.send('Usuario no encontrado');
      }

      const user = results[0];

      const coincide = await bcrypt.compare(passwordActual, user.password);

      if (!coincide) {
        return res.send('Contraseña actual incorrecta');
      }

      const nuevoHash = await bcrypt.hash(nuevaPassword, 10);

      db.query(
        'UPDATE usuarios SET password = ? WHERE id = ?',
        [nuevoHash, user.id],
        (err, result) => {
          if (err) {
            console.error(err);
            return res.status(500).send('Error al actualizar contraseña');
          }

          res.send('<h3>Contraseña actualizada correctamente</h3><a href="/">Volver</a>');
        }
      );
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error del servidor');
  }
});

app.get('/usuarios', (req, res) => {
  db.query('SELECT id, usuario, password, rol FROM usuarios', (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error al consultar usuarios');
    }

    const rows = results.map(u => `
      <tr>
        <td>${u.id}</td>
        <td>${u.usuario}</td>
        <td>${u.password}</td>
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
              <th>Password</th>
              <th>Rol</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <a href="/" class="btn btn-secondary">Volver</a>
      </div>
    `);
  });
});

app.listen(PORT, () => {
  console.log('Servidor en http://localhost:' + PORT);
});