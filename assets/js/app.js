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

const ALERT_THEME_CLASSES = ['alert-theme-green', 'alert-theme-yellow', 'alert-theme-red', 'alert-theme-black'];

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
    tactical: {
        contacts: [],
        weapons: [],
        sectors: [],
        selectedContactId: null
    },
    damageControl: {
        reports: [],
        systems: [],
        bypasses: [],
        repairs: []
    },
    science: {
        samples: [],
        anomalies: [],
        projects: [],
        missions: [],
        markers: []
    },
    cargo: {
        summary: null,
        holds: [],
        logistics: []
    },
    fabrication: {
        queue: [],
        kits: [],
        consumables: []
    },
    medical: {
        roster: [],
        resources: [],
        quarantine: null
    },
    security: {
        roles: [],
        authorizations: [],
        audit: []
    },
    propulsion: {
        thrusters: [],
        fuel: null,
        rcs: null,
        profiles: [],
        maneuvers: [],
        alerts: [],
        activeProfileId: null
    },
    thermal: {
        heatLoads: [],
        radiators: [],
        cooling: [],
        signature: null
    },
    ftl: {
        capacitor: null,
        window: null,
        checklist: [],
        abort: []
    },
    stations: [],
    procedures: [],
    briefing: {
        markers: [],
        report: [],
        summary: ''
    },
    scenario: {
        phases: [],
        triggers: []
    },
    encounters: [],
    telemetry: {
        metrics: [],
        events: [],
        paused: false
    },
    faults: {
        templates: [],
        active: []
    },
    larp: {
        parameters: [],
        cues: [],
        fogLevel: 25
    },
    npc: {
        scripts: [],
        cues: [],
        log: []
    },
    crewSchedule: {
        scenes: []
    },
    immersion: {
        audio: [],
        lighting: null,
        props: []
    },
    characters: {
        roster: []
    },
    news: {
        feeds: [],
        drafts: []
    },
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
    elements.appShell = document.getElementById('app');
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

    elements.tacticalModule = document.getElementById('tactical-module');
    elements.tacticalStatus = document.getElementById('tactical-selected-status');
    elements.tacticalTargetList = document.getElementById('tactical-target-list');
    elements.tacticalContactDetails = document.getElementById('tactical-contact-details');
    elements.tacticalSectorGrid = document.getElementById('tactical-sector-grid');
    elements.tacticalWeaponList = document.getElementById('tactical-weapon-list');

    elements.damageStatus = document.getElementById('damage-status');
    elements.damageReportTable = document.getElementById('damage-report-table');
    elements.damageSystemTree = document.getElementById('damage-system-tree');
    elements.damageBypassList = document.getElementById('damage-bypass-list');
    elements.damageRepairTable = document.getElementById('damage-repair-table');

    elements.crewList = document.getElementById('crew-list');
    elements.crewStatus = document.getElementById('crew-status');

    elements.missionObjectives = document.getElementById('mission-objectives');

    elements.pauseSim = document.getElementById('pause-sim');
    elements.resumeSim = document.getElementById('resume-sim');

    elements.reloadConfig = document.getElementById('reload-config');

    elements.scienceStatus = document.getElementById('science-status');
    elements.scienceSampleTable = document.getElementById('science-sample-table');
    elements.scienceAnomalyList = document.getElementById('science-anomaly-list');
    elements.scienceProjects = document.getElementById('science-projects');
    elements.scienceAdvance = document.getElementById('science-advance');

    elements.cargoBalance = document.getElementById('cargo-balance');
    elements.cargoSummary = document.getElementById('cargo-summary');
    elements.cargoHoldTable = document.getElementById('cargo-hold-table');
    elements.cargoLogisticsList = document.getElementById('cargo-logistics-list');

    elements.fabricationStatus = document.getElementById('fabrication-status');
    elements.fabricationQueue = document.getElementById('fabrication-queue');
    elements.fabricationKits = document.getElementById('fabrication-kits');
    elements.fabricationConsumables = document.getElementById('fabrication-consumables');

    elements.medicalStatus = document.getElementById('medical-status');
    elements.medicalRoster = document.getElementById('medical-roster');
    elements.medicalResources = document.getElementById('medical-resources');
    elements.medicalQuarantine = document.getElementById('medical-quarantine');

    elements.securityStatus = document.getElementById('security-status');
    elements.securityRoles = document.getElementById('security-roles');
    elements.securityAuthList = document.getElementById('security-auth-list');
    elements.securityAuditLog = document.getElementById('security-audit-log');

    elements.briefingStatus = document.getElementById('briefing-status');
    elements.briefingMarkers = document.getElementById('briefing-markers');
    elements.debriefingSummary = document.getElementById('debriefing-summary');
    elements.debriefingExport = document.getElementById('debriefing-export');

    elements.procedureStatus = document.getElementById('procedure-status');
    elements.procedureSelect = document.getElementById('procedure-select');
    elements.procedureSteps = document.getElementById('procedure-steps');
    elements.procedureProgressBar = document.getElementById('procedure-progress-bar');
    elements.procedureProgressLabel = document.getElementById('procedure-progress-label');

    elements.stationsStatus = document.getElementById('stations-status');
    elements.stationsReadiness = document.getElementById('stations-readiness');

    elements.scenarioPhaseStatus = document.getElementById('scenario-phase-status');
    elements.scenarioPhaseList = document.getElementById('scenario-phase-list');
    elements.scenarioTriggerList = document.getElementById('scenario-trigger-list');
    elements.scenarioEncounterList = document.getElementById('scenario-encounter-list');

    elements.telemetryStatus = document.getElementById('telemetry-status');
    elements.telemetryMetrics = document.getElementById('telemetry-metrics');
    elements.telemetryEvents = document.getElementById('telemetry-events');
    elements.telemetryPause = document.getElementById('telemetry-pause');
    elements.telemetryResume = document.getElementById('telemetry-resume');
    elements.telemetryReplay = document.getElementById('telemetry-replay');

    elements.faultStatus = document.getElementById('fault-status');
    elements.faultTemplateList = document.getElementById('fault-template-list');
    elements.faultActiveList = document.getElementById('fault-active-list');

    elements.larpStatus = document.getElementById('larp-status');
    elements.larpParameters = document.getElementById('larp-parameters');
    elements.larpCues = document.getElementById('larp-cues');
    elements.larpFog = document.getElementById('larp-fog');
    elements.larpFogLabel = document.getElementById('larp-fog-label');

    elements.propulsionStatus = document.getElementById('propulsion-status');
    elements.propulsionFuel = document.getElementById('propulsion-fuel');
    elements.propulsionRcs = document.getElementById('propulsion-rcs');
    elements.propulsionThrusterTable = document.getElementById('propulsion-thruster-table');
    elements.propulsionProfileList = document.getElementById('propulsion-profile-list');
    elements.propulsionManeuverList = document.getElementById('propulsion-maneuver-list');
    elements.propulsionAlertList = document.getElementById('propulsion-alert-list');

    elements.thermalStatus = document.getElementById('thermal-status');
    elements.thermalLoadTable = document.getElementById('thermal-load-table');
    elements.thermalRadiatorGrid = document.getElementById('thermal-radiator-grid');
    elements.thermalCoolingList = document.getElementById('thermal-cooling-list');
    elements.thermalSignature = document.getElementById('thermal-signature');

    elements.ftlStatus = document.getElementById('ftl-status');
    elements.ftlChargeBar = document.getElementById('ftl-charge-bar');
    elements.ftlChargeLabel = document.getElementById('ftl-charge-label');
    elements.ftlWindowInfo = document.getElementById('ftl-window-info');
    elements.ftlChecklist = document.getElementById('ftl-checklist');
    elements.ftlAbortList = document.getElementById('ftl-abort-list');

    elements.npcStatus = document.getElementById('npc-status');
    elements.npcScriptList = document.getElementById('npc-script-list');
    elements.npcCueList = document.getElementById('npc-cue-list');
    elements.npcLog = document.getElementById('npc-log');

    elements.crewSchedulerStatus = document.getElementById('crew-scheduler-status');
    elements.crewSceneList = document.getElementById('crew-scene-list');

    elements.immersionStatus = document.getElementById('immersion-status');
    elements.immersionAudioList = document.getElementById('immersion-audio-list');
    elements.immersionLighting = document.getElementById('immersion-lighting');
    elements.immersionLightingLabel = document.getElementById('immersion-lighting-label');
    elements.immersionLightingMode = document.getElementById('immersion-lighting-mode');
    elements.immersionPropList = document.getElementById('immersion-prop-list');

    elements.characterStatus = document.getElementById('character-status');
    elements.characterRoster = document.getElementById('character-roster');

    elements.newsStatus = document.getElementById('news-status');
    elements.newsFeedList = document.getElementById('news-feed-list');
    elements.newsDraftList = document.getElementById('news-draft-list');
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

    kernel.registerModule('tactical-control', {
        onTick(context) {
            if (context.state.simulationPaused) return;
            const tactical = context.state.tactical;
            if (!tactical || !Array.isArray(tactical.weapons)) return;
            let changed = false;
            tactical.weapons.forEach(weapon => {
                if (weapon.status === 'cooling' && weapon.cooldownRemaining > 0) {
                    weapon.cooldownRemaining = Math.max(0, weapon.cooldownRemaining - 1);
                    if (weapon.cooldownRemaining === 0) {
                        if (weapon.ammo !== null && weapon.ammo <= 0) {
                            weapon.status = 'offline';
                        } else {
                            weapon.status = 'ready';
                        }
                        context.log(`${weapon.name} ist wieder feuerbereit.`);
                        changed = true;
                    }
                }
            });
            if (changed) {
                context.emit('tactical:updated', { reason: 'cooldown' });
            }
        }
    });

    kernel.registerModule('scenario-engine', {
        onTick(context) {
            if (context.state.simulationPaused) return;
            const triggers = context.state.scenario?.triggers ?? [];
            triggers.forEach(trigger => {
                if (trigger.auto && evaluateScenarioTrigger(trigger)) {
                    fireScenarioTrigger(trigger.id, { manual: false });
                }
            });
        }
    });

    kernel.registerModule('encounter-ai', {
        onTick(context) {
            if (context.state.simulationPaused) return;
            const encounters = context.state.encounters ?? [];
            const contacts = context.state.tactical?.contacts ?? [];
            let updated = false;
            encounters.forEach(encounter => {
                if (encounter.behavior === 'hostile' && encounter.contactId) {
                    const contact = contacts.find(contact => contact.id === encounter.contactId);
                    if (contact) {
                        contact.threat = clamp(contact.threat + 1, 0, 100);
                        updated = true;
                    }
                }
            });
            if (updated) {
                renderTacticalContacts();
                renderTacticalContactDetails();
            }
        }
    });

    kernel.registerModule('telemetry-stream', {
        onTick(context, tick) {
            if (context.state.telemetry?.paused) return;
            const metrics = context.state.telemetry?.metrics ?? [];
            if (metrics.length) {
                metrics.forEach(metric => {
                    const delta = randBetween(-2, 3);
                    metric.value = Math.max(0, Math.round((Number(metric.value) || 0) + delta));
                    metric.trend = delta > 0 ? 'steigend' : delta < 0 ? 'fallend' : 'stabil';
                });
                renderTelemetryMetrics();
            }
            if (tick % 30 === 0) {
                const event = {
                    id: `telemetry-${Date.now()}`,
                    message: 'Automatische Telemetrieprobe gespeichert.',
                    timestamp: formatTime()
                };
                context.state.telemetry.events.push(event);
                context.state.telemetry.events = context.state.telemetry.events.slice(-20);
                renderTelemetryEvents();
            }
        }
    });
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

/** === Tactical UI === */
function ensureTacticalState() {
    if (!state.tactical) {
        state.tactical = {
            contacts: [],
            weapons: [],
            sectors: [],
            selectedContactId: null
        };
    }
    if (!Array.isArray(state.tactical.contacts)) state.tactical.contacts = [];
    if (!Array.isArray(state.tactical.weapons)) state.tactical.weapons = [];
    if (!Array.isArray(state.tactical.sectors)) state.tactical.sectors = [];
    if (typeof state.tactical.selectedContactId === 'undefined') state.tactical.selectedContactId = null;
    return state.tactical;
}

function prepareTacticalState(tactical) {
    const prepared = {
        contacts: Array.isArray(tactical?.contacts)
            ? tactical.contacts.map(contact => normalizeTacticalContact(contact)).filter(Boolean)
            : [],
        weapons: Array.isArray(tactical?.weapons)
            ? tactical.weapons.map(weapon => normalizeTacticalWeapon(weapon)).filter(Boolean)
            : [],
        sectors: Array.isArray(tactical?.sectors)
            ? tactical.sectors.map(sector => normalizeTacticalSector(sector)).filter(Boolean)
            : [],
        selectedContactId: null
    };
    const highest = pickHighestThreatContact(prepared.contacts);
    prepared.selectedContactId = highest ? highest.id : null;
    return prepared;
}

function normalizeTacticalContact(contact) {
    if (!contact) return null;
    const toFloat = (value, fallback = 0) => {
        if (typeof value === 'number' && Number.isFinite(value)) return value;
        const parsed = Number.parseFloat(value);
        return Number.isNaN(parsed) ? fallback : parsed;
    };
    const fallbackId = contact.id
        ?? contact.callsign
        ?? contact.name
        ?? contact.type
        ?? `contact-${Date.now()}`;
    const attitudeRaw = (contact.attitude ?? contact.allegiance ?? contact.status ?? 'unknown').toString().toLowerCase();
    let attitude = attitudeRaw;
    if (attitude.includes('feind')) attitude = 'hostile';
    else if (attitude.includes('ally') || attitude.includes('freund')) attitude = 'friendly';
    else if (attitude.includes('neutralis')) attitude = 'neutralized';
    else if (attitude.includes('neutral')) attitude = 'neutral';
    if (!['hostile', 'friendly', 'neutral', 'neutralized', 'allied'].includes(attitude)) attitude = 'unknown';
    if (attitude === 'allied') attitude = 'friendly';

    const stateRaw = (contact.state ?? contact.statusDetail ?? 'active').toString().toLowerCase();
    let stateValue = stateRaw;
    if (stateValue.includes('drift')) stateValue = 'drifting';
    else if (stateValue.includes('disable') || stateValue.includes('aus')) stateValue = 'disabled';
    else if (!['active', 'disabled', 'drifting'].includes(stateValue)) stateValue = 'active';

    const unitRaw = typeof contact.distanceUnit === 'string' ? contact.distanceUnit : 'km';
    const normalizedUnit = unitRaw.toLowerCase();
    const distanceValue = contact.distance ?? contact.distanceKm ?? contact.range ?? null;
    let distanceKm = null;
    if (distanceValue !== null && distanceValue !== undefined) {
        const parsedDistance = toFloat(distanceValue, NaN);
        if (!Number.isNaN(parsedDistance)) {
            switch (normalizedUnit) {
                case 'mm':
                case 'megameter':
                case 'megameters':
                    distanceKm = parsedDistance * 1000;
                    break;
                case 'm':
                case 'meter':
                case 'meters':
                    distanceKm = parsedDistance / 1000;
                    break;
                case 'au':
                    distanceKm = parsedDistance * 149597870.7;
                    break;
                default:
                    distanceKm = parsedDistance;
                    break;
            }
        }
    }

    const hull = contact.hull !== undefined && contact.hull !== null
        ? clamp(toFloat(contact.hull, 100), 0, 100)
        : null;
    const shields = contact.shields !== undefined && contact.shields !== null
        ? clamp(toFloat(contact.shields, 0), 0, 100)
        : null;
    const threatValue = clamp(toFloat(contact.threat ?? contact.threatLevel ?? 0, 0), 0, 100);
    const threat = hull === 0 ? 0 : threatValue;

    return {
        id: String(fallbackId),
        callsign: contact.callsign ?? contact.name ?? String(fallbackId),
        type: contact.type ?? contact.classification ?? 'Unbekannt',
        attitude,
        sectorId: contact.sectorId ?? contact.sector ?? null,
        state: stateValue,
        threat,
        distanceKm,
        distanceUnit: unitRaw,
        hull,
        shields,
        vector: contact.vector ?? contact.heading ?? '',
        velocity: contact.velocity ?? contact.speed ?? '',
        bearing: contact.bearing ?? '',
        priority: contact.priority ?? '',
        objective: contact.objective ?? '',
        lastKnown: contact.lastKnown ?? contact.lastSeen ?? '',
        notes: contact.notes ?? ''
    };
}

function normalizeTacticalWeapon(weapon) {
    if (!weapon) return null;
    const toFloat = (value, fallback = 0) => {
        if (typeof value === 'number' && Number.isFinite(value)) return value;
        const parsed = Number.parseFloat(value);
        return Number.isNaN(parsed) ? fallback : parsed;
    };
    const fallbackId = weapon.id ?? weapon.name ?? `weapon-${Date.now()}`;
    let status = (weapon.status ?? 'ready').toString().toLowerCase();
    if (!['ready', 'cooling', 'offline'].includes(status)) {
        status = 'ready';
    }
    const cooldown = Math.max(0, Math.round(toFloat(weapon.cooldownSeconds ?? weapon.cooldown ?? 0, 0)));
    const cooldownRemaining = weapon.cooldownRemaining && Number.isFinite(weapon.cooldownRemaining)
        ? Math.max(0, Math.round(weapon.cooldownRemaining))
        : 0;
    const damage = Math.max(0, toFloat(weapon.damage ?? weapon.output ?? 0, 0));

    let powerCost = null;
    if (weapon.powerCost !== undefined && weapon.powerCost !== null && weapon.powerCost !== '') {
        const parsedPower = Number.parseFloat(weapon.powerCost);
        powerCost = Number.isNaN(parsedPower) ? null : parsedPower;
    } else if (weapon.power !== undefined && weapon.power !== null && weapon.power !== '') {
        const parsedPower = Number.parseFloat(weapon.power);
        powerCost = Number.isNaN(parsedPower) ? null : parsedPower;
    }

    let ammo = null;
    if (weapon.ammo !== undefined && weapon.ammo !== null && weapon.ammo !== '') {
        const parsedAmmo = Number.parseInt(weapon.ammo, 10);
        ammo = Number.isNaN(parsedAmmo) ? null : Math.max(0, parsedAmmo);
    }

    let salvo = 1;
    const salvoSource = weapon.salvo ?? weapon.salvoSize ?? weapon.burst;
    if (salvoSource !== undefined && salvoSource !== null && salvoSource !== '') {
        const parsedSalvo = Number.parseInt(salvoSource, 10);
        if (!Number.isNaN(parsedSalvo) && parsedSalvo > 0) {
            salvo = parsedSalvo;
        }
    }

    if (ammo === 0) {
        status = 'offline';
    }

    return {
        id: String(fallbackId),
        name: weapon.name ?? String(fallbackId),
        type: weapon.type ?? 'Waffe',
        arc: weapon.arc ?? '',
        status,
        cooldownSeconds: cooldown,
        cooldownRemaining,
        damage,
        powerCost,
        ammo,
        salvo,
        notes: weapon.notes ?? '',
        assignedTargetId: weapon.assignedTargetId ?? null
    };
}

function normalizeTacticalSector(sector) {
    if (!sector) return null;
    const fallbackId = sector.id ?? sector.navSector ?? sector.name ?? `sector-${Date.now()}`;
    const toInt = value => {
        if (value === null || value === undefined || value === '') return null;
        if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.round(value));
        const parsed = Number.parseInt(value, 10);
        return Number.isNaN(parsed) ? null : Math.max(0, parsed);
    };
    return {
        id: String(fallbackId),
        name: sector.name ?? String(fallbackId),
        bearing: sector.bearing ?? '',
        range: sector.range ?? '',
        navSector: sector.navSector ?? sector.linkedSector ?? null,
        hazard: sector.hazard ?? '',
        priority: sector.priority ?? '',
        friendlies: toInt(sector.friendlies),
        hostiles: toInt(sector.hostiles)
    };
}

function pickHighestThreatContact(contacts) {
    if (!Array.isArray(contacts) || contacts.length === 0) return null;
    const candidates = contacts.filter(contact => contact && (contact.threat ?? 0) > 0 && (contact.hull === null || contact.hull > 0));
    const list = candidates.length ? candidates : contacts.filter(Boolean);
    if (!list.length) return null;
    return list.reduce((best, current) => {
        if (!best) return current;
        return (current.threat ?? 0) > (best.threat ?? 0) ? current : best;
    }, null);
}

function renderTactical() {
    renderTacticalContacts();
    renderTacticalContactDetails();
    renderTacticalSectors();
    renderTacticalWeapons();
}

function renderTacticalContacts() {
    if (!elements.tacticalTargetList) return;
    const tactical = ensureTacticalState();
    elements.tacticalTargetList.innerHTML = '';
    if (!tactical.contacts.length) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="5" class="tactical-empty">Keine Kontakte erfasst.</td>';
        elements.tacticalTargetList.appendChild(row);
        if (elements.tacticalStatus) {
            elements.tacticalStatus.textContent = 'Keine Ziele';
            elements.tacticalStatus.className = 'status-pill status-idle';
        }
        return;
    }
    const sorted = tactical.contacts.slice().sort((a, b) => (b.threat ?? 0) - (a.threat ?? 0));
    sorted.forEach(contact => {
        const row = document.createElement('tr');
        row.dataset.contactId = contact.id;
        if (contact.id === tactical.selectedContactId) {
            row.classList.add('selected');
        }
        const distanceText = formatTacticalDistance(contact);
        row.innerHTML = `
            <td>
                <div class="contact-callsign">
                    <strong>${contact.callsign}</strong>
                    <small>${contact.type}</small>
                </div>
            </td>
            <td><span class="threat-pill ${threatLevelClass(contact.threat)}">${formatTacticalThreat(contact.threat)}</span></td>
            <td>${attitudeLabel(contact.attitude)}</td>
            <td>${distanceText}</td>
            <td>${contact.sectorId ? contact.sectorId.toUpperCase() : '–'}</td>
        `;
        row.addEventListener('click', () => selectTacticalContact(contact.id));
        elements.tacticalTargetList.appendChild(row);
    });
}

function renderTacticalContactDetails() {
    if (!elements.tacticalContactDetails) return;
    const tactical = ensureTacticalState();
    const contact = tactical.contacts.find(entry => entry.id === tactical.selectedContactId);
    if (!contact) {
        elements.tacticalContactDetails.innerHTML = '<p class="tactical-empty">Kontakt auswählen, um Details zu sehen.</p>';
        if (elements.tacticalStatus) {
            elements.tacticalStatus.textContent = 'Kein Ziel ausgewählt';
            elements.tacticalStatus.className = 'status-pill status-idle';
        }
        return;
    }
    if (elements.tacticalStatus) {
        elements.tacticalStatus.textContent = attitudeLabel(contact.attitude);
        elements.tacticalStatus.className = `status-pill ${attitudeClass(contact.attitude)}`;
    }
    const shieldsValue = typeof contact.shields === 'number' ? clamp(contact.shields, 0, 100) : null;
    const hullValue = typeof contact.hull === 'number' ? clamp(contact.hull, 0, 100) : null;
    const assignedWeapons = tactical.weapons.filter(weapon => weapon.assignedTargetId === contact.id);
    elements.tacticalContactDetails.innerHTML = `
        <h3>${contact.callsign}</h3>
        <p class="contact-meta">${contact.type}${contact.priority ? ` · ${contact.priority}` : ''}</p>
        <div class="tactical-bars">
            <div class="tactical-bar">
                <span>Schilde</span>
                <div class="progress-bar shield"><div class="progress" style="width:${shieldsValue ?? 0}%"></div></div>
                <small>${shieldsValue !== null ? `${Math.round(shieldsValue)}%` : '–'}</small>
            </div>
            <div class="tactical-bar">
                <span>Hülle</span>
                <div class="progress-bar hull"><div class="progress" style="width:${hullValue ?? 0}%"></div></div>
                <small>${hullValue !== null ? `${Math.round(hullValue)}%` : '–'}</small>
            </div>
        </div>
        <dl class="contact-stats">
            <div><dt>Distanz</dt><dd>${formatTacticalDistance(contact)}</dd></div>
            <div><dt>Vektor</dt><dd>${contact.vector || '–'}</dd></div>
            <div><dt>Relativgeschwindigkeit</dt><dd>${contact.velocity || '–'}</dd></div>
            <div><dt>Sektor</dt><dd>${contact.sectorId ? contact.sectorId.toUpperCase() : '–'}</dd></div>
            <div><dt>Mission</dt><dd>${contact.objective || '–'}</dd></div>
            <div><dt>Zuletzt gemeldet</dt><dd>${contact.lastKnown || '–'}</dd></div>
        </dl>
        <section class="tactical-notes">
            <h4>Notizen</h4>
            <p>${contact.notes || 'Keine Zusatzinformationen.'}</p>
        </section>
        <section class="tactical-assignments">
            <h4>Zugewiesene Waffen</h4>
            ${assignedWeapons.length
                ? `<ul class="tactical-assignment-list">${assignedWeapons.map(weapon => `<li>${weapon.name} (${weapon.type})</li>`).join('')}</ul>`
                : '<p class="tactical-empty">Keine Waffen zugewiesen.</p>'}
        </section>
    `;
}

function renderTacticalSectors() {
    if (!elements.tacticalSectorGrid) return;
    const tactical = ensureTacticalState();
    elements.tacticalSectorGrid.innerHTML = '';
    if (!tactical.sectors.length) {
        const placeholder = document.createElement('div');
        placeholder.className = 'tactical-empty';
        placeholder.textContent = 'Keine Sektoren definiert.';
        elements.tacticalSectorGrid.appendChild(placeholder);
        return;
    }
    tactical.sectors.forEach(sector => {
        const contacts = tactical.contacts.filter(contact => (contact.sectorId ?? '') === sector.id);
        const hostiles = contacts.filter(contact => contact.attitude === 'hostile' && (contact.hull === null || contact.hull > 0));
        const maxThreat = hostiles.reduce((max, entry) => Math.max(max, entry.threat ?? 0), 0);
        const threatClass = threatLevelClass(maxThreat);
        const friendliesCount = typeof sector.friendlies === 'number'
            ? sector.friendlies
            : contacts.filter(contact => contact.attitude === 'friendly').length;
        const hostilesCount = typeof sector.hostiles === 'number'
            ? sector.hostiles
            : hostiles.length;
        const card = document.createElement('article');
        card.className = `tactical-sector-card ${threatClass}`;
        card.innerHTML = `
            <header>
                <h4>${sector.name}</h4>
                <span class="threat-pill ${threatClass}">${maxThreat > 0 ? `Bedrohung ${Math.round(maxThreat)}%` : 'Ruhig'}</span>
            </header>
            <dl>
                <div><dt>Peilung</dt><dd>${sector.bearing || '–'}</dd></div>
                <div><dt>Reichweite</dt><dd>${sector.range || '–'}</dd></div>
                <div><dt>Verbündete</dt><dd>${friendliesCount}</dd></div>
                <div><dt>Hostiles</dt><dd>${hostilesCount}</dd></div>
                <div><dt>Hazard</dt><dd>${sector.hazard || '–'}</dd></div>
                <div><dt>Priorität</dt><dd>${sector.priority || '–'}</dd></div>
            </dl>
        `;
        elements.tacticalSectorGrid.appendChild(card);
    });
}

function renderTacticalWeapons() {
    if (!elements.tacticalWeaponList) return;
    const tactical = ensureTacticalState();
    elements.tacticalWeaponList.innerHTML = '';
    if (!tactical.weapons.length) {
        const placeholder = document.createElement('div');
        placeholder.className = 'tactical-empty';
        placeholder.textContent = 'Keine Waffen konfiguriert.';
        elements.tacticalWeaponList.appendChild(placeholder);
        return;
    }
    const hostileTargets = tactical.contacts.filter(contact => contact.attitude === 'hostile' && (contact.hull === null || contact.hull > 0 || (contact.threat ?? 0) > 0));
    tactical.weapons.forEach(weapon => {
        const row = document.createElement('div');
        row.className = `tactical-weapon-row ${weapon.status}`;
        row.innerHTML = `
            <div class="weapon-info">
                <strong>${weapon.name}</strong>
                <small>${weapon.type}${weapon.arc ? ` · ${weapon.arc}` : ''}</small>
            </div>
            <div class="weapon-meta">
                <span>${formatWeaponStatus(weapon)}</span>
                ${formatWeaponAmmo(weapon) ? `<span>${formatWeaponAmmo(weapon)}</span>` : ''}
            </div>
            <div class="weapon-controls">
                <label>
                    <span>Ziel</span>
                    <select data-weapon="${weapon.id}">
                        <option value="">Kein Ziel</option>
                        ${hostileTargets.map(target => `<option value="${target.id}">${target.callsign}</option>`).join('')}
                    </select>
                </label>
                <button class="primary-button" data-fire="${weapon.id}">Feuer</button>
            </div>
        `;
        const select = row.querySelector('select[data-weapon]');
        if (select) {
            select.value = weapon.assignedTargetId ?? '';
            select.addEventListener('change', event => handleWeaponAssignment(weapon.id, event.target.value || null));
        }
        const fireButton = row.querySelector('button[data-fire]');
        if (fireButton) {
            const disabled = weapon.status !== 'ready'
                || !weapon.assignedTargetId
                || state.simulationPaused
                || (weapon.ammo !== null && weapon.ammo <= 0);
            fireButton.disabled = disabled;
            fireButton.addEventListener('click', () => handleWeaponFire(weapon.id));
        }
        elements.tacticalWeaponList.appendChild(row);
    });
}

function selectTacticalContact(contactId) {
    const tactical = ensureTacticalState();
    if (!contactId || !tactical.contacts.find(contact => contact.id === contactId)) {
        tactical.selectedContactId = null;
    } else {
        tactical.selectedContactId = contactId;
    }
    renderTacticalContacts();
    renderTacticalContactDetails();
    kernel.emit('tactical:contact-selected', { contactId: tactical.selectedContactId });
}

function handleWeaponAssignment(weaponId, targetId) {
    const tactical = ensureTacticalState();
    const weapon = tactical.weapons.find(entry => entry.id === weaponId);
    if (!weapon) return;
    weapon.assignedTargetId = targetId || null;
    if (targetId) {
        const target = tactical.contacts.find(contact => contact.id === targetId);
        addLog('log', `Taktik: ${weapon.name} richtet sich auf ${target?.callsign ?? 'Ziel'} aus.`);
    } else {
        addLog('log', `Taktik: ${weapon.name} Zielzuweisung aufgehoben.`);
    }
    kernel.emit('tactical:updated', { reason: 'assignment', weaponId, targetId });
    renderTacticalWeapons();
    renderTacticalContactDetails();
}

function handleWeaponFire(weaponId) {
    const tactical = ensureTacticalState();
    const weapon = tactical.weapons.find(entry => entry.id === weaponId);
    if (!weapon) return;
    if (state.simulationPaused) {
        addLog('log', 'Feuerbefehl blockiert: Simulation pausiert.');
        return;
    }
    if (weapon.status === 'offline') {
        addLog('log', `${weapon.name} ist offline.`);
        return;
    }
    if (weapon.cooldownRemaining > 0) {
        addLog('log', `${weapon.name} kühlt noch ${weapon.cooldownRemaining}s ab.`);
        return;
    }
    if (!weapon.assignedTargetId) {
        addLog('log', `${weapon.name} hat kein Ziel.`);
        return;
    }
    const target = tactical.contacts.find(contact => contact.id === weapon.assignedTargetId);
    if (!target) {
        weapon.assignedTargetId = null;
        addLog('log', `${weapon.name}: Ziel nicht mehr verfügbar.`);
        renderTacticalWeapons();
        return;
    }
    const result = resolveWeaponHit(weapon, target);
    weapon.cooldownRemaining = weapon.cooldownSeconds;
    weapon.status = weapon.cooldownSeconds > 0 ? 'cooling' : 'ready';
    if (weapon.ammo !== null) {
        weapon.ammo = Math.max(0, weapon.ammo - weapon.salvo);
        if (weapon.ammo === 0) {
            weapon.status = 'offline';
        }
    }
    addLog('log', `Feuerleit: ${weapon.name} feuert auf ${target.callsign}. ${result.summary}`);
    if (result.targetDestroyed) {
        addLog('log', `${target.callsign} neutralisiert.`);
        tactical.weapons.forEach(entry => {
            if (entry.assignedTargetId === target.id) {
                entry.assignedTargetId = null;
            }
        });
        target.attitude = 'neutralized';
        target.state = 'disabled';
        target.threat = 0;
        if (target.hull !== null) target.hull = 0;
        if (tactical.selectedContactId === target.id) {
            const next = pickHighestThreatContact(tactical.contacts);
            tactical.selectedContactId = next ? next.id : null;
        }
    }
    kernel.emit('tactical:fire', { weaponId, targetId: target.id, result });
    kernel.emit('tactical:updated', { reason: 'fire', weaponId, targetId: target.id, result });
    renderTactical();
}

function resolveWeaponHit(weapon, contact) {
    const shieldsBefore = typeof contact.shields === 'number' ? clamp(contact.shields, 0, 100) : null;
    const hullBefore = typeof contact.hull === 'number' ? clamp(contact.hull, 0, 100) : null;
    let remainingDamage = weapon.damage ?? 0;
    if (!Number.isFinite(remainingDamage) || remainingDamage <= 0) {
        return { shieldDamage: 0, hullDamage: 0, threatReduction: 0, targetDestroyed: false, summary: 'keine Wirkung' };
    }
    let shieldDamage = 0;
    let hullDamage = 0;
    if (shieldsBefore !== null && shieldsBefore > 0) {
        const nextShields = clamp(shieldsBefore - remainingDamage, 0, 100);
        shieldDamage = shieldsBefore - nextShields;
        contact.shields = nextShields;
        remainingDamage = Math.max(0, remainingDamage - shieldDamage);
    }
    if (remainingDamage > 0 && hullBefore !== null) {
        const nextHull = clamp(hullBefore - remainingDamage, 0, 100);
        hullDamage = hullBefore - nextHull;
        contact.hull = nextHull;
        remainingDamage = Math.max(0, remainingDamage - hullDamage);
    }
    if (remainingDamage > 0 && hullBefore === null) {
        hullDamage = remainingDamage;
    }
    const targetDestroyed = typeof contact.hull === 'number' ? contact.hull <= 0 : false;
    const threatReduction = Math.min(contact.threat ?? 0, Math.round(hullDamage * 0.8 + shieldDamage * 0.3));
    if (typeof contact.threat === 'number') {
        contact.threat = clamp((contact.threat ?? 0) - threatReduction, 0, 100);
    }
    const summaryParts = [];
    if (shieldDamage > 0) summaryParts.push(`Schilde -${Math.round(shieldDamage)}%`);
    if (hullDamage > 0 && typeof contact.hull === 'number') summaryParts.push(`Hülle -${Math.round(hullDamage)}%`);
    if (!summaryParts.length) summaryParts.push('keine Wirkung');
    return {
        shieldDamage,
        hullDamage,
        threatReduction,
        targetDestroyed,
        summary: summaryParts.join(', ')
    };
}

function formatTacticalDistance(contact) {
    const value = typeof contact.distanceKm === 'number' ? contact.distanceKm : null;
    if (value === null) return '–';
    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)} Gm`;
    }
    if (value >= 1000) {
        return `${(value / 1000).toFixed(1)} Mm`;
    }
    return `${Math.round(value).toLocaleString('de-DE')} km`;
}

function formatWeaponStatus(weapon) {
    if (weapon.status === 'offline') {
        return 'Offline';
    }
    if (weapon.status === 'cooling' && weapon.cooldownRemaining > 0) {
        return `Abklingzeit ${weapon.cooldownRemaining}s`;
    }
    return 'Bereit';
}

function formatWeaponAmmo(weapon) {
    if (weapon.ammo === null || weapon.ammo === undefined) return '';
    return `Munition ${weapon.ammo}`;
}

/** === Damage Control === */
function normalizeDamageControl(damage) {
    const source = damage && typeof damage === 'object' ? damage : DEFAULT_SCENARIO.damageControl ?? {};
    const safeArray = value => (Array.isArray(value) ? value : []);
    const toNumber = value => {
        if (typeof value === 'number' && Number.isFinite(value)) return value;
        const parsed = Number.parseFloat(value);
        return Number.isFinite(parsed) ? parsed : null;
    };

    const normalizeNode = (node, index, parentId = 'damage-node') => {
        const id = node.id ?? `${parentId}-${index + 1}`;
        const status = (node.status ?? 'online').toLowerCase();
        const integrity = toNumber(node.integrity);
        const power = toNumber(node.power);
        return {
            id,
            name: node.name ?? node.label ?? 'Subsystem',
            status,
            integrity: integrity === null ? null : clamp(integrity, 0, 100),
            power: power === null ? null : clamp(power, 0, 100),
            note: node.note ?? node.notes ?? '',
            children: safeArray(node.children).map((child, childIndex) => normalizeNode(child, childIndex, id))
        };
    };

    const reports = safeArray(source.reports).map((report, index) => ({
        id: report.id ?? `damage-report-${index + 1}`,
        system: report.system ?? 'System',
        location: report.location ?? '',
        severity: (report.severity ?? 'minor').toLowerCase(),
        status: (report.status ?? 'queued').toLowerCase(),
        eta: report.eta ?? '',
        note: report.note ?? ''
    }));
    const systems = safeArray(source.systems).map((node, index) => normalizeNode(node, index));
    const bypasses = safeArray(source.bypasses).map((bypass, index) => ({
        id: bypass.id ?? `bypass-${index + 1}`,
        description: bypass.description ?? bypass.label ?? 'Bypass',
        owner: bypass.owner ?? bypass.team ?? '',
        status: (bypass.status ?? 'planned').toLowerCase(),
        eta: bypass.eta ?? '',
        note: bypass.note ?? ''
    }));
    const repairs = safeArray(source.repairs).map((repair, index) => ({
        id: repair.id ?? `repair-${index + 1}`,
        label: repair.label ?? repair.order ?? `Auftrag ${index + 1}`,
        system: repair.system ?? '',
        team: repair.team ?? repair.crew ?? '',
        status: (repair.status ?? 'queued').toLowerCase(),
        eta: repair.eta ?? '',
        parts: safeArray(repair.parts).map((part, partIndex) => ({
            id: part.id ?? `${repair.id ?? `repair-${index + 1}`}-part-${partIndex + 1}`,
            name: part.name ?? part.label ?? 'Teil',
            quantity: part.quantity ?? part.qty ?? ''
        }))
    }));
    return { reports, systems, bypasses, repairs };
}

function renderDamageControl() {
    const damage = state.damageControl ?? { reports: [], systems: [], bypasses: [], repairs: [] };
    renderDamageReports(damage.reports);
    renderDamageSystems(damage.systems);
    renderDamageBypasses(damage.bypasses);
    renderDamageRepairs(damage.repairs);
    updateDamageStatus(damage);
}

function renderDamageReports(reports) {
    if (!elements.damageReportTable) return;
    elements.damageReportTable.innerHTML = '';
    if (!reports.length) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="5" class="tactical-empty">Keine Schadensmeldungen.</td>';
        elements.damageReportTable.appendChild(row);
        return;
    }
    reports.forEach(report => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="damage-report-system">
                    <strong>${report.system}</strong>
                    ${report.note ? `<small>${report.note}</small>` : ''}
                </div>
            </td>
            <td>${report.location || '–'}</td>
            <td><span class="status-pill ${damageSeverityClass(report.severity)}">${damageSeverityLabel(report.severity)}</span></td>
            <td><span class="status-pill ${damageReportStatusClass(report.status)}">${damageReportStatusLabel(report.status)}</span></td>
            <td>${report.eta || '–'}</td>
        `;
        elements.damageReportTable.appendChild(row);
    });
}

function renderDamageSystems(nodes) {
    if (!elements.damageSystemTree) return;
    elements.damageSystemTree.innerHTML = '';
    if (!nodes.length) {
        const div = document.createElement('div');
        div.className = 'tactical-empty';
        div.textContent = 'Keine Systemknoten definiert.';
        elements.damageSystemTree.appendChild(div);
        return;
    }
    elements.damageSystemTree.appendChild(buildDamageTree(nodes));
}

function buildDamageTree(nodes) {
    const ul = document.createElement('ul');
    ul.className = 'damage-tree-list';
    nodes.forEach(node => {
        const li = document.createElement('li');
        const integrity = node.integrity !== null && node.integrity !== undefined
            ? `<span>Integrität ${Math.round(node.integrity)}%</span>`
            : '';
        const power = node.power !== null && node.power !== undefined
            ? `<span>Leistung ${Math.round(node.power)}%</span>`
            : '';
        li.innerHTML = `
            <div class="damage-tree-node">
                <div class="damage-tree-header">
                    <span class="node-name">${node.name}</span>
                    <span class="status-pill ${damageNodeStatusClass(node.status)}">${damageNodeStatusLabel(node.status)}</span>
                </div>
                <div class="damage-tree-meta">
                    ${integrity}
                    ${power}
                </div>
                ${node.note ? `<p>${node.note}</p>` : ''}
            </div>
        `;
        if (node.children.length) {
            li.appendChild(buildDamageTree(node.children));
        }
        ul.appendChild(li);
    });
    return ul;
}

function renderDamageBypasses(bypasses) {
    if (!elements.damageBypassList) return;
    elements.damageBypassList.innerHTML = '';
    if (!bypasses.length) {
        const li = document.createElement('li');
        li.className = 'empty-placeholder';
        li.textContent = 'Keine Bypässe eingetragen.';
        elements.damageBypassList.appendChild(li);
        return;
    }
    bypasses.forEach(bypass => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>
                <strong>${bypass.owner || 'Crew'}</strong><br>
                ${bypass.description}
                ${bypass.note ? `<small>${bypass.note}</small>` : ''}
            </span>
            <span class="status-pill ${damageTaskStatusClass(bypass.status)}">${damageTaskStatusLabel(bypass.status)}</span>
            <span class="bypass-eta">${bypass.eta ? `ETA ${bypass.eta}` : ''}</span>
            <button class="mini-button" data-action="toggle-bypass" data-bypass="${bypass.id}">
                ${bypass.status === 'engaged' ? 'Bypass freigeben' : 'Bypass aktivieren'}
            </button>
        `;
        elements.damageBypassList.appendChild(li);
    });
}

function renderDamageRepairs(repairs) {
    if (!elements.damageRepairTable) return;
    elements.damageRepairTable.innerHTML = '';
    if (!repairs.length) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="5" class="tactical-empty">Keine Reparaturaufträge.</td>';
        elements.damageRepairTable.appendChild(row);
        return;
    }
    repairs.forEach(repair => {
        const row = document.createElement('tr');
        const actions = [];
        if (repair.status === 'queued') {
            actions.push(`<button class="mini-button" data-action="repair-start" data-repair="${repair.id}">Starten</button>`);
        }
        if (repair.status === 'active') {
            actions.push(`<button class="mini-button" data-action="repair-complete" data-repair="${repair.id}">Abschließen</button>`);
        }
        row.innerHTML = `
            <td>
                <strong>${repair.label}</strong>
                ${repair.system ? `<small>${repair.system}</small>` : ''}
            </td>
            <td>${repair.team || 'Crew'}</td>
            <td>${formatRepairParts(repair.parts)}</td>
            <td><span class="status-pill ${damageTaskStatusClass(repair.status)}">${damageTaskStatusLabel(repair.status)}</span></td>
            <td class="damage-actions">
                ${actions.length ? actions.join(' ') : '<span class="tactical-empty">–</span>'}
            </td>
        `;
        elements.damageRepairTable.appendChild(row);
    });
}

function formatRepairParts(parts) {
    if (!Array.isArray(parts) || parts.length === 0) return '–';
    return parts.map(part => `${part.quantity ? `${part.quantity}× ` : ''}${part.name}`).join(', ');
}

function updateDamageStatus(damage) {
    if (!elements.damageStatus) return;
    const severityRanking = { minor: 1, moderate: 2, major: 3, critical: 4 };
    const openReports = damage.reports.filter(report => !['resolved', 'complete'].includes(report.status));
    const highestSeverity = openReports.reduce((acc, report) => {
        const rank = severityRanking[report.severity] ?? 0;
        return rank > acc ? rank : acc;
    }, 0);
    const pendingRepairs = damage.repairs.filter(repair => repair.status !== 'complete').length;
    const activeBypasses = damage.bypasses.filter(bypass => bypass.status === 'engaged').length;

    let label = 'Stabil';
    let className = 'status-online';
    if (openReports.length > 0) {
        label = `${openReports.length} Meldung${openReports.length === 1 ? '' : 'en'}`;
        className = highestSeverity >= 3 ? 'status-critical' : 'status-warning';
    } else if (pendingRepairs > 0) {
        label = `${pendingRepairs} Reparatur${pendingRepairs === 1 ? '' : 'en'} offen`;
        className = 'status-warning';
    } else if (activeBypasses > 0) {
        label = `${activeBypasses} Bypass aktiv`;
        className = 'status-online';
    }
    elements.damageStatus.textContent = label;
    elements.damageStatus.className = `status-pill ${className}`;
}

function damageSeverityLabel(severity) {
    switch (severity) {
        case 'critical': return 'Kritisch';
        case 'major': return 'Schwer';
        case 'moderate': return 'Mittel';
        case 'minor': return 'Leicht';
        default: return 'Unbekannt';
    }
}

function damageSeverityClass(severity) {
    switch (severity) {
        case 'critical': return 'status-critical';
        case 'major':
        case 'moderate': return 'status-warning';
        case 'minor': return 'status-online';
        default: return 'status-idle';
    }
}

function damageReportStatusLabel(status) {
    switch (status) {
        case 'in-progress': return 'In Arbeit';
        case 'stabilized': return 'Stabilisiert';
        case 'queued': return 'Gemeldet';
        case 'resolved':
        case 'complete': return 'Abgeschlossen';
        default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
}

function damageReportStatusClass(status) {
    switch (status) {
        case 'in-progress': return 'status-warning';
        case 'stabilized':
        case 'resolved':
        case 'complete': return 'status-online';
        case 'queued': return 'status-idle';
        default: return 'status-idle';
    }
}

function damageNodeStatusLabel(status) {
    switch (status) {
        case 'online': return 'Online';
        case 'warning': return 'Warnung';
        case 'critical': return 'Kritisch';
        case 'offline': return 'Offline';
        case 'standby': return 'Standby';
        default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
}

function damageNodeStatusClass(status) {
    switch (status) {
        case 'online': return 'status-online';
        case 'warning': return 'status-warning';
        case 'critical': return 'status-critical';
        case 'offline':
        case 'standby': return 'status-idle';
        default: return 'status-idle';
    }
}

function damageTaskStatusLabel(status) {
    switch (status) {
        case 'planned': return 'Geplant';
        case 'engaged':
        case 'active': return 'Aktiv';
        case 'queued': return 'Wartend';
        case 'complete':
        case 'released': return 'Abgeschlossen';
        default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
}

function damageTaskStatusClass(status) {
    switch (status) {
        case 'engaged':
        case 'active': return 'status-warning';
        case 'planned':
        case 'queued': return 'status-idle';
        case 'complete':
        case 'released': return 'status-online';
        default: return 'status-idle';
    }
}

function handleDamageBypassClick(event) {
    const button = event.target.closest('button[data-action="toggle-bypass"]');
    if (!button) return;
    const bypassId = button.dataset.bypass;
    const damage = state.damageControl ?? { bypasses: [] };
    const bypass = damage.bypasses.find(entry => entry.id === bypassId);
    if (!bypass) return;
    const nextStatus = bypass.status === 'engaged' ? 'released' : 'engaged';
    const updatedBypasses = damage.bypasses.map(entry => entry.id === bypassId
        ? { ...entry, status: nextStatus }
        : entry);
    kernel.setState('damageControl', { ...damage, bypasses: updatedBypasses });
    addLog('log', nextStatus === 'engaged'
        ? `Engineering: Not-Bypass ${bypass.description} aktiviert.`
        : `Engineering: Not-Bypass ${bypass.description} freigegeben.`);
    renderDamageControl();
}

function handleDamageRepairClick(event) {
    const button = event.target.closest('button[data-action^="repair-"]');
    if (!button) return;
    const repairId = button.dataset.repair;
    const damage = state.damageControl ?? { repairs: [] };
    const repair = damage.repairs.find(entry => entry.id === repairId);
    if (!repair) return;
    let nextStatus = repair.status;
    if (button.dataset.action === 'repair-start') {
        nextStatus = 'active';
        addLog('log', `Engineering: Reparatur ${repair.label} gestartet.`);
    } else if (button.dataset.action === 'repair-complete') {
        nextStatus = 'complete';
        addLog('log', `Engineering: Reparatur ${repair.label} abgeschlossen.`);
    }
    const updatedRepairs = damage.repairs.map(entry => entry.id === repairId
        ? { ...entry, status: nextStatus }
        : entry);
    kernel.setState('damageControl', { ...damage, repairs: updatedRepairs });
    renderDamageControl();
}

function attitudeLabel(attitude) {
    switch ((attitude || '').toLowerCase()) {
        case 'hostile': return 'Feindlich';
        case 'friendly':
        case 'allied': return 'Verbündet';
        case 'neutralized': return 'Neutralisiert';
        case 'neutral': return 'Neutral';
        default: return 'Unbekannt';
    }
}

function attitudeClass(attitude) {
    switch ((attitude || '').toLowerCase()) {
        case 'hostile': return 'status-critical';
        case 'friendly':
        case 'allied': return 'status-online';
        case 'neutralized': return 'status-idle';
        case 'neutral': return 'status-warning';
        default: return 'status-idle';
    }
}

function threatLevelClass(threat) {
    if (typeof threat !== 'number') return 'threat-idle';
    if (threat >= 75) return 'threat-critical';
    if (threat >= 40) return 'threat-warning';
    if (threat > 0) return 'threat-low';
    return 'threat-idle';
}

function formatTacticalThreat(value) {
    if (typeof value !== 'number') return '0%';
    return `${Math.round(value)}%`;
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
        li.dataset.objectiveId = objective.id;
        li.innerHTML = `
            <span>${objective.text}${objective.optional ? ' (optional)' : ''}</span>
            <button class="mini-button" data-action="objective-toggle" data-objective="${objective.id}">
                ${objective.completed ? 'Zurücksetzen' : 'Erledigt'}
            </button>
        `;
        elements.missionObjectives.appendChild(li);
    });
}

function handleObjectiveToggle(event) {
    const button = event.target.closest('button[data-action="objective-toggle"]');
    if (!button) return;
    const objectiveId = button.dataset.objective;
    state.objectives = state.objectives.map(objective => objective.id === objectiveId
        ? { ...objective, completed: !objective.completed }
        : objective);
    renderObjectives();
    updateBriefingStatus();
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

/** === Wissenschaft === */
function normalizeScience(science = {}) {
    const safeArray = value => Array.isArray(value) ? value : [];
    const toNumber = (value, fallback = 0) => {
        const parsed = Number.parseFloat(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    };
    const normalizeStatus = status => {
        const normalized = typeof status === 'string' ? status.toLowerCase() : 'pending';
        return ['pending', 'processing', 'verified', 'escalated'].includes(normalized) ? normalized : 'pending';
    };
    const normalizeSeverity = severity => {
        const normalized = typeof severity === 'string' ? severity.toLowerCase() : 'low';
        if (['low', 'medium', 'high', 'critical'].includes(normalized)) return normalized;
        return 'low';
    };

    const samples = safeArray(science.samples).map((sample, index) => ({
        id: sample.id ?? `sample-${index + 1}`,
        name: sample.name ?? `Probe ${index + 1}`,
        type: sample.type ?? 'Unbekannt',
        status: normalizeStatus(sample.status),
        assignedTo: sample.assignedTo ?? 'Unzugewiesen',
        progress: clamp(toNumber(sample.progress, 0), 0, 100),
        increment: clamp(toNumber(sample.increment, 15), 5, 40),
        priority: sample.priority ?? 'Normal',
        notes: sample.notes ?? ''
    }));

    const anomalies = safeArray(science.anomalies).map((anomaly, index) => ({
        id: anomaly.id ?? `anomaly-${index + 1}`,
        label: anomaly.label ?? `Anomalie ${index + 1}`,
        severity: normalizeSeverity(anomaly.severity ?? 'medium'),
        status: normalizeStatus(anomaly.status ?? 'pending'),
        window: anomaly.window ?? null,
        action: anomaly.action ?? ''
    }));

    const projects = safeArray(science.projects).map((project, index) => ({
        id: project.id ?? `project-${index + 1}`,
        title: project.title ?? `Projekt ${index + 1}`,
        lead: project.lead ?? 'Team',
        milestone: project.milestone ?? 'Analyse',
        progress: clamp(toNumber(project.progress, 0), 0, 100),
        horizon: project.horizon ?? '',
        notes: project.notes ?? ''
    }));

    const missions = safeArray(science.missions).map((mission, index) => ({
        id: mission.id ?? `mission-${index + 1}`,
        title: mission.title ?? `Mission ${index + 1}`,
        verified: Boolean(mission.verified)
    }));

    const markers = safeArray(science.markers).map((marker, index) => ({
        id: marker.id ?? `marker-${index + 1}`,
        label: marker.label ?? `Marker ${index + 1}`,
        status: marker.status ?? 'pending'
    }));

    return { samples, anomalies, projects, missions, markers };
}

function renderScience() {
    if (!elements.scienceSampleTable && !elements.scienceAnomalyList && !elements.scienceProjects) return;
    const science = state.science ?? { samples: [], anomalies: [], projects: [] };
    renderScienceSamples(science.samples);
    renderScienceAnomalies(science.anomalies);
    renderScienceProjects(science.projects);
    updateScienceStatus(science);
}

function renderScienceSamples(samples = []) {
    if (!elements.scienceSampleTable) return;
    elements.scienceSampleTable.innerHTML = '';
    if (samples.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="5">Keine Proben registriert.</td>';
        elements.scienceSampleTable.appendChild(row);
        return;
    }
    samples.forEach(sample => {
        const row = document.createElement('tr');
        row.dataset.sampleId = sample.id;
        row.innerHTML = `
            <td><strong>${sample.name}</strong><br><small>${sample.notes || ''}</small></td>
            <td>${sample.type}</td>
            <td><span class="status-pill ${scienceSampleStatusClass(sample.status)}">${scienceSampleStatusLabel(sample.status)}</span></td>
            <td>${sample.assignedTo}</td>
            <td>
                <div class="progress-bar small"><div class="progress" style="width:${sample.progress}%"></div></div>
                <div class="sample-actions">
                    <small>${sample.progress}% (${sample.priority})</small>
                    ${sample.status !== 'verified' ? `<button class="mini-button" data-action="science-complete" data-sample="${sample.id}">Abschließen</button>` : ''}
                </div>
            </td>
        `;
        elements.scienceSampleTable.appendChild(row);
    });
}

function renderScienceAnomalies(anomalies = []) {
    if (!elements.scienceAnomalyList) return;
    elements.scienceAnomalyList.innerHTML = '';
    if (anomalies.length === 0) {
        const li = document.createElement('li');
        li.className = 'empty-placeholder';
        li.textContent = 'Keine Anomalien aktiv.';
        elements.scienceAnomalyList.appendChild(li);
        return;
    }
    anomalies.forEach(anomaly => {
        const li = document.createElement('li');
        li.dataset.anomalyId = anomaly.id;
        li.innerHTML = `
            <strong>${anomaly.label}</strong>
            <span>${anomaly.action || 'Monitoring'}</span>
            <span class="status-pill ${scienceSeverityClass(anomaly.severity)}">${anomaly.severity.toUpperCase()}</span>
            <button class="mini-button" data-action="science-toggle-anomaly" data-anomaly="${anomaly.id}">
                ${anomaly.status === 'verified' ? 'Reaktivieren' : 'Quittieren'}
            </button>
        `;
        elements.scienceAnomalyList.appendChild(li);
    });
}

function renderScienceProjects(projects = []) {
    if (!elements.scienceProjects) return;
    elements.scienceProjects.innerHTML = '';
    if (projects.length === 0) {
        const div = document.createElement('div');
        div.className = 'empty-placeholder';
        div.textContent = 'Keine Forschungsprojekte definiert.';
        elements.scienceProjects.appendChild(div);
        return;
    }
    projects.forEach(project => {
        const card = document.createElement('article');
        card.className = 'project-card';
        card.innerHTML = `
            <h4>${project.title}</h4>
            <p>${project.notes || 'Keine Anmerkungen.'}</p>
            <div class="progress-bar small"><div class="progress" style="width:${project.progress}%"></div></div>
            <footer>
                <span>${project.lead}</span>
                <span>${project.progress}%</span>
            </footer>
        `;
        elements.scienceProjects.appendChild(card);
    });
}

function updateScienceStatus(science) {
    if (!elements.scienceStatus) return;
    const pending = science.samples.filter(sample => sample.status !== 'verified').length;
    const critical = science.anomalies.some(anomaly => ['high', 'critical'].includes(anomaly.severity) && anomaly.status !== 'verified');
    if (critical) {
        elements.scienceStatus.textContent = 'Anomalien aktiv';
        elements.scienceStatus.className = 'status-pill status-critical';
    } else if (pending > 0) {
        elements.scienceStatus.textContent = `${pending} Analysen offen`;
        elements.scienceStatus.className = 'status-pill status-warning';
    } else {
        elements.scienceStatus.textContent = 'Bereit';
        elements.scienceStatus.className = 'status-pill status-online';
    }
    if (elements.scienceAdvance) {
        elements.scienceAdvance.disabled = pending === 0 || state.simulationPaused;
    }
}

function advanceScienceAnalyses() {
    if (state.simulationPaused) return;
    const current = state.science ?? { samples: [] };
    let changed = false;
    const updatedSamples = current.samples.map(sample => {
        if (sample.status === 'pending') {
            changed = true;
            return { ...sample, status: 'processing', progress: Math.max(sample.progress, 10) };
        }
        if (sample.status === 'processing') {
            const nextProgress = clamp(sample.progress + sample.increment, 0, 100);
            const completed = nextProgress >= 100;
            if (completed) {
                changed = true;
                addLog('science', `Probe ${sample.name} abgeschlossen.`);
                return { ...sample, progress: 100, status: 'verified' };
            }
            if (nextProgress !== sample.progress) {
                changed = true;
                return { ...sample, progress: nextProgress };
            }
        }
        return sample;
    });

    if (!changed) {
        addLog('science', 'Keine offenen Analysen zur Fortschreibung.');
        return;
    }

    const science = { ...current, samples: updatedSamples };
    kernel.setState('science', science);
    renderScience();
}

function markScienceSampleComplete(sampleId) {
    if (!sampleId) return;
    const current = state.science ?? { samples: [] };
    const updatedSamples = current.samples.map(sample => sample.id === sampleId
        ? { ...sample, status: 'verified', progress: 100 }
        : sample);
    const science = { ...current, samples: updatedSamples };
    kernel.setState('science', science);
    addLog('science', `Probe ${sampleId} als abgeschlossen markiert.`);
    renderScience();
}

function toggleScienceAnomaly(anomalyId) {
    if (!anomalyId) return;
    const current = state.science ?? { anomalies: [] };
    const updated = current.anomalies.map(anomaly => {
        if (anomaly.id !== anomalyId) return anomaly;
        const nextStatus = anomaly.status === 'verified' ? 'processing' : 'verified';
        return { ...anomaly, status: nextStatus };
    });
    kernel.setState('science', { ...current, anomalies: updated });
    renderScience();
}

function handleScienceTableClick(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    if (button.dataset.action === 'science-complete') {
        markScienceSampleComplete(button.dataset.sample);
    }
}

function handleScienceAnomalyClick(event) {
    const button = event.target.closest('button[data-action="science-toggle-anomaly"]');
    if (!button) return;
    toggleScienceAnomaly(button.dataset.anomaly);
}

function scienceSampleStatusClass(status) {
    switch (status) {
        case 'processing': return 'status-warning';
        case 'verified': return 'status-online';
        case 'escalated': return 'status-critical';
        default: return 'status-idle';
    }
}

function scienceSampleStatusLabel(status) {
    const map = {
        pending: 'Wartet',
        processing: 'In Arbeit',
        verified: 'Bestätigt',
        escalated: 'Eskaliert'
    };
    return map[status] ?? status;
}

function scienceSeverityClass(severity) {
    switch (severity) {
        case 'medium': return 'status-warning';
        case 'high':
        case 'critical': return 'status-critical';
        default: return 'status-online';
    }
}

/** === Cargo & Inventory === */
function normalizeCargo(cargo = {}) {
    const safeArray = value => Array.isArray(value) ? value : [];
    const toNumber = (value, fallback = 0) => {
        const parsed = Number.parseFloat(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    };
    const summary = cargo.summary ? {
        totalMass: toNumber(cargo.summary.totalMass, 0),
        capacity: toNumber(cargo.summary.capacity, 1),
        balance: cargo.summary.balance ?? 'Neutral',
        balanceStatus: cargo.summary.balanceStatus ?? 'status-online',
        hazardCount: toNumber(cargo.summary.hazardCount, 0),
        fuelMargin: toNumber(cargo.summary.fuelMargin, 0),
        massVector: cargo.summary.massVector ?? '0 / 0 / 0'
    } : null;
    const holds = safeArray(cargo.holds).map((hold, index) => ({
        id: hold.id ?? `hold-${index + 1}`,
        name: hold.name ?? `Frachtraum ${index + 1}`,
        occupancy: clamp(toNumber(hold.occupancy, 0), 0, 100),
        capacity: toNumber(hold.capacity, 0),
        mass: toNumber(hold.mass, 0),
        hazard: Boolean(hold.hazard),
        note: hold.note ?? ''
    }));
    const logistics = safeArray(cargo.logistics).map((entry, index) => ({
        id: entry.id ?? `log-${index + 1}`,
        description: entry.description ?? 'Aufgabe',
        window: entry.window ?? '',
        status: entry.status ?? 'pending',
        assignedTo: entry.assignedTo ?? 'Cargo'
    }));
    return { summary, holds, logistics };
}

function renderCargo() {
    const cargo = state.cargo ?? { holds: [], logistics: [] };
    renderCargoSummary(cargo.summary);
    renderCargoHolds(cargo.holds);
    renderCargoLogistics(cargo.logistics);
    updateCargoStatus(cargo.summary);
}

function renderCargoSummary(summary) {
    if (!elements.cargoSummary) return;
    if (!summary) {
        elements.cargoSummary.innerHTML = '<p class="empty-placeholder">Keine Frachtbasisdaten.</p>';
        return;
    }
    const loadPercent = summary.capacity > 0 ? Math.round((summary.totalMass / summary.capacity) * 100) : 0;
    elements.cargoSummary.innerHTML = `
        <div class="telemetry-card"><strong>Gesamtmasse</strong><span>${summary.totalMass.toFixed(1)} t</span></div>
        <div class="telemetry-card"><strong>Auslastung</strong><span>${loadPercent}%</span></div>
        <div class="telemetry-card"><strong>Gefahrgut</strong><span>${summary.hazardCount}</span></div>
        <div class="telemetry-card"><strong>Massenschwerpunkt</strong><span>${summary.massVector}</span></div>
    `;
}

function renderCargoHolds(holds = []) {
    if (!elements.cargoHoldTable) return;
    elements.cargoHoldTable.innerHTML = '';
    if (holds.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="5">Keine Lagerplätze belegt.</td>';
        elements.cargoHoldTable.appendChild(row);
        return;
    }
    holds.forEach(hold => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${hold.name}</td>
            <td>${hold.occupancy}%</td>
            <td>${hold.mass.toFixed(1)} t</td>
            <td>${hold.hazard ? '⚠️' : '—'}</td>
            <td>${hold.note || ''}</td>
        `;
        elements.cargoHoldTable.appendChild(row);
    });
}

function renderCargoLogistics(logistics = []) {
    if (!elements.cargoLogisticsList) return;
    elements.cargoLogisticsList.innerHTML = '';
    if (logistics.length === 0) {
        const li = document.createElement('li');
        li.className = 'empty-placeholder';
        li.textContent = 'Keine Logistikaufträge.';
        elements.cargoLogisticsList.appendChild(li);
        return;
    }
    logistics.forEach(task => {
        const li = document.createElement('li');
        li.dataset.taskId = task.id;
        li.innerHTML = `
            <span>${task.description}</span>
            <strong>${task.window || 'nach Priorität'}</strong>
            <button class="mini-button" data-action="cargo-toggle" data-task="${task.id}">
                ${task.status === 'complete' ? 'Zurücksetzen' : 'Erledigt'}
            </button>
        `;
        if (task.status === 'complete') {
            li.classList.add('completed');
        }
        elements.cargoLogisticsList.appendChild(li);
    });
}

function updateCargoStatus(summary) {
    if (!elements.cargoBalance) return;
    if (!summary) {
        elements.cargoBalance.textContent = 'Keine Daten';
        elements.cargoBalance.className = 'status-pill status-idle';
        return;
    }
    elements.cargoBalance.textContent = summary.balance ?? 'Ausbalanciert';
    const className = summary.balanceStatus ?? 'status-online';
    elements.cargoBalance.className = `status-pill ${className}`;
}

function toggleCargoTask(taskId) {
    if (!taskId) return;
    const cargo = state.cargo ?? { logistics: [] };
    const updated = cargo.logistics.map(task => task.id === taskId
        ? { ...task, status: task.status === 'complete' ? 'pending' : 'complete' }
        : task);
    kernel.setState('cargo', { ...cargo, logistics: updated });
    renderCargo();
}

function handleCargoLogisticsClick(event) {
    const button = event.target.closest('button[data-action="cargo-toggle"]');
    if (!button) return;
    toggleCargoTask(button.dataset.task);
}

/** === Fabrication & Ersatzteile === */
function normalizeFabrication(fabrication = {}) {
    const safeArray = value => Array.isArray(value) ? value : [];
    const toNumber = (value, fallback = 0) => {
        const parsed = Number.parseFloat(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    };
    const queue = safeArray(fabrication.queue).map((job, index) => ({
        id: job.id ?? `job-${index + 1}`,
        label: job.label ?? `Auftrag ${index + 1}`,
        type: job.type ?? 'Allgemein',
        status: job.status ?? 'queued',
        eta: job.eta ?? '',
        priority: job.priority ?? 'Normal'
    }));
    const kits = safeArray(fabrication.kits).map((kit, index) => ({
        id: kit.id ?? `kit-${index + 1}`,
        label: kit.label ?? `Kit ${index + 1}`,
        stock: toNumber(kit.stock, 0),
        status: kit.status ?? 'ok'
    }));
    const consumables = safeArray(fabrication.consumables).map((item, index) => ({
        id: item.id ?? `consumable-${index + 1}`,
        label: item.label ?? `Verbrauch ${index + 1}`,
        stock: toNumber(item.stock, 0),
        threshold: toNumber(item.threshold, 0),
        unit: item.unit ?? ''
    }));
    return { queue, kits, consumables };
}

function renderFabrication() {
    const fabrication = state.fabrication ?? { queue: [], kits: [], consumables: [] };
    renderFabricationQueue(fabrication.queue);
    renderFabricationInventory(fabrication.kits, elements.fabricationKits, 'Stück');
    renderFabricationInventory(fabrication.consumables, elements.fabricationConsumables, null);
    updateFabricationStatus(fabrication.queue);
}

function renderFabricationQueue(queue = []) {
    if (!elements.fabricationQueue) return;
    elements.fabricationQueue.innerHTML = '';
    if (queue.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="5">Keine Produktionsaufträge.</td>';
        elements.fabricationQueue.appendChild(row);
        return;
    }
    queue.forEach(job => {
        const row = document.createElement('tr');
        row.dataset.jobId = job.id;
        row.innerHTML = `
            <td>${job.label}</td>
            <td>${job.type}</td>
            <td><span class="status-pill ${fabricationStatusClass(job.status)}">${fabricationStatusLabel(job.status)}</span></td>
            <td>${job.eta || '—'}</td>
            <td>
                ${job.priority}
                <div class="sample-actions">
                    ${job.status === 'queued' ? `<button class="mini-button" data-action="fabrication-start" data-job="${job.id}">Start</button>` : ''}
                    ${job.status !== 'done' ? `<button class="mini-button" data-action="fabrication-complete" data-job="${job.id}">Fertig</button>` : ''}
                </div>
            </td>
        `;
        elements.fabricationQueue.appendChild(row);
    });
}

function renderFabricationInventory(items = [], target, fallbackUnit) {
    if (!target) return;
    target.innerHTML = '';
    if (items.length === 0) {
        const li = document.createElement('li');
        li.className = 'empty-placeholder';
        li.textContent = 'Keine Bestände';
        target.appendChild(li);
        return;
    }
    items.forEach(item => {
        const li = document.createElement('li');
        const unit = item.unit ?? fallbackUnit ?? '';
        li.innerHTML = `
            <span>${item.label}</span>
            <strong>${item.stock}${unit ? ` ${unit}` : ''}</strong>
        `;
        if (item.threshold && item.stock <= item.threshold) {
            li.classList.add('warning');
        }
        target.appendChild(li);
    });
}

function updateFabricationStatus(queue = []) {
    if (!elements.fabricationStatus) return;
    const active = queue.some(job => job.status === 'active');
    const backlog = queue.filter(job => job.status === 'queued').length;
    if (active) {
        elements.fabricationStatus.textContent = 'Aktiv';
        elements.fabricationStatus.className = 'status-pill status-online';
    } else if (backlog > 0) {
        elements.fabricationStatus.textContent = `${backlog} wartend`;
        elements.fabricationStatus.className = 'status-pill status-warning';
    } else {
        elements.fabricationStatus.textContent = 'Leerlauf';
        elements.fabricationStatus.className = 'status-pill status-idle';
    }
}

function handleFabricationQueueClick(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const jobId = button.dataset.job;
    if (!jobId) return;
    if (button.dataset.action === 'fabrication-start') {
        updateFabricationJob(jobId, 'active');
    } else if (button.dataset.action === 'fabrication-complete') {
        updateFabricationJob(jobId, 'done');
    }
}

function updateFabricationJob(jobId, status) {
    const fabrication = state.fabrication ?? { queue: [] };
    const updatedQueue = fabrication.queue.map(job => job.id === jobId
        ? { ...job, status, eta: status === 'done' ? 'Erledigt' : job.eta }
        : job);
    kernel.setState('fabrication', { ...fabrication, queue: updatedQueue });
    renderFabrication();
    addLog('engineering', `Fertigung: Auftrag ${jobId} -> ${status}.`);
}

function fabricationStatusClass(status) {
    switch (status) {
        case 'active': return 'status-online';
        case 'done': return 'status-idle';
        case 'queued': return 'status-warning';
        default: return 'status-idle';
    }
}

function fabricationStatusLabel(status) {
    const map = {
        queued: 'Geplant',
        active: 'Läuft',
        done: 'Abgeschlossen'
    };
    return map[status] ?? status;
}

/** === Medical Bay === */
function normalizeMedical(medical = {}) {
    const safeArray = value => Array.isArray(value) ? value : [];
    const roster = safeArray(medical.roster).map((entry, index) => ({
        id: entry.id ?? `patient-${index + 1}`,
        name: entry.name ?? `Crew ${index + 1}`,
        status: entry.status ?? 'stabil',
        vitals: entry.vitals ?? 'normal',
        treatment: entry.treatment ?? 'Monitoring',
        priority: entry.priority ?? 'Routine'
    }));
    const resources = safeArray(medical.resources).map((resource, index) => ({
        id: resource.id ?? `resource-${index + 1}`,
        label: resource.label ?? `Ressource ${index + 1}`,
        stock: resource.stock ?? '—',
        status: resource.status ?? 'ok'
    }));
    const quarantine = medical.quarantine ? {
        status: medical.quarantine.status ?? 'frei',
        countdown: medical.quarantine.countdown ?? '',
        note: medical.quarantine.note ?? ''
    } : null;
    return { roster, resources, quarantine };
}

function renderMedical() {
    const medical = state.medical ?? { roster: [], resources: [] };
    renderMedicalRoster(medical.roster);
    renderMedicalResources(medical.resources);
    renderMedicalQuarantine(medical.quarantine);
    updateMedicalStatus(medical.roster, medical.quarantine);
}

function renderMedicalRoster(roster = []) {
    if (!elements.medicalRoster) return;
    elements.medicalRoster.innerHTML = '';
    if (roster.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="5">Keine medizinischen Fälle.</td>';
        elements.medicalRoster.appendChild(row);
        return;
    }
    roster.forEach(entry => {
        const row = document.createElement('tr');
        row.dataset.patientId = entry.id;
        row.innerHTML = `
            <td>${entry.name}</td>
            <td><span class="status-pill ${medicalStatusClass(entry.status)}">${medicalStatusLabel(entry.status)}</span></td>
            <td>${entry.vitals}</td>
            <td>${entry.treatment}</td>
            <td>
                ${entry.priority}
                <button class="mini-button" data-action="medical-next" data-patient="${entry.id}">Nächster Schritt</button>
            </td>
        `;
        elements.medicalRoster.appendChild(row);
    });
}

function renderMedicalResources(resources = []) {
    if (!elements.medicalResources) return;
    elements.medicalResources.innerHTML = '';
    if (resources.length === 0) {
        const li = document.createElement('li');
        li.className = 'empty-placeholder';
        li.textContent = 'Keine Ressourcendaten.';
        elements.medicalResources.appendChild(li);
        return;
    }
    resources.forEach(resource => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${resource.label}</span>
            <strong>${resource.stock}</strong>
        `;
        if (resource.status === 'low') {
            li.classList.add('warning');
        }
        elements.medicalResources.appendChild(li);
    });
}

function renderMedicalQuarantine(quarantine) {
    if (!elements.medicalQuarantine) return;
    if (!quarantine) {
        elements.medicalQuarantine.innerHTML = '<p class="empty-placeholder">Keine Quarantäne aktiv.</p>';
        return;
    }
    elements.medicalQuarantine.innerHTML = `
        <p>Status: <strong>${quarantine.status}</strong></p>
        <p>${quarantine.note || 'Keine Hinweise.'}</p>
        ${quarantine.countdown ? `<p>Freigabe in ${quarantine.countdown}</p>` : ''}
        <button class="mini-button" data-action="medical-clear">Quarantäne beenden</button>
    `;
}

function updateMedicalStatus(roster = [], quarantine) {
    if (!elements.medicalStatus) return;
    const critical = roster.some(entry => entry.status === 'kritisch');
    if (critical) {
        elements.medicalStatus.textContent = 'Kritische Fälle';
        elements.medicalStatus.className = 'status-pill status-critical';
    } else if (roster.length === 0 && (!quarantine || quarantine.status === 'frei')) {
        elements.medicalStatus.textContent = 'Stabil';
        elements.medicalStatus.className = 'status-pill status-online';
    } else {
        elements.medicalStatus.textContent = 'Überwacht';
        elements.medicalStatus.className = 'status-pill status-warning';
    }
}

function handleMedicalClick(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    if (button.dataset.action === 'medical-next') {
        advanceMedicalTreatment(button.dataset.patient);
    } else if (button.dataset.action === 'medical-clear') {
        clearMedicalQuarantine();
    }
}

function advanceMedicalTreatment(patientId) {
    if (!patientId) return;
    const medical = state.medical ?? { roster: [] };
    const updatedRoster = medical.roster.map(entry => {
        if (entry.id !== patientId) return entry;
        const nextStatus = entry.status === 'kritisch' ? 'stabil' : 'entlassen';
        return { ...entry, status: nextStatus, treatment: 'Nachsorge', priority: 'Abschluss' };
    });
    kernel.setState('medical', { ...medical, roster: updatedRoster });
    renderMedical();
    addLog('medical', `MedBay aktualisiert: ${patientId}.`);
}

function clearMedicalQuarantine() {
    const medical = state.medical ?? { quarantine: null };
    if (!medical.quarantine) return;
    kernel.setState('medical', { ...medical, quarantine: { ...medical.quarantine, status: 'frei', countdown: '', note: 'Freigabe erteilt.' } });
    renderMedical();
    addLog('medical', 'Quarantäne aufgehoben.');
}

function medicalStatusClass(status) {
    switch (status) {
        case 'kritisch': return 'status-critical';
        case 'stabil': return 'status-online';
        case 'entlassen': return 'status-idle';
        default: return 'status-warning';
    }
}

function medicalStatusLabel(status) {
    const map = {
        stabil: 'Stabil',
        kritisch: 'Kritisch',
        entlassen: 'Entlassen'
    };
    return map[status] ?? status;
}

/** === Security & Access Control === */
function normalizeSecurity(security = {}) {
    const safeArray = value => Array.isArray(value) ? value : [];
    const roles = safeArray(security.roles).map((role, index) => ({
        id: role.id ?? `role-${index + 1}`,
        name: role.name ?? `Rolle ${index + 1}`,
        permissions: safeArray(role.permissions),
        critical: safeArray(role.critical),
        clearance: role.clearance ?? 'Standard'
    }));
    const authorizations = safeArray(security.authorizations).map((auth, index) => ({
        id: auth.id ?? `auth-${index + 1}`,
        action: auth.action ?? 'Aktion',
        station: auth.station ?? 'Unbekannt',
        requestedBy: auth.requestedBy ?? 'Crew',
        status: auth.status ?? 'pending',
        requires: auth.requires ?? 'Captain',
        note: auth.note ?? ''
    }));
    const audit = safeArray(security.audit).map((entry, index) => ({
        id: entry.id ?? `audit-${index + 1}`,
        message: entry.message ?? 'Aktivität',
        timestamp: entry.timestamp ?? ''
    }));
    return { roles, authorizations, audit };
}

function renderSecurity() {
    const security = state.security ?? { roles: [], authorizations: [], audit: [] };
    renderSecurityRoles(security.roles);
    renderSecurityAuthorizations(security.authorizations);
    renderSecurityAudit(security.audit);
    updateSecurityStatus(security.authorizations);
}

function renderSecurityRoles(roles = []) {
    if (!elements.securityRoles) return;
    elements.securityRoles.innerHTML = '';
    if (roles.length === 0) {
        const div = document.createElement('div');
        div.className = 'empty-placeholder';
        div.textContent = 'Keine Rollen definiert.';
        elements.securityRoles.appendChild(div);
        return;
    }
    roles.forEach(role => {
        const card = document.createElement('article');
        card.className = 'role-card';
        card.innerHTML = `
            <h4>${role.name}</h4>
            <p>Clearance: ${role.clearance}</p>
            <div>
                <strong>Rechte</strong>
                <ul>${role.permissions.map(item => `<li>${item}</li>`).join('')}</ul>
            </div>
            <div>
                <strong>Kritisch</strong>
                <ul>${role.critical.map(item => `<li>${item}</li>`).join('')}</ul>
            </div>
        `;
        elements.securityRoles.appendChild(card);
    });
}

function renderSecurityAuthorizations(authorizations = []) {
    if (!elements.securityAuthList) return;
    elements.securityAuthList.innerHTML = '';
    if (authorizations.length === 0) {
        const li = document.createElement('li');
        li.className = 'empty-placeholder';
        li.textContent = 'Keine offenen Anfragen.';
        elements.securityAuthList.appendChild(li);
        return;
    }
    authorizations.forEach(auth => {
        const li = document.createElement('li');
        li.dataset.authId = auth.id;
        li.innerHTML = `
            <span>${auth.action} (${auth.station})</span>
            <strong>${auth.requires}</strong>
            <div class="sample-actions">
                <button class="mini-button" data-action="security-approve" data-auth="${auth.id}">Freigeben</button>
                <button class="mini-button" data-action="security-deny" data-auth="${auth.id}">Sperren</button>
            </div>
        `;
        if (auth.status === 'approved') {
            li.classList.add('completed');
        } else if (auth.status === 'denied') {
            li.classList.add('warning');
        }
        elements.securityAuthList.appendChild(li);
    });
}

function renderSecurityAudit(audit = []) {
    if (!elements.securityAuditLog) return;
    elements.securityAuditLog.innerHTML = '';
    if (audit.length === 0) {
        const li = document.createElement('li');
        li.className = 'empty-placeholder';
        li.textContent = 'Noch keine Einträge.';
        elements.securityAuditLog.appendChild(li);
        return;
    }
    audit.forEach(entry => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${entry.message}</span>
            <strong>${entry.timestamp}</strong>
        `;
        elements.securityAuditLog.appendChild(li);
    });
}

function updateSecurityStatus(authorizations = []) {
    if (!elements.securityStatus) return;
    const pending = authorizations.filter(auth => auth.status === 'pending').length;
    if (pending > 0) {
        elements.securityStatus.textContent = `${pending} Freigaben`;
        elements.securityStatus.className = 'status-pill status-warning';
    } else {
        elements.securityStatus.textContent = 'Überwacht';
        elements.securityStatus.className = 'status-pill status-online';
    }
}

function handleSecurityClick(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const authId = button.dataset.auth;
    if (!authId) return;
    if (button.dataset.action === 'security-approve') {
        resolveSecurityAuthorization(authId, 'approved');
    } else if (button.dataset.action === 'security-deny') {
        resolveSecurityAuthorization(authId, 'denied');
    }
}

function resolveSecurityAuthorization(authId, status) {
    const security = state.security ?? { authorizations: [], audit: [] };
    const updatedAuth = security.authorizations.map(auth => auth.id === authId ? { ...auth, status } : auth);
    const auditEntry = {
        id: `audit-${Date.now()}`,
        message: `Autorisation ${authId} -> ${status}`,
        timestamp: formatTime()
    };
    kernel.setState('security', { ...security, authorizations: updatedAuth, audit: [...security.audit, auditEntry] });
    renderSecurity();
    addLog('security', `Autorisierung ${authId} ${status === 'approved' ? 'freigegeben' : 'verweigert'}.`);
}

/** === Propulsion Management === */
function normalizePropulsion(propulsion = {}) {
    const safeArray = value => (Array.isArray(value) ? value : []);
    const toNumber = (value, fallback = 0) => {
        const parsed = Number.parseFloat(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    };
    const thrusters = safeArray(propulsion.thrusters).map((thruster, index) => ({
        id: thruster.id ?? `thruster-${index + 1}`,
        name: thruster.name ?? `Triebwerk ${index + 1}`,
        status: (thruster.status ?? 'online').toLowerCase(),
        thrust: toNumber(thruster.thrust ?? thruster.output),
        thrustUnit: thruster.thrustUnit ?? thruster.unit ?? 'MN',
        temperature: toNumber(thruster.temperature ?? thruster.temp),
        temperatureUnit: thruster.temperatureUnit ?? thruster.tempUnit ?? 'K',
        vibration: toNumber(thruster.vibration ?? thruster.vibe ?? 0),
        note: thruster.note ?? ''
    }));
    const fuel = propulsion.fuel
        ? {
            main: toNumber(propulsion.fuel.main ?? propulsion.fuel.level),
            reserve: toNumber(propulsion.fuel.reserve ?? propulsion.fuel.reserves),
            consumption: toNumber(propulsion.fuel.consumption ?? propulsion.fuel.rate),
            reserveEta: propulsion.fuel.reserveEta ?? propulsion.fuel.autonomy ?? ''
        }
        : null;
    const rcs = propulsion.rcs
        ? {
            status: propulsion.rcs.status ?? 'nominal',
            balance: propulsion.rcs.balance ?? propulsion.rcs.offset ?? '',
            drift: propulsion.rcs.drift ?? '',
            note: propulsion.rcs.note ?? ''
        }
        : null;
    const profiles = safeArray(propulsion.profiles).map((profile, index) => ({
        id: profile.id ?? `profile-${index + 1}`,
        name: profile.name ?? `Profil ${index + 1}`,
        thrust: toNumber(profile.thrust),
        rcsUsage: toNumber(profile.rcsUsage ?? profile.rcs),
        description: profile.description ?? '',
        status: (profile.status ?? 'ready').toLowerCase(),
        active: Boolean(profile.active)
    }));
    const maneuvers = safeArray(propulsion.maneuvers).map((entry, index) => ({
        id: entry.id ?? `maneuver-${index + 1}`,
        title: entry.title ?? entry.name ?? `Manöver ${index + 1}`,
        window: entry.window ?? entry.time ?? '',
        status: (entry.status ?? 'planned').toLowerCase(),
        assigned: entry.assigned ?? entry.team ?? '',
        note: entry.note ?? ''
    }));
    const alerts = safeArray(propulsion.alerts).map((alert, index) => ({
        id: alert.id ?? `propulsion-alert-${index + 1}`,
        message: alert.message ?? alert.text ?? '',
        severity: (alert.severity ?? 'info').toLowerCase()
    }));
    const activeProfileId = propulsion.activeProfileId
        ?? profiles.find(profile => profile.active)?.id
        ?? null;
    return { thrusters, fuel, rcs, profiles, maneuvers, alerts, activeProfileId };
}

function renderPropulsion() {
    if (!state.propulsion) {
        state.propulsion = normalizePropulsion();
    }
    renderPropulsionThrusters();
    renderPropulsionFuel();
    renderPropulsionProfiles();
    renderPropulsionManeuvers();
    renderPropulsionAlerts();
    updatePropulsionStatus();
}

function renderPropulsionThrusters() {
    if (!elements.propulsionThrusterTable) return;
    const propulsion = state.propulsion ?? { thrusters: [] };
    elements.propulsionThrusterTable.innerHTML = '';
    if (!propulsion.thrusters.length) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="5" class="empty-placeholder">Keine Triebwerksdaten.</td>';
        elements.propulsionThrusterTable.appendChild(row);
        return;
    }
    propulsion.thrusters.forEach(thruster => {
        const row = document.createElement('tr');
        const thrustDisplay = Number.isFinite(thruster.thrust) && thruster.thrust !== 0
            ? `${thruster.thrust.toFixed(1)} ${thruster.thrustUnit}`
            : '—';
        const tempDisplay = Number.isFinite(thruster.temperature) && thruster.temperature !== 0
            ? `${Math.round(thruster.temperature)} ${thruster.temperatureUnit}`
            : '—';
        const vibrationDisplay = Number.isFinite(thruster.vibration) && thruster.vibration !== 0
            ? `${thruster.vibration.toFixed(1)} mm/s`
            : '—';
        row.innerHTML = `
            <td>
                <strong>${thruster.name}</strong>
                ${thruster.note ? `<small>${thruster.note}</small>` : ''}
            </td>
            <td><span class="status-pill ${statusClass(thruster.status)}">${translateStatus(thruster.status)}</span></td>
            <td>${thrustDisplay}</td>
            <td>${tempDisplay}</td>
            <td>${vibrationDisplay}</td>
        `;
        elements.propulsionThrusterTable.appendChild(row);
    });
}

function renderPropulsionFuel() {
    if (elements.propulsionFuel) {
        const propulsion = state.propulsion ?? { fuel: null };
        const { fuel } = propulsion;
        if (!fuel) {
            elements.propulsionFuel.innerHTML = '<p class="empty-placeholder">Keine Treibstoffdaten.</p>';
        } else {
            elements.propulsionFuel.innerHTML = `
                <strong>Treibstoffreserven</strong>
                <span><span>Haupttanks</span><span>${fuel.main.toFixed(1)}%</span></span>
                <span><span>Reserve</span><span>${fuel.reserve.toFixed(1)}%</span></span>
                <span><span>Verbrauch</span><span>${fuel.consumption.toFixed(2)} kg/s</span></span>
                ${fuel.reserveEta ? `<span><span>Autonomie</span><span>${fuel.reserveEta}</span></span>` : ''}
            `;
        }
    }
    if (elements.propulsionRcs) {
        const propulsion = state.propulsion ?? { rcs: null };
        const { rcs } = propulsion;
        if (!rcs) {
            elements.propulsionRcs.innerHTML = '<p class="empty-placeholder">Keine RCS-Daten.</p>';
        } else {
            elements.propulsionRcs.innerHTML = `
                <strong>RCS-Kalibrierung</strong>
                <span><span>Status</span><span>${rcs.status}</span></span>
                ${rcs.balance ? `<span><span>Balance</span><span>${rcs.balance}</span></span>` : ''}
                ${rcs.drift ? `<span><span>Drift</span><span>${rcs.drift}</span></span>` : ''}
                ${rcs.note ? `<span>${rcs.note}</span>` : ''}
            `;
        }
    }
}

function renderPropulsionProfiles() {
    if (!elements.propulsionProfileList) return;
    const propulsion = state.propulsion ?? { profiles: [], activeProfileId: null };
    elements.propulsionProfileList.innerHTML = '';
    if (!propulsion.profiles.length) {
        elements.propulsionProfileList.innerHTML = '<li class="empty-placeholder">Keine Profile definiert.</li>';
        return;
    }
    propulsion.profiles.forEach(profile => {
        const li = document.createElement('li');
        const active = propulsion.activeProfileId === profile.id;
        li.className = `task-item${active ? ' propulsion-profile-active' : ''}`;
        li.innerHTML = `
            <div>
                <strong>${profile.name}</strong>
                <small>Schub ${Math.round(profile.thrust)}% · RCS ${Math.round(profile.rcsUsage)}%</small>
                ${profile.description ? `<p>${profile.description}</p>` : ''}
            </div>
            <div class="task-actions">
                ${active ? '<span class="status-pill status-online">Aktiv</span>' : `<button class="mini-button" data-action="propulsion-set-profile" data-profile="${profile.id}">Aktivieren</button>`}
            </div>
        `;
        elements.propulsionProfileList.appendChild(li);
    });
}

function renderPropulsionManeuvers() {
    if (!elements.propulsionManeuverList) return;
    const propulsion = state.propulsion ?? { maneuvers: [] };
    elements.propulsionManeuverList.innerHTML = '';
    if (!propulsion.maneuvers.length) {
        elements.propulsionManeuverList.innerHTML = '<li class="empty-placeholder">Keine Manöver geplant.</li>';
        return;
    }
    propulsion.maneuvers.forEach(maneuver => {
        const li = document.createElement('li');
        li.className = 'task-item';
        li.innerHTML = `
            <div>
                <strong>${maneuver.title}</strong>
                <small>${maneuver.window || 'Fenster offen'}${maneuver.assigned ? ` · ${maneuver.assigned}` : ''}</small>
                ${maneuver.note ? `<p>${maneuver.note}</p>` : ''}
            </div>
            <div class="task-actions">
                ${maneuver.status === 'done'
                    ? '<span class="status-pill status-online">Abgeschlossen</span>'
                    : `<button class="mini-button" data-action="propulsion-complete-maneuver" data-maneuver="${maneuver.id}">Erledigt</button>`}
            </div>
        `;
        elements.propulsionManeuverList.appendChild(li);
    });
}

function renderPropulsionAlerts() {
    if (!elements.propulsionAlertList) return;
    const propulsion = state.propulsion ?? { alerts: [] };
    elements.propulsionAlertList.innerHTML = '';
    if (!propulsion.alerts.length) {
        elements.propulsionAlertList.innerHTML = '<li class="empty-placeholder">Keine Hinweise.</li>';
        return;
    }
    propulsion.alerts.forEach(alert => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="status-pill ${alertSeverityClass(alert.severity)}">${alertSeverityLabel(alert.severity)}</span>
            <span>${alert.message}</span>
        `;
        elements.propulsionAlertList.appendChild(li);
    });
}

function alertSeverityClass(severity) {
    if (severity === 'critical') return 'status-critical';
    if (severity === 'warning' || severity === 'high') return 'status-warning';
    return 'status-idle';
}

function alertSeverityLabel(severity) {
    const labelMap = {
        critical: 'KRITISCH',
        warning: 'WARNUNG',
        high: 'WARNUNG',
        info: 'INFO'
    };
    return labelMap[severity] ?? severity?.toUpperCase() ?? 'INFO';
}

function updatePropulsionStatus() {
    if (!elements.propulsionStatus) return;
    const propulsion = state.propulsion ?? { thrusters: [], alerts: [] };
    if (!propulsion.thrusters.length && !propulsion.alerts.length) {
        elements.propulsionStatus.textContent = 'Keine Daten';
        elements.propulsionStatus.className = 'status-pill status-idle';
        return;
    }
    const hasCritical = propulsion.alerts.some(alert => alert.severity === 'critical')
        || propulsion.thrusters.some(thruster => ['critical', 'offline'].includes(thruster.status));
    const hasWarning = propulsion.alerts.some(alert => alert.severity === 'warning' || alert.severity === 'high')
        || propulsion.thrusters.some(thruster => thruster.status === 'warning');
    if (hasCritical) {
        elements.propulsionStatus.textContent = 'Alarm';
        elements.propulsionStatus.className = 'status-pill status-critical';
    } else if (hasWarning) {
        elements.propulsionStatus.textContent = 'Überwachen';
        elements.propulsionStatus.className = 'status-pill status-warning';
    } else {
        elements.propulsionStatus.textContent = 'Nominal';
        elements.propulsionStatus.className = 'status-pill status-online';
    }
}

function handlePropulsionClick(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const propulsion = state.propulsion ?? normalizePropulsion();
    if (button.dataset.action === 'propulsion-set-profile') {
        const profileId = button.dataset.profile;
        const updatedProfiles = propulsion.profiles.map(profile => ({
            ...profile,
            active: profile.id === profileId
        }));
        const activeProfile = updatedProfiles.find(profile => profile.id === profileId);
        kernel.setState('propulsion', { ...propulsion, profiles: updatedProfiles, activeProfileId: profileId });
        renderPropulsion();
        if (activeProfile) {
            addLog('propulsion', `Profil ${activeProfile.name} aktiviert.`);
        }
    } else if (button.dataset.action === 'propulsion-complete-maneuver') {
        const maneuverId = button.dataset.maneuver;
        const updatedManeuvers = propulsion.maneuvers.map(maneuver => maneuver.id === maneuverId
            ? { ...maneuver, status: 'done' }
            : maneuver
        );
        const maneuver = updatedManeuvers.find(entry => entry.id === maneuverId);
        kernel.setState('propulsion', { ...propulsion, maneuvers: updatedManeuvers });
        renderPropulsion();
        if (maneuver) {
            addLog('propulsion', `Manöver ${maneuver.title} abgeschlossen.`);
        }
    }
}

/** === Thermal Control === */
function normalizeThermal(thermal = {}) {
    const safeArray = value => (Array.isArray(value) ? value : []);
    const toNumber = (value, fallback = 0) => {
        const parsed = Number.parseFloat(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    };
    const heatLoads = safeArray(thermal.heatLoads).map((entry, index) => ({
        id: entry.id ?? `heat-${index + 1}`,
        source: entry.source ?? entry.name ?? `Quelle ${index + 1}`,
        load: toNumber(entry.load ?? entry.value),
        unit: entry.unit ?? '%',
        status: (entry.status ?? 'stable').toLowerCase(),
        mitigation: entry.mitigation ?? entry.action ?? ''
    }));
    const radiators = safeArray(thermal.radiators).map((entry, index) => ({
        id: entry.id ?? `radiator-${index + 1}`,
        name: entry.name ?? `Segment ${index + 1}`,
        status: (entry.status ?? 'deployed').toLowerCase(),
        output: toNumber(entry.output ?? entry.efficiency),
        angle: entry.angle ?? entry.orientation ?? '',
        note: entry.note ?? ''
    }));
    const cooling = safeArray(thermal.cooling).map((entry, index) => ({
        id: entry.id ?? `cooling-${index + 1}`,
        description: entry.description ?? entry.task ?? `Maßnahme ${index + 1}`,
        status: (entry.status ?? 'pending').toLowerCase(),
        eta: entry.eta ?? '',
        owner: entry.owner ?? entry.team ?? '',
        note: entry.note ?? ''
    }));
    const signature = thermal.signature
        ? {
            level: thermal.signature.level ?? thermal.signature.status ?? 'Moderate',
            target: thermal.signature.target ?? '',
            note: thermal.signature.note ?? '',
            mode: thermal.signature.mode ?? ''
        }
        : null;
    return { heatLoads, radiators, cooling, signature };
}

function renderThermal() {
    if (!state.thermal) {
        state.thermal = normalizeThermal();
    }
    renderThermalLoads();
    renderThermalRadiators();
    renderThermalCooling();
    renderThermalSignature();
    updateThermalStatus();
}

function renderThermalLoads() {
    if (!elements.thermalLoadTable) return;
    const thermal = state.thermal ?? { heatLoads: [] };
    elements.thermalLoadTable.innerHTML = '';
    if (!thermal.heatLoads.length) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="4" class="empty-placeholder">Keine Wärmedaten.</td>';
        elements.thermalLoadTable.appendChild(row);
        return;
    }
    thermal.heatLoads.forEach(load => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${load.source}</td>
            <td>${load.load.toFixed(1)} ${load.unit}</td>
            <td><span class="status-pill ${thermalStatusClass(load.status)}">${thermalStatusLabel(load.status)}</span></td>
            <td>${load.mitigation || '–'}</td>
        `;
        elements.thermalLoadTable.appendChild(row);
    });
}

function thermalStatusClass(status) {
    if (['critical', 'offline'].includes(status)) return 'status-critical';
    if (['high', 'warning', 'monitor', 'watch'].includes(status)) return 'status-warning';
    return 'status-online';
}

function thermalStatusLabel(status) {
    const map = {
        critical: 'Kritisch',
        high: 'Hoch',
        warning: 'Warnung',
        monitor: 'Überwachung',
        watch: 'Überwachung',
        stable: 'Stabil',
        normal: 'Nominal',
        online: 'Stabil'
    };
    return map[status] ?? status;
}

function renderThermalRadiators() {
    if (!elements.thermalRadiatorGrid) return;
    const thermal = state.thermal ?? { radiators: [] };
    elements.thermalRadiatorGrid.innerHTML = '';
    if (!thermal.radiators.length) {
        elements.thermalRadiatorGrid.innerHTML = '<p class="empty-placeholder">Keine Radiatorsegmente verfügbar.</p>';
        return;
    }
    thermal.radiators.forEach(radiator => {
        const card = document.createElement('div');
        card.className = 'radiator-card';
        card.innerHTML = `
            <strong>${radiator.name}</strong>
            <span>Status: <span class="status-pill ${statusClass(radiator.status)}">${translateStatus(radiator.status)}</span></span>
            <span>Abstrahlung: ${Math.round(radiator.output)}%</span>
            ${radiator.angle ? `<span>Winkel: ${radiator.angle}</span>` : ''}
            ${radiator.note ? `<small>${radiator.note}</small>` : ''}
        `;
        elements.thermalRadiatorGrid.appendChild(card);
    });
}

function renderThermalCooling() {
    if (!elements.thermalCoolingList) return;
    const thermal = state.thermal ?? { cooling: [] };
    elements.thermalCoolingList.innerHTML = '';
    if (!thermal.cooling.length) {
        elements.thermalCoolingList.innerHTML = '<li class="empty-placeholder">Keine Maßnahmen offen.</li>';
        return;
    }
    thermal.cooling.forEach(task => {
        const li = document.createElement('li');
        li.className = 'task-item';
        li.innerHTML = `
            <div>
                <strong>${task.description}</strong>
                <small>${task.owner || 'Engineering'}${task.eta ? ` · ${task.eta}` : ''}</small>
                ${task.note ? `<p>${task.note}</p>` : ''}
            </div>
            <div class="task-actions">
                ${task.status === 'done'
                    ? '<span class="status-pill status-online">Abgeschlossen</span>'
                    : `<button class="mini-button" data-action="thermal-complete" data-cooling="${task.id}">Fertig</button>`}
            </div>
        `;
        elements.thermalCoolingList.appendChild(li);
    });
}

function renderThermalSignature() {
    if (!elements.thermalSignature) return;
    const thermal = state.thermal ?? { signature: null };
    if (!thermal.signature) {
        elements.thermalSignature.innerHTML = '<p class="empty-placeholder">Keine Signaturdaten.</p>';
        return;
    }
    const { signature } = thermal;
    elements.thermalSignature.innerHTML = `
        <strong>Signaturmanagement</strong>
        <span><span>Level</span><span>${signature.level}</span></span>
        ${signature.target ? `<span><span>Ziel</span><span>${signature.target}</span></span>` : ''}
        ${signature.mode ? `<span><span>Modus</span><span>${signature.mode}</span></span>` : ''}
        ${signature.note ? `<span>${signature.note}</span>` : ''}
    `;
}

function updateThermalStatus() {
    if (!elements.thermalStatus) return;
    const thermal = state.thermal ?? { heatLoads: [], radiators: [] };
    const hasCritical = thermal.heatLoads.some(load => ['critical'].includes(load.status))
        || thermal.radiators.some(radiator => ['critical', 'offline'].includes(radiator.status));
    const hasWarning = thermal.heatLoads.some(load => ['high', 'warning', 'monitor', 'watch'].includes(load.status))
        || thermal.radiators.some(radiator => radiator.status === 'warning');
    if (hasCritical) {
        elements.thermalStatus.textContent = 'Überhitzt';
        elements.thermalStatus.className = 'status-pill status-critical';
    } else if (hasWarning) {
        elements.thermalStatus.textContent = 'Überwachen';
        elements.thermalStatus.className = 'status-pill status-warning';
    } else {
        elements.thermalStatus.textContent = 'Stabil';
        elements.thermalStatus.className = 'status-pill status-online';
    }
}

function handleThermalClick(event) {
    const button = event.target.closest('button[data-action="thermal-complete"]');
    if (!button) return;
    const coolingId = button.dataset.cooling;
    if (!coolingId) return;
    const thermal = state.thermal ?? normalizeThermal();
    const updatedCooling = thermal.cooling.map(task => task.id === coolingId ? { ...task, status: 'done' } : task);
    kernel.setState('thermal', { ...thermal, cooling: updatedCooling });
    renderThermal();
    const task = updatedCooling.find(entry => entry.id === coolingId);
    if (task) {
        addLog('thermal', `Kühlmaßnahme ${task.description} abgeschlossen.`);
    }
}

/** === FTL Jump Orchestrator === */
function normalizeFtl(ftl = {}) {
    const safeArray = value => (Array.isArray(value) ? value : []);
    const toNumber = (value, fallback = 0) => {
        const parsed = Number.parseFloat(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    };
    const capacitor = ftl.capacitor
        ? {
            charge: toNumber(ftl.capacitor.charge ?? ftl.capacitor.level),
            target: toNumber(ftl.capacitor.target ?? 100) || 100,
            eta: ftl.capacitor.eta ?? ''
        }
        : null;
    const window = ftl.window
        ? {
            opensIn: ftl.window.opensIn ?? ftl.window.open ?? '',
            duration: ftl.window.duration ?? '',
            vector: ftl.window.vector ?? ''
        }
        : null;
    const checklist = safeArray(ftl.checklist).map((step, index) => ({
        id: step.id ?? `ftl-step-${index + 1}`,
        label: step.label ?? step.name ?? `Schritt ${index + 1}`,
        completed: Boolean(step.completed),
        optional: Boolean(step.optional),
        owner: step.owner ?? step.team ?? ''
    }));
    const abort = safeArray(ftl.abort).map((entry, index) => ({
        id: entry.id ?? `ftl-abort-${index + 1}`,
        label: entry.label ?? entry.name ?? `Protokoll ${index + 1}`,
        status: (entry.status ?? 'ready').toLowerCase(),
        note: entry.note ?? ''
    }));
    return { capacitor, window, checklist, abort };
}

function renderFtl() {
    if (!state.ftl) {
        state.ftl = normalizeFtl();
    }
    renderFtlCharge();
    renderFtlChecklist();
    renderFtlAbort();
    updateFtlStatus();
}

function renderFtlCharge() {
    if (!elements.ftlChargeBar) return;
    const ftl = state.ftl ?? { capacitor: null, window: null };
    if (!ftl.capacitor) {
        elements.ftlChargeBar.style.width = '0%';
        if (elements.ftlChargeLabel) elements.ftlChargeLabel.textContent = '--';
    } else {
        const target = ftl.capacitor.target > 0 ? ftl.capacitor.target : 100;
        const progress = clamp((ftl.capacitor.charge / target) * 100, 0, 100);
        elements.ftlChargeBar.style.width = `${progress}%`;
        if (elements.ftlChargeLabel) {
            const etaPart = ftl.capacitor.eta ? ` (ETA ${ftl.capacitor.eta})` : '';
            elements.ftlChargeLabel.textContent = `${Math.round(ftl.capacitor.charge)}%${etaPart}`;
        }
    }
    if (elements.ftlWindowInfo) {
        if (!ftl.window) {
            elements.ftlWindowInfo.innerHTML = '<p class="empty-placeholder">Kein Sprungfenster berechnet.</p>';
        } else {
            elements.ftlWindowInfo.innerHTML = `
                <span><strong>Vector</strong> ${ftl.window.vector || '—'}</span>
                <span><strong>Öffnet in</strong> ${ftl.window.opensIn || '—'}</span>
                <span><strong>Dauer</strong> ${ftl.window.duration || '—'}</span>
            `;
        }
    }
}

function renderFtlChecklist() {
    if (!elements.ftlChecklist) return;
    const ftl = state.ftl ?? { checklist: [] };
    elements.ftlChecklist.innerHTML = '';
    if (!ftl.checklist.length) {
        elements.ftlChecklist.innerHTML = '<li class="empty-placeholder">Keine Checkliste hinterlegt.</li>';
        return;
    }
    ftl.checklist.forEach(step => {
        const li = document.createElement('li');
        li.innerHTML = `
            <label>
                <input type="checkbox" data-action="ftl-toggle-step" data-step="${step.id}" ${step.completed ? 'checked' : ''}>
                <span>${step.label}${step.optional ? ' (optional)' : ''}${step.owner ? ` – ${step.owner}` : ''}</span>
            </label>
        `;
        elements.ftlChecklist.appendChild(li);
    });
}

function renderFtlAbort() {
    if (!elements.ftlAbortList) return;
    const ftl = state.ftl ?? { abort: [] };
    elements.ftlAbortList.innerHTML = '';
    if (!ftl.abort.length) {
        elements.ftlAbortList.innerHTML = '<li class="empty-placeholder">Keine Abbruchprotokolle.</li>';
        return;
    }
    ftl.abort.forEach(entry => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="status-pill ${alertSeverityClass(entry.status)}">${alertSeverityLabel(entry.status)}</span>
            <span>${entry.label}</span>
            ${entry.note ? `<small>${entry.note}</small>` : ''}
        `;
        elements.ftlAbortList.appendChild(li);
    });
}

function updateFtlStatus() {
    if (!elements.ftlStatus) return;
    const ftl = state.ftl ?? { checklist: [], abort: [], capacitor: null };
    const requiredDone = ftl.checklist.filter(step => !step.optional).every(step => step.completed);
    const abortCritical = ftl.abort.some(entry => ['critical', 'fault', 'blocked'].includes(entry.status));
    let chargeReady = false;
    if (ftl.capacitor) {
        const target = ftl.capacitor.target > 0 ? ftl.capacitor.target : 100;
        chargeReady = ftl.capacitor.charge >= target;
    }
    if (abortCritical) {
        elements.ftlStatus.textContent = 'Blockiert';
        elements.ftlStatus.className = 'status-pill status-critical';
    } else if (requiredDone && chargeReady) {
        elements.ftlStatus.textContent = 'Bereit';
        elements.ftlStatus.className = 'status-pill status-online';
    } else {
        elements.ftlStatus.textContent = 'Ladevorgang';
        elements.ftlStatus.className = 'status-pill status-warning';
    }
}

function handleFtlChecklistToggle(event) {
    const checkbox = event.target.closest('input[type="checkbox"][data-action="ftl-toggle-step"]');
    if (!checkbox) return;
    const stepId = checkbox.dataset.step;
    const ftl = state.ftl ?? normalizeFtl();
    const checklist = ftl.checklist.map(step => step.id === stepId ? { ...step, completed: checkbox.checked } : step);
    kernel.setState('ftl', { ...ftl, checklist });
    renderFtl();
    const step = checklist.find(entry => entry.id === stepId);
    if (step) {
        addLog('ftl', `Checkliste: ${step.label} ${checkbox.checked ? 'bestätigt' : 'zurückgesetzt'}.`);
    }
}

/** === Stations / Consoles === */
function normalizeStations(stations = []) {
    return Array.isArray(stations)
        ? stations.map((station, index) => ({
            id: station.id ?? `station-${index + 1}`,
            role: station.role ?? `Station ${index + 1}`,
            focus: station.focus ?? [],
            status: station.status ?? 'bereit',
            readiness: station.readiness ?? 0,
            crew: station.crew ?? ''
        }))
        : [];
}

function renderStations() {
    if (!elements.stationsReadiness) return;
    elements.stationsReadiness.innerHTML = '';
    if (state.stations.length === 0) {
        const div = document.createElement('div');
        div.className = 'empty-placeholder';
        div.textContent = 'Keine Stationen konfiguriert.';
        elements.stationsReadiness.appendChild(div);
        return;
    }
    state.stations.forEach(station => {
        const card = document.createElement('article');
        card.className = 'station-card';
        card.dataset.stationId = station.id;
        card.innerHTML = `
            <h4>${station.role}</h4>
            <p>${station.focus.join(', ')}</p>
            <div class="progress-bar small"><div class="progress" style="width:${station.readiness}%"></div></div>
            <footer>
                <span>${station.crew || 'Unbesetzt'}</span>
                <button class="mini-button" data-action="station-advance" data-station="${station.id}">+10%</button>
            </footer>
        `;
        elements.stationsReadiness.appendChild(card);
    });
    updateStationsStatus();
}

function updateStationsStatus() {
    if (!elements.stationsStatus) return;
    const ready = state.stations.filter(station => station.readiness >= 90).length;
    if (ready === state.stations.length && ready > 0) {
        elements.stationsStatus.textContent = 'Alle bereit';
        elements.stationsStatus.className = 'status-pill status-online';
    } else {
        elements.stationsStatus.textContent = `${ready}/${state.stations.length} bereit`;
        elements.stationsStatus.className = ready > 0 ? 'status-pill status-warning' : 'status-pill status-idle';
    }
}

function handleStationClick(event) {
    const button = event.target.closest('button[data-action="station-advance"]');
    if (!button) return;
    const stationId = button.dataset.station;
    if (!stationId) return;
    const updatedStations = state.stations.map(station => station.id === stationId
        ? { ...station, readiness: Math.min(100, station.readiness + 10) }
        : station);
    kernel.setState('stations', updatedStations);
    renderStations();
}

/** === Checklisten & Prozeduren === */
function normalizeProcedures(procedures = []) {
    return Array.isArray(procedures)
        ? procedures.map((proc, index) => ({
            id: proc.id ?? `proc-${index + 1}`,
            name: proc.name ?? `Prozedur ${index + 1}`,
            steps: Array.isArray(proc.steps)
                ? proc.steps.map((step, stepIndex) => ({
                    id: step.id ?? `step-${index + 1}-${stepIndex + 1}`,
                    label: step.label ?? `Schritt ${stepIndex + 1}`,
                    completed: Boolean(step.completed),
                    optional: Boolean(step.optional)
                }))
                : []
        }))
        : [];
}

function renderProcedures() {
    if (!elements.procedureSelect || !elements.procedureSteps) return;
    elements.procedureSelect.innerHTML = '';
    if (state.procedures.length === 0) {
        const option = document.createElement('option');
        option.textContent = 'Keine Checklisten';
        elements.procedureSelect.appendChild(option);
        elements.procedureSteps.innerHTML = '<li class="empty-placeholder">Keine Checklisten verfügbar.</li>';
        if (elements.procedureProgressBar) elements.procedureProgressBar.style.width = '0%';
        if (elements.procedureProgressLabel) elements.procedureProgressLabel.textContent = '0 / 0';
        return;
    }
    state.procedures.forEach((proc, index) => {
        const option = document.createElement('option');
        option.value = proc.id;
        option.textContent = proc.name;
        if (index === 0) option.selected = true;
        elements.procedureSelect.appendChild(option);
    });
    renderProcedureSteps(state.procedures[0].id);
}

function renderProcedureSteps(procedureId) {
    if (!elements.procedureSteps) return;
    const procedure = state.procedures.find(proc => proc.id === procedureId);
    if (!procedure) {
        elements.procedureSteps.innerHTML = '<li class="empty-placeholder">Unbekannte Checkliste.</li>';
        if (elements.procedureProgressBar) elements.procedureProgressBar.style.width = '0%';
        if (elements.procedureProgressLabel) elements.procedureProgressLabel.textContent = '0 / 0';
        return;
    }
    elements.procedureSteps.innerHTML = '';
    procedure.steps.forEach(step => {
        const li = document.createElement('li');
        li.innerHTML = `
            <label>
                <input type="checkbox" data-action="procedure-toggle" data-procedure="${procedure.id}" data-step="${step.id}" ${step.completed ? 'checked' : ''}>
                <span>${step.label}${step.optional ? ' (optional)' : ''}</span>
            </label>
        `;
        elements.procedureSteps.appendChild(li);
    });
    updateProcedureProgress(procedure);
}

function updateProcedureProgress(procedure) {
    if (!procedure) return;
    const total = procedure.steps.length;
    const completed = procedure.steps.filter(step => step.completed).length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    if (elements.procedureProgressBar) {
        elements.procedureProgressBar.style.width = `${progress}%`;
    }
    if (elements.procedureProgressLabel) {
        elements.procedureProgressLabel.textContent = `${completed} / ${total}`;
    }
    if (elements.procedureStatus) {
        if (completed === total && total > 0) {
            elements.procedureStatus.textContent = 'Abgeschlossen';
            elements.procedureStatus.className = 'status-pill status-online';
        } else {
            elements.procedureStatus.textContent = 'Laufend';
            elements.procedureStatus.className = 'status-pill status-warning';
        }
    }
}

function handleProcedureChange(event) {
    renderProcedureSteps(event.target.value);
}

function handleProcedureToggle(event) {
    const checkbox = event.target.closest('input[type="checkbox"][data-action="procedure-toggle"]');
    if (!checkbox) return;
    const procedureId = checkbox.dataset.procedure;
    const stepId = checkbox.dataset.step;
    const procedures = state.procedures.map(proc => {
        if (proc.id !== procedureId) return proc;
        const steps = proc.steps.map(step => step.id === stepId ? { ...step, completed: checkbox.checked } : step);
        return { ...proc, steps };
    });
    kernel.setState('procedures', procedures);
    const current = procedures.find(proc => proc.id === procedureId);
    updateProcedureProgress(current);
}

/** === Briefing & Debriefing === */
function normalizeBriefing(briefing = {}) {
    const markers = Array.isArray(briefing.markers)
        ? briefing.markers.map((marker, index) => ({
            id: marker.id ?? `marker-${index + 1}`,
            label: marker.label ?? `Marker ${index + 1}`,
            status: marker.status ?? 'pending'
        }))
        : [];
    const report = Array.isArray(briefing.report)
        ? briefing.report.map((entry, index) => ({
            id: entry.id ?? `report-${index + 1}`,
            title: entry.title ?? `Entscheidung ${index + 1}`,
            outcome: entry.outcome ?? '',
            decision: entry.decision ?? ''
        }))
        : [];
    const summary = typeof briefing.summary === 'string' ? briefing.summary : '';
    return { markers, report, summary };
}

function renderBriefing() {
    renderBriefingMarkers();
    renderDebriefingSummary();
    updateBriefingStatus();
}

function renderBriefingMarkers() {
    if (!elements.briefingMarkers) return;
    elements.briefingMarkers.innerHTML = '';
    if (!state.briefing.markers || state.briefing.markers.length === 0) {
        const li = document.createElement('li');
        li.className = 'empty-placeholder';
        li.textContent = 'Keine Marker aktiv.';
        elements.briefingMarkers.appendChild(li);
        return;
    }
    state.briefing.markers.forEach(marker => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${marker.label}</strong><span>${marker.status}</span>`;
        elements.briefingMarkers.appendChild(li);
    });
}

function renderDebriefingSummary() {
    if (!elements.debriefingSummary) return;
    const { report, summary } = state.briefing ?? { report: [], summary: '' };
    if (!report.length && !summary) {
        elements.debriefingSummary.innerHTML = '<p class="empty-placeholder">Noch keine Daten gesammelt.</p>';
        return;
    }
    const entries = report.map(entry => `
        <div>
            <strong>${entry.title}</strong>
            <p>Entscheidung: ${entry.decision || 'n/a'}</p>
            <p>Ergebnis: ${entry.outcome || 'pending'}</p>
        </div>
    `).join('');
    elements.debriefingSummary.innerHTML = `${summary ? `<p>${summary}</p>` : ''}${entries}`;
}

function updateBriefingStatus() {
    if (!elements.briefingStatus) return;
    const pending = state.objectives.filter(obj => !obj.completed).length;
    if (pending === 0 && state.objectives.length > 0) {
        elements.briefingStatus.textContent = 'Mission erfüllt';
        elements.briefingStatus.className = 'status-pill status-online';
    } else {
        elements.briefingStatus.textContent = `${pending} Ziele offen`;
        elements.briefingStatus.className = pending > 0 ? 'status-pill status-warning' : 'status-pill status-idle';
    }
}

/** === Szenario-Regie & Encounter === */
function normalizeScenarioDirector(director = {}) {
    const phases = Array.isArray(director.phases)
        ? director.phases.map((phase, index) => ({
            id: phase.id ?? `phase-${index + 1}`,
            name: phase.name ?? `Phase ${index + 1}`,
            status: phase.status ?? (index === 0 ? 'active' : 'pending'),
            trigger: phase.trigger ?? null
        }))
        : [];
    const triggers = Array.isArray(director.triggers)
        ? director.triggers.map((trigger, index) => ({
            id: trigger.id ?? `trigger-${index + 1}`,
            name: trigger.name ?? `Trigger ${index + 1}`,
            condition: trigger.condition ?? { type: 'manual' },
            actions: Array.isArray(trigger.actions) ? trigger.actions : [],
            status: trigger.status ?? 'armed',
            auto: trigger.auto ?? false
        }))
        : [];
    return { phases, triggers };
}

function normalizeEncounters(encounters = []) {
    return Array.isArray(encounters)
        ? encounters.map((encounter, index) => ({
            id: encounter.id ?? `encounter-${index + 1}`,
            callsign: encounter.callsign ?? `Einheit ${index + 1}`,
            behavior: encounter.behavior ?? 'neutral',
            morale: encounter.morale ?? 'hoch',
            target: encounter.target ?? '',
            contactId: encounter.contactId ?? null,
            status: encounter.status ?? 'idle'
        }))
        : [];
}

function renderScenarioDirector() {
    renderScenarioPhases();
    renderScenarioTriggers();
    renderScenarioEncounters();
}

function renderScenarioPhases() {
    if (!elements.scenarioPhaseList) return;
    elements.scenarioPhaseList.innerHTML = '';
    if (!state.scenario.phases || state.scenario.phases.length === 0) {
        const li = document.createElement('li');
        li.className = 'empty-placeholder';
        li.textContent = 'Keine Phasen definiert.';
        elements.scenarioPhaseList.appendChild(li);
        return;
    }
    state.scenario.phases.forEach(phase => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${phase.name}</strong><span>${phase.status}</span>`;
        if (phase.status === 'active') li.classList.add('warning');
        elements.scenarioPhaseList.appendChild(li);
    });
    updateScenarioPhaseStatus();
}

function renderScenarioTriggers() {
    if (!elements.scenarioTriggerList) return;
    elements.scenarioTriggerList.innerHTML = '';
    if (!state.scenario.triggers || state.scenario.triggers.length === 0) {
        const li = document.createElement('li');
        li.className = 'empty-placeholder';
        li.textContent = 'Keine Trigger definiert.';
        elements.scenarioTriggerList.appendChild(li);
        return;
    }
    state.scenario.triggers.forEach(trigger => {
        const li = document.createElement('li');
        li.dataset.triggerId = trigger.id;
        li.innerHTML = `
            <span>${trigger.name}</span>
            <strong>${trigger.status}</strong>
            <button class="mini-button" data-action="scenario-fire" data-trigger="${trigger.id}" ${trigger.status === 'fired' ? 'disabled' : ''}>Auslösen</button>
        `;
        if (trigger.status === 'fired') li.classList.add('completed');
        elements.scenarioTriggerList.appendChild(li);
    });
}

function renderScenarioEncounters() {
    if (!elements.scenarioEncounterList) return;
    elements.scenarioEncounterList.innerHTML = '';
    if (!state.encounters || state.encounters.length === 0) {
        const li = document.createElement('li');
        li.className = 'empty-placeholder';
        li.textContent = 'Keine aktiven Encounter.';
        elements.scenarioEncounterList.appendChild(li);
        return;
    }
    state.encounters.forEach(encounter => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${encounter.callsign}</span><strong>${encounter.behavior}</strong>`;
        elements.scenarioEncounterList.appendChild(li);
    });
}

function updateScenarioPhaseStatus() {
    if (!elements.scenarioPhaseStatus) return;
    const activePhase = state.scenario.phases.find(phase => phase.status === 'active');
    if (activePhase) {
        elements.scenarioPhaseStatus.textContent = activePhase.name;
        elements.scenarioPhaseStatus.className = 'status-pill status-warning';
    } else {
        elements.scenarioPhaseStatus.textContent = 'Inaktiv';
        elements.scenarioPhaseStatus.className = 'status-pill status-idle';
    }
}

function handleScenarioTriggerClick(event) {
    const button = event.target.closest('button[data-action="scenario-fire"]');
    if (!button) return;
    const triggerId = button.dataset.trigger;
    fireScenarioTrigger(triggerId, { manual: true });
}

function fireScenarioTrigger(triggerId, { manual = false } = {}) {
    if (!triggerId) return;
    const trigger = state.scenario.triggers.find(entry => entry.id === triggerId);
    if (!trigger || trigger.status === 'fired') return;
    trigger.status = 'fired';
    executeScenarioActions(trigger.actions ?? []);
    renderScenarioTriggers();
    if (manual) {
        addLog('scenario', `Trigger ${trigger.name} manuell ausgelöst.`);
    }
}

function executeScenarioActions(actions = []) {
    actions.forEach(action => {
        switch (action.type) {
            case 'log':
                addLog('scenario', action.message ?? 'Szenarioaktion.');
                break;
            case 'alert':
                if (action.level) setAlertState(action.level);
                break;
            case 'objective':
                if (action.id) {
                    state.objectives = state.objectives.map(obj => obj.id === action.id ? { ...obj, completed: true } : obj);
                    renderObjectives();
                }
                break;
            case 'phase':
                advanceScenarioPhase(action.id);
                break;
            case 'encounter':
                if (action.behavior) {
                    state.encounters = state.encounters.map(enc => enc.id === action.id ? { ...enc, behavior: action.behavior } : enc);
                    renderScenarioEncounters();
                }
                break;
            case 'randomEvent':
                if (Array.isArray(state.randomEvents) && state.randomEvents.length) {
                    const event = state.randomEvents.find(evt => evt.id === action.id) ?? state.randomEvents[0];
                    applyRandomEvent(event);
                }
                break;
            default:
                break;
        }
    });
}

function advanceScenarioPhase(phaseId) {
    state.scenario.phases = state.scenario.phases.map(phase => {
        if (phase.id === phaseId) return { ...phase, status: 'active' };
        if (phase.status === 'active') return { ...phase, status: 'complete' };
        return phase;
    });
    renderScenarioPhases();
}

function evaluateScenarioTrigger(trigger) {
    if (!trigger || trigger.status === 'fired') return false;
    const condition = trigger.condition ?? { type: 'manual' };
    switch (condition.type) {
        case 'alert':
            return state.alert === condition.level;
        case 'objective-complete':
            return state.objectives.some(obj => obj.id === condition.id && obj.completed);
        case 'phase-complete':
            return state.scenario.phases.some(phase => phase.id === condition.id && phase.status === 'complete');
        case 'manual':
        default:
            return false;
    }
}

/** === Telemetry & Replay === */
function normalizeTelemetry(telemetry = {}) {
    const metrics = Array.isArray(telemetry.metrics)
        ? telemetry.metrics.map((metric, index) => ({
            id: metric.id ?? `metric-${index + 1}`,
            label: metric.label ?? `Metrik ${index + 1}`,
            value: metric.value ?? 0,
            unit: metric.unit ?? '',
            trend: metric.trend ?? 'steady'
        }))
        : [];
    const events = Array.isArray(telemetry.events)
        ? telemetry.events.map((evt, index) => ({
            id: evt.id ?? `telemetry-${index + 1}`,
            message: evt.message ?? 'Event',
            timestamp: evt.timestamp ?? formatTime()
        }))
        : [];
    const paused = Boolean(telemetry.paused);
    return { metrics, events, paused };
}

function renderTelemetry() {
    renderTelemetryMetrics();
    renderTelemetryEvents();
    updateTelemetryControls();
}

function renderTelemetryMetrics() {
    if (!elements.telemetryMetrics) return;
    elements.telemetryMetrics.innerHTML = '';
    if (!state.telemetry.metrics || state.telemetry.metrics.length === 0) {
        elements.telemetryMetrics.innerHTML = '<p class="empty-placeholder">Keine Telemetriedaten.</p>';
        return;
    }
    state.telemetry.metrics.forEach(metric => {
        const card = document.createElement('div');
        card.className = 'telemetry-card';
        card.innerHTML = `
            <strong>${metric.label}</strong>
            <span>${metric.value}${metric.unit ? ` ${metric.unit}` : ''}</span>
            <small>${metric.trend}</small>
        `;
        elements.telemetryMetrics.appendChild(card);
    });
}

function renderTelemetryEvents() {
    if (!elements.telemetryEvents) return;
    elements.telemetryEvents.innerHTML = '';
    if (!state.telemetry.events || state.telemetry.events.length === 0) {
        const li = document.createElement('li');
        li.className = 'empty-placeholder';
        li.textContent = 'Keine Telemetrie-Events.';
        elements.telemetryEvents.appendChild(li);
        return;
    }
    state.telemetry.events.slice(-10).forEach(evt => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${evt.message}</span><strong>${evt.timestamp}</strong>`;
        elements.telemetryEvents.appendChild(li);
    });
}

function updateTelemetryControls() {
    if (elements.telemetryPause) elements.telemetryPause.disabled = state.telemetry.paused;
    if (elements.telemetryResume) elements.telemetryResume.disabled = !state.telemetry.paused;
    if (elements.telemetryStatus) {
        elements.telemetryStatus.textContent = state.telemetry.paused ? 'Pausiert' : 'Live';
        elements.telemetryStatus.className = `status-pill ${state.telemetry.paused ? 'status-idle' : 'status-online'}`;
    }
}

function handleTelemetryControl(event) {
    const button = event.target.closest('button');
    if (!button) return;
    if (button === elements.telemetryPause) {
        state.telemetry.paused = true;
        updateTelemetryControls();
        addLog('telemetry', 'Telemetrie pausiert.');
    } else if (button === elements.telemetryResume) {
        state.telemetry.paused = false;
        updateTelemetryControls();
        addLog('telemetry', 'Telemetrie fortgesetzt.');
    } else if (button === elements.telemetryReplay) {
        addLog('telemetry', 'Replay der letzten 60 Sekunden angefordert.');
    }
}

/** === Fault Injection === */
function normalizeFaults(faults = {}) {
    const templates = Array.isArray(faults.templates)
        ? faults.templates.map((template, index) => ({
            id: template.id ?? `fault-${index + 1}`,
            label: template.label ?? `Fehler ${index + 1}`,
            description: template.description ?? '',
            target: template.target ?? 'system'
        }))
        : [];
    const active = Array.isArray(faults.active)
        ? faults.active.map((entry, index) => ({
            id: entry.id ?? `active-fault-${index + 1}`,
            label: entry.label ?? `Aktiver Fehler ${index + 1}`,
            target: entry.target ?? 'system',
            severity: entry.severity ?? 'minor'
        }))
        : [];
    return { templates, active };
}

function renderFaults() {
    if (!elements.faultTemplateList) return;
    elements.faultTemplateList.innerHTML = '';
    if (!state.faults.templates || state.faults.templates.length === 0) {
        const li = document.createElement('li');
        li.className = 'empty-placeholder';
        li.textContent = 'Keine Fault-Vorlagen.';
        elements.faultTemplateList.appendChild(li);
    } else {
        state.faults.templates.forEach(template => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${template.label}</span>
                <button class="mini-button" data-action="fault-inject" data-fault="${template.id}">Einspielen</button>
            `;
            elements.faultTemplateList.appendChild(li);
        });
    }
    renderActiveFaults();
}

function renderActiveFaults() {
    if (!elements.faultActiveList) return;
    elements.faultActiveList.innerHTML = '';
    if (!state.faults.active || state.faults.active.length === 0) {
        elements.faultActiveList.innerHTML = '<p class="empty-placeholder">Keine aktiven Störungen.</p>';
        if (elements.faultStatus) {
            elements.faultStatus.textContent = 'Bereit';
            elements.faultStatus.className = 'status-pill status-idle';
        }
        return;
    }
    state.faults.active.forEach(fault => {
        const div = document.createElement('div');
        div.className = 'active-fault';
        div.innerHTML = `
            <strong>${fault.label}</strong>
            <span>Ziel: ${fault.target}</span>
            <button class="mini-button" data-action="fault-resolve" data-fault="${fault.id}">Beheben</button>
        `;
        elements.faultActiveList.appendChild(div);
    });
    if (elements.faultStatus) {
        elements.faultStatus.textContent = `${state.faults.active.length} aktiv`;
        elements.faultStatus.className = 'status-pill status-warning';
    }
}

function handleFaultAction(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    if (button.dataset.action === 'fault-inject') {
        injectFault(button.dataset.fault);
    } else if (button.dataset.action === 'fault-resolve') {
        resolveFault(button.dataset.fault);
    }
}

function injectFault(templateId) {
    const template = state.faults.templates.find(entry => entry.id === templateId);
    if (!template) return;
    const activeFault = {
        id: `active-${Date.now()}`,
        label: template.label,
        target: template.target,
        severity: 'minor'
    };
    state.faults.active.push(activeFault);
    renderFaults();
    addLog('fault', `Fault Injection: ${template.label} auf ${template.target}.`);
}

function resolveFault(faultId) {
    state.faults.active = state.faults.active.filter(entry => entry.id !== faultId);
    renderFaults();
    addLog('fault', `Fault ${faultId} behoben.`);
}

/** === LARP-Master Console === */
function normalizeLarp(larp = {}) {
    const parameters = Array.isArray(larp.parameters)
        ? larp.parameters.map((param, index) => ({
            id: param.id ?? `param-${index + 1}`,
            label: param.label ?? `Parameter ${index + 1}`,
            value: Number.parseFloat(param.value) || 0,
            min: Number.parseFloat(param.min) || 0,
            max: Number.parseFloat(param.max) || 100,
            step: Number.parseFloat(param.step) || 5
        }))
        : [];
    const cues = Array.isArray(larp.cues)
        ? larp.cues.map((cue, index) => ({
            id: cue.id ?? `cue-${index + 1}`,
            label: cue.label ?? `Cue ${index + 1}`,
            message: cue.message ?? ''
        }))
        : [];
    const fogLevel = Number.parseFloat(larp.fogLevel) || 25;
    return { parameters, cues, fogLevel };
}

function renderLarpConsole() {
    renderLarpParameters();
    renderLarpCues();
    updateLarpFog();
}

function renderLarpParameters() {
    if (!elements.larpParameters) return;
    elements.larpParameters.innerHTML = '';
    if (!state.larp.parameters || state.larp.parameters.length === 0) {
        elements.larpParameters.innerHTML = '<p class="empty-placeholder">Keine Parameter definiert.</p>';
        return;
    }
    state.larp.parameters.forEach(param => {
        const card = document.createElement('div');
        card.className = 'parameter-card';
        card.innerHTML = `
            <strong>${param.label}</strong>
            <input type="range" data-action="larp-parameter" data-parameter="${param.id}" min="${param.min}" max="${param.max}" step="${param.step}" value="${param.value}">
            <span>${param.value}</span>
        `;
        elements.larpParameters.appendChild(card);
    });
}

function renderLarpCues() {
    if (!elements.larpCues) return;
    elements.larpCues.innerHTML = '';
    if (!state.larp.cues || state.larp.cues.length === 0) {
        const li = document.createElement('li');
        li.className = 'empty-placeholder';
        li.textContent = 'Keine Cues angelegt.';
        elements.larpCues.appendChild(li);
        return;
    }
    state.larp.cues.forEach(cue => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${cue.label}</span>
            <button class="mini-button" data-action="larp-cue" data-cue="${cue.id}">Senden</button>
        `;
        elements.larpCues.appendChild(li);
    });
}

function updateLarpFog() {
    if (!elements.larpFog) return;
    elements.larpFog.value = state.larp.fogLevel;
    if (elements.larpFogLabel) elements.larpFogLabel.textContent = `${state.larp.fogLevel}%`;
}

function handleLarpInteraction(event) {
    const slider = event.target.closest('input[type="range"][data-action="larp-parameter"]');
    const button = event.target.closest('button[data-action]');
    if (slider) {
        const paramId = slider.dataset.parameter;
        const value = Number.parseFloat(slider.value) || 0;
        state.larp.parameters = state.larp.parameters.map(param => param.id === paramId ? { ...param, value } : param);
        slider.nextElementSibling.textContent = `${value}`;
        addLog('larp', `Parameter ${paramId} auf ${value} gesetzt.`);
    } else if (button) {
        if (button.dataset.action === 'larp-cue') {
            const cue = state.larp.cues.find(entry => entry.id === button.dataset.cue);
            if (cue) addLog('larp', `Cue gesendet: ${cue.message || cue.label}`);
        }
    }
}

function handleLarpFogChange(event) {
    const value = Number.parseFloat(event.target.value) || 0;
    state.larp.fogLevel = value;
    if (elements.larpFogLabel) elements.larpFogLabel.textContent = `${value}%`;
    addLog('larp', `Fog-of-War angepasst auf ${value}%.`);
}

/** === NPC Interaction Manager === */
function normalizeNpc(npc = {}) {
    const safeArray = value => (Array.isArray(value) ? value : []);
    const scripts = safeArray(npc.scripts).map((script, index) => ({
        id: script.id ?? `npc-script-${index + 1}`,
        label: script.label ?? script.name ?? `Script ${index + 1}`,
        channel: script.channel ?? script.target ?? 'Allgemein',
        status: (script.status ?? 'ready').toLowerCase(),
        prompt: script.prompt ?? script.message ?? ''
    }));
    const cues = safeArray(npc.cues).map((cue, index) => ({
        id: cue.id ?? `npc-cue-${index + 1}`,
        label: cue.label ?? cue.name ?? `Cue ${index + 1}`,
        status: (cue.status ?? 'queued').toLowerCase(),
        note: cue.note ?? ''
    }));
    const log = safeArray(npc.log).map((entry, index) => ({
        id: entry.id ?? `npc-log-${index + 1}`,
        timestamp: entry.timestamp ?? formatTime(),
        message: entry.message ?? ''
    }));
    return { scripts, cues, log };
}

function renderNpcManager() {
    if (!state.npc) {
        state.npc = normalizeNpc();
    }
    renderNpcScripts();
    renderNpcCues();
    renderNpcLog();
    updateNpcStatus();
}

function renderNpcScripts() {
    if (!elements.npcScriptList) return;
    const npc = state.npc ?? { scripts: [] };
    elements.npcScriptList.innerHTML = '';
    if (!npc.scripts.length) {
        elements.npcScriptList.innerHTML = '<li class="empty-placeholder">Keine Funkvorlagen.</li>';
        return;
    }
    npc.scripts.forEach(script => {
        const li = document.createElement('li');
        li.className = 'task-item';
        li.innerHTML = `
            <div>
                <strong>${script.label}</strong>
                <small>Kanal: ${script.channel}</small>
                ${script.prompt ? `<p>${script.prompt}</p>` : ''}
            </div>
            <div class="task-actions">
                ${script.status === 'sent'
                    ? '<span class="status-pill status-online">Gesendet</span>'
                    : `<button class="mini-button" data-action="npc-trigger-script" data-script="${script.id}">Senden</button>`}
            </div>
        `;
        elements.npcScriptList.appendChild(li);
    });
}

function renderNpcCues() {
    if (!elements.npcCueList) return;
    const npc = state.npc ?? { cues: [] };
    elements.npcCueList.innerHTML = '';
    if (!npc.cues.length) {
        elements.npcCueList.innerHTML = '<li class="empty-placeholder">Keine Cues in der Warteschlange.</li>';
        return;
    }
    npc.cues.forEach(cue => {
        const li = document.createElement('li');
        li.className = 'task-item';
        li.innerHTML = `
            <div>
                <strong>${cue.label}</strong>
                ${cue.note ? `<p>${cue.note}</p>` : ''}
            </div>
            <div class="task-actions">
                ${cue.status === 'used'
                    ? '<span class="status-pill status-idle">Verwendet</span>'
                    : `<button class="mini-button" data-action="npc-trigger-cue" data-cue="${cue.id}">Auslösen</button>`}
            </div>
        `;
        elements.npcCueList.appendChild(li);
    });
}

function renderNpcLog() {
    if (!elements.npcLog) return;
    const npc = state.npc ?? { log: [] };
    if (!npc.log.length) {
        elements.npcLog.innerHTML = '<p class="empty-placeholder">Noch keine Interaktionen.</p>';
        return;
    }
    elements.npcLog.innerHTML = npc.log.slice(-10).map(entry => `
        <div class="log-entry"><time>${entry.timestamp}</time><p>${entry.message}</p></div>
    `).join('');
}

function updateNpcStatus() {
    if (!elements.npcStatus) return;
    const npc = state.npc ?? { scripts: [], cues: [] };
    const pendingCue = npc.cues.some(cue => cue.status !== 'used');
    const pendingScript = npc.scripts.some(script => script.status !== 'sent');
    if (pendingCue) {
        elements.npcStatus.textContent = 'Cues bereit';
        elements.npcStatus.className = 'status-pill status-warning';
    } else if (pendingScript) {
        elements.npcStatus.textContent = 'Vorlagen offen';
        elements.npcStatus.className = 'status-pill status-warning';
    } else {
        elements.npcStatus.textContent = 'Bereit';
        elements.npcStatus.className = 'status-pill status-online';
    }
}

function handleNpcClick(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const npc = state.npc ?? normalizeNpc();
    if (button.dataset.action === 'npc-trigger-script') {
        const scriptId = button.dataset.script;
        const scripts = npc.scripts.map(script => script.id === scriptId ? { ...script, status: 'sent' } : script);
        const script = scripts.find(entry => entry.id === scriptId);
        const logEntry = script
            ? { id: `npc-log-${Date.now()}`, timestamp: formatTime(), message: `Funk ${script.label} (${script.channel}) gesendet.` }
            : null;
        const log = logEntry ? [...npc.log, logEntry] : npc.log;
        kernel.setState('npc', { ...npc, scripts, log });
        renderNpcManager();
        if (script) addLog('npc', `Funk gesendet: ${script.label}.`);
    } else if (button.dataset.action === 'npc-trigger-cue') {
        const cueId = button.dataset.cue;
        const cues = npc.cues.map(cue => cue.id === cueId ? { ...cue, status: 'used' } : cue);
        const cue = cues.find(entry => entry.id === cueId);
        const logEntry = cue
            ? { id: `npc-log-${Date.now()}`, timestamp: formatTime(), message: `Cue ausgelöst: ${cue.label}.` }
            : null;
        const log = logEntry ? [...npc.log, logEntry] : npc.log;
        kernel.setState('npc', { ...npc, cues, log });
        renderNpcManager();
        if (cue) addLog('npc', `Cue ausgelöst: ${cue.label}.`);
    }
}

/** === Crew Roleplay Scheduler === */
function normalizeCrewSchedule(schedule = {}) {
    const safeArray = value => (Array.isArray(value) ? value : []);
    const scenes = safeArray(schedule.scenes).map((scene, index) => ({
        id: scene.id ?? `scene-${index + 1}`,
        title: scene.title ?? scene.name ?? `Szene ${index + 1}`,
        time: scene.time ?? scene.slot ?? '',
        location: scene.location ?? '',
        cast: scene.cast ?? scene.participants ?? '',
        status: (scene.status ?? 'scheduled').toLowerCase(),
        note: scene.note ?? ''
    }));
    return { scenes };
}

function renderCrewSchedule() {
    if (!state.crewSchedule) {
        state.crewSchedule = normalizeCrewSchedule();
    }
    if (!elements.crewSceneList) return;
    const { scenes } = state.crewSchedule;
    elements.crewSceneList.innerHTML = '';
    if (!scenes.length) {
        elements.crewSceneList.innerHTML = '<li class="empty-placeholder">Keine Szenen geplant.</li>';
    } else {
        scenes.forEach(scene => {
            const li = document.createElement('li');
            li.className = 'task-item';
            const meta = [scene.time, scene.location].filter(Boolean).join(' · ');
            li.innerHTML = `
                <div>
                    <strong>${scene.title}</strong>
                    ${meta ? `<small>${meta}</small>` : ''}
                    ${scene.cast ? `<p>${scene.cast}</p>` : ''}
                    ${scene.note ? `<p>${scene.note}</p>` : ''}
                </div>
                <div class="task-actions">
                    ${scene.status === 'done'
                        ? '<span class="status-pill status-online">Abgeschlossen</span>'
                        : `<button class="mini-button" data-action="crew-advance" data-scene="${scene.id}">${scene.status === 'scheduled' ? 'Starten' : 'Abschließen'}</button>`}
                </div>
            `;
            elements.crewSceneList.appendChild(li);
        });
    }
    updateCrewSchedulerStatus();
}

function updateCrewSchedulerStatus() {
    if (!elements.crewSchedulerStatus) return;
    const { scenes = [] } = state.crewSchedule ?? {};
    const active = scenes.some(scene => scene.status === 'in-progress');
    const pending = scenes.some(scene => scene.status !== 'done');
    if (active) {
        elements.crewSchedulerStatus.textContent = 'Laufend';
        elements.crewSchedulerStatus.className = 'status-pill status-warning';
    } else if (pending) {
        elements.crewSchedulerStatus.textContent = 'Geplant';
        elements.crewSchedulerStatus.className = 'status-pill status-warning';
    } else {
        elements.crewSchedulerStatus.textContent = 'Abgeschlossen';
        elements.crewSchedulerStatus.className = 'status-pill status-online';
    }
}

function handleCrewScheduleClick(event) {
    const button = event.target.closest('button[data-action="crew-advance"]');
    if (!button) return;
    const sceneId = button.dataset.scene;
    const schedule = state.crewSchedule ?? normalizeCrewSchedule();
    const scenes = schedule.scenes.map(scene => {
        if (scene.id !== sceneId) return scene;
        const nextStatus = scene.status === 'scheduled' ? 'in-progress' : 'done';
        return { ...scene, status: nextStatus };
    });
    const updatedScene = scenes.find(scene => scene.id === sceneId);
    kernel.setState('crewSchedule', { ...schedule, scenes });
    renderCrewSchedule();
    if (updatedScene) {
        const message = updatedScene.status === 'done'
            ? `Szene ${updatedScene.title} abgeschlossen.`
            : `Szene ${updatedScene.title} gestartet.`;
        addLog('crew', message);
    }
}

/** === Immersion Control === */
function normalizeImmersion(immersion = {}) {
    const safeArray = value => (Array.isArray(value) ? value : []);
    const audio = safeArray(immersion.audio).map((track, index) => ({
        id: track.id ?? `audio-${index + 1}`,
        label: track.label ?? track.name ?? `Audio ${index + 1}`,
        status: (track.status ?? 'ready').toLowerCase(),
        level: Number.parseFloat(track.level ?? track.volume ?? 0) || 0,
        note: track.note ?? ''
    }));
    const lighting = immersion.lighting
        ? {
            mode: immersion.lighting.mode ?? immersion.lighting.scene ?? 'Standard',
            intensity: Number.parseFloat(immersion.lighting.intensity ?? immersion.lighting.level ?? 40) || 40
        }
        : { mode: 'Standard', intensity: 40 };
    const props = safeArray(immersion.props).map((prop, index) => ({
        id: prop.id ?? `prop-${index + 1}`,
        label: prop.label ?? prop.name ?? `Requisite ${index + 1}`,
        status: (prop.status ?? 'ready').toLowerCase(),
        note: prop.note ?? ''
    }));
    return { audio, lighting, props };
}

function renderImmersion() {
    if (!state.immersion) {
        state.immersion = normalizeImmersion();
    }
    renderImmersionAudio();
    renderImmersionLighting();
    renderImmersionProps();
    updateImmersionStatus();
}

function renderImmersionAudio() {
    if (!elements.immersionAudioList) return;
    const immersion = state.immersion ?? { audio: [] };
    elements.immersionAudioList.innerHTML = '';
    if (!immersion.audio.length) {
        elements.immersionAudioList.innerHTML = '<li class="empty-placeholder">Keine Audiospuren.</li>';
        return;
    }
    immersion.audio.forEach(track => {
        const li = document.createElement('li');
        li.className = 'task-item';
        li.innerHTML = `
            <div>
                <strong>${track.label}</strong>
                <small>Level ${Math.round(track.level)}%</small>
                ${track.note ? `<p>${track.note}</p>` : ''}
            </div>
            <div class="task-actions">
                <button class="mini-button" data-action="immersion-toggle-audio" data-audio="${track.id}">${track.status === 'playing' ? 'Stoppen' : 'Starten'}</button>
            </div>
        `;
        elements.immersionAudioList.appendChild(li);
    });
}

function renderImmersionLighting() {
    if (!elements.immersionLighting || !elements.immersionLightingLabel) return;
    const immersion = state.immersion ?? { lighting: { mode: 'Standard', intensity: 40 } };
    const intensity = Math.round(immersion.lighting?.intensity ?? 40);
    elements.immersionLighting.value = intensity;
    elements.immersionLightingLabel.textContent = `${intensity}%`;
    if (elements.immersionLightingMode) {
        elements.immersionLightingMode.innerHTML = `
            <strong>Modus</strong>
            <span>${immersion.lighting?.mode ?? 'Standard'}</span>
        `;
    }
}

function renderImmersionProps() {
    if (!elements.immersionPropList) return;
    const immersion = state.immersion ?? { props: [] };
    elements.immersionPropList.innerHTML = '';
    if (!immersion.props.length) {
        elements.immersionPropList.innerHTML = '<li class="empty-placeholder">Keine Requisiten gemeldet.</li>';
        return;
    }
    immersion.props.forEach(prop => {
        const li = document.createElement('li');
        li.className = 'task-item';
        li.innerHTML = `
            <div>
                <strong>${prop.label}</strong>
                ${prop.note ? `<p>${prop.note}</p>` : ''}
            </div>
            <div class="task-actions">
                <button class="mini-button" data-action="immersion-toggle-prop" data-prop="${prop.id}">${prop.status === 'in-use' ? 'Bereit' : 'Einsetzen'}</button>
            </div>
        `;
        elements.immersionPropList.appendChild(li);
    });
}

function updateImmersionStatus() {
    if (!elements.immersionStatus) return;
    const immersion = state.immersion ?? { audio: [], props: [] };
    const playing = immersion.audio.some(track => track.status === 'playing');
    const activeProps = immersion.props.some(prop => prop.status === 'in-use');
    if (playing || activeProps) {
        elements.immersionStatus.textContent = 'Aktiv';
        elements.immersionStatus.className = 'status-pill status-online';
    } else {
        elements.immersionStatus.textContent = 'Bereit';
        elements.immersionStatus.className = 'status-pill status-idle';
    }
}

function handleImmersionClick(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const immersion = state.immersion ?? normalizeImmersion();
    if (button.dataset.action === 'immersion-toggle-audio') {
        const audioId = button.dataset.audio;
        const audio = immersion.audio.map(track => track.id === audioId ? { ...track, status: track.status === 'playing' ? 'ready' : 'playing' } : track);
        const track = audio.find(entry => entry.id === audioId);
        kernel.setState('immersion', { ...immersion, audio });
        renderImmersion();
        if (track) addLog('immersion', `Audio ${track.label} ${track.status === 'playing' ? 'gestartet' : 'gestoppt'}.`);
    } else if (button.dataset.action === 'immersion-toggle-prop') {
        const propId = button.dataset.prop;
        const props = immersion.props.map(prop => prop.id === propId ? { ...prop, status: prop.status === 'in-use' ? 'ready' : 'in-use' } : prop);
        const prop = props.find(entry => entry.id === propId);
        kernel.setState('immersion', { ...immersion, props });
        renderImmersion();
        if (prop) addLog('immersion', `Requisite ${prop.label} ${prop.status === 'in-use' ? 'im Einsatz' : 'bereitgestellt'}.`);
    }
}

function handleImmersionLightingChange(event) {
    if (!event.target) return;
    const value = Number.parseInt(event.target.value, 10) || 0;
    const immersion = state.immersion ?? normalizeImmersion();
    const lighting = { ...(immersion.lighting ?? { mode: 'Standard', intensity: 40 }), intensity: value };
    kernel.setState('immersion', { ...immersion, lighting });
    renderImmersionLighting();
    if (event.type === 'change') {
        addLog('immersion', `Beleuchtung auf ${value}% gesetzt.`);
    }
}

/** === Character Progress Tracker === */
function normalizeCharacters(characters = {}) {
    const safeArray = value => (Array.isArray(value) ? value : []);
    const roster = safeArray(characters.roster).map((entry, index) => ({
        id: entry.id ?? `character-${index + 1}`,
        name: entry.name ?? `Crew ${index + 1}`,
        role: entry.role ?? entry.position ?? '',
        xp: Number.parseInt(entry.xp ?? entry.experience ?? 0, 10) || 0,
        traits: safeArray(entry.traits ?? entry.attributes ?? []),
        nextUnlock: entry.nextUnlock ?? entry.unlock ?? ''
    }));
    return { roster };
}

function renderCharacters() {
    if (!state.characters) {
        state.characters = normalizeCharacters();
    }
    if (!elements.characterRoster) return;
    const { roster } = state.characters;
    elements.characterRoster.innerHTML = '';
    if (!roster.length) {
        elements.characterRoster.innerHTML = '<tr><td colspan="5" class="empty-placeholder">Keine Charakterdaten.</td></tr>';
        return;
    }
    roster.forEach(character => {
        const row = document.createElement('tr');
        const traits = Array.isArray(character.traits) ? character.traits.join(', ') : (character.traits || '–');
        row.innerHTML = `
            <td>${character.name}</td>
            <td>${character.role || '–'}</td>
            <td>${character.xp} XP${character.nextUnlock ? `<br><small>Nächste Freischaltung: ${character.nextUnlock}</small>` : ''}</td>
            <td>${traits || '–'}</td>
            <td><button class="mini-button" data-action="character-award" data-character="${character.id}">+10 XP</button></td>
        `;
        elements.characterRoster.appendChild(row);
    });
    updateCharacterStatus();
}

function updateCharacterStatus() {
    if (!elements.characterStatus) return;
    const roster = state.characters?.roster ?? [];
    const advancing = roster.some(character => character.nextUnlock);
    if (advancing) {
        elements.characterStatus.textContent = 'Aktualisiert';
        elements.characterStatus.className = 'status-pill status-online';
    } else {
        elements.characterStatus.textContent = 'Aktiv';
        elements.characterStatus.className = 'status-pill status-idle';
    }
}

function handleCharacterClick(event) {
    const button = event.target.closest('button[data-action="character-award"]');
    if (!button) return;
    const characterId = button.dataset.character;
    const characters = state.characters ?? normalizeCharacters();
    const roster = characters.roster.map(character => character.id === characterId ? { ...character, xp: character.xp + 10 } : character);
    const character = roster.find(entry => entry.id === characterId);
    kernel.setState('characters', { ...characters, roster });
    renderCharacters();
    if (character) {
        addLog('characters', `Charakter ${character.name} erhält 10 XP.`);
    }
}

/** === In-Universe News === */
function normalizeNews(news = {}) {
    const safeArray = value => (Array.isArray(value) ? value : []);
    const feeds = safeArray(news.feeds).map((entry, index) => ({
        id: entry.id ?? `news-${index + 1}`,
        headline: entry.headline ?? entry.title ?? `Meldung ${index + 1}`,
        category: entry.category ?? entry.type ?? 'Allgemein',
        status: entry.status ?? 'published',
        priority: entry.priority ?? 'Normal',
        timestamp: entry.timestamp ?? '',
        summary: entry.summary ?? ''
    }));
    const drafts = safeArray(news.drafts).map((entry, index) => ({
        id: entry.id ?? `draft-${index + 1}`,
        title: entry.title ?? entry.headline ?? `Entwurf ${index + 1}`,
        summary: entry.summary ?? entry.message ?? '',
        status: entry.status ?? 'draft',
        category: entry.category ?? entry.type ?? 'Allgemein',
        priority: entry.priority ?? 'Normal'
    }));
    return { feeds, drafts };
}

function renderNews() {
    if (!state.news) {
        state.news = normalizeNews();
    }
    renderNewsFeed();
    renderNewsDrafts();
    updateNewsStatus();
}

function renderNewsFeed() {
    if (!elements.newsFeedList) return;
    const news = state.news ?? { feeds: [] };
    elements.newsFeedList.innerHTML = '';
    if (!news.feeds.length) {
        elements.newsFeedList.innerHTML = '<li class="empty-placeholder">Noch keine Meldungen.</li>';
        return;
    }
    news.feeds.slice().reverse().forEach(entry => {
        const li = document.createElement('li');
        li.innerHTML = `
            <strong>${entry.headline}</strong>
            <small>${entry.category}${entry.timestamp ? ` · ${entry.timestamp}` : ''}</small>
            ${entry.summary ? `<p>${entry.summary}</p>` : ''}
        `;
        elements.newsFeedList.appendChild(li);
    });
}

function renderNewsDrafts() {
    if (!elements.newsDraftList) return;
    const news = state.news ?? { drafts: [] };
    elements.newsDraftList.innerHTML = '';
    if (!news.drafts.length) {
        elements.newsDraftList.innerHTML = '<li class="empty-placeholder">Keine Entwürfe vorhanden.</li>';
        return;
    }
    news.drafts.forEach(draft => {
        const li = document.createElement('li');
        li.className = 'task-item';
        li.innerHTML = `
            <div>
                <strong>${draft.title}</strong>
                <small>${draft.category}</small>
                ${draft.summary ? `<p>${draft.summary}</p>` : ''}
            </div>
            <div class="task-actions">
                <button class="mini-button" data-action="news-publish" data-draft="${draft.id}">Veröffentlichen</button>
            </div>
        `;
        elements.newsDraftList.appendChild(li);
    });
}

function updateNewsStatus() {
    if (!elements.newsStatus) return;
    const drafts = state.news?.drafts ?? [];
    if (drafts.length > 0) {
        elements.newsStatus.textContent = `${drafts.length} Entwürfe`;
        elements.newsStatus.className = 'status-pill status-warning';
    } else {
        elements.newsStatus.textContent = 'Bereit';
        elements.newsStatus.className = 'status-pill status-online';
    }
}

function handleNewsClick(event) {
    const button = event.target.closest('button[data-action="news-publish"]');
    if (!button) return;
    const draftId = button.dataset.draft;
    const news = state.news ?? normalizeNews();
    const draft = news.drafts.find(entry => entry.id === draftId);
    const drafts = news.drafts.filter(entry => entry.id !== draftId);
    let feeds = news.feeds;
    if (draft) {
        const published = {
            id: `news-${Date.now()}`,
            headline: draft.title,
            category: draft.category ?? 'Allgemein',
            status: 'published',
            priority: draft.priority ?? 'Normal',
            timestamp: formatTime(),
            summary: draft.summary ?? ''
        };
        feeds = [...news.feeds, published];
        addLog('news', `Meldung veröffentlicht: ${published.headline}.`);
    }
    kernel.setState('news', { ...news, drafts, feeds });
    renderNews();
}

/** === Alarmzustände === */
function applyAlertTheme(level) {
    const normalized = typeof level === 'string' ? level.toLowerCase() : '';
    let themeClass = 'alert-theme-green';
    if (normalized === 'yellow') themeClass = 'alert-theme-yellow';
    else if (normalized === 'red') themeClass = 'alert-theme-red';
    else if (normalized === 'black') themeClass = 'alert-theme-black';

    const target = elements.appShell ?? document.getElementById('app') ?? document.body;
    if (!target) return;

    ALERT_THEME_CLASSES.forEach(cls => target.classList.remove(cls));
    if (themeClass) target.classList.add(themeClass);
}

function updateAlertDisplay(level) {
    if (!elements.alertState) return;
    const entry = state.alertStates[level] ?? { label: level, className: 'status-idle' };
    elements.alertState.textContent = entry.label ?? level;
    elements.alertState.className = `status-pill ${entry.className ?? 'status-idle'}`;
    applyAlertTheme(level);
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
    renderTacticalWeapons();
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

    elements.scienceAdvance?.addEventListener('click', advanceScienceAnalyses);
    elements.scienceSampleTable?.addEventListener('click', handleScienceTableClick);
    elements.scienceAnomalyList?.addEventListener('click', handleScienceAnomalyClick);

    elements.cargoLogisticsList?.addEventListener('click', handleCargoLogisticsClick);
    elements.fabricationQueue?.addEventListener('click', handleFabricationQueueClick);
    elements.damageBypassList?.addEventListener('click', handleDamageBypassClick);
    elements.damageRepairTable?.addEventListener('click', handleDamageRepairClick);
    elements.medicalRoster?.addEventListener('click', handleMedicalClick);
    elements.medicalQuarantine?.addEventListener('click', handleMedicalClick);
    elements.securityAuthList?.addEventListener('click', handleSecurityClick);
    elements.stationsReadiness?.addEventListener('click', handleStationClick);
    elements.procedureSelect?.addEventListener('change', handleProcedureChange);
    elements.procedureSteps?.addEventListener('change', handleProcedureToggle);
    elements.missionObjectives?.addEventListener('click', handleObjectiveToggle);
    elements.scenarioTriggerList?.addEventListener('click', handleScenarioTriggerClick);
    elements.telemetryPause?.addEventListener('click', handleTelemetryControl);
    elements.telemetryResume?.addEventListener('click', handleTelemetryControl);
    elements.telemetryReplay?.addEventListener('click', handleTelemetryControl);
    elements.faultTemplateList?.addEventListener('click', handleFaultAction);
    elements.faultActiveList?.addEventListener('click', handleFaultAction);
    elements.larpParameters?.addEventListener('input', handleLarpInteraction);
    elements.larpCues?.addEventListener('click', handleLarpInteraction);
    elements.larpFog?.addEventListener('input', handleLarpFogChange);
    elements.propulsionProfileList?.addEventListener('click', handlePropulsionClick);
    elements.propulsionManeuverList?.addEventListener('click', handlePropulsionClick);
    elements.thermalCoolingList?.addEventListener('click', handleThermalClick);
    elements.ftlChecklist?.addEventListener('click', handleFtlChecklistToggle);
    elements.npcScriptList?.addEventListener('click', handleNpcClick);
    elements.npcCueList?.addEventListener('click', handleNpcClick);
    elements.crewSceneList?.addEventListener('click', handleCrewScheduleClick);
    elements.immersionAudioList?.addEventListener('click', handleImmersionClick);
    elements.immersionPropList?.addEventListener('click', handleImmersionClick);
    elements.immersionLighting?.addEventListener('input', handleImmersionLightingChange);
    elements.immersionLighting?.addEventListener('change', handleImmersionLightingChange);
    elements.characterRoster?.addEventListener('click', handleCharacterClick);
    elements.newsDraftList?.addEventListener('click', handleNewsClick);
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
    state.objectives = (scenario.objectives ?? []).map((objective, index) => ({
        id: objective.id ?? `objective-${index + 1}`,
        text: objective.text ?? objective.label ?? `Ziel ${index + 1}`,
        completed: Boolean(objective.completed),
        optional: Boolean(objective.optional)
    }));
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

    state.tactical = prepareTacticalState(scenario.tactical);
    state.damageControl = normalizeDamageControl(scenario.damageControl ?? DEFAULT_SCENARIO.damageControl);
    state.science = normalizeScience(scenario.science);
    state.cargo = normalizeCargo(scenario.cargo);
    state.fabrication = normalizeFabrication(scenario.fabrication);
    state.medical = normalizeMedical(scenario.medical);
    state.security = normalizeSecurity(scenario.security);
    state.propulsion = normalizePropulsion(scenario.propulsion ?? DEFAULT_SCENARIO.propulsion);
    state.thermal = normalizeThermal(scenario.thermal ?? scenario.thermalControl ?? DEFAULT_SCENARIO.thermal);
    state.ftl = normalizeFtl(scenario.ftl ?? scenario.jump ?? DEFAULT_SCENARIO.ftl);
    state.stations = normalizeStations(scenario.stations);
    state.procedures = normalizeProcedures(scenario.procedures);
    state.briefing = normalizeBriefing(scenario.briefing);
    state.scenario = normalizeScenarioDirector(scenario.director ?? scenario.scenarioDirector ?? {});
    state.encounters = normalizeEncounters(scenario.encounters);
    state.telemetry = normalizeTelemetry(scenario.telemetry);
    state.faults = normalizeFaults(scenario.faults);
    state.larp = normalizeLarp(scenario.larp);
    state.npc = normalizeNpc(scenario.npc ?? scenario.npcManager ?? DEFAULT_SCENARIO.npc);
    state.crewSchedule = normalizeCrewSchedule(scenario.crewSchedule ?? scenario.roleplay ?? DEFAULT_SCENARIO.crewSchedule);
    state.immersion = normalizeImmersion(scenario.immersion ?? DEFAULT_SCENARIO.immersion);
    state.characters = normalizeCharacters(scenario.characters ?? DEFAULT_SCENARIO.characters);
    state.news = normalizeNews(scenario.news ?? DEFAULT_SCENARIO.news);

    if (resetLogs) {
        state.logs = prepareLogEntries(scenario.initialLog);
    }
    resetInspector();
    renderSystems();
    populateNavigation();
    populateComms();
    renderCrew();
    renderObjectives();
    renderTactical();
    renderDamageControl();
    renderScience();
    renderCargo();
    renderFabrication();
    renderMedical();
    renderSecurity();
    renderPropulsion();
    renderThermal();
    renderFtl();
    renderStations();
    renderProcedures();
    renderBriefing();
    renderScenarioDirector();
    renderTelemetry();
    renderFaults();
    renderLarpConsole();
    renderNpcManager();
    renderCrewSchedule();
    renderImmersion();
    renderCharacters();
    renderNews();

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
    kernel.startModule('tactical-control');
    kernel.startModule('scenario-engine');
    kernel.startModule('encounter-ai');
    kernel.startModule('telemetry-stream');

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

    kernel.on('tactical:updated', () => {
        renderTactical();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    init().catch(error => {
        console.error('Initialisierung fehlgeschlagen', error);
        addLog('error', `Initialisierung fehlgeschlagen: ${error.message}`);
    });
});
