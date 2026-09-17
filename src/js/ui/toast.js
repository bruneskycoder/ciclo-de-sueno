// toast.js — aviso breve al pie de la pantalla. Es un <div role="status"
// aria-live="polite">, así que un lector de pantalla lo anuncia sin
// interrumpir lo que la persona esté haciendo.
let temporizador;

export function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('visible');

    // Si llega un aviso nuevo mientras hay uno arriba, se reinicia la
    // cuenta en vez de que el primero se lleve puesto al segundo.
    clearTimeout(temporizador);
    temporizador = setTimeout(() => toast.classList.remove('visible'), 3000);
}
