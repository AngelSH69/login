const bcry = require('bcryptjs');
const mysql = require('mysql2/promise');

async function createUser(){
    const conncetion = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'farmacia'
    });

    const password = 'AngelitoYTPassword'
    const hashedPassword = await bcry.hash(password, 10);

    await conncetion.execute(
        'INSERT INTO usuarios (nombre, password, rol) VALUES (?, ?, ?)',
        ['AngelitoYT', hashedPassword, 'consulta']
    );

    console.log('Usuario creado con contraseña hasheada');
    process.exit();
}
createUser();