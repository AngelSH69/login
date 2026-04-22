async function obtenerUsuarios() {
    const url="https://jsonplaceholder.typicode.com/users";

    const response = await fetch(url);

    //Convertir stream a JSON

    const usuarios = await response.json();

    //Mostrar datos en tabla
    console.table(usuarios);
    
}

obtenerUsuarios();