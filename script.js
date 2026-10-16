// Estado global para guardar el árbol de conversación y el historial
let arbolDecision = {};
let historialRespuestas = [];

// Elementos del DOM respetando boceto y reglas
const zonaMensajes = document.getElementById('zonas-de-mensajes');
const ingresoOpciones = document.getElementById('ingresos-de-opciones');

// Inicializar y cargar el JSON
document.addEventListener('DOMContentLoaded', () => {
    cargarArbolDecision();
});

// Función para obtener el JSON de conversación
function cargarArbolDecision() {
    fetch('arbol_decision.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Red de respuesta no OK');
            }
            return response.json();
        })
        .then(data => {
            arbolDecision = data;
            // Iniciar en el nodo inicial
            irANodo('inicio');
        })
        .catch(error => {
            console.error('Error al cargar arbol_decision.json:', error);
            mostrarErrorServidor();
        });
}

// Muestra el mensaje si no se usa Live Server o falla el fetch
function mostrarErrorServidor() {
    zonaMensajes.innerHTML = '';
    ingresoOpciones.innerHTML = '';
    
    const msjError = document.createElement('div');
    msjError.className = 'mensaje bot';
    msjError.style.color = '#b71c1c';
    msjError.style.fontWeight = 'bold';
    msjError.textContent = 'Abrí el proyecto con Live Server o un servidor local para que pueda leer arbol_decision.json.';
    
    zonaMensajes.appendChild(msjError);
}

// Cambia al nodo especificado y renderiza los componentes
function irANodo(idNodo) {
    const nodo = arbolDecision[idNodo];
    if (!nodo) {
        console.error('Nodo no encontrado:', idNodo);
        return;
    }

    // Agregar mensaje del bot a la zona de mensajes
    agregarMensajeBot(nodo.texto);

    // Limpiar zona de opciones previa
    ingresoOpciones.innerHTML = '';

    // Si requiere entrada de datos específica
    if (nodo.requiereInput) {
        renderizarFormularioInput(nodo);
    } else if (nodo.opciones && nodo.opciones.length > 0) {
        // Renderizar botones de opción
        nodo.opciones.forEach(opcion => {
            const boton = document.createElement('button');
            boton.className = 'opcion-btn';
            boton.textContent = opcion.texto;
            boton.addEventListener('click', () => {
                // Registrar respuesta del usuario en zona de mensajes
                agregarMensajeUsuario(opcion.texto);
                
                // Guardar en el historial del bot
                historialRespuestas.push({ nodo: idNodo, seleccion: opcion.texto });

                // Navegar al siguiente nodo
                irANodo(opcion.siguiente);
            });
            ingresoOpciones.appendChild(boton);
        });
    }
}

// Agrega un mensaje del bot al chat con autoscroll
function agregarMensajeBot(texto) {
    const msj = document.createElement('div');
    msj.className = 'mensaje bot';
    msj.textContent = texto;
    zonaMensajes.appendChild(msj);
    zonaMensajes.scrollTop = zonaMensajes.scrollHeight;
}

// Agrega la selección de la parte 'usuario' al chat
function agregarMensajeUsuario(texto) {
    const msj = document.createElement('div');
    msj.className = 'mensaje usuario';
    msj.textContent = texto;
    zonaMensajes.appendChild(msj);
    zonaMensajes.scrollTop = zonaMensajes.scrollHeight;
}

// Manejo exclusivo de campos de entrada con validación estricta
function renderizarFormularioInput(nodo) {
    const contenedor = document.createElement('div');
    contenedor.style.display = 'flex';
    contenedor.style.flexDirection = 'column';
    contenedor.style.gap = '5px';

    const form = document.createElement('form');
    form.className = 'input-contenedor';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'input-datos';
    input.placeholder = nodo.placeholder || 'Escribe aquí...';

    const btnEnviar = document.createElement('button');
    btnEnviar.type = 'submit';
    btnEnviar.className = 'opcion-btn';
    btnEnviar.textContent = 'Enviar';

    const msjError = document.createElement('span');
    msjError.className = 'error-msj';

    form.appendChild(input);
    form.appendChild(btnEnviar);
    contenedor.appendChild(form);
    contenedor.appendChild(msjError);

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const valor = input.value.trim();

        // Validación de formato según la regla requerida
        if (nodo.tipoValidacion === 'texto') {
            const tieneNumeros = /\d/.test(valor);
            if (!valor || tieneNumeros) {
                msjError.textContent = 'Por favor, ingresá un texto válido sin números.';
                return;
            }
        } else if (nodo.tipoValidacion === 'numero') {
            const esNumero = !isNaN(valor) && valor !== '';
            if (!esNumero) {
                msjError.textContent = 'Por favor, ingresá un valor numérico válido.';
                return;
            }
        }

        // Si la validación es correcta, avanzar
        agregarMensajeUsuario(valor);
        historialRespuestas.push({ nodo: nodo.id, valorInput: valor });
        irANodo(nodo.siguiente);
    });

    ingresoOpciones.appendChild(contenedor);
}
