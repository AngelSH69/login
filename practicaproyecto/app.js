const API_URL = 'http://localhost:3000/api/proyectos';

const listaProyectos = document.getElementById('listaProyectos');
const sinProyectos = document.getElementById('sinProyectos');
const formProyecto = document.getElementById('formProyecto');

const modalTitulo = document.getElementById('modalTitulo');
const btnGuardar = document.getElementById('btnGuardar');
const btnNuevo = document.getElementById('btnNuevo');

const inputId = document.getElementById('proyectoId');
const inputNombre = document.getElementById('nombre');
const inputDescripcion = document.getElementById('descripcion');
const inputFecha = document.getElementById('fecha');
const inputPrioridad = document.getElementById('prioridad');

// Cargar proyectos al iniciar
window.onload = cargarProyectos;

// Fecha mínima (opcional)
document.getElementById('fecha').min = new Date().toISOString().split('T')[0];

// Botón "Nuevo" deja el form limpio en modo crear
btnNuevo.addEventListener('click', () => {
    prepararModoCrear();
});

// Submit del formulario: crea o edita según haya id
formProyecto.addEventListener('submit', guardarOActualizar);

// GET
async function cargarProyectos() {
  try {
    const response = await fetch(API_URL);
    const proyectos = await response.json();
    mostrarProyectos(proyectos);
  } catch (error) {
    console.error('Error:', error);
    alert('Error al cargar proyectos');
  }
}

function mostrarProyectos(proyectos) {
  listaProyectos.innerHTML = '';

  if (proyectos.length === 0) {
    sinProyectos.style.display = 'block';
    return;
  }

  sinProyectos.style.display = 'none';

  proyectos.forEach((p) => {
    const clasePrioridad = p.prioridad;
    const fechaFormateada = new Date(p.fecha).toLocaleDateString('es-ES');

    const proyectoHTML = `
    <div class="card ${clasePrioridad}">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <h5 class="card-title mb-1">${p.nombre}</h5>
            <p class="card-text mb-2">${p.descripcion || 'Sin descripción'}</p>
            <div class="d-flex gap-2 align-items-center">
              <span class="badge bg-secondary">${p.prioridad}</span>
              <small class="text-muted">${fechaFormateada}</small>
            </div>
          </div>
        </div>

        <div class="d-flex gap-2">
          <button class="btn btn-sm btn-outline-primary"
            onclick='abrirEditar(${JSON.stringify(p)})'>
            Editar
          </button>

          <button class="btn btn-sm btn-outline-danger"
            onclick="eliminarProyecto(${p.id})">
            Eliminar
          </button>
        </div>
      </div>
    </div>
    `;

    listaProyectos.innerHTML += proyectoHTML;
  });
}


// CREATE o UPDATE
async function guardarOActualizar(event) {
  event.preventDefault();

  const id = inputId.value; // si existe, editamos
  const proyecto = {
    nombre: inputNombre.value.trim(),
    descripcion: inputDescripcion.value.trim(),
    fecha: inputFecha.value,
    prioridad: inputPrioridad.value
  };

  try {
    let response;

    if (!id) {
      // POST
      response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proyecto)
      });
    } else {
      // PUT
      response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proyecto)
      });
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Error en la operación');
    }

    //cerrar el modal y limpiar
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalProyecto'));
    modal.hide();
    formProyecto.reset();
    inputId.value='';

    await cargarProyectos();
  }catch (error){
    console.error('Error', error);
    alert(error.message || 'Error al guardar/editar');
  }
}

// Abre modal en modo editar con datos
function abrirEditar(proyecto) {
    inputId.value = proyecto.id;
    inputNombre.value = proyecto.nombre || '';
    inputDescripcion.value = proyecto.descripcion || '';
    inputFecha.value = (proyecto.fecha || '').split('T')[0]; // por si viene con hora
    inputPrioridad.value = proyecto.prioridad || '';

    modalTitulo.textContent = 'Editar Proyecto';
    btnGuardar.textContent = 'Actualizar';

    const modal = new bootstrap.Modal(document.getElementById('modalProyecto'));
    modal.show();
}

// Deja modal en modo crear
function prepararModoCrear() {
    inputId.value = '';
    formProyecto.reset();
    modalTitulo.textContent = 'Nuevo Proyecto';
    btnGuardar.textContent = 'Guardar';
}

// DELETE
async function eliminarProyecto(id) {
  const ok = confirm('¿Seguro que deseas eliminar este proyecto?');
  if (!ok) return;

  try {
    const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Error al eliminar');
    }

    await cargarProyectos();
  } catch (error) {
    console.error('Error:', error);
    alert(error.message || 'Error al eliminar');
  }
}

