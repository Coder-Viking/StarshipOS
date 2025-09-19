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

const TACTICAL_CONTACTS = [
    {
        id: 'corsair-sigma',
        callsign: 'Korsar Sigma',
        type: 'Leichte Fregatte',
        attitude: 'hostile',
        threat: 86,
        distance: 32000,
        distanceUnit: 'km',
        vector: '210° / +4°',
        velocity: '0.42c',
        sectorId: 'delta',
        hull: 72,
        shields: 40,
        state: 'active',
        objective: 'Abfangkurs auf Frachterkonvoi',
        lastKnown: 'Annäherung mit 920 m/s',
        notes: 'Schwere Plasmawerfer aktiv, Signatur der Korsaren-Gilde.'
    },
    {
        id: 'drone-cluster',
        callsign: 'Drohnen-Schwarm Theta',
        type: 'Autonome Drohnen',
        attitude: 'hostile',
        threat: 64,
        distance: 58000,
        distanceUnit: 'km',
        vector: '238° / -2°',
        velocity: '18 km/s',
        sectorId: 'delta',
        hull: 54,
        shields: 0,
        state: 'active',
        objective: 'Belästigung der Schildgeneratoren',
        lastKnown: 'Formationswechsel alle 14 Sekunden',
        notes: 'Schwarm reagiert empfindlich auf breitbandige Phaserstöße.'
    },
    {
        id: 'escort-nova',
        callsign: 'ESV Nova',
        type: 'Eskortschiff',
        attitude: 'friendly',
        threat: 0,
        distance: 74000,
        distanceUnit: 'km',
        vector: '052° / +1°',
        velocity: '25 km/s',
        sectorId: 'beta',
        hull: 92,
        shields: 88,
        state: 'active',
        objective: 'Sicherungsflug flankierend',
        lastKnown: 'Hält Position und wartet auf Feuerleitfreigabe',
        notes: 'Kann bei Bedarf Torpedosalven koordinieren.'
    },
    {
        id: 'science-buoy',
        callsign: 'Forschungssonde L-17',
        type: 'Sensorboje',
        attitude: 'neutral',
        threat: 5,
        distance: 41000,
        distanceUnit: 'km',
        vector: '134° / 0°',
        velocity: 'Stationär',
        sectorId: 'alpha',
        hull: 28,
        shields: 0,
        state: 'drifting',
        objective: 'Telemetrie sammelt Nebelspuren',
        lastKnown: 'Sendet periodisch Forschungstelemetrie',
        notes: 'Zerstörung vermeiden – enthält wertvolle Sensordaten.'
    }
];

const TACTICAL_WEAPONS = [
    {
        id: 'phaser-alpha',
        name: 'Phaserbank Alpha',
        type: 'Phaser',
        arc: 'Vorbug 90°',
        status: 'ready',
        cooldownSeconds: 8,
        damage: 26,
        powerCost: 12,
        notes: 'Ideal gegen agile Ziele im Nahbereich.'
    },
    {
        id: 'phaser-beta',
        name: 'Phaserbank Beta',
        type: 'Phaser',
        arc: 'Steuerbord 120°',
        status: 'ready',
        cooldownSeconds: 10,
        damage: 30,
        powerCost: 14,
        notes: 'Verfügt über adaptive Frequenzmodulation.'
    },
    {
        id: 'torpedo-tube-1',
        name: 'Torpedorohr 1',
        type: 'Quantentorpedo',
        arc: 'Vorbug',
        status: 'ready',
        cooldownSeconds: 18,
        damage: 65,
        ammo: 6,
        salvo: 1,
        notes: 'Automatisches Zieltracking, EMP-Gefahr im Nahbereich.'
    },
    {
        id: 'pd-array',
        name: 'Punktverteidigungs-Array',
        type: 'Verteidigungslaser',
        arc: '360°',
        status: 'ready',
        cooldownSeconds: 5,
        damage: 12,
        powerCost: 8,
        notes: 'Effektiv gegen Drohnenschwärme, geringe Wirkung gegen Großziele.'
    }
];

const TACTICAL_SECTORS = [
    {
        id: 'delta',
        name: 'Vorbug Sektor',
        bearing: '210°',
        range: 'Kurz (0-40 Mm)',
        navSector: 'delta',
        hazard: 'Nebelstreuung 12%',
        priority: 'Primär',
        friendlies: 0,
        hostiles: 2
    },
    {
        id: 'beta',
        name: 'Steuerbordbogen',
        bearing: '090°',
        range: 'Mittel (40-90 Mm)',
        navSector: 'beta',
        hazard: 'Trümmerfeld geringe Dichte',
        priority: 'Sekundär',
        friendlies: 1,
        hostiles: 0
    },
    {
        id: 'alpha',
        name: 'Brückenachsensektor',
        bearing: '134°',
        range: 'Kurz',
        navSector: 'alpha',
        hazard: 'Sensorboje in Reichweite',
        priority: 'Überwachung',
        friendlies: 0,
        hostiles: 0
    }
];

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
    { id: 'objective-startup', text: 'Start-Up Checkliste abschließen', completed: false },
    { id: 'objective-patrol', text: 'Patrouille Sektor Delta fliegen', completed: false },
    { id: 'objective-docking', text: 'Konvoi andocken', completed: false }
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



const SCIENCE_DATA = {
    samples: [
        {
            id: 'sample-nebula',
            name: 'Nebelprobe 47-B',
            type: 'Ionischer Staub',
            status: 'processing',
            assignedTo: 'Lt. Hale',
            progress: 68,
            increment: 12,
            priority: 'Hoch',
            notes: 'Spektralanalyse auf Plasmaanteile läuft.'
        },
        {
            id: 'sample-bio',
            name: 'Biomatrix Kolonie',
            type: 'Organisches Gel',
            status: 'pending',
            assignedTo: 'Crewman Elan',
            progress: 22,
            increment: 18,
            priority: 'Routine',
            notes: 'Sterilitätsprüfungen vorbereiten.'
        }
    ],
    anomalies: [
        {
            id: 'anomaly-rift',
            label: 'Subraum-Riss Signatur',
            severity: 'high',
            status: 'processing',
            window: '+00:12',
            action: 'Gravitationssensoren neu kalibrieren.'
        },
        {
            id: 'anomaly-aurora',
            label: 'Aurora-Partikelsturm',
            severity: 'medium',
            status: 'verified',
            window: '+02:30',
            action: 'Frequenzband archiviert.'
        }
    ],
    projects: [
        {
            id: 'project-stasis',
            title: 'Stasisfeld-Rekalibrierung',
            lead: 'Dr. Idris',
            milestone: 'Validierung',
            progress: 52,
            horizon: 'T-6h',
            notes: 'Simulationslauf #12 in Auswertung.'
        }
    ],
    missions: [
        { id: 'science-scout', title: 'Aufklärung Nebel X12', verified: false }
    ],
    markers: [
        { id: 'marker-delta', label: 'Scan Feld Delta', status: 'aktiv' },
        { id: 'marker-beta', label: 'Telemetrie Relais Beta', status: 'übermittelt' }
    ]
};

const DAMAGE_CONTROL_DATA = {
    reports: [
        {
            id: 'report-dorsal-array',
            system: 'Sensor-Array',
            location: 'Deck 4 · Dorsaler Träger',
            severity: 'major',
            status: 'in-progress',
            eta: '00:22',
            note: 'Plasmafackel beschädigte Verkabelung, Leistung auf 60% begrenzt.'
        },
        {
            id: 'report-cargo-breach',
            system: 'Frachtraum 2',
            location: 'Sektion 12 · Außenhaut',
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
                    note: 'Injektor 3 zeigt Schwingungen.',
                    children: []
                },
                {
                    id: 'tree-containment',
                    name: 'Containment-Feld',
                    status: 'online',
                    integrity: 96,
                    power: 78,
                    note: 'Feldphase synchron.',
                    children: []
                }
            ]
        },
        {
            id: 'tree-structural',
            name: 'Strukturraster',
            status: 'warning',
            integrity: 68,
            power: 0,
            note: 'Segment D5 unter Beobachtung.',
            children: [
                {
                    id: 'tree-hull-d5',
                    name: 'Außenhülle D5',
                    status: 'critical',
                    integrity: 42,
                    power: 0,
                    note: 'Patch angebracht, Druck fällt langsam.',
                    children: []
                },
                {
                    id: 'tree-rib-delta',
                    name: 'Verstrebung Delta',
                    status: 'offline',
                    integrity: 0,
                    power: 0,
                    note: 'Notstütze erforderlich.',
                    children: []
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
                { id: 'part-nano', name: 'Nanopolymer-Patch', quantity: '2' },
                { id: 'part-brace', name: 'Verstrebung Typ C', quantity: '1' }
            ]
        },
        {
            id: 'repair-array',
            label: 'Sensor-Array neu ausrichten',
            system: 'Sensorik',
            team: 'Decktrupp 3',
            status: 'queued',
            eta: '00:25',
            parts: [
                { id: 'part-emitter', name: 'Emitter Cluster', quantity: '3' }
            ]
        }
    ]
};

const CARGO_DATA = {
    summary: {
        totalMass: 184.2,
        capacity: 320,
        balance: 'Ausbalanciert',
        balanceStatus: 'status-online',
        hazardCount: 2,
        fuelMargin: 18,
        massVector: '+02/+01/0'
    },
    holds: [
        {
            id: 'hold-a',
            name: 'Frachtraum A',
            occupancy: 72,
            capacity: 120,
            mass: 84.6,
            hazard: false,
            note: 'Standardcontainer, Sicherungsnetze geprüft.'
        },
        {
            id: 'hold-b',
            name: 'Frachtraum B',
            occupancy: 54,
            capacity: 110,
            mass: 61.8,
            hazard: true,
            note: 'Gefahrgut-Käfig aktiviert, Chem-Alarm auf Gelb.'
        },
        {
            id: 'hold-shuttle',
            name: 'Shuttle-Bay',
            occupancy: 35,
            capacity: 90,
            mass: 37.8,
            hazard: false,
            note: 'Docking-Fracht in Vorbereitung.'
        }
    ],
    logistics: [
        {
            id: 'cargo-transfer',
            description: 'Transfer Ersatzteile → Maschinenraum',
            window: 'T-00:20',
            status: 'pending',
            assignedTo: 'Cargo Team 2'
        },
        {
            id: 'cargo-shuttle',
            description: 'Verladung Shuttle ECHO',
            window: 'Dock+15',
            status: 'complete',
            assignedTo: 'Deck Crew'
        }
    ]
};

const FABRICATION_DATA = {
    queue: [
        {
            id: 'job-hullpatch',
            label: 'Hüllenpatch D5',
            type: 'Reparaturkit',
            status: 'active',
            eta: '00:18',
            priority: 'Hoch'
        },
        {
            id: 'job-stims',
            label: 'Stim-Pack Serie 3',
            type: 'Medizin',
            status: 'queued',
            eta: '00:45',
            priority: 'Routine'
        }
    ],
    kits: [
        { id: 'kit-alpha', label: 'Notfallset Alpha', stock: 3, status: 'ok' },
        { id: 'kit-beta', label: 'Druckschott-Kit', stock: 1, status: 'low', threshold: 2 }
    ],
    consumables: [
        { id: 'consumable-fuel', label: 'Deuterium-Kartuschen', stock: 12, threshold: 5, unit: 'Stk' },
        { id: 'consumable-fiber', label: 'Nano-Faserrollen', stock: 6, threshold: 3, unit: 'Rollen' }
    ]
};

const MEDICAL_DATA = {
    roster: [
        {
            id: 'crew-tavish',
            name: 'Lt. Tavish',
            status: 'stabil',
            vitals: 'BP 118/76 | O₂ 98%',
            treatment: 'Regenerationsspray',
            priority: 'Routine'
        },
        {
            id: 'crew-lian',
            name: 'Cmdr. Lian',
            status: 'kritisch',
            vitals: 'BP 89/54 | O₂ 92%',
            treatment: 'Trauma-Protokoll B',
            priority: 'Dringend'
        }
    ],
    resources: [
        { id: 'medpacks', label: 'Medpacks', stock: '8', status: 'ok' },
        { id: 'stims', label: 'Stim-Dosen', stock: '5', status: 'low' },
        { id: 'stasis', label: 'Stasis-Kapseln', stock: '2/4', status: 'ok' }
    ],
    quarantine: {
        status: 'aktiv',
        countdown: '02:30',
        note: 'Forschungsteam D in Dekontamination.'
    }
};

const SECURITY_DATA = {
    roles: [
        {
            id: 'role-captain',
            name: 'Captain',
            permissions: ['Alert-Status setzen', 'Waffenfreigabe'],
            critical: ['Selbstzerstörung', 'Not-Jump'],
            clearance: 'Alpha'
        },
        {
            id: 'role-tactical',
            name: 'Tactical',
            permissions: ['Waffenziele wählen', 'Schild-Fokus'],
            critical: ['Sekundärbewaffnung'],
            clearance: 'Beta'
        },
        {
            id: 'role-engineering',
            name: 'Engineering',
            permissions: ['Energieverteilung', 'Not-Bypass'],
            critical: ['Reaktor Override'],
            clearance: 'Beta'
        }
    ],
    authorizations: [
        {
            id: 'auth-torpedo',
            action: 'Torpedo Startfreigabe',
            station: 'Tactical',
            requestedBy: 'Lt. Kareem',
            status: 'pending',
            requires: 'Captain',
            note: 'Hostiler Kontakt in Sektor Delta.'
        },
        {
            id: 'auth-hangar',
            action: 'Hangar-Dekompression',
            station: 'Engineering',
            requestedBy: 'Chief Holt',
            status: 'approved',
            requires: 'XO',
            note: 'Shuttle ECHO Auswurf bestätigt.'
        }
    ],
    audit: [
        { id: 'audit-1', message: 'Crew-Login Lt. Kareem (Tac)', timestamp: '12:04' },
        { id: 'audit-2', message: 'Systemzugriff Fabrication freigegeben', timestamp: '12:12' }
    ]
};

const STATION_DATA = [
    { id: 'station-captain', role: 'Captain', focus: ['Entscheidungen', 'Alert Levels'], readiness: 90, crew: 'Capt. Sol', status: 'bereit' },
    { id: 'station-pilot', role: 'Pilot', focus: ['Navigation', 'Manöver'], readiness: 75, crew: 'Lt. Osei', status: 'bereit' },
    { id: 'station-engineering', role: 'Engineering', focus: ['Power', 'Damage Control'], readiness: 60, crew: 'Chief Holt', status: 'bereit' },
    { id: 'station-tactical', role: 'Tactical', focus: ['Waffen', 'Schilde'], readiness: 80, crew: 'Lt. Kareem', status: 'bereit' },
    { id: 'station-science', role: 'Science', focus: ['Sensorik', 'Analyse'], readiness: 55, crew: 'Dr. Idris', status: 'bereit' },
    { id: 'station-comms', role: 'Comms', focus: ['Kommunikation', 'Briefing'], readiness: 65, crew: 'Ensign Mira', status: 'bereit' }
];

const PROCEDURE_DATA = [
    {
        id: 'proc-startup',
        name: 'Start-Up Sequenz',
        steps: [
            { id: 'startup-power', label: 'Reaktor Vorheizen', completed: true },
            { id: 'startup-systems', label: 'Subsysteme prüfen', completed: false },
            { id: 'startup-briefing', label: 'Crew-Briefing abschließen', completed: false }
        ]
    },
    {
        id: 'proc-battlestations',
        name: 'Battle Stations',
        steps: [
            { id: 'battle-alert', label: 'Alarm Rot setzen', completed: false },
            { id: 'battle-shields', label: 'Schilde auf 120%', completed: false },
            { id: 'battle-weapons', label: 'Waffen laden', completed: false }
        ]
    },
    {
        id: 'proc-docking',
        name: 'Docking Flow',
        steps: [
            { id: 'dock-vector', label: 'Annäherungsvektor bestätigen', completed: false },
            { id: 'dock-clearance', label: 'Freigabe anfordern', completed: false },
            { id: 'dock-seal', label: 'Druckschleuse verriegeln', completed: false }
        ]
    }
];

const BRIEFING_DATA = {
    markers: [
        { id: 'marker-approach', label: 'Anflug Korridor', status: 'aktiv' },
        { id: 'marker-rescue', label: 'Rettungskapsel Tracking', status: 'markiert' }
    ],
    summary: 'Primäres Ziel: Frachterkonvoi sichern und Anomalie untersuchen.',
    report: [
        {
            id: 'report-engagement',
            title: 'Gefechtsentscheidung',
            decision: 'Torpedo Salve verzögert',
            outcome: 'Kontakt abgelenkt'
        }
    ]
};

const SCENARIO_DIRECTOR = {
    phases: [
        { id: 'phase-startup', name: 'Start-Up', status: 'active' },
        { id: 'phase-patrol', name: 'Patrouille', status: 'pending' },
        { id: 'phase-docking', name: 'Docking', status: 'pending' }
    ],
    triggers: [
        {
            id: 'trigger-startup-complete',
            name: 'Start-Up abgeschlossen',
            condition: { type: 'objective-complete', id: 'objective-startup' },
            actions: [
                { type: 'phase', id: 'phase-patrol' },
                { type: 'log', message: 'Patrouillenphase eingeleitet.' }
            ],
            status: 'armed',
            auto: true
        },
        {
            id: 'trigger-red-alert',
            name: 'Alarm Rot',
            condition: { type: 'alert', level: 'red' },
            actions: [
                { type: 'log', message: 'Alarm Rot bestätigt – Crew auf Gefechtsstationen.' },
                { type: 'encounter', id: 'encounter-korsar', behavior: 'hostile' }
            ],
            status: 'armed',
            auto: true
        }
    ]
};

const ENCOUNTERS_DATA = [
    {
        id: 'encounter-korsar',
        callsign: 'Korsar Sigma',
        behavior: 'hostile',
        morale: 'hoch',
        target: 'NV-01',
        contactId: 'corsair-sigma',
        status: 'pursuit'
    },
    {
        id: 'encounter-escort',
        callsign: 'ESV Nova',
        behavior: 'friendly',
        morale: 'stabil',
        target: 'Konvoi',
        contactId: 'escort-nova',
        status: 'escort'
    }
];

const TELEMETRY_DATA = {
    metrics: [
        { id: 'metric-reactor', label: 'Reaktorauslastung', value: 68, unit: '%', trend: 'stabil' },
        { id: 'metric-shields', label: 'Schildladung', value: 82, unit: '%', trend: 'stabil' },
        { id: 'metric-hull', label: 'Hüllenstress', value: 14, unit: '%', trend: 'fallend' }
    ],
    events: [
        { id: 'telemetry-boot', message: 'Telemetrie initialisiert.', timestamp: '12:00' }
    ],
    paused: false
};

const FAULT_DATA = {
    templates: [
        { id: 'fault-sensor-drift', label: 'Sensor-Drift', description: 'Langsame Abweichung der Zielerfassung', target: 'sensors' },
        { id: 'fault-power-drop', label: 'Energieabfall', description: 'Kurzzeitiger Spannungsverlust in Aux-Systemen', target: 'aux' }
    ],
    active: []
};

const LARP_DATA = {
    parameters: [
        { id: 'param-morale', label: 'Crew Moral', value: 68, min: 0, max: 100, step: 5 },
        { id: 'param-pressure', label: 'Kommandodruck', value: 42, min: 0, max: 100, step: 5 }
    ],
    cues: [
        { id: 'cue-distress', label: 'Notruf eintreffen', message: '"Mayday – Frachter Alnair unter Beschuss"' },
        { id: 'cue-clue', label: 'Hinweis Forschung', message: 'Anomalie sendet periodische Signale.' }
    ],
    fogLevel: 25
};

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
    lifeSupport: JSON.parse(JSON.stringify(LIFE_SUPPORT_STATUS)),
    tactical: {
        contacts: TACTICAL_CONTACTS.map(contact => ({ ...contact })),
        weapons: TACTICAL_WEAPONS.map(weapon => ({ ...weapon })),
        sectors: TACTICAL_SECTORS.map(sector => ({ ...sector }))
    },
    damageControl: JSON.parse(JSON.stringify(DAMAGE_CONTROL_DATA)),
    science: JSON.parse(JSON.stringify(SCIENCE_DATA)),
    cargo: JSON.parse(JSON.stringify(CARGO_DATA)),
    fabrication: JSON.parse(JSON.stringify(FABRICATION_DATA)),
    medical: JSON.parse(JSON.stringify(MEDICAL_DATA)),
    security: JSON.parse(JSON.stringify(SECURITY_DATA)),
    stations: STATION_DATA.map(station => ({ ...station })),
    procedures: PROCEDURE_DATA.map(proc => ({
        ...proc,
        steps: proc.steps.map(step => ({ ...step }))
    })),
    briefing: JSON.parse(JSON.stringify(BRIEFING_DATA)),
    director: JSON.parse(JSON.stringify(SCENARIO_DIRECTOR)),
    encounters: ENCOUNTERS_DATA.map(encounter => ({ ...encounter })),
    telemetry: JSON.parse(JSON.stringify(TELEMETRY_DATA)),
    faults: JSON.parse(JSON.stringify(FAULT_DATA)),
    larp: JSON.parse(JSON.stringify(LARP_DATA))
};
