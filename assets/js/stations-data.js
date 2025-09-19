export const STATION_DEFINITIONS = [
    {
        id: 'bridge-command',
        code: 'BR-01',
        category: 'Brücke',
        name: 'Kommandopult',
        summary: 'Zentrale Autorisierung für Alarmstufen, Missionsziele und globale Systemfreigaben.',
        tasks: [
            'Alarmzustände setzen und kommunizieren',
            'Missionsziele freigeben oder sperren',
            'Kritische Freigaben für Waffen, Sprung- und Hilfssysteme koordinieren',
            'Notfall-Makros und Prioritäten verwalten'
        ],
        controls: [
            'Alert-State Umschaltung mit Status-Feedback',
            'Dashboard mit Missionsziel-Fortschritt',
            'Globale Freigabe-Toggles für kritische Systeme',
            'Notfall-Makro-Konsole für vorbereitete Aktionen'
        ],
        dependencies: [
            'Lesender Zugriff auf alle Stationsdaten',
            'Freigabe-Schnittstellen zu Waffen, FTL und Engineering'
        ],
        locality: 'Remote-fähig (kein tiefer Systemeinstellungszugriff erforderlich)',
        htmlPath: 'bridge/command/',
        jsModules: ['assets/js/stations-data.js', 'assets/js/station-page.js']
    },
    {
        id: 'bridge-helm',
        code: 'BR-02',
        category: 'Brücke',
        name: 'Flug- / Helmstation',
        summary: 'Primäre Steuerung für Kurs, Manöver, Andockvorgänge und Formation.',
        tasks: [
            'Kurs- und Manöverbefehle setzen',
            'Andock- und Formationsmanöver durchführen',
            'Autopilot-Modi verwalten und überwachen',
            'Kollisionswarnungen auswerten und reagieren'
        ],
        controls: [
            'Anzeige von Haltung, Geschwindigkeit und Trägheitsdämpfern',
            'Waypoint- und Flugplanverwaltung',
            'Manuelle und automatische Steuerungsmodi',
            'Kollisions- und Annäherungswarnungen'
        ],
        dependencies: [
            'Navigationslösungen und Kursvorgaben',
            'Antriebsleistung und RCS-Verfügbarkeit',
            'Sensorbasierte Lageinformationen'
        ],
        locality: 'Bedienung auf der Brücke mit direktem Zugriff auf Steuerbefehle',
        htmlPath: 'bridge/helm/',
        jsModules: ['assets/js/stations-data.js', 'assets/js/station-page.js']
    },
    {
        id: 'bridge-nav',
        code: 'BR-03',
        category: 'Brücke',
        name: 'Navigation & Kartografie',
        summary: 'Routenplanung, Sprungfensterberechnung und Pflege der Sternkarten.',
        tasks: [
            'Routen und Sprungfenster planen',
            'ETA-Berechnungen durchführen und bestätigen',
            'Kartendaten und Sensorbeobachtungen synchronisieren',
            'Navigationslösungen für den Helm verifizieren'
        ],
        controls: [
            'Sternkarten und Sektorübersichten',
            'Sprungfenster-Timer und Statusanzeigen',
            'Werkzeuge zur Kurslösung und Alternativrouten',
            'Validierungskonsole für Navigationsfreigaben'
        ],
        dependencies: [
            'Astrometrische Sensordaten',
            'Leistungsfenster des Reaktors für FTL',
            'Anforderungen aus Missionszielen und Taktik'
        ],
        locality: 'Remote-fähig mit Berechtigungen für Kursänderungen',
        htmlPath: 'bridge/nav/',
        jsModules: ['assets/js/stations-data.js', 'assets/js/station-page.js']
    },
    {
        id: 'bridge-tactical',
        code: 'BR-04',
        category: 'Brücke',
        name: 'Taktik & Feuerleitung (CIC-Light)',
        summary: 'Zielauswahl, Waffenkoordination und Bedrohungsanalyse für kleinere Gefechte.',
        tasks: [
            'Ziele priorisieren und Bedrohungen einstufen',
            'Waffenfreigaben koordinieren',
            'Schilde und Waffen mit taktischen Prioritäten abstimmen',
            'Salven- und Abklingzeiten überwachen'
        ],
        controls: [
            'Taktisches Radar mit Ziel-Lock-Queue',
            'Waffenstatus und Munitionsübersicht',
            'Schildsektor-Verteilung und Verstärkungsbefehle',
            'Echtzeit-Bedrohungsmatrix'
        ],
        dependencies: [
            'Waffen-, Schild- und Sensorschnittstellen',
            'Elektronische Kampfführung für Lageinformationen',
            'Freigaben von Kommandopult und CIC'
        ],
        locality: 'Vorzugsweise auf der Brücke, Gefechtsschnittstellen nur mit Freigabe',
        htmlPath: 'bridge/tactical/',
        jsModules: ['assets/js/stations-data.js', 'assets/js/station-page.js']
    },
    {
        id: 'bridge-comms',
        code: 'BR-05',
        category: 'Brücke',
        name: 'Kommunikation',
        summary: 'Kontaktaufnahme, Kanalverwaltung, Verschlüsselung und Notrufe.',
        tasks: [
            'Handshake- und Hailing-Protokolle steuern',
            'Kommunikationskanäle auswählen und überwachen',
            'Verschlüsselungsstufen und Protokolle setzen',
            'Notrufe und Prioritätsmeldungen koordinieren'
        ],
        controls: [
            'Kanalwahl mit Signal-Rausch-Verhältnis',
            'Störungsmonitor für Frequenzen',
            'Bibliothek vordefinierter Botschaften',
            'Sendeleistungsanzeige mit Override-Funktionen'
        ],
        dependencies: [
            'Antennen- und Sendeleistung aus dem Energiesystem',
            'Interferenzdaten aus der EW-Sektion',
            'Zugriff auf Sicherheitsrichtlinien'
        ],
        locality: 'Remote-fähig, Bedienung bevorzugt auf der Brücke',
        htmlPath: 'bridge/comms/',
        jsModules: ['assets/js/stations-data.js', 'assets/js/station-page.js']
    },
    {
        id: 'bridge-sensors',
        code: 'BR-06',
        category: 'Brücke',
        name: 'Sensoren & Operations',
        summary: 'Aktive und passive Scans, Signaturanalyse und Kontaktklassifizierung.',
        tasks: [
            'Sensor-Scans planen und auslösen',
            'Signaturdaten analysieren und Kontakte klassifizieren',
            'Scan-Jobs verwalten und priorisieren',
            'Spuren- und Verlaufsauswertung durchführen'
        ],
        controls: [
            'EM- und Thermalspektren mit Analysewerkzeugen',
            'Scan-Job-Planer und Statusanzeigen',
            'Kontaktlisten mit Klassifizierungsstatus',
            'Trail- und Verlaufsvisualisierung'
        ],
        dependencies: [
            'Radiator- und Signaturinformationen',
            'EW-Lage und Gegenmaßnahmen',
            'Energie- und Kühlungsfenster'
        ],
        locality: 'Remote möglich, Kernbedienung auf der Brücke empfohlen',
        htmlPath: 'bridge/sensors/',
        jsModules: ['assets/js/stations-data.js', 'assets/js/station-page.js']
    },
    {
        id: 'eng-reactor',
        code: 'EN-01',
        category: 'Maschinenraum',
        name: 'Reaktorkontrolle',
        summary: 'Start, Shutdown, Moduswahl und Sicherheit des Hauptreaktors.',
        tasks: [
            'Reaktorstart und -abschaltung koordinieren',
            'Betriebsmodi (Eco/Burst) umschalten',
            'Hitze- und Neutronenfluss überwachen',
            'SCRAM und Fail-Safes auslösen'
        ],
        controls: [
            'Reaktor-Output-Kurven und Effizienz',
            'Kühlmittel-Statusanzeigen',
            'Startsequenz- und Sicherheits-Panel',
            'Notabschalt- und Fail-Safe-Schaltungen'
        ],
        dependencies: [
            'Kühlkreislauf- und Radiatorstatus',
            'Hüllsensoren für Lecks und Strahlung',
            'Schutzinterlocks mit FTL und Energieverteilung'
        ],
        locality: 'Lokale Bedienung zwingend erforderlich, Remote nur Anzeige und Not-SCRAM',
        htmlPath: 'eng/reactor/',
        jsModules: ['assets/js/stations-data.js', 'assets/js/station-page.js', 'assets/js/station-operations.js']
    },
    {
        id: 'eng-power',
        code: 'EN-02',
        category: 'Maschinenraum',
        name: 'Energieverteilung',
        summary: 'Zuweisung der Reaktorleistung auf Subsysteme und Lastabwurfszenarien.',
        tasks: [
            'Leistung auf Busse und Subsysteme verteilen',
            'Lastabwürfe vorbereiten und auslösen',
            'Prioritätenprofile erstellen und anwenden',
            'Brownout-Warnungen überwachen'
        ],
        controls: [
            'Prozentuale Leistungsregler pro Energiebus',
            'Preset-Verwaltung für Einsatzszenarien',
            'Warnanzeigen für Überlast und Brownouts',
            'Live-Überblick über Systemintegrität'
        ],
        dependencies: [
            'Aktueller Reaktoroutput',
            'Integritätsdaten der Energieverteilungsbusse',
            'Rückmeldungen aus kritischen Subsystemen'
        ],
        locality: 'Maschinenraum-Bedienung empfohlen, Remote-Übersicht möglich',
        htmlPath: 'eng/power/',
        jsModules: ['assets/js/stations-data.js', 'assets/js/station-page.js', 'assets/js/station-operations.js']
    },
    {
        id: 'eng-thermal',
        code: 'EN-03',
        category: 'Maschinenraum',
        name: 'Thermalkontrolle & Radiatoren',
        summary: 'Management von Wärmestau, Radiatorflächen und Notkühlung.',
        tasks: [
            'Temperaturdifferenzen überwachen und ausgleichen',
            'Radiatoren ausfahren und konfigurieren',
            'Pumpen und Kühlzyklen steuern',
            'Heat-Budget gegen Signaturanforderungen abwägen'
        ],
        controls: [
            'ΔT-Graphen und Wärmelast-Visualisierung',
            'Radiatorflächennutzung und Pumpenkontrolle',
            'Notkühlungsbefehle und Grenzwertwarnungen',
            'Signatur- und Tarnungsfeedback'
        ],
        dependencies: [
            'Reaktorleistungsdaten',
            'Schild- und Waffenwärmeentwicklung',
            'Status der Außenhaut und Radiatorsegmente'
        ],
        locality: 'Lokale Bedienung im Maschinenraum bevorzugt',
        htmlPath: 'eng/thermal/',
        jsModules: ['assets/js/stations-data.js', 'assets/js/station-page.js', 'assets/js/station-operations.js']
    },
    {
        id: 'eng-propulsion',
        code: 'EN-04',
        category: 'Maschinenraum',
        name: 'Antrieb (Sublight/Impuls)',
        summary: 'Steuerung der Schubkurven, Treibstoffversorgung und Triebwerksdiagnose.',
        tasks: [
            'Schubprofile festlegen und anpassen',
            'Treibstoff- bzw. Plasmafluss regeln',
            'Triebwerksgesundheit überwachen',
            'Vibrationen und Unwuchten erkennen'
        ],
        controls: [
            'Drossel- und Gimbaleinstellungen',
            'Restreichweiten- und Treibstoffanzeigen',
            'Diagnosewerkzeuge für Vibration und Status',
            'Rückmeldungen zu Flight-Commands'
        ],
        dependencies: [
            'Energiezuweisungen aus der Energieverteilung',
            'Thermalkapazitäten und Kühlung',
            'Befehle der Helmstation'
        ],
        locality: 'Maschinenraumstation mit Flugfreigabe-Schnittstelle',
        htmlPath: 'eng/propulsion/',
        jsModules: ['assets/js/stations-data.js', 'assets/js/station-page.js', 'assets/js/station-operations.js']
    },
    {
        id: 'eng-ftl',
        code: 'EN-05',
        category: 'Maschinenraum',
        name: 'FTL / Jump-Core',
        summary: 'Ladung, Feldstabilität und Interlocks des Überlichtantriebs steuern.',
        tasks: [
            'Spulenladung vorbereiten und überwachen',
            'Feldstabilität und Jitter messen',
            'Sprungfenster-Countdown koordinieren',
            'Abbruch- und Sicherheitsprotokolle auslösen'
        ],
        controls: [
            'Ladungsstatus und Stabilitätsanzeigen',
            'Countdown- und Fensteranzeige',
            'Interlock-Status (Captain/Engineer)',
            'FTL-Abbruch und Sicherheitsfunktionen'
        ],
        dependencies: [
            'Navigationskoordinaten und Ziele',
            'Reaktorleistung und Energieprioritäten',
            'Strukturelle Belastungswerte der Hülle'
        ],
        locality: 'Maschinenraum (lokal) mit Mehrfachfreigabe',
        htmlPath: 'eng/ftl/',
        jsModules: ['assets/js/stations-data.js', 'assets/js/station-page.js', 'assets/js/station-operations.js']
    },
    {
        id: 'eng-damage',
        code: 'EN-06',
        category: 'Maschinenraum',
        name: 'Schadenskontrolle & Leitungen',
        summary: 'Störungen isolieren, Bypässe setzen und Reparaturaufträge koordinieren.',
        tasks: [
            'Sektionen- und Leitungsschäden lokalisieren',
            'Bypässe und Abschaltungen konfigurieren',
            'Reparaturteams disponieren',
            'Status der Schotte und Struktur melden'
        ],
        controls: [
            'Sektionskarten mit Schadensmarkern',
            'Leitungsschemata und Ventil-/Breaker-Toggles',
            'Auftragslisten für Reparaturen',
            'Statusüberblick über Ersatzteillager'
        ],
        dependencies: [
            'Hüllen- und Schottstatus',
            'Sicherheits- und Sensoralarme',
            'Logistikdaten zu Ersatzteilen'
        ],
        locality: 'Lokale Maschinenraumzentrale, Remote-Bestätigung möglich',
        htmlPath: 'eng/damage/',
        jsModules: ['assets/js/stations-data.js', 'assets/js/station-page.js', 'assets/js/station-operations.js']
    },
    {
        id: 'def-shields',
        code: 'SH-01',
        category: 'Schilde & Hülle',
        name: 'Schildsteuerung',
        summary: 'Verteilung, Verstärkung und Regeneration der Schildsektoren.',
        tasks: [
            'Schildenergie nach Sektoren verteilen',
            'Verstärkungen und Regenerationsfenster planen',
            'Notfall-Barrieren auslösen',
            'Schildstatus mit Taktik synchronisieren'
        ],
        controls: [
            '360°-Sektoranzeige der Schildkapazität',
            'Regenerationsrate und Verstärkungsregler',
            'Not-Wall Auslöser und Interlocks',
            'Verlinkung zu taktischen Prioritäten'
        ],
        dependencies: [
            'Energie- und Thermalrahmenbedingungen',
            'Taktische Anweisungen und Bedrohungsdaten',
            'Statusberichte aus Schadenskontrolle'
        ],
        locality: 'Bedienung in Verteidigungszentrale oder CIC, Remote nur begrenzt',
        htmlPath: 'def/shields/',
        jsModules: ['assets/js/stations-data.js', 'assets/js/station-page.js', 'assets/js/station-operations.js']
    },
    {
        id: 'def-hull',
        code: 'SH-02',
        category: 'Schilde & Hülle',
        name: 'Hülle & Strukturelle Integrität',
        summary: 'Überwacht strukturelle Belastungen, Risse und Notverstrebungen.',
        tasks: [
            'Belastungen und Resonanzen überwachen',
            'Risse und Deformationen melden',
            'Schottzustände kontrollieren',
            'Notverstrebungen aktivieren'
        ],
        controls: [
            'Strain-Heatmaps der Hülle',
            'Schottstatus- und Verriegelungsübersicht',
            'Warnmeldungen für kritische Resonanzen',
            'Verstrebungs- und Sicherungsprotokolle'
        ],
        dependencies: [
            'Flugmanöver- und Beschleunigungsdaten',
            'Trefferdaten aus Taktik/CIC',
            'Docking- und Andruckkräfte'
        ],
        locality: 'Verteidigungszentrum oder Maschinenraumüberwachung',
        htmlPath: 'def/hull/',
        jsModules: ['assets/js/stations-data.js', 'assets/js/station-page.js', 'assets/js/station-operations.js']
    },
    {
        id: 'cic-tracks',
        code: 'CIC-01',
        category: 'CIC',
        name: 'Lagebild & Track Management',
        summary: 'Fusioniert Sensortracks, führt IFF-Prüfungen durch und pflegt die Threat Matrix.',
        tasks: [
            'Sensortracks zusammenführen und bereinigen',
            'IFF-Status prüfen und markieren',
            'Regeln für das Vorgehen (ROE) einblenden',
            'Bedrohungsmatrix aktualisieren'
        ],
        controls: [
            'Multi-Sensor-Plot mit Layer-Steuerung',
            'IFF-Tagging-Konsole',
            'Threat-Matrix-Editor',
            'Zeitleistensteuerung für Track-Historien'
        ],
        dependencies: [
            'Sensoren- und Kommunikationsdaten',
            'EW-Informationen zur Signaturlage',
            'Freigaben aus Kommandopult und Sicherheit'
        ],
        locality: 'CIC (dedizierter Raum) für koordinierte Lageführung',
        htmlPath: 'cic/tracks/',
        jsModules: ['assets/js/stations-data.js', 'assets/js/station-page.js']
    },
    {
        id: 'cic-weapons',
        code: 'CIC-02',
        category: 'CIC',
        name: 'Waffenkoordination',
        summary: 'Verwaltet Hardpoints, Munitionsreserven und Feuerpläne im Gefecht.',
        tasks: [
            'Hardpoints zuweisen und Waffenstatus prüfen',
            'Feuerpläne und Salvenfolgen erstellen',
            'Munition, Hitze und Abklingzeiten überwachen',
            'Übersteuerungen anfordern und protokollieren'
        ],
        controls: [
            'Hardpoint-Listen mit Statusindikatoren',
            'Salven- und Feuerplaner',
            'Munitions- und Hitzeanzeigen',
            'Override-Panel mit Sicherheitsfreigaben'
        ],
        dependencies: [
            'Energie- und Thermalzuweisungen',
            'Ziel-Locks aus Taktik/Brücke',
            'Freigaben von Kommandopult und Sicherheit'
        ],
        locality: 'CIC, gekoppelt mit Waffenfreigabe-Schlüsseln',
        htmlPath: 'cic/weapons/',
        jsModules: ['assets/js/stations-data.js', 'assets/js/station-page.js']
    },
    {
        id: 'cic-ew',
        code: 'CIC-03',
        category: 'CIC',
        name: 'Elektronische Kriegsführung',
        summary: 'Jam-, Spoof- und Decoy-Operationen inklusive Signaturmanagement.',
        tasks: [
            'ECM/ECCM-Profile konfigurieren',
            'Decoys und Gegenmaßnahmen steuern',
            'Signaturmanagement und Täuschung',
            'Zeitfenster für Einsätze koordinieren'
        ],
        controls: [
            'Profileditor für ECM/ECCM',
            'Decoy-Launcher-Kontrolle',
            'Signatur- und Emissionsüberwachung',
            'Zeitfenster- und Effektmonitoring'
        ],
        dependencies: [
            'Sensor- und Kommunikationsdaten',
            'Energiezuweisungen aus dem Maschinenraum',
            'Freigaben aus Sicherheit und Taktik'
        ],
        locality: 'CIC-Bedienung mit Zugriffsschutz',
        htmlPath: 'cic/ew/',
        jsModules: ['assets/js/stations-data.js', 'assets/js/station-page.js']
    },
    {
        id: 'sci-anomaly',
        code: 'SCI-01',
        category: 'Wissenschaft',
        name: 'Anomalien & Analyse',
        summary: 'Verwaltet Proben, Anomalien und wissenschaftliche Hypothesen.',
        tasks: [
            'Proben und Anomalien scannen',
            'Spektren vergleichen und interpretieren',
            'Hypothesen und Analysepipelines verwalten',
            'Marker und Forschungsfortschritt dokumentieren'
        ],
        controls: [
            'Datenbank für Proben und Anomalien',
            'Spektrenvergleich und Visualisierung',
            'Analyse-Pipelines mit Statusanzeigen',
            'Notiz- und Markerwerkzeuge'
        ],
        dependencies: [
            'Sensordaten und Missionsziele',
            'Kommunikation mit Brücke und Einsatzleitung',
            'Zugriff auf Forschungsarchive'
        ],
        locality: 'Laborstation, remote lesbar',
        htmlPath: 'sci/anomaly/',
        jsModules: ['assets/js/stations-data.js', 'assets/js/station-page.js']
    },
    {
        id: 'sci-survey',
        code: 'SCI-02',
        category: 'Wissenschaft',
        name: 'Kartografie & Survey',
        summary: 'Sektorvermessung, Ressourcen-Mapping und Export in die Navigation.',
        tasks: [
            'Raster-Scans durchführen und bewerten',
            'Heatmaps und Ressourcenverteilungen erstellen',
            'Survey-Daten an Navigation exportieren',
            'Baseline mit Sensoren abgleichen'
        ],
        controls: [
            'Kartierungs- und Rasterwerkzeuge',
            'Heatmap-Generatoren',
            'Export- und Synchronisationsfunktionen',
            'Baseline-Management'
        ],
        dependencies: [
            'Sensorbaselines und Navigationsdaten',
            'Missionsanforderungen',
            'Logistik für Probenentnahme'
        ],
        locality: 'Laborstation mit Zugriff auf Nav-Export',
        htmlPath: 'sci/survey/',
        jsModules: ['assets/js/stations-data.js', 'assets/js/station-page.js']
    },
    {
        id: 'med-monitor',
        code: 'MED-01',
        category: 'Medizin',
        name: 'Medbay Monitoring',
        summary: 'Überwacht Vitaldaten, Verletzungen und medizinische Protokolle.',
        tasks: [
            'Patientenliste und Triage verwalten',
            'Vitaldaten in Echtzeit überwachen',
            'Behandlungs- und Quarantäneprotokolle pflegen',
            'Sicherheitsfreigaben für Isolation koordinieren'
        ],
        controls: [
            'Vitaldaten-Panel pro Patient',
            'Triage-Statusanzeigen',
            'Quarantäne- und Zugangskontrollen',
            'Medizinische Ressourcenübersicht'
        ],
        dependencies: [
            'Sicherheitsfreigaben und Rollen',
            'Umwelt- und Life-Support-Status',
            'Medizinische Lager- und Logistikdaten'
        ],
        locality: 'Medbay (lokal), Remote-Zugriff für Notfallteams möglich',
        htmlPath: 'med/monitor/',
        jsModules: ['assets/js/stations-data.js', 'assets/js/station-page.js']
    },
    {
        id: 'sec-access',
        code: 'SEC-01',
        category: 'Sicherheit',
        name: 'Zugangskontrolle',
        summary: 'Verwaltet Rollen, Türfreigaben und sicherheitsrelevante Audits.',
        tasks: [
            'Rollen- und Rechteverwaltung durchführen',
            'Türfreigaben in Echtzeit steuern',
            'Audit-Logs prüfen und bestätigen',
            'Alarm-Lockdown auslösen'
        ],
        controls: [
            'Rollenmatrix mit Freigabeübersicht',
            'Live-Türstatuskarte',
            'Alarm- und Lockdown-Schaltungen',
            'Audit-Log-Viewer'
        ],
        dependencies: [
            'Schiffweite Sensorik für Einbruchserkennung',
            'Crew-Manifest und Rollenprofile',
            'Freigaben aus Kommandoebene'
        ],
        locality: 'Sicherheitszentrale mit Captain-Override',
        htmlPath: 'sec/access/',
        jsModules: ['assets/js/stations-data.js', 'assets/js/station-page.js']
    },
    {
        id: 'sec-monitoring',
        code: 'SEC-02',
        category: 'Sicherheit',
        name: 'Interne Überwachung',
        summary: 'Koordiniert Kamerafeeds, Bewegungszonen und Datenschutz-Gates.',
        tasks: [
            'Kamerafeeds überwachen und priorisieren',
            'Bewegungszonen konfigurieren',
            'Datenschutz- und Maskierungsregeln anwenden',
            'Zwischenfälle dokumentieren'
        ],
        controls: [
            'Live-Video-Matrix mit Filteroptionen',
            'Zonen- und Bewegungsalarmverwaltung',
            'Protokollierung und Exportfunktionen',
            'Datenschutz-Gate-Schalter'
        ],
        dependencies: [
            'Crew-Manifest und Zugangsrechte',
            'Sensoren und Türstatusmeldungen',
            'Speichersysteme für Aufzeichnungen'
        ],
        locality: 'Sicherheitszentrale, Remote-Einsicht nach Freigabe',
        htmlPath: 'sec/monitoring/',
        jsModules: ['assets/js/stations-data.js', 'assets/js/station-page.js']
    },
    {
        id: 'env-lifesupport',
        code: 'ENV-01',
        category: 'Lebenserhaltung',
        name: 'Life Support',
        summary: 'Steuert Atmosphäre, Druck, Temperatur und Filtersysteme.',
        tasks: [
            'O₂/CO₂-Level überwachen und regulieren',
            'Druck- und Temperaturbereiche steuern',
            'Filterzyklen und Wartung planen',
            'Lecksuche und Sektionsabschottungen koordinieren'
        ],
        controls: [
            'Sektionswerte für Atmosphäre und Klima',
            'Ventil- und Pumpenkontrolle',
            'Filter- und Wartungsplaner',
            'Leck-Tracer und Alarmmeldungen'
        ],
        dependencies: [
            'Hüllenstatus und Schotteinstellungen',
            'Energie- und Kühlverfügbarkeit',
            'Sicherheitsfreigaben für Zonen'
        ],
        locality: 'Umweltkontrollraum, Remote-Monitoring zulässig',
        htmlPath: 'env/lifesupport/',
        jsModules: ['assets/js/stations-data.js', 'assets/js/station-page.js']
    },
    {
        id: 'env-airlocks',
        code: 'ENV-02',
        category: 'Lebenserhaltung',
        name: 'Schleusen & EVA',
        summary: 'Koordiniert Luftschleusen, Druckausgleich und Suit-Checks.',
        tasks: [
            'Druckausgleichsprozesse steuern',
            'Verriegelungen und Sicherheitssysteme überwachen',
            'Suit-Checks durchführen und protokollieren',
            'Notfall-Override verwalten'
        ],
        controls: [
            'Zyklus-Panel für Schleusen',
            'Innen-/Außensensoranzeigen',
            'Suit-Checklisten und Timer',
            'Not-Override mit Sicherheitsabfrage'
        ],
        dependencies: [
            'Life-Support-Status und Umgebungswerte',
            'Sicherheitsfreigaben',
            'Docking- und Hangarstatus'
        ],
        locality: 'Lokale Bedienung an den Schleusen, Remote-Überwachung möglich',
        htmlPath: 'env/airlocks/',
        jsModules: ['assets/js/stations-data.js', 'assets/js/station-page.js']
    },
    {
        id: 'log-cargo',
        code: 'LOG-01',
        category: 'Logistik',
        name: 'Fracht & Balance',
        summary: 'Verwaltet Lagerplätze, Masse, Trimm und Gefahrgutprotokolle.',
        tasks: [
            'Lagerplätze zuweisen und nachverfolgen',
            'Schwerpunkt und Trimm überwachen',
            'Gefahrgut und Sicherheitsvorschriften kontrollieren',
            'Verladepläne erstellen'
        ],
        controls: [
            'Slot- und Tag-Management',
            'Schwerpunkt- und Trimmvisualisierung',
            'Gefahrgut-Checklisten',
            'Verladeplaner mit Statusmeldungen'
        ],
        dependencies: [
            'Docking- und Hangarstatus',
            'Sicherheitsfreigaben',
            'Logistikmeldungen aus Mission und Technik'
        ],
        locality: 'Lager-/Logistikzentrum, Remote-Freigabe möglich',
        htmlPath: 'log/cargo/',
        jsModules: ['assets/js/stations-data.js', 'assets/js/station-page.js']
    },
    {
        id: 'log-fab',
        code: 'LOG-02',
        category: 'Logistik',
        name: 'Fertigung & Werkstatt',
        summary: 'Steuert Produktions-Jobs, Ersatzteile und Reparaturkits.',
        tasks: [
            'Produktionsaufträge planen und priorisieren',
            'Materialvorräte überwachen',
            'Reparaturkits und Ersatzteile bereitstellen',
            'Rückmeldungen von Reparaturteams verarbeiten'
        ],
        controls: [
            'Bauplan- und Job-Queue-Verwaltung',
            'Materialvorratsanzeigen',
            'Produktionsstatus und Qualitätskontrolle',
            'Integration mit Schadenskontrolle'
        ],
        dependencies: [
            'Fracht- und Materiallager',
            'Schadensmeldungen aus Engineering',
            'Energie- und Fertigungskapazitäten'
        ],
        locality: 'Werkstattbereich, Remote-Freigabe nach Bedarf',
        htmlPath: 'log/fab/',
        jsModules: ['assets/js/stations-data.js', 'assets/js/station-page.js']
    },
    {
        id: 'hangar-control',
        code: 'HNG-01',
        category: 'Hangar & Shuttle-Deck',
        name: 'Hangarsteuerung',
        summary: 'Koordiniert Start/Landefreigaben, Feldtore und Bodenteams.',
        tasks: [
            'Start- und Landefreigaben erteilen',
            'Feldtore und Traktorstrahlen steuern',
            'Deckstatus überwachen',
            'Bodenteams und Sicherheit koordinieren'
        ],
        controls: [
            'Deckstatusanzeige inkl. Luftschleusen',
            'Traktor-/Schutzfeldsteuerung',
            'Kommunikation mit Bodenteam',
            'Notfallprotokolle für Hangar'
        ],
        dependencies: [
            'Life-Support- und Sicherheitsdaten',
            'Energieversorgung und Notstrom',
            'Flugfreigaben aus Navigation/Helm'
        ],
        locality: 'Hangar-Kontrollraum mit lokalen Overrides',
        htmlPath: 'hangar/control/',
        jsModules: ['assets/js/stations-data.js', 'assets/js/station-page.js']
    },
    {
        id: 'dock-control',
        code: 'DOC-01',
        category: 'Docking',
        name: 'Docking & Berthing',
        summary: 'Verwalten von Andockprotokollen, Klammern, Leitungen und Druckausgleich.',
        tasks: [
            'Dockingprotokolle und Freigaben koordinieren',
            'Klammern und Versorgungsleitungen überwachen',
            'Druckausgleich und Sicherheit prüfen',
            'Kommunikation mit angedockten Einheiten'
        ],
        controls: [
            'Dockingstatus mit Soft-/Hard-Dock-Anzeige',
            'Leitungsstatus für Strom, Treibstoff und Daten',
            'Druck- und Atmosphärenkontrolle',
            'Abkoppel- und Nottrennungsbefehle'
        ],
        dependencies: [
            'Navigation/Helm für Annäherung',
            'Life-Support für Druckregelung',
            'Energieverteilung und Sicherheit'
        ],
        locality: 'Docking-Bereich mit direktem Zugriff, Remote-Monitor möglich',
        htmlPath: 'dock/control/',
        jsModules: ['assets/js/stations-data.js', 'assets/js/station-page.js']
    },
    {
        id: 'gm-master',
        code: 'GM-01',
        category: 'Spielleitung',
        name: 'Master Console',
        summary: 'Regie-Panel für LARP-Leitung zur Steuerung von Events und Fog of War.',
        tasks: [
            'Live-Parameter und Events injizieren',
            'Fog-of-War und Sichtbarkeitsflags setzen',
            'Replay-Marker und Szenenlogik verwalten',
            'Metadaten der Simulation anpassen'
        ],
        controls: [
            'Schieberegler für Parameter',
            'Event-Trigger-Panel',
            'Sichtbarkeitsschalter für Stationen',
            'Replay- und Zeitsteuerung'
        ],
        dependencies: [
            'Lesender Zugriff auf alle Stationsdaten',
            'Event-Injection-Schnittstellen',
            'Sicherheitsfreigaben der Spielleitung'
        ],
        locality: 'Regieplatz, Zugriff ausschließlich für Spielleitung',
        htmlPath: 'gm/master/',
        jsModules: ['assets/js/stations-data.js', 'assets/js/station-page.js']
    },
    {
        id: 'overlay-checklists',
        code: 'QS-A',
        category: 'Overlay',
        name: 'Alarm- & Checklisten-Overlay',
        summary: 'Einblendbares Panel für Start-Up-, Jump-Prep- und Battle-Stations-Checklisten.',
        tasks: [
            'Checklisten anzeigen und abhaken',
            'Alarmstatus und Aufgaben synchronisieren',
            'Stationen zur Bestätigung auffordern'
        ],
        controls: [
            'Checklistenmanager mit Fortschritt',
            'Freigabe- und Bestätigungsanzeige',
            'Kurzbefehle für Alarmstufen'
        ],
        dependencies: [
            'Stationfreigaben aus Kommandopult',
            'Statusmeldungen aus betroffenen Bereichen'
        ],
        locality: 'Overlay, kombinierbar mit anderen Panels',
        htmlPath: 'overlay/checklists/',
        jsModules: ['assets/js/stations-data.js', 'assets/js/station-page.js']
    },
    {
        id: 'overlay-telemetry',
        code: 'QS-B',
        category: 'Overlay',
        name: 'Telemetrie- & Replay-Overlay',
        summary: 'Zeitachsen-basierte Telemetrieanzeige mit Filter- und Replay-Funktionen.',
        tasks: [
            'Telemetry-Events filtern und visualisieren',
            'Timeline scrubbing durchführen',
            'Replay-Marker setzen und teilen'
        ],
        controls: [
            'Timeline-Scrubber mit Event-Markern',
            'Filter für Metriken und Ereignisse',
            'Export-/Teilen-Funktionen'
        ],
        dependencies: [
            'Zugriff auf globale Telemetriedaten',
            'Replay- und Logging-Schnittstellen'
        ],
        locality: 'Overlay, Anzeige-orientiert (Read-Only)',
        htmlPath: 'overlay/telemetry/',
        jsModules: ['assets/js/stations-data.js', 'assets/js/station-page.js']
    },
    {
        id: 'overlay-emergency',
        code: 'QS-C',
        category: 'Overlay',
        name: 'Notfall-Override-Overlay',
        summary: 'Kritische Overrides wie SCRAM, Feuerlöschung und Schott-Schließung mit Mehrfachfreigabe.',
        tasks: [
            'Notfallbefehle initialisieren und bestätigen',
            'Mehrfachfreigaben einholen',
            'Override-Historie dokumentieren'
        ],
        controls: [
            'Liste kritischer Overrides mit Status',
            'Freigabe-Workflow und Countdown',
            'Bestätigungspaneel mit Rollenprüfung'
        ],
        dependencies: [
            'Sicherheits- und Kommando-Freigaben',
            'Systemzustände der betroffenen Bereiche'
        ],
        locality: 'Overlay (Mehrfachfreigabe, gesichert)',
        htmlPath: 'overlay/emergency/',
        jsModules: ['assets/js/stations-data.js', 'assets/js/station-page.js']
    }
];

export function getStationById(id) {
    return STATION_DEFINITIONS.find((station) => station.id === id);
}

export function getStationsByCategory(category) {
    return STATION_DEFINITIONS.filter((station) => station.category === category);
}
