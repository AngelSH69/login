const formLogin = document.getElementById('formLogin');
const msg = document.getElementById('msg');

const MAX_INTENTOS = 5;
const TIEMPO_BLOQUEO = 15 * 60 * 1000; // 15 minutos en milisegundos

// Inicializar contador al cargar la página
window.onload = () => {
  verificarBloqueo();
};

// Verificar si el usuario está bloqueado por intentos fallidos
function verificarBloqueo() {
  const intentosData = JSON.parse(Cookies.get('loginIntentos') || '{}');
  const ahora = Date.now();

  if (intentosData.bloqueadoHasta && intentosData.bloqueadoHasta > ahora) {
    const minutosRestantes = Math.ceil((intentosData.bloqueadoHasta - ahora) / 60000);
    formLogin.style.display = 'none';
    msg.textContent = ` Bloqueado. Intenta en ${minutosRestantes} minuto(s).`;
    msg.style.color = 'red';
    msg.style.fontSize = '16px';
  } else {
    // Limpiar bloqueo si ha pasado el tiempo
    Cookies.remove('loginIntentos');
    mostrarIntentosRestantes();
  }
}

// Mostrar intentos restantes al usuario
function mostrarIntentosRestantes() {
  const intentosData = JSON.parse(Cookies.get('loginIntentos') || '{"contador": 0}');
  const intentosRestantes = MAX_INTENTOS - intentosData.contador;

  if (intentosRestantes > 0) {
    console.log(` Intentos restantes: ${intentosRestantes}/${MAX_INTENTOS}`);
  }
}

formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Verificar si está bloqueado
  const intentosData = JSON.parse(Cookies.get('loginIntentos') || '{}');
  const ahora = Date.now();

  if (intentosData.bloqueadoHasta && intentosData.bloqueadoHasta > ahora) {
    const minutosRestantes = Math.ceil((intentosData.bloqueadoHasta - ahora) / 60000);
    msg.textContent = ` Bloqueado. Intenta en ${minutosRestantes} minuto(s).`;
    msg.style.color = 'red';
    return;
  }

  // Mostrar mensaje de validación
  msg.textContent = 'Validando...';
  msg.style.color = 'blue';

  const body = {
    usuario: document.getElementById('usuario').value.trim(),
    password: document.getElementById('password').value.trim()
  };

  try {
    const resp = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      credentials: 'include' // Incluir cookies en la request
    });

    const data = await resp.json();

    if (!resp.ok) {
      // Incrementar contador de intentos fallidos
      const intentosData = JSON.parse(Cookies.get('loginIntentos') || '{"contador": 0}');
      intentosData.contador += 1;

      if (intentosData.contador >= MAX_INTENTOS) {
        // Bloquear por 15 minutos
        intentosData.bloqueadoHasta = Date.now() + TIEMPO_BLOQUEO;
        Cookies.set('loginIntentos', JSON.stringify(intentosData), { expires: 1 }); // Expira en 1 día

        formLogin.style.display = 'none';
        msg.textContent = ' Bloqueado: Demasiados intentos. Intenta en 15 minutos.';
        msg.style.color = 'red';
        msg.style.fontSize = '16px';
      } else {
        // Mostrar intentos restantes
        const intentosRestantes = MAX_INTENTOS - intentosData.contador;
        Cookies.set('loginIntentos', JSON.stringify(intentosData), { expires: 1 });

        msg.textContent = ` ${data.error || 'Error'}\n⏱️ Intentos restantes: ${intentosRestantes}/${MAX_INTENTOS}`;
        msg.style.color = 'red';
        msg.style.whiteSpace = 'pre-line';
      }
      return;
    }

    // Login exitoso - Cookies seguras ya enviadas automáticamente por el servidor (httpOnly)
    Cookies.remove('loginIntentos');

    // El token ahora viene en una cookie httpOnly (protegida contra XSS)
    // No necesitamos guardarlo manualmente. Solo guardamos info no sensible:
    Cookies.set('usuario', data.usuario, {
      expires: 2/24,
      sameSite: 'Strict'
    });

    Cookies.set('rol', data.rol, {
      expires: 2/24,
      sameSite: 'Strict'
    });

    msg.textContent = ' Bienvenido ' + data.usuario;
    msg.style.color = 'green';

    setTimeout(() => {
      window.location.href = 'portada.html';
    }, 1000);

  } catch (error) {
    msg.textContent = 'Error de conexión';
    msg.style.color = 'red';
  }
});