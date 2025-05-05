function mostrarSeccion(id) {
    const secciones = document.querySelectorAll('.seccion');
    secciones.forEach(sec => sec.classList.add('oculto'));

    const seleccionada = document.getElementById(id);
    if (seleccionada) {
        seleccionada.classList.remove('oculto');
    }
}
