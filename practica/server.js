const express = require('express');
const cors = require('cors');
const connection = require('./db');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Obtener todos los proyectos
app.get('/api/proyectos', (req, res) => {
    const query = 'SELECT * FROM proyectos ORDER BY fecha DESC';
    
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener proyectos:', err);
            return res.status(500).json({ error: 'Error al obtener proyectos' });
        }
        res.json(results);
    });
});

// Crear un nuevo proyecto
app.post('/api/proyectos', (req, res) => {
    const { nombre, descripcion, fecha, prioridad } = req.body;
    
    // Validar campos obligatorios
    if (!nombre || !fecha || !prioridad) {
        return res.status(400).json({ 
            error: 'Campos obligatorios faltantes',
            required: ['nombre', 'fecha', 'prioridad']
        });
    }
    
    const query = 'INSERT INTO proyectos (nombre, descripcion, fecha, prioridad) VALUES (?, ?, ?, ?)';
    
    connection.query(query, [nombre, descripcion, fecha, prioridad], (err, result) => {
        if (err) {
            console.error('Error al crear proyecto:', err);
            return res.status(500).json({ error: 'Error al crear proyecto' });
        }
        
        // Enviar respuesta solo cuando se complete la operación
        res.status(201).json({
            mensaje: 'Proyecto creado exitosamente',
            id: result.insertId,
            proyecto: {
                id: result.insertId,
                nombre,
                descripcion,
                fecha,
                prioridad
            }
        });
    });
});

app.put('/api/proyectos/:id', (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, fecha, prioridad } = req.body;

    if(!nombre || !fecha || !prioridad) {
        return res.status(400).json({ 
            error: 'Campos obligatorios faltantes',
        });
    }

    const query = 'UPDATE proyectos SET nombre = ?, descripcion = ?, fecha = ?, prioridad = ? WHERE id = ?';

    connection.query(
        [nombre, descripcion, fecha, prioridad, id],
        (err, result)=> {
            if (err){
                console.error('Error: ', err);
                return res.status(500).json({ error: 'Error al editar proyecto'});
            }

            if(result.affectedRows === 0) {
                return res.status(404).json({ error: 'Proyecto no encontrado' });
            }
            res.json({ mensaje: 'Proyecto actualizado exitosamente' });
        }
    )
});

//Delete proyecto
app.delete('/api/proyectos/:id', (req, res) => {
    const { id } = req.params;

    const query = 'DELETE FROM proyectos WHERE id = ?';

    connection.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error al eliminar proyecto:', err);
            return res.status(500).json({ error: 'Error al eliminar proyecto' });
        }

        if(result.affectedRows === 0) {
            return res.status(404).json({ error: 'Proyecto no encontrado' });
        }
        
        res.json({ mensaje: 'Proyecto eliminado exitosamente' });
    });
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(` Servidor corriendo en: http://localhost:${PORT}`);
    console.log(` API disponible en: http://localhost:${PORT}/api/proyectos`);
});