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
    minutesToETA
} from './modules/utils.js';
import { Kernel } from './modules/kernel.js';

const initialState = {
    systems: SHIP_SYSTEMS.map(system => ({ ...system })),
    alert: 'green',
    navPlan: null,
    logs: INITIAL_LOG.map(entry => createLogEntry(entry.type, entry.message)),
    sensorReadings: [],
    simulationPaused: false
};

const kernel = new Kernel(initialState, {
    ticksPerSecond: 1,
    onLog: handleKernelLog,
    onError: handleKernelError
});

const state = kernel.state;

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
}

function configureKernelModules() {
    kernel.registerModule('timekeeping', {
        onStart() {
            elements.stardate.textContent = formatStardate();
            elements.shipClock.textContent = formatTime();
        },
        onTick(context, tick) {
            if (context.state.simulationPaused) {
                return;
            }
            elements.shipClock.textContent = formatTime();
            if (tick % 60 === 0) {
                elements.stardate.textContent = formatStardate();
            }
        }
    });

    kernel.registerModule('navigation', {
        onStart(context) {
            context.locals.unsubscribe?.forEach(unsub => unsub());
            context.locals.unsubscribe = [
                context.on('navigation:engaged', () => {
                    if (context.state.navPlan) {
                        context.state.navPlan.remainingSeconds = context.state.navPlan.etaMinutes;
                    }
                }),
                context.on('navigation:abort', () => {
                    if (context.state.navPlan) {
                        context.state.navPlan.status = 'aborted';
                    }
                })
            ];
        },
        onTick(context) {
            const { state } = context;
            if (!state.navPlan || state.navPlan.status !== 'engaged') {
                return;
            }
            if (state.simulationPaused) {
                return;
            }
            const next = Math.max(0, (state.navPlan.remainingSeconds ?? state.navPlan.etaMinutes) - 1);
            state.navPlan.remainingSeconds = next;
            elements.navEta.textContent = minutesToETA(next);
            if (next <= 0) {
                state.navPlan.status = 'arrived';
                updateNavigationStatus('Ankunft bestätigt', 'status-online');
                elements.navEngage.disabled = true;
                elements.navAbort.disabled = true;
                kernel.log('log', `Ziel ${state.navPlan.sector.name} erreicht. Navigation abgeschlossen.`);
                kernel.emit('navigation:arrived', { sector: state.navPlan.sector });
            }
        },
        onStop(context) {
            context.locals.unsubscribe?.forEach(unsub => unsub());
            context.locals.unsubscribe = [];
        }
    });

    kernel.registerModule('random-events', {
        onStart(context) {
            context.locals.unsubscribe?.forEach(unsub => unsub());
            context.locals.cooldown = 45;
            context.locals.unsubscribe = [
                context.on('alert:changed', ({ payload }) => {
                    if (payload.level === 'red') {
                        context.locals.cooldown = Math.min(context.locals.cooldown, 10);
                    }
                })
            ];
        },
        onTick(context) {
            const { state, locals } = context;
            if (state.simulationPaused) {
                return;
            }
            locals.cooldown -= 1;
            if (locals.cooldown <= 0) {
                const event = RANDOM_EVENTS[randBetween(0, RANDOM_EVENTS.length - 1)];
                applyRandomEvent(event);
                locals.cooldown = state.alert === 'red' ? 25 : 45;
            }
        },
        onStop(context) {
            context.locals.unsubscribe?.forEach(unsub => unsub());
            context.locals.unsubscribe = [];
        }
    });
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

function handleKernelLog(entry) {
    if (!elements.eventLog || !elements.commsLog) {
        return;
    }
    const formatted = formatLogEntry(entry);
    if (entry.type === 'comms') {
        elements.commsLog.insertAdjacentHTML('afterbegin', formatted);
    } else {
        elements.eventLog.insertAdjacentHTML('afterbegin', formatted);
    }
}

function handleKernelError(errorState) {
    const { moduleId, phase, error } = errorState;
    const scope = moduleId ? `Modul '${moduleId}'` : 'Kernel';
    const message = `${scope} Fehler (${phase ?? 'unbekannt'}): ${error.message}`;
    kernel.log('error', message, { moduleId, phase });
}

function addLog(type, message, meta) {
    return kernel.log(type, message, meta);
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
        kernel.setState('sensorReadings', readings);
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

function setAlertState(level) {
    kernel.setState('alert', level);
    const { label, className } = ALERT_STATES[level];
    elements.alertState.textContent = label;
    elements.alertState.className = `status-pill ${className}`;
    addLog('log', `Alarmstufe geändert: ${label}.`);
    updateCrewStatus(level);
    kernel.emit('alert:changed', { level });
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

    const navPlan = {
        sector,
        coordinates,
        window,
        description,
        etaMinutes,
        status: 'plotted'
    };
    kernel.setState('navPlan', navPlan);

    elements.navStatus.textContent = `Kurs gesetzt (${sector.name})`;
    elements.navStatus.className = 'status-pill status-online';
    elements.navEngage.disabled = false;
    elements.navAbort.disabled = false;
    elements.navEta.textContent = minutesToETA(etaMinutes);

    addLog('log', `Navigation: Kurs nach ${sector.name} gesetzt. ETA ${minutesToETA(etaMinutes)}.`);
}

function handleNavigationEngage() {
    if (!state.navPlan || state.navPlan.status !== 'plotted') return;

    state.navPlan.status = 'engaged';
    state.navPlan.remainingSeconds = state.navPlan.etaMinutes;
    updateNavigationStatus('Sprung aktiv', 'status-warning');
    elements.navEngage.disabled = true;
    elements.navAbort.disabled = false;
    addLog('log', 'Sprungsequenz eingeleitet. Alle Crew an Stationen.');
    kernel.emit('navigation:engaged', { plan: state.navPlan });
}

function handleNavigationAbort() {
    if (!state.navPlan) return;
    addLog('log', 'Navigation abgebrochen. Kurs zurückgesetzt.');
    kernel.emit('navigation:abort', { plan: state.navPlan });
    kernel.setState('navPlan', null);
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

function initTimekeeping() {
    kernel.startModule('timekeeping');
}

function initLogFeed() {
    renderLogs();
    addLog('log', 'StarshipOS betriebsbereit.');
}

function initRandomEvents() {
    kernel.startModule('random-events');
}

function applyRandomEvent(event) {
    addLog('log', event.message);
    if (event.impact) {
        let systemsChanged = false;
        const updatedSystems = state.systems.map(system => {
            const impactValue = event.impact[system.id];
            if (typeof impactValue === 'number') {
                systemsChanged = true;
                const updated = { ...system };
                updated.integrity = clamp(updated.integrity + impactValue, 0, 100);
                if (updated.integrity < 40) {
                    updated.status = 'warning';
                }
                return updated;
            }
            return system;
        });

        Object.entries(event.impact).forEach(([key]) => {
            if (key === 'crew') {
                updateCrewStatus(state.alert);
            }
        });

        if (systemsChanged) {
            kernel.setState('systems', updatedSystems);
            renderSystems();
            kernel.emit('systems:updated', { reason: 'random-event', event });
        }
    }
}

function toggleSimulation(paused) {
    kernel.setState('simulationPaused', paused);
    elements.pauseSim.disabled = paused;
    elements.resumeSim.disabled = !paused;
    addLog('log', paused ? 'Simulation pausiert.' : 'Simulation fortgesetzt.');
    kernel.emit(paused ? 'simulation:paused' : 'simulation:resumed', { paused });
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
}

function init() {
    cacheDom();
    configureKernelModules();
    renderSystems();
    renderCrew();
    renderObjectives();
    renderSensorReadings();
    populateNavigation();
    populateComms();
    updatePowerLabels();
    initTimekeeping();
    kernel.startModule('navigation');
    initLogFeed();
    initRandomEvents();
    bindEvents();
    performSensorScan();
    kernel.boot();
}

document.addEventListener('DOMContentLoaded', init);
