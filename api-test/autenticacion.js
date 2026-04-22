const express = require("express");
const app = express();
app.use(express.json());
const calificaciones = [ 
    {alumno: "Ana", materia: "Web", calificacion: 9},
    {alumno: "Luis", materia: "BD", calificacion: 7}
];



function requireApiKey (req, res, next){
    const apiKey = req.headers["x-api-key"];
    if (apiKey !== "mi_clave_secreta"){
        return res.status(401).json({error: "No autorizacion"});
    }
    next();
}

app.get("/privado/calificaciones",requireApiKey, (req, res) => {
    res.json(calificaciones);
});

app.listen(3000, () =>{
console.log("Servidor en http://localhost:3000");
});