export function formatDistance(distance) {
  const meters = Math.max(0, Math.floor(distance));
  return meters >= 1000 ? `${(meters / 1000).toFixed(2)} км` : `${meters} м`;
}

export function loadBestScore() {
  try {
    return Math.max(0, Number(window.localStorage.getItem('lava-dash-best')) || 0);
  } catch {
    return 0;
  }
}

export function saveBestScore(score) {
  try {
    window.localStorage.setItem('lava-dash-best', String(Math.max(0, Math.floor(score))));
  } catch {
    // The current run remains playable if browser storage is unavailable.
  }
}
