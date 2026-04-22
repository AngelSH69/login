console.log("version INSEGURA cargada");

document.getElementById("formulario").addEventListener("submit", function(e) {
    e.preventDefault();

    const entrada = document.getElementById('comentario').value;
    const resultadoDiv = document.getElementById('resultado');

    resultadoDiv.innerHTML = "<p>" + entrada + "</p>";
});