export function setMode(mode) {
    const wakeTab = document.getElementById('wake-tab');
    const sleepTab = document.getElementById('sleep-tab');
    const timeLabel = document.getElementById('time-label');

    if (mode === 'wake') {
        wakeTab.classList.add('active'); sleepTab.classList.remove('active');
        timeLabel.textContent = 'Quiero levantarme con el sol a las:';
    } else {
        sleepTab.classList.add('active'); wakeTab.classList.remove('active');
        timeLabel.textContent = 'Me voy a las pilchas a las:';
    }
    document.getElementById('results-table').style.display = 'none';
}
