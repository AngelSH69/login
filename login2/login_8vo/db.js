const mysql = require('mysql2');

// Configuración para tu base de datos gestionProyectos6
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'gestionproyectos',
  port: 3306
});

connection.connect(err => {
  if (err) {
    console.error(' Error conectando a MySQL:');
    console.error('   Mensaje:', err.message);
    console.error('   Código:', err.code);
    
  } else {
    console.log('Conectado a MySQL - BD: gestionProyectos');
  }
});

module.exports = connection; // 