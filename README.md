# StarshipOS

Eine modulare Benutzeroberfläche zur Simulation eines Raumschiff-Betriebssystems für LARP- oder Pen-&-Paper-Szenarien.

## Funktionen

- **Schiffssystemübersicht** mit detaillierten Leistungs-, Integritäts- und Auslastungsanzeigen für alle Kernsysteme.
- **Energieverteilung** mit interaktiven Reglern inklusive automatischer Optimierungsempfehlung.
- **Navigationsmodul** zum Setzen, Aktivieren und Abbrechen von Kursen inklusive ETA-Berechnung anhand der aktuellen Schiffslage.
- **Kommunikationskonsole** mit Kanalverwaltung und logischer Nachrichtenchronik.
- **Sensorsuite** für aktive Scans und dynamisch generierte Sensordaten.
- **Damage Control** mit konsolidierten Meldungen, Bypässen und Reparaturverfolgung.
- **Taktische Übersicht** mit Ziellisten, Sektor-HUD und Waffenabklingzeiten.
- **Alarmzentrale** mit Zustandsverwaltung (Grün/Gelb/Rot) und automatisch gepflegtem Ereignislog.
- **Crew- und Missionsübersicht** mit aktuellen Statusinformationen.
- **Simulationsteuerung** zum Pausieren/Fortsetzen sowie zufällige Ereignisse zur Dramaturgie.

## Nutzung

1. Repository klonen oder herunterladen.
2. `index.html` im Browser öffnen (moderne Browser empfohlen, da ES-Modul verwendet wird).
3. Optional kann ein lokaler Webserver genutzt werden, um Audio/Video-Erweiterungen einzubinden.

### Konfiguration & Hot-Reload

- Die Anwendung lädt Schiffsdaten, Systeme, Missionen und Zufallsereignisse aus `assets/data/scenario-default.xml`.
- Änderungen an dieser Datei werden automatisch erkannt und im laufenden Betrieb übernommen (Hot-Reload).
- Über den Button **„Konfiguration neu laden“** im Footer kann die Spielleitung ein manuelles Reload erzwingen.
- Bei Fehlern in der XML-Datei wird eine Meldung im Ereignislog angezeigt und die zuletzt funktionierende Konfiguration beibehalten.

Alle Zustände werden nur im Browser gespeichert und lassen sich jederzeit neu initialisieren, indem die Seite neu geladen wird.

## Anpassung

- **Systeme erweitern**: In `assets/js/modules/data.js` lassen sich weitere Schiffssysteme, Sektoren, Kommunikationskanäle oder Crewmitglieder hinzufügen.
- **Optik anpassen**: In `assets/css/styles.css` können Farbgebung, Layout und Animationen verändert werden.
- **Logik erweitern**: `assets/js/app.js` enthält die Kernlogik. Hier können zusätzliche Module (z.B. Schadenskontrolle, Fracht, Wissenschaft) eingebunden werden.

## Roadmap & Checklisten

Die nächsten Ausbauphasen (Wissenschaft, Wirtschaft, Brücke, Szenarien und LARP-Betrieb) inklusive Stations-Checklisten sind in `docs/roadmap.md` dokumentiert. Nutzen Sie die dortigen Aufgabenlisten als Leitplanken für Implementierungen und Tests.

Viel Spaß auf der Brücke!
