const SCENARIO_URL = new URL('../data/scenario-default.xml', import.meta.url).href;
let scenarioPromise = null;

const FALLBACK_SCENARIO_DATA = {
    systems: [
        {
            id: 'life-support',
            name: 'Lebenserhaltung',
            status: 'online',
            power: 75,
            integrity: 96,
            load: 35,
            description: 'Verantwortlich für Atmosphärenkontrolle, Temperatur und Recycling.',
            redundancy: 'Doppelt redundant',
            lastService: 'Stardate 4521.4'
        },
        {
            id: 'engines',
            name: 'Antrieb',
            status: 'online',
            power: 80,
            integrity: 89,
            load: 62,
            description: 'Fusionstriebwerke für Unterlicht- und Überlichtreisen.',
            redundancy: 'Primär + Hilfsaggregat',
            lastService: 'Stardate 4519.1'
        },
        {
            id: 'shields',
            name: 'Schilde',
            status: 'idle',
            power: 60,
            integrity: 72,
            load: 44,
            description: 'Defensives Deflektorfeld gegen Projektil- und Energieangriffe.',
            redundancy: 'Segmentiert in 6 Quadranten',
            lastService: 'Stardate 4515.7'
        },
        {
            id: 'weapons',
            name: 'Waffensysteme',
            status: 'idle',
            power: 45,
            integrity: 88,
            load: 20,
            description: 'Phaserbänke und Torpedowerfer.',
            redundancy: 'Autarkes Backup-Steuerungssystem',
            lastService: 'Stardate 4510.9'
        },
        {
            id: 'communications',
            name: 'Kommunikation',
            status: 'online',
            power: 35,
            integrity: 94,
            load: 28,
            description: 'Langstrecken- und Kurzstreckentransmitter.',
            redundancy: 'Triangulierte Relaisstationen',
            lastService: 'Stardate 4520.2'
        },
        {
            id: 'sensors',
            name: 'Sensoren',
            status: 'online',
            power: 55,
            integrity: 91,
            load: 47,
            description: 'Aktive und passive Arrays für wissenschaftliche und taktische Daten.',
            redundancy: 'Adaptive Netzstruktur',
            lastService: 'Stardate 4522.6'
        },
        {
            id: 'science',
            name: 'Wissenschaftslabore',
            status: 'online',
            power: 40,
            integrity: 99,
            load: 32,
            description: 'Labore zur Probenanalyse, Forschung und Datenverarbeitung.',
            redundancy: 'Dedizierter Notstromkreis',
            lastService: 'Stardate 4518.4'
        },
        {
            id: 'medical',
            name: 'Medizinische Abteilung',
            status: 'online',
            power: 30,
            integrity: 97,
            load: 18,
            description: 'MedBay mit Autodoc, Quarantäne und Nanitenversorgung.',
            redundancy: 'Mobiles Feldhospital verfügbar',
            lastService: 'Stardate 4523.3'
        }
    ],
    damageControl: {
        reports: [
            {
                id: 'report-dorsal-array',
                system: 'Sensor-Array',
                location: 'Deck 4 – Dorsaler Träger',
                severity: 'major',
                status: 'in-progress',
                eta: '00:22',
                note: 'Plasmafackel beschädigte Verkabelung, Leistung auf 60% begrenzt.'
            },
            {
                id: 'report-cargo-breach',
                system: 'Frachtraum 2',
                location: 'Sektion 12 – Außenhaut',
                severity: 'moderate',
                status: 'stabilized',
                eta: '00:08',
                note: 'Notversiegelung aktiv, Druck stabil. EVA-Team unterwegs.'
            },
            {
                id: 'report-conduit',
                system: 'EPS-Leitung',
                location: 'Maschinenraum Leitungsfeld',
                severity: 'minor',
                status: 'queued',
                eta: '00:30',
                note: 'Überhitzung festgestellt, Last auf Aux-Kreis umgeleitet.'
            }
        ],
        systems: [
            {
                id: 'tree-reactor',
                name: 'Reaktorkern',
                status: 'online',
                integrity: 93,
                power: 82,
                note: 'Plasmafluss stabil.',
                children: [
                    {
                        id: 'tree-injectors',
                        name: 'Plasma-Injektoren',
                        status: 'warning',
                        integrity: 71,
                        power: 64,
                        note: 'Injektor 3 zeigt Schwingungen.'
                    },
                    {
                        id: 'tree-containment',
                        name: 'Containment-Feld',
                        status: 'online',
                        integrity: 96,
                        power: 78,
                        note: 'Feldphase synchron.'
                    }
                ]
            },
            {
                id: 'tree-structural',
                name: 'Strukturraster',
                status: 'warning',
                integrity: 68,
                note: 'Segment D5 unter Beobachtung.',
                children: [
                    {
                        id: 'tree-hull-d5',
                        name: 'Außenhülle D5',
                        status: 'critical',
                        integrity: 42,
                        note: 'Patch angebracht, Druck fällt langsam.'
                    },
                    {
                        id: 'tree-rib-delta',
                        name: 'Verstrebung Delta',
                        status: 'offline',
                        integrity: 0,
                        note: 'Notstütze erforderlich.'
                    }
                ]
            }
        ],
        bypasses: [
            {
                id: 'bypass-life-support',
                description: 'Lebenserhaltung auf Reservekreis umschalten',
                owner: 'Team Beta',
                status: 'engaged',
                eta: 'laufend',
                note: 'Druckwerte stabil, Monitoring aktiv.'
            },
            {
                id: 'bypass-eps',
                description: 'EPS-Leitung 4B über Hilfsbus führen',
                owner: 'Team Alpha',
                status: 'planned',
                eta: '00:12',
                note: 'Freigabe durch Engineering ausstehend.'
            }
        ],
        repairs: [
            {
                id: 'repair-hull',
                label: 'Hüllenpatch D5',
                system: 'Struktur',
                team: 'EVA Team 1',
                status: 'active',
                eta: '00:18',
                parts: [
                    { id: 'part-nano', name: 'Nanopolymer-Patch', quantity: 2 },
                    { id: 'part-brace', name: 'Verstrebung Typ C', quantity: 1 }
                ]
            },
            {
                id: 'repair-array',
                label: 'Sensor-Array neu ausrichten',
                system: 'Sensorik',
                team: 'Decktrupp 3',
                status: 'queued',
                eta: '00:25',
                parts: [{ id: 'part-emitter', name: 'Emitter Cluster', quantity: 3 }]
            }
        ],
        conduits: [
            {
                id: 'conduit-eps-a',
                name: 'EPS-Hauptbus A',
                status: 'warning',
                load: 82,
                capacity: 110,
                integrity: 88,
                route: 'Maschinenraum → Deck 5 → Bug',
                note: 'Segment Deck 5 isoliert, Leistungsabfall wird überwacht.',
                switches: [
                    {
                        id: 'switch-breaker-d5',
                        type: 'breaker',
                        label: 'Deck 5 Breaker',
                        state: 'closed',
                        critical: true
                    },
                    {
                        id: 'switch-bypass-5b',
                        type: 'valve',
                        label: 'Bypass 5B',
                        state: 'open'
                    }
                ]
            },
            {
                id: 'conduit-life-support',
                name: 'Lebenserhaltung Verteiler',
                status: 'online',
                load: 56,
                capacity: 95,
                integrity: 92,
                route: 'Deck 3 → Habitat-Ring → MedBay',
                note: 'Reservekreis Beta aktiv.',
                switches: [
                    {
                        id: 'switch-filter-bank-a',
                        type: 'valve',
                        label: 'Filterbank A Ventil',
                        state: 'open'
                    },
                    {
                        id: 'switch-filter-bank-b',
                        type: 'valve',
                        label: 'Filterbank B Ventil',
                        state: 'closed'
                    }
                ]
            },
            {
                id: 'conduit-aux-power',
                name: 'Aux-Energieverteiler',
                status: 'warning',
                load: 44,
                capacity: 80,
                integrity: 74,
                route: 'Maschinenraum Hilfsgang → Wissenschaftssektion',
                note: 'EPS 4B läuft über Hilfsbus – Temperatur beobachten.',
                switches: [
                    {
                        id: 'switch-aux-relay',
                        type: 'relay',
                        label: 'Aux-Relay 4B',
                        state: 'engaged',
                        critical: true
                    }
                ]
            }
        ],
        inventory: [
            {
                id: 'stock-nano',
                name: 'Nanopolymer-Patches',
                quantity: 7,
                capacity: 12,
                threshold: 4,
                status: 'warning',
                note: 'Lieferung vom Depot angefordert.'
            },
            {
                id: 'stock-brace',
                name: 'Verstrebung Typ C',
                quantity: 3,
                capacity: 6,
                threshold: 2,
                status: 'success'
            },
            {
                id: 'stock-eps',
                name: 'EPS-Koppler',
                quantity: 14,
                capacity: 20,
                threshold: 8,
                status: 'success'
            }
        ]
    },
    lifeSupport: {
        sections: [
            {
                id: 'bridge',
                name: 'Brücke',
                pressure: 101.3,
                pressureUnit: 'kPa',
                temperature: 21.8,
                temperatureUnit: '°C',
                humidity: 41,
                status: 'stabil'
            },
            {
                id: 'engineering',
                name: 'Maschinenraum',
                pressure: 100.9,
                pressureUnit: 'kPa',
                temperature: 23.4,
                temperatureUnit: '°C',
                humidity: 45,
                status: 'stabil'
            },
            {
                id: 'habitat',
                name: 'Habitat-Ring',
                pressure: 101,
                pressureUnit: 'kPa',
                temperature: 22.6,
                temperatureUnit: '°C',
                humidity: 42,
                status: 'stabil'
            },
            {
                id: 'medbay',
                name: 'MedBay',
                pressure: 101.5,
                pressureUnit: 'kPa',
                temperature: 21.1,
                temperatureUnit: '°C',
                humidity: 38,
                status: 'stabil'
            },
            {
                id: 'cargo',
                name: 'Frachtraum',
                pressure: 100.6,
                pressureUnit: 'kPa',
                temperature: 20.9,
                temperatureUnit: '°C',
                humidity: 36,
                status: 'stabil'
            },
            {
                id: 'shuttle-bay',
                name: 'Shuttle-Bucht',
                pressure: 99.8,
                pressureUnit: 'kPa',
                temperature: 19.8,
                temperatureUnit: '°C',
                humidity: 33,
                status: 'überwachung'
            }
        ],
        leaks: [
            {
                id: 'cargo-outer',
                location: 'Frachtraum 2 – Außenhaut',
                severity: 'gering',
                status: 'versiegelt',
                progress: 100,
                note: 'Nanopolymer-Patch hält, Monitoring aktiv.'
            },
            {
                id: 'deck-5',
                location: 'Deck 5 – Wartungsschacht',
                severity: 'spur',
                status: 'analyse läuft',
                progress: 18,
                note: 'Sensorcluster 4 meldet leichte Druckfluktuation.'
            }
        ],
        filters: {
            reserveAirMinutes: 640,
            scrubberMarginMinutes: 180,
            emergencyBufferMinutes: 240,
            banks: [
                {
                    id: 'primary',
                    label: 'Filterbank A',
                    status: 'aktiv',
                    saturation: 34,
                    saturationUnit: '%',
                    timeBuffer: 540,
                    timeBufferUnit: 'min'
                },
                {
                    id: 'secondary',
                    label: 'Filterbank B',
                    status: 'bereit',
                    saturation: 12,
                    saturationUnit: '%',
                    timeBuffer: 780,
                    timeBufferUnit: 'min'
                },
                {
                    id: 'reserve',
                    label: 'Reservekassetten',
                    status: 'standby',
                    saturation: 3,
                    saturationUnit: '%',
                    timeBuffer: 1020,
                    timeBufferUnit: 'min'
                }
            ]
        }
    }
};

function cloneFallbackScenarioData() {
    if (typeof structuredClone === 'function') {
        return structuredClone(FALLBACK_SCENARIO_DATA);
    }
    return JSON.parse(JSON.stringify(FALLBACK_SCENARIO_DATA));
}

export async function loadScenarioData() {
    if (!scenarioPromise) {
        scenarioPromise = fetchScenarioWithFallback();
    }
    return scenarioPromise;
}

async function fetchScenarioWithFallback() {
    try {
        const response = await fetch(SCENARIO_URL);
        if (!response.ok) {
            throw new Error(`Szenariodatei konnte nicht geladen werden (Status ${response.status})`);
        }
        const text = await response.text();
        return parseScenarioXml(text);
    } catch (error) {
        console.warn('Szenariodatei konnte nicht geladen werden, Fallback-Daten werden verwendet.', error);
        return cloneFallbackScenarioData();
    }
}

function parseScenarioXml(xmlText) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'application/xml');
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
        const message = parseError.textContent?.trim() ?? 'Unbekannter Parserfehler';
        throw new Error(`Szenario konnte nicht gelesen werden: ${message}`);
    }

    return {
        systems: parseSystems(doc),
        damageControl: parseDamageControl(doc),
        lifeSupport: parseLifeSupport(doc)
    };
}

function parseSystems(doc) {
    const systemsRoot = doc.querySelector('scenario > ship > systems');
    if (!systemsRoot) {
        return [];
    }

    return Array.from(systemsRoot.children)
        .filter((child) => isTag(child, 'system'))
        .map((systemEl) => ({
            id: systemEl.getAttribute('id') || null,
            name: systemEl.getAttribute('name') || getChildText(systemEl, ['name', 'bezeichnung']) || '',
            status: (getChildText(systemEl, 'status') || systemEl.getAttribute('status') || '').toLowerCase(),
            power: toNumber(getChildText(systemEl, 'power')),
            integrity: toNumber(getChildText(systemEl, ['integrity', 'integritaet'])),
            load: toNumber(getChildText(systemEl, 'load')),
            description: getChildText(systemEl, ['beschreibung', 'description']) || '',
            redundancy: getChildText(systemEl, ['redundanz', 'redundancy']) || '',
            lastService: getChildText(systemEl, ['letztewartung', 'letzteWartung', 'lastservice']) || ''
        }));
}

function parseDamageControl(doc) {
    const damageRoot = doc.querySelector('scenario > damageControl');
    if (!damageRoot) {
        return { reports: [], systems: [], bypasses: [], repairs: [], conduits: [], inventory: [] };
    }

    const reports = Array.from(damageRoot.querySelectorAll('reports > report')).map((reportEl) => ({
        id: reportEl.getAttribute('id') || null,
        system: reportEl.getAttribute('system') || '',
        location: reportEl.getAttribute('location') || '',
        severity: safeLower(reportEl.getAttribute('severity')),
        status: safeLower(reportEl.getAttribute('status')),
        eta: reportEl.getAttribute('eta') || '',
        note: getChildText(reportEl, 'note') || ''
    }));

    const systemsEl = findChild(damageRoot, 'systems');
    const systems = systemsEl
        ? Array.from(systemsEl.children)
              .filter((child) => isTag(child, 'node'))
              .map((node) => parseDamageNode(node))
        : [];

    const bypassesEl = findChild(damageRoot, 'bypasses');
    const bypasses = bypassesEl
        ? Array.from(bypassesEl.children)
              .filter((child) => isTag(child, 'bypass'))
              .map((bypassEl) => ({
                  id: bypassEl.getAttribute('id') || null,
                  description: bypassEl.getAttribute('description') || '',
                  owner: bypassEl.getAttribute('owner') || '',
                  status: safeLower(bypassEl.getAttribute('status')),
                  eta: bypassEl.getAttribute('eta') || '',
                  note: getChildText(bypassEl, 'note') || ''
              }))
        : [];

    const repairsEl = findChild(damageRoot, 'repairs');
    const repairs = repairsEl
        ? Array.from(repairsEl.children)
              .filter((child) => isTag(child, 'order'))
              .map((orderEl) => ({
                  id: orderEl.getAttribute('id') || null,
                  label: orderEl.getAttribute('label') || '',
                  system: orderEl.getAttribute('system') || '',
                  team: orderEl.getAttribute('team') || '',
                  status: safeLower(orderEl.getAttribute('status')),
                  eta: orderEl.getAttribute('eta') || '',
                  parts: parseParts(orderEl)
              }))
        : [];

    const conduitsEl = findChild(damageRoot, 'conduits');
    const conduits = conduitsEl
        ? Array.from(conduitsEl.children)
              .filter((child) => isTag(child, 'conduit'))
              .map((conduitEl) => ({
                  id: conduitEl.getAttribute('id') || null,
                  name: conduitEl.getAttribute('name') || '',
                  status: safeLower(conduitEl.getAttribute('status')),
                  load: toNumber(conduitEl.getAttribute('load')),
                  capacity: toNumber(conduitEl.getAttribute('capacity')),
                  integrity: toNumber(conduitEl.getAttribute('integrity')),
                  route: conduitEl.getAttribute('route') || getChildText(conduitEl, 'route') || '',
                  note: getChildText(conduitEl, 'note') || '',
                  switches: Array.from(conduitEl.children)
                      .filter((child) => isTag(child, 'switch'))
                      .map((switchEl) => ({
                          id: switchEl.getAttribute('id') || null,
                          label: switchEl.getAttribute('label') || '',
                          type: safeLower(switchEl.getAttribute('type')) || 'switch',
                          state: safeLower(switchEl.getAttribute('state')),
                          critical:
                              switchEl.getAttribute('critical') === 'true' ||
                              switchEl.getAttribute('critical') === '1' ||
                              safeLower(switchEl.getAttribute('critical')) === 'ja',
                          onLabel: switchEl.getAttribute('onLabel') || switchEl.getAttribute('onlabel') || '',
                          offLabel: switchEl.getAttribute('offLabel') || switchEl.getAttribute('offlabel') || ''
                      }))
              }))
        : [];

    const inventoryEl = findChild(damageRoot, 'inventory');
    const inventory = inventoryEl
        ? Array.from(inventoryEl.children)
              .filter((child) => isTag(child, 'item'))
              .map((itemEl) => ({
                  id: itemEl.getAttribute('id') || null,
                  name: itemEl.getAttribute('name') || '',
                  quantity: toNumber(itemEl.getAttribute('quantity')),
                  capacity: toNumber(itemEl.getAttribute('capacity')),
                  threshold: toNumber(itemEl.getAttribute('threshold')),
                  status: safeLower(itemEl.getAttribute('status')),
                  location: itemEl.getAttribute('location') || '',
                  note: getChildText(itemEl, 'note') || ''
              }))
        : [];

    return { reports, systems, bypasses, repairs, conduits, inventory };
}

function parseParts(orderEl) {
    const partsRoot = findChild(orderEl, 'parts');
    if (!partsRoot) {
        return [];
    }

    return Array.from(partsRoot.children)
        .filter((child) => isTag(child, 'part'))
        .map((partEl) => ({
            id: partEl.getAttribute('id') || null,
            name: partEl.getAttribute('name') || '',
            quantity: toNumber(partEl.getAttribute('quantity'))
        }));
}

function parseLifeSupport(doc) {
    const root = doc.querySelector('scenario > ship > lifeSupport');
    if (!root) {
        return null;
    }

    const sections = Array.from(root.querySelectorAll('sections > section')).map((sectionEl) => ({
        id: sectionEl.getAttribute('id') || null,
        name: sectionEl.getAttribute('name') || '',
        pressure: toNumber(sectionEl.getAttribute('pressure')),
        pressureUnit: sectionEl.getAttribute('pressureUnit') || sectionEl.getAttribute('pressureunit') || 'kPa',
        temperature: toNumber(sectionEl.getAttribute('temperature')),
        temperatureUnit:
            sectionEl.getAttribute('temperatureUnit') || sectionEl.getAttribute('temperatureunit') || '°C',
        humidity: toNumber(sectionEl.getAttribute('humidity')),
        status: safeLower(sectionEl.getAttribute('status'))
    }));

    const leaks = Array.from(root.querySelectorAll('leaks > leak')).map((leakEl) => ({
        id: leakEl.getAttribute('id') || null,
        location: leakEl.getAttribute('location') || '',
        severity: safeLower(leakEl.getAttribute('severity')),
        status: safeLower(leakEl.getAttribute('status')),
        progress: toNumber(leakEl.getAttribute('progress')),
        note: getChildText(leakEl, 'note') || ''
    }));

    const filtersEl = root.querySelector('filters');
    const filters = filtersEl
        ? {
              reserveAirMinutes: toNumber(filtersEl.getAttribute('reserveAirMinutes')),
              scrubberMarginMinutes: toNumber(filtersEl.getAttribute('scrubberMarginMinutes')),
              emergencyBufferMinutes: toNumber(filtersEl.getAttribute('emergencyBufferMinutes')),
              banks: Array.from(filtersEl.querySelectorAll('bank')).map((bankEl) => ({
                  id: bankEl.getAttribute('id') || null,
                  label: bankEl.getAttribute('label') || '',
                  status: safeLower(bankEl.getAttribute('status')),
                  saturation: toNumber(bankEl.getAttribute('saturation')),
                  saturationUnit: bankEl.getAttribute('saturationUnit') || bankEl.getAttribute('saturationunit') || '%',
                  timeBuffer: toNumber(bankEl.getAttribute('timeBuffer')),
                  timeBufferUnit: bankEl.getAttribute('timeBufferUnit') || bankEl.getAttribute('timebufferunit') || 'min'
              }))
          }
        : null;

    return { sections, leaks, filters };
}

function parseDamageNode(nodeEl) {
    const children = Array.from(nodeEl.children)
        .filter((child) => isTag(child, 'node'))
        .map((child) => parseDamageNode(child));

    return {
        id: nodeEl.getAttribute('id') || null,
        name: nodeEl.getAttribute('name') || '',
        status: (nodeEl.getAttribute('status') || '').toLowerCase(),
        integrity: toNumber(nodeEl.getAttribute('integrity')),
        power: toNumber(nodeEl.getAttribute('power')),
        note: getChildText(nodeEl, 'note') || '',
        children
    };
}

function isTag(node, name) {
    return Boolean(node && node.tagName && node.tagName.toLowerCase() === name.toLowerCase());
}

function findChild(parent, name) {
    if (!parent) {
        return null;
    }
    return Array.from(parent.children).find((child) => isTag(child, name)) || null;
}

function getChildText(parent, names) {
    if (!parent) {
        return '';
    }
    const tags = Array.isArray(names) ? names : [names];
    for (const tag of tags) {
        const child = Array.from(parent.children).find((node) => isTag(node, tag));
        if (child) {
            return (child.textContent || '').trim();
        }
    }
    return '';
}

function toNumber(value) {
    if (value === null || value === undefined || value === '') {
        return null;
    }
    const parsed = Number.parseFloat(String(value).replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
}

function safeLower(value) {
    return typeof value === 'string' ? value.trim().toLowerCase() : '';
}
