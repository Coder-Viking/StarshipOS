# Fortschrittsnotizen

## Aktuelle Sitzung
- Fallback-Datensatz für Szenario-Parser hinzugefügt, damit Stations-Panels (z. B. EN-06 Schadenskontrolle) auch ohne funktionierenden `fetch` mit Statuswerten befüllt werden.
- Bestehende Parserlogik beibehalten; echte XML-Daten werden weiterhin bevorzugt, Fallback nur bei Ladefehlern aktiv.

## Nächste Schritte / Ideen
- Prüfen, ob zusätzliche Stationsdaten (z. B. Crewlogistik) ebenfalls eine Offline-Quelle benötigen.
- Optional: UI-Hinweis ergänzen, wenn Fallback-Daten aktiv sind.
