const mysql = require('mysql');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'gestionProyectos'
});

connection.connect((err) => {
    if (err) {
        console.error('Error MYSQL', err);
        return;
    }   
    console.log('Conexión a la base de datos establecida');
});
module.exports = connection;