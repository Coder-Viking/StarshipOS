# Roadmap: Betriebs- und Einsatzplanung

## Phase 4 – Wissenschaft, Wirtschaft, Schiffsbetrieb

### Science Lab
- [ ] Probenanalysen durchführen und Ergebnisse katalogisieren.
- [ ] Sensorische Anomalien scannen und dokumentieren.
- [ ] Missionsziele anhand neuer Daten verifizieren.
- [ ] Forschungsfortschritt je Projekt aktualisieren.

### Cargo & Inventory
- [ ] Lagerplätze verwalten und Belegungen protokollieren.
- [ ] Gesamtmasse und Schwerpunktlage überwachen.
- [ ] Gefahrgut markieren und Freigaben prüfen.
- [ ] Ladungslogistik inkl. Be- und Entladeprioritäten steuern.

### Fabrication & Ersatzteile
- [ ] Herstellungspipelines aus Rohstoffen konfigurieren.
- [ ] Reparaturkits und Verbrauchsgüter in Produktion geben.
- [ ] Produktionszeiten und Fertigstellungstermine verfolgen.
- [ ] Ersatzteilbestände und Materialnachschub abstimmen.

### Medical Bay
- [ ] Crew-Vitaldaten überwachen und Trends melden.
- [ ] Verletzungen erfassen, Behandlungsschritte planen.
- [ ] Verfügbare Stims/Medpacks inventarisieren.
- [ ] Quarantäne-Protokolle auslösen und dokumentieren.

### Security & Access Control
- [ ] Rollen und Rechte je Station definieren und pflegen.
- [ ] Autorisierungen für kritische Aktionen verwalten.
- [ ] Audit-Trail auf Vollständigkeit und Manipulation prüfen.

## Phase 5 – Brücke, Stationen, UX

### Stations/Consoles
- [ ] Rollen (Captain, Pilot, Engineering, Tactical, Science, Comms) mit dedizierten Dashboards abbilden.
- [ ] Für jede Station fokussierte Handlungsräume bereitstellen.

### Alert States
- [ ] Green/Yellow/Red/Black mit UI-Theming und Audio verknüpfen.
- [ ] Energie-Presets und Systemprioritäten je Zustand definieren.
- [ ] Sirenen, Timer und Benachrichtigungen orchestrieren.

### Checklisten & Prozeduren
- [ ] Start-Up, Jump-Prep, Battle-Stations, Damage-Assessment und Docking-Flow als Schrittfolgen modellieren.
- [ ] Fortschrittsanzeige und Quittierung pro Schritt implementieren.

### Briefing/Debriefing
- [ ] Missionsziele, Live-Marker und Teamaufgaben darstellen.
- [ ] Abschlussberichte mit Telemetrie und Entscheidungslog generieren.

## Phase 6 – Szenarien, Ereignisse, Regie

### Scenario Engine
- [ ] Missionslogik aus XML interpretieren (Ziele, Trigger, Bedingungen).
- [ ] Dynamische Ereignisse und Mehrpfad-Strukturen unterstützen.

### Encounter/AI (Schiffe/Stationen)
- [ ] Verhaltensprofile (patrouillieren, eskortieren, fliehen) definieren.
- [ ] Aggro-/Mut-Modelle und Funk-Interaktionen ausarbeiten.

### Random Events & Complications
- [ ] Systemeinfälle (Leck, Überhitzung, Kurzschluss) modellieren.
- [ ] Raumwettereffekte (Sturm, Nebel) simulieren.
- [ ] Entscheidungsevents mit Trade-offs vorbereiten.

## Phase 7 – Betrieb, Test, LARP-Mode

### Telemetry & Replay
- [ ] Betriebsmetriken und Ereignisse lückenlos loggen.
- [ ] Zeitachsen-Replay für Schulung und Post-Mortem bereitstellen.

### Fault Injection
- [ ] Gezielte Fehlerbilder (Sensor-Drift, Spannungsabfall) einspeisen.
- [ ] Trainingsszenarien mit variabler Intensität definieren.

### LARP-Master Console
- [ ] Live-Parameter und verdeckte Informationen steuern.
- [ ] Events auslösen und „Fog of War" verwalten.
- [ ] Hinweise, NPC-Funk und Meta-Kommunikation koordinieren.

## Stations-Checklisten

### Captain
- [ ] Missionsbriefing prüfen und Ziele priorisieren.
- [ ] Alert State festlegen und Crew informieren.
- [ ] Entscheidungslog freigeben und Kommunikation autorisieren.

### Pilot
- [ ] Kursdaten mit Navigation abstimmen und ETA bestätigen.
- [ ] Energiebedarf für Antrieb und Manöver melden.
- [ ] Docking-/Start-Prozeduren nach Checkliste abarbeiten.

### Engineering
- [ ] Schadensmeldungen sichten und Zustandsbäume aktualisieren.
- [ ] Not-Bypässe planen, Reparaturaufträge koordinieren.
- [ ] Ersatzteile und Fabrication-Status abgleichen.

### Tactical
- [ ] Ziellisten und Bedrohungsranking erstellen.
- [ ] Sektor-HUD überwachen und Waffen zuordnen.
- [ ] Waffenabklingzeiten und Schildstatus im Blick behalten.

### Science
- [ ] Sensor- und Anomalien-Scans auswerten.
- [ ] Forschungsfortschritt dokumentieren und Ergebnisse melden.
- [ ] Missionsziele mit Wissenschaftsdaten verifizieren.

### Communications
- [ ] Primär- und Sekundärkanäle überwachen.
- [ ] Autorisierungslevel für kritische Nachrichten prüfen.
- [ ] Funkprotokolle und Audit-Trail aktualisieren.

## Nächste Milestones

- **Betriebsfähiger Brückenkern (MVP):** Core OS, XML, PowerSystem, LifeSupport, Sensors, Navigation, Comms, DamageControl → Start-Up → Patrouille → Docking.
- **Gefechts-Alpha:** Weapons, Tactical UI, Schilde, Thermal, EW → Kurzmission gegen Dummy-Ziel.
- **Szenario-Beta:** Scenario Engine, Random Events, Briefing/Debriefing, Telemetry/Replay.

