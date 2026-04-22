// JS app.js

const { prependListener } = require("./db");

const API_URL = 'http://localhost:3000/api/proyectos';
const listaProyectos = document.getElementById('listaProyectos');
const sinProyectos = document.getElementById('sinProyectos');
const formProyecto = document.getElementById('formProyecto');

const mdalTitulo = document.getElementById('modalTitulo');
const btnGuardar = document.getElementById('btnGuardar');
const btnNuevo = document.getElementById('btnNuevo');

const inputId = document.getElementById('proyectoId');
const inputNombre = document.getElementById('nombre');
const inputDescripcion = document.getElementById('descripcion');
const inputFecha = document.getElementById('fecha');
const inputPrioridad = document.getElementById('prioridad');

// Cargar proyectos al inicio
window.onload = cargarProyectos;

// Configurar fecha mínima
document.getElementById('fecha').min = new Date().toISOString().split('T')[0];

// Boton nuevo proyecto
btnNuevo.addEventListener('click', () => {
    prepararModoCrear();
});
// Manejar formulario
formProyecto.addEventListener('submit', guardarProyecto);

// Función para cargar proyectos
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

// Función para mostrar proyectos
function mostrarProyectos(proyectos) {
    listaProyectos.innerHTML = '';
    
    if (proyectos.length === 0) {
    sinProyectos.style.display = 'block';
    return;
    }

    sinProyectos.style.display = 'none';
    
    proyectos.forEach(proyecto => {
        const clasePrioridad = proyecto.prioridad;
        const fechaFormateada = new Date(proyecto.fecha).toLocaleDateString('es-ES');

        const proyectoHTML = `
        <div class="card ${clasePrioridad}">
            <div class="card-body">
                <div class="card-title d-flex justify-content-between align-items-center">
            </div>
        </div>`;

        listaProyectos.innerHTML += proyectoHTML;
    });
}

// Función para guardar proyecto
async function guardarProyecto(event) {
    event.preventDefault();

    const proyecto = {
        nombre: document.getElementById('nombre').value,
        descripcion: document.getElementById('descripcion').value,
        fecha: document.getElementById('fecha').value,
        prioridad: document.getElementById('prioridad').value
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(proyecto)
        });

        if (!response.ok) throw new Error('Error al guardar');

        // Cerrar modal y limpiar
        const modalEl = document.getElementById('modalProyecto');
        const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        modal.hide();
        formProyecto.reset();

        // Recargar lista
        cargarProyectos();

    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar proyecto');
    }
}