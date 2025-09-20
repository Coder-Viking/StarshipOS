const SCENARIO_URL = new URL('../data/scenario-default.xml', import.meta.url).href;
let scenarioPromise = null;

const FALLBACK_SCENARIO_DATA = {
    bridge: {
        command: {
            alertState: {
                current: 'yellow',
                currentLabel: 'Gelb',
                lastChange: '05:12',
                officer: 'Captain Mira Sol',
                readiness: 'Crew an Stationen',
                states: [
                    {
                        id: 'green',
                        label: 'Grün',
                        description: 'Routinebetrieb, minimale Bewaffnung aktiv.'
                    },
                    {
                        id: 'yellow',
                        label: 'Gelb',
                        description: 'Erhöhte Bereitschaft, Schilde auf Gefechtsprofil.'
                    },
                    {
                        id: 'red',
                        label: 'Rot',
                        description: 'Gefechtsstationen, Waffenfreigaben aktiv.'
                    }
                ]
            },
            missionDirectives: [
                {
                    id: 'mission-escort',
                    label: 'Koloniekonvoi eskortieren',
                    status: 'laufend',
                    progress: 68,
                    owner: 'Brücke',
                    note: 'Konvoi Gamma in Formation halten.'
                },
                {
                    id: 'mission-anomaly',
                    label: 'Anomalie 77C beobachten',
                    status: 'geplant',
                    progress: 20,
                    owner: 'Wissenschaft',
                    note: 'Sensorfenster um 05:40 koordinieren.'
                },
                {
                    id: 'mission-contingency',
                    label: 'Evakuierung vorbereiten',
                    status: 'bereit',
                    progress: 45,
                    owner: 'Sicherheit',
                    note: 'Shuttles und Notfallteams auf Bereitschaft halten.'
                }
            ],
            systemLocks: [
                {
                    id: 'lock-weapons',
                    label: 'Waffenfreigabe',
                    engaged: true,
                    authority: 'Captain',
                    note: 'Salven nur über Taktik koordinieren.'
                },
                {
                    id: 'lock-ftl',
                    label: 'FTL-Autorisierung',
                    engaged: false,
                    authority: 'Captain & Navigation',
                    note: 'Sprunglösung 4B wartet auf Freigabe.'
                },
                {
                    id: 'lock-aux',
                    label: 'Hilfssysteme Override',
                    engaged: true,
                    authority: 'XO',
                    note: 'Engineering darf Notleistung abrufen.'
                }
            ],
            priorityBroadcasts: [
                { id: 'macro-allhands', label: 'Stationsdurchsage' },
                { id: 'macro-battle', label: 'Gefechtsstationen', tone: 'danger' },
                { id: 'macro-secure', label: 'Sichere Verbindung CIC', tone: 'ghost' }
            ],
            pendingRequests: [
                {
                    id: 'request-medbay',
                    label: 'MedBay: Evakuierungsfreigabe anfordern',
                    status: 'ausstehend'
                },
                {
                    id: 'request-dock',
                    label: 'Dockkontrolle: Priorität Versorgungsschleuse',
                    status: 'bewertet'
                }
            ],
            recentOrders: [
                '05:18 - Alarmstufe Gelb bestätigt, Gefechtsprofil Energie aktiv.',
                '05:10 - Konvoi Gamma angewiesen Geschwindigkeit halten.',
                '04:55 - Sensor-Scan Sequenz Delta autorisiert.'
            ]
        },
        helm: {
            vector: {
                velocity: '126 m/s',
                impulse: 62,
                impulseStatus: 'stabil',
                inertialDampers: 88,
                damperStatus: 'warning',
                rcs: 74,
                rcsStatus: 'bereit',
                heading: '218° Mark 4',
                drift: '0.3°',
                orientation: { pitch: 1.5, yaw: 0.2, roll: -2.1 }
            },
            thrusters: [
                {
                    id: 'main-thrust',
                    label: 'Hauptschub',
                    output: 62,
                    note: 'Impuls auf Halteposition begrenzen.'
                },
                {
                    id: 'man-thrust',
                    label: 'Manöverdüsen',
                    output: 54,
                    note: 'Autotrim aktiv.'
                },
                {
                    id: 'vtol-ring',
                    label: 'Heberinge',
                    output: 12,
                    note: 'Bereit für Dockmanöver.'
                }
            ],
            autopilotModes: [
                {
                    id: 'manual',
                    label: 'Manuell',
                    description: 'Direkter Steuerbefehl durch Helm.'
                },
                {
                    id: 'hold',
                    label: 'Position halten',
                    description: 'Orbitale Drift ausgleichen.',
                    active: true
                },
                {
                    id: 'approach',
                    label: 'Andock-Anflug',
                    description: 'Schleusenvektor Dock 3.'
                }
            ],
            maneuvers: [
                {
                    id: 'maneuver-final',
                    label: 'Andock-Final',
                    status: 'laufend',
                    eta: '00:04',
                    note: 'Halteschlepper synchronisiert Kurs.'
                },
                {
                    id: 'maneuver-trim',
                    label: 'Drift-Korrektur',
                    status: 'geplant',
                    eta: '00:12',
                    note: 'Auslösen nach Freigabe Navigation.'
                }
            ],
            flightPlan: {
                currentWaypoint: 'NV-Station Theta',
                nextWaypoint: 'Sammelpunkt Epsilon',
                arrivalIn: '00:32',
                clearance: 'Flugkontrolle Theta bestätigt Kurs',
                checkpoints: [
                    'Relais Sigma – passiert',
                    'NV-Station Theta – anlaufend',
                    'Sammelpunkt Epsilon – in 00:32'
                ]
            },
            warnings: [
                'Trägheitsdämpfer bei 88% – innerhalb Grenzwert.',
                'Annäherungssensor meldet Frachter bei 12 km.'
            ]
        },
        navigation: {
            solution: {
                designation: 'Sprunglösung 4B',
                target: 'Sammelpunkt Epsilon',
                eta: '00:32',
                windowOpens: '00:18',
                status: 'bereit',
                confidence: 92,
                jumpEnergy: 84,
                constraints: [
                    'Gravitationsschlag oberhalb Schwelle 4.6 – Flugbahn begrenzen.',
                    'Maximale Reaktorleistung 85% nicht überschreiten.'
                ]
            },
            alternatives: [
                {
                    id: 'alt-nebelrand',
                    label: 'Route über Nebelrand',
                    eta: '+00:24',
                    risk: 'Niedrig'
                },
                {
                    id: 'alt-relay',
                    label: 'Sprung via Relais Sigma',
                    eta: '-00:08',
                    risk: 'Sensorschatten'
                }
            ],
            jumpWindows: [
                {
                    id: 'window-primary',
                    destination: 'Sammelpunkt Epsilon',
                    opens: '00:18',
                    duration: '05:00',
                    status: 'berechnet'
                },
                {
                    id: 'window-alt',
                    destination: 'NV-Station Theta',
                    opens: '00:42',
                    duration: '04:20',
                    status: 'vorläufig'
                }
            ],
            tasks: [
                {
                    id: 'task-grav-profile',
                    label: 'Gravitationsprofil Delta synchronisieren',
                    note: 'Sensorarray Beta liefert Daten.'
                },
                {
                    id: 'task-helm-verify',
                    label: 'Helmvektor bestätigen',
                    checked: true,
                    note: 'Freigabe 05:10 erhalten.'
                },
                {
                    id: 'task-ftl-reserve',
                    label: 'Sprungfenster bei FTL reservieren'
                }
            ],
            markers: [
                {
                    id: 'marker-77c',
                    label: 'Anomalie 77C',
                    type: 'Gravimetrisch',
                    bearing: '214°',
                    distance: '3.2 AE'
                },
                {
                    id: 'marker-buoy',
                    label: 'Leuchtboje Theta-4',
                    type: 'Navigationsbake',
                    bearing: '186°',
                    distance: '1.1 AE'
                }
            ],
            logs: [
                '05:16 - Lösung 4B aktualisiert, ETA bestätigt.',
                '05:08 - Anomalie 77C in Karte vermerkt.',
                '04:59 - Sensorrelais Sigma neu kalibriert.'
            ]
        },
        tactical: {
            readiness: {
                alert: 'Gelb',
                weaponReadiness: 88,
                shieldReadiness: 73,
                countermeasures: 'Bereit',
                targeting: 'Stabil'
            },
            contacts: [
                {
                    id: 'contact-aurora',
                    designation: 'Kontakt AUR-3',
                    type: 'Fregatte',
                    allegiance: 'Unbekannt',
                    range: '18.2 ls',
                    vector: 'Annähernd',
                    threat: 'hoch',
                    lock: 62,
                    status: 'Verfolgt',
                    note: 'Signatur pulsiert, ECM möglich.'
                },
                {
                    id: 'contact-gamma2',
                    designation: 'Gamma-2',
                    type: 'Transporter',
                    allegiance: 'Verbündet',
                    range: '4.6 ls',
                    vector: 'Parallel',
                    threat: 'gering',
                    lock: 95,
                    status: 'Eskortiert'
                },
                {
                    id: 'contact-drone',
                    designation: 'Signal 77C',
                    type: 'Drohne',
                    allegiance: 'Unklar',
                    range: '2.1 ls',
                    vector: 'Stationär',
                    threat: 'moderat',
                    lock: 48,
                    status: 'Scan läuft'
                }
            ],
            weaponControls: {
                safeties: [
                    { id: 'safety-phaser', label: 'Phaser Hauptbänke scharf', engaged: true },
                    { id: 'safety-torpedo', label: 'Torpedorohre bewaffnen', engaged: false },
                    { id: 'safety-point', label: 'Punktverteidigung aktiv', engaged: true }
                ],
                salvoModes: [
                    {
                        id: 'precision',
                        label: 'Präzisionssalve',
                        description: 'Kurzfeuer mit minimaler Streuung.'
                    },
                    {
                        id: 'suppress',
                        label: 'Unterdrückungsfeuer',
                        description: 'Erhöhte Frequenz, hoher Verbrauch.'
                    },
                    {
                        id: 'spread',
                        label: 'Breitband-Salve',
                        description: 'Mehrere Ziele, geringere Genauigkeit.'
                    }
                ],
                selected: 'precision'
            },
            shieldDirectives: {
                sectors: [
                    { id: 'front', label: 'Front', load: 62 },
                    { id: 'port', label: 'Backbord', load: 58 },
                    { id: 'starboard', label: 'Steuerbord', load: 51 },
                    { id: 'aft', label: 'Heck', load: 49 }
                ],
                note: 'Stöße aus Richtung AUR-3 erwartet.'
            },
            logs: [
                '05:19 - Schildverstärkung Front auf 62% gesetzt.',
                '05:14 - Feuerleitlösung für AUR-3 aktualisiert.',
                '05:02 - ECM-Paket Beta bereit, auf Abruf.'
            ]
        },
        comms: {
            channels: [
                {
                    id: 'channel-long',
                    label: 'Langstrecke',
                    frequency: '7.12 GHz',
                    snr: 92,
                    status: 'stabil',
                    encryption: 'Sigma-7',
                    traffic: 'Konvoi-Status'
                },
                {
                    id: 'channel-short',
                    label: 'Kurzstrecke',
                    frequency: '2.44 GHz',
                    snr: 78,
                    status: 'überwachung',
                    encryption: 'Beta-4',
                    traffic: 'Dockkontrolle'
                },
                {
                    id: 'channel-secure',
                    label: 'Sicherer Kanal',
                    frequency: '19.8 GHz',
                    snr: 88,
                    status: 'aktiv',
                    encryption: 'Omega-Prime',
                    traffic: 'CIC-Link'
                }
            ],
            hailingQueue: [
                {
                    id: 'hail-aur3',
                    name: 'Fregatte AUR-3',
                    priority: 'hoch',
                    state: 'Antwort erwartet',
                    time: '00:02'
                },
                {
                    id: 'hail-theta',
                    name: 'Station Theta',
                    priority: 'normal',
                    state: 'Kanal offen',
                    time: '00:05'
                }
            ],
            encryptionModes: [
                { id: 'enc-sigma', label: 'Sigma-7 Standard', active: true },
                { id: 'enc-omega', label: 'Omega-Prime gesichert' },
                { id: 'enc-open', label: 'Offener Kanal' }
            ],
            macros: [
                { id: 'macro-hello', label: 'Standardbegrüßung' },
                { id: 'macro-warning', label: 'Warnung – Abstand halten', tone: 'danger' },
                { id: 'macro-distress', label: 'Notruf weiterleiten', tone: 'ghost' }
            ],
            log: [
                '05:18 - Verbindung CIC gesichert (Omega-Prime).',
                '05:12 - Konvoi Gamma meldet Status grün.',
                '05:07 - Dockkontrolle erfragt Kurskorrektur 0.5° Steuerbord.'
            ]
        },
        sensors: {
            sweeps: [
                {
                    id: 'sweep-broad',
                    label: 'Weitbereich EM',
                    status: 'laufend',
                    progress: 68,
                    band: 'EM',
                    eta: '00:06'
                },
                {
                    id: 'sweep-thermal',
                    label: 'Thermalscan Fokus',
                    status: 'geplant',
                    progress: 0,
                    band: 'IR',
                    eta: '00:14'
                },
                {
                    id: 'sweep-spectral',
                    label: 'Spektralanalyse 77C',
                    status: 'aktiv',
                    progress: 42,
                    band: 'Spektrum',
                    eta: '00:09'
                }
            ],
            noiseLevel: 12,
            radiationLevel: 0.6,
            calibrationDue: '06:40',
            contacts: [
                {
                    id: 'contact-aur3',
                    label: 'Kontakt AUR-3',
                    classification: 'Unbekannt',
                    range: '18.2 ls',
                    vector: 'Annähernd',
                    signature: 'Warp 4.6',
                    confidence: 71,
                    note: 'Signatur weist Impulsspitzen auf.'
                },
                {
                    id: 'contact-gamma2',
                    label: 'Gamma-2 Transport',
                    classification: 'Verbündet',
                    range: '4.6 ls',
                    vector: 'Parallel',
                    signature: 'Warp 5.0',
                    confidence: 95,
                    note: 'IFF bestätigt.'
                },
                {
                    id: 'contact-anom77c',
                    label: 'Anomalie 77C',
                    classification: 'Anomalie',
                    range: '2.1 ls',
                    vector: 'Stationär',
                    signature: 'Grav 3.4',
                    confidence: 62,
                    note: 'Fluktuationen steigen.'
                }
            ],
            analysis: [
                {
                    id: 'analysis-aur3',
                    label: 'Spektralfilter AUR-3',
                    assignedTo: 'Taktik',
                    status: 'laufend'
                },
                {
                    id: 'analysis-77c',
                    label: 'Gravmetrie 77C',
                    assignedTo: 'Wissenschaft',
                    status: 'laufend'
                }
            ],
            queues: [
                { id: 'queue-long', label: 'Langstrecken-Sweep', status: 'geplant' },
                { id: 'queue-drift', label: 'Driftdetektion', status: 'bereit' }
            ],
            logs: [
                '05:17 - Signatur von AUR-3 mit 71% bestätigt.',
                '05:11 - Spektralanalyse 77C gestartet.',
                '05:05 - Sensorarray Beta kalibriert.'
            ]
        }
    },
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
    },
    power: {
        distribution: [
            { id: 'power-shields', name: 'Schilde', value: 32, max: 45, status: 'Gefechtsbereit', tone: 'accent' },
            { id: 'power-weapons', name: 'Waffen', value: 26, max: 40, status: 'Ladezyklen stabil', tone: 'warning' },
            { id: 'power-life', name: 'Lebenserhaltung', value: 12, max: 20, status: 'Nominal', tone: 'success' },
            { id: 'power-eng', name: 'Engineering Hilfssysteme', value: 18, max: 25, status: 'Überwacht', tone: 'warning' }
        ],
        profiles: [
            {
                id: 'profile-cruise',
                label: 'Reise (Cruise)',
                description: 'Stabile Schilde, Fokus auf Lebenserhaltung.'
            },
            {
                id: 'profile-battle',
                label: 'Gefecht',
                description: 'Waffen- und Schildleistung priorisieren.',
                active: true
            },
            {
                id: 'profile-emergency',
                label: 'Notfall',
                description: 'Lebenserhaltung + Reaktorsicherheit, Rest minimal.'
            }
        ],
        circuits: [
            {
                id: 'shed-weapons',
                label: 'Sekundäre Waffenbanken',
                defaultChecked: true,
                description: 'Wird bei Brownout automatisch getrennt.',
                tone: 'warning'
            },
            {
                id: 'shed-labs',
                label: 'Wissenschaftslabore',
                defaultChecked: false,
                description: 'Kann bei längerem Gefecht entkoppelt werden.',
                tone: 'default'
            },
            {
                id: 'shed-hydroponics',
                label: 'Hydroponik-Cluster',
                defaultChecked: false,
                description: 'Nur im äußersten Notfall deaktivieren.',
                tone: 'danger'
            }
        ],
        metrics: [
            { label: 'Gesamtverbrauch', value: 87, unit: '%', status: 'warning', note: 'Schwellwert 90%', min: 0, max: 120 },
            { label: 'Reserveleistung', value: 14, unit: '%', status: 'critical', note: 'Unter Soll 18%', min: 0, max: 40 },
            { label: 'Pufferkapazität', value: 62, unit: '%', status: 'normal', note: 'Batteriedecks', min: 0, max: 100 }
        ],
        log: [
            '05:18 - Brownout-Warnung Deck 4 behoben',
            '05:02 - Reservebank 2 geladen (82%)',
            '04:47 - Verteiler 7A neu kalibriert'
        ]
    },
    thermal: {
        radiators: [
            { label: 'Radiator Alpha', value: 68, status: 'warning', note: 'Sonnenexposition hoch' },
            { label: 'Radiator Beta', value: 54, status: 'normal', note: 'Nominal' },
            { label: 'Radiator Gamma', value: 73, status: 'warning', note: 'Kühlmittelkreislauf prüfen' },
            { label: 'Radiator Delta', value: 49, status: 'normal', note: 'Reserve aktiv' }
        ],
        loops: [
            { id: 'loop-primary', name: 'Primärer Kernkreislauf', pump: 76, flow: 540, note: 'Ventil 4 offen' },
            { id: 'loop-secondary', name: 'Sekundärkreislauf', pump: 64, flow: 410, note: 'Reserve-Radiator gekoppelt' },
            { id: 'loop-aux', name: 'Auxiliar / Lebenserhaltung', pump: 58, flow: 320, note: 'Temperatur stabil' }
        ],
        emergencyChecklist: [
            { id: 'venting-ready', label: 'Radiatoren entfalten / venten vorbereitet', checked: true },
            { id: 'heatsinks-arm', label: 'Heat-Sink-Module geladen', note: 'Letzte Ladung: 28 min' },
            { id: 'purge-lines', label: 'Kühlmittelleitungen gespült' },
            { id: 'emergency-fans', label: 'Notlüfter in Bereitschaft' }
        ],
        log: [
            '05:12 - Radiator Beta wieder im grünen Bereich',
            '04:58 - Warnung: Radiator Gamma 72% Last',
            '04:41 - Kühlkreislauf Auxiliar entlüftet'
        ]
    },
    propulsion: {
        throttle: {
            id: 'propulsion-throttle',
            label: 'Hauptschub',
            min: 0,
            max: 110,
            step: 5,
            value: 72,
            unit: '%',
            description: 'Maximale Dauerlast 95%, Nachbrenner bis 110%.'
        },
        deltaV: {
            label: 'Verfügbares Delta-V',
            value: 4.6,
            unit: ' km/s',
            status: 'normal',
            note: 'Berechnet mit aktueller Masse',
            min: 0,
            max: 12
        },
        vectorAxes: [
            { id: 'vector-pitch', label: 'Pitch', min: -30, max: 30, step: 1, value: 2, unit: '°' },
            { id: 'vector-yaw', label: 'Yaw', min: -30, max: 30, step: 1, value: -1, unit: '°' },
            { id: 'vector-roll', label: 'Roll', min: -15, max: 15, step: 1, value: 0, unit: '°' }
        ],
        thrusters: [
            { id: 'fore-port', name: 'Bug • Backbord', active: true, status: 'Bereit', tone: 'success' },
            { id: 'fore-starboard', name: 'Bug • Steuerbord', active: true, status: 'Bereit', tone: 'success' },
            { id: 'aft-port', name: 'Heck • Backbord', active: true, status: 'Bereit', tone: 'success' },
            { id: 'aft-starboard', name: 'Heck • Steuerbord', active: false, status: 'Service nötig', tone: 'warning' },
            { id: 'ventral', name: 'Ventral Cluster', active: true, status: 'Überwacht', tone: 'warning' },
            { id: 'dorsal', name: 'Dorsal Cluster', active: true, status: 'Bereit', tone: 'success' }
        ],
        checklist: [
            { id: 'prop-prime', label: 'Triebwerke auf Bereitschaft gebracht', checked: true },
            { id: 'prop-balance', label: 'Massenausgleich geprüft', note: 'Cargo bestätigt' },
            { id: 'prop-flightplan', label: 'Flight-Command bestätigt Manöverfenster' }
        ]
    },
    ftl: {
        charge: {
            label: 'Aktuelle Ladung',
            value: 62,
            unit: '%',
            status: 'warning',
            note: 'Sprungbereit ab 95%',
            min: 0,
            max: 100
        },
        target: {
            id: 'ftl-charge-target',
            label: 'Ladeziel',
            min: 80,
            max: 100,
            step: 1,
            value: 95,
            unit: '%'
        },
        stabilityMetrics: [
            { label: 'Feldstabilität', value: 91, unit: '%', status: 'normal', note: 'Nominal', min: 0, max: 100 },
            { label: 'Jitter', value: 0.6, unit: '%', status: 'warning', note: 'Grenze 0,8%', min: 0, max: 3 },
            { label: 'Strukturbelastung', value: 38, unit: '%', status: 'normal', note: 'Innerhalb Limits', min: 0, max: 100 }
        ],
        stabilityLog: [
            '05:09 - Navigationsdaten bestätigt',
            '05:03 - Feldkalibrierung abgeschlossen',
            '04:55 - Sicherheitsinterlock erfolgreich getestet'
        ],
        interlocks: [
            {
                id: 'ftl-lock-captain',
                label: 'Captain-Freigabe',
                defaultChecked: true,
                tone: 'accent',
                description: 'Bestätigung via Brücke'
            },
            {
                id: 'ftl-lock-engineer',
                label: 'Chefingenieur',
                defaultChecked: true,
                tone: 'success',
                description: 'Reaktorleistung gesichert'
            },
            {
                id: 'ftl-lock-navigation',
                label: 'Navigation',
                defaultChecked: false,
                tone: 'warning',
                description: 'Sprungfenster noch in Berechnung'
            }
        ],
        abortPlaceholder: 'z. B. Signaturanstieg, Kursabweichung, Crew-Feedback',
        abortLog: [
            '04:50 - Sicherheitscheckliste abgeschlossen',
            '04:46 - Warnung: Jitter 0,8% (innerhalb Limits)',
            '04:38 - Navigation meldet Kursfenster t+11 Minuten'
        ]
    },
    defense: {
        shields: {
            sectors: [
                {
                    id: 'shield-fore',
                    label: 'Bug',
                    arc: '000° – 060°',
                    strength: 82,
                    capacity: 115,
                    status: 'warning',
                    regen: 5.2,
                    focus: 'Korsar Sigma',
                    note: 'Trägt Hauptlast der Frontsalven.'
                },
                {
                    id: 'shield-port',
                    label: 'Backbord',
                    arc: '060° – 180°',
                    strength: 76,
                    capacity: 110,
                    status: 'normal',
                    regen: 4.6,
                    focus: 'Drohnen-Schwarm',
                    note: 'Streuung durch Nebel reduziert Treffer.'
                },
                {
                    id: 'shield-starboard',
                    label: 'Steuerbord',
                    arc: '180° – 300°',
                    strength: 69,
                    capacity: 108,
                    status: 'warning',
                    regen: 4.1,
                    focus: 'Deckung Frachterkonvoi',
                    note: 'Synchronisiert mit Eskortschiff Nova.'
                },
                {
                    id: 'shield-aft',
                    label: 'Heck',
                    arc: '300° – 360°',
                    strength: 88,
                    capacity: 120,
                    status: 'success',
                    regen: 5.8,
                    focus: 'Rückraum',
                    note: 'Reserveleistung verfügbar.'
                }
            ],
            reinforcement: {
                modes: [
                    {
                        value: 'auto',
                        label: 'Automatik',
                        description: 'Sektoren werden anhand der Bedrohungsmatrix priorisiert.'
                    },
                    {
                        value: 'manual',
                        label: 'Manuell',
                        description: 'Direkte Verteilung durch Bediencrew.'
                    },
                    {
                        value: 'burst',
                        label: 'Burst',
                        description: 'Kurzfristige Verstärkung auf Kosten der Regeneration.'
                    }
                ],
                currentMode: 'auto',
                regenTarget: {
                    id: 'shield-regen-target',
                    label: 'Regenerationsziel',
                    min: 40,
                    max: 140,
                    step: 5,
                    value: 95,
                    unit: '%',
                    description: 'Vorsicht bei Werten über 120% – erhöhte Hitzeentwicklung.'
                },
                boosts: [
                    {
                        id: 'boost-fore',
                        label: 'Frontverstärkung',
                        min: 0,
                        max: 35,
                        step: 5,
                        value: 20,
                        unit: '%',
                        status: 'warning',
                        note: 'Korsar Sigma priorisiert.'
                    },
                    {
                        id: 'boost-port',
                        label: 'Backbordverstärkung',
                        min: 0,
                        max: 30,
                        step: 5,
                        value: 12,
                        unit: '%',
                        status: 'normal',
                        note: 'Drohnen-Schwarm unter Kontrolle.'
                    },
                    {
                        id: 'boost-starboard',
                        label: 'Steuerbordverstärkung',
                        min: 0,
                        max: 30,
                        step: 5,
                        value: 8,
                        unit: '%',
                        status: 'normal',
                        note: 'Reserve für Konvoiabschirmung.'
                    }
                ],
                reserves: [
                    {
                        id: 'reserve-alpha',
                        label: 'Reservebank Alpha',
                        defaultChecked: true,
                        tone: 'accent',
                        description: 'Kernbank – hält Automatik aktiv.'
                    },
                    {
                        id: 'reserve-beta',
                        label: 'Reservebank Beta',
                        defaultChecked: false,
                        tone: 'warning',
                        description: 'Verstärkt Burst-Modus für 90 Sekunden.'
                    }
                ]
            },
            walls: [
                {
                    id: 'wall-forward',
                    label: 'Notwall Vorfeld',
                    status: 'bereit',
                    cooldown: '02:30',
                    interlocks: [
                        { id: 'wall-forward-tac', label: 'Taktik-Freigabe', status: 'aktiv' },
                        { id: 'wall-forward-sec', label: 'Sicherheit', status: 'bereit' }
                    ],
                    note: 'Empfohlen bei Torpedosalven von Korsar Sigma.'
                },
                {
                    id: 'wall-aft',
                    label: 'Notwall Heck',
                    status: 'standby',
                    cooldown: '01:10',
                    interlocks: [
                        { id: 'wall-aft-tac', label: 'Taktik-Freigabe', status: 'bereit' },
                        { id: 'wall-aft-sec', label: 'Sicherheit', status: 'bereit' }
                    ],
                    note: 'Reserviert für Rückzugsszenarien.'
                }
            ],
            priorities: [
                {
                    id: 'priority-corsair',
                    target: 'Korsar Sigma',
                    priority: 'Hoch',
                    alignment: 'Bug',
                    note: 'Halte Frontverstärkung ≥ 20%'
                },
                {
                    id: 'priority-drones',
                    target: 'Drohnen-Schwarm Theta',
                    priority: 'Mittel',
                    alignment: 'Backbord',
                    note: 'Koordiniere mit Punktverteidigung.'
                },
                {
                    id: 'priority-convoy',
                    target: 'Frachterkonvoi',
                    priority: 'Schutz',
                    alignment: 'Steuerbord',
                    note: 'Abdeckung gegen Splittertreffer.'
                }
            ],
            log: [
                '05:20 - Verstärkung Bug auf 20% erhöht (Feuerleitkommando).',
                '05:15 - Reservebank Alpha synchronisiert.',
                '05:07 - Drohnen-Schwarm Beta abgewehrt; Sektor Backbord stabil.'
            ]
        },
        hull: {
            integrityMetrics: [
                { label: 'Gesamtintegrität', value: 86, unit: '%', status: 'warning', note: 'Schwellwert 85%', min: 0, max: 100 },
                { label: 'Sektion D5', value: 54, unit: '%', status: 'critical', note: 'EVA-Team aktiv', min: 0, max: 100 },
                { label: 'Vibration RMS', value: 1.8, unit: ' g', status: 'normal', note: 'Grenze 2.5 g', min: 0, max: 5 }
            ],
            stressPoints: [
                {
                    id: 'stress-dorsal',
                    label: 'Dorsaler Träger',
                    status: 'warning',
                    load: 68,
                    resonance: 37,
                    note: 'Sensor-Array Reparatur beeinflusst Steifigkeit.'
                },
                {
                    id: 'stress-ventral',
                    label: 'Ventraler Kiel',
                    status: 'normal',
                    load: 42,
                    resonance: 18,
                    note: 'Innerhalb Spezifikation.'
                },
                {
                    id: 'stress-bow',
                    label: 'Vorbug',
                    status: 'warning',
                    load: 61,
                    resonance: 29,
                    note: 'Manöverlasten aus Kurskorrektur.'
                }
            ],
            bulkheads: [
                {
                    id: 'bulkhead-d5',
                    location: 'Sektion D5',
                    status: 'geschlossen',
                    pressure: 98.6,
                    pressureUnit: 'kPa',
                    seal: 'versiegelt',
                    note: 'Spurleck überwacht.'
                },
                {
                    id: 'bulkhead-cargo',
                    location: 'Frachtraum 2',
                    status: 'verriegelt',
                    pressure: 0,
                    pressureUnit: 'kPa',
                    seal: 'evakuiert',
                    note: 'EVA-Einsatz aktiv.'
                },
                {
                    id: 'bulkhead-hab',
                    location: 'Habitat-Ring',
                    status: 'offen',
                    pressure: 101.0,
                    pressureUnit: 'kPa',
                    seal: 'normal',
                    note: 'Regulärer Verkehr.'
                }
            ],
            bracing: [
                {
                    id: 'brace-delta',
                    label: 'Verstrebung Delta',
                    engaged: true,
                    tone: 'warning',
                    description: 'Hält Patch in Sektion D5 stabil.'
                },
                {
                    id: 'brace-epsilon',
                    label: 'Verstrebung Epsilon',
                    engaged: false,
                    tone: 'accent',
                    description: 'Bereit für Vorbug.'
                },
                {
                    id: 'brace-beta',
                    label: 'Verstrebung Beta',
                    engaged: true,
                    tone: 'success',
                    description: 'Sichert Cargo-Rahmen.'
                }
            ],
            resonanceAlerts: [
                {
                    id: 'alert-dorsal',
                    frequency: '12.4 Hz',
                    severity: 'major',
                    recommendation: 'Trägheitsdämpfer feinjustieren, Kursänderungen < 5° halten.'
                },
                {
                    id: 'alert-keel',
                    frequency: '7.9 Hz',
                    severity: 'moderate',
                    recommendation: 'Zusatzdämpfer Gamma aktivieren falls Last > 70%.'
                }
            ],
            log: [
                '05:18 - Notstütze Delta installiert, Belastung stabilisiert.',
                '05:10 - Schott D5 geschlossen, Druckverlust gestoppt.',
                '04:52 - Vibrationen Kiel im Rahmen, Monitoring fortsetzen.'
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
        bridge: parseBridge(doc),
        systems: parseSystems(doc),
        damageControl: parseDamageControl(doc),
        lifeSupport: parseLifeSupport(doc),
        power: parseEngineeringPower(doc),
        thermal: parseEngineeringThermal(doc),
        propulsion: parseEngineeringPropulsion(doc),
        ftl: parseEngineeringFtl(doc),
        defense: parseDefense(doc)
    };
}

function parseBridge(doc) {
    const bridgeRoot = doc.querySelector('scenario > ship > bridge');
    if (!bridgeRoot) {
        return null;
    }

    return {
        command: parseBridgeCommand(findChild(bridgeRoot, 'command')),
        helm: parseBridgeHelm(findChild(bridgeRoot, 'helm')),
        navigation: parseBridgeNavigation(findChild(bridgeRoot, 'navigation')),
        tactical: parseBridgeTactical(findChild(bridgeRoot, 'tactical')),
        comms: parseBridgeComms(findChild(bridgeRoot, 'comms')),
        sensors: parseBridgeSensors(findChild(bridgeRoot, 'sensors'))
    };
}

function parseBridgeCommand(commandRoot) {
    if (!commandRoot) {
        return null;
    }

    const alertRoot = findChild(commandRoot, 'alertState');
    const alertState = alertRoot
        ? {
              current:
                  alertRoot.getAttribute('current') ||
                  alertRoot.getAttribute('level') ||
                  alertRoot.getAttribute('status') ||
                  '',
              currentLabel: alertRoot.getAttribute('label') || '',
              lastChange: alertRoot.getAttribute('lastChange') || alertRoot.getAttribute('time') || '',
              officer: alertRoot.getAttribute('officer') || alertRoot.getAttribute('author') || '',
              readiness:
                  alertRoot.getAttribute('readiness') ||
                  getChildText(alertRoot, ['readiness', 'note']) ||
                  '',
              states: Array.from(alertRoot.children)
                  .filter((child) => isTag(child, 'state'))
                  .map((stateEl) => {
                      const label =
                          getChildText(stateEl, ['label', 'name']) ||
                          stateEl.getAttribute('label') ||
                          stateEl.getAttribute('name') ||
                          stateEl.getAttribute('id') ||
                          '';
                      const text = (stateEl.textContent || '').trim();
                      const description =
                          getChildText(stateEl, 'description') ||
                          stateEl.getAttribute('description') ||
                          (text && text !== label ? text : '');
                      return {
                          id: stateEl.getAttribute('id') || null,
                          label: label || text || 'Zustand',
                          description
                      };
                  })
          }
        : null;

    const missionsRoot = findChild(commandRoot, 'missions');
    const missionDirectives = missionsRoot
        ? Array.from(missionsRoot.children)
              .filter((child) => isTag(child, 'mission'))
              .map((missionEl) => ({
                  id: missionEl.getAttribute('id') || null,
                  label:
                      getChildText(missionEl, ['label', 'name']) ||
                      missionEl.getAttribute('label') ||
                      missionEl.getAttribute('name') ||
                      missionEl.getAttribute('id') ||
                      '',
                  status: missionEl.getAttribute('status') || '',
                  progress: toNumber(missionEl.getAttribute('progress')),
                  owner: missionEl.getAttribute('owner') || missionEl.getAttribute('responsible') || '',
                  note: getChildText(missionEl, 'note') || missionEl.getAttribute('note') || ''
              }))
        : [];

    const locksRoot = findChild(commandRoot, 'locks');
    const systemLocks = locksRoot
        ? Array.from(locksRoot.children)
              .filter((child) => isTag(child, 'lock'))
              .map((lockEl) => ({
                  id: lockEl.getAttribute('id') || null,
                  label:
                      getChildText(lockEl, ['label', 'name']) ||
                      lockEl.getAttribute('label') ||
                      lockEl.getAttribute('name') ||
                      lockEl.getAttribute('id') ||
                      '',
                  engaged: parseBoolean(lockEl.getAttribute('engaged') || lockEl.getAttribute('active')),
                  authority: lockEl.getAttribute('authority') || '',
                  note: getChildText(lockEl, 'note') || ''
              }))
        : [];

    const broadcastsRoot = findChild(commandRoot, 'broadcasts');
    const priorityBroadcasts = broadcastsRoot
        ? Array.from(broadcastsRoot.children)
              .filter((child) => isTag(child, 'macro'))
              .map((macroEl) => ({
                  id: macroEl.getAttribute('id') || null,
                  label:
                      (macroEl.textContent || '').trim() ||
                      macroEl.getAttribute('label') ||
                      macroEl.getAttribute('name') ||
                      macroEl.getAttribute('id') ||
                      '',
                  tone: macroEl.getAttribute('tone') || ''
              }))
        : [];

    const pendingRoot = findChild(commandRoot, 'pendingRequests');
    const pendingRequests = pendingRoot
        ? Array.from(pendingRoot.children)
              .filter((child) => isTag(child, 'request'))
              .map((requestEl) => ({
                  id: requestEl.getAttribute('id') || null,
                  label: (requestEl.textContent || '').trim() || requestEl.getAttribute('label') || '',
                  status: requestEl.getAttribute('status') || '',
                  completed: parseBoolean(requestEl.getAttribute('completed') || requestEl.getAttribute('done'))
              }))
        : [];

    const recentOrders = parseLogEntries(commandRoot.querySelectorAll('recentOrders > entry'));

    return { alertState, missionDirectives, systemLocks, priorityBroadcasts, pendingRequests, recentOrders };
}

function parseBridgeHelm(helmRoot) {
    if (!helmRoot) {
        return null;
    }

    const vectorRoot = findChild(helmRoot, 'vector');
    const vector = vectorRoot
        ? {
              velocity: vectorRoot.getAttribute('velocity') || '',
              impulse: toNumber(vectorRoot.getAttribute('impulse')),
              impulseStatus: vectorRoot.getAttribute('impulseStatus') || vectorRoot.getAttribute('impulse-status') || '',
              inertialDampers: toNumber(vectorRoot.getAttribute('inertialDampers') || vectorRoot.getAttribute('dampers')),
              damperStatus: vectorRoot.getAttribute('damperStatus') || vectorRoot.getAttribute('damper-status') || '',
              rcs: toNumber(vectorRoot.getAttribute('rcs')),
              rcsStatus: vectorRoot.getAttribute('rcsStatus') || vectorRoot.getAttribute('rcs-status') || '',
              heading: vectorRoot.getAttribute('heading') || '',
              drift: vectorRoot.getAttribute('drift') || '',
              orientation: {
                  pitch: toNumber(vectorRoot.getAttribute('pitch')),
                  yaw: toNumber(vectorRoot.getAttribute('yaw')),
                  roll: toNumber(vectorRoot.getAttribute('roll'))
              }
          }
        : null;

    const thrustersRoot = findChild(helmRoot, 'thrusters');
    const thrusters = thrustersRoot
        ? Array.from(thrustersRoot.children)
              .filter((child) => isTag(child, 'thruster'))
              .map((thrusterEl) => ({
                  id: thrusterEl.getAttribute('id') || null,
                  label:
                      getChildText(thrusterEl, ['label', 'name']) ||
                      thrusterEl.getAttribute('label') ||
                      thrusterEl.getAttribute('name') ||
                      thrusterEl.getAttribute('id') ||
                      '',
                  output: toNumber(thrusterEl.getAttribute('output')),
                  note: getChildText(thrusterEl, 'note') || ''
              }))
        : [];

    const modesRoot = findChild(helmRoot, 'autopilotModes');
    const autopilotModes = modesRoot
        ? Array.from(modesRoot.children)
              .filter((child) => isTag(child, 'mode'))
              .map((modeEl) => ({
                  id: modeEl.getAttribute('id') || null,
                  value: modeEl.getAttribute('value') || null,
                  label:
                      getChildText(modeEl, ['label', 'name']) ||
                      modeEl.getAttribute('label') ||
                      modeEl.getAttribute('name') ||
                      modeEl.getAttribute('id') ||
                      '',
                  description: getChildText(modeEl, 'description') || '',
                  active: parseBoolean(modeEl.getAttribute('active'))
              }))
        : [];

    const maneuversRoot = findChild(helmRoot, 'maneuvers');
    const maneuvers = maneuversRoot
        ? Array.from(maneuversRoot.children)
              .filter((child) => isTag(child, 'maneuver'))
              .map((manEl) => ({
                  id: manEl.getAttribute('id') || null,
                  label:
                      getChildText(manEl, ['label', 'name']) ||
                      manEl.getAttribute('label') ||
                      manEl.getAttribute('name') ||
                      manEl.getAttribute('id') ||
                      '',
                  status: manEl.getAttribute('status') || '',
                  eta: manEl.getAttribute('eta') || '',
                  note: getChildText(manEl, 'note') || ''
              }))
        : [];

    const flightPlanRoot = findChild(helmRoot, 'flightPlan');
    const flightPlan = flightPlanRoot
        ? {
              currentWaypoint: flightPlanRoot.getAttribute('currentWaypoint') || '',
              nextWaypoint: flightPlanRoot.getAttribute('nextWaypoint') || '',
              arrivalIn: flightPlanRoot.getAttribute('arrivalIn') || '',
              clearance: flightPlanRoot.getAttribute('clearance') || '',
              checkpoints: parseLogEntries(flightPlanRoot.querySelectorAll('checkpoint'))
          }
        : null;

    const warnings = parseLogEntries(helmRoot.querySelectorAll('warnings > warning'));

    return { vector, thrusters, autopilotModes, maneuvers, flightPlan, warnings };
}

function parseBridgeNavigation(navigationRoot) {
    if (!navigationRoot) {
        return null;
    }

    const solutionEl = findChild(navigationRoot, 'solution');
    const solution = solutionEl
        ? {
              designation:
                  solutionEl.getAttribute('designation') ||
                  solutionEl.getAttribute('id') ||
                  getChildText(solutionEl, 'label') ||
                  '',
              target: solutionEl.getAttribute('target') || '',
              eta: solutionEl.getAttribute('eta') || '',
              windowOpens: solutionEl.getAttribute('windowOpens') || solutionEl.getAttribute('opens') || '',
              status: solutionEl.getAttribute('status') || '',
              confidence: toNumber(solutionEl.getAttribute('confidence')),
              jumpEnergy: toNumber(solutionEl.getAttribute('jumpEnergy') || solutionEl.getAttribute('energy')),
              constraints: parseLogEntries(solutionEl.querySelectorAll('constraint'))
          }
        : null;

    const alternativesRoot = findChild(navigationRoot, 'alternatives');
    const alternatives = alternativesRoot
        ? Array.from(alternativesRoot.children)
              .filter((child) => isTag(child, 'alternative'))
              .map((altEl) => ({
                  id: altEl.getAttribute('id') || null,
                  label:
                      (altEl.textContent || '').trim() ||
                      altEl.getAttribute('label') ||
                      altEl.getAttribute('name') ||
                      altEl.getAttribute('id') ||
                      '',
                  eta: altEl.getAttribute('eta') || '',
                  risk: altEl.getAttribute('risk') || ''
              }))
        : [];

    const windowsRoot = findChild(navigationRoot, 'jumpWindows');
    const jumpWindows = windowsRoot
        ? Array.from(windowsRoot.children)
              .filter((child) => isTag(child, 'window'))
              .map((windowEl) => ({
                  id: windowEl.getAttribute('id') || null,
                  destination: windowEl.getAttribute('destination') || '',
                  opens: windowEl.getAttribute('opens') || '',
                  duration: windowEl.getAttribute('duration') || '',
                  status: windowEl.getAttribute('status') || ''
              }))
        : [];

    const tasksRoot = findChild(navigationRoot, 'tasks');
    const tasks = tasksRoot
        ? Array.from(tasksRoot.children)
              .filter((child) => isTag(child, 'task'))
              .map((taskEl) => ({
                  id: taskEl.getAttribute('id') || null,
                  label:
                      getChildText(taskEl, ['label', 'name']) ||
                      taskEl.getAttribute('label') ||
                      taskEl.getAttribute('name') ||
                      taskEl.getAttribute('id') ||
                      '',
                  checked: parseBoolean(taskEl.getAttribute('checked') || taskEl.getAttribute('completed')),
                  note: getChildText(taskEl, 'note') || ''
              }))
        : [];

    const markersRoot = findChild(navigationRoot, 'markers');
    const markers = markersRoot
        ? Array.from(markersRoot.children)
              .filter((child) => isTag(child, 'marker'))
              .map((markerEl) => ({
                  id: markerEl.getAttribute('id') || null,
                  label:
                      (markerEl.textContent || '').trim() ||
                      markerEl.getAttribute('label') ||
                      markerEl.getAttribute('name') ||
                      markerEl.getAttribute('id') ||
                      '',
                  type: markerEl.getAttribute('type') || '',
                  bearing: markerEl.getAttribute('bearing') || '',
                  distance: markerEl.getAttribute('distance') || ''
              }))
        : [];

    const logs = parseLogEntries(navigationRoot.querySelectorAll('log > entry'));

    return { solution, alternatives, jumpWindows, tasks, markers, logs };
}

function parseBridgeTactical(tacticalRoot) {
    if (!tacticalRoot) {
        return null;
    }

    const readinessEl = findChild(tacticalRoot, 'readiness');
    const readiness = readinessEl
        ? {
              alert: readinessEl.getAttribute('alert') || readinessEl.getAttribute('status') || '',
              weaponReadiness: toNumber(readinessEl.getAttribute('weapon') || readinessEl.getAttribute('weapons')),
              shieldReadiness: toNumber(readinessEl.getAttribute('shields')),
              countermeasures: readinessEl.getAttribute('countermeasures') || '',
              targeting: readinessEl.getAttribute('targeting') || ''
          }
        : null;

    const contactsRoot = findChild(tacticalRoot, 'contacts');
    const contacts = contactsRoot
        ? Array.from(contactsRoot.children)
              .filter((child) => isTag(child, 'contact'))
              .map((contactEl) => ({
                  id: contactEl.getAttribute('id') || null,
                  designation: contactEl.getAttribute('designation') || contactEl.getAttribute('name') || '',
                  label: getChildText(contactEl, 'label') || '',
                  type: contactEl.getAttribute('type') || '',
                  allegiance: contactEl.getAttribute('allegiance') || '',
                  range: contactEl.getAttribute('range') || '',
                  vector: contactEl.getAttribute('vector') || '',
                  threat: contactEl.getAttribute('threat') || '',
                  lock: toNumber(contactEl.getAttribute('lock') || contactEl.getAttribute('solution')),
                  status: contactEl.getAttribute('status') || '',
                  note: getChildText(contactEl, 'note') || ''
              }))
        : [];

    const weaponControlsEl = findChild(tacticalRoot, 'weaponControls');
    const safeties = weaponControlsEl
        ? Array.from(weaponControlsEl.querySelectorAll('safeties > safety')).map((safetyEl) => ({
              id: safetyEl.getAttribute('id') || null,
              label:
                  (safetyEl.textContent || '').trim() ||
                  safetyEl.getAttribute('label') ||
                  safetyEl.getAttribute('name') ||
                  safetyEl.getAttribute('id') ||
                  '',
              engaged: parseBoolean(safetyEl.getAttribute('engaged') || safetyEl.getAttribute('active')),
              note: safetyEl.getAttribute('note') || ''
          }))
        : [];

    const salvoModes = weaponControlsEl
        ? Array.from(weaponControlsEl.querySelectorAll('salvoModes > mode')).map((modeEl) => ({
              id: modeEl.getAttribute('id') || null,
              value: modeEl.getAttribute('value') || null,
              label:
                  (modeEl.textContent || '').trim() ||
                  modeEl.getAttribute('label') ||
                  modeEl.getAttribute('name') ||
                  modeEl.getAttribute('id') ||
                  '',
              description: modeEl.getAttribute('description') || getChildText(modeEl, 'description') || ''
          }))
        : [];

    const weaponSelected = weaponControlsEl?.getAttribute('selected') || null;

    const shieldsEl = findChild(tacticalRoot, 'shieldDirectives');
    const sectors = shieldsEl
        ? Array.from(shieldsEl.querySelectorAll('sector')).map((sectorEl) => ({
              id: sectorEl.getAttribute('id') || null,
              label:
                  (sectorEl.textContent || '').trim() ||
                  sectorEl.getAttribute('label') ||
                  sectorEl.getAttribute('name') ||
                  sectorEl.getAttribute('id') ||
                  '',
              load: toNumber(sectorEl.getAttribute('load'))
          }))
        : [];

    const shieldNote = shieldsEl ? shieldsEl.getAttribute('note') || getChildText(shieldsEl, 'note') || '' : '';

    const logs = parseLogEntries(tacticalRoot.querySelectorAll('log > entry'));

    return {
        readiness,
        contacts,
        weaponControls: weaponControlsEl
            ? { safeties, salvoModes, selected: weaponSelected || weaponControlsEl.getAttribute('default') || null }
            : null,
        shieldDirectives: shieldsEl ? { sectors, note: shieldNote } : null,
        logs
    };
}

function parseBridgeComms(commsRoot) {
    if (!commsRoot) {
        return null;
    }

    const channelsRoot = findChild(commsRoot, 'channels');
    const channels = channelsRoot
        ? Array.from(channelsRoot.children)
              .filter((child) => isTag(child, 'channel'))
              .map((channelEl) => ({
                  id: channelEl.getAttribute('id') || null,
                  label: channelEl.getAttribute('label') || channelEl.getAttribute('name') || '',
                  frequency: channelEl.getAttribute('frequency') || '',
                  snr: toNumber(channelEl.getAttribute('snr')), 
                  status: channelEl.getAttribute('status') || '',
                  encryption: channelEl.getAttribute('encryption') || '',
                  traffic: channelEl.getAttribute('traffic') || ''
              }))
        : [];

    const hailingRoot = findChild(commsRoot, 'hailingQueue');
    const hailingQueue = hailingRoot
        ? Array.from(hailingRoot.children)
              .filter((child) => isTag(child, 'contact'))
              .map((contactEl) => ({
                  id: contactEl.getAttribute('id') || null,
                  name: contactEl.getAttribute('name') || contactEl.getAttribute('label') || '',
                  priority: contactEl.getAttribute('priority') || '',
                  state: contactEl.getAttribute('state') || '',
                  time: contactEl.getAttribute('time') || ''
              }))
        : [];

    const encryptionRoot = findChild(commsRoot, 'encryptionModes');
    const encryptionModes = encryptionRoot
        ? Array.from(encryptionRoot.children)
              .filter((child) => isTag(child, 'mode'))
              .map((modeEl) => ({
                  id: modeEl.getAttribute('id') || null,
                  value: modeEl.getAttribute('value') || null,
                  label:
                      (modeEl.textContent || '').trim() ||
                      modeEl.getAttribute('label') ||
                      modeEl.getAttribute('name') ||
                      modeEl.getAttribute('id') ||
                      '',
                  active: parseBoolean(modeEl.getAttribute('active'))
              }))
        : [];

    const macrosRoot = findChild(commsRoot, 'macros');
    const macros = macrosRoot
        ? Array.from(macrosRoot.children)
              .filter((child) => isTag(child, 'macro'))
              .map((macroEl) => ({
                  id: macroEl.getAttribute('id') || null,
                  label:
                      (macroEl.textContent || '').trim() ||
                      macroEl.getAttribute('label') ||
                      macroEl.getAttribute('name') ||
                      macroEl.getAttribute('id') ||
                      '',
                  tone: macroEl.getAttribute('tone') || ''
              }))
        : [];

    const log = parseLogEntries(commsRoot.querySelectorAll('log > entry'));

    return { channels, hailingQueue, encryptionModes, macros, log };
}

function parseBridgeSensors(sensorsRoot) {
    if (!sensorsRoot) {
        return null;
    }

    const sweepsRoot = findChild(sensorsRoot, 'sweeps');
    const sweeps = sweepsRoot
        ? Array.from(sweepsRoot.children)
              .filter((child) => isTag(child, 'sweep'))
              .map((sweepEl) => ({
                  id: sweepEl.getAttribute('id') || null,
                  label: sweepEl.getAttribute('label') || sweepEl.getAttribute('name') || '',
                  status: sweepEl.getAttribute('status') || '',
                  progress: toNumber(sweepEl.getAttribute('progress')),
                  band: sweepEl.getAttribute('band') || sweepEl.getAttribute('spectrum') || '',
                  eta: sweepEl.getAttribute('eta') || ''
              }))
        : [];

    const contactsRoot = findChild(sensorsRoot, 'contacts');
    const contacts = contactsRoot
        ? Array.from(contactsRoot.children)
              .filter((child) => isTag(child, 'contact'))
              .map((contactEl) => ({
                  id: contactEl.getAttribute('id') || null,
                  label: contactEl.getAttribute('label') || contactEl.getAttribute('name') || '',
                  classification: contactEl.getAttribute('classification') || '',
                  range: contactEl.getAttribute('range') || '',
                  vector: contactEl.getAttribute('vector') || '',
                  signature: contactEl.getAttribute('signature') || '',
                  confidence: toNumber(contactEl.getAttribute('confidence')),
                  note: getChildText(contactEl, 'note') || ''
              }))
        : [];

    const analysisRoot = findChild(sensorsRoot, 'analysis');
    const analysis = analysisRoot
        ? Array.from(analysisRoot.children)
              .filter((child) => isTag(child, 'job'))
              .map((jobEl) => ({
                  id: jobEl.getAttribute('id') || null,
                  label: jobEl.getAttribute('label') || jobEl.getAttribute('name') || '',
                  assignedTo: jobEl.getAttribute('assignedTo') || jobEl.getAttribute('team') || '',
                  status: jobEl.getAttribute('status') || ''
              }))
        : [];

    const queueRoot = findChild(sensorsRoot, 'queues');
    const queues = queueRoot
        ? Array.from(queueRoot.children)
              .filter((child) => isTag(child, 'job'))
              .map((jobEl) => ({
                  id: jobEl.getAttribute('id') || null,
                  label: jobEl.getAttribute('label') || jobEl.getAttribute('name') || '',
                  status: jobEl.getAttribute('status') || ''
              }))
        : [];

    const logs = parseLogEntries(sensorsRoot.querySelectorAll('log > entry'));

    return {
        sweeps,
        noiseLevel: toNumber(sensorsRoot.getAttribute('noiseLevel') || sensorsRoot.getAttribute('noise')),
        radiationLevel: toNumber(sensorsRoot.getAttribute('radiationLevel') || sensorsRoot.getAttribute('radiation')),
        calibrationDue: sensorsRoot.getAttribute('calibrationDue') || '',
        contacts,
        analysis,
        queues,
        logs
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

function parseEngineeringPower(doc) {
    const powerRoot = doc.querySelector('scenario > ship > engineering > power');
    if (!powerRoot) {
        return null;
    }

    const distribution = Array.from(powerRoot.querySelectorAll('distribution > bus')).map((busEl) => ({
        id: busEl.getAttribute('id') || null,
        name: busEl.getAttribute('name') || '',
        value: toNumber(busEl.getAttribute('value')),
        min: toNumber(busEl.getAttribute('min')),
        max: toNumber(busEl.getAttribute('max')),
        step: toNumber(busEl.getAttribute('step')),
        unit: busEl.getAttribute('unit') || '%',
        status: busEl.getAttribute('status') || '',
        tone: safeLower(busEl.getAttribute('tone')) || undefined,
        description: busEl.getAttribute('description') || getChildText(busEl, 'description') || '',
        note: getChildText(busEl, 'note') || ''
    }));

    const profiles = Array.from(powerRoot.querySelectorAll('profiles > profile')).map((profileEl) => ({
        id: profileEl.getAttribute('id') || null,
        label: profileEl.getAttribute('label') || profileEl.getAttribute('name') || '',
        description: profileEl.getAttribute('description') || getChildText(profileEl, 'description') || '',
        note: getChildText(profileEl, 'note') || '',
        active: parseBoolean(profileEl.getAttribute('active'))
    }));

    const circuits = Array.from(powerRoot.querySelectorAll('circuits > circuit')).map((circuitEl) => ({
        id: circuitEl.getAttribute('id') || null,
        label: circuitEl.getAttribute('label') || '',
        defaultChecked: parseBoolean(
            circuitEl.getAttribute('defaultChecked') ||
                circuitEl.getAttribute('enabled') ||
                circuitEl.getAttribute('armed')
        ),
        tone: safeLower(circuitEl.getAttribute('tone')) || 'default',
        description: circuitEl.getAttribute('description') || getChildText(circuitEl, 'description') || '',
        note: getChildText(circuitEl, 'note') || ''
    }));

    const metrics = Array.from(powerRoot.querySelectorAll('metrics > metric'))
        .map((metricEl) => parseMetricElement(metricEl))
        .filter(Boolean);

    const log = parseLogEntries(powerRoot.querySelectorAll('log > entry'));

    return { distribution, profiles, circuits, metrics, log };
}

function parseEngineeringThermal(doc) {
    const thermalRoot = doc.querySelector('scenario > ship > engineering > thermal');
    if (!thermalRoot) {
        return null;
    }

    const radiators = Array.from(thermalRoot.querySelectorAll('radiators > radiator')).map((radiatorEl) => ({
        id: radiatorEl.getAttribute('id') || null,
        label: radiatorEl.getAttribute('label') || radiatorEl.getAttribute('name') || '',
        value: toNumber(radiatorEl.getAttribute('value')),
        unit: radiatorEl.getAttribute('unit') || '%',
        status: safeLower(radiatorEl.getAttribute('status') || radiatorEl.getAttribute('tone')) || 'normal',
        note: radiatorEl.getAttribute('note') || getChildText(radiatorEl, 'note') || '',
        min: toNumber(radiatorEl.getAttribute('min')),
        max: toNumber(radiatorEl.getAttribute('max'))
    }));

    const loops = Array.from(thermalRoot.querySelectorAll('loops > loop')).map((loopEl) => ({
        id: loopEl.getAttribute('id') || null,
        name: loopEl.getAttribute('label') || loopEl.getAttribute('name') || '',
        pump: toNumber(loopEl.getAttribute('pump')),
        flow: toNumber(loopEl.getAttribute('flow')),
        flowUnit: loopEl.getAttribute('flowUnit') || loopEl.getAttribute('flowunit') || 'l/min',
        min: toNumber(loopEl.getAttribute('min')),
        max: toNumber(loopEl.getAttribute('max')),
        step: toNumber(loopEl.getAttribute('step')),
        unit: loopEl.getAttribute('unit') || '%',
        status: loopEl.getAttribute('status') || '',
        statusLabel: loopEl.getAttribute('statusLabel') || loopEl.getAttribute('statuslabel') || '',
        statusTone: safeLower(loopEl.getAttribute('tone') || loopEl.getAttribute('statusTone')) || '',
        description: loopEl.getAttribute('description') || getChildText(loopEl, 'description') || '',
        note: getChildText(loopEl, 'note') || ''
    }));

    const emergencyChecklistRoot = thermalRoot.querySelector('emergencyChecklist');
    const emergencyChecklist = emergencyChecklistRoot
        ? Array.from(emergencyChecklistRoot.querySelectorAll('item')).map((itemEl) => ({
              id: itemEl.getAttribute('id') || null,
              label: itemEl.getAttribute('label') || '',
              checked: parseBoolean(itemEl.getAttribute('checked') || itemEl.getAttribute('completed')),
              note: itemEl.getAttribute('note') || getChildText(itemEl, 'note') || ''
          }))
        : [];

    const log = parseLogEntries(thermalRoot.querySelectorAll('log > entry'));

    return { radiators, loops, emergencyChecklist, log };
}

function parseEngineeringPropulsion(doc) {
    const propulsionRoot = doc.querySelector('scenario > ship > engineering > propulsion');
    if (!propulsionRoot) {
        return null;
    }

    const throttleEl = propulsionRoot.querySelector('throttle');
    const throttle = throttleEl
        ? {
              id: throttleEl.getAttribute('id') || null,
              label: throttleEl.getAttribute('label') || '',
              min: toNumber(throttleEl.getAttribute('min')),
              max: toNumber(throttleEl.getAttribute('max')),
              step: toNumber(throttleEl.getAttribute('step')),
              value: toNumber(throttleEl.getAttribute('value')),
              unit: throttleEl.getAttribute('unit') || '%',
              description: throttleEl.getAttribute('description') || getChildText(throttleEl, 'description') || ''
          }
        : null;

    const deltaVEl = propulsionRoot.querySelector('deltaV');
    const deltaV = deltaVEl
        ? {
              label: deltaVEl.getAttribute('label') || '',
              value: toNumber(deltaVEl.getAttribute('value')),
              unit: deltaVEl.getAttribute('unit') || '',
              status: safeLower(deltaVEl.getAttribute('status')) || 'normal',
              note: deltaVEl.getAttribute('note') || getChildText(deltaVEl, 'note') || '',
              min: toNumber(deltaVEl.getAttribute('min')),
              max: toNumber(deltaVEl.getAttribute('max'))
          }
        : null;

    const vectorAxes = Array.from(propulsionRoot.querySelectorAll('vector > axis')).map((axisEl) => ({
        id: axisEl.getAttribute('id') || null,
        label: axisEl.getAttribute('label') || '',
        min: toNumber(axisEl.getAttribute('min')),
        max: toNumber(axisEl.getAttribute('max')),
        step: toNumber(axisEl.getAttribute('step')),
        value: toNumber(axisEl.getAttribute('value')),
        unit: axisEl.getAttribute('unit') || ''
    }));

    const thrusters = Array.from(propulsionRoot.querySelectorAll('thrusters > thruster')).map((thrusterEl) => ({
        id: thrusterEl.getAttribute('id') || null,
        name: thrusterEl.getAttribute('name') || thrusterEl.getAttribute('label') || '',
        active: parseBoolean(thrusterEl.getAttribute('active') || thrusterEl.getAttribute('enabled')),
        status: thrusterEl.getAttribute('status') || '',
        tone: safeLower(thrusterEl.getAttribute('tone')) || undefined,
        onLabel: thrusterEl.getAttribute('onLabel') || thrusterEl.getAttribute('onlabel') || '',
        offLabel: thrusterEl.getAttribute('offLabel') || thrusterEl.getAttribute('offlabel') || '',
        note: getChildText(thrusterEl, 'note') || ''
    }));

    const checklist = Array.from(propulsionRoot.querySelectorAll('checklist > item')).map((itemEl) => ({
        id: itemEl.getAttribute('id') || null,
        label: itemEl.getAttribute('label') || '',
        checked: parseBoolean(itemEl.getAttribute('checked') || itemEl.getAttribute('completed')),
        note: itemEl.getAttribute('note') || getChildText(itemEl, 'note') || ''
    }));

    return { throttle, deltaV, vectorAxes, thrusters, checklist };
}

function parseEngineeringFtl(doc) {
    const ftlRoot = doc.querySelector('scenario > ship > engineering > ftl');
    if (!ftlRoot) {
        return null;
    }

    const chargeEl = ftlRoot.querySelector('charge');
    const charge = chargeEl
        ? {
              label: chargeEl.getAttribute('label') || '',
              value: toNumber(chargeEl.getAttribute('value')),
              unit: chargeEl.getAttribute('unit') || '%',
              status: safeLower(chargeEl.getAttribute('status')) || 'normal',
              note: chargeEl.getAttribute('note') || getChildText(chargeEl, 'note') || '',
              min: toNumber(chargeEl.getAttribute('min')),
              max: toNumber(chargeEl.getAttribute('max'))
          }
        : null;

    const targetEl = ftlRoot.querySelector('target');
    const target = targetEl
        ? {
              id: targetEl.getAttribute('id') || null,
              label: targetEl.getAttribute('label') || '',
              min: toNumber(targetEl.getAttribute('min')),
              max: toNumber(targetEl.getAttribute('max')),
              step: toNumber(targetEl.getAttribute('step')),
              value: toNumber(targetEl.getAttribute('value')),
              unit: targetEl.getAttribute('unit') || '%',
              description: targetEl.getAttribute('description') || getChildText(targetEl, 'description') || ''
          }
        : null;

    const stabilityMetrics = Array.from(ftlRoot.querySelectorAll('stabilityMetrics > metric'))
        .map((metricEl) => parseMetricElement(metricEl))
        .filter(Boolean);

    const stabilityLog = parseLogEntries(ftlRoot.querySelectorAll('stabilityLog > entry'));

    const interlocks = Array.from(ftlRoot.querySelectorAll('interlocks > interlock')).map((interlockEl) => ({
        id: interlockEl.getAttribute('id') || null,
        label: interlockEl.getAttribute('label') || '',
        defaultChecked: parseBoolean(
            interlockEl.getAttribute('defaultChecked') ||
                interlockEl.getAttribute('enabled') ||
                interlockEl.getAttribute('active')
        ),
        tone: safeLower(interlockEl.getAttribute('tone')) || 'default',
        description: interlockEl.getAttribute('description') || getChildText(interlockEl, 'description') || '',
        note: getChildText(interlockEl, 'note') || ''
    }));

    const abortPlaceholder =
        getChildText(ftlRoot, 'abortPlaceholder') || ftlRoot.getAttribute('abortPlaceholder') || '';

    const abortLog = parseLogEntries(ftlRoot.querySelectorAll('abortLog > entry'));

    return { charge, target, stabilityMetrics, stabilityLog, interlocks, abortPlaceholder, abortLog };
}

function parseDefense(doc) {
    const defenseRoot = doc.querySelector('scenario > defense');
    if (!defenseRoot) {
        return { shields: null, hull: null };
    }

    return {
        shields: parseDefenseShields(findChild(defenseRoot, 'shields')),
        hull: parseDefenseHull(findChild(defenseRoot, 'hull'))
    };
}

function parseDefenseShields(shieldsRoot) {
    if (!shieldsRoot) {
        return null;
    }

    const sectors = Array.from(shieldsRoot.querySelectorAll('sectors > sector')).map((sectorEl) => ({
        id: sectorEl.getAttribute('id') || null,
        label: sectorEl.getAttribute('label') || sectorEl.getAttribute('name') || '',
        arc: sectorEl.getAttribute('arc') || '',
        strength: toNumber(sectorEl.getAttribute('strength')),
        capacity: toNumber(sectorEl.getAttribute('capacity')),
        status: safeLower(sectorEl.getAttribute('status')),
        regen: toNumber(sectorEl.getAttribute('regen')),
        focus: sectorEl.getAttribute('focus') || '',
        note: getChildText(sectorEl, 'note') || ''
    }));

    const reinforcementRoot = findChild(shieldsRoot, 'reinforcement');
    const reinforcement = reinforcementRoot
        ? {
              modes: Array.from(reinforcementRoot.querySelectorAll('mode')).map((modeEl) => ({
                  value: modeEl.getAttribute('value') || modeEl.getAttribute('id') || '',
                  label: modeEl.getAttribute('label') || modeEl.getAttribute('name') || '',
                  description: modeEl.getAttribute('description') || getChildText(modeEl, 'description') || ''
              })),
              currentMode: reinforcementRoot.getAttribute('current') || reinforcementRoot.getAttribute('mode') || '',
              regenTarget: (() => {
                  const targetEl = reinforcementRoot.querySelector('regenTarget');
                  if (!targetEl) {
                      return null;
                  }
                  return {
                      id: targetEl.getAttribute('id') || null,
                      label: targetEl.getAttribute('label') || '',
                      min: toNumber(targetEl.getAttribute('min')),
                      max: toNumber(targetEl.getAttribute('max')),
                      step: toNumber(targetEl.getAttribute('step')),
                      value: toNumber(targetEl.getAttribute('value')),
                      unit: targetEl.getAttribute('unit') || '%',
                      description: targetEl.getAttribute('description') || getChildText(targetEl, 'description') || ''
                  };
              })(),
              boosts: Array.from(reinforcementRoot.querySelectorAll('boost')).map((boostEl) => ({
                  id: boostEl.getAttribute('id') || null,
                  label: boostEl.getAttribute('label') || '',
                  min: toNumber(boostEl.getAttribute('min')),
                  max: toNumber(boostEl.getAttribute('max')),
                  step: toNumber(boostEl.getAttribute('step')),
                  value: toNumber(boostEl.getAttribute('value')),
                  unit: boostEl.getAttribute('unit') || '%',
                  status: safeLower(boostEl.getAttribute('status')),
                  note: getChildText(boostEl, 'note') || ''
              })),
              reserves: Array.from(reinforcementRoot.querySelectorAll('reserve')).map((reserveEl) => ({
                  id: reserveEl.getAttribute('id') || null,
                  label: reserveEl.getAttribute('label') || '',
                  defaultChecked: parseBoolean(
                      reserveEl.getAttribute('defaultChecked') ||
                          reserveEl.getAttribute('enabled') ||
                          reserveEl.getAttribute('active')
                  ),
                  tone: safeLower(reserveEl.getAttribute('tone')) || 'default',
                  description: reserveEl.getAttribute('description') || getChildText(reserveEl, 'description') || ''
              }))
          }
        : null;

    const walls = Array.from(shieldsRoot.querySelectorAll('walls > wall')).map((wallEl) => ({
        id: wallEl.getAttribute('id') || null,
        label: wallEl.getAttribute('label') || '',
        status: safeLower(wallEl.getAttribute('status')),
        cooldown: wallEl.getAttribute('cooldown') || '',
        interlocks: Array.from(wallEl.querySelectorAll('interlock')).map((interlockEl) => ({
            id: interlockEl.getAttribute('id') || null,
            label: interlockEl.getAttribute('label') || '',
            status: safeLower(interlockEl.getAttribute('status'))
        })),
        note: getChildText(wallEl, 'note') || ''
    }));

    const priorities = Array.from(shieldsRoot.querySelectorAll('priorities > priority')).map((priorityEl) => ({
        id: priorityEl.getAttribute('id') || null,
        target: priorityEl.getAttribute('target') || '',
        priority: priorityEl.getAttribute('priority') || priorityEl.getAttribute('level') || '',
        alignment: priorityEl.getAttribute('alignment') || priorityEl.getAttribute('sector') || '',
        note: getChildText(priorityEl, 'note') || ''
    }));

    const log = parseLogEntries(shieldsRoot.querySelectorAll('log > entry'));

    return { sectors, reinforcement, walls, priorities, log };
}

function parseDefenseHull(hullRoot) {
    if (!hullRoot) {
        return null;
    }

    const integrityMetrics = Array.from(hullRoot.querySelectorAll('integrity > metric'))
        .map((metricEl) => parseMetricElement(metricEl))
        .filter(Boolean);

    const stressPoints = Array.from(hullRoot.querySelectorAll('stressPoints > point')).map((pointEl) => ({
        id: pointEl.getAttribute('id') || null,
        label: pointEl.getAttribute('label') || pointEl.getAttribute('name') || '',
        status: safeLower(pointEl.getAttribute('status')),
        load: toNumber(pointEl.getAttribute('load')),
        resonance: toNumber(pointEl.getAttribute('resonance')),
        note: getChildText(pointEl, 'note') || ''
    }));

    const bulkheads = Array.from(hullRoot.querySelectorAll('bulkheads > bulkhead')).map((bulkheadEl) => ({
        id: bulkheadEl.getAttribute('id') || null,
        location: bulkheadEl.getAttribute('location') || bulkheadEl.getAttribute('name') || '',
        status: safeLower(bulkheadEl.getAttribute('status')),
        pressure: toNumber(bulkheadEl.getAttribute('pressure')),
        pressureUnit: bulkheadEl.getAttribute('pressureUnit') || bulkheadEl.getAttribute('pressureunit') || 'kPa',
        seal: bulkheadEl.getAttribute('seal') || '',
        note: getChildText(bulkheadEl, 'note') || ''
    }));

    const bracing = Array.from(hullRoot.querySelectorAll('bracing > brace')).map((braceEl) => ({
        id: braceEl.getAttribute('id') || null,
        label: braceEl.getAttribute('label') || braceEl.getAttribute('name') || '',
        engaged: parseBoolean(braceEl.getAttribute('engaged') || braceEl.getAttribute('active')),
        tone: safeLower(braceEl.getAttribute('tone')) || 'default',
        description: braceEl.getAttribute('description') || getChildText(braceEl, 'description') || ''
    }));

    const resonanceAlerts = Array.from(hullRoot.querySelectorAll('resonanceAlerts > alert')).map((alertEl) => ({
        id: alertEl.getAttribute('id') || null,
        frequency: alertEl.getAttribute('frequency') || '',
        severity: safeLower(alertEl.getAttribute('severity')),
        recommendation: getChildText(alertEl, 'recommendation') || alertEl.getAttribute('recommendation') || ''
    }));

    const log = parseLogEntries(hullRoot.querySelectorAll('log > entry'));

    return { integrityMetrics, stressPoints, bulkheads, bracing, resonanceAlerts, log };
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

function parseMetricElement(metricEl) {
    if (!metricEl) {
        return null;
    }
    return {
        id: metricEl.getAttribute('id') || null,
        label: metricEl.getAttribute('label') || '',
        value: toNumber(metricEl.getAttribute('value')),
        unit: metricEl.getAttribute('unit') || '',
        status: safeLower(metricEl.getAttribute('status')) || 'normal',
        note: metricEl.getAttribute('note') || getChildText(metricEl, 'note') || '',
        min: toNumber(metricEl.getAttribute('min')),
        max: toNumber(metricEl.getAttribute('max'))
    };
}

function parseLogEntries(nodeList) {
    if (!nodeList) {
        return [];
    }
    return Array.from(nodeList)
        .map((entry) => (entry.textContent || '').trim())
        .filter((text) => text.length > 0);
}

function parseBoolean(value) {
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (!normalized) {
            return null;
        }
        if (['true', '1', 'yes', 'on', 'active', 'enabled', 'ja'].includes(normalized)) {
            return true;
        }
        if (['false', '0', 'no', 'off', 'inactive', 'disabled', 'nein'].includes(normalized)) {
            return false;
        }
        return null;
    }
    if (typeof value === 'number') {
        return value !== 0;
    }
    if (typeof value === 'boolean') {
        return value;
    }
    return null;
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
