import { DEFAULT_SCENARIO } from './modules/data.js';
import { loadScenario, ScenarioHotReloader } from './modules/xmlLoader.js';
import {
    formatStardate,
    formatTime,
    randBetween,
    clamp,
    createLogEntry,
    formatLogEntry,
    calculateEta,
    minutesToETA
} from './modules/utils.js';

const CONFIG_URL = 'assets/data/scenario-default.xml';
const DEFAULT_INSPECTOR_MESSAGE = '<p>Wählen Sie ein System aus der linken Liste, um detaillierte Informationen zu erhalten.</p>';
const FALLBACK_ALERT_STATES = DEFAULT_SCENARIO.alertStates ? { ...DEFAULT_SCENARIO.alertStates } : {
    green: { label: 'Keine Warnungen', className: 'status-idle' },
    yellow: { label: 'Alarmstufe Gelb', className: 'status-warning' },
    red: { label: 'Alarmstufe Rot', className: 'status-critical' }
};

const state = {
    ship: { name: '', commander: '', registry: '', class: '' },
    systems: [],
    sectors: [],
    commChannels: [],
    crew: [],
    objectives: [],
    sensorBaselines: [],
    alertStates: { ...FALLBACK_ALERT_STATES },
    randomEvents: [],
    logs: [],
    alert: 'green',
    navPlan: null,
    navTimer: null,
    sensorReadings: [],
    simulationPaused: false,
    scenarioName: '',
    scenarioId: '',
    currentScenarioHash: null,
    hotReloader: null,
    reloadingScenario: false,
    randomEventTimer: null
};

const elements = {};

function cacheDom() {
    elements.shipName = document.getElementById('ship-name');
    elements.commanderName = document.getElementById('commander-name');
    elements.stardate = document.getElementById('stardate');
    elements.shipClock = document.getElementById('ship-clock');
    elements.systemGrid = document.getElementById('system-grid');
    elements.inspectorBody = document.getElementById('inspector-body');
    elements.inspectorStatus = document.getElementById('inspector-status');
    elements.inspectorDefault = elements.inspectorBody ? elements.inspectorBody.innerHTML : DEFAULT_INSPECTOR_MESSAGE;
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
    elements.reloadConfig = document.getElementById('reload-config');
}

function normalizeSystem(system) {
    const rawDetails = system.details ?? {};
    const sensors = Array.isArray(rawDetails.sensors)
        ? rawDetails.sensors
        : Array.isArray(rawDetails.sensoren)
            ? rawDetails.sensoren
            : [];
    const status = typeof system.status === 'string' ? system.status.toLowerCase() : 'idle';
    const normalizedStatus = ['online', 'idle', 'warning', 'offline', 'critical'].includes(status) ? status : 'idle';
    const toNumber = (value, fallback = 0) => {
        if (typeof value === 'number' && Number.isFinite(value)) {
            return value;
        }
        const parsed = Number.parseInt(value, 10);
        return Number.isNaN(parsed) ? fallback : parsed;
    };

    return {
        id: system.id,
        name: system.name ?? 'Unbekanntes System',
        status: normalizedStatus,
        power: clamp(toNumber(system.power, 0), 0, 100),
        integrity: clamp(toNumber(system.integrity, 0), 0, 100),
        load: clamp(toNumber(system.load, 0), 0, 100),
        details: {
            beschreibung: rawDetails.beschreibung ?? rawDetails.description ?? '',
            redundanz: rawDetails.redundanz ?? rawDetails.redundancy ?? '',
            letzteWartung: rawDetails.letzteWartung ?? rawDetails.lastService ?? '',
            sensors: sensors.slice()
        }
    };
}

function prepareLogEntries(entries = []) {
    if (!Array.isArray(entries)) {
        return [];
    }
    return entries
        .map(entry => {
            const message = typeof entry.message === 'string' ? entry.message.trim() : '';
            if (!message) {
                return null;
            }
            const type = typeof entry.type === 'string' ? entry.type : 'log';
            return createLogEntry(type, message);
        })
        .filter(Boolean);
}

function resetInspector() {
    if (elements.inspectorStatus) {
        elements.inspectorStatus.textContent = 'System wählen';
        elements.inspectorStatus.className = 'status-pill status-idle';
    }
    if (elements.inspectorBody) {
        elements.inspectorBody.innerHTML = elements.inspectorDefault ?? DEFAULT_INSPECTOR_MESSAGE;
    }
}

function renderSystems() {
    if (!elements.systemGrid) {
        return;
    }
    elements.systemGrid.innerHTML = '';
    if (state.systems.length === 0) {
        const placeholder = document.createElement('p');
        placeholder.className = 'empty-placeholder';
        placeholder.textContent = 'Keine Systeme definiert.';
        elements.systemGrid.appendChild(placeholder);
        return;
    }
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
    if (!system || !elements.inspectorBody || !elements.inspectorStatus) {
        return;
    }
    const sensors = Array.isArray(system.details.sensors) && system.details.sensors.length
        ? system.details.sensors.join(', ')
        : '–';
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
            <dd>${system.details.beschreibung || '–'}</dd>
            <dt>Redundanz</dt>
            <dd>${system.details.redundanz || '–'}</dd>
            <dt>Letzte Wartung</dt>
            <dd>${system.details.letzteWartung || '–'}</dd>
            <dt>Sensoren</dt>
            <dd>${sensors}</dd>
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
    const totalPriority = Object.values(priorities).reduce((acc, value) => acc + value, 0) || 1;
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
    if (!elements.navSector) {
        return;
    }
    elements.navSector.innerHTML = '';
    if (state.sectors.length === 0) {
        const option = document.createElement('option');
        option.textContent = 'Keine Sektoren verfügbar';
        option.disabled = true;
        elements.navSector.appendChild(option);
        elements.navSector.disabled = true;
        return;
    }
    elements.navSector.disabled = false;
    state.sectors.forEach(sector => {
        const option = document.createElement('option');
        option.value = sector.id;
        option.textContent = sector.name;
        elements.navSector.appendChild(option);
    });
}

function handleNavSectorChange(event) {
    const sector = state.sectors.find(sec => sec.id === event.target.value);
    if (sector && elements.navCoordinates) {
        elements.navCoordinates.value = sector.defaultCoords ?? '';
    }
}

function populateComms() {
    if (!elements.commsChannel) {
        return;
    }
    elements.commsChannel.innerHTML = '';
    if (state.commChannels.length === 0) {
        const option = document.createElement('option');
        option.textContent = 'Keine Kanäle verfügbar';
        option.disabled = true;
        elements.commsChannel.appendChild(option);
        elements.commsChannel.disabled = true;
        return;
    }
    elements.commsChannel.disabled = false;
    state.commChannels.forEach(channel => {
        const option = document.createElement('option');
        option.value = channel.id;
        option.textContent = channel.label;
        elements.commsChannel.appendChild(option);
    });
    elements.commsChannel.value = state.commChannels[0].id;
}

function renderCrew() {
    if (!elements.crewList) {
        return;
    }
    elements.crewList.innerHTML = '';
    if (state.crew.length === 0) {
        const li = document.createElement('li');
        li.className = 'empty-placeholder';
        li.textContent = 'Keine Crew-Daten verfügbar.';
        elements.crewList.appendChild(li);
        return;
    }
    state.crew.forEach(member => {
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
    if (!elements.missionObjectives) {
        return;
    }
    elements.missionObjectives.innerHTML = '';
    if (state.objectives.length === 0) {
        const li = document.createElement('li');
        li.className = 'empty-placeholder';
        li.textContent = 'Keine Missionsziele definiert.';
        elements.missionObjectives.appendChild(li);
        return;
    }
    state.objectives.forEach(objective => {
        const li = document.createElement('li');
        li.className = `objective ${objective.completed ? 'completed' : ''}`;
        li.textContent = objective.text;
        elements.missionObjectives.appendChild(li);
    });
}

function renderLogs() {
    if (!elements.eventLog || !elements.commsLog) {
        return;
    }
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
    if (!message) {
        return;
    }
    const entry = createLogEntry(type, message);
    state.logs.push(entry);
    if (type === 'comms') {
        elements.commsLog?.insertAdjacentHTML('afterbegin', formatLogEntry(entry));
    } else {
        elements.eventLog?.insertAdjacentHTML('afterbegin', formatLogEntry(entry));
    }
}

function handleCommsSend() {
    const message = elements.commsMessage?.value.trim();
    if (!message) return;
    if (state.commChannels.length === 0) {
        addLog('log', 'Keine Kommunikationskanäle verfügbar. Nachricht nicht gesendet.');
        return;
    }
    const channel = state.commChannels.find(ch => ch.id === elements.commsChannel.value)
        ?? { label: elements.commsChannel.value || 'Unbekannter Kanal' };
    addLog('comms', `${channel.label}: ${message}`);
    elements.commsMessage.value = '';
}

function updateSensorControls() {
    if (!elements.sensorScan || !elements.sensorScanStatus) {
        return;
    }
    if (state.sensorBaselines.length === 0) {
        elements.sensorScan.disabled = true;
        elements.sensorScanStatus.textContent = 'Keine Basiswerte';
        elements.sensorScanStatus.className = 'status-pill status-warning';
    } else {
        elements.sensorScan.disabled = false;
        elements.sensorScanStatus.textContent = 'Bereit';
        elements.sensorScanStatus.className = 'status-pill status-online';
    }
}

function performSensorScan() {
    if (state.simulationPaused || !elements.sensorScan || !elements.sensorScanStatus) return;
    if (state.sensorBaselines.length === 0) {
        addLog('log', 'Keine Sensor-Basiswerte definiert. Scan übersprungen.');
        updateSensorControls();
        return;
    }
    elements.sensorScan.disabled = true;
    elements.sensorScanStatus.textContent = 'Scan läuft...';
    elements.sensorScanStatus.className = 'status-pill status-warning';
    addLog('log', 'Aktiver Sensor-Scan initiiert. Ergebnisse folgen.');

    setTimeout(() => {
        const readings = state.sensorBaselines.map(reading => ({
            label: reading.label,
            value: reading.base + randBetween(-reading.variance, reading.variance),
            unit: reading.unit
        }));
        state.sensorReadings = readings;
        renderSensorReadings();
        updateSensorControls();
        addLog('log', 'Sensor-Scan abgeschlossen. Daten aktualisiert.');
    }, randBetween(1500, 3000));
}

function renderSensorReadings() {
    if (!elements.sensorReadings) {
        return;
    }
    elements.sensorReadings.innerHTML = '';
    if (state.sensorReadings.length === 0) {
        const div = document.createElement('div');
        div.className = 'sensor-empty';
        div.textContent = 'Keine Sensordaten verfügbar.';
        elements.sensorReadings.appendChild(div);
        return;
    }
    state.sensorReadings.forEach(reading => {
        const div = document.createElement('div');
        div.className = 'sensor-reading';
        div.innerHTML = `<span>${reading.label}</span><strong>${reading.value} ${reading.unit}</strong>`;
        elements.sensorReadings.appendChild(div);
    });
}

function updateAlertDisplay(level) {
    if (!elements.alertState) {
        return;
    }
    const entry = state.alertStates[level] ?? { label: level, className: 'status-idle' };
    elements.alertState.textContent = entry.label ?? level;
    elements.alertState.className = `status-pill ${entry.className ?? 'status-idle'}`;
}

function setAlertState(level) {
    state.alert = level;
    updateAlertDisplay(level);
    const alertEntry = state.alertStates[level];
    const label = alertEntry?.label ?? level;
    addLog('log', `Alarmstufe geändert: ${label}.`);
    updateCrewStatus(level);
}

function updateCrewStatus(alertLevel) {
    if (!elements.crewStatus) {
        return;
    }
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
    if (state.sectors.length === 0) {
        addLog('log', 'Navigation fehlgeschlagen: keine Zielsektoren definiert.');
        return;
    }
    const sector = state.sectors.find(sec => sec.id === elements.navSector.value);
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

    state.navPlan = {
        sector,
        coordinates,
        window,
        description,
        etaMinutes,
        status: 'plotted'
    };

    updateNavigationStatus(`Kurs gesetzt (${sector.name})`, 'status-online');
    elements.navEngage.disabled = false;
    elements.navAbort.disabled = false;
    elements.navEta.textContent = minutesToETA(etaMinutes);

    addLog('log', `Navigation: Kurs nach ${sector.name} gesetzt. ETA ${minutesToETA(etaMinutes)}.`);
}

function handleNavigationEngage() {
    if (!state.navPlan || state.navPlan.status !== 'plotted') return;

    state.navPlan.status = 'engaged';
    let remaining = state.navPlan.etaMinutes;
    updateNavigationStatus('Sprung aktiv', 'status-warning');
    addLog('log', 'Sprungsequenz eingeleitet. Alle Crew an Stationen.');

    state.navTimer = setInterval(() => {
        if (state.simulationPaused) return;
        remaining -= 1;
        elements.navEta.textContent = minutesToETA(Math.max(remaining, 0));
        if (remaining <= 0) {
            clearInterval(state.navTimer);
            state.navTimer = null;
            state.navPlan.status = 'arrived';
            updateNavigationStatus('Ankunft bestätigt', 'status-online');
            elements.navEngage.disabled = true;
            elements.navAbort.disabled = true;
            addLog('log', `Ziel ${state.navPlan.sector.name} erreicht. Navigation abgeschlossen.`);
        }
    }, 1000);
}

function resetNavigation() {
    if (state.navTimer) {
        clearInterval(state.navTimer);
        state.navTimer = null;
    }
    state.navPlan = null;
    if (elements.navStatus) {
        elements.navStatus.textContent = 'Im Orbit';
        elements.navStatus.className = 'status-pill status-idle';
    }
    if (elements.navEta) {
        elements.navEta.textContent = '--:--';
    }
    if (elements.navEngage) {
        elements.navEngage.disabled = true;
    }
    if (elements.navAbort) {
        elements.navAbort.disabled = true;
    }
    if (state.sectors.length > 0 && elements.navSector && elements.navCoordinates) {
        const defaultSector = state.sectors[0];
        elements.navSector.value = defaultSector.id;
        elements.navCoordinates.value = defaultSector.defaultCoords ?? '';
    } else if (elements.navCoordinates) {
        elements.navCoordinates.value = '';
    }
    if (elements.navWindow) {
        elements.navWindow.value = '';
    }
    if (elements.navDescription) {
        elements.navDescription.value = '';
    }
}

function handleNavigationAbort() {
    if (!state.navPlan) return;
    resetNavigation();
    addLog('log', 'Navigation abgebrochen. Kurs zurückgesetzt.');
}

function updateNavigationStatus(text, className) {
    if (elements.navStatus) {
        elements.navStatus.textContent = text;
        elements.navStatus.className = `status-pill ${className}`;
    }
}

function initTimekeeping() {
    if (elements.stardate) {
        elements.stardate.textContent = formatStardate();
    }
    if (elements.shipClock) {
        elements.shipClock.textContent = formatTime();
    }
    setInterval(() => {
        if (!state.simulationPaused && elements.shipClock) {
            elements.shipClock.textContent = formatTime();
        }
    }, 1000);
    setInterval(() => {
        if (!state.simulationPaused && elements.stardate) {
            elements.stardate.textContent = formatStardate();
        }
    }, 60000);
}

function initRandomEvents() {
    if (state.randomEventTimer) {
        clearInterval(state.randomEventTimer);
    }
    state.randomEventTimer = setInterval(() => {
        if (state.simulationPaused || state.randomEvents.length === 0) {
            return;
        }
        const index = randBetween(0, state.randomEvents.length - 1);
        const event = state.randomEvents[index];
        if (event) {
            applyRandomEvent(event);
        }
    }, 45000);
}

function applyRandomEvent(event) {
    if (!event) {
        return;
    }
    addLog('log', event.message);
    if (event.impact) {
        Object.entries(event.impact).forEach(([key, value]) => {
            if (key === 'crew') {
                if (typeof value === 'string' && value.trim()) {
                    addLog('log', `Crew-Meldung: ${value.trim()}`);
                }
                updateCrewStatus(state.alert);
            } else {
                const system = state.systems.find(sys => sys.id === key);
                if (system) {
                    const delta = typeof value === 'number' ? value : Number.parseFloat(value);
                    if (Number.isFinite(delta)) {
                        system.integrity = clamp(system.integrity + delta, 0, 100);
                        if (system.integrity < 20) {
                            system.status = 'critical';
                        } else if (system.integrity < 40) {
                            system.status = 'warning';
                        }
                    }
                }
            }
        });
        renderSystems();
    }
}

function toggleSimulation(paused) {
    state.simulationPaused = paused;
    if (elements.pauseSim) {
        elements.pauseSim.disabled = paused;
    }
    if (elements.resumeSim) {
        elements.resumeSim.disabled = !paused;
    }
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
    elements.balancePower?.addEventListener('click', suggestPowerDistribution);
    elements.commsSend?.addEventListener('click', handleCommsSend);
    elements.commsMessage?.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            handleCommsSend();
        }
    });
    elements.sensorScan?.addEventListener('click', performSensorScan);
    elements.alertYellow?.addEventListener('click', () => setAlertState('yellow'));
    elements.alertRed?.addEventListener('click', () => setAlertState('red'));
    elements.alertClear?.addEventListener('click', () => setAlertState('green'));
    elements.navPlot?.addEventListener('click', handleNavigationPlot);
    elements.navEngage?.addEventListener('click', handleNavigationEngage);
    elements.navAbort?.addEventListener('click', handleNavigationAbort);
    elements.navSector?.addEventListener('change', handleNavSectorChange);
    elements.pauseSim?.addEventListener('click', () => toggleSimulation(true));
    elements.resumeSim?.addEventListener('click', () => toggleSimulation(false));
    elements.reloadConfig?.addEventListener('click', handleManualReload);
}

async function handleManualReload() {
    if (state.reloadingScenario) {
        return;
    }
    state.reloadingScenario = true;
    if (elements.reloadConfig) {
        elements.reloadConfig.disabled = true;
    }
    try {
        const result = await loadScenario(CONFIG_URL);
        if (state.currentScenarioHash && state.currentScenarioHash === result.hash) {
            addLog('log', 'Keine Änderungen an der Konfiguration erkannt.');
        } else {
            state.currentScenarioHash = result.hash;
            initializeStateFromScenario(result.scenario, {
                resetLogs: false,
                includeBootLog: false,
                logMessage: `Szenario "${result.scenario.name ?? result.scenario.id ?? 'Unbenannt'}" manuell neu geladen.`,
                resetNavigation: true
            });
            state.hotReloader?.setBaselineHash(result.hash);
        }
    } catch (error) {
        console.error('Konfiguration konnte nicht neu geladen werden', error);
        addLog('error', `Konfiguration konnte nicht neu geladen werden: ${error.message}`);
    } finally {
        state.reloadingScenario = false;
        if (elements.reloadConfig) {
            elements.reloadConfig.disabled = false;
        }
    }
}

function startHotReload(initialHash) {
    if (state.hotReloader) {
        state.hotReloader.stop();
    }
    state.hotReloader = new ScenarioHotReloader(CONFIG_URL, {
        interval: 5000,
        onUpdate: result => {
            state.currentScenarioHash = result.hash;
            initializeStateFromScenario(result.scenario, {
                resetLogs: false,
                includeBootLog: false,
                logMessage: `Szenario "${result.scenario.name ?? result.scenario.id ?? 'Unbenannt'}" aktualisiert (Hot-Reload).`,
                resetNavigation: true
            });
        },
        onError: error => {
            console.error('Hot-Reload Fehler', error);
            addLog('error', `Hot-Reload Fehler: ${error.message}`);
        }
    });
    if (initialHash) {
        state.hotReloader.setBaselineHash(initialHash);
    }
    state.hotReloader.start();
}

function initializeStateFromScenario(scenario, {
    resetLogs = false,
    includeBootLog = false,
    logMessage,
    resetNavigation: resetNav = true
} = {}) {
    state.scenarioId = scenario.id ?? '';
    state.scenarioName = scenario.name ?? '';
    state.ship = {
        name: scenario.ship?.name ?? 'Unbenanntes Schiff',
        commander: scenario.ship?.commander ?? 'Unbekannt',
        registry: scenario.ship?.registry ?? '',
        class: scenario.ship?.class ?? ''
    };
    if (elements.shipName) {
        elements.shipName.textContent = state.ship.name;
    }
    if (elements.commanderName) {
        elements.commanderName.textContent = state.ship.commander;
    }

    state.systems = (scenario.systems ?? []).map(normalizeSystem);
    state.sectors = (scenario.sectors ?? []).map(sector => ({ ...sector }));
    state.commChannels = (scenario.commChannels ?? []).map(channel => ({ ...channel }));
    state.crew = (scenario.crew ?? []).map(member => ({ ...member }));
    state.objectives = (scenario.objectives ?? []).map(objective => ({ ...objective }));
    state.sensorBaselines = (scenario.sensorBaselines ?? []).map(baseline => ({ ...baseline }));
    const hasCustomAlerts = scenario.alertStates && Object.keys(scenario.alertStates).length > 0;
    state.alertStates = hasCustomAlerts
        ? { ...FALLBACK_ALERT_STATES, ...scenario.alertStates }
        : { ...FALLBACK_ALERT_STATES };
    state.randomEvents = (scenario.randomEvents ?? []).map(event => ({
        ...event,
        impact: event.impact ? { ...event.impact } : undefined
    }));

    if (resetLogs) {
        state.logs = prepareLogEntries(scenario.initialLog);
    }
    resetInspector();
    renderSystems();
    populateNavigation();
    populateComms();
    renderCrew();
    renderObjectives();
    if (resetNav) {
        resetNavigation();
    } else if (elements.navSector) {
        handleNavSectorChange({ target: elements.navSector });
    }
    state.sensorReadings = [];
    renderSensorReadings();
    updateSensorControls();
    renderLogs();
    updateAlertDisplay(state.alert);
    updateCrewStatus(state.alert);
    if (resetLogs && includeBootLog) {
        addLog('log', 'StarshipOS betriebsbereit.');
    }
    if (logMessage) {
        addLog('log', logMessage);
    }
}

async function init() {
    cacheDom();
    bindEvents();
    updateAlertDisplay(state.alert);
    initializeStateFromScenario(DEFAULT_SCENARIO, {
        resetLogs: true,
        includeBootLog: true,
        logMessage: 'Fallback-Szenario geladen.',
        resetNavigation: true
    });
    initTimekeeping();
    initRandomEvents();
    updatePowerLabels();
    performSensorScan();

    try {
        const result = await loadScenario(CONFIG_URL);
        state.currentScenarioHash = result.hash;
        initializeStateFromScenario(result.scenario, {
            resetLogs: true,
            includeBootLog: true,
            logMessage: `Szenario "${result.scenario.name ?? 'Unbenannt'}" geladen.`,
            resetNavigation: true
        });
        performSensorScan();
        startHotReload(result.hash);
    } catch (error) {
        console.error('Fehler beim Laden der XML-Konfiguration', error);
        addLog('error', `XML-Konfiguration konnte nicht geladen werden: ${error.message}`);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    init().catch(error => {
        console.error('Initialisierung fehlgeschlagen', error);
        addLog('error', `Initialisierung fehlgeschlagen: ${error.message}`);
    });
});
