async function cargarComponente(id, archivo) {
    const response = await fetch(archivo);
    const html = await response.text();

    document.getElementById(id).innerHTML = html;
}

cargarComponente("header", "/components/header.html");
cargarComponente("footer", "/components/footer.html");