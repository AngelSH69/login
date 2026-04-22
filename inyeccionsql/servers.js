const express = require("express");
const mysql = require("mysql2");
const app = express();

app.use(express.json());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "seguridad",
  port: 3306
});

app.put("/actualizar-rol", (req, res) => {
  const { nombre, rol } = req.body;

  const sql = "UPDATE usuarios SET rol=? WHERE nombre=?";

  db.execute(sql, [rol, nombre], (err, result) => {
    if (err) return res.status(500).json(err);

    res.json({
      mensaje: "Rol actualizado correctamente",
      filasAfectadas: result.affectedRows
    });
  });
});

app.listen(3000, () => {
  console.log("Servidor en http://localhost:3000");
});
