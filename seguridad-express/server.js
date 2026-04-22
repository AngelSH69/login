const express = require("express");
const app = express();

app.use(express.json());

let alumnos = [];

// ENDPOINT INSEGURO: NO valida entradas
/*
app.post("/alumnos", (req, res) => {
  const alumno = req.body; // SIN VALIDACIÓN
  alumnos.push(alumno);
  res.json({ ok: true, guardado: alumno });
});
*/

// ENDPOINT MÁS SEGURO: valida entradas
app.post("/alumnos", (req, res) => {
  const { nombre, edad, promedio } = req.body;

  if (typeof nombre !== "string" || nombre.trim().length < 2) {
    return res.status(400).json({ error: "Nombre inválido" });
  }

  if (!Number.isInteger(edad) || edad < 15 || edad > 80) {
    return res.status(400).json({ error: "Edad inválida" });
  }

  if (typeof promedio !== "number" || promedio < 0 || promedio > 10) {
    return res.status(400).json({ error: "Promedio inválido (0 a 10)" });
  }

  const alumno = {
    id: Date.now(),
    nombre: nombre.trim(),
    edad,
    promedio
  };

  alumnos.push(alumno);
  res.json({ ok: true, guardado: alumno });
});

app.get("/alumnos", (req, res) => {
  res.json(alumnos);
});

app.listen(3000, () => {
  console.log("Servidor en http://localhost:3000");
});
