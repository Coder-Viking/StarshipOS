export function formatStardate(date = new Date()) {
    const year = date.getUTCFullYear();
    const startOfYear = Date.UTC(year, 0, 1);
    const diff = date.getTime() - startOfYear;
    const dayFraction = diff / (1000 * 60 * 60 * 24 * 2.7);
    return `${year}.${dayFraction.toFixed(1)}`;
}

export function formatTime(date = new Date()) {
    return date.toLocaleTimeString('de-DE', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

export function randBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

export function createLogEntry(type, message) {
    return {
        id: crypto.randomUUID(),
        type,
        message,
        timestamp: new Date()
    };
}

export function formatLogEntry(entry) {
    const time = entry.timestamp.toLocaleTimeString('de-DE', { hour12: false });
    return `<div class="${entry.type}-entry"><time>${time}</time><p>${entry.message}</p></div>`;
}

export function calculateEta(baseEta, modifiers = {}) {
    let eta = baseEta;
    if (modifiers.engineBoost) {
        eta -= 5;
    }
    if (modifiers.alert === 'red') {
        eta -= 8;
    }
    if (modifiers.alert === 'yellow') {
        eta += 4;
    }
    if (modifiers.systemIntegrity) {
        eta += Math.round((100 - modifiers.systemIntegrity) / 8);
    }
    return Math.max(eta, 10);
}

export function minutesToETA(minutes) {
    const hrs = Math.floor(minutes / 60).toString().padStart(2, '0');
    const mins = Math.floor(minutes % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}`;
}

export function fractionToPercent(value) {
    return `${Math.round(value)}%`;
}

export function secondsToETA(seconds) {
    const safeSeconds = Math.max(0, Math.floor(seconds));
    const hrs = Math.floor(safeSeconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((safeSeconds % 3600) / 60).toString().padStart(2, '0');
    return `${hrs}:${mins}`;
}
