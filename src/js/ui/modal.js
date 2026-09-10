// modal.js — reemplaza confirm() nativo del navegador por un <dialog> propio,
// acorde a la estética de la app. <dialog> da gratis: foco atrapado adentro,
// cierre con Escape, y semántica de accesibilidad correcta — no hay que
// reinventar nada de eso a mano.
//
// chooseModal soporta una cantidad arbitraria de botones (la Fase 6 de
// import necesita 3: cancelar/fusionar/reemplazar, no solo sí/no).
// confirmModal queda como un atajo de 2 opciones para no tocar los call
// sites que ya lo usaban desde la Fase 2.

const VARIANT_CLASS = {
    primary: 'modal-btn-primary',
    danger: 'modal-btn-confirm',
};

export function chooseModal({ message, choices }) {
    const dialog = document.getElementById('app-modal');
    dialog.querySelector('.modal-message').textContent = message;

    const actions = dialog.querySelector('.modal-actions');
    actions.innerHTML = '';
    choices.forEach(({ value, label, variant }) => {
        const btn = document.createElement('button');
        btn.type = 'submit';
        btn.value = value;
        btn.className = `modal-btn ${VARIANT_CLASS[variant] || ''}`.trim();
        btn.textContent = label;
        actions.appendChild(btn);
    });

    dialog.showModal();

    // dialog.returnValue queda en '' si se cierra con Escape (o sin haber
    // apretado ningún botón) — se lo devolvemos tal cual a quien llama,
    // que decide qué hacer con un "cancelado" (confirmModal lo trata como
    // false; el flujo de import de Fase 6 lo trata como "no hacer nada").
    return new Promise((resolve) => {
        dialog.addEventListener('close', () => resolve(dialog.returnValue), { once: true });
    });
}

export function confirmModal({ message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar' } = {}) {
    return chooseModal({
        message,
        choices: [
            { value: 'cancel', label: cancelLabel },
            { value: 'confirm', label: confirmLabel, variant: 'danger' },
        ],
    }).then((value) => value === 'confirm');
}
