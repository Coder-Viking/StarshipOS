const VALID_SYSTEM_STATUSES = new Set(['online', 'idle', 'warning', 'offline', 'critical']);

function validationError(context, message) {
    throw new Error(`${context}: ${message}`);
}

function firstAvailableElement(root, selectors) {
    const list = Array.isArray(selectors) ? selectors : [selectors];
    for (const selector of list) {
        const element = root.querySelector(selector);
        if (element) {
            return element;
        }
    }
    return null;
}

function getAttribute(element, attribute, context, { required = false, fallback = null } = {}) {
    if (!element) {
        if (required) {
            validationError(context, `Element für Attribut "${attribute}" fehlt.`);
        }
        return fallback;
    }
    const value = element.getAttribute(attribute);
    if (value === null || value === undefined || value === '') {
        if (required) {
            validationError(context, `Attribut "${attribute}" fehlt.`);
        }
        return fallback;
    }
    return value.trim();
}

function getTextContent(element, selectors, context, { required = false, fallback = '' } = {}) {
    if (!element) {
        if (required) {
            validationError(context, `Element fehlt.`);
        }
        return fallback;
    }
    const list = Array.isArray(selectors) ? selectors : [selectors];
    for (const selector of list) {
        const child = element.querySelector(selector);
        if (child && child.textContent !== undefined) {
            const text = child.textContent.trim();
            if (text) {
                return text;
            }
        }
    }
    if (required) {
        validationError(context, `Kindelement(e) ${list.map(sel => `<${sel}>`).join(', ')} fehlen oder sind leer.`);
    }
    return fallback;
}

function parseNumber(value, context, label, { min = -Infinity, max = Infinity, integer = true } = {}) {
    const parsed = integer ? Number.parseInt(value, 10) : Number.parseFloat(value);
    if (Number.isNaN(parsed)) {
        validationError(context, `Wert für ${label} ist keine gültige Zahl.`);
    }
    if (parsed < min || parsed > max) {
        validationError(context, `Wert für ${label} (${parsed}) liegt nicht im erlaubten Bereich ${min}..${max}.`);
    }
    return parsed;
}

function parseBoolean(value) {
    if (typeof value !== 'string') {
        return Boolean(value);
    }
    const normalized = value.trim().toLowerCase();
    return ['true', '1', 'yes', 'ja'].includes(normalized);
}

function parseShip(root) {
    const context = 'Schiff';
    const name = getAttribute(root, 'name', context, {
        fallback: getTextContent(root, ['name', 'bezeichnung'], context, { required: false, fallback: 'Unbenanntes Schiff' })
    }) || 'Unbenanntes Schiff';
    const commander = getAttribute(root, 'commander', context, {
        fallback: getTextContent(root, ['commander', 'kommandant'], context, { required: false, fallback: 'Unbekannt' })
    }) || 'Unbekannt';
    const registry = getAttribute(root, 'registry', context, {
        fallback: getTextContent(root, ['registry', 'kennung'], context, { required: false, fallback: '' })
    }) || '';
    const shipClass = getAttribute(root, 'class', context, {
        fallback: getTextContent(root, ['class', 'klasse'], context, { required: false, fallback: '' })
    }) || '';
    return { name, commander, registry, class: shipClass };
}

function parseSystems(root) {
    const systemsContainer = firstAvailableElement(root, ['systems', 'systeme']);
    if (!systemsContainer) {
        return [];
    }
    return Array.from(systemsContainer.querySelectorAll('system')).map(systemEl => {
        const context = `System ${getAttribute(systemEl, 'id', 'System', { required: true })}`;
        const id = getAttribute(systemEl, 'id', context, { required: true });
        const name = getTextContent(systemEl, ['name', 'bezeichnung'], context, { required: true });
        const status = (getTextContent(systemEl, ['status'], context, { fallback: 'online' }) || 'online').toLowerCase();
        if (!VALID_SYSTEM_STATUSES.has(status)) {
            validationError(context, `Status "${status}" ist ungültig.`);
        }
        const power = parseNumber(getTextContent(systemEl, ['power', 'leistung'], context, { required: true }), context, 'Leistung', { min: 0, max: 100 });
        const integrity = parseNumber(getTextContent(systemEl, ['integrity', 'integritaet'], context, { required: true }), context, 'Integrität', { min: 0, max: 100 });
        const load = parseNumber(getTextContent(systemEl, ['load', 'auslastung'], context, { required: true }), context, 'Auslastung', { min: 0, max: 100 });
        const details = {
            beschreibung: getTextContent(systemEl, ['beschreibung', 'description'], context, { fallback: '' }),
            redundanz: getTextContent(systemEl, ['redundanz', 'redundancy'], context, { fallback: '' }),
            letzteWartung: getTextContent(systemEl, ['letzteWartung', 'lastService'], context, { fallback: '' }),
            sensoren: Array.from(systemEl.querySelectorAll('sensoren > sensor, sensors > sensor')).map(sensorEl => sensorEl.textContent.trim()).filter(Boolean)
        };
        return { id, name, status, power, integrity, load, details };
    });
}

function parseLifeSupport(root) {
    const lifeSupportEl = root.querySelector('lifeSupport');
    if (!lifeSupportEl) {
        return null;
    }

    const cycles = Array.from(lifeSupportEl.querySelectorAll('cycles > cycle')).map((cycleEl, index) => {
        const inferredId = cycleEl.getAttribute('id') || `cycle-${index + 1}`;
        const context = `LifeSupport Zyklus ${inferredId}`;
        const id = getAttribute(cycleEl, 'id', context, { fallback: inferredId });
        const label = getAttribute(cycleEl, 'label', context, {
            fallback: getTextContent(cycleEl, ['label', 'name'], context, { required: true })
        });
        const status = getAttribute(cycleEl, 'status', context, {
            fallback: getTextContent(cycleEl, ['status'], context, { fallback: 'Stabil' })
        }) || 'Stabil';
        const note = getTextContent(cycleEl, ['note', 'hinweis'], context, { fallback: '' });
        const metrics = Array.from(cycleEl.querySelectorAll('metric')).map((metricEl, metricIndex) => {
            const metricContext = `${context} Metrik ${metricIndex + 1}`;
            const inferredKey = metricEl.getAttribute('key') || null;
            const key = getAttribute(metricEl, 'key', metricContext, { fallback: inferredKey });
            const labelMetric = getAttribute(metricEl, 'label', metricContext, {
                fallback: getTextContent(metricEl, ['label', 'name'], metricContext, { required: true })
            });
            const unit = getAttribute(metricEl, 'unit', metricContext, {
                fallback: getTextContent(metricEl, ['unit'], metricContext, { fallback: '' })
            }) || '';
            const valueRaw = getAttribute(metricEl, 'value', metricContext, {
                fallback: getTextContent(metricEl, ['value'], metricContext, { required: true })
            });
            const value = parseNumber(valueRaw, metricContext, 'Wert', { min: -100000, max: 100000, integer: false });
            return { key, label: labelMetric, unit, value };
        });
        return { id, label, status, metrics, note };
    });

    const sections = Array.from(lifeSupportEl.querySelectorAll('sections > section')).map((sectionEl, index) => {
        const inferredId = sectionEl.getAttribute('id') || `section-${index + 1}`;
        const context = `LifeSupport Sektion ${inferredId}`;
        const id = getAttribute(sectionEl, 'id', context, { fallback: inferredId });
        const name = getAttribute(sectionEl, 'name', context, {
            fallback: getTextContent(sectionEl, ['name', 'bezeichnung', 'label'], context, { required: true })
        });
        const pressureRaw = getAttribute(sectionEl, 'pressure', context, { required: true });
        const pressure = parseNumber(pressureRaw, context, 'Druck', { min: 0, max: 1000, integer: false });
        const pressureUnit = getAttribute(sectionEl, 'pressureUnit', context, {
            fallback: getTextContent(sectionEl, ['pressureUnit', 'druckEinheit'], context, { fallback: 'kPa' })
        }) || 'kPa';
        const temperatureRaw = getAttribute(sectionEl, 'temperature', context, { required: true });
        const temperature = parseNumber(temperatureRaw, context, 'Temperatur', { min: -100, max: 200, integer: false });
        const temperatureUnit = getAttribute(sectionEl, 'temperatureUnit', context, {
            fallback: getTextContent(sectionEl, ['temperatureUnit', 'temperaturEinheit'], context, { fallback: '°C' })
        }) || '°C';
        const humidityRaw = getAttribute(sectionEl, 'humidity', context, {
            fallback: getTextContent(sectionEl, ['humidity', 'feuchtigkeit'], context, { fallback: null })
        });
        const humidity = humidityRaw !== null && humidityRaw !== undefined
            ? parseNumber(humidityRaw, context, 'Feuchtigkeit', { min: 0, max: 100, integer: false })
            : null;
        const status = getAttribute(sectionEl, 'status', context, {
            fallback: getTextContent(sectionEl, ['status'], context, { fallback: 'Stabil' })
        }) || 'Stabil';
        return {
            id,
            name,
            pressure: { value: pressure, unit: pressureUnit },
            temperature: { value: temperature, unit: temperatureUnit },
            humidity: humidity !== null ? { value: humidity, unit: '%' } : null,
            status
        };
    });

    const leaks = Array.from(lifeSupportEl.querySelectorAll('leaks > leak')).map((leakEl, index) => {
        const inferredId = leakEl.getAttribute('id') || `leak-${index + 1}`;
        const context = `LifeSupport Leck ${inferredId}`;
        const id = getAttribute(leakEl, 'id', context, { fallback: inferredId });
        const location = getAttribute(leakEl, 'location', context, {
            fallback: getTextContent(leakEl, ['location', 'ort', 'name'], context, { required: true })
        });
        const severity = getAttribute(leakEl, 'severity', context, {
            fallback: getTextContent(leakEl, ['severity', 'schwere'], context, { fallback: 'Unbekannt' })
        }) || 'Unbekannt';
        const status = getAttribute(leakEl, 'status', context, {
            fallback: getTextContent(leakEl, ['status'], context, { fallback: 'Analyse läuft' })
        }) || 'Analyse läuft';
        const progressRaw = getAttribute(leakEl, 'progress', context, {
            fallback: getTextContent(leakEl, ['progress', 'fortschritt'], context, { fallback: '0' })
        });
        const progress = parseNumber(progressRaw, context, 'Fortschritt', { min: 0, max: 100, integer: false });
        const note = getTextContent(leakEl, ['note', 'hinweis'], context, { fallback: '' });
        return { id, location, severity, status, progress, note };
    });

    const filtersEl = lifeSupportEl.querySelector('filters');
    let filters = null;
    if (filtersEl) {
        const filterContext = 'LifeSupport Filter';
        const banks = Array.from(filtersEl.querySelectorAll('bank')).map((bankEl, index) => {
            const inferredId = bankEl.getAttribute('id') || `bank-${index + 1}`;
            const context = `LifeSupport Filterbank ${inferredId}`;
            const id = getAttribute(bankEl, 'id', context, { fallback: inferredId });
            const label = getAttribute(bankEl, 'label', context, {
                fallback: getTextContent(bankEl, ['label', 'name'], context, { required: true })
            });
            const status = getAttribute(bankEl, 'status', context, {
                fallback: getTextContent(bankEl, ['status'], context, { fallback: 'Bereit' })
            }) || 'Bereit';
            const saturationRaw = getAttribute(bankEl, 'saturation', context, { required: true });
            const saturation = parseNumber(saturationRaw, context, 'Sättigung', { min: 0, max: 100, integer: false });
            const saturationUnit = getAttribute(bankEl, 'saturationUnit', context, {
                fallback: getTextContent(bankEl, ['saturationUnit'], context, { fallback: '%' })
            }) || '%';
            const timeBufferRaw = getAttribute(bankEl, 'timeBuffer', context, {
                fallback: getTextContent(bankEl, ['timeBuffer'], context, { fallback: '0' })
            });
            const timeBuffer = parseNumber(timeBufferRaw, context, 'Zeitpuffer', { min: 0, max: 100000, integer: false });
            const timeBufferUnit = getAttribute(bankEl, 'timeBufferUnit', context, {
                fallback: getTextContent(bankEl, ['timeBufferUnit'], context, { fallback: 'min' })
            }) || 'min';
            return {
                id,
                label,
                status,
                saturation: { value: saturation, unit: saturationUnit },
                timeBuffer: { value: timeBuffer, unit: timeBufferUnit }
            };
        });

        const reserveAirAttr = filtersEl.getAttribute('reserveAirMinutes')
            ?? filtersEl.getAttribute('reserve')
            ?? filtersEl.getAttribute('reserveMinutes');
        const scrubberMarginAttr = filtersEl.getAttribute('scrubberMarginMinutes')
            ?? filtersEl.getAttribute('scrubberMargin');
        const emergencyBufferAttr = filtersEl.getAttribute('emergencyBufferMinutes')
            ?? filtersEl.getAttribute('emergencyBuffer');

        filters = {
            banks,
            reserveAirMinutes: reserveAirAttr !== null
                ? parseNumber(reserveAirAttr, filterContext, 'Reserve-Luft', { min: 0, max: 100000, integer: false })
                : undefined,
            scrubberMarginMinutes: scrubberMarginAttr !== null
                ? parseNumber(scrubberMarginAttr, filterContext, 'Scrubber-Puffer', { min: 0, max: 100000, integer: false })
                : undefined,
            emergencyBufferMinutes: emergencyBufferAttr !== null
                ? parseNumber(emergencyBufferAttr, filterContext, 'Notfall-O₂', { min: 0, max: 100000, integer: false })
                : undefined
        };
    }

    return {
        cycles,
        sections,
        leaks,
        filters
    };
}

function parseSectors(root) {
    const sectorsContainer = firstAvailableElement(root, ['sectors', 'sektoren']);
    if (!sectorsContainer) {
        return [];
    }
    return Array.from(sectorsContainer.querySelectorAll('sector')).map(sectorEl => {
        const context = `Sektor ${getAttribute(sectorEl, 'id', 'Sektor', { required: true })}`;
        const id = getAttribute(sectorEl, 'id', context, { required: true });
        const name = getAttribute(sectorEl, 'name', context, {
            fallback: getTextContent(sectorEl, ['name', 'bezeichnung'], context, { required: true })
        });
        const defaultCoords = getAttribute(sectorEl, 'defaultCoords', context, {
            fallback: getTextContent(sectorEl, ['defaultCoords', 'koordinaten'], context, { fallback: '' })
        }) || '';
        const baseEtaValue = getAttribute(sectorEl, 'baseEta', context, {
            fallback: getTextContent(sectorEl, ['baseEta', 'eta'], context, { required: true })
        });
        const baseEta = parseNumber(baseEtaValue, context, 'ETA', { min: 1, max: 1000 });
        return { id, name, defaultCoords, baseEta };
    });
}

function parseCommunications(root) {
    const commsContainer = firstAvailableElement(root, ['communications', 'kommunikation']);
    if (!commsContainer) {
        return [];
    }
    return Array.from(commsContainer.querySelectorAll('channel')).map(channelEl => {
        const id = getAttribute(channelEl, 'id', 'Kommunikationskanal', { required: true });
        const label = channelEl.textContent ? channelEl.textContent.trim() : '';
        if (!label) {
            validationError(`Kommunikationskanal ${id}`, 'Bezeichnung darf nicht leer sein.');
        }
        return { id, label };
    });
}

function parseCrew(root) {
    const crewContainer = firstAvailableElement(root, ['crew', 'besatzung']);
    if (!crewContainer) {
        return [];
    }
    return Array.from(crewContainer.querySelectorAll('member')).map(memberEl => {
        const context = 'Crewmitglied';
        const name = getTextContent(memberEl, ['name'], context, { required: true });
        const rolle = getTextContent(memberEl, ['role', 'rolle'], context, { required: true });
        const status = getTextContent(memberEl, ['status'], context, { required: true });
        return { name, rolle, status };
    });
}

function parseObjectives(root) {
    const missionContainer = firstAvailableElement(root, ['mission', 'missionen', 'objectives']);
    if (!missionContainer) {
        return [];
    }
    return Array.from(missionContainer.querySelectorAll('objective')).map(objectiveEl => {
        const idValue = getAttribute(objectiveEl, 'id', 'Missionsziel', { fallback: null });
        const completed = parseBoolean(getAttribute(objectiveEl, 'completed', 'Missionsziel', { fallback: objectiveEl.getAttribute('status') }));
        const text = objectiveEl.textContent ? objectiveEl.textContent.trim() : '';
        if (!text) {
            validationError('Missionsziel', 'Beschreibung darf nicht leer sein.');
        }
        return {
            id: idValue ? Number.parseInt(idValue, 10) || idValue : undefined,
            text,
            completed
        };
    });
}

function parseSensorBaselines(root) {
    const baselineContainer = firstAvailableElement(root, ['sensorBaselines', 'sensoren']);
    if (!baselineContainer) {
        return [];
    }
    return Array.from(baselineContainer.querySelectorAll('baseline')).map(baselineEl => {
        const context = `Sensorbasis ${getAttribute(baselineEl, 'label', 'Sensorbasis', { required: true })}`;
        const label = getAttribute(baselineEl, 'label', context, { required: true });
        const unit = getAttribute(baselineEl, 'unit', context, { fallback: getTextContent(baselineEl, ['unit'], context, { fallback: '' }) }) || '';
        const varianceValue = getAttribute(baselineEl, 'variance', context, {
            fallback: getTextContent(baselineEl, ['variance'], context, { required: true })
        });
        const baseValue = getAttribute(baselineEl, 'base', context, {
            fallback: getTextContent(baselineEl, ['base'], context, { required: true })
        });
        const variance = parseNumber(varianceValue, context, 'Varianz', { min: 0, max: 1000 });
        const base = parseNumber(baseValue, context, 'Basiswert', { min: -100000, max: 100000, integer: false });
        return { label, unit, variance, base };
    });
}

function parseAlertStates(root) {
    const alertsContainer = firstAvailableElement(root, ['alertStates', 'alarme']);
    if (!alertsContainer) {
        return {};
    }
    const entries = {};
    Array.from(alertsContainer.querySelectorAll('state')).forEach(stateEl => {
        const level = getAttribute(stateEl, 'level', 'Alarmzustand', { required: true });
        const label = getAttribute(stateEl, 'label', `Alarmzustand ${level}`, {
            fallback: getTextContent(stateEl, ['label', 'beschreibung'], `Alarmzustand ${level}`, { required: true })
        });
        const className = getAttribute(stateEl, 'class', `Alarmzustand ${level}`, {
            fallback: getTextContent(stateEl, ['class'], `Alarmzustand ${level}`, { fallback: 'status-idle' })
        }) || 'status-idle';
        entries[level] = { label, className };
    });
    return entries;
}

function parseInitialLog(root) {
    const logContainer = firstAvailableElement(root, ['initialLog', 'startLog']);
    if (!logContainer) {
        return [];
    }
    return Array.from(logContainer.querySelectorAll('entry')).map(entryEl => {
        const type = getAttribute(entryEl, 'type', 'Logeintrag', { fallback: 'log' });
        const message = entryEl.textContent ? entryEl.textContent.trim() : '';
        if (!message) {
            validationError('Logeintrag', 'Nachricht darf nicht leer sein.');
        }
        return { type, message };
    });
}

function parseRandomEvents(root) {
    const eventsContainer = firstAvailableElement(root, ['randomEvents', 'ereignisse']);
    if (!eventsContainer) {
        return [];
    }
    return Array.from(eventsContainer.querySelectorAll('event')).map((eventEl, index) => {
        const context = `Ereignis ${index + 1}`;
        const message = getTextContent(eventEl, ['message', 'beschreibung'], context, { required: true });
        const impact = {};
        const impactContainer = firstAvailableElement(eventEl, ['impact', 'auswirkung']);
        if (impactContainer) {
            impactContainer.querySelectorAll('system').forEach(systemImpact => {
                const target = getAttribute(systemImpact, 'id', context, { required: true });
                const valueAttr = getAttribute(systemImpact, 'delta', context, { fallback: null });
                const textValue = systemImpact.textContent ? systemImpact.textContent.trim() : null;
                const deltaSource = valueAttr ?? textValue;
                if (deltaSource === null || deltaSource === '') {
                    validationError(context, `Auswirkung für System ${target} benötigt einen numerischen Wert.`);
                }
                const delta = Number.parseFloat(deltaSource);
                if (Number.isNaN(delta)) {
                    validationError(context, `Auswirkung für System ${target} ist keine gültige Zahl.`);
                }
                impact[target] = delta;
            });
            const crewImpact = impactContainer.querySelector('crew');
            if (crewImpact) {
                impact.crew = crewImpact.getAttribute('status') || (crewImpact.textContent ? crewImpact.textContent.trim() : 'neutral');
            }
        }
        return { message, impact: Object.keys(impact).length ? impact : undefined };
    });
}

export function parseScenarioXml(xmlText) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'application/xml');
    const errorNode = doc.querySelector('parsererror');
    if (errorNode) {
        throw new Error('XML-Dokument konnte nicht geparst werden.');
    }
    const scenarioEl = firstAvailableElement(doc, ['scenario', 'szenario']);
    if (!scenarioEl) {
        throw new Error('Wurzelelement <scenario> fehlt.');
    }
    const shipEl = firstAvailableElement(scenarioEl, ['ship', 'schiff']);
    if (!shipEl) {
        throw new Error('Element <ship> fehlt.');
    }
    const ship = parseShip(shipEl);
    const systems = parseSystems(shipEl);
    const lifeSupport = parseLifeSupport(shipEl);
    const sectors = parseSectors(scenarioEl);
    const commChannels = parseCommunications(scenarioEl);
    const crew = parseCrew(scenarioEl);
    const objectives = parseObjectives(scenarioEl);
    const sensorBaselines = parseSensorBaselines(scenarioEl);
    const alertStates = parseAlertStates(scenarioEl);
    const initialLog = parseInitialLog(scenarioEl);
    const randomEvents = parseRandomEvents(scenarioEl);

    return {
        id: scenarioEl.getAttribute('id') || null,
        name: scenarioEl.getAttribute('name') || null,
        version: scenarioEl.getAttribute('version') || null,
        ship,
        systems,
        lifeSupport,
        sectors,
        commChannels,
        crew,
        objectives,
        sensorBaselines,
        alertStates,
        initialLog,
        randomEvents
    };
}

function toHex(buffer) {
    const view = new Uint8Array(buffer);
    return Array.from(view).map(byte => byte.toString(16).padStart(2, '0')).join('');
}

async function computeHash(text) {
    if (globalThis.crypto && globalThis.crypto.subtle && typeof TextEncoder !== 'undefined') {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
        return toHex(hashBuffer);
    }
    let hash = 0;
    for (let i = 0; i < text.length; i += 1) {
        hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
    }
    return `fallback-${hash}`;
}

export async function loadScenario(url) {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
        throw new Error(`HTTP ${response.status} beim Laden von ${url}`);
    }
    const text = await response.text();
    const scenario = parseScenarioXml(text);
    const hash = await computeHash(text);
    return {
        scenario,
        hash,
        source: url,
        lastModified: response.headers.get('last-modified') || null,
        raw: text
    };
}

export class ScenarioHotReloader {
    constructor(url, { interval = 5000, onUpdate, onError } = {}) {
        this.url = url;
        this.interval = interval;
        this.onUpdate = onUpdate;
        this.onError = onError;
        this.timer = null;
        this.lastHash = null;
        this.pending = false;
    }

    setBaselineHash(hash) {
        this.lastHash = hash;
    }

    start() {
        this.stop();
        this.timer = setInterval(() => {
            this.checkForUpdates();
        }, this.interval);
    }

    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    async checkForUpdates() {
        if (this.pending) {
            return;
        }
        this.pending = true;
        try {
            const result = await loadScenario(this.url);
            if (!this.lastHash || this.lastHash !== result.hash) {
                this.lastHash = result.hash;
                if (typeof this.onUpdate === 'function') {
                    this.onUpdate(result);
                }
            }
        } catch (error) {
            if (typeof this.onError === 'function') {
                this.onError(error);
            }
        } finally {
            this.pending = false;
        }
    }
}
