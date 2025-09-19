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
    secondsToETA
} from './modules/utils.js';
import { createPowerSystemModule } from './modules/powerSystem.js';
import { createLifeSupportModule, normalizeLifeSupportData } from './modules/lifeSupport.js';
import { Kernel } from './modules/kernel.js';

/** === Szenario/Defaults === */
const CONFIG_URL = 'assets/data/scenario-default.xml';
const DEFAULT_INSPECTOR_MESSAGE = '<p>Wählen Sie ein System aus der linken Liste, um detaillierte Informationen zu erhalten.</p>';
const FALLBACK_ALERT_STATES = DEFAULT_SCENARIO.alertStates ? { ...DEFAULT_SCENARIO.alertStates } : {
    green: { label: 'Keine Warnungen', className: 'status-idle' },
    yellow: { label: 'Alarmstufe Gelb', className: 'status-warning' },
    red: { label: 'Alarmstufe Rot', className: 'status-critical' }
};

/** === Kernel-Status (szenario-getrieben) === */
const initialState = {
    // Szenario-Metadaten
    scenarioName: '',
    scenarioId: '',
    currentScenarioHash: null,
    hotReloader: null,
    reloadingScenario: false,

    // Schiff & Daten aus XML
    ship: { name: '', commander: '', registry: '', class: '' },
    systems: [],
    sectors: [],
    commChannels: [],
    crew: [],
    objectives: [],
    sensorBaselines: [],
    alertStates: { ...FALLBACK_ALERT_STATES },
    randomEvents: [],

    // Laufzeit
    logs: [],
    alert: 'green',
    navPlan: null,
    sensorReadings: [],
    lifeSupport: null,
    simulationPaused: false,
    selectedSystemId: null
};

const kernel = new Kernel(initialState, {
    ticksPerSecond: 1,
    onLog: handleKernelLog,
    onError: handleKernelError
});

const state = kernel.state;

const elements = {};

/** === DOM Cache === */
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

/** === Hilfen für Szenario-Normalisierung === */
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
        if (typeof value === 'number' && Number.isFinite(value)) return value;
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
    if (!Array.isArray(entries)) return [];
    return entries
        .map(entry => {
            const message = typeof entry.message === 'string' ? entry.message.trim() : '';
            if (!message) return null;
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
    state.selectedSystemId = null;
}

/** === Kernel-Module (Zeit, Navigation, Random-Events) === */
function configureKernelModules() {
    kernel.registerModule('timekeeping', {
        onStart() {
            if (elements.stardate) elements.stardate.textContent = formatStardate();
            if (elements.shipClock) elements.shipClock.textContent = formatTime();
        },
        onTick(context, tick) {
            if (context.state.simulationPaused) return;
            if (elements.shipClock) elements.shipClock.textContent = formatTime();
            if (tick % 60 === 0 && elements.stardate) {
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
                        if (typeof context.state.navPlan.remainingSeconds !== 'number') {
                            context.state.navPlan.remainingSeconds = Math.max(
                                0, Math.round((context.state.navPlan.etaMinutes ?? 0) * 60)
                            );
                        }
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
            if (!state.navPlan || state.navPlan.status !== 'engaged') return;
            if (state.simulationPaused) return;

            const current = typeof state.navPlan.remainingSeconds === 'number'
                ? state.navPlan.remainingSeconds
                : Math.max(0, Math.round((state.navPlan.etaMinutes ?? 0) * 60));

            const next = Math.max(0, current - 1);
            state.navPlan.remainingSeconds = next;
            if (elements.navEta) elements.navEta.textContent = secondsToETA(next);

            if (next <= 0) {
                state.navPlan.status = 'arrived';
                updateNavigationStatus('Ankunft bestätigt', 'status-online');
                if (elements.navEngage) elements.navEngage.disabled = true;
                if (elements.navAbort) elements.navAbort.disabled = true;
                kernel.log('log', `Ziel ${state.navPlan.sector?.name ?? 'Ziel'} erreicht. Navigation abgeschlossen.`);
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
            if (state.simulationPaused) return;
            locals.cooldown -= 1;
            if (locals.cooldown <= 0) {
                if (Array.isArray(state.randomEvents) && state.randomEvents.length) {
                    const event = state.randomEvents[randBetween(0, state.randomEvents.length - 1)];
                    applyRandomEvent(event);
                }
                locals.cooldown = state.alert === 'red' ? 25 : 45;
            }
        },
        onStop(context) {
            context.locals.unsubscribe?.forEach(unsub => unsub());
            context.locals.unsubscribe = [];
        }
    });

    kernel.registerModule('power-system', createPowerSystemModule({
        readDistribution: () => readPowerDistribution(),
        syncDistribution: distribution => applyDistributionToSliders(distribution, { skipNotify: true }),
        onAutoBalance: source => {
            if (source === 'ui') {
                addLog('log', 'Automatische Energieoptimierung eingeleitet.');
            }
        }
    }));

    kernel.registerModule('life-support', createLifeSupportModule());
}

/** === Rendering === */
function renderSystems() {
    if (!elements.systemGrid) return;
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

    if (state.selectedSystemId) {
        const current = state.systems.find(sys => sys.id === state.selectedSystemId);
        if (current) {
            showSystemDetails(current.id);
        } else {
            state.selectedSystemId = null;
            resetInspector();
        }
    }
}

function statusClass(status) {
    switch (status) {
        case 'online': return 'status-online';
        case 'idle': return 'status-idle';
        case 'warning': return 'status-warning';
        case 'offline':
        case 'critical': return 'status-critical';
        default: return 'status-idle';
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
    if (!system || !elements.inspectorBody || !elements.inspectorStatus) return;

    state.selectedSystemId = systemId;

    elements.inspectorStatus.textContent = translateStatus(system.status);
    elements.inspectorStatus.className = `status-pill ${statusClass(system.status)}`;

    const { details = {} } = system;
    const sensors = Array.isArray(details.sensors) ? details.sensors : (Array.isArray(details.sensoren) ? details.sensoren : []);
    const sensorDisplay = sensors.length ? sensors.join(', ') : '–';

    let inspectorHtml = `
        <h3>${system.name}</h3>
        <dl>
            <dt>Leistung</dt><dd>${system.power}%</dd>
            <dt>Integrität</dt><dd>${system.integrity}%</dd>
            <dt>Auslastung</dt><dd>${system.load}%</dd>
            <dt>Status</dt><dd>${translateStatus(system.status)}</dd>
            <dt>Beschreibung</dt><dd>${details.beschreibung || '–'}</dd>
            <dt>Redundanz</dt><dd>${details.redundanz || '–'}</dd>
            <dt>Letzte Wartung</dt><dd>${details.letzteWartung || '–'}</dd>
            <dt>Sensoren</dt><dd>${sensorDisplay}</dd>
        </dl>
    `;

    if (Array.isArray(details.outputCurve) && details.outputCurve.length) {
        inspectorHtml += `
            <section class="detail-section">
                <h4>Output-Kurve</h4>
                <table class="data-table">
                    <thead><tr><th>Lastbereich</th><th>Netto-Output</th><th>Bemerkung</th></tr></thead>
                    <tbody>
                        ${details.outputCurve.map(point => `
                            <tr><td>${point.load}</td><td>${point.output}</td><td>${point.notes}</td></tr>
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
                    <thead><tr><th>Modus</th><th>Effizienz</th><th>Hitze</th><th>Kühlung</th></tr></thead>
                    <tbody>
                        ${details.efficiencyHeat.map(entry => `
                            <tr><td>${entry.mode}</td><td>${entry.efficiency}</td><td>${entry.heat}</td><td>${entry.coolant}</td></tr>
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
                            <header><h5>${mode.name}</h5><span class="mode-output">${mode.output}</span></header>
                            <p>${mode.description}</p>
                            <div class="mode-meta"><span>Dauer: ${mode.duration}</span><span>${mode.advisories}</span></div>
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
                        <li><strong>${item.title}:</strong> ${item.mitigation}</li>
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
                    ${details.startSequence.map(step => `<li>${step}</li>`).join('')}
                </ol>
            </section>
        `;
    }

    if (system.id === 'life-support') {
        inspectorHtml += renderLifeSupportDetails(state.lifeSupport);
    }

    elements.inspectorBody.innerHTML = inspectorHtml;
}

function renderLifeSupportDetails(lifeSupport) {
    if (!lifeSupport) {
        return `
            <section class="detail-section">
                <h4>Lebenserhaltung</h4>
                <p>Keine Detaildaten verfügbar.</p>
            </section>
        `;
    }

    const sections = [];

    if (Array.isArray(lifeSupport.cycles) && lifeSupport.cycles.length) {
        sections.push(`
            <section class="detail-section">
                <h4>Atmosphärenzyklen</h4>
                <table class="data-table">
                    <thead><tr><th>Zyklus</th><th>Status</th><th>Leistungsdaten</th><th>Notizen</th></tr></thead>
                    <tbody>
                        ${lifeSupport.cycles.map(cycle => `
                            <tr>
                                <td>${cycle.label}</td>
                                <td><span class="life-support-status ${lifeSupportStatusClass(cycle.status)}">${cycle.status ?? 'Stabil'}</span></td>
                                <td><div class="life-support-metric-list">${formatLifeSupportMetrics(cycle.metrics)}</div></td>
                                <td>${cycle.note ? cycle.note : '–'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </section>
        `);
    }

    if (Array.isArray(lifeSupport.sections) && lifeSupport.sections.length) {
        sections.push(`
            <section class="detail-section">
                <h4>Sektionsklima</h4>
                <table class="data-table">
                    <thead><tr><th>Sektion</th><th>Druck</th><th>Temperatur</th><th>Klima</th><th>Status</th></tr></thead>
                    <tbody>
                        ${lifeSupport.sections.map(section => `
                            <tr>
                                <td>${section.name}</td>
                                <td>${formatLifeSupportReading(section.pressure)}</td>
                                <td>${formatLifeSupportReading(section.temperature)}</td>
                                <td>${section.humidity ? formatLifeSupportReading(section.humidity) : '–'}</td>
                                <td><span class="life-support-status ${lifeSupportStatusClass(section.status)}">${section.status ?? 'Stabil'}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </section>
        `);
    }

    if (Array.isArray(lifeSupport.leaks) && lifeSupport.leaks.length) {
        sections.push(`
            <section class="detail-section">
                <h4>Lecks &amp; Abdichtung</h4>
                <ul class="detail-list">
                    ${lifeSupport.leaks.map(leak => formatLifeSupportLeak(leak)).join('')}
                </ul>
            </section>
        `);
    }

    if (lifeSupport.filters) {
        const filterTable = Array.isArray(lifeSupport.filters.banks) && lifeSupport.filters.banks.length
            ? `
                <table class="data-table">
                    <thead><tr><th>Filterbank</th><th>Status</th><th>Sättigung</th><th>Puffer</th></tr></thead>
                    <tbody>
                        ${lifeSupport.filters.banks.map(bank => `
                            <tr>
                                <td>${bank.label}</td>
                                <td><span class="life-support-status ${lifeSupportStatusClass(bank.status)}">${bank.status ?? 'Aktiv'}</span></td>
                                <td>${formatLifeSupportReading(bank.saturation)}</td>
                                <td>${formatLifeSupportBuffer(bank.timeBuffer)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `
            : '';

        const bufferSummary = renderLifeSupportBufferSummary(lifeSupport.filters);
        if (filterTable || bufferSummary) {
            sections.push(`
                <section class="detail-section">
                    <h4>Filter &amp; Zeitpuffer</h4>
                    ${filterTable}
                    ${bufferSummary}
                </section>
            `);
        }
    }

    return sections.join('');
}

function formatLifeSupportMetrics(metrics) {
    if (!Array.isArray(metrics) || metrics.length === 0) {
        return '<span>–</span>';
    }
    return metrics.map(metric => `<span>${formatLifeSupportMetric(metric)}</span>`).join('');
}

function formatLifeSupportMetric(metric) {
    if (!metric) {
        return '–';
    }
    const decimals = lifeSupportDecimals(metric.unit);
    const value = typeof metric.value === 'number'
        ? metric.value.toLocaleString('de-DE', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        })
        : '–';
    const unit = metric.unit ? ` ${metric.unit}` : '';
    const label = metric.label ?? '';
    return label ? `${label}: ${value}${unit}` : `${value}${unit}`;
}

function formatLifeSupportReading(reading) {
    if (!reading || typeof reading.value !== 'number') {
        return '–';
    }
    const decimals = lifeSupportDecimals(reading.unit);
    const value = reading.value.toLocaleString('de-DE', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
    return `${value}${reading.unit ? ` ${reading.unit}` : ''}`;
}

function lifeSupportStatusClass(status) {
    if (!status) return 'life-support-status-stable';
    const normalized = status.toLowerCase();
    if (normalized.includes('alarm') || normalized.includes('krit')) {
        return 'life-support-status-critical';
    }
    if (normalized.includes('warn')) {
        return 'life-support-status-warning';
    }
    if (normalized.includes('überwachung') || normalized.includes('anpass')) {
        return 'life-support-status-monitoring';
    }
    return 'life-support-status-stable';
}

function formatLifeSupportLeak(leak) {
    if (!leak) {
        return '<li>Unbekannte Meldung</li>';
    }
    const progress = typeof leak.progress === 'number' ? `${Math.round(leak.progress)}%` : '–';
    const severity = leak.severity ? leak.severity : 'Unbekannt';
    const note = leak.note ? ` · ${leak.note}` : '';
    return `
        <li>
            <strong>${leak.location}</strong><br>
            <span class="life-support-status ${lifeSupportStatusClass(leak.status)}">${leak.status ?? 'Status unbekannt'}</span>
            <br><small>Fortschritt: ${progress} · Stufe: ${severity}${note}</small>
        </li>
    `;
}

function formatLifeSupportBuffer(reading) {
    if (!reading || typeof reading.value !== 'number') {
        return '–';
    }
    if (reading.unit && reading.unit.toLowerCase().startsWith('min')) {
        const minutes = Math.max(0, Math.round(reading.value));
        return `${formatLifeSupportMinutes(minutes)} (${minutes} min)`;
    }
    return formatLifeSupportReading(reading);
}

function renderLifeSupportBufferSummary(filters) {
    const entries = [];
    if (typeof filters.reserveAirMinutes === 'number') {
        entries.push({ label: 'Reserve-Luft', minutes: filters.reserveAirMinutes });
    }
    if (typeof filters.scrubberMarginMinutes === 'number') {
        entries.push({ label: 'Scrubber-Puffer', minutes: filters.scrubberMarginMinutes });
    }
    if (typeof filters.emergencyBufferMinutes === 'number') {
        entries.push({ label: 'Notfall-O₂', minutes: filters.emergencyBufferMinutes });
    }
    if (!entries.length) {
        return '';
    }
    return `
        <div class="life-support-buffers">
            ${entries.map(entry => `
                <div class="life-support-buffer">
                    <strong>${entry.label}</strong>
                    <span>${formatLifeSupportMinutes(Math.round(entry.minutes))} (${Math.round(entry.minutes)} min)</span>
                </div>
            `).join('')}
        </div>
    `;
}

function lifeSupportDecimals(unit) {
    if (!unit) return 1;
    const normalized = unit.toLowerCase();
    if (normalized.includes('kg')) return 2;
    if (normalized.includes('%')) return 1;
    if (normalized.includes('kpa')) return 1;
    if (normalized.includes('°') || normalized.includes('c')) return 1;
    if (normalized.includes('min')) return 0;
    return 1;
}

function formatLifeSupportMinutes(minutes) {
    const total = Math.max(0, Number.parseInt(minutes, 10) || 0);
    const hours = Math.floor(total / 60);
    const mins = total % 60;
    if (hours <= 0) {
        return `${mins}m`;
    }
    return `${hours}h ${mins.toString().padStart(2, '0')}m`;
}

/** === Power-Verteilung === */
function updatePowerLabels() {
    elements.powerSliders.forEach(slider => {
        const output = document.querySelector(`.power-value[data-output="${slider.id}"]`);
        if (output) output.textContent = `${slider.value}%`;
    });
}

function readPowerDistribution() {
    const distribution = {};
    elements.powerSliders.forEach(slider => {
        const key = slider.id.replace('power-', '');
        distribution[key] = Number(slider.value);
    });
    return distribution;
}

function applyDistributionToSliders(distribution, { skipNotify = false } = {}) {
    if (!distribution) return;
    const sliders = Array.from(elements.powerSliders);
    let changed = false;
    sliders.forEach(slider => {
        const key = slider.id.replace('power-', '');
        if (Object.prototype.hasOwnProperty.call(distribution, key)) {
            const nextValue = clamp(Number(distribution[key]), 0, 100);
            if (Number(slider.value) !== nextValue) {
                slider.value = nextValue;
                changed = true;
            }
        }
    });
    if (changed) {
        normalizePowerSliders();
    }
    updatePowerLabels();
    if (!skipNotify) {
        notifyPowerChange('sync');
    }
}

function notifyPowerChange(source = 'manual') {
    const distribution = readPowerDistribution();
    kernel.emit('ui:power-adjusted', { distribution, source });
}

function suggestPowerDistribution() {
    kernel.emit('power:request-balance', { source: 'ui' });
}

function normalizePowerSliders() {
    const sliders = Array.from(elements.powerSliders);
    if (sliders.length === 0) {
        return {};
    }
    let total = sliders.reduce((sum, slider) => sum + Number(slider.value), 0);
    if (total === 100) {
        return sliders.reduce((acc, slider) => {
            acc[slider.id.replace('power-', '')] = Number(slider.value);
            return acc;
        }, {});
    }

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
        total = sliders.reduce((s, sl) => s + Number(sl.value), 0);
        index += 1;
    }

    const distribution = {};
    sliders.forEach(slider => {
        distribution[slider.id.replace('power-', '')] = Number(slider.value);
    });
    return distribution;
}

/** === Navigation/Comms (szenario) === */
function populateNavigation() {
    if (!elements.navSector) return;
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
    if (!elements.commsChannel) return;
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

/** === Crew, Objectives, Logs === */
function renderCrew() {
    if (!elements.crewList) return;
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
            <span><strong>${member.name}</strong><br><small>${member.rolle}</small></span>
            <span>${member.status}</span>
        `;
        elements.crewList.appendChild(li);
    });
}

function renderObjectives() {
    if (!elements.missionObjectives) return;
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
    if (!elements.eventLog || !elements.commsLog) return;
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

/** === Logging/Fehler === */
function handleKernelLog(entry) {
    if (!elements.eventLog || !elements.commsLog) return;
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

/** === Comms === */
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

/** === Sensoren === */
function updateSensorControls() {
    if (!elements.sensorScan || !elements.sensorScanStatus) return;
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
        kernel.setState('sensorReadings', readings);
        renderSensorReadings();
        updateSensorControls();
        addLog('log', 'Sensor-Scan abgeschlossen. Daten aktualisiert.');
    }, randBetween(1500, 3000));
}

function renderSensorReadings() {
    if (!elements.sensorReadings) return;
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

/** === Alarmzustände === */
function updateAlertDisplay(level) {
    if (!elements.alertState) return;
    const entry = state.alertStates[level] ?? { label: level, className: 'status-idle' };
    elements.alertState.textContent = entry.label ?? level;
    elements.alertState.className = `status-pill ${entry.className ?? 'status-idle'}`;
}

function setAlertState(level) {
    kernel.setState('alert', level);
    updateAlertDisplay(level);
    const alertEntry = state.alertStates[level];
    const label = alertEntry?.label ?? level;
    addLog('log', `Alarmstufe geändert: ${label}.`);
    updateCrewStatus(level);
    kernel.emit('alert:changed', { level });
}

function updateCrewStatus(alertLevel) {
    if (!elements.crewStatus) return;
    let statusText = 'Stabil';
    let className = 'status-online';
    if (alertLevel === 'yellow') { statusText = 'Bereit'; className = 'status-warning'; }
    else if (alertLevel === 'red') { statusText = 'Gefechtsstationen'; className = 'status-critical'; }
    elements.crewStatus.textContent = statusText;
    elements.crewStatus.className = `status-pill ${className}`;
}

/** === Navigation Aktionen === */
function handleNavigationPlot() {
    if (state.simulationPaused) return;
    if (state.sectors.length === 0) {
        addLog('log', 'Navigation fehlgeschlagen: keine Zielsektoren definiert.');
        return;
    }
    const sector = state.sectors.find(sec => sec.id === elements.navSector.value);
    const coordinates = elements.navCoordinates?.value.trim();
    const window = elements.navWindow?.value;
    const description = elements.navDescription?.value.trim();

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
    const etaSeconds = Math.max(0, Math.round(etaMinutes * 60));

    const navPlan = {
        sector,
        coordinates,
        window,
        description,
        etaMinutes,
        remainingSeconds: etaSeconds,
        status: 'plotted'
    };
    kernel.setState('navPlan', navPlan);

    updateNavigationStatus(`Kurs gesetzt (${sector.name})`, 'status-online');
    if (elements.navEngage) elements.navEngage.disabled = false;
    if (elements.navAbort) elements.navAbort.disabled = false;
    if (elements.navEta) elements.navEta.textContent = secondsToETA(etaSeconds);

    addLog('log', `Navigation: Kurs nach ${sector.name} gesetzt. ETA ${secondsToETA(etaSeconds)}.`);
}

function handleNavigationEngage() {
    if (!state.navPlan || state.navPlan.status !== 'plotted') return;
    state.navPlan.status = 'engaged';
    updateNavigationStatus('Sprung aktiv', 'status-warning');
    if (elements.navEngage) elements.navEngage.disabled = true;
    if (elements.navAbort) elements.navAbort.disabled = false;
    addLog('log', 'Sprungsequenz eingeleitet. Alle Crew an Stationen.');
    kernel.emit('navigation:engaged', { plan: state.navPlan });
}

function handleNavigationAbort() {
    if (!state.navPlan) return;
    addLog('log', 'Navigation abgebrochen. Kurs zurückgesetzt.');
    kernel.emit('navigation:abort', { plan: state.navPlan });
    kernel.setState('navPlan', null);
    resetNavigation();
}

function updateNavigationStatus(text, className) {
    if (!elements.navStatus) return;
    elements.navStatus.textContent = text;
    elements.navStatus.className = `status-pill ${className}`;
}

function resetNavigation() {
    if (elements.navStatus) {
        elements.navStatus.textContent = 'Im Orbit';
        elements.navStatus.className = 'status-pill status-idle';
    }
    if (elements.navEta) elements.navEta.textContent = '--:--';
    if (elements.navEngage) elements.navEngage.disabled = true;
    if (elements.navAbort) elements.navAbort.disabled = true;

    if (state.sectors.length > 0 && elements.navSector && elements.navCoordinates) {
        const defaultSector = state.sectors[0];
        elements.navSector.value = defaultSector.id;
        elements.navCoordinates.value = defaultSector.defaultCoords ?? '';
    } else if (elements.navCoordinates) {
        elements.navCoordinates.value = '';
    }
    if (elements.navWindow) elements.navWindow.value = '';
    if (elements.navDescription) elements.navDescription.value = '';
}

/** === Random Events anwenden === */
function applyRandomEvent(event) {
    if (!event) return;
    addLog('log', event.message);
    if (event.impact) {
        let systemsChanged = false;
        const updatedSystems = state.systems.map(system => {
            const impactValue = event.impact[system.id];
            if (typeof impactValue === 'number') {
                systemsChanged = true;
                const updated = { ...system };
                updated.integrity = clamp(updated.integrity + impactValue, 0, 100);
                if (updated.integrity < 40) updated.status = 'warning';
                return updated;
            }
            return system;
        });

        Object.entries(event.impact).forEach(([key, value]) => {
            if (key === 'crew') {
                if (typeof value === 'string' && value.trim()) {
                    addLog('log', `Crew-Meldung: ${value.trim()}`);
                }
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

/** === Simulation Pause/Resume === */
function toggleSimulation(paused) {
    kernel.setState('simulationPaused', paused);
    if (elements.pauseSim) elements.pauseSim.disabled = paused;
    if (elements.resumeSim) elements.resumeSim.disabled = !paused;
    addLog('log', paused ? 'Simulation pausiert.' : 'Simulation fortgesetzt.');
    kernel.emit(paused ? 'simulation:paused' : 'simulation:resumed', { paused });
}

/** === Event Bindings === */
function bindEvents() {
    elements.powerSliders.forEach(slider => {
        slider.addEventListener('input', () => {
            normalizePowerSliders();
            updatePowerLabels();
            notifyPowerChange('manual');
        });
    });
    elements.balancePower?.addEventListener('click', suggestPowerDistribution);

    elements.commsSend?.addEventListener('click', handleCommsSend);
    elements.commsMessage?.addEventListener('keydown', event => {
        if (event.key === 'Enter') handleCommsSend();
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

/** === Manuelles Reload & Hot-Reload === */
async function handleManualReload() {
    if (state.reloadingScenario) return;
    state.reloadingScenario = true;
    if (elements.reloadConfig) elements.reloadConfig.disabled = true;
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
        if (elements.reloadConfig) elements.reloadConfig.disabled = false;
    }
}

function startHotReload(initialHash) {
    if (state.hotReloader) state.hotReloader.stop();
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
    if (initialHash) state.hotReloader.setBaselineHash(initialHash);
    state.hotReloader.start();
}

/** === Szenario -> State übernehmen === */
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
    if (elements.shipName) elements.shipName.textContent = state.ship.name;
    if (elements.commanderName) elements.commanderName.textContent = state.ship.commander;

    state.systems = (scenario.systems ?? []).map(normalizeSystem);
    state.sectors = (scenario.sectors ?? []).map(sector => ({ ...sector }));
    state.commChannels = (scenario.commChannels ?? []).map(channel => ({ ...channel }));
    state.crew = (scenario.crew ?? []).map(member => ({ ...member }));
    state.objectives = (scenario.objectives ?? []).map(objective => ({ ...objective }));
    state.sensorBaselines = (scenario.sensorBaselines ?? []).map(baseline => ({ ...baseline }));
    const normalizedLifeSupport = normalizeLifeSupportData(scenario.lifeSupport);
    state.lifeSupport = normalizedLifeSupport
        ? {
            cycles: normalizedLifeSupport.cycles.map(cycle => ({
                ...cycle,
                metrics: Array.isArray(cycle.metrics)
                    ? cycle.metrics.map(metric => ({ ...metric }))
                    : []
            })),
            sections: normalizedLifeSupport.sections.map(section => ({
                ...section,
                pressure: section.pressure ? { ...section.pressure } : null,
                temperature: section.temperature ? { ...section.temperature } : null,
                humidity: section.humidity ? { ...section.humidity } : null
            })),
            leaks: normalizedLifeSupport.leaks.map(leak => ({ ...leak })),
            filters: normalizedLifeSupport.filters
                ? {
                    banks: (normalizedLifeSupport.filters.banks ?? []).map(bank => ({
                        ...bank,
                        saturation: bank.saturation ? { ...bank.saturation } : null,
                        timeBuffer: bank.timeBuffer ? { ...bank.timeBuffer } : null
                    })),
                    reserveAirMinutes: normalizedLifeSupport.filters.reserveAirMinutes,
                    scrubberMarginMinutes: normalizedLifeSupport.filters.scrubberMarginMinutes,
                    emergencyBufferMinutes: normalizedLifeSupport.filters.emergencyBufferMinutes
                }
                : { banks: [] }
        }
        : null;
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

    kernel.emit('systems:reinitialized', { scenario });

    if (resetLogs && includeBootLog) addLog('log', 'StarshipOS betriebsbereit.');
    if (logMessage) addLog('log', logMessage);
}

/** === Init === */
async function init() {
    cacheDom();
    bindEvents();
    configureKernelModules();
    registerKernelEventListeners();

    // Grundzustand anzeigen
    updateAlertDisplay(state.alert);
    initializeStateFromScenario(DEFAULT_SCENARIO, {
        resetLogs: true,
        includeBootLog: true,
        logMessage: 'Fallback-Szenario geladen.',
        resetNavigation: true
    });

    // Kernel-Module starten
    kernel.startModule('timekeeping');
    kernel.startModule('navigation');
    kernel.startModule('random-events');
    kernel.startModule('power-system');
    kernel.startModule('life-support');

    updatePowerLabels();
    performSensorScan();

    // XML laden + Hot-Reload starten
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

    kernel.boot();
}

function registerKernelEventListeners() {
    kernel.on('systems:power-updated', () => {
        renderSystems();
        updatePowerLabels();
    });

    kernel.on('power:distribution-applied', ({ payload }) => {
        if (payload?.source === 'manual') {
            addLog('log', 'Manuelle Energieverteilung übernommen. Systeme beobachten.');
        }
    });

    kernel.on('life-support:updated', () => {
        if (state.selectedSystemId === 'life-support') {
            showSystemDetails('life-support');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    init().catch(error => {
        console.error('Initialisierung fehlgeschlagen', error);
        addLog('error', `Initialisierung fehlgeschlagen: ${error.message}`);
    });
});
