async function registrar() {
  const usuario = document.getElementById('usuario').value;
  const password = document.getElementById('password').value;
  const msg = document.getElementById('mensaje');

  if (!usuario || !password) {
    msg.innerHTML = '<div class="alert alert-warning">Completa todos los campos</div>';
    return;
  }

  try {
    const res = await fetch('/api/registro-publico', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, password })
    });

    const data = await res.json();

    if (res.ok) {
      msg.innerHTML = '<div class="alert alert-success">' + data.mensaje + '. Redirigiendo...</div>';
      setTimeout(() => window.location.href = 'login.html', 1500);
    } else {
      msg.innerHTML = '<div class="alert alert-danger">' + data.error + '</div>';
    }
  } catch (err) {
    msg.innerHTML = '<div class="alert alert-danger">Error de conexión</div>';
  }
}