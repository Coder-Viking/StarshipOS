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
        ]
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
        damageControl: parseDamageControl(doc)
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
        return { reports: [], systems: [], bypasses: [], repairs: [] };
    }

    const reports = Array.from(damageRoot.querySelectorAll('reports > report')).map((reportEl) => ({
        id: reportEl.getAttribute('id') || null,
        system: reportEl.getAttribute('system') || '',
        location: reportEl.getAttribute('location') || '',
        severity: (reportEl.getAttribute('severity') || '').toLowerCase(),
        status: (reportEl.getAttribute('status') || '').toLowerCase(),
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
                  status: (bypassEl.getAttribute('status') || '').toLowerCase(),
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
                  status: (orderEl.getAttribute('status') || '').toLowerCase(),
                  eta: orderEl.getAttribute('eta') || '',
                  parts: parseParts(orderEl)
              }))
        : [];

    return { reports, systems, bypasses, repairs };
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
