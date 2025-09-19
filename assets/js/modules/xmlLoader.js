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

function parseNumberOptional(value, context, label, options = {}) {
    if (value === null || value === undefined || value === '') {
        return null;
    }
    return parseNumber(value, context, label, options);
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

function parseTactical(root) {
    const tacticalEl = firstAvailableElement(root, ['tactical', 'gefecht']);
    if (!tacticalEl) {
        return null;
    }

    const contactSelector = 'contacts > contact, kontakte > kontakt';
    const contacts = Array.from(tacticalEl.querySelectorAll(contactSelector)).map((contactEl, index) => {
        const fallbackId = contactEl.getAttribute('id')
            || contactEl.getAttribute('callsign')
            || contactEl.getAttribute('name')
            || contactEl.getAttribute('type')
            || `contact-${index + 1}`;
        const context = `Taktikkontakt ${fallbackId}`;
        const id = contactEl.getAttribute('id') || fallbackId;
        const callsign = contactEl.getAttribute('callsign')
            || contactEl.getAttribute('name')
            || fallbackId;
        const type = contactEl.getAttribute('type')
            || contactEl.getAttribute('klasse')
            || 'Unbekannt';
        const attitude = (contactEl.getAttribute('attitude')
            || contactEl.getAttribute('status')
            || 'unknown').trim();
        const sectorId = contactEl.getAttribute('sector')
            || contactEl.getAttribute('sektor')
            || null;
        const stateValue = contactEl.getAttribute('state')
            || contactEl.getAttribute('zustand')
            || 'active';
        const threatValue = contactEl.getAttribute('threat')
            || contactEl.getAttribute('bedrohung')
            || '0';
        const threat = parseNumber(threatValue, context, 'Bedrohung', { min: 0, max: 100 });
        const distanceValue = contactEl.getAttribute('distance')
            || contactEl.getAttribute('distanz');
        const distanceUnit = contactEl.getAttribute('distanceUnit')
            || contactEl.getAttribute('distanzEinheit')
            || 'km';
        const distance = parseNumberOptional(distanceValue, context, 'Distanz', {
            min: 0,
            max: 100000000,
            integer: false
        });
        const hullValue = contactEl.getAttribute('hull')
            || contactEl.getAttribute('rumpf');
        const shieldsValue = contactEl.getAttribute('shields')
            || contactEl.getAttribute('schilde');
        const hull = parseNumberOptional(hullValue, context, 'Hülle', { min: 0, max: 100 });
        const shields = parseNumberOptional(shieldsValue, context, 'Schilde', { min: 0, max: 100 });
        const vector = contactEl.getAttribute('vector')
            || contactEl.getAttribute('vektor')
            || '';
        const velocity = contactEl.getAttribute('velocity')
            || contactEl.getAttribute('geschwindigkeit')
            || '';
        const bearing = contactEl.getAttribute('bearing')
            || contactEl.getAttribute('richtung')
            || '';
        const priority = contactEl.getAttribute('priority')
            || contactEl.getAttribute('prioritaet')
            || contactEl.getAttribute('priorität')
            || '';
        const objective = getTextContent(contactEl, ['objective', 'auftrag'], context, { fallback: '' });
        const lastKnown = getTextContent(contactEl, ['lastKnown', 'zuletzt'], context, { fallback: '' });
        const notes = getTextContent(contactEl, ['note', 'hinweis'], context, { fallback: '' });
        return {
            id,
            callsign,
            type,
            attitude,
            sectorId,
            state: stateValue,
            threat,
            distance,
            distanceUnit,
            hull,
            shields,
            vector,
            velocity,
            bearing,
            priority,
            objective,
            lastKnown,
            notes
        };
    });

    const weaponSelector = 'weapons > weapon, waffen > waffe';
    const weapons = Array.from(tacticalEl.querySelectorAll(weaponSelector)).map((weaponEl, index) => {
        const fallbackId = weaponEl.getAttribute('id')
            || weaponEl.getAttribute('name')
            || `weapon-${index + 1}`;
        const context = `Taktikwaffe ${fallbackId}`;
        const id = weaponEl.getAttribute('id') || fallbackId;
        const name = weaponEl.getAttribute('name') || fallbackId;
        const type = weaponEl.getAttribute('type')
            || weaponEl.getAttribute('klasse')
            || 'Unbekannt';
        const arc = weaponEl.getAttribute('arc')
            || weaponEl.getAttribute('sektor')
            || '';
        const status = weaponEl.getAttribute('status') || 'ready';
        const cooldownValue = weaponEl.getAttribute('cooldown')
            || weaponEl.getAttribute('abklingzeit')
            || '0';
        const cooldown = parseNumber(cooldownValue, context, 'Abklingzeit', { min: 0, max: 3600 });
        const damageValue = weaponEl.getAttribute('damage')
            || weaponEl.getAttribute('schaden')
            || '0';
        const damage = parseNumber(damageValue, context, 'Schaden', { min: 0, max: 10000, integer: false });
        const powerValue = weaponEl.getAttribute('powerCost')
            || weaponEl.getAttribute('power')
            || weaponEl.getAttribute('energie');
        const powerCost = parseNumberOptional(powerValue, context, 'Energiebedarf', { min: 0, max: 10000, integer: false });
        const ammoValue = weaponEl.getAttribute('ammo')
            || weaponEl.getAttribute('munition');
        const ammo = parseNumberOptional(ammoValue, context, 'Munition', { min: 0, max: 999 });
        const salvoValue = weaponEl.getAttribute('salvo')
            || weaponEl.getAttribute('salve');
        const salvo = parseNumberOptional(salvoValue, context, 'Salvengröße', { min: 1, max: 12 });
        const notes = getTextContent(weaponEl, ['note', 'hinweis'], context, { fallback: '' });
        return {
            id,
            name,
            type,
            arc,
            status,
            cooldown,
            damage,
            powerCost,
            ammo,
            salvo,
            notes
        };
    });

    const sectorSelector = 'sectors > sector, sektoren > sektor';
    const sectors = Array.from(tacticalEl.querySelectorAll(sectorSelector)).map((sectorEl, index) => {
        const fallbackId = sectorEl.getAttribute('id')
            || sectorEl.getAttribute('name')
            || `tactical-sector-${index + 1}`;
        const context = `Taktiksektor ${fallbackId}`;
        const id = sectorEl.getAttribute('id') || fallbackId;
        const name = sectorEl.getAttribute('name') || fallbackId;
        const bearing = sectorEl.getAttribute('bearing')
            || sectorEl.getAttribute('richtung')
            || '';
        const range = sectorEl.getAttribute('range')
            || sectorEl.getAttribute('reichweite')
            || '';
        const navSector = sectorEl.getAttribute('navSector')
            || sectorEl.getAttribute('nav')
            || sectorEl.getAttribute('sector')
            || null;
        const hazard = sectorEl.getAttribute('hazard')
            || sectorEl.getAttribute('gefahr')
            || '';
        const priority = sectorEl.getAttribute('priority')
            || sectorEl.getAttribute('prioritaet')
            || sectorEl.getAttribute('priorität')
            || '';
        const friendliesValue = sectorEl.getAttribute('friendlies')
            || sectorEl.getAttribute('verbuendete')
            || sectorEl.getAttribute('verbündete');
        const friendlies = parseNumberOptional(friendliesValue, context, 'Verbündete', { min: 0, max: 100 });
        const hostilesValue = sectorEl.getAttribute('hostiles')
            || sectorEl.getAttribute('feinde');
        const hostiles = parseNumberOptional(hostilesValue, context, 'Feindkontakte', { min: 0, max: 100 });
        return {
            id,
            name,
            bearing,
            range,
            navSector,
            hazard,
            priority,
            friendlies,
            hostiles
        };
    });

    return {
        contacts,
        weapons,
        sectors
    };
}


function parseScience(root) {
    const scienceEl = root.querySelector('science');
    if (!scienceEl) return null;

    const samples = Array.from(scienceEl.querySelectorAll('samples > sample')).map((sampleEl, index) => {
        const context = `Science Sample ${index + 1}`;
        const id = getAttribute(sampleEl, 'id', context, { fallback: sampleEl.getAttribute('name') || `sample-${index + 1}` });
        const name = getAttribute(sampleEl, 'name', context, {
            fallback: getTextContent(sampleEl, ['name', 'bezeichnung'], context, { required: true })
        });
        const type = getAttribute(sampleEl, 'type', context, {
            fallback: getTextContent(sampleEl, ['type', 'typ'], context, { fallback: 'Unbekannt' })
        });
        const status = getAttribute(sampleEl, 'status', context, { fallback: 'pending' });
        const assignedTo = getAttribute(sampleEl, 'assignedTo', context, {
            fallback: getTextContent(sampleEl, ['assigned', 'zugewiesen'], context, { fallback: 'Unzugewiesen' })
        });
        const progress = parseNumberOptional(sampleEl.getAttribute('progress'), context, 'Fortschritt', { min: 0, max: 100 }) ?? 0;
        const increment = parseNumberOptional(sampleEl.getAttribute('increment'), context, 'Inkrement', { min: 1, max: 40 }) ?? 10;
        const priority = getAttribute(sampleEl, 'priority', context, {
            fallback: sampleEl.getAttribute('prioritaet') || sampleEl.getAttribute('priorität') || 'Routine'
        });
        const notes = getTextContent(sampleEl, ['note', 'hinweis'], context, { fallback: '' });
        return { id, name, type, status, assignedTo, progress, increment, priority, notes };
    });

    const anomalies = Array.from(scienceEl.querySelectorAll('anomalies > anomaly')).map((anomalyEl, index) => {
        const context = `Science Anomaly ${index + 1}`;
        const id = getAttribute(anomalyEl, 'id', context, { fallback: `anomaly-${index + 1}` });
        const label = getAttribute(anomalyEl, 'label', context, {
            fallback: getTextContent(anomalyEl, ['label', 'name'], context, { required: true })
        });
        const severity = getAttribute(anomalyEl, 'severity', context, { fallback: 'low' });
        const status = getAttribute(anomalyEl, 'status', context, { fallback: 'pending' });
        const window = anomalyEl.getAttribute('window') || anomalyEl.getAttribute('fenster') || '';
        const action = getTextContent(anomalyEl, ['action', 'massnahme', 'maßnahme'], context, { fallback: '' });
        return { id, label, severity, status, window, action };
    });

    const projects = Array.from(scienceEl.querySelectorAll('projects > project')).map((projectEl, index) => {
        const context = `Science Project ${index + 1}`;
        const id = getAttribute(projectEl, 'id', context, { fallback: `project-${index + 1}` });
        const title = getAttribute(projectEl, 'title', context, {
            fallback: getTextContent(projectEl, ['title', 'name'], context, { required: true })
        });
        const lead = getAttribute(projectEl, 'lead', context, {
            fallback: getTextContent(projectEl, ['lead', 'leitung'], context, { fallback: 'Team' })
        });
        const milestone = getAttribute(projectEl, 'milestone', context, {
            fallback: getTextContent(projectEl, ['milestone', 'meilenstein'], context, { fallback: '' })
        });
        const progress = parseNumberOptional(projectEl.getAttribute('progress'), context, 'Fortschritt', { min: 0, max: 100 }) ?? 0;
        const horizon = projectEl.getAttribute('horizon') || projectEl.getAttribute('horizont') || '';
        const notes = getTextContent(projectEl, ['note', 'hinweis'], context, { fallback: '' });
        return { id, title, lead, milestone, progress, horizon, notes };
    });

    const missions = Array.from(scienceEl.querySelectorAll('missions > mission')).map((missionEl, index) => ({
        id: missionEl.getAttribute('id') || `mission-${index + 1}`,
        title: missionEl.getAttribute('title')
            || missionEl.getAttribute('name')
            || missionEl.textContent?.trim()
            || `Mission ${index + 1}`,
        verified: parseBoolean(missionEl.getAttribute('verified'))
    }));

    const markers = Array.from(scienceEl.querySelectorAll('markers > marker')).map((markerEl, index) => ({
        id: markerEl.getAttribute('id') || `marker-${index + 1}`,
        label: getAttribute(markerEl, 'label', 'Science Marker', {
            fallback: markerEl.textContent?.trim() || `Marker ${index + 1}`
        }),
        status: markerEl.getAttribute('status') || 'aktiv'
    }));

    return { samples, anomalies, projects, missions, markers };
}

function parseDamageNode(nodeEl, index, parentContext = 'Damage Node') {
    const context = `${parentContext} ${index + 1}`;
    const id = nodeEl.getAttribute('id') || `${parentContext.toLowerCase().replace(/\s+/g, '-')}-${index + 1}`;
    const name = getAttribute(nodeEl, 'name', context, {
        fallback: getTextContent(nodeEl, ['name', 'label'], context, { fallback: 'Subsystem' })
    });
    const status = (nodeEl.getAttribute('status') || 'online').toLowerCase();
    const integrity = parseNumberOptional(nodeEl.getAttribute('integrity'), context, 'Integrität', { min: 0, max: 100 }) ?? null;
    const power = parseNumberOptional(nodeEl.getAttribute('power'), context, 'Leistung', { min: 0, max: 100 }) ?? null;
    const note = getTextContent(nodeEl, ['note', 'hinweis'], context, { fallback: '' });
    const children = Array.from(nodeEl.children)
        .filter(child => child.tagName && child.tagName.toLowerCase() === 'node')
        .map((childNode, childIndex) => parseDamageNode(childNode, childIndex, `${name}`));
    return { id, name, status, integrity, power, note, children };
}

function parseDamageControl(root) {
    const damageEl = root.querySelector('damageControl');
    if (!damageEl) return null;

    const reports = Array.from(damageEl.querySelectorAll('reports > report')).map((reportEl, index) => ({
        id: reportEl.getAttribute('id') || `damage-report-${index + 1}`,
        system: getAttribute(reportEl, 'system', 'Damage Report', {
            fallback: 'System'
        }),
        location: reportEl.getAttribute('location') || reportEl.getAttribute('position') || '',
        severity: (reportEl.getAttribute('severity') || 'minor').toLowerCase(),
        status: (reportEl.getAttribute('status') || 'queued').toLowerCase(),
        eta: reportEl.getAttribute('eta') || '',
        note: getTextContent(reportEl, ['note', 'hinweis'], 'Damage Report', { fallback: '' })
    }));

    const systemNodes = Array.from(damageEl.querySelectorAll('systems > node')).map((nodeEl, index) =>
        parseDamageNode(nodeEl, index)
    );

    const bypasses = Array.from(damageEl.querySelectorAll('bypasses > bypass')).map((bypassEl, index) => ({
        id: bypassEl.getAttribute('id') || `bypass-${index + 1}`,
        description: getAttribute(bypassEl, 'description', 'Damage Bypass', {
            fallback: getTextContent(bypassEl, ['description', 'text'], 'Damage Bypass', { required: true })
        }),
        owner: bypassEl.getAttribute('owner') || bypassEl.getAttribute('team') || '',
        status: (bypassEl.getAttribute('status') || 'planned').toLowerCase(),
        eta: bypassEl.getAttribute('eta') || '',
        note: getTextContent(bypassEl, ['note', 'hinweis'], 'Damage Bypass', { fallback: '' })
    }));

    const repairs = Array.from(damageEl.querySelectorAll('repairs > order')).map((orderEl, index) => ({
        id: orderEl.getAttribute('id') || `repair-${index + 1}`,
        label: getAttribute(orderEl, 'label', 'Repair Order', {
            fallback: getTextContent(orderEl, ['label', 'name'], 'Repair Order', { required: true })
        }),
        system: orderEl.getAttribute('system') || '',
        team: orderEl.getAttribute('team') || orderEl.getAttribute('crew') || '',
        status: (orderEl.getAttribute('status') || 'queued').toLowerCase(),
        eta: orderEl.getAttribute('eta') || '',
        parts: Array.from(orderEl.querySelectorAll('parts > part')).map((partEl, partIndex) => ({
            id: partEl.getAttribute('id') || `repair-part-${index + 1}-${partIndex + 1}`,
            name: getAttribute(partEl, 'name', 'Repair Part', {
                fallback: getTextContent(partEl, ['name', 'label'], 'Repair Part', { fallback: 'Teil' })
            }),
            quantity: partEl.getAttribute('quantity') || partEl.getAttribute('qty') || ''
        }))
    }));

    return { reports, systems: systemNodes, bypasses, repairs };
}

function parseCargo(root) {
    const cargoEl = root.querySelector('cargo');
    if (!cargoEl) return null;
    const summaryEl = cargoEl.querySelector('summary');
    const summary = summaryEl
        ? {
            totalMass: parseNumberOptional(summaryEl.getAttribute('mass') ?? summaryEl.getAttribute('masse'), 'Cargo Summary', 'Masse', { min: 0, max: 10000 }) ?? 0,
            capacity: parseNumberOptional(summaryEl.getAttribute('capacity'), 'Cargo Summary', 'Kapazität', { min: 1, max: 10000 }) ?? 1,
            balance: summaryEl.getAttribute('balance') || summaryEl.getAttribute('balanceStatus') || 'Ausbalanciert',
            balanceStatus: summaryEl.getAttribute('balanceStatus') || 'status-online',
            hazardCount: parseNumberOptional(summaryEl.getAttribute('hazards') ?? summaryEl.getAttribute('gefahrgut'), 'Cargo Summary', 'Gefahrgut', { min: 0, max: 20 }) ?? 0,
            fuelMargin: parseNumberOptional(summaryEl.getAttribute('fuelMargin') ?? summaryEl.getAttribute('treibstoff'), 'Cargo Summary', 'Treibstoff', { min: 0, max: 100 }) ?? 0,
            massVector: summaryEl.getAttribute('massVector') || summaryEl.getAttribute('schwerpunkt') || '0/0/0'
        }
        : null;
    const holds = Array.from(cargoEl.querySelectorAll('holds > hold')).map((holdEl, index) => {
        const context = `Cargo Hold ${index + 1}`;
        return {
            id: holdEl.getAttribute('id') || `hold-${index + 1}`,
            name: getAttribute(holdEl, 'name', context, {
                fallback: getTextContent(holdEl, ['name', 'label'], context, { required: true })
            }),
            occupancy: parseNumberOptional(holdEl.getAttribute('occupancy'), context, 'Belegung', { min: 0, max: 100 }) ?? 0,
            capacity: parseNumberOptional(holdEl.getAttribute('capacity'), context, 'Kapazität', { min: 0, max: 1000 }) ?? 0,
            mass: parseNumberOptional(holdEl.getAttribute('mass') ?? holdEl.getAttribute('masse'), context, 'Masse', { min: 0, max: 1000 }) ?? 0,
            hazard: parseBoolean(holdEl.getAttribute('hazard') || holdEl.getAttribute('gefahr')),
            note: getTextContent(holdEl, ['note', 'hinweis'], context, { fallback: '' })
        };
    });
    const logistics = Array.from(cargoEl.querySelectorAll('logistics > task')).map((taskEl, index) => ({
        id: taskEl.getAttribute('id') || `cargo-task-${index + 1}`,
        description: getAttribute(taskEl, 'description', 'Cargo Task', {
            fallback: getTextContent(taskEl, ['description', 'text'], 'Cargo Task', { required: true })
        }),
        window: taskEl.getAttribute('window') || '',
        status: taskEl.getAttribute('status') || 'pending',
        assignedTo: taskEl.getAttribute('assignedTo') || taskEl.getAttribute('team') || 'Cargo'
    }));
    return { summary, holds, logistics };
}

function parseFabrication(root) {
    const fabricationEl = root.querySelector('fabrication');
    if (!fabricationEl) return null;
    const queue = Array.from(fabricationEl.querySelectorAll('queue > job')).map((jobEl, index) => ({
        id: jobEl.getAttribute('id') || `job-${index + 1}`,
        label: getAttribute(jobEl, 'label', 'Fabrication Job', {
            fallback: getTextContent(jobEl, ['label', 'name'], 'Fabrication Job', { required: true })
        }),
        type: jobEl.getAttribute('type') || jobEl.getAttribute('klasse') || 'Allgemein',
        status: jobEl.getAttribute('status') || 'queued',
        eta: jobEl.getAttribute('eta') || '',
        priority: jobEl.getAttribute('priority') || 'Routine'
    }));
    const kits = Array.from(fabricationEl.querySelectorAll('kits > kit')).map((kitEl, index) => ({
        id: kitEl.getAttribute('id') || `kit-${index + 1}`,
        label: getAttribute(kitEl, 'label', 'Fabrication Kit', {
            fallback: getTextContent(kitEl, ['label', 'name'], 'Fabrication Kit', { required: true })
        }),
        stock: parseNumberOptional(kitEl.getAttribute('stock'), 'Fabrication Kit', 'Bestand', { min: 0, max: 100 }) ?? 0,
        status: kitEl.getAttribute('status') || 'ok',
        threshold: parseNumberOptional(kitEl.getAttribute('threshold'), 'Fabrication Kit', 'Schwelle', { min: 0, max: 100 }) ?? null
    }));
    const consumables = Array.from(fabricationEl.querySelectorAll('consumables > item')).map((itemEl, index) => ({
        id: itemEl.getAttribute('id') || `consumable-${index + 1}`,
        label: getAttribute(itemEl, 'label', 'Consumable', {
            fallback: getTextContent(itemEl, ['label', 'name'], 'Consumable', { required: true })
        }),
        stock: parseNumberOptional(itemEl.getAttribute('stock'), 'Consumable', 'Bestand', { min: 0, max: 1000 }) ?? 0,
        threshold: parseNumberOptional(itemEl.getAttribute('threshold'), 'Consumable', 'Schwelle', { min: 0, max: 1000 }) ?? null,
        unit: itemEl.getAttribute('unit') || itemEl.getAttribute('einheit') || ''
    }));
    return { queue, kits, consumables };
}

function parseMedical(root) {
    const medicalEl = root.querySelector('medical');
    if (!medicalEl) return null;
    const roster = Array.from(medicalEl.querySelectorAll('roster > patient')).map((patientEl, index) => ({
        id: patientEl.getAttribute('id') || `patient-${index + 1}`,
        name: getAttribute(patientEl, 'name', 'Medical Patient', {
            fallback: getTextContent(patientEl, ['name'], 'Medical Patient', { required: true })
        }),
        status: patientEl.getAttribute('status') || 'stabil',
        vitals: patientEl.getAttribute('vitals') || patientEl.getAttribute('werte') || '',
        treatment: patientEl.getAttribute('treatment') || patientEl.getAttribute('behandlung') || '',
        priority: patientEl.getAttribute('priority') || patientEl.getAttribute('prioritaet') || patientEl.getAttribute('priorität') || 'Routine'
    }));
    const resources = Array.from(medicalEl.querySelectorAll('resources > item')).map((itemEl, index) => ({
        id: itemEl.getAttribute('id') || `med-resource-${index + 1}`,
        label: getAttribute(itemEl, 'label', 'Medical Resource', {
            fallback: getTextContent(itemEl, ['label', 'name'], 'Medical Resource', { required: true })
        }),
        stock: itemEl.getAttribute('stock') || itemEl.getAttribute('bestand') || '0',
        status: itemEl.getAttribute('status') || 'ok'
    }));
    const quarantineEl = medicalEl.querySelector('quarantine');
    const quarantine = quarantineEl
        ? {
            status: quarantineEl.getAttribute('status') || 'frei',
            countdown: quarantineEl.getAttribute('countdown') || '',
            note: getTextContent(quarantineEl, ['note', 'hinweis'], 'Medical Quarantine', { fallback: '' })
        }
        : null;
    return { roster, resources, quarantine };
}

function parseSecurity(root) {
    const securityEl = root.querySelector('security');
    if (!securityEl) return null;
    const roles = Array.from(securityEl.querySelectorAll('roles > role')).map((roleEl, index) => ({
        id: roleEl.getAttribute('id') || `role-${index + 1}`,
        name: getAttribute(roleEl, 'name', 'Security Role', {
            fallback: getTextContent(roleEl, ['name', 'label'], 'Security Role', { required: true })
        }),
        permissions: Array.from(roleEl.querySelectorAll('permission')).map(el => el.textContent.trim()).filter(Boolean),
        critical: Array.from(roleEl.querySelectorAll('critical')).map(el => el.textContent.trim()).filter(Boolean),
        clearance: roleEl.getAttribute('clearance') || roleEl.getAttribute('freigabe') || 'Standard'
    }));
    const authorizations = Array.from(securityEl.querySelectorAll('authorizations > authorization')).map((authEl, index) => ({
        id: authEl.getAttribute('id') || `auth-${index + 1}`,
        action: getAttribute(authEl, 'action', 'Authorization', {
            fallback: getTextContent(authEl, ['action', 'name'], 'Authorization', { required: true })
        }),
        station: authEl.getAttribute('station') || '',
        requestedBy: authEl.getAttribute('requestedBy') || authEl.getAttribute('angefordertVon') || '',
        status: authEl.getAttribute('status') || 'pending',
        requires: authEl.getAttribute('requires') || authEl.getAttribute('erfordert') || '',
        note: getTextContent(authEl, ['note', 'hinweis'], 'Authorization', { fallback: '' })
    }));
    const audit = Array.from(securityEl.querySelectorAll('audit > entry')).map((entryEl, index) => ({
        id: entryEl.getAttribute('id') || `audit-${index + 1}`,
        message: entryEl.textContent?.trim() || '',
        timestamp: entryEl.getAttribute('timestamp') || entryEl.getAttribute('zeit') || ''
    }));
    return { roles, authorizations, audit };
}

function parseStations(root) {
    return Array.from(root.querySelectorAll('stations > station')).map((stationEl, index) => ({
        id: stationEl.getAttribute('id') || `station-${index + 1}`,
        role: getAttribute(stationEl, 'role', 'Station', {
            fallback: getTextContent(stationEl, ['role', 'name'], 'Station', { required: true })
        }),
        focus: Array.from(stationEl.querySelectorAll('focus > item')).map(el => el.textContent.trim()).filter(Boolean),
        status: stationEl.getAttribute('status') || 'bereit',
        readiness: parseNumberOptional(stationEl.getAttribute('readiness') || stationEl.getAttribute('bereit'), 'Station', 'Readiness', { min: 0, max: 100 }) ?? 0,
        crew: stationEl.getAttribute('crew') || stationEl.getAttribute('besatzung') || ''
    }));
}

function parseProcedures(root) {
    return Array.from(root.querySelectorAll('procedures > procedure')).map((procEl, index) => ({
        id: procEl.getAttribute('id') || `procedure-${index + 1}`,
        name: getAttribute(procEl, 'name', 'Procedure', {
            fallback: getTextContent(procEl, ['name', 'label'], 'Procedure', { required: true })
        }),
        steps: Array.from(procEl.querySelectorAll('step')).map((stepEl, stepIndex) => ({
            id: stepEl.getAttribute('id') || `step-${index + 1}-${stepIndex + 1}`,
            label: stepEl.textContent?.trim() || `Schritt ${stepIndex + 1}`,
            completed: parseBoolean(stepEl.getAttribute('completed')),
            optional: parseBoolean(stepEl.getAttribute('optional'))
        }))
    }));
}

function parseBriefing(root) {
    const briefingEl = root.querySelector('briefing');
    if (!briefingEl) return null;
    const markers = Array.from(briefingEl.querySelectorAll('markers > marker')).map((markerEl, index) => ({
        id: markerEl.getAttribute('id') || `briefing-marker-${index + 1}`,
        label: getAttribute(markerEl, 'label', 'Briefing Marker', {
            fallback: markerEl.textContent?.trim() || `Marker ${index + 1}`
        }),
        status: markerEl.getAttribute('status') || 'aktiv'
    }));
    const summary = getTextContent(briefingEl, ['summary', 'zusammenfassung'], 'Briefing', { fallback: '' });
    const report = Array.from(briefingEl.querySelectorAll('report > entry')).map((entryEl, index) => ({
        id: entryEl.getAttribute('id') || `report-${index + 1}`,
        title: getAttribute(entryEl, 'title', 'Briefing Report', {
            fallback: getTextContent(entryEl, ['title', 'name'], 'Briefing Report', { fallback: `Entscheidung ${index + 1}` })
        }),
        decision: entryEl.getAttribute('decision') || entryEl.getAttribute('entscheidung') || '',
        outcome: entryEl.getAttribute('outcome') || entryEl.getAttribute('ergebnis') || ''
    }));
    return { markers, summary, report };
}

function parseDirector(root) {
    const directorEl = root.querySelector('director') || root.querySelector('scenarioDirector');
    if (!directorEl) return null;
    const phases = Array.from(directorEl.querySelectorAll('phases > phase')).map((phaseEl, index) => ({
        id: phaseEl.getAttribute('id') || `phase-${index + 1}`,
        name: getAttribute(phaseEl, 'name', 'Phase', {
            fallback: getTextContent(phaseEl, ['name', 'label'], 'Phase', { required: true })
        }),
        status: phaseEl.getAttribute('status') || 'pending'
    }));
    const triggers = Array.from(directorEl.querySelectorAll('triggers > trigger')).map((triggerEl, index) => {
        const id = triggerEl.getAttribute('id') || `trigger-${index + 1}`;
        const name = getAttribute(triggerEl, 'name', 'Trigger', {
            fallback: getTextContent(triggerEl, ['name', 'label'], 'Trigger', { required: true })
        });
        const conditionEl = triggerEl.querySelector('condition');
        const condition = conditionEl
            ? {
                type: conditionEl.getAttribute('type') || 'manual',
                level: conditionEl.getAttribute('level') || null,
                id: conditionEl.getAttribute('objective') || conditionEl.getAttribute('phase') || conditionEl.getAttribute('id') || null
            }
            : { type: 'manual' };
        const actions = Array.from(triggerEl.querySelectorAll('action')).map(actionEl => ({
            type: actionEl.getAttribute('type') || 'log',
            id: actionEl.getAttribute('id') || null,
            level: actionEl.getAttribute('level') || null,
            behavior: actionEl.getAttribute('behavior') || null,
            message: actionEl.textContent?.trim() || actionEl.getAttribute('message') || ''
        }));
        return {
            id,
            name,
            condition,
            actions,
            status: triggerEl.getAttribute('status') || 'armed',
            auto: parseBoolean(triggerEl.getAttribute('auto'))
        };
    });
    return { phases, triggers };
}

function parseEncounters(root) {
    return Array.from(root.querySelectorAll('encounters > encounter')).map((encounterEl, index) => ({
        id: encounterEl.getAttribute('id') || `encounter-${index + 1}`,
        callsign: encounterEl.getAttribute('callsign') || getTextContent(encounterEl, ['callsign', 'name'], 'Encounter', { fallback: `Encounter ${index + 1}` }),
        behavior: encounterEl.getAttribute('behavior') || 'neutral',
        morale: encounterEl.getAttribute('morale') || 'stabil',
        target: encounterEl.getAttribute('target') || '',
        contactId: encounterEl.getAttribute('contactId') || null,
        status: encounterEl.getAttribute('status') || 'idle'
    }));
}

function parseTelemetry(root) {
    const telemetryEl = root.querySelector('telemetry');
    if (!telemetryEl) return null;
    const metrics = Array.from(telemetryEl.querySelectorAll('metrics > metric')).map((metricEl, index) => ({
        id: metricEl.getAttribute('id') || `metric-${index + 1}`,
        label: getAttribute(metricEl, 'label', 'Telemetry Metric', {
            fallback: getTextContent(metricEl, ['label', 'name'], 'Telemetry Metric', { required: true })
        }),
        value: parseNumberOptional(metricEl.getAttribute('value'), 'Telemetry Metric', 'Wert', { min: 0, max: 10000 }) ?? 0,
        unit: metricEl.getAttribute('unit') || metricEl.getAttribute('einheit') || '',
        trend: metricEl.getAttribute('trend') || 'stabil'
    }));
    const events = Array.from(telemetryEl.querySelectorAll('events > event')).map((eventEl, index) => ({
        id: eventEl.getAttribute('id') || `telemetry-${index + 1}`,
        message: eventEl.textContent?.trim() || '',
        timestamp: eventEl.getAttribute('timestamp') || eventEl.getAttribute('zeit') || ''
    }));
    const paused = parseBoolean(telemetryEl.getAttribute('paused'));
    return { metrics, events, paused };
}

function parseFaults(root) {
    const faultsEl = root.querySelector('faults');
    if (!faultsEl) return null;
    const templates = Array.from(faultsEl.querySelectorAll('templates > fault')).map((faultEl, index) => ({
        id: faultEl.getAttribute('id') || `fault-${index + 1}`,
        label: getAttribute(faultEl, 'label', 'Fault Template', {
            fallback: getTextContent(faultEl, ['label', 'name'], 'Fault Template', { required: true })
        }),
        description: getTextContent(faultEl, ['description', 'beschreibung'], 'Fault Template', { fallback: '' }),
        target: faultEl.getAttribute('target') || 'system'
    }));
    const active = Array.from(faultsEl.querySelectorAll('active > fault')).map((faultEl, index) => ({
        id: faultEl.getAttribute('id') || `active-fault-${index + 1}`,
        label: getAttribute(faultEl, 'label', 'Active Fault', {
            fallback: getTextContent(faultEl, ['label', 'name'], 'Active Fault', { fallback: `Fault ${index + 1}` })
        }),
        target: faultEl.getAttribute('target') || 'system',
        severity: faultEl.getAttribute('severity') || 'minor'
    }));
    return { templates, active };
}

function parseLarp(root) {
    const larpEl = root.querySelector('larp');
    if (!larpEl) return null;
    const parameters = Array.from(larpEl.querySelectorAll('parameters > parameter')).map((paramEl, index) => ({
        id: paramEl.getAttribute('id') || `param-${index + 1}`,
        label: getAttribute(paramEl, 'label', 'Parameter', {
            fallback: getTextContent(paramEl, ['label', 'name'], 'Parameter', { required: true })
        }),
        value: parseNumberOptional(paramEl.getAttribute('value'), 'Parameter', 'Wert', { min: 0, max: 100 }) ?? 0,
        min: parseNumberOptional(paramEl.getAttribute('min'), 'Parameter', 'Minimum', { min: -1000, max: 1000 }) ?? 0,
        max: parseNumberOptional(paramEl.getAttribute('max'), 'Parameter', 'Maximum', { min: -1000, max: 1000 }) ?? 100,
        step: parseNumberOptional(paramEl.getAttribute('step'), 'Parameter', 'Step', { min: 1, max: 100 }) ?? 5
    }));
    const cues = Array.from(larpEl.querySelectorAll('cues > cue')).map((cueEl, index) => ({
        id: cueEl.getAttribute('id') || `cue-${index + 1}`,
        label: getAttribute(cueEl, 'label', 'Cue', {
            fallback: getTextContent(cueEl, ['label', 'name'], 'Cue', { fallback: `Cue ${index + 1}` })
        }),
        message: cueEl.textContent?.trim() || cueEl.getAttribute('message') || ''
    }));
    const fogLevel = parseNumberOptional(larpEl.getAttribute('fog'), 'LARP', 'Fog of War', { min: 0, max: 100 }) ?? 25;
    return { parameters, cues, fogLevel };
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
    const tactical = parseTactical(scenarioEl);
    const science = parseScience(scenarioEl);
    const damageControl = parseDamageControl(scenarioEl);
    const cargo = parseCargo(scenarioEl);
    const fabrication = parseFabrication(scenarioEl);
    const medical = parseMedical(scenarioEl);
    const security = parseSecurity(scenarioEl);
    const stations = parseStations(scenarioEl);
    const procedures = parseProcedures(scenarioEl);
    const briefing = parseBriefing(scenarioEl);
    const director = parseDirector(scenarioEl);
    const encounters = parseEncounters(scenarioEl);
    const telemetry = parseTelemetry(scenarioEl);
    const faults = parseFaults(scenarioEl);
    const larp = parseLarp(scenarioEl);

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
        randomEvents,
        tactical,
        damageControl,
        science,
        cargo,
        fabrication,
        medical,
        security,
        stations,
        procedures,
        briefing,
        director,
        encounters,
        telemetry,
        faults,
        larp
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
