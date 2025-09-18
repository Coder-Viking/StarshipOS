export const SHIP_SYSTEMS = [
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
            sensoren: ['CO₂-Level stabil', 'O₂-Level 20.9%', 'Feuchtigkeit 40%']
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
