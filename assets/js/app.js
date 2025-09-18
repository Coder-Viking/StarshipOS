import {
    SHIP_SYSTEMS,
    SECTORS,
    COMM_CHANNELS,
    CREW,
    OBJECTIVES,
    SENSOR_BASELINES,
    ALERT_STATES,
    INITIAL_LOG,
    RANDOM_EVENTS
} from './modules/data.js';

import {
    formatStardate,
    formatTime,
    randBetween,
    clamp,
    createLogEntry,
    formatLogEntry,
    calculateEta,
    secondsToETA
} from './modules/utils.js';

const state = {
    systems: SHIP_SYSTEMS.map(system => ({ ...system })),
    alert: 'green',
    navPlan: null,
    navTimer: null,
    logs: INITIAL_LOG.map(entry => ({ ...entry, id: crypto.randomUUID(), timestamp: new Date() })),
    sensorReadings: [],
    simulationPaused: false,
    savedSnapshots: [],
    replay: {
        timer: null,
        entries: [],
        index: 0
    }
};

const STORAGE_KEY = 'starshipos:snapshots';

const elements = {};

function cacheDom() {
    elements.stardate = document.getElementById('stardate');
    elements.shipClock = document.getElementById('ship-clock');
    elements.systemGrid = document.getElementById('system-grid');
    elements.inspectorBody = document.getElementById('inspector-body');
    elements.inspectorStatus = document.getElementById('inspector-status');
    elements.powerOutputs = document.querySelectorAll('.power-value');
    elements.powerSliders = document.querySelectorAll('.power-group input[type="range"]');
    elements.balancePower = document.getElementById('balance-power');
    elements.navSector = document.getElementById('nav-sector');
    elements.navStatus = document.getElementById('nav-status');
    elements.navCoordinates = document.getElementById('nav-coordinates');
    elements.navWindow = document.getElementById('nav-window');
    elements.navDescription = document.getElementById('nav-description');
    elements.navPlot = document.getElementById('nav-plot');
    elements.navEngage = document.getElementById('nav-engage');
    elements.navAbort = document.getElementById('nav-abort');
    elements.navEta = document.getElementById('nav-eta');
    elements.commsChannel = document.getElementById('comms-channel');
    elements.commsLog = document.getElementById('comms-log');
    elements.commsMessage = document.getElementById('comms-message');
    elements.commsSend = document.getElementById('comms-send');
    elements.sensorReadings = document.getElementById('sensor-readings');
    elements.sensorScan = document.getElementById('sensor-scan');
    elements.sensorScanStatus = document.getElementById('sensor-scan-status');
    elements.alertState = document.getElementById('alert-state');
    elements.alertYellow = document.getElementById('alert-yellow');
    elements.alertRed = document.getElementById('alert-red');
    elements.alertClear = document.getElementById('alert-clear');
    elements.eventLog = document.getElementById('event-log');
    elements.crewList = document.getElementById('crew-list');
    elements.crewStatus = document.getElementById('crew-status');
    elements.missionObjectives = document.getElementById('mission-objectives');
    elements.pauseSim = document.getElementById('pause-sim');
    elements.resumeSim = document.getElementById('resume-sim');
    elements.snapshotStatus = document.getElementById('snapshot-status');
    elements.snapshotName = document.getElementById('snapshot-name');
    elements.snapshotSave = document.getElementById('snapshot-save');
    elements.snapshotList = document.getElementById('snapshot-list');
    elements.snapshotLoad = document.getElementById('snapshot-load');
    elements.snapshotDelete = document.getElementById('snapshot-delete');
    elements.logExport = document.getElementById('log-export');
    elements.logReplay = document.getElementById('log-replay');
    elements.logReplayStop = document.getElementById('log-replay-stop');
    elements.replayOutput = document.getElementById('replay-output');
}

function renderSystems() {
    elements.systemGrid.innerHTML = '';
    state.systems.forEach(system => {
        const card = document.createElement('article');
        card.className = 'system-card';
        card.dataset.systemId = system.id;
        card.innerHTML = `
            <header>
                <h3>${system.name}</h3>
                <span class="status-pill ${statusClass(system.status)}">${translateStatus(system.status)}</span>
            </header>
            <div class="system-metrics">
                <div>
                    Leistung
                    <div class="progress-bar"><div class="progress" style="width:${system.power}%"></div></div>
                </div>
                <div>
                    Integrität
                    <div class="progress-bar"><div class="progress" style="width:${system.integrity}%"></div></div>
                </div>
                <div>
                    Auslastung
                    <div class="progress-bar"><div class="progress" style="width:${system.load}%"></div></div>
                </div>
            </div>
        `;
        card.addEventListener('click', () => showSystemDetails(system.id));
        elements.systemGrid.appendChild(card);
    });
}

function statusClass(status) {
    switch (status) {
        case 'online':
            return 'status-online';
        case 'idle':
            return 'status-idle';
        case 'warning':
            return 'status-warning';
        case 'offline':
        case 'critical':
            return 'status-critical';
        default:
            return 'status-idle';
    }
}

function translateStatus(status) {
    const map = {
        online: 'Online',
        idle: 'Bereitschaft',
        warning: 'Warnung',
        offline: 'Offline',
        critical: 'Kritisch'
    };
    return map[status] ?? status;
}

function showSystemDetails(systemId) {
    const system = state.systems.find(sys => sys.id === systemId);
    if (!system) {
        return;
    }
    elements.inspectorStatus.textContent = translateStatus(system.status);
    elements.inspectorStatus.className = `status-pill ${statusClass(system.status)}`;
    elements.inspectorBody.innerHTML = `
        <h3>${system.name}</h3>
        <dl>
            <dt>Leistung</dt>
            <dd>${system.power}%</dd>
            <dt>Integrität</dt>
            <dd>${system.integrity}%</dd>
            <dt>Auslastung</dt>
            <dd>${system.load}%</dd>
            <dt>Status</dt>
            <dd>${translateStatus(system.status)}</dd>
            <dt>Beschreibung</dt>
            <dd>${system.details.beschreibung}</dd>
            <dt>Redundanz</dt>
            <dd>${system.details.redundanz}</dd>
            <dt>Letzte Wartung</dt>
            <dd>${system.details.letzteWartung}</dd>
            <dt>Sensoren</dt>
            <dd>${system.details.sensors ? system.details.sensors.join(', ') : system.details.sensoren?.join(', ')}</dd>
        </dl>
    `;
}

function updatePowerLabels() {
    elements.powerSliders.forEach(slider => {
        const output = document.querySelector(`.power-value[data-output="${slider.id}"]`);
        if (output) {
            output.textContent = `${slider.value}%`;
        }
    });
}

function suggestPowerDistribution() {
    const total = Array.from(elements.powerSliders).reduce((sum, slider) => sum + Number(slider.value), 0);
    if (total !== 100) {
        addLog('log', `Aktuelle Energieverteilung bei ${total}%. Automatischer Ausgleich wird vorbereitet.`);
    }
    const priorities = {
        engines: 0,
        shields: 0,
        weapons: 0,
        aux: 0
    };
    state.systems.forEach(system => {
        if (system.id === 'engines') priorities.engines += 2;
        if (system.id === 'shields') priorities.shields += 2;
        if (system.id === 'weapons') priorities.weapons += 1;
        if (!['engines', 'shields', 'weapons'].includes(system.id)) priorities.aux += 0.5;
        if (system.status === 'warning') {
            if (system.id === 'engines') priorities.engines += 1.5;
            if (system.id === 'shields') priorities.shields += 1.5;
            if (system.id === 'weapons') priorities.weapons += 1;
            priorities.aux += 1;
        }
    });
    const totalPriority = Object.values(priorities).reduce((acc, value) => acc + value, 0);
    Object.entries(priorities).forEach(([key, value]) => {
        const slider = document.getElementById(`power-${key}`);
        if (slider) {
            slider.value = Math.round((value / totalPriority) * 100);
        }
    });
    normalizePowerSliders();
    updatePowerLabels();
    addLog('log', 'Optimierte Energieverteilung angewendet. Bitte Systeme überwachen.');
}

function normalizePowerSliders() {
    const sliders = Array.from(elements.powerSliders);
    let total = sliders.reduce((sum, slider) => sum + Number(slider.value), 0);
    if (total === 100) return;

    const difference = 100 - total;
    const adjustment = difference / sliders.length;
    sliders.forEach(slider => {
        slider.value = clamp(Number(slider.value) + adjustment, 0, 100);
    });

    total = sliders.reduce((sum, slider) => sum + Number(slider.value), 0);
    let index = 0;
    while (total !== 100 && index < 20) {
        const slider = sliders[index % sliders.length];
        slider.value = clamp(Number(slider.value) + Math.sign(100 - total), 0, 100);
        total = sliders.reduce((sum, s) => sum + Number(s.value), 0);
        index += 1;
    }
}

function populateNavigation() {
    SECTORS.forEach(sector => {
        const option = document.createElement('option');
        option.value = sector.id;
        option.textContent = sector.name;
        elements.navSector.appendChild(option);
    });
    elements.navSector.addEventListener('change', event => {
        const sector = SECTORS.find(sec => sec.id === event.target.value);
        if (sector) {
            elements.navCoordinates.value = sector.defaultCoords;
        }
    });
    elements.navSector.value = SECTORS[0].id;
    elements.navCoordinates.value = SECTORS[0].defaultCoords;
}

function populateComms() {
    COMM_CHANNELS.forEach(channel => {
        const option = document.createElement('option');
        option.value = channel.id;
        option.textContent = channel.label;
        elements.commsChannel.appendChild(option);
    });
}

function renderCrew() {
    elements.crewList.innerHTML = '';
    CREW.forEach(member => {
        const li = document.createElement('li');
        li.className = 'crew-member';
        li.innerHTML = `
            <span>
                <strong>${member.name}</strong><br>
                <small>${member.rolle}</small>
            </span>
            <span>${member.status}</span>
        `;
        elements.crewList.appendChild(li);
    });
}

function renderObjectives() {
    elements.missionObjectives.innerHTML = '';
    OBJECTIVES.forEach(objective => {
        const li = document.createElement('li');
        li.className = `objective ${objective.completed ? 'completed' : ''}`;
        li.textContent = objective.text;
        elements.missionObjectives.appendChild(li);
    });
}

function renderLogs() {
    elements.eventLog.innerHTML = '';
    elements.commsLog.innerHTML = '';
    state.logs.forEach(entry => {
        const formatted = formatLogEntry(entry);
        if (entry.type === 'comms') {
            elements.commsLog.insertAdjacentHTML('afterbegin', formatted);
        } else {
            elements.eventLog.insertAdjacentHTML('afterbegin', formatted);
        }
    });
}

function addLog(type, message) {
    const entry = createLogEntry(type, message);
    state.logs.push(entry);
    if (type === 'comms') {
        elements.commsLog.insertAdjacentHTML('afterbegin', formatLogEntry(entry));
    } else {
        elements.eventLog.insertAdjacentHTML('afterbegin', formatLogEntry(entry));
    }
}

function handleCommsSend() {
    const message = elements.commsMessage.value.trim();
    if (!message) return;
    const channel = COMM_CHANNELS.find(ch => ch.id === elements.commsChannel.value);
    addLog('comms', `${channel.label}: ${message}`);
    elements.commsMessage.value = '';
}

function performSensorScan() {
    if (state.simulationPaused) return;
    elements.sensorScan.disabled = true;
    elements.sensorScanStatus.textContent = 'Scan läuft...';
    elements.sensorScanStatus.className = 'status-pill status-warning';
    addLog('log', 'Aktiver Sensor-Scan initiiert. Ergebnisse folgen.');

    setTimeout(() => {
        const readings = SENSOR_BASELINES.map(reading => ({
            label: reading.label,
            value: reading.base + randBetween(-reading.variance, reading.variance),
            unit: reading.unit
        }));
        state.sensorReadings = readings;
        renderSensorReadings();
        elements.sensorScan.disabled = false;
        elements.sensorScanStatus.textContent = 'Bereit';
        elements.sensorScanStatus.className = 'status-pill status-online';
        addLog('log', 'Sensor-Scan abgeschlossen. Daten aktualisiert.');
    }, randBetween(1500, 3000));
}

function renderSensorReadings() {
    elements.sensorReadings.innerHTML = '';
    state.sensorReadings.forEach(reading => {
        const div = document.createElement('div');
        div.className = 'sensor-reading';
        div.innerHTML = `<span>${reading.label}</span><strong>${reading.value} ${reading.unit}</strong>`;
        elements.sensorReadings.appendChild(div);
    });
}

function applyAlertVisual(level) {
    const alertState = ALERT_STATES[level] ?? ALERT_STATES.green;
    elements.alertState.textContent = alertState.label;
    elements.alertState.className = `status-pill ${alertState.className}`;
    updateCrewStatus(level);
}

function setAlertState(level) {
    state.alert = level;
    applyAlertVisual(level);
    const { label } = ALERT_STATES[level] ?? ALERT_STATES.green;
    addLog('log', `Alarmstufe geändert: ${label}.`);
}

function updateCrewStatus(alertLevel) {
    let statusText = 'Stabil';
    let className = 'status-online';
    if (alertLevel === 'yellow') {
        statusText = 'Bereit';
        className = 'status-warning';
    } else if (alertLevel === 'red') {
        statusText = 'Gefechtsstationen';
        className = 'status-critical';
    }
    elements.crewStatus.textContent = statusText;
    elements.crewStatus.className = `status-pill ${className}`;
}

function handleNavigationPlot() {
    if (state.simulationPaused) return;
    const sector = SECTORS.find(sec => sec.id === elements.navSector.value);
    const coordinates = elements.navCoordinates.value.trim();
    const window = elements.navWindow.value;
    const description = elements.navDescription.value.trim();

    if (!sector || !coordinates) {
        addLog('log', 'Navigation fehlgeschlagen: Zielsektor oder Koordinaten fehlen.');
        return;
    }

    const engineSystem = state.systems.find(sys => sys.id === 'engines');
    const modifiers = {
        engineBoost: engineSystem?.power > 85,
        alert: state.alert === 'green' ? null : state.alert,
        systemIntegrity: engineSystem?.integrity
    };
    const etaMinutes = calculateEta(sector.baseEta, modifiers);

    const etaSeconds = etaMinutes * 60;

    state.navPlan = {
        sectorId: sector.id,
        sectorName: sector.name,
        coordinates,
        window,
        description,
        etaMinutes,
        remainingSeconds: etaSeconds,
        status: 'plotted'
    };

    elements.navStatus.textContent = `Kurs gesetzt (${sector.name})`;
    elements.navStatus.className = 'status-pill status-online';
    elements.navEngage.disabled = false;
    elements.navAbort.disabled = false;
    elements.navEta.textContent = secondsToETA(etaSeconds);

    addLog('log', `Navigation: Kurs nach ${sector.name} gesetzt. ETA ${secondsToETA(etaSeconds)}.`);
}

function handleNavigationEngage() {
    if (!state.navPlan || state.navPlan.status !== 'plotted') return;

    state.navPlan.status = 'engaged';
    updateNavigationStatus('Sprung aktiv', 'status-warning');
    addLog('log', 'Sprungsequenz eingeleitet. Alle Crew an Stationen.');

    state.navPlan.remainingSeconds = Math.max(
        typeof state.navPlan.remainingSeconds === 'number' ? state.navPlan.remainingSeconds : state.navPlan.etaMinutes * 60,
        0
    );
    startNavigationCountdown();
}

function handleNavigationAbort() {
    if (!state.navPlan) return;
    stopNavigationCountdown();
    addLog('log', 'Navigation abgebrochen. Kurs zurückgesetzt.');
    state.navPlan = null;
    elements.navStatus.textContent = 'Im Orbit';
    elements.navStatus.className = 'status-pill status-idle';
    elements.navEta.textContent = '--:--';
    elements.navEngage.disabled = true;
    elements.navAbort.disabled = true;
}

function updateNavigationStatus(text, className) {
    elements.navStatus.textContent = text;
    elements.navStatus.className = `status-pill ${className}`;
}

function startNavigationCountdown() {
    if (!state.navPlan || state.navPlan.status !== 'engaged') return;
    stopNavigationCountdown();
    elements.navEngage.disabled = true;
    elements.navAbort.disabled = false;
    elements.navEta.textContent = secondsToETA(state.navPlan.remainingSeconds);
    state.navTimer = setInterval(() => {
        if (state.simulationPaused) return;
        state.navPlan.remainingSeconds = Math.max(0, state.navPlan.remainingSeconds - 1);
        elements.navEta.textContent = secondsToETA(state.navPlan.remainingSeconds);
        if (state.navPlan.remainingSeconds <= 0) {
            stopNavigationCountdown();
            state.navPlan.status = 'arrived';
            updateNavigationStatus('Ankunft bestätigt', 'status-online');
            elements.navEngage.disabled = true;
            elements.navAbort.disabled = true;
            addLog('log', `Ziel ${state.navPlan.sectorName} erreicht. Navigation abgeschlossen.`);
        }
    }, 1000);
}

function stopNavigationCountdown() {
    if (state.navTimer) {
        clearInterval(state.navTimer);
        state.navTimer = null;
    }
}

function storageAvailable() {
    try {
        const testKey = '__starshipos_test__';
        localStorage.setItem(testKey, testKey);
        localStorage.removeItem(testKey);
        return true;
    } catch (error) {
        console.warn('Lokaler Speicher nicht verfügbar:', error);
        return false;
    }
}

function updateSnapshotStatus(message, variant = 'status-idle') {
    if (!elements.snapshotStatus) return;
    elements.snapshotStatus.textContent = message;
    elements.snapshotStatus.className = `status-pill ${variant}`;
}

function loadSnapshotsFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return [];
        }
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            return parsed;
        }
    } catch (error) {
        console.error('Fehler beim Laden der Snapshots:', error);
        updateSnapshotStatus('Fehler beim Laden der Snapshots', 'status-critical');
    }
    return [];
}

function persistSnapshots(snapshots) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));
    } catch (error) {
        console.error('Fehler beim Speichern der Snapshots:', error);
        updateSnapshotStatus('Speichern fehlgeschlagen', 'status-critical');
    }
}

function refreshSnapshotList() {
    if (!elements.snapshotList) return;
    if (!storageAvailable()) {
        state.savedSnapshots = [];
        elements.snapshotList.innerHTML = '';
        updateSnapshotButtons();
        updateSnapshotStatus('Lokaler Speicher nicht verfügbar', 'status-critical');
        return;
    }
    const snapshots = loadSnapshotsFromStorage();
    state.savedSnapshots = snapshots
        .map(snapshot => ({ ...snapshot }))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    elements.snapshotList.innerHTML = '';
    elements.snapshotList.value = '';
    state.savedSnapshots.forEach(snapshot => {
        const option = document.createElement('option');
        option.value = snapshot.id;
        const timestamp = new Date(snapshot.timestamp);
        option.textContent = `${snapshot.name} – ${timestamp.toLocaleString('de-DE')}`;
        elements.snapshotList.appendChild(option);
    });
    updateSnapshotButtons();
}

function updateSnapshotButtons() {
    if (!elements.snapshotLoad || !elements.snapshotDelete || !elements.snapshotList) return;
    const hasSelection = Boolean(elements.snapshotList.value);
    elements.snapshotLoad.disabled = !hasSelection;
    elements.snapshotDelete.disabled = !hasSelection;
}

function getSelectedSnapshot() {
    if (!elements.snapshotList) return null;
    const id = elements.snapshotList.value;
    return state.savedSnapshots.find(snapshot => snapshot.id === id) ?? null;
}

function handleSnapshotSave() {
    if (!elements.snapshotName) return;
    if (!storageAvailable()) {
        updateSnapshotStatus('Lokaler Speicher nicht verfügbar', 'status-critical');
        return;
    }
    const nameInput = elements.snapshotName.value.trim();
    const fallback = new Date().toLocaleString('de-DE');
    const name = nameInput || `Snapshot ${fallback}`;
    const snapshot = createSnapshot(name);
    const snapshots = loadSnapshotsFromStorage();
    snapshots.push(snapshot);
    persistSnapshots(snapshots);
    elements.snapshotName.value = '';
    updateSnapshotStatus(`Snapshot "${name}" gespeichert.`, 'status-online');
    refreshSnapshotList();
}

function handleSnapshotLoad() {
    const snapshot = getSelectedSnapshot();
    if (!snapshot) return;
    restoreSnapshot(snapshot);
}

function handleSnapshotDelete() {
    const snapshot = getSelectedSnapshot();
    if (!snapshot) return;
    if (!storageAvailable()) {
        updateSnapshotStatus('Lokaler Speicher nicht verfügbar', 'status-critical');
        return;
    }
    const filtered = state.savedSnapshots.filter(entry => entry.id !== snapshot.id);
    persistSnapshots(filtered);
    updateSnapshotStatus(`Snapshot "${snapshot.name}" gelöscht.`, 'status-warning');
    refreshSnapshotList();
}

function createSnapshot(name) {
    const systems = state.systems.map(system => ({
        ...system,
        details: { ...system.details }
    }));
    const logs = state.logs.map(entry => ({
        ...entry,
        timestamp: entry.timestamp instanceof Date ? entry.timestamp.toISOString() : entry.timestamp
    }));
    const navPlan = state.navPlan
        ? { ...state.navPlan }
        : null;
    const sensorReadings = state.sensorReadings.map(reading => ({ ...reading }));
    return {
        id: crypto.randomUUID(),
        name,
        timestamp: new Date().toISOString(),
        data: {
            systems,
            alert: state.alert,
            navPlan,
            logs,
            sensorReadings,
            simulationPaused: state.simulationPaused,
            powerDistribution: getPowerDistribution()
        }
    };
}

function getPowerDistribution() {
    const distribution = {};
    elements.powerSliders.forEach(slider => {
        distribution[slider.id] = Number(slider.value);
    });
    return distribution;
}

function applyPowerDistribution(distribution = {}) {
    elements.powerSliders.forEach(slider => {
        if (Object.prototype.hasOwnProperty.call(distribution, slider.id)) {
            slider.value = distribution[slider.id];
        }
    });
    updatePowerLabels();
}

function restoreSnapshot(snapshot) {
    if (!snapshot) return;
    const { data } = snapshot;
    if (!data) return;
    stopLogReplay();
    stopNavigationCountdown();

    state.systems = data.systems
        ? data.systems.map(system => ({
              ...system,
              details: { ...system.details }
          }))
        : SHIP_SYSTEMS.map(system => ({ ...system }));
    renderSystems();

    state.alert = data.alert ?? 'green';
    applyAlertVisual(state.alert);

    state.sensorReadings = Array.isArray(data.sensorReadings)
        ? data.sensorReadings.map(reading => ({ ...reading }))
        : [];
    renderSensorReadings();

    state.logs = Array.isArray(data.logs)
        ? data.logs.map(entry => ({
              ...entry,
              timestamp: entry.timestamp ? new Date(entry.timestamp) : new Date()
          }))
        : [];
    renderLogs();

    state.simulationPaused = Boolean(data.simulationPaused);
    elements.pauseSim.disabled = state.simulationPaused;
    elements.resumeSim.disabled = !state.simulationPaused;

    if (data.powerDistribution) {
        applyPowerDistribution(data.powerDistribution);
    } else {
        updatePowerLabels();
    }

    if (data.navPlan) {
        const sector = SECTORS.find(sec => sec.id === data.navPlan.sectorId);
        state.navPlan = {
            ...data.navPlan,
            sectorName: sector?.name ?? data.navPlan.sectorName ?? data.navPlan.sectorId
        };
        elements.navSector.value = state.navPlan.sectorId ?? elements.navSector.value;
        elements.navCoordinates.value = state.navPlan.coordinates ?? '';
        elements.navWindow.value = state.navPlan.window ?? '';
        elements.navDescription.value = state.navPlan.description ?? '';
        const remainingSeconds = typeof state.navPlan.remainingSeconds === 'number'
            ? state.navPlan.remainingSeconds
            : state.navPlan.etaMinutes * 60;
        if (state.navPlan.status === 'plotted') {
            updateNavigationStatus(`Kurs gesetzt (${state.navPlan.sectorName})`, 'status-online');
            elements.navEngage.disabled = false;
            elements.navAbort.disabled = false;
            elements.navEta.textContent = secondsToETA(remainingSeconds);
            state.navPlan.remainingSeconds = remainingSeconds;
        } else if (state.navPlan.status === 'engaged') {
            updateNavigationStatus('Sprung aktiv', 'status-warning');
            state.navPlan.remainingSeconds = remainingSeconds;
            startNavigationCountdown();
        } else if (state.navPlan.status === 'arrived') {
            updateNavigationStatus('Ankunft bestätigt', 'status-online');
            elements.navEngage.disabled = true;
            elements.navAbort.disabled = true;
            elements.navEta.textContent = secondsToETA(0);
            state.navPlan.remainingSeconds = 0;
        } else {
            resetNavigationUi();
        }
    } else {
        state.navPlan = null;
        resetNavigationUi();
    }

    updateSnapshotStatus(`Snapshot "${snapshot.name}" geladen.`, 'status-online');
}

function resetNavigationUi() {
    const defaultSector = SECTORS[0];
    elements.navStatus.textContent = 'Im Orbit';
    elements.navStatus.className = 'status-pill status-idle';
    elements.navEngage.disabled = true;
    elements.navAbort.disabled = true;
    elements.navEta.textContent = '--:--';
    if (defaultSector) {
        elements.navSector.value = defaultSector.id;
        elements.navCoordinates.value = defaultSector.defaultCoords;
    }
    elements.navWindow.value = '';
    elements.navDescription.value = '';
}

function exportLogs() {
    if (!state.logs.length) {
        updateSnapshotStatus('Keine Logeinträge zum Exportieren vorhanden.', 'status-warning');
        return;
    }
    const payload = {
        exportedAt: new Date().toISOString(),
        stardate: elements.stardate?.textContent ?? '',
        logs: state.logs.map(entry => ({
            id: entry.id,
            type: entry.type,
            message: entry.message,
            timestamp: entry.timestamp instanceof Date ? entry.timestamp.toISOString() : entry.timestamp
        }))
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `starshipos-log-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    updateSnapshotStatus('Logbuch exportiert.', 'status-online');
}

function startLogReplay() {
    if (!state.logs.length) {
        if (elements.replayOutput) {
            elements.replayOutput.textContent = 'Keine Logeinträge für Replay verfügbar.';
        }
        return;
    }
    stopLogReplay();
    state.replay.entries = [...state.logs].sort((a, b) => a.timestamp - b.timestamp);
    state.replay.index = 0;
    if (elements.replayOutput) {
        elements.replayOutput.innerHTML = '';
    }
    if (elements.logReplay) {
        elements.logReplay.disabled = true;
    }
    if (elements.logReplayStop) {
        elements.logReplayStop.disabled = false;
    }
    updateSnapshotStatus('Replay gestartet.', 'status-warning');
    state.replay.timer = setInterval(() => {
        const entry = state.replay.entries[state.replay.index];
        elements.replayOutput?.insertAdjacentHTML('beforeend', formatLogEntry(entry));
        if (elements.replayOutput) {
            elements.replayOutput.scrollTop = elements.replayOutput.scrollHeight;
        }
        state.replay.index += 1;
        if (state.replay.index >= state.replay.entries.length) {
            stopLogReplay('Replay abgeschlossen.');
        }
    }, 1200);
}

function stopLogReplay(message) {
    if (state.replay.timer) {
        clearInterval(state.replay.timer);
        state.replay.timer = null;
    }
    if (elements.logReplay) {
        elements.logReplay.disabled = false;
    }
    if (elements.logReplayStop) {
        elements.logReplayStop.disabled = true;
    }
    if (message) {
        if (elements.replayOutput) {
            const note = document.createElement('div');
            note.className = 'replay-note';
            note.textContent = message;
            elements.replayOutput.appendChild(note);
            elements.replayOutput.scrollTop = elements.replayOutput.scrollHeight;
        }
        updateSnapshotStatus(message, 'status-online');
    }
    state.replay.entries = [];
    state.replay.index = 0;
}

function initTimekeeping() {
    elements.stardate.textContent = formatStardate();
    elements.shipClock.textContent = formatTime();
    setInterval(() => {
        if (!state.simulationPaused) {
            elements.shipClock.textContent = formatTime();
        }
    }, 1000);
    setInterval(() => {
        if (!state.simulationPaused) {
            elements.stardate.textContent = formatStardate();
        }
    }, 60000);
}

function initLogFeed() {
    renderLogs();
    addLog('log', 'StarshipOS betriebsbereit.');
}

function initRandomEvents() {
    setInterval(() => {
        if (state.simulationPaused) return;
        const event = RANDOM_EVENTS[randBetween(0, RANDOM_EVENTS.length - 1)];
        applyRandomEvent(event);
    }, 45000);
}

function applyRandomEvent(event) {
    addLog('log', event.message);
    if (event.impact) {
        Object.entries(event.impact).forEach(([key, value]) => {
            if (key === 'crew') {
                updateCrewStatus(state.alert);
            } else {
                const system = state.systems.find(sys => sys.id === key);
                if (system) {
                    system.integrity = clamp(system.integrity + value, 0, 100);
                    system.status = system.integrity < 40 ? 'warning' : system.status;
                }
            }
        });
        renderSystems();
    }
}

function toggleSimulation(paused) {
    state.simulationPaused = paused;
    elements.pauseSim.disabled = paused;
    elements.resumeSim.disabled = !paused;
    addLog('log', paused ? 'Simulation pausiert.' : 'Simulation fortgesetzt.');
}

function bindEvents() {
    elements.powerSliders.forEach(slider => {
        slider.addEventListener('input', () => {
            updatePowerLabels();
            normalizePowerSliders();
            updatePowerLabels();
        });
    });
    elements.balancePower.addEventListener('click', suggestPowerDistribution);
    elements.commsSend.addEventListener('click', handleCommsSend);
    elements.commsMessage.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            handleCommsSend();
        }
    });
    elements.sensorScan.addEventListener('click', performSensorScan);
    elements.alertYellow.addEventListener('click', () => setAlertState('yellow'));
    elements.alertRed.addEventListener('click', () => setAlertState('red'));
    elements.alertClear.addEventListener('click', () => setAlertState('green'));
    elements.navPlot.addEventListener('click', handleNavigationPlot);
    elements.navEngage.addEventListener('click', handleNavigationEngage);
    elements.navAbort.addEventListener('click', handleNavigationAbort);
    elements.pauseSim.addEventListener('click', () => toggleSimulation(true));
    elements.resumeSim.addEventListener('click', () => toggleSimulation(false));
    elements.snapshotSave?.addEventListener('click', handleSnapshotSave);
    elements.snapshotLoad?.addEventListener('click', handleSnapshotLoad);
    elements.snapshotDelete?.addEventListener('click', handleSnapshotDelete);
    elements.snapshotList?.addEventListener('change', updateSnapshotButtons);
    elements.logExport?.addEventListener('click', exportLogs);
    elements.logReplay?.addEventListener('click', startLogReplay);
    elements.logReplayStop?.addEventListener('click', () => stopLogReplay('Replay gestoppt.'));
}

function init() {
    cacheDom();
    renderSystems();
    renderCrew();
    renderObjectives();
    renderSensorReadings();
    populateNavigation();
    populateComms();
    updatePowerLabels();
    initTimekeeping();
    initLogFeed();
    initRandomEvents();
    bindEvents();
    refreshSnapshotList();
    if (storageAvailable()) {
        updateSnapshotStatus('Lokaler Speicher bereit.', 'status-idle');
    }
    performSensorScan();
}

document.addEventListener('DOMContentLoaded', init);
