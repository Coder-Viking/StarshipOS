import { loadScenarioData } from './station-scenario.js';

const OPERATIONS_RENDERERS = {
    'eng-reactor': renderEngReactor,
    'eng-power': renderEngPower,
    'eng-thermal': renderEngThermal,
    'eng-propulsion': renderEngPropulsion,
    'eng-ftl': renderEngFtl,
    'eng-damage': renderEngDamage
};

function createPanel(container, { title, description }) {
    const panel = document.createElement('section');
    panel.className = 'operations-panel';

    const header = document.createElement('div');
    header.className = 'operations-panel__header';

    const heading = document.createElement('h3');
    heading.className = 'operations-panel__title';
    heading.textContent = title;
    header.appendChild(heading);
    panel.appendChild(header);

    if (description) {
        const desc = document.createElement('p');
        desc.className = 'operations-panel__description';
        desc.textContent = description;
        panel.appendChild(desc);
    }

    const body = document.createElement('div');
    body.className = 'operations-panel__body';
    panel.appendChild(body);

    container.appendChild(panel);
    return body;
}

function formatValue(value) {
    if (typeof value === 'number') {
        const options = Number.isInteger(value)
            ? { maximumFractionDigits: 0 }
            : { minimumFractionDigits: 1, maximumFractionDigits: 1 };
        return value.toLocaleString('de-DE', options);
    }
    return value;
}

function formatReading(value, unit) {
    if (value === null || value === undefined || value === '') {
        return '—';
    }
    const suffix = unit ? ` ${unit}` : '';
    return `${formatValue(value)}${suffix}`;
}

function createMetric({ label, value, unit = '', status = 'normal', note, min = 0, max = 100 }) {
    const wrapper = document.createElement('div');
    wrapper.className = `operations-metric operations-metric--${status}`;

    const labelEl = document.createElement('span');
    labelEl.className = 'operations-metric__label';
    labelEl.textContent = label;
    wrapper.appendChild(labelEl);

    const valueRow = document.createElement('div');
    valueRow.className = 'operations-metric__value-row';

    const valueEl = document.createElement('span');
    valueEl.className = 'operations-metric__value';
    valueEl.textContent = `${formatValue(value)}${unit}`;
    valueRow.appendChild(valueEl);

    if (note) {
        const noteEl = document.createElement('span');
        noteEl.className = 'operations-metric__note';
        noteEl.textContent = note;
        valueRow.appendChild(noteEl);
    }

    wrapper.appendChild(valueRow);

    const bar = document.createElement('div');
    bar.className = 'operations-meter-bar';

    const fill = document.createElement('div');
    fill.className = 'operations-meter-fill';

    const numericValue = typeof value === 'number' ? value : Number.parseFloat(String(value).replace(',', '.'));
    const numericMin = typeof min === 'number' ? min : Number.parseFloat(String(min).replace(',', '.'));
    const numericMax = typeof max === 'number' ? max : Number.parseFloat(String(max).replace(',', '.'));

    if (!Number.isNaN(numericValue) && !Number.isNaN(numericMax) && numericMax !== numericMin) {
        const range = numericMax - numericMin;
        const ratio = ((numericValue - numericMin) / range) * 100;
        const width = Math.max(0, Math.min(100, ratio));
        fill.style.width = `${width}%`;
    }

    bar.appendChild(fill);
    wrapper.appendChild(bar);

    return wrapper;
}

function createRangeControl({ id, label, min = 0, max = 100, step = 1, value = 0, unit = '', description }) {
    const wrapper = document.createElement('div');
    wrapper.className = 'operations-control operations-control--range';

    const topRow = document.createElement('div');
    topRow.className = 'operations-control__head';

    const labelEl = document.createElement('label');
    labelEl.htmlFor = id;
    labelEl.textContent = label;
    topRow.appendChild(labelEl);

    const valueEl = document.createElement('output');
    valueEl.className = 'operations-control__value';
    valueEl.textContent = `${formatValue(Number(value))}${unit}`;
    topRow.appendChild(valueEl);
    wrapper.appendChild(topRow);

    const input = document.createElement('input');
    input.type = 'range';
    input.className = 'operations-range';
    input.id = id;
    input.min = `${min}`;
    input.max = `${max}`;
    input.step = `${step}`;
    input.value = `${value}`;
    input.addEventListener('input', () => {
        valueEl.textContent = `${formatValue(Number(input.value))}${unit}`;
    });
    wrapper.appendChild(input);

    if (description) {
        const desc = document.createElement('p');
        desc.className = 'operations-control__description';
        desc.textContent = description;
        wrapper.appendChild(desc);
    }

    return wrapper;
}

function createToggleControl({ id, label, defaultChecked = false, description, tone = 'default' }) {
    const wrapper = document.createElement('div');
    wrapper.className = `operations-control operations-control--toggle operations-control--${tone}`;

    const labelEl = document.createElement('label');
    labelEl.className = 'operations-toggle__label';
    labelEl.htmlFor = id;
    labelEl.textContent = label;

    const toggleWrapper = document.createElement('div');
    toggleWrapper.className = 'operations-toggle';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.className = 'operations-toggle__input';
    input.id = id;
    input.checked = defaultChecked;

    const faux = document.createElement('span');
    faux.className = 'operations-toggle__faux';

    toggleWrapper.appendChild(input);
    toggleWrapper.appendChild(faux);

    wrapper.appendChild(labelEl);
    wrapper.appendChild(toggleWrapper);

    if (description) {
        const desc = document.createElement('p');
        desc.className = 'operations-toggle-note';
        desc.textContent = description;
        wrapper.appendChild(desc);
    }

    return wrapper;
}

function createRadioGroup({ name, label, options, defaultValue }) {
    const fieldset = document.createElement('fieldset');
    fieldset.className = 'operations-control operations-control--group';

    const legend = document.createElement('legend');
    legend.textContent = label;
    fieldset.appendChild(legend);

    options.forEach((option, index) => {
        const optionId = `${name}-${index}`;
        const optionWrapper = document.createElement('label');
        optionWrapper.className = 'operations-choice';

        const input = document.createElement('input');
        input.type = 'radio';
        input.name = name;
        input.id = optionId;
        input.value = option.value;
        if (defaultValue ? option.value === defaultValue : index === 0) {
            input.checked = true;
        }

        const title = document.createElement('span');
        title.className = 'operations-choice__title';
        title.textContent = option.label;

        optionWrapper.appendChild(input);
        optionWrapper.appendChild(title);

        if (option.description) {
            const desc = document.createElement('span');
            desc.className = 'operations-choice__description';
            desc.textContent = option.description;
            optionWrapper.appendChild(desc);
        }

        fieldset.appendChild(optionWrapper);
    });

    return fieldset;
}

function createChecklist(items) {
    const list = document.createElement('div');
    list.className = 'operations-checklist';

    items.forEach((item, index) => {
        const id = item.id || `check-${index}`;
        const label = document.createElement('label');

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = id;
        input.checked = Boolean(item.checked);

        const text = document.createElement('span');
        text.textContent = item.label;

        label.appendChild(input);
        label.appendChild(text);

        if (item.note) {
            const note = document.createElement('small');
            note.textContent = item.note;
            label.appendChild(note);
        }

        list.appendChild(label);
    });

    return list;
}

function createButtonRow(buttons) {
    const row = document.createElement('div');
    row.className = 'operations-button-row';

    buttons.forEach((button) => {
        const btn = document.createElement('button');
        btn.type = button.type || 'button';
        btn.className = `operations-button${button.tone ? ` operations-button--${button.tone}` : ''}`;
        btn.textContent = button.label;
        row.appendChild(btn);
    });

    return row;
}

function createStatusBadge({ label, tone = 'default' }) {
    const badge = document.createElement('span');
    badge.className = `operations-status-badge operations-status-badge--${tone}`;
    badge.textContent = label;
    return badge;
}

function createLog(entries) {
    const list = document.createElement('ul');
    list.className = 'operations-log';

    entries.forEach((entry) => {
        const li = document.createElement('li');
        li.textContent = entry;
        list.appendChild(li);
    });

    return list;
}

function createSelect({ id, options, value }) {
    const select = document.createElement('select');
    select.id = id;
    select.className = 'operations-select';
    options.forEach((option) => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.label;
        if (value && value === option.value) {
            opt.selected = true;
        }
        select.appendChild(opt);
    });
    return select;
}

function createTextAreaControl({ id, label, placeholder }) {
    const wrapper = document.createElement('div');
    wrapper.className = 'operations-control operations-control--textarea';

    const labelEl = document.createElement('label');
    labelEl.htmlFor = id;
    labelEl.textContent = label;
    wrapper.appendChild(labelEl);

    const textarea = document.createElement('textarea');
    textarea.id = id;
    textarea.placeholder = placeholder || '';
    textarea.rows = 3;
    wrapper.appendChild(textarea);

    return wrapper;
}

function createCompactToggle({ id, onLabel = 'Aktiv', offLabel = 'Inaktiv', defaultChecked = false }) {
    const wrapper = document.createElement('label');
    wrapper.className = 'operations-compact-toggle';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = id;
    input.checked = defaultChecked;

    const faux = document.createElement('span');
    faux.className = 'operations-compact-toggle__faux';

    const text = document.createElement('span');
    text.className = 'operations-compact-toggle__label';

    const update = () => {
        text.textContent = input.checked ? onLabel : offLabel;
    };

    update();
    input.addEventListener('change', update);

    wrapper.appendChild(input);
    wrapper.appendChild(faux);
    wrapper.appendChild(text);

    return wrapper;
}

function appendEmptyState(container, message) {
    const empty = document.createElement('p');
    empty.className = 'operations-placeholder';
    empty.textContent = message;
    container.appendChild(empty);
}

function getConduitToggleLabels(switchInfo = {}) {
    if (switchInfo.onLabel || switchInfo.offLabel) {
        return {
            on: switchInfo.onLabel || switchInfo.offLabel || 'An',
            off: switchInfo.offLabel || switchInfo.onLabel || 'Aus'
        };
    }

    switch (switchInfo.type) {
        case 'breaker':
            return { on: 'Geschlossen', off: 'Offen' };
        case 'valve':
            return { on: 'Offen', off: 'Geschlossen' };
        case 'relay':
            return { on: 'Aktiv', off: 'Inaktiv' };
        default:
            return { on: 'An', off: 'Aus' };
    }
}

function isSwitchEngaged(state, type) {
    const key = safeLower(state);
    if (!key) {
        return false;
    }

    if (key === 'closed') {
        return type !== 'valve';
    }
    if (key === 'open') {
        return type === 'valve';
    }

    return ['engaged', 'active', 'on', 'true'].includes(key);
}

const STATUS_LABEL_MAP = {
    online: 'Online',
    warning: 'Warnung',
    critical: 'Kritisch',
    offline: 'Offline',
    idle: 'Bereit',
    standby: 'Standby',
    engaged: 'Aktiv',
    active: 'Aktiv',
    planned: 'Geplant',
    queued: 'Wartet',
    'in-progress': 'In Arbeit',
    stabilized: 'Stabilisiert',
    completed: 'Abgeschlossen',
    complete: 'Abgeschlossen',
    success: 'In Ordnung',
    stabil: 'Stabil',
    'überwachung': 'Überwachung',
    versiegelt: 'Versiegelt',
    'analyse läuft': 'Analyse läuft',
    aktiv: 'Aktiv',
    bereit: 'Bereit',
    standby: 'Standby',
    laufend: 'Laufend'
};

const STATUS_TONE_MAP = {
    online: 'success',
    warning: 'warning',
    critical: 'danger',
    offline: 'danger',
    idle: 'accent',
    standby: 'accent',
    engaged: 'accent',
    active: 'accent',
    planned: 'default',
    queued: 'default',
    'in-progress': 'warning',
    stabilized: 'success',
    completed: 'success',
    complete: 'success',
    success: 'success',
    stabil: 'success',
    'überwachung': 'warning',
    versiegelt: 'success',
    'analyse läuft': 'warning',
    aktiv: 'accent',
    bereit: 'accent',
    laufend: 'accent'
};

const SEVERITY_INFO = {
    critical: { label: 'Kritisch', tone: 'danger' },
    major: { label: 'Schwer', tone: 'warning' },
    moderate: { label: 'Moderat', tone: 'accent' },
    minor: { label: 'Gering', tone: 'success' },
    gering: { label: 'Gering', tone: 'success' },
    moderat: { label: 'Moderat', tone: 'accent' },
    schwer: { label: 'Schwer', tone: 'warning' },
    kritisch: { label: 'Kritisch', tone: 'danger' },
    spur: { label: 'Spur', tone: 'accent' }
};

const METRIC_STATUS_MAP = {
    online: 'success',
    warning: 'warning',
    critical: 'critical',
    offline: 'danger',
    idle: 'accent',
    standby: 'accent',
    stabil: 'success',
    'überwachung': 'warning',
    aktiv: 'accent',
    bereit: 'accent',
    versiegelt: 'accent',
    'analyse läuft': 'warning'
};

function safeLower(value) {
    return typeof value === 'string' ? value.toLowerCase() : '';
}

function getStatusInfo(status, { fallbackLabel } = {}) {
    const key = safeLower(status);
    return {
        label: STATUS_LABEL_MAP[key] || fallbackLabel || (status ? String(status) : 'Unbekannt'),
        tone: STATUS_TONE_MAP[key] || 'default'
    };
}

function getSeverityInfo(severity) {
    const key = safeLower(severity);
    return SEVERITY_INFO[key] || { label: severity ? String(severity) : 'Unbekannt', tone: 'default' };
}

function mapMetricStatus(status) {
    const key = safeLower(status);
    return METRIC_STATUS_MAP[key] || 'normal';
}

function toNumber(value) {
    if (value === null || value === undefined || value === '') {
        return null;
    }
    const parsed = Number.parseFloat(String(value).replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
}

function flattenDamageNodes(nodes, parentName = null) {
    if (!Array.isArray(nodes) || nodes.length === 0) {
        return [];
    }
    return nodes.flatMap((node) => {
        const entry = {
            id: node.id || null,
            name: node.name || node.id || 'Unbenannt',
            status: node.status || '',
            integrity: node.integrity ?? null,
            power: node.power ?? null,
            note: node.note || '',
            parentName
        };
        const children = Array.isArray(node.children) ? node.children : [];
        return [entry, ...flattenDamageNodes(children, node.name || parentName)];
    });
}

async function renderEngReactor(container) {
    let scenarioData = null;
    try {
        scenarioData = await loadScenarioData();
    } catch (error) {
        console.error('Fehler beim Laden der Szenariodaten für Reaktorsteuerung:', error);
    }

    const damageNodes = flattenDamageNodes(scenarioData?.damageControl?.systems ?? []);
    const reactorNode = damageNodes.find((node) => node.id === 'tree-reactor');
    const injectorNode = damageNodes.find((node) => node.id === 'tree-injectors');
    const containmentNode = damageNodes.find((node) => node.id === 'tree-containment');

    const statusBody = createPanel(container, {
        title: 'Reaktorstatus',
        description: 'Leistungsausgabe, Kernparameter und Kontrollstabposition im Blick behalten.'
    });

    const metrics = document.createElement('div');
    metrics.className = 'operations-metric-grid';
    const reactorStatus = reactorNode ? mapMetricStatus(reactorNode.status) : 'warning';
    const containmentStatus = containmentNode ? mapMetricStatus(containmentNode.status) : 'success';
    const injectorStatus = injectorNode ? mapMetricStatus(injectorNode.status) : 'warning';

    metrics.append(
        createMetric({
            label: 'Reaktorleistung',
            value: reactorNode?.power ?? 84,
            unit: '%',
            status: reactorStatus,
            note:
                reactorNode && (reactorNode.note || reactorNode.integrity != null)
                    ? [reactorNode.note, reactorNode.integrity != null ? `Integrität ${formatValue(reactorNode.integrity)}%` : null]
                          .filter(Boolean)
                          .join(' • ')
                    : 'Sollwert 85%',
            min: 0,
            max: 120
        }),
        createMetric({
            label: 'Containment-Feld',
            value: containmentNode?.integrity ?? 96,
            unit: '%',
            status: containmentStatus,
            note:
                containmentNode && (containmentNode.note || containmentNode.power != null)
                    ? [containmentNode.note, containmentNode.power != null ? `Leistung ${formatValue(containmentNode.power)}%` : null]
                          .filter(Boolean)
                          .join(' • ')
                    : 'Feldphase synchron',
            min: 0,
            max: 100
        }),
        createMetric({
            label: 'Plasma-Injektoren',
            value: injectorNode?.integrity ?? 71,
            unit: '%',
            status: injectorStatus,
            note:
                injectorNode && (injectorNode.note || injectorNode.power != null)
                    ? [injectorNode.note, injectorNode.power != null ? `Leistung ${formatValue(injectorNode.power)}%` : null]
                          .filter(Boolean)
                          .join(' • ')
                    : 'Injektor 3 überwacht',
            min: 0,
            max: 100
        }),
        createMetric({ label: 'Kontrollstäbe', value: 42, unit: '%', status: 'normal', note: 'Einschubtiefe', min: 0, max: 100 })
    );
    statusBody.appendChild(metrics);

    const controlBody = createPanel(container, {
        title: 'Betriebsmodi & Sequenzen',
        description: 'Start-, Standby- und Burst-Modi verwalten.'
    });

    controlBody.appendChild(
        createRadioGroup({
            name: 'reactor-mode',
            label: 'Aktiver Modus',
            options: [
                { label: 'Standby', value: 'standby', description: 'Reaktor warmhalten, minimale Leistung für Lebenserhaltung.' },
                { label: 'Eco', value: 'eco', description: 'Optimierte Leistung für Reisebetrieb.' },
                { label: 'Burst', value: 'burst', description: 'Maximale Leistung für Gefecht oder Hochlastmanöver.' }
            ],
            defaultValue: 'eco'
        })
    );

    controlBody.appendChild(
        createRangeControl({
            id: 'reactor-output-target',
            label: 'Ziel-Leistung',
            min: 50,
            max: 110,
            step: 5,
            value: 85,
            unit: '%',
            description: 'Automatische Drosselung bei Überschreitung von 105%.'
        })
    );

    controlBody.appendChild(
        createButtonRow([
            { label: 'Startsequenz einleiten' },
            { label: 'In Standby fahren', tone: 'ghost' }
        ])
    );

    const safetyBody = createPanel(container, {
        title: 'Sicherheitsprotokolle',
        description: 'Interlocks prüfen und Notfallmaßnahmen vorbereiten.'
    });

    safetyBody.append(
        createToggleControl({
            id: 'reactor-captain-lock',
            label: 'Captain-Freigabe aktiv',
            defaultChecked: true,
            description: 'Erlaubt Leistungsänderungen über 90%.',
            tone: 'success'
        }),
        createToggleControl({
            id: 'reactor-engineering-lock',
            label: 'Engineering-Override scharf',
            defaultChecked: true,
            description: 'Direkter Zugriff auf Steuerstäbe und Kühlmittelventile.',
            tone: 'accent'
        })
    );

    safetyBody.appendChild(
        createButtonRow([
            { label: 'SCRAM auslösen', tone: 'danger' },
            { label: 'Sicherheitslog prüfen', tone: 'ghost' }
        ])
    );

    const coolantBody = createPanel(container, {
        title: 'Kühlmittelschleifen',
        description: 'Förderleistung und Druck je Schleife feinjustieren.'
    });

    const loopGrid = document.createElement('div');
    loopGrid.className = 'operations-loop-grid';

    const loops = [
        { id: 'alpha', name: 'Alpha', temperature: 64, pressure: 210, pump: 78, status: 'Nominal', tone: 'success' },
        { id: 'beta', name: 'Beta', temperature: 71, pressure: 228, pump: 82, status: 'Überwacht', tone: 'warning', note: 'Ventil 2B zeigt leichte Schwingungen.' },
        { id: 'gamma', name: 'Gamma', temperature: 58, pressure: 198, pump: 74, status: 'Nominal', tone: 'success' }
    ];

    loops.forEach((loop) => {
        const card = document.createElement('div');
        card.className = 'operations-loop-card';

        const header = document.createElement('div');
        header.className = 'operations-loop-card__header';

        const title = document.createElement('span');
        title.className = 'operations-loop-card__title';
        title.textContent = loop.name;
        header.appendChild(title);
        header.appendChild(createStatusBadge({ label: loop.status, tone: loop.tone }));
        card.appendChild(header);

        const stats = document.createElement('div');
        stats.className = 'operations-loop-card__stats';
        const temp = document.createElement('span');
        temp.textContent = `Temperatur: ${formatValue(loop.temperature)}°C`;
        const pressure = document.createElement('span');
        pressure.textContent = `Druck: ${loop.pressure} kPa`;
        stats.append(temp, pressure);
        card.appendChild(stats);

        card.appendChild(
            createRangeControl({
                id: `coolant-${loop.id}-pump`,
                label: 'Pumpenleistung',
                min: 40,
                max: 105,
                step: 5,
                value: loop.pump,
                unit: '%'
            })
        );

        if (loop.note) {
            const note = document.createElement('p');
            note.className = 'operations-loop-card__note';
            note.textContent = loop.note;
            card.appendChild(note);
        }

        loopGrid.appendChild(card);
    });

    coolantBody.appendChild(loopGrid);
    coolantBody.appendChild(createButtonRow([{ label: 'Kühlmittel nachspeisen' }, { label: 'Spülsequenz vorbereiten', tone: 'ghost' }]));

    const systemBody = createPanel(container, {
        title: 'Versorgung nach System',
        description: 'Aktuelle Leistungsabnahme der Hauptsysteme gemäß Szenario.'
    });

    const consumers = Array.isArray(scenarioData?.systems)
        ? scenarioData.systems
              .filter((system) => toNumber(system.power) !== null)
              .sort((a, b) => (toNumber(b.power) ?? 0) - (toNumber(a.power) ?? 0))
              .slice(0, 6)
        : [];

    if (!consumers.length) {
        appendEmptyState(systemBody, 'Keine Leistungsdaten im Szenario verfügbar.');
    } else {
        const grid = document.createElement('div');
        grid.className = 'operations-metric-grid';
        consumers.forEach((system) => {
            const noteParts = [];
            if (toNumber(system.load) !== null) {
                noteParts.push(`Last ${formatValue(toNumber(system.load))}%`);
            }
            if (toNumber(system.integrity) !== null) {
                noteParts.push(`Integrität ${formatValue(toNumber(system.integrity))}%`);
            }
            const statusInfo = getStatusInfo(system.status, { fallbackLabel: 'Status unbekannt' });
            if (!noteParts.length) {
                noteParts.push(statusInfo.label);
            }

            grid.appendChild(
                createMetric({
                    label: system.name || system.id || 'System',
                    value: toNumber(system.power) ?? 0,
                    unit: '%',
                    status: mapMetricStatus(system.status),
                    note: noteParts.join(' • '),
                    min: 0,
                    max: 120
                })
            );
        });
        systemBody.appendChild(grid);
    }
}

function renderEngPower(container) {
    const distributionBody = createPanel(container, {
        title: 'Leistungszuweisung',
        description: 'Reaktorleistung auf Busse und Subsysteme verteilen.'
    });

    const distributionList = document.createElement('div');
    distributionList.className = 'operations-distribution';

    const subsystems = [
        { id: 'power-shields', name: 'Schilde', value: 32, max: 45, status: 'Gefechtsbereit', tone: 'accent' },
        { id: 'power-weapons', name: 'Waffen', value: 26, max: 40, status: 'Ladezyklen stabil', tone: 'warning' },
        { id: 'power-life', name: 'Lebenserhaltung', value: 12, max: 20, status: 'Nominal', tone: 'success' },
        { id: 'power-eng', name: 'Engineering Hilfssysteme', value: 18, max: 25, status: 'Überwacht', tone: 'warning' }
    ];

    subsystems.forEach((subsystem) => {
        const row = document.createElement('div');
        row.className = 'operations-distribution__row';

        const header = document.createElement('div');
        header.className = 'operations-distribution__header';

        const title = document.createElement('span');
        title.className = 'operations-distribution__title';
        title.textContent = subsystem.name;
        header.appendChild(title);
        header.appendChild(createStatusBadge({ label: subsystem.status, tone: subsystem.tone }));
        row.appendChild(header);

        row.appendChild(
            createRangeControl({
                id: subsystem.id,
                label: 'Leistungsanteil',
                min: 0,
                max: subsystem.max,
                step: 1,
                value: subsystem.value,
                unit: '%',
                description: `Grenzlast ${subsystem.max}%`
            })
        );

        distributionList.appendChild(row);
    });

    distributionBody.appendChild(distributionList);

    const priorityBody = createPanel(container, {
        title: 'Prioritätsprofile',
        description: 'Vordefinierte Verteilprofile laden und aktivieren.'
    });

    priorityBody.appendChild(
        createRadioGroup({
            name: 'power-profile',
            label: 'Profil auswählen',
            options: [
                { label: 'Reise (Cruise)', value: 'cruise', description: 'Stabile Schilde, Fokus auf Lebenserhaltung.' },
                { label: 'Gefecht', value: 'battle', description: 'Waffen- und Schildleistung priorisieren.' },
                { label: 'Notfall', value: 'emergency', description: 'Lebenserhaltung + Reaktorsicherheit, Rest minimal.' }
            ],
            defaultValue: 'battle'
        })
    );

    priorityBody.appendChild(createButtonRow([{ label: 'Profil anwenden' }, { label: 'Anpassung speichern', tone: 'ghost' }]));

    const loadBody = createPanel(container, {
        title: 'Lastabwurf & Schutzschalter',
        description: 'Vorbereitete Bypässe und Brownout-Pfade prüfen.'
    });

    const circuits = [
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
    ];

    const circuitList = document.createElement('div');
    circuitList.className = 'operations-control-list';
    circuits.forEach((circuit) => {
        circuitList.appendChild(
            createToggleControl({
                id: circuit.id,
                label: circuit.label,
                defaultChecked: circuit.defaultChecked,
                description: circuit.description,
                tone: circuit.tone
            })
        );
    });
    loadBody.appendChild(circuitList);
    loadBody.appendChild(createButtonRow([{ label: 'Lastabwurf auslösen', tone: 'danger' }, { label: 'Abwurfplan sichern', tone: 'ghost' }]));

    const monitorBody = createPanel(container, {
        title: 'Netzüberwachung',
        description: 'Verbrauch, Reserven und Puffer im Blick behalten.'
    });

    const monitorMetrics = document.createElement('div');
    monitorMetrics.className = 'operations-metric-grid';
    monitorMetrics.append(
        createMetric({ label: 'Gesamtverbrauch', value: 87, unit: '%', status: 'warning', note: 'Schwellwert 90%', min: 0, max: 120 }),
        createMetric({ label: 'Reserveleistung', value: 14, unit: '%', status: 'critical', note: 'Unter Soll 18%', min: 0, max: 40 }),
        createMetric({ label: 'Pufferkapazität', value: 62, unit: '%', status: 'normal', note: 'Batteriedecks', min: 0, max: 100 })
    );
    monitorBody.appendChild(monitorMetrics);
    monitorBody.appendChild(
        createLog([
            '05:18 - Brownout-Warnung Deck 4 behoben',
            '05:02 - Reservebank 2 geladen (82%)',
            '04:47 - Verteiler 7A neu kalibriert'
        ])
    );
}

function renderEngThermal(container) {
    const radiatorBody = createPanel(container, {
        title: 'Radiatorfelder',
        description: 'Abstrahlleistung und Temperaturen der Felder überwachen.'
    });

    const radiatorMetrics = document.createElement('div');
    radiatorMetrics.className = 'operations-metric-grid';
    [
        { label: 'Radiator Alpha', value: 68, status: 'warning', note: 'Sonnenexposition hoch' },
        { label: 'Radiator Beta', value: 54, status: 'normal', note: 'Nominal' },
        { label: 'Radiator Gamma', value: 73, status: 'warning', note: 'Kühlmittelkreislauf prüfen' },
        { label: 'Radiator Delta', value: 49, status: 'normal', note: 'Reserve aktiv' }
    ].forEach((radiator) => {
        radiatorMetrics.appendChild(
            createMetric({
                label: radiator.label,
                value: radiator.value,
                unit: '%',
                status: radiator.status,
                note: radiator.note,
                min: 0,
                max: 100
            })
        );
    });
    radiatorBody.appendChild(radiatorMetrics);

    const flowBody = createPanel(container, {
        title: 'Kühlkreisläufe',
        description: 'Pumpenleistung und Ventile je Kreislauf steuern.'
    });

    const flows = [
        { id: 'loop-primary', name: 'Primärer Kernkreislauf', pump: 76, flow: 540, note: 'Ventil 4 offen' },
        { id: 'loop-secondary', name: 'Sekundärkreislauf', pump: 64, flow: 410, note: 'Reserve-Radiator gekoppelt' },
        { id: 'loop-aux', name: 'Auxiliar / Lebenserhaltung', pump: 58, flow: 320, note: 'Temperatur stabil' }
    ];

    const flowGrid = document.createElement('div');
    flowGrid.className = 'operations-loop-grid';

    flows.forEach((loop) => {
        const card = document.createElement('div');
        card.className = 'operations-loop-card';

        const header = document.createElement('div');
        header.className = 'operations-loop-card__header';
        const title = document.createElement('span');
        title.className = 'operations-loop-card__title';
        title.textContent = loop.name;
        header.appendChild(title);
        header.appendChild(createStatusBadge({ label: `${loop.flow} l/min`, tone: 'accent' }));
        card.appendChild(header);

        card.appendChild(
            createRangeControl({
                id: `${loop.id}-pump`,
                label: 'Pumpendrehzahl',
                min: 40,
                max: 100,
                step: 5,
                value: loop.pump,
                unit: '%'
            })
        );

        const note = document.createElement('p');
        note.className = 'operations-loop-card__note';
        note.textContent = loop.note;
        card.appendChild(note);

        flowGrid.appendChild(card);
    });

    flowBody.appendChild(flowGrid);

    const emergencyBody = createPanel(container, {
        title: 'Notfallmaßnahmen',
        description: 'Hitzeabfuhr für Extremsituationen vorbereiten.'
    });

    emergencyBody.appendChild(
        createChecklist([
            { id: 'venting-ready', label: 'Radiatoren entfalten / venten vorbereitet', checked: true },
            { id: 'heatsinks-arm', label: 'Heat-Sink-Module geladen', note: 'Letzte Ladung: 28 min' },
            { id: 'purge-lines', label: 'Kühlmittelleitungen gespült' },
            { id: 'emergency-fans', label: 'Notlüfter in Bereitschaft' }
        ])
    );

    emergencyBody.appendChild(createButtonRow([{ label: 'Abfuhrsequenz starten' }, { label: 'Alarm eskalieren', tone: 'danger' }]));

    const logBody = createPanel(container, {
        title: 'Temperaturmeldungen',
        description: 'Zeitliche Historie für Engineering und Brücke.'
    });

    logBody.appendChild(
        createLog([
            '05:12 - Radiator Beta wieder im grünen Bereich',
            '04:58 - Warnung: Radiator Gamma 72% Last',
            '04:41 - Kühlkreislauf Auxiliar entlüftet'
        ])
    );
}

function renderEngPropulsion(container) {
    const thrustBody = createPanel(container, {
        title: 'Schubkontrolle',
        description: 'Hauptantrieb und Nachbrennerleistung einstellen.'
    });

    thrustBody.appendChild(
        createRangeControl({
            id: 'propulsion-throttle',
            label: 'Hauptschub',
            min: 0,
            max: 110,
            step: 5,
            value: 72,
            unit: '%',
            description: 'Maximale Dauerlast 95%, Nachbrenner bis 110%.'
        })
    );

    thrustBody.appendChild(
        createMetric({
            label: 'Verfügbares Delta-V',
            value: 4.6,
            unit: ' km/s',
            status: 'normal',
            note: 'Berechnet mit aktueller Masse',
            min: 0,
            max: 12
        })
    );

    const vectorBody = createPanel(container, {
        title: 'Vektorsteuerung',
        description: 'Pitch, Yaw und Roll für Flugmanöver anpassen.'
    });

    const vectorControls = document.createElement('div');
    vectorControls.className = 'operations-control-list';
    vectorControls.append(
        createRangeControl({ id: 'vector-pitch', label: 'Pitch', min: -30, max: 30, step: 1, value: 2, unit: '°' }),
        createRangeControl({ id: 'vector-yaw', label: 'Yaw', min: -30, max: 30, step: 1, value: -1, unit: '°' }),
        createRangeControl({ id: 'vector-roll', label: 'Roll', min: -15, max: 15, step: 1, value: 0, unit: '°' })
    );
    vectorBody.appendChild(vectorControls);

    const rcsBody = createPanel(container, {
        title: 'RCS-Triebwerke',
        description: 'Status der Lagekontroll-Düsen überwachen und freigeben.'
    });

    const thrusters = [
        { id: 'fore-port', name: 'Bug • Backbord', active: true, status: 'Bereit', tone: 'success' },
        { id: 'fore-starboard', name: 'Bug • Steuerbord', active: true, status: 'Bereit', tone: 'success' },
        { id: 'aft-port', name: 'Heck • Backbord', active: true, status: 'Bereit', tone: 'success' },
        { id: 'aft-starboard', name: 'Heck • Steuerbord', active: false, status: 'Service nötig', tone: 'warning' },
        { id: 'ventral', name: 'Ventral Cluster', active: true, status: 'Überwacht', tone: 'warning' },
        { id: 'dorsal', name: 'Dorsal Cluster', active: true, status: 'Bereit', tone: 'success' }
    ];

    const matrix = document.createElement('div');
    matrix.className = 'operations-matrix';

    thrusters.forEach((thruster) => {
        const cell = document.createElement('div');
        cell.className = 'operations-matrix__cell';

        const header = document.createElement('div');
        header.className = 'operations-matrix__header';
        const title = document.createElement('span');
        title.className = 'operations-matrix__title';
        title.textContent = thruster.name;
        header.appendChild(title);
        header.appendChild(createStatusBadge({ label: thruster.status, tone: thruster.tone }));
        cell.appendChild(header);

        cell.appendChild(createCompactToggle({ id: `rcs-${thruster.id}`, onLabel: 'Online', offLabel: 'Offline', defaultChecked: thruster.active }));

        matrix.appendChild(cell);
    });

    rcsBody.appendChild(matrix);
    rcsBody.appendChild(createButtonRow([{ label: 'RCS-Testimpuls senden' }, { label: 'Fehlermeldung loggen', tone: 'ghost' }]));

    const checklistBody = createPanel(container, {
        title: 'Manöverfreigaben',
        description: 'Vorflug-Checkliste für neue Manöver.'
    });

    checklistBody.appendChild(
        createChecklist([
            { id: 'prop-prime', label: 'Triebwerke auf Bereitschaft gebracht', checked: true },
            { id: 'prop-balance', label: 'Massenausgleich geprüft', note: 'Cargo bestätigt' },
            { id: 'prop-flightplan', label: 'Flight-Command bestätigt Manöverfenster' }
        ])
    );

    checklistBody.appendChild(createButtonRow([{ label: 'Bereitschaft melden' }, { label: 'Rückmeldung an Brücke', tone: 'ghost' }]));
}
function renderEngFtl(container) {
    const chargeBody = createPanel(container, {
        title: 'Spulenladung',
        description: 'Ladung, Countdown und Startfreigabe koordinieren.'
    });

    chargeBody.appendChild(
        createMetric({
            label: 'Aktuelle Ladung',
            value: 62,
            unit: '%',
            status: 'warning',
            note: 'Sprungbereit ab 95%',
            min: 0,
            max: 100
        })
    );

    chargeBody.appendChild(
        createRangeControl({
            id: 'ftl-charge-target',
            label: 'Ladeziel',
            min: 80,
            max: 100,
            step: 1,
            value: 95,
            unit: '%'
        })
    );

    chargeBody.appendChild(createButtonRow([{ label: 'Ladungssynchronisation starten' }, { label: 'Countdown übertragen', tone: 'ghost' }]));

    const stabilityBody = createPanel(container, {
        title: 'Feldstabilität',
        description: 'Stabilität, Vibrationen und Anomalien beobachten.'
    });

    const stabilityMetrics = document.createElement('div');
    stabilityMetrics.className = 'operations-metric-grid';
    stabilityMetrics.append(
        createMetric({ label: 'Feldstabilität', value: 91, unit: '%', status: 'normal', note: 'Nominal', min: 0, max: 100 }),
        createMetric({ label: 'Jitter', value: 0.6, unit: '%', status: 'warning', note: 'Grenze 0,8%', min: 0, max: 3 }),
        createMetric({ label: 'Strukturbelastung', value: 38, unit: '%', status: 'normal', note: 'Innerhalb Limits', min: 0, max: 100 })
    );
    stabilityBody.appendChild(stabilityMetrics);

    stabilityBody.appendChild(
        createLog([
            '05:09 - Navigationsdaten bestätigt',
            '05:03 - Feldkalibrierung abgeschlossen',
            '04:55 - Sicherheitsinterlock erfolgreich getestet'
        ])
    );

    const interlockBody = createPanel(container, {
        title: 'Interlocks & Freigaben',
        description: 'Mehrfachfreigaben für Sprungvorbereitung verwalten.'
    });

    const interlocks = [
        { id: 'ftl-lock-captain', label: 'Captain-Freigabe', defaultChecked: true, tone: 'accent', description: 'Bestätigung via Brücke' },
        { id: 'ftl-lock-engineer', label: 'Chefingenieur', defaultChecked: true, tone: 'success', description: 'Reaktorleistung gesichert' },
        { id: 'ftl-lock-navigation', label: 'Navigation', defaultChecked: false, tone: 'warning', description: 'Sprungfenster noch in Berechnung' }
    ];

    const interlockList = document.createElement('div');
    interlockList.className = 'operations-control-list';
    interlocks.forEach((interlock) => {
        interlockList.appendChild(
            createToggleControl({
                id: interlock.id,
                label: interlock.label,
                defaultChecked: interlock.defaultChecked,
                description: interlock.description,
                tone: interlock.tone
            })
        );
    });
    interlockBody.appendChild(interlockList);

    const abortBody = createPanel(container, {
        title: 'Abbruch & Sicherheit',
        description: 'Notfall-Abbruch vorbereiten und dokumentieren.'
    });

    abortBody.appendChild(
        createTextAreaControl({
            id: 'ftl-abort-note',
            label: 'Abbruchgrund / Beobachtung',
            placeholder: 'z. B. Signaturanstieg, Kursabweichung, Crew-Feedback'
        })
    );

    abortBody.appendChild(createButtonRow([{ label: 'FTL-Abbruch auslösen', tone: 'danger' }, { label: 'Protokoll speichern', tone: 'ghost' }]));

    abortBody.appendChild(
        createLog([
            '04:50 - Sicherheitscheckliste abgeschlossen',
            '04:46 - Warnung: Jitter 0,8% (innerhalb Limits)',
            '04:38 - Navigation meldet Kursfenster t+11 Minuten'
        ])
    );
}

async function renderEngDamage(container) {
    let scenarioData = null;
    try {
        scenarioData = await loadScenarioData();
    } catch (error) {
        console.error('Fehler beim Laden der Szenariodaten für Schadenskontrolle:', error);
    }

    const damageControl = scenarioData?.damageControl ?? {};
    const lifeSupport = scenarioData?.lifeSupport ?? {};

    const reports = Array.isArray(damageControl.reports) ? damageControl.reports : [];
    const systemNodes = flattenDamageNodes(damageControl.systems ?? []);
    const bypasses = Array.isArray(damageControl.bypasses) ? damageControl.bypasses : [];
    const repairs = Array.isArray(damageControl.repairs) ? damageControl.repairs : [];
    const conduits = Array.isArray(damageControl.conduits) ? damageControl.conduits : [];
    const inventory = Array.isArray(damageControl.inventory) ? damageControl.inventory : [];
    const sections = Array.isArray(lifeSupport.sections) ? lifeSupport.sections : [];
    const leaks = Array.isArray(lifeSupport.leaks) ? lifeSupport.leaks : [];
    const filters = lifeSupport?.filters ?? null;
    const filterBanks = Array.isArray(filters?.banks) ? filters.banks : [];

    const reportBody = createPanel(container, {
        title: 'Schadenmeldungen',
        description: 'Aktuelle Prioritäten aus dem Szenario mit Schweregrad und Status.'
    });

    if (!reports.length) {
        appendEmptyState(reportBody, 'Keine aktiven Schadenmeldungen im Szenario gefunden.');
    } else {
        const table = document.createElement('table');
        table.className = 'operations-table';

        const thead = document.createElement('thead');
        const headRow = document.createElement('tr');
        ['System', 'Schwere', 'Status', 'ETA'].forEach((header) => {
            const th = document.createElement('th');
            th.textContent = header;
            headRow.appendChild(th);
        });
        thead.appendChild(headRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        reports.forEach((report) => {
            const row = document.createElement('tr');

            const systemCell = document.createElement('td');
            const systemLabel = document.createElement('strong');
            systemLabel.textContent = report.system || 'Unbekanntes System';
            systemCell.appendChild(systemLabel);
            if (report.location) {
                const location = document.createElement('span');
                location.className = 'operations-subline';
                location.textContent = report.location;
                systemCell.appendChild(location);
            }
            if (report.note) {
                const note = document.createElement('small');
                note.textContent = report.note;
                systemCell.appendChild(note);
            }
            row.appendChild(systemCell);

            const severityCell = document.createElement('td');
            const severityInfo = getSeverityInfo(report.severity);
            severityCell.appendChild(createStatusBadge(severityInfo));
            row.appendChild(severityCell);

            const statusCell = document.createElement('td');
            const statusInfo = getStatusInfo(report.status, { fallbackLabel: 'Status unbekannt' });
            statusCell.appendChild(createStatusBadge(statusInfo));
            row.appendChild(statusCell);

            const etaCell = document.createElement('td');
            etaCell.textContent = report.eta || '—';
            row.appendChild(etaCell);

            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        reportBody.appendChild(table);
    }

    const systemBody = createPanel(container, {
        title: 'Systemintegrität',
        description: 'Integrität und Leistung der überwachten Baugruppen.'
    });

    if (!systemNodes.length) {
        appendEmptyState(systemBody, 'Keine Systemdaten für die Schadenskontrolle verfügbar.');
    } else {
        const grid = document.createElement('div');
        grid.className = 'operations-metric-grid';

        systemNodes.slice(0, 8).forEach((node) => {
            const value = node.integrity ?? node.power ?? 0;
            const hasPercent = node.integrity != null || node.power != null;
            const noteParts = [];
            if (node.parentName) {
                noteParts.push(`Bereich ${node.parentName}`);
            }
            if (node.power != null && node.integrity != null) {
                noteParts.push(`Leistung ${formatValue(node.power)}%`);
            }
            if (node.note) {
                noteParts.push(node.note);
            }

            grid.appendChild(
                createMetric({
                    label: node.name,
                    value,
                    unit: hasPercent ? '%' : '',
                    status: mapMetricStatus(node.status),
                    note: noteParts.join(' • ') || undefined,
                    min: 0,
                    max: node.integrity != null ? 100 : 120
                })
            );
        });

        systemBody.appendChild(grid);
    }

    const sectionsBody = createPanel(container, {
        title: 'Sektionen & Atmosphäre',
        description: 'Druck, Temperatur und Statusmeldungen der überwachten Sektionen.'
    });

    if (!sections.length) {
        appendEmptyState(sectionsBody, 'Keine Sektionsdaten verfügbar.');
    } else {
        const grid = document.createElement('div');
        grid.className = 'operations-section-grid';

        sections.forEach((section, index) => {
            const card = document.createElement('div');
            card.className = 'operations-section-card';

            const header = document.createElement('div');
            header.className = 'operations-section-card__header';

            const title = document.createElement('span');
            title.className = 'operations-section-card__title';
            title.textContent = section.name || section.id || `Sektion ${index + 1}`;
            header.appendChild(title);

            const statusInfo = getStatusInfo(section.status, { fallbackLabel: section.status || 'Status' });
            header.appendChild(createStatusBadge(statusInfo));
            card.appendChild(header);

            const stats = document.createElement('div');
            stats.className = 'operations-section-card__stats';

            const pressure = document.createElement('span');
            pressure.className = 'operations-section-card__stat';
            pressure.textContent = `Druck: ${formatReading(section.pressure, section.pressureUnit || 'kPa')}`;
            stats.appendChild(pressure);

            const temperature = document.createElement('span');
            temperature.className = 'operations-section-card__stat';
            temperature.textContent = `Temperatur: ${formatReading(section.temperature, section.temperatureUnit || '°C')}`;
            stats.appendChild(temperature);

            const humidity = document.createElement('span');
            humidity.className = 'operations-section-card__stat';
            humidity.textContent = `Feuchte: ${formatReading(section.humidity, '%')}`;
            stats.appendChild(humidity);

            card.appendChild(stats);
            grid.appendChild(card);
        });

        sectionsBody.appendChild(grid);
        sectionsBody.appendChild(
            createButtonRow([{ label: 'Sektion markieren' }, { label: 'Status an Brücke melden', tone: 'ghost' }])
        );
    }

    const leakBody = createPanel(container, {
        title: 'Leck- & Schottüberwachung',
        description: 'Hüllenbrüche, Abdichtungen und laufende Drucktests im Blick.'
    });

    if (!leaks.length) {
        appendEmptyState(leakBody, 'Keine gemeldeten Lecks in den Sektionsdaten.');
    } else {
        const table = document.createElement('table');
        table.className = 'operations-table';

        const thead = document.createElement('thead');
        const headRow = document.createElement('tr');
        ['Ort', 'Schwere', 'Status', 'Fortschritt'].forEach((header) => {
            const th = document.createElement('th');
            th.textContent = header;
            headRow.appendChild(th);
        });
        thead.appendChild(headRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        leaks.forEach((leak) => {
            const row = document.createElement('tr');

            const locationCell = document.createElement('td');
            const title = document.createElement('strong');
            title.textContent = leak.location || leak.id || 'Position unbekannt';
            locationCell.appendChild(title);
            if (leak.note) {
                const note = document.createElement('small');
                note.textContent = leak.note;
                locationCell.appendChild(note);
            }
            row.appendChild(locationCell);

            const severityCell = document.createElement('td');
            severityCell.appendChild(createStatusBadge(getSeverityInfo(leak.severity)));
            row.appendChild(severityCell);

            const statusCell = document.createElement('td');
            statusCell.appendChild(createStatusBadge(getStatusInfo(leak.status, { fallbackLabel: 'Status' })));
            row.appendChild(statusCell);

            const progressCell = document.createElement('td');
            progressCell.textContent =
                leak.progress != null ? `${formatValue(leak.progress)}%` : '—';
            row.appendChild(progressCell);

            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        leakBody.appendChild(table);
        leakBody.appendChild(
            createButtonRow([{ label: 'Drucktest starten' }, { label: 'Logbucheintrag erstellen', tone: 'ghost' }])
        );
    }

    const conduitsBody = createPanel(container, {
        title: 'Leitungsnetz & Busse',
        description: 'EPS-Busse, Ventile und Relais überwachen und steuern.'
    });

    if (!conduits.length) {
        appendEmptyState(conduitsBody, 'Keine Leitungsdaten im Szenario verfügbar.');
    } else {
        const list = document.createElement('div');
        list.className = 'operations-conduit-list';

        conduits.forEach((conduit, conduitIndex) => {
            const item = document.createElement('div');
            item.className = 'operations-conduit';

            const header = document.createElement('div');
            header.className = 'operations-conduit__header';

            const title = document.createElement('span');
            title.className = 'operations-conduit__title';
            title.textContent = conduit.name || conduit.id || 'Leitung';
            header.appendChild(title);

            header.appendChild(
                createStatusBadge(getStatusInfo(conduit.status, { fallbackLabel: 'Status' }))
            );
            item.appendChild(header);

            if (conduit.route || conduit.integrity != null) {
                const meta = document.createElement('div');
                meta.className = 'operations-conduit__meta';
                const metaParts = [];
                if (conduit.route) {
                    metaParts.push(conduit.route);
                }
                if (conduit.integrity != null) {
                    metaParts.push(`Integrität ${formatValue(conduit.integrity)}%`);
                }
                meta.textContent = metaParts.join(' • ');
                item.appendChild(meta);
            }

            const metricNote = [];
            if (conduit.capacity != null) {
                metricNote.push(`Kapazität ${formatValue(conduit.capacity)}%`);
            }
            if (conduit.integrity != null && !metricNote.includes(`Integrität ${formatValue(conduit.integrity)}%`)) {
                metricNote.push(`Integrität ${formatValue(conduit.integrity)}%`);
            }

            item.appendChild(
                createMetric({
                    label: 'Last',
                    value: conduit.load ?? 0,
                    unit: '%',
                    status: mapMetricStatus(conduit.status),
                    note: metricNote.join(' • ') || undefined,
                    min: 0,
                    max: conduit.capacity ?? 120
                })
            );

            const switches = Array.isArray(conduit.switches) ? conduit.switches : [];
            if (switches.length) {
                const controls = document.createElement('div');
                controls.className = 'operations-conduit__controls';

                switches.forEach((switchInfo, switchIndex) => {
                    const control = document.createElement('div');
                    control.className = 'operations-conduit__control';
                    if (switchInfo.critical) {
                        control.classList.add('operations-conduit__control--critical');
                    }

                    const label = document.createElement('span');
                    label.className = 'operations-conduit__control-label';
                    label.textContent = switchInfo.label || 'Schalter';
                    control.appendChild(label);

                    const labels = getConduitToggleLabels(switchInfo);
                    const toggle = createCompactToggle({
                        id: switchInfo.id || `conduit-${conduitIndex}-${switchIndex}`,
                        onLabel: labels.on,
                        offLabel: labels.off,
                        defaultChecked: isSwitchEngaged(switchInfo.state, switchInfo.type)
                    });
                    control.appendChild(toggle);

                    controls.appendChild(control);
                });

                item.appendChild(controls);
            }

            if (conduit.note) {
                const note = document.createElement('p');
                note.className = 'operations-conduit__note';
                note.textContent = conduit.note;
                item.appendChild(note);
            }

            list.appendChild(item);
        });

        conduitsBody.appendChild(list);
        conduitsBody.appendChild(
            createButtonRow([{ label: 'Bypass planen' }, { label: 'Routing protokollieren', tone: 'ghost' }])
        );
    }

    const bypassBody = createPanel(container, {
        title: 'Bypässe & Isolation',
        description: 'Ventile und Stromkreise gemäß Szenario-Status schalten.'
    });

    if (!bypasses.length) {
        appendEmptyState(bypassBody, 'Derzeit sind keine Bypass-Maßnahmen aktiv.');
    } else {
        const list = document.createElement('div');
        list.className = 'operations-bypass-list';

        bypasses.forEach((bypass, index) => {
            const item = document.createElement('div');
            item.className = 'operations-bypass';

            const header = document.createElement('div');
            header.className = 'operations-bypass__header';

            const title = document.createElement('span');
            title.className = 'operations-bypass__title';
            title.textContent = bypass.description || bypass.id || 'Bypass';
            header.appendChild(title);

            const statusInfo = getStatusInfo(bypass.status, { fallbackLabel: 'Unbekannt' });
            header.appendChild(createStatusBadge(statusInfo));
            item.appendChild(header);

            item.appendChild(
                createCompactToggle({
                    id: bypass.id || `bypass-${index}`,
                    onLabel: 'Aktiv',
                    offLabel: 'Standby',
                    defaultChecked: safeLower(bypass.status) === 'engaged'
                })
            );

            const meta = document.createElement('div');
            meta.className = 'operations-bypass__meta';
            const ownerLabel = bypass.owner ? `Team ${bypass.owner}` : 'Ohne Teamzuweisung';
            meta.textContent = `${ownerLabel} • ETA ${bypass.eta || '—'}`;
            item.appendChild(meta);

            if (bypass.note) {
                const note = document.createElement('p');
                note.className = 'operations-bypass__note';
                note.textContent = bypass.note;
                item.appendChild(note);
            }

            list.appendChild(item);
        });

        bypassBody.appendChild(list);
    }

    const filtersBody = createPanel(container, {
        title: 'Filter & Vorräte',
        description: 'Filterbänke, Luftpuffer und Reservekapazitäten überwachen.'
    });

    const hasFilterMetrics =
        typeof filters?.reserveAirMinutes === 'number' ||
        typeof filters?.scrubberMarginMinutes === 'number' ||
        typeof filters?.emergencyBufferMinutes === 'number';

    if (!hasFilterMetrics && !filterBanks.length) {
        appendEmptyState(filtersBody, 'Keine Filter- oder Pufferdaten im Szenario hinterlegt.');
    } else {
        if (hasFilterMetrics) {
            const metrics = document.createElement('div');
            metrics.className = 'operations-metric-grid';

            if (typeof filters?.reserveAirMinutes === 'number') {
                metrics.append(
                    createMetric({
                        label: 'Luftreserve',
                        value: filters.reserveAirMinutes,
                        unit: ' min',
                        status: 'accent',
                        note: 'Mindestziel 480 min',
                        min: 0,
                        max: Math.max(filters.reserveAirMinutes, 720)
                    })
                );
            }

            if (typeof filters?.scrubberMarginMinutes === 'number') {
                metrics.append(
                    createMetric({
                        label: 'Scrubber-Puffer',
                        value: filters.scrubberMarginMinutes,
                        unit: ' min',
                        status: 'normal',
                        note: 'Zeit bis zur Regeneration',
                        min: 0,
                        max: Math.max(filters.scrubberMarginMinutes, 360)
                    })
                );
            }

            if (typeof filters?.emergencyBufferMinutes === 'number') {
                metrics.append(
                    createMetric({
                        label: 'Notfallpuffer',
                        value: filters.emergencyBufferMinutes,
                        unit: ' min',
                        status: 'accent',
                        note: 'Für Druckverlust-Szenarien',
                        min: 0,
                        max: Math.max(filters.emergencyBufferMinutes, 360)
                    })
                );
            }

            filtersBody.appendChild(metrics);
        }

        if (filterBanks.length) {
            const table = document.createElement('table');
            table.className = 'operations-table';

            const thead = document.createElement('thead');
            const headRow = document.createElement('tr');
            ['Bank', 'Status', 'Sättigung', 'Puffer'].forEach((header) => {
                const th = document.createElement('th');
                th.textContent = header;
                headRow.appendChild(th);
            });
            thead.appendChild(headRow);
            table.appendChild(thead);

            const tbody = document.createElement('tbody');
            filterBanks.forEach((bank) => {
                const row = document.createElement('tr');

                const labelCell = document.createElement('td');
                const title = document.createElement('strong');
                title.textContent = bank.label || bank.id || 'Bank';
                labelCell.appendChild(title);
                row.appendChild(labelCell);

                const statusCell = document.createElement('td');
                statusCell.appendChild(createStatusBadge(getStatusInfo(bank.status, { fallbackLabel: 'Status' })));
                row.appendChild(statusCell);

                const saturationCell = document.createElement('td');
                const saturationUnit = bank.saturationUnit || '%';
                saturationCell.textContent =
                    bank.saturation != null ? `${formatValue(bank.saturation)} ${saturationUnit}` : '—';
                row.appendChild(saturationCell);

                const bufferCell = document.createElement('td');
                const bufferUnit = bank.timeBufferUnit || 'min';
                bufferCell.textContent =
                    bank.timeBuffer != null ? `${formatValue(bank.timeBuffer)} ${bufferUnit}` : '—';
                row.appendChild(bufferCell);

                tbody.appendChild(row);
            });

            table.appendChild(tbody);
            filtersBody.appendChild(table);
        }

        filtersBody.appendChild(
            createButtonRow([{ label: 'Reserve aktivieren' }, { label: 'Wartung protokollieren', tone: 'ghost' }])
        );
    }

    const repairBody = createPanel(container, {
        title: 'Reparaturaufträge',
        description: 'Teams, ETA und benötigte Teile aus dem Szenario.'
    });

    if (!repairs.length) {
        appendEmptyState(repairBody, 'Keine Reparaturaufträge im Szenario aktiv.');
    } else {
        const table = document.createElement('table');
        table.className = 'operations-table';

        const thead = document.createElement('thead');
        const headRow = document.createElement('tr');
        ['Auftrag', 'Team', 'Status', 'ETA', 'Teile'].forEach((header) => {
            const th = document.createElement('th');
            th.textContent = header;
            headRow.appendChild(th);
        });
        thead.appendChild(headRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        repairs.forEach((order) => {
            const row = document.createElement('tr');

            const labelCell = document.createElement('td');
            const title = document.createElement('strong');
            title.textContent = order.label || order.id || 'Auftrag';
            labelCell.appendChild(title);
            if (order.system) {
                const system = document.createElement('span');
                system.className = 'operations-subline';
                system.textContent = order.system;
                labelCell.appendChild(system);
            }
            row.appendChild(labelCell);

            const teamCell = document.createElement('td');
            teamCell.textContent = order.team || '—';
            row.appendChild(teamCell);

            const statusCell = document.createElement('td');
            const statusInfo = getStatusInfo(order.status, { fallbackLabel: 'Status unbekannt' });
            statusCell.appendChild(createStatusBadge(statusInfo));
            row.appendChild(statusCell);

            const etaCell = document.createElement('td');
            etaCell.textContent = order.eta || '—';
            row.appendChild(etaCell);

            const partsCell = document.createElement('td');
            if (Array.isArray(order.parts) && order.parts.length) {
                const partsText = order.parts
                    .map((part) => {
                        const quantity = part.quantity != null ? `×${formatValue(part.quantity)}` : '';
                        return `${part.name || part.id || 'Teil'} ${quantity}`.trim();
                    })
                    .join(' • ');
                const partsLabel = document.createElement('small');
                partsLabel.textContent = partsText;
                partsCell.appendChild(partsLabel);
            } else {
                partsCell.textContent = '—';
            }
            row.appendChild(partsCell);

            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        repairBody.appendChild(table);
        repairBody.appendChild(
            createButtonRow([{ label: 'Aufträge aktualisieren' }, { label: 'Status an Brücke melden', tone: 'ghost' }])
        );
    }

    const inventoryBody = createPanel(container, {
        title: 'Ersatzteilbestand',
        description: 'Lagerbestände, Mindestmengen und Anforderungsstatus prüfen.'
    });

    if (!inventory.length) {
        appendEmptyState(inventoryBody, 'Keine Lagerdaten für diese Station hinterlegt.');
    } else {
        const table = document.createElement('table');
        table.className = 'operations-table';

        const thead = document.createElement('thead');
        const headRow = document.createElement('tr');
        ['Material', 'Bestand', 'Minimum', 'Status'].forEach((header) => {
            const th = document.createElement('th');
            th.textContent = header;
            headRow.appendChild(th);
        });
        thead.appendChild(headRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        inventory.forEach((item) => {
            const row = document.createElement('tr');

            const labelCell = document.createElement('td');
            const title = document.createElement('strong');
            title.textContent = item.name || item.id || 'Material';
            labelCell.appendChild(title);
            if (item.location) {
                const location = document.createElement('span');
                location.className = 'operations-subline';
                location.textContent = item.location;
                labelCell.appendChild(location);
            }
            if (item.note) {
                const note = document.createElement('small');
                note.textContent = item.note;
                labelCell.appendChild(note);
            }
            row.appendChild(labelCell);

            const quantityCell = document.createElement('td');
            if (item.capacity != null) {
                quantityCell.textContent = `${formatValue(item.quantity ?? 0)} / ${formatValue(item.capacity)}`;
            } else {
                quantityCell.textContent = item.quantity != null ? formatValue(item.quantity) : '—';
            }
            row.appendChild(quantityCell);

            const thresholdCell = document.createElement('td');
            thresholdCell.textContent = item.threshold != null ? formatValue(item.threshold) : '—';
            row.appendChild(thresholdCell);

            const statusCell = document.createElement('td');
            statusCell.appendChild(createStatusBadge(getStatusInfo(item.status, { fallbackLabel: 'Status' })));
            row.appendChild(statusCell);

            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        inventoryBody.appendChild(table);
        inventoryBody.appendChild(
            createButtonRow([{ label: 'Nachschub anfordern' }, { label: 'Bestand sichern', tone: 'ghost' }])
        );
    }
}

export async function renderOperationsForStation(station, container) {
    if (!container) {
        return;
    }

    container.innerHTML = '';
    const renderer = station ? OPERATIONS_RENDERERS[station.id] : undefined;

    if (!renderer) {
        const placeholder = document.createElement('p');
        placeholder.className = 'operations-placeholder';
        placeholder.textContent = 'Für diese Station sind noch keine interaktiven Panels hinterlegt.';
        container.appendChild(placeholder);
        return;
    }

    try {
        await renderer(container, station);
    } catch (error) {
        console.error('Fehler beim Rendern der Stationsbedienung:', error);
        const errorMessage = document.createElement('p');
        errorMessage.className = 'operations-placeholder operations-placeholder--error';
        errorMessage.textContent = 'Interaktive Panels konnten nicht geladen werden.';
        container.appendChild(errorMessage);
    }
}

export function hasOperationsRenderer(stationId) {
    return Boolean(OPERATIONS_RENDERERS[stationId]);
}
