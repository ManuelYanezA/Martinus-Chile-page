const ORGANIGRAMA_JSON = "../js/organigrama.json";

let organigramaData = null;
let todoExpandido = false;


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


    botonGlobal.textContent = todoExpandido ? "Ocultar todo" : "Mostrar todo";

    setTimeout(() => {dibujarConexiones();}, 0);

}


// ============================================
// Evento botón global
// ============================================

document.getElementById("toggle-all").addEventListener("click", toggleTodos);

// ============================================
// Función para dibujar conexiones entre nodos
// ============================================

function dibujarConexiones() {

    const svg =
        document.getElementById("organigrama-lines");


    if (!svg) {
        console.error("No existe el SVG del organigrama");
        return;
    }


    // Limpiar conexiones anteriores
    svg.innerHTML = "";


    // Crear flecha
    crearArrowMarker(svg);


    const organigrama =
    document.getElementById("organigrama");

    const organigramaRect =
    organigrama.getBoundingClientRect();

    svg.setAttribute(
        "width",
        organigrama.scrollWidth
    );

    svg.setAttribute(
        "height",
        organigrama.scrollHeight
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


        const padreRect =
            nodoElement.getBoundingClientRect();


        // Punto inferior del padre
        const x1 =
            padreRect.left +
            padreRect.width / 2 -
            organigramaRect.left;


        const y1 =
            padreRect.bottom -
            organigramaRect.top;


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


                // Punto superior del hijo
                const x2 =
                    hijoRect.left +
                    hijoRect.width / 2 -
                    organigramaRect.left;


                const y2 =
                    hijoRect.top -
                    organigramaRect.top;


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

// ============================================
// Iniciar
// ============================================

cargarOrganigrama();

window.addEventListener("resize", () => {

    dibujarConexiones();

});