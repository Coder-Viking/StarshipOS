const SHIP_INFO = {
    name: 'NV-01 Phoenix',
    registry: 'NV-01',
    class: 'Langstrecken-Explorer',
    commander: 'Captain Mira Sol'
};

export const LIFE_SUPPORT_STATUS = {
    cycles: [
        {
            id: 'o2-regeneration',
            label: 'O₂-Regeneration',
            status: 'Stabil',
            metrics: [
                { key: 'efficiency', label: 'Effizienz', unit: '%', value: 98.6 },
                { key: 'throughput', label: 'Durchsatz', unit: 'kg/h', value: 12.4 },
                { key: 'loop', label: 'Loop', unit: 'min', value: 42 }
            ],
            note: 'Reservefeld 2 kalibriert, CO₂-Last bei 41%'
        },
        {
            id: 'co2-scrubber',
            label: 'CO₂-Abscheidung',
            status: 'Stabil',
            metrics: [
                { key: 'saturation', label: 'Sättigung', unit: '%', value: 27 },
                { key: 'scrub-rate', label: 'Abscheidung', unit: 'kg/h', value: 11.8 },
                { key: 'regen', label: 'Regeneration', unit: '%', value: 93 }
            ],
            note: 'Filterbank A aktiv, Regeneration in 18 Minuten'
        }
    ],
    sections: [
        {
            id: 'bridge',
            name: 'Brücke',
            pressure: { value: 101.3, unit: 'kPa' },
            temperature: { value: 21.8, unit: '°C' },
            humidity: { value: 41, unit: '%' },
            status: 'Stabil'
        },
        {
            id: 'engineering',
            name: 'Maschinenraum',
            pressure: { value: 100.9, unit: 'kPa' },
            temperature: { value: 23.4, unit: '°C' },
            humidity: { value: 45, unit: '%' },
            status: 'Stabil'
        },
        {
            id: 'habitat',
            name: 'Habitat-Ring',
            pressure: { value: 101.0, unit: 'kPa' },
            temperature: { value: 22.6, unit: '°C' },
            humidity: { value: 42, unit: '%' },
            status: 'Stabil'
        },
        {
            id: 'medbay',
            name: 'MedBay',
            pressure: { value: 101.5, unit: 'kPa' },
            temperature: { value: 21.1, unit: '°C' },
            humidity: { value: 38, unit: '%' },
            status: 'Stabil'
        },
        {
            id: 'cargo',
            name: 'Frachtraum',
            pressure: { value: 100.6, unit: 'kPa' },
            temperature: { value: 20.9, unit: '°C' },
            humidity: { value: 36, unit: '%' },
            status: 'Stabil'
        },
        {
            id: 'shuttle-bay',
            name: 'Shuttle-Bucht',
            pressure: { value: 99.8, unit: 'kPa' },
            temperature: { value: 19.8, unit: '°C' },
            humidity: { value: 33, unit: '%' },
            status: 'Überwachung'
        }
    ],
    leaks: [
        {
            id: 'cargo-outer',
            location: 'Frachtraum 2 – Außenhaut',
            severity: 'Gering',
            status: 'Versiegelt',
            progress: 100,
            note: 'Nanopolymer-Patch hält, Monitoring aktiv'
        },
        {
            id: 'deck-5',
            location: 'Deck 5 – Wartungsschacht',
            severity: 'Spur',
            status: 'Analyse läuft',
            progress: 18,
            note: 'Sensorcluster 4 meldet leichte Druckfluktuation'
        }
    ],
    filters: {
        banks: [
            {
                id: 'primary',
                label: 'Filterbank A',
                status: 'Aktiv',
                saturation: { value: 34, unit: '%' },
                timeBuffer: { value: 540, unit: 'min' }
            },
            {
                id: 'secondary',
                label: 'Filterbank B',
                status: 'Bereit',
                saturation: { value: 12, unit: '%' },
                timeBuffer: { value: 780, unit: 'min' }
            },
            {
                id: 'reserve',
                label: 'Reservekassetten',
                status: 'Standby',
                saturation: { value: 3, unit: '%' },
                timeBuffer: { value: 1020, unit: 'min' }
            }
        ],
        reserveAirMinutes: 640,
        scrubberMarginMinutes: 180,
        emergencyBufferMinutes: 240
    }
};

export const SHIP_SYSTEMS = [
    {
        id: 'reactor',
        name: 'Reaktorkern',
        status: 'online',
        power: 92,
        integrity: 93,
        load: 81,
        details: {
            beschreibung: 'Quantenfusion-Reaktorkern als zentrale Energiequelle des Schiffes.',
            redundanz: 'Dual-Plasmaeinspeisung mit separatem Notfall-Materie/Antimaterie-Puffer',
            letzteWartung: 'Stardate 4523.8',
            sensors: [
                'Magnetfeld-Kohärenz 99.7% stabil',
                'Kernplasma 14.2 keV',
                'Primärer Kühlkreislauf Druck 1.8 MPa'
            ],
            outputCurve: [
                { load: '0–20%', output: '0.6 TW', notes: 'Grundlast für Lebenserhaltung & Standby-Systeme' },
                { load: '21–60%', output: '1.3 TW', notes: 'Nominaler Flug- und Schiffsbetrieb' },
                { load: '61–90%', output: '2.1 TW', notes: 'Warpfeld-Speisung & Hochlastmanöver' },
                { load: '91–105%', output: '2.6 TW', notes: 'Notfall-Boost < 90 Sekunden' }
            ],
            efficiencyHeat: [
                { mode: 'Eco', efficiency: '97%', heat: '340 MJ/min', coolant: '50% Kühlschleifen aktiv' },
                { mode: 'Nominal', efficiency: '94%', heat: '520 MJ/min', coolant: '68% Kühlschleifen aktiv' },
                { mode: 'Burst', efficiency: '88%', heat: '910 MJ/min', coolant: '100% + Entlastungsventile' }
            ],
            modes: [
                {
                    name: 'Eco',
                    output: '0.7 TW',
                    duration: 'unbegrenzt',
                    description: 'Stabile Grundlast für Bereitschaftszustände, automatische Leistungsdämpfung aktiv.',
                    advisories: 'Empfohlen in Dock, Orbit oder während Wartung.'
                },
                {
                    name: 'Burst',
                    output: '2.4 TW',
                    duration: 'max. 90 Sekunden',
                    description: 'Kurzzeitiger Leistungsschub für Gefechts- oder Fluchtmanöver, führt zu erhöhter Hitze.',
                    advisories: 'Nur in Alarmstufen Gelb/Rot freigegeben, Nachkühlphase erforderlich.'
                }
            ],
            failureScenarios: [
                { title: 'Injektor-Phasendrift', mitigation: 'Magnetfeld neu synchronisieren und Leistung um 15% reduzieren.' },
                { title: 'Kühlmittel-Überdruck', mitigation: 'Sekundärkreislauf öffnen, Entlastungsventile testen, Technikteam alarmieren.' },
                { title: 'Containment-Flackern', mitigation: 'Reaktor auf Eco herunterschalten, Abschirmfeld verstärken, Crew evakuationsbereit halten.' }
            ],
            startSequence: [
                'Materie-/Antimaterie-Schotts schließen und verriegeln.',
                'Magnetfeld-Vorkühlung hochfahren und Stabilität prüfen.',
                'Plasma-Injektoren entlüften und automatisch kalibrieren lassen.',
                'Reaktionskammer auf 1% Leistung entzünden und Spektrum überwachen.',
                'Leistung stufenweise auf 35% erhöhen, Notabschaltung scharf schalten.'
            ]
        }
    },
    {
        id: 'life-support',
        name: 'Lebenserhaltung',
        status: 'online',
        power: 75,
        integrity: 96,
        load: 35,
        details: {
            beschreibung: 'Verantwortlich für Atmosphärenkontrolle, Temperatur und Recycling.',
            redundanz: 'Doppelt redundant',
            letzteWartung: 'Stardate 4521.4',
            sensoren: ['O₂ Effizienz 98.6%', 'CO₂ Sättigung 27%', 'Sektionen 5/6 stabil']
        }
    },
    {
        id: 'engines',
        name: 'Antrieb',
        status: 'online',
        power: 80,
        integrity: 89,
        load: 62,
        details: {
            beschreibung: 'Fusionstriebwerke für Unterlicht- und Überlichtreisen.',
            redundanz: 'Primär + Hilfsaggregat',
            letzteWartung: 'Stardate 4519.1',
            sensoren: ['Plasmadrücke stabil', 'Temperatur 620K', 'Warpfeld kalibriert']
        }
    },
    {
        id: 'shields',
        name: 'Schilde',
        status: 'idle',
        power: 60,
        integrity: 72,
        load: 44,
        details: {
            beschreibung: 'Defensives Deflektorfeld gegen Projektil- und Energieangriffe.',
            redundanz: 'Segmentiert in 6 Quadranten',
            letzteWartung: 'Stardate 4515.7',
            sensoren: ['Front 82%', 'Backbord 75%', 'Steuerbord 78%']
        }
    },
    {
        id: 'weapons',
        name: 'Waffensysteme',
        status: 'idle',
        power: 45,
        integrity: 88,
        load: 20,
        details: {
            beschreibung: 'Phaserbänke und Torpedowerfer.',
            redundanz: 'Autarkes Backup-Steuerungssystem',
            letzteWartung: 'Stardate 4510.9',
            sensoren: ['Phaserleistung 85%', 'Torpedoarsenal 12/16', 'Kalibrierung ok']
        }
    },
    {
        id: 'communications',
        name: 'Kommunikation',
        status: 'online',
        power: 35,
        integrity: 94,
        load: 28,
        details: {
            beschreibung: 'Langstrecken- und Kurzstreckentransmitter.',
            redundanz: 'Triangulierte Relaisstationen',
            letzteWartung: 'Stardate 4520.2',
            sensoren: ['Signal-Rausch-Verhältnis 92%', 'Bandbreite 11.2 Gbps']
        }
    },
    {
        id: 'sensors',
        name: 'Sensoren',
        status: 'online',
        power: 55,
        integrity: 91,
        load: 47,
        details: {
            beschreibung: 'Aktive und passive Arrays für wissenschaftliche und taktische Daten.',
            redundanz: 'Adaptive Netzstruktur',
            letzteWartung: 'Stardate 4522.6',
            sensoren: ['Gravitationsspitzen normal', 'Partikelstreuung niedrig']
        }
    },
    {
        id: 'science',
        name: 'Wissenschaftslabore',
        status: 'online',
        power: 40,
        integrity: 99,
        load: 32,
        details: {
            beschreibung: 'Labore zur Probenanalyse, Forschung und Datenverarbeitung.',
            redundanz: 'Dedizierter Notstromkreis',
            letzteWartung: 'Stardate 4518.4',
            sensoren: ['Reaktorabschirmung nominal', 'Biolab steril']
        }
    },
    {
        id: 'medical',
        name: 'Medizinische Abteilung',
        status: 'online',
        power: 30,
        integrity: 97,
        load: 18,
        details: {
            beschreibung: 'MedBay mit Autodoc, Quarantäne und Nanitenversorgung.',
            redundanz: 'Mobiles Feldhospital verfügbar',
            letzteWartung: 'Stardate 4523.3',
            sensoren: ['Patienten stabil', 'Biobett 2 in Nutzung']
        }
    }
];

export const SECTORS = [
    { id: 'alpha', name: 'Alpha Quadrant', defaultCoords: 'A-12-17', baseEta: 38 },
    { id: 'beta', name: 'Beta Quadrant', defaultCoords: 'B-04-33', baseEta: 72 },
    { id: 'gamma', name: 'Gamma Sektor', defaultCoords: 'G-21-05', baseEta: 96 },
    { id: 'delta', name: 'Delta Nebel', defaultCoords: 'D-08-49', baseEta: 54 },
    { id: 'frontier', name: 'Grenzzone Theta', defaultCoords: 'T-17-90', baseEta: 120 }
];

export const COMM_CHANNELS = [
    { id: 'fleet', label: 'Flottenkommando' },
    { id: 'science', label: 'Wissenschaftsnetz' },
    { id: 'colony', label: 'Koloniekontakt' },
    { id: 'civilian', label: 'Zivile Frequenz' },
    { id: 'distress', label: 'Notrufkanal' }
];

export const CREW = [
    { name: 'Lt. Aris Venn', rolle: 'Navigation', status: 'Dienstbereit' },
    { name: 'Cmdr. Talin Roe', rolle: 'Erster Offizier', status: 'Brücke' },
    { name: 'Dr. Ilya Chen', rolle: 'Chefarzt', status: 'MedBay' },
    { name: 'Lt. Cmdr. Sora Kade', rolle: 'Chefingenieur', status: 'Maschinenraum' },
    { name: 'Ensign Lira Nael', rolle: 'Kommunikation', status: 'Brücke' }
];

export const OBJECTIVES = [
    { id: 1, text: 'Anomalie im Delta-Nebel untersuchen', completed: false },
    { id: 2, text: 'Lieferung medizinischer Vorräte an Kolonie Hestia Prime', completed: false },
    { id: 3, text: 'Kontakt zur Forschungsstation V-12 halten', completed: true }
];

export const SENSOR_BASELINES = [
    { label: 'Subraumaktivität', unit: 'mHz', variance: 5, base: 120 },
    { label: 'Radiation', unit: 'mSv', variance: 2, base: 18 },
    { label: 'Graviton Flux', unit: 'μg', variance: 12, base: 64 },
    { label: 'Lebensformen', unit: 'Spuren', variance: 20, base: 4 }
];

export const ALERT_STATES = {
    green: { label: 'Keine Warnungen', className: 'status-idle' },
    yellow: { label: 'Alarmstufe Gelb', className: 'status-warning' },
    red: { label: 'Alarmstufe Rot', className: 'status-critical' }
};

export const INITIAL_LOG = [
    { type: 'log', message: 'Systemstart abgeschlossen. Alle Kernsysteme online.' },
    { type: 'comms', message: 'Signalprüfung abgeschlossen. Verbindung zum Flottenkommando stabil.' }
];

export const RANDOM_EVENTS = [
    {
        message: 'Sensoren melden eine unerklärliche Energiefluktuation im Vorderquadranten.',
        impact: { sensors: -5, shields: -3 }
    },
    {
        message: 'Energieumleitung erfolgreich. Antriebseffizienz kurzfristig erhöht.',
        impact: { engines: 4, aux: -2 }
    },
    {
        message: 'Kommunikationsrauschen erkannt. Automatischer Filter aktiviert.',
        impact: { communications: -2 }
    },
    {
        message: 'Crew meldet erhöhte moralische Stimmung nach gelungenem Manöver.',
        impact: { crew: 'positiv' }
    },
    {
        message: 'Minor-Hüllenstress detektiert. Schilde werden automatisch verstärkt.',
        impact: { shields: 5, engines: -3 }
    }
];

export const DEFAULT_SCENARIO = {
    id: 'default-js',
    name: 'Standardübungsmission',
    version: '1.0',
    ship: { ...SHIP_INFO },
    systems: SHIP_SYSTEMS.map(system => ({ ...system })),
    sectors: SECTORS.map(sector => ({ ...sector })),
    commChannels: COMM_CHANNELS.map(channel => ({ ...channel })),
    crew: CREW.map(member => ({ ...member })),
    objectives: OBJECTIVES.map(objective => ({ ...objective })),
    sensorBaselines: SENSOR_BASELINES.map(baseline => ({ ...baseline })),
    alertStates: { ...ALERT_STATES },
    initialLog: INITIAL_LOG.map(entry => ({ ...entry })),
    randomEvents: RANDOM_EVENTS.map(event => ({
        ...event,
        impact: event.impact ? { ...event.impact } : undefined
    })),
    lifeSupport: JSON.parse(JSON.stringify(LIFE_SUPPORT_STATUS))
};
