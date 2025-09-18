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

const state = {
    systems: SHIP_SYSTEMS.map(system => ({ ...system })),
    alert: 'green',
    navPlan: null,
    navTimer: null,
    logs: INITIAL_LOG.map(entry => ({ ...entry, id: crypto.randomUUID(), timestamp: new Date() })),
    sensorReadings: [],
    simulationPaused: false
};

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
    const { details = {} } = system;
    const sensors = details.sensors ?? details.sensoren;
    const sensorDisplay = Array.isArray(sensors) ? sensors.join(', ') : (sensors ?? '—');

    let inspectorHtml = `
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
            <dd>${details.beschreibung ?? '—'}</dd>
            <dt>Redundanz</dt>
            <dd>${details.redundanz ?? '—'}</dd>
            <dt>Letzte Wartung</dt>
            <dd>${details.letzteWartung ?? '—'}</dd>
            <dt>Sensoren</dt>
            <dd>${sensorDisplay}</dd>
        </dl>
    `;

    if (Array.isArray(details.outputCurve) && details.outputCurve.length) {
        inspectorHtml += `
            <section class="detail-section">
                <h4>Output-Kurve</h4>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Lastbereich</th>
                            <th>Netto-Output</th>
                            <th>Bemerkung</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${details.outputCurve.map(point => `
                            <tr>
                                <td>${point.load}</td>
                                <td>${point.output}</td>
                                <td>${point.notes}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </section>
        `;
    }

    if (Array.isArray(details.efficiencyHeat) && details.efficiencyHeat.length) {
        inspectorHtml += `
            <section class="detail-section">
                <h4>Effizienz &amp; Hitzeabfuhr</h4>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Modus</th>
                            <th>Effizienz</th>
                            <th>Hitze</th>
                            <th>Kühlung</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${details.efficiencyHeat.map(entry => `
                            <tr>
                                <td>${entry.mode}</td>
                                <td>${entry.efficiency}</td>
                                <td>${entry.heat}</td>
                                <td>${entry.coolant}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </section>
        `;
    }

    if (Array.isArray(details.modes) && details.modes.length) {
        inspectorHtml += `
            <section class="detail-section">
                <h4>Betriebsmodi</h4>
                <div class="reactor-modes">
                    ${details.modes.map(mode => `
                        <article class="reactor-mode">
                            <header>
                                <h5>${mode.name}</h5>
                                <span class="mode-output">${mode.output}</span>
                            </header>
                            <p>${mode.description}</p>
                            <div class="mode-meta">
                                <span>Dauer: ${mode.duration}</span>
                                <span>${mode.advisories}</span>
                            </div>
                        </article>
                    `).join('')}
                </div>
            </section>
        `;
    }

    if (Array.isArray(details.failureScenarios) && details.failureScenarios.length) {
        inspectorHtml += `
            <section class="detail-section">
                <h4>Ausfälle &amp; Gegenmaßnahmen</h4>
                <ul class="detail-list">
                    ${details.failureScenarios.map(item => `
                        <li>
                            <strong>${item.title}:</strong> ${item.mitigation}
                        </li>
                    `).join('')}
                </ul>
            </section>
        `;
    }

    if (Array.isArray(details.startSequence) && details.startSequence.length) {
        inspectorHtml += `
            <section class="detail-section">
                <h4>Startsequenz</h4>
                <ol class="detail-list ordered">
                    ${details.startSequence.map(step => `
                        <li>${step}</li>
                    `).join('')}
                </ol>
            </section>
        `;
    }

    elements.inspectorBody.innerHTML = inspectorHtml;
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

function setAlertState(level) {
    state.alert = level;
    const { label, className } = ALERT_STATES[level];
    elements.alertState.textContent = label;
    elements.alertState.className = `status-pill ${className}`;
    addLog('log', `Alarmstufe geändert: ${label}.`);
    updateCrewStatus(level);
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

    state.navPlan = {
        sector,
        coordinates,
        window,
        description,
        etaMinutes,
        status: 'plotted'
    };

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
    let remaining = state.navPlan.etaMinutes;
    updateNavigationStatus('Sprung aktiv', 'status-warning');
    addLog('log', 'Sprungsequenz eingeleitet. Alle Crew an Stationen.');

    state.navTimer = setInterval(() => {
        if (state.simulationPaused) return;
        remaining -= 1;
        elements.navEta.textContent = minutesToETA(remaining);
        if (remaining <= 0) {
            clearInterval(state.navTimer);
            state.navPlan.status = 'arrived';
            updateNavigationStatus('Ankunft bestätigt', 'status-online');
            elements.navEngage.disabled = true;
            elements.navAbort.disabled = true;
            addLog('log', `Ziel ${state.navPlan.sector.name} erreicht. Navigation abgeschlossen.`);
        }
    }, 1000);
}

function handleNavigationAbort() {
    if (!state.navPlan) return;
    if (state.navTimer) {
        clearInterval(state.navTimer);
    }
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
    performSensorScan();
}

document.addEventListener('DOMContentLoaded', init);
