const token = localStorage.getItem('token');
const usuario = localStorage.getItem('usuario');
const rol = localStorage.getItem('rol');

if (!token) window.location.href = 'login.html';

document.getElementById('userInfo').textContent = `${usuario} (${rol})`;

function logout() {
    localStorage.clear();
    window.location.href = 'portada.html';
}

// =================== CARGAR PROYECTOS ===================
async function cargarProyectos() {
    const res = await fetch('/api/proyectos', {
        headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();

    const contenedor = document.getElementById('listaProyectos');
    contenedor.innerHTML = '';

    data.forEach(p => {
        contenedor.innerHTML += `
            <div class="card mb-3 p-3">
                <h5>${p.nombre}</h5>
                <p>${p.descripcion}</p>
                <p><b>Fecha:</b> ${p.fecha}</p>
                <p><b>Prioridad:</b> ${p.prioridad}</p>

                ${
                    rol === 'admin'
                    ? `
                    <select id="estado-${p.id}" class="form-select mb-2">
                        <option value="creado" ${p.estado === 'creado' ? 'selected' : ''}>Creado</option>
                        <option value="en_progreso" ${p.estado === 'en_progreso' ? 'selected' : ''}>En progreso</option>
                        <option value="finalizado" ${p.estado === 'finalizado' ? 'selected' : ''}>Finalizado</option>
                    </select>
                    <button onclick="guardarEstado(${p.id})" class="btn btn-success btn-sm">
                    Guardar
                    </button>
                      `
                    : `<p><b>Estado:</b> ${p.estado}</p>`
                }
            </div>
        `;
    });
}

// =================== CAMBIAR ESTADO ===================
async function guardarEstado(id) {
    const estado = document.getElementById(`estado-${id}`).value;

    await fetch(`/api/proyectos/${id}/estado`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ estado })
    });

    alert('Estado actualizado');
    cargarProyectos();
}

cargarProyectos();