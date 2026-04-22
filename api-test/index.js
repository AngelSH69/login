const express = require('express');
const app = express();

app.get ('/api/test',(req,res)=>{
    res.json({
        mensaje: 'API funcionando correctamente',
        estado: 'OK'
    });
});

const PORT = 3000;
app.listen(PORT,()=>{
    console.log(`Servidor activo en http://localhost:${PORT}`);
});