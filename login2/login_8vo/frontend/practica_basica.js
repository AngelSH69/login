const API_URL = 'http://localhost:3000/api/proyectos';
const listaProyectos = document.getElementById('listaProyectos');
const sinProyectos = document.getElementById('sinProyectos');
const formProyecto = document.getElementById('formProyecto');

window.onload = () => {
    cargarProyectos();
    cargarResponsables();
};

document.getElementById('fecha').min = new Date().toISOString().split('T')[0];


formProyecto.addEventListener('submit', guardarProyecto);


async function cargarProyectos() {
    const token = localStorage.getItem('token');

    if (!token) {
        alert('No hay token, inicia sesión');
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });


        if (response.status === 401) {
            const errorData = await response.json();

            if (errorData.error === 'Token expirado') {
                localStorage.clear();
                alert('Sesión expirada. Por favor inicia sesión nuevamente.');
                window.location.href = 'login.html';
            } else {

                alert('Error de autenticación: ' + errorData.error);
            }
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Error al cargar proyectos');
        }

        mostrarProyectos(data);
    } catch (error) {
        console.error('Error:', error);
        alert(error.message || 'Error al cargar proyectos');
    }
}


function mostrarProyectos(proyectos) {
    listaProyectos.innerHTML = '';

    if (!Array.isArray(proyectos)) {
        console.error('La respuesta no es un arreglo:', proyectos);
        sinProyectos.style.display = 'block';
        sinProyectos.textContent = 'No se pudieron cargar los proyectos';
        return;
    }

    if (proyectos.length === 0) {
        sinProyectos.style.display = 'block';
        sinProyectos.textContent = 'No hay proyectos registrados';
        return;
    }

    sinProyectos.style.display = 'none';

    proyectos.forEach(proyecto => {

        const clasePrioridad = proyecto.prioridad === 'alta' ? 'border-danger' :
            proyecto.prioridad === 'media' ? 'border-warning' : 'border-success';

        const fechaFormateada = new Date(proyecto.fecha).toLocaleDateString('es-ES');

        const proyectoHTML = `
            <div class="card ${clasePrioridad} mb-3">
                <div class="card-body">
                    <h5 class="card-title">${proyecto.nombre}</h5>
                    <p class="card-text">${proyecto.descripcion || 'Sin descripción'}</p>
                    <div class="d-flex justify-content-between">
                        <span class="badge bg-${proyecto.prioridad === 'alta' ? 'danger' :
                proyecto.prioridad === 'media' ? 'warning' : 'success'}">
                            ${proyecto.prioridad}
                        </span>
                        <p><b>Responsable:</b> ${proyecto.responsable_nombre || 'Sin asignar'}</p>
                        <p>
                            <b>Estado:</b> 
                                <span class="badge ${proyecto.estado === 'creado' ? 'bg-secondary' :
                proyecto.estado === 'en_progreso' ? 'bg-warning text-dark' : 'bg-success'}">
                            ${proyecto.estado}
                        </span>
                        </p>
                        <small class="text-muted">${fechaFormateada}</small>
                    </div>
                </div>
            </div>
        `;

        listaProyectos.innerHTML += proyectoHTML;
    });
}


async function guardarProyecto(event) {
    event.preventDefault();

    // faltaba (incluir) 111-117
    const token = localStorage.getItem('token');
    if (!token) {
        alert('No hay token, inicia sesión');
        window.location.href = 'login.html';
        return;
    }

    const nombre = document.getElementById('nombre').value.trim();
    const descripcion = document.getElementById('descripcion').value.trim();
    const fecha = document.getElementById('fecha').value;
    const prioridad = document.getElementById('prioridad').value;
    const responsable = document.getElementById('responsable').value;

    if (!nombre) {
        alert('El nombre es obligatorio');
        return;
    }

    if (!fecha) {
        alert('La fecha es obligatoria');
        return;
    }

    if (!prioridad) {
        alert('La prioridad es obligatoria');
        return;
    }

    if (!responsable) {
        alert('Selecciona un responsable');
        return;
    }

    const proyecto = {
        nombre: nombre,
        descripcion: descripcion,
        fecha: fecha,
        prioridad: prioridad,
        responsable: responsable
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(proyecto)
        });

        const data = await response.json();

        if (response.status === 401) {
            if (data.error === 'Token expirado') {
                localStorage.clear();
                alert('Sesión expirada. Por favor inicia sesión nuevamente.');
                window.location.href = 'login.html';
            } else {
                alert('Error de autenticación: ' + data.error);
            }
            return;
        }

        if (!response.ok) {
            throw new Error(data.error || 'Error al guardar');
        }

        alert('Proyecto creado exitosamente');

        const modal = bootstrap.Modal.getInstance(document.getElementById('modalProyecto'));
        modal.hide();
        formProyecto.reset();

        document.getElementById('fecha').value = new Date().toISOString().split('T')[0];

        cargarProyectos();

    } catch (error) {
        console.error('Error:', error);
        alert(error.message || 'Error al guardar proyecto');
    }
}

async function cargarResponsables() {
    try {
        const res = await fetch('/api/responsables');
        const data = await res.json();

        const select = document.getElementById('responsable');
        select.innerHTML = '<option value="">Selecciona responsable</option>';

        data.forEach(r => {
            select.innerHTML += `<option value="${r.id}">${r.nombre}</option>`;
        });

    } catch (error) {
        console.error('Error cargando responsables:', error);
    }
}