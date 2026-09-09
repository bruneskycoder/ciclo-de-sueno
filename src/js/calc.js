// calc.js — lógica de cálculo de ciclos de sueño.
// NOTA: esta versión todavía manipula el DOM directamente (igual que en el
// index.html original). La Fase 2 del plan de rediseño la separa en una
// función pura (input → output) testeable con Vitest, desacoplada de la
// vista. No cambiar ese acoplamiento acá: esto es un movimiento mecánico
// de código, no un refactor de comportamiento.
import { showToast } from './ui/toast.js';

export function formatTime(date) {
    return date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0');
}

export function calcularCiclos() {
    const isWakeUp = document.getElementById('wake-tab').classList.contains('active');
    const timeInput = document.getElementById('time-input').value;
    const latencyInput = parseInt(document.getElementById('latency-input').value) || 0;

    if (!timeInput) return showToast('¡Decime a qué hora, que si no ando a ciegas!');

    const [hours, minutes] = timeInput.split(':').map(Number);
    const baseDate = new Date(); baseDate.setHours(hours, minutes, 0, 0);

    const tbody = document.getElementById('results-body'); tbody.innerHTML = '';
    document.getElementById('results-table').style.display = 'block';

    for (let i = 1; i <= 6; i++) {
        const sleepDurationMins = i * 90; const targetDate = new Date(baseDate);
        let bedtimeStr;
        if (isWakeUp) {
            targetDate.setMinutes(targetDate.getMinutes() - sleepDurationMins - latencyInput);
            bedtimeStr = formatTime(targetDate);
        } else {
            bedtimeStr = formatTime(baseDate);
            targetDate.setMinutes(targetDate.getMinutes() + sleepDurationMins + latencyInput);
        }

        const totalMins = sleepDurationMins + latencyInput;
        const hrs = Math.floor(totalMins / 60); const mins = totalMins % 60;
        const row = document.createElement('tr');
        if (i >= 4 && i <= 6) row.classList.add('optimal');

        row.innerHTML = `
            <td>${i}</td>
            <td>${hrs}h ${mins}m</td>
            <td style="font-size: 24px; font-weight: bold; color: #5d4037;">${formatTime(targetDate)}</td>
            <td><button class="save-btn" onclick="saveRecord(${totalMins}, '${bedtimeStr}')">Marcar</button></td>
        `;
        tbody.appendChild(row);
    }
}
