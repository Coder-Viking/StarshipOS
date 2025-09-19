# Fortschrittsnotizen

## Aktuelle Sitzung
- Fallback-Datensatz für Szenario-Parser hinzugefügt, damit Stations-Panels (z. B. EN-06 Schadenskontrolle) auch ohne funktionierenden `fetch` mit Statuswerten befüllt werden.
- Bestehende Parserlogik beibehalten; echte XML-Daten werden weiterhin bevorzugt, Fallback nur bei Ladefehlern aktiv.
- Engineering-Konsolen (Reaktor, Energie, Thermik, Antrieb, FTL) lesen nun Leistungs-, Status- und Protokolldaten direkt aus dem Szenario (XML & Fallback) statt statischer Werte.
- Szenario-Parser und `scenario-default.xml` um die Bereiche `<engineering>` → `<power>`, `<thermal>`, `<propulsion>` und `<ftl>` ergänzt, sodass alle Maschinenraum-Panels Schiffs-spezifische Kennzahlen anzeigen.

## Nächste Schritte / Ideen
- Prüfen, ob zusätzliche Stationsdaten (z. B. Crewlogistik) ebenfalls eine Offline-Quelle benötigen.
- Optional: UI-Hinweis ergänzen, wenn Fallback-Daten aktiv sind.
