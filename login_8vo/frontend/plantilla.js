const API_URL = 'http://localhost:3000/api/usuarios';

const listaUsuarios = document.getElementById('listaUsuarios');
const sinUsuarios = document.getElementById('sinUsuarios');
const formUsuario = document.getElementById('formUsuario');

window.onload = cargarUsuarios;

// Función para escapar caracteres HTML y prevenir XSS
function escaparHTML(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

// CARGAR USUARIOS
async function cargarUsuarios() {
    // El token ahora se envía automáticamente en las cookies (httpOnly)
    // No necesitamos recuperarlo de localStorage
    
    try {
        const response = await fetch(API_URL, {
            // credentials: 'include' envía las cookies automáticamente
            credentials: 'include'
        });

        const data = await response.json();

        if (response.status === 401) {
            alert(data.error);
            // Limpiar cookies de sesión
            document.cookie = 'usuario=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            document.cookie = 'rol=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            window.location.href = 'login.html';
            return;
        }

        if (!response.ok) {
            throw new Error(data.error);
        }

        mostrarUsuarios(data);
        console.log('Usuarios cargados:', data);

    } catch (error) {
        console.error(error);
        alert('Error al cargar usuarios');
    }
}

// MOSTRAR USUARIOS
function mostrarUsuarios(usuarios) {
    listaUsuarios.innerHTML = '';

    if (!usuarios.length) {
        sinUsuarios.style.display = 'block';
        return;
    }

    sinUsuarios.style.display = 'none';

    usuarios.forEach(u => {
        // Crear elementos de forma segura sin innerHTML
        const card = document.createElement('div');
        card.className = 'card mb-3';

        const cardBody = document.createElement('div');
        cardBody.className = 'card-body d-flex justify-content-between align-items-center';

        const infoDiv = document.createElement('div');

        const h5 = document.createElement('h5');
        h5.textContent = u.usuario; // textContent es seguro, no interpreta HTML

        const badge = document.createElement('span');
        badge.className = 'badge bg-info';
        badge.textContent = u.rol;

        const passwordSpan = document.createElement('span');
        passwordSpan.className = 'text-muted ms-2';
        passwordSpan.textContent = 'PASSWORD: ' + u.password;

        infoDiv.appendChild(h5);
        infoDiv.appendChild(badge);
        infoDiv.appendChild(passwordSpan);

        const buttonsDiv = document.createElement('div');

        const btnEditar = document.createElement('button');
        btnEditar.className = 'btn btn-warning btn-sm me-2';
        btnEditar.textContent = 'Editar';
        btnEditar.onclick = () => editarUsuario(u.id, u.usuario, u.rol);

        const btnEliminar = document.createElement('button');
        btnEliminar.className = 'btn btn-danger btn-sm';
        btnEliminar.textContent = 'Eliminar';
        btnEliminar.onclick = () => eliminarUsuario(u.id);

        buttonsDiv.appendChild(btnEditar);
        buttonsDiv.appendChild(btnEliminar);

        cardBody.appendChild(infoDiv);
        cardBody.appendChild(buttonsDiv);
        card.appendChild(cardBody);

        listaUsuarios.appendChild(card);
    });
}

// CREAR USUARIO
formUsuario.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Token se envía automáticamente en cookies (httpOnly)
    const usuario = document.getElementById('usuarioNuevo').value;
    const password = document.getElementById('passwordNuevo').value;
    const rol = document.getElementById('rolNuevo').value;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include', // Enviar cookies automáticamente
            body: JSON.stringify({ usuario, password, rol })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error);
        }

        alert('Usuario creado');
        formUsuario.reset();
        cargarUsuarios();

    } catch (error) {
        alert(error.message);
    }
});

// ELIMINAR USUARIO
async function eliminarUsuario(id) {
    const confirmar = confirm('¿Eliminar usuario?');
    if (!confirmar) return;

    // Token se envía automáticamente en cookies (httpOnly)
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            credentials: 'include' // Enviar cookies automáticamente
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error);
        }

        alert('Usuario eliminado');
        cargarUsuarios();

    } catch (error) {
        alert(error.message);
    }
}

// EDITAR USUARIO (BÁSICO)
function editarUsuario(id, usuario, rol) {
    const nuevoUsuario = prompt('Nuevo nombre:', usuario);
    const nuevoRol = prompt('Nuevo rol (admin/invitado):', rol);

    if (!nuevoUsuario || !nuevoRol) return;

    actualizarUsuario(id, nuevoUsuario, nuevoRol);
}

async function actualizarUsuario(id, usuario, rol) {
    // Token se envía automáticamente en cookies (httpOnly)
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include', // Enviar cookies automáticamente
            body: JSON.stringify({ usuario, rol })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error);
        }

        alert('Usuario actualizado');
        cargarUsuarios();

    } catch (error) {
        alert(error.message);
    }
}