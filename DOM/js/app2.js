const inputNombre = document.getElementById("nombre");
const boton = document.getElementById("btnEnviar");
const mensaje = document.getElementById("mensaje");

function mostrarMensaje() {
  const nombre = inputNombre.value;

  if (nombre.trim() !== "") {
    mensaje.textContent = "¡Hola, " + nombre + "!";
    inputNombre.value = "";
  }
}

// Evento click
boton.addEventListener("click", mostrarMensaje);

// Evento keydown (Enter)
inputNombre.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    mostrarMensaje();
  }
});

// Evento mouseover
mensaje.addEventListener("mouseover", function () {
  mensaje.style.color = "green";
});

// Evento mouseout
mensaje.addEventListener("mouseout", function () {
  mensaje.style.color = "black";
});
