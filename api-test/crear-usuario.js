async function crearUsuario() {
    const response = await fetch(
        "https://jsonplaceholder.typicode.com/users",
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "Ana",
                email: "ana@mail.com"
            })
        }
    );
    const resultado = await response.json();
    console.log(resultado);
}
crearUsuario();
