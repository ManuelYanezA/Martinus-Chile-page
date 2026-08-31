const ORGANIGRAMA_JSON = "../js/organigrama.json";

let organigramaData = null;
let todoExpandido = false;

// Variables para el zoom

let zoomActual = 1;

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.1;


// ============================================
// Cargar JSON
// ============================================

async function cargarOrganigrama() {

    try {

        const response = await fetch(ORGANIGRAMA_JSON);

        if (!response.ok) {
            throw new Error("No se pudo cargar el JSON");
        }

        organigramaData = await response.json();

        inicializarOrganigrama();

    } catch (error) {

        console.error("Error cargando el organigrama:", error);

        document.getElementById("organigrama").innerHTML = `
            <div class="alert alert-danger">
                No se pudo cargar el organigrama.
            </div>
        `;
    }
}


// ============================================
// Inicializar
// ============================================

function inicializarOrganigrama() {

    const contenedor = document.getElementById("organigrama");

    contenedor.innerHTML = "";

    // Crear SVG
    const svg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
    );

    svg.setAttribute("id", "organigrama-lines");

    contenedor.appendChild(svg);

    // Nodo raíz
    const raiz = crearNodo("gerente-general");

    contenedor.appendChild(raiz);

}


// ============================================
// Crear nodo
// ============================================

function crearNodo(id) {

    const nodo = organigramaData.nodos[id];

    if (!nodo) {
        console.error(`No existe el nodo: ${id}`);
        return document.createElement("div");
    }


    // Contenedor principal del nodo
    const nodoContainer = document.createElement("div");

    nodoContainer.classList.add("org-node-container");

    nodoContainer.dataset.id = id;


    // ----------------------------------------
    // Tarjeta del cargo
    // ----------------------------------------

    const nodoCard = document.createElement("div");

    nodoCard.classList.add(
        "org-node",
        `org-node-${nodo.color}`
    );


    // Nombre del cargo
    const nombre = document.createElement("div");

    nombre.classList.add("org-node-name");

    nombre.textContent = nodo.nombre;

    nodoCard.appendChild(nombre);


    // Empleado, si existe
    if (nodo.empleado) {

        const empleado = document.createElement("div");

        empleado.classList.add("org-node-employee");

        empleado.textContent = nodo.empleado;

        nodoCard.appendChild(empleado);
    }


    // ----------------------------------------
    // Botón expandir
    // ----------------------------------------

    if (nodo.hijos && nodo.hijos.length > 0) {

        const boton = document.createElement("button");

        boton.classList.add(
            "btn",
            "btn-sm",
            "btn-dark",
            "org-toggle"
        );

        boton.textContent = "+";

        boton.setAttribute(
            "aria-label",
            `Mostrar dependencias de ${nodo.nombre}`
        );


        boton.addEventListener("click", () => {

            const hijosContainer =
                nodoContainer.querySelector(":scope > .org-children");

            const estaExpandido =
                hijosContainer.classList.contains("show");


            if (estaExpandido) {

                hijosContainer.classList.remove("show");

                boton.textContent = "+";

            } else {

                hijosContainer.classList.add("show");

                boton.textContent = "−";
            }

            setTimeout(() => {dibujarConexiones();}, 0);

        });


        nodoCard.appendChild(boton);
    }


    nodoContainer.appendChild(nodoCard);


    // ----------------------------------------
    // Hijos
    // ----------------------------------------

    if (nodo.hijos && nodo.hijos.length > 0) {

        const hijosContainer = document.createElement("div");

        hijosContainer.classList.add("org-children");


        nodo.hijos.forEach(hijoId => {

            const hijo = crearNodo(hijoId);

            hijosContainer.appendChild(hijo);

        });


        nodoContainer.appendChild(hijosContainer);
    }


    return nodoContainer;
}


// ============================================
// Mostrar / ocultar todo
// ============================================

function toggleTodos() {

    todoExpandido = !todoExpandido;


    const hijosContainers =
        document.querySelectorAll(".org-children");


    const botones =
        document.querySelectorAll(".org-toggle");


    hijosContainers.forEach(container => {

        if (todoExpandido) {

            container.classList.add("show");

        } else {

            container.classList.remove("show");

        }

    });


    botones.forEach(boton => {

        boton.textContent =
            todoExpandido ? "−" : "+";

    });


    const botonGlobal =
        document.getElementById("toggle-all");


    botonGlobal.textContent =
        todoExpandido
            ? "Ocultar todo"
            : "Mostrar todo";


    /*
     * Esperar a que el DOM actualice las posiciones
     * antes de recalcular las líneas.
     */
    requestAnimationFrame(() => {

        dibujarConexiones();


        /*
         * Si acabamos de replegar todo,
         * centrar nuevamente el nodo raíz.
         */
        if (!todoExpandido) {

            requestAnimationFrame(() => {

                centrarNodoRaiz();

            });

        }

    });

}

function centrarNodoRaiz() {

    const viewport =
        document.getElementById("organigrama-viewport");

    const raiz =
        document.querySelector(
            '.org-node-container[data-id="gerente-general"]'
        );


    if (!viewport || !raiz) {
        return;
    }


    const nodoRaiz =
        raiz.querySelector(":scope > .org-node");


    if (!nodoRaiz) {
        return;
    }


    const viewportRect =
        viewport.getBoundingClientRect();

    const raizRect =
        nodoRaiz.getBoundingClientRect();


    /*
     * Diferencia entre el centro del viewport
     * y el centro del nodo raíz.
     */
    const desplazamientoX =
        (
            raizRect.left +
            raizRect.width / 2
        ) -
        (
            viewportRect.left +
            viewportRect.width / 2
        );


    const desplazamientoY =
        (
            raizRect.top +
            raizRect.height / 2
        ) -
        (
            viewportRect.top +
            viewportRect.height / 2
        );


    /*
     * Ajustar el scroll teniendo en cuenta el zoom.
     */
    viewport.scrollLeft +=
        desplazamientoX;

    viewport.scrollTop +=
        desplazamientoY;

}


// ============================================
// Evento botón global
// ============================================

document.getElementById("toggle-all").addEventListener("click", toggleTodos);

// ============================================
// Función para dibujar conexiones entre nodos
// ============================================

function dibujarConexiones() {

    const svg = document.getElementById("organigrama-lines");

    if (!svg) {
        console.error("No existe el SVG del organigrama");
        return;
    }

    const organigrama = document.getElementById("organigrama");

    if (!organigrama) {
        return;
    }

    // Limpiar conexiones anteriores
    svg.innerHTML = "";

    // Crear flecha
    crearArrowMarker(svg);

    /*
     * Rectángulo visual del organigrama.
     *
     * getBoundingClientRect() considera el zoom aplicado
     * mediante transform: scale().
     */
    const organigramaRect =
        organigrama.getBoundingClientRect();

    /*
     * Factor de escala actual.
     *
     * El ancho visual es distinto al ancho real debido
     * al transform: scale().
     */
    const escalaX =
        organigramaRect.width / organigrama.offsetWidth;

    const escalaY =
        organigramaRect.height / organigrama.offsetHeight;


    // Tamaño del SVG en coordenadas NATURALES
    svg.setAttribute(
        "width",
        organigrama.offsetWidth
    );

    svg.setAttribute(
        "height",
        organigrama.offsetHeight
    );


    // Todos los nodos
    const nodos =
        document.querySelectorAll(
            ".org-node-container"
        );


    nodos.forEach(nodoContainer => {

        const id =
            nodoContainer.dataset.id;

        const nodo =
            organigramaData.nodos[id];


        if (!nodo || !nodo.hijos) {
            return;
        }


        // Contenedor de hijos directo
        const hijosContainer =
            nodoContainer.querySelector(
                ":scope > .org-children"
            );


        // No dibujar conexiones de ramas cerradas
        if (
            !hijosContainer ||
            !hijosContainer.classList.contains("show")
        ) {
            return;
        }


        // Nodo padre
        const nodoElement =
            nodoContainer.querySelector(
                ":scope > .org-node"
            );


        if (!nodoElement) {
            return;
        }


        const padreRect =
            nodoElement.getBoundingClientRect();


        /*
         * Convertimos las coordenadas visuales
         * nuevamente a coordenadas naturales.
         */
        const x1 =
            (
                (padreRect.left - organigramaRect.left)
                / escalaX
            ) +
            (
                padreRect.width / escalaX / 2
            );


        const y1 =
            (
                padreRect.bottom -
                organigramaRect.top
            ) / escalaY;


        // Hijos
        const hijos =
            hijosContainer.children;


        Array.from(hijos).forEach(
            hijoContainer => {

                const hijoElement =
                    hijoContainer.querySelector(
                        ":scope > .org-node"
                    );


                if (!hijoElement) {
                    return;
                }


                const hijoRect =
                    hijoElement.getBoundingClientRect();


                const x2 =
                    (
                        (hijoRect.left - organigramaRect.left)
                        / escalaX
                    ) +
                    (
                        hijoRect.width / escalaX / 2
                    );


                const y2 =
                    (
                        hijoRect.top -
                        organigramaRect.top
                    ) / escalaY;


                crearConexion(
                    svg,
                    x1,
                    y1,
                    x2,
                    y2
                );

            }
        );

    });
}

// ============================================
// Función de dibujado de líneas
// ============================================

function crearConexion(
    svg,
    x1,
    y1,
    x2,
    y2
) {

    const path =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path"
        );


    // Punto medio vertical
    const mitadY =
        y1 + (y2 - y1) / 2;


    const d = `
        M ${x1} ${y1}
        L ${x1} ${mitadY}
        L ${x2} ${mitadY}
        L ${x2} ${y2}
    `;


    path.setAttribute("d", d);

    path.classList.add(
        "org-connection"
    );


    path.setAttribute(
        "marker-end",
        "url(#arrow)"
    );


    svg.appendChild(path);
}

// ============================================
// Crear marcador de flecha para las líneas
// ============================================

function crearArrowMarker(svg) {

    const defs =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "defs"
        );


    const marker =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "marker"
        );


    marker.setAttribute(
        "id",
        "arrow"
    );

    marker.setAttribute(
        "viewBox",
        "0 0 10 10"
    );

    marker.setAttribute(
        "refX",
        "9"
    );

    marker.setAttribute(
        "refY",
        "5"
    );

    marker.setAttribute(
        "markerWidth",
        "6"
    );

    marker.setAttribute(
        "markerHeight",
        "6"
    );

    marker.setAttribute(
        "orient",
        "auto"
    );


    const path =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path"
        );


    path.setAttribute(
        "d",
        "M 0 0 L 10 5 L 0 10 z"
    );


    path.setAttribute(
        "fill",
        "#495057"
    );


    marker.appendChild(path);

    defs.appendChild(marker);

    svg.appendChild(defs);
}

function aplicarZoom() {

    const organigrama =
        document.getElementById("organigrama");

    const wrapper =
        document.getElementById("organigrama-wrapper");


    if (!organigrama || !wrapper) {
        return;
    }


    // Aplicar zoom
    organigrama.style.transform =
        `scale(${zoomActual})`;


    /*
     * Obtener el tamaño natural del organigrama.
     */
    const ancho =
        organigrama.offsetWidth;

    const alto =
        organigrama.offsetHeight;


    /*
     * Ajustar el espacio ocupado por el wrapper.
     *
     * Esto permite que el viewport pueda hacer
     * scroll correctamente después del zoom.
     */
    wrapper.style.width =
        `${ancho * zoomActual}px`;

    wrapper.style.height =
        `${alto * zoomActual}px`;


    /*
     * Actualizar porcentaje mostrado.
     */
    document.getElementById(
        "zoom-reset"
    ).textContent =
        `${Math.round(zoomActual * 100)}%`;


    /*
     * Esperar a que el navegador termine de aplicar
     * el transform antes de recalcular las líneas.
     */
    requestAnimationFrame(() => {

        dibujarConexiones();

    });

}

// ============================================
// Controles de zoom
// ============================================

document.getElementById("zoom-in").addEventListener("click", () => {

    if (zoomActual < ZOOM_MAX) {
        zoomActual += ZOOM_STEP;

        // Evitar problemas de precisión decimal
        zoomActual = Math.round(zoomActual * 10) / 10;

        aplicarZoom();
    }

});


document.getElementById("zoom-out").addEventListener("click", () => {

    if (zoomActual > ZOOM_MIN) {
        zoomActual -= ZOOM_STEP;

        // Evitar problemas de precisión decimal
        zoomActual = Math.round(zoomActual * 10) / 10;

        aplicarZoom();
    }

});


document.getElementById("zoom-reset").addEventListener("click", () => {

    zoomActual = 1;

    aplicarZoom();

});

// ============================================
// Iniciar
// ============================================

cargarOrganigrama();

window.addEventListener("resize", () => {

    dibujarConexiones();

});