document.getElementById('formCambiar').addEventListener('submit', async (e) => {
  e.preventDefault();

  const usuario = document.getElementById('usuario').value;
  const passwordActual = document.getElementById('passwordActual').value;
  const nuevaPassword = document.getElementById('nuevaPassword').value;
  const msg = document.getElementById('mensaje');

  // Token se envía automáticamente en cookies (httpOnly)
  const res = await fetch('/api/cambiar_password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include', // Enviar cookies automáticamente
    body: JSON.stringify({ usuario, passwordActual, nuevaPassword })
  });

  const data = await res.json();

  if (res.ok) {
    msg.className = 'alert alert-success mt-3';
    msg.textContent = data.mensaje;
  } else {
    msg.className = 'alert alert-danger mt-3';
    msg.textContent = data.error;
  }

  msg.classList.remove('d-none');
});