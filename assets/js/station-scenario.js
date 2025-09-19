const SCENARIO_URL = new URL('../data/scenario-default.xml', import.meta.url).href;
let scenarioPromise = null;

export async function loadScenarioData() {
    if (!scenarioPromise) {
        scenarioPromise = fetch(SCENARIO_URL)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Szenariodatei konnte nicht geladen werden (Status ${response.status})`);
                }
                return response.text();
            })
            .then((text) => parseScenarioXml(text))
            .catch((error) => {
                console.error('Fehler beim Laden der Szenariodatei:', error);
                scenarioPromise = null;
                throw error;
            });
    }
    return scenarioPromise;
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
