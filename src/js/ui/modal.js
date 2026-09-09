// modal.js — reemplaza confirm() nativo del navegador por un <dialog> propio,
// acorde a la estética de la app. <dialog> da gratis: foco atrapado adentro,
// cierre con Escape, y semántica de accesibilidad correcta — no hay que
// reinventar nada de eso a mano.

export function confirmModal({ message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar' } = {}) {
    const dialog = document.getElementById('app-modal');
    dialog.querySelector('.modal-message').textContent = message;

    const cancelBtn = dialog.querySelector('.modal-btn-cancel');
    const confirmBtn = dialog.querySelector('.modal-btn-confirm');
    cancelBtn.textContent = cancelLabel;
    confirmBtn.textContent = confirmLabel;

    dialog.showModal();

    return new Promise((resolve) => {
        dialog.addEventListener(
            'close',
            () => resolve(dialog.returnValue === 'confirm'),
            { once: true }
        );
    });
}
