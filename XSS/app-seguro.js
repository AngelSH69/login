console.log("version SEGURA cargada");

document.getElementById("formulario").addEventListener("submit", function(e) {
    e.preventDefault();

    const entrada = document.getElementById('comentario').value;
    const resultadoDiv = document.getElementById('resultado');

    const parrafo = document.createElement("p");
    parrafo.textContent = entrada;

    resultadoDiv.innerHTML = "";
    resultadoDiv.appendChild(parrafo);
});