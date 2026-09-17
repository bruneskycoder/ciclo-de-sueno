// sheets.js — las capas que se abren encima de la pantalla principal.
// Son <dialog> nativos: eso da gratis el foco atrapado adentro, el cierre
// con Escape y la semántica correcta para lectores de pantalla. Escribir
// eso a mano son cien líneas y varios errores de accesibilidad.

const alAbrir = new Map();

export function registerSheet(id, onOpen) {
    if (onOpen) alAbrir.set(id, onOpen);

    const hoja = document.getElementById(id);
    hoja.querySelectorAll('[data-cerrar-hoja]').forEach((btn) => {
        btn.addEventListener('click', () => hoja.close());
    });

    // Tocar el fondo oscuro cierra. El <dialog> ocupa toda la ventana
    // aunque su contenido no, así que un clic "afuera" llega igual al
    // propio dialog: se compara contra el contenido para distinguirlo.
    hoja.addEventListener('click', (evento) => {
        if (evento.target === hoja) hoja.close();
    });
}

export function openSheet(id) {
    const hoja = document.getElementById(id);
    alAbrir.get(id)?.();
    hoja.showModal();

    // El título recibe el foco para que un lector de pantalla anuncie
    // dónde quedó parado. Sin esto, abrir una capa es mudo.
    hoja.querySelector('h2')?.focus();
}
