import { loadScenarioData } from './station-scenario.js';

const OPERATIONS_RENDERERS = {
    'bridge-command': renderBridgeCommand,
    'eng-reactor': renderEngReactor,
    'eng-power': renderEngPower,
    'eng-thermal': renderEngThermal,
    'eng-propulsion': renderEngPropulsion,
    'eng-ftl': renderEngFtl,
    'eng-damage': renderEngDamage,
    'def-shields': renderDefShields,
    'def-hull': renderDefHull
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
    active: 'accent',
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

async function renderBridgeCommand(container) {
    let scenarioData = null;
    try {
        scenarioData = await loadScenarioData();
    } catch (error) {
        console.error('Fehler beim Laden der Szenariodaten für Kommandopult:', error);
    }

    const commandData = scenarioData?.command ?? {};
    const alert = commandData.alert ?? {};
    const mission = commandData.mission ?? {};
    const authorizations = Array.isArray(commandData.authorizations) ? commandData.authorizations : [];
    const macros = Array.isArray(commandData.macros) ? commandData.macros : [];
    const directives = Array.isArray(commandData.directives) ? commandData.directives : [];
    const commandLog = Array.isArray(commandData.log) ? commandData.log : [];

    const alertBody = createPanel(container, {
        title: 'Alarmstatus & Bereitschaft',
        description: 'Alarmstufen verwalten, Bereitschaft bestätigen und Lageeinschätzungen kommunizieren.'
    });

    const states = Array.isArray(alert.states) ? alert.states : [];
    const currentStateKey = safeLower(alert.currentState);
    const currentState = states.find((state) => safeLower(state.id) === currentStateKey) || null;
    let alertHasContent = false;

    if (currentState || alert.lastChange || alert.elapsed || alert.recommendation) {
        const summary = document.createElement('div');
        summary.className = 'command-alert-summary';

        if (currentState) {
            const badgeRow = document.createElement('div');
            badgeRow.className = 'command-alert-summary__badge-row';

            const label = document.createElement('span');
            label.className = 'command-alert-summary__label';
            label.textContent = 'Aktive Alarmstufe';
            badgeRow.appendChild(label);

            badgeRow.appendChild(
                createStatusBadge({
                    label: currentState.label || alert.currentState || 'Alarmstufe',
                    tone: currentState.tone || 'accent'
                })
            );
            summary.appendChild(badgeRow);

            if (currentState.summary) {
                const summaryText = document.createElement('p');
                summaryText.className = 'command-alert-summary__text';
                summaryText.textContent = currentState.summary;
                summary.appendChild(summaryText);
            }
        }

        const metaParts = [];
        if (alert.lastChange) {
            metaParts.push(`Letzte Änderung ${alert.lastChange}`);
        }
        if (alert.elapsed) {
            metaParts.push(`Aktiv seit ${alert.elapsed}`);
        }
        if (alert.countdown) {
            metaParts.push(`Nächste Bewertung in ${alert.countdown}`);
        }

        if (metaParts.length) {
            const meta = document.createElement('p');
            meta.className = 'command-alert-summary__meta';
            meta.textContent = metaParts.join(' • ');
            summary.appendChild(meta);
        }

        if (alert.recommendation) {
            const recommendation = document.createElement('p');
            recommendation.className = 'command-alert-summary__recommendation';
            recommendation.textContent = alert.recommendation;
            summary.appendChild(recommendation);
        }

        alertBody.appendChild(summary);
        alertHasContent = true;
    }

    if (states.length) {
        const selector = createRadioGroup({
            name: 'command-alert-state',
            label: 'Alarmstufe wählen',
            options: states.map((state) => ({
                value: state.id || state.label || '',
                label: state.label || state.id || 'Alarmstufe',
                description: state.summary || ''
            })),
            defaultValue: currentState?.id || alert.currentState
        });
        selector.classList.add('command-alert-selector');
        alertBody.appendChild(selector);

        const grid = document.createElement('div');
        grid.className = 'command-alert-states';

        states.forEach((state) => {
            const card = document.createElement('div');
            card.className = 'command-alert-state';

            const header = document.createElement('div');
            header.className = 'command-alert-state__header';

            const title = document.createElement('span');
            title.className = 'command-alert-state__title';
            title.textContent = state.label || state.id || 'Alarmstufe';
            header.appendChild(title);

            const isActive = safeLower(state.id) === currentStateKey;
            header.appendChild(
                createStatusBadge({
                    label: isActive ? 'Aktiv' : 'Bereit',
                    tone: isActive ? state.tone || 'accent' : 'default'
                })
            );
            card.appendChild(header);

            if (state.summary) {
                const summary = document.createElement('p');
                summary.className = 'command-alert-state__summary';
                summary.textContent = state.summary;
                card.appendChild(summary);
            }

            const metaParts = [];
            if (state.security) {
                metaParts.push(state.security);
            }
            if (state.power) {
                metaParts.push(state.power);
            }
            if (state.communications) {
                metaParts.push(state.communications);
            }
            if (metaParts.length) {
                const meta = document.createElement('p');
                meta.className = 'command-alert-state__meta';
                meta.textContent = metaParts.join(' • ');
                card.appendChild(meta);
            }

            if (Array.isArray(state.actions) && state.actions.length) {
                const actionsList = document.createElement('ul');
                actionsList.className = 'command-alert-state__actions';
                state.actions.forEach((action) => {
                    const item = document.createElement('li');
                    item.textContent = action;
                    actionsList.appendChild(item);
                });
                card.appendChild(actionsList);
            }

            if (state.note) {
                const note = document.createElement('p');
                note.className = 'command-alert-state__note';
                note.textContent = state.note;
                card.appendChild(note);
            }

            grid.appendChild(card);
        });

        alertBody.appendChild(grid);
        alertHasContent = true;
    }

    const acknowledgements = Array.isArray(alert.acknowledgements) ? alert.acknowledgements : [];
    if (acknowledgements.length) {
        const ackList = document.createElement('div');
        ackList.className = 'operations-control-list';

        acknowledgements.forEach((ack, index) => {
            const control = createToggleControl({
                id: ack.id || `command-ack-${index}`,
                label: ack.label || ack.id || 'Bestätigung',
                defaultChecked: Boolean(ack.acknowledged),
                description: ack.note || '',
                tone: ack.tone || 'accent'
            });

            if (ack.timestamp) {
                const meta = document.createElement('p');
                meta.className = 'command-acknowledgement-meta';
                meta.textContent = `Zeitstempel ${ack.timestamp}`;
                control.appendChild(meta);
            }

            ackList.appendChild(control);
        });

        alertBody.appendChild(ackList);
        alertHasContent = true;
    }

    if (alertHasContent) {
        alertBody.appendChild(
            createButtonRow([
                { label: 'Alarmstufe bestätigen' },
                { label: 'Crew informieren', tone: 'ghost' }
            ])
        );
    } else {
        appendEmptyState(alertBody, 'Keine Alarmdaten verfügbar.');
    }

    const missionBody = createPanel(container, {
        title: 'Missionslage & Prioritäten',
        description: 'Ziele priorisieren, Entscheidungen vorbereiten und Fortschritt verfolgen.'
    });

    let missionHasContent = false;
    if (mission.name || mission.phase || mission.summary) {
        const header = document.createElement('div');
        header.className = 'command-mission-header';

        if (mission.name) {
            const title = document.createElement('strong');
            title.textContent = mission.name;
            header.appendChild(title);
        }
        if (mission.phase) {
            const phase = document.createElement('span');
            phase.textContent = mission.phase;
            header.appendChild(phase);
        }
        if (mission.summary) {
            const summary = document.createElement('p');
            summary.className = 'command-mission-summary';
            summary.textContent = mission.summary;
            header.appendChild(summary);
        }

        missionBody.appendChild(header);
        missionHasContent = true;
    }

    const objectives = Array.isArray(mission?.objectives) ? mission.objectives : [];
    if (objectives.length) {
        const grid = document.createElement('div');
        grid.className = 'operations-metric-grid';

        objectives.forEach((objective) => {
            const noteParts = [];
            if (objective.priority) {
                noteParts.push(`Priorität ${objective.priority}`);
            }
            if (objective.owner) {
                noteParts.push(objective.owner);
            }
            if (objective.deadline) {
                noteParts.push(objective.deadline);
            }
            if (objective.note) {
                noteParts.push(objective.note);
            }

            grid.appendChild(
                createMetric({
                    label: objective.label || objective.id || 'Ziel',
                    value: toNumber(objective.progress) ?? 0,
                    unit: '%',
                    status: mapMetricStatus(objective.status),
                    note: noteParts.join(' • ') || undefined,
                    min: 0,
                    max: 100
                })
            );
        });

        missionBody.appendChild(grid);
        missionHasContent = true;
    }

    const decisions = Array.isArray(mission?.decisions) ? mission.decisions : [];
    if (decisions.length) {
        const table = document.createElement('table');
        table.className = 'operations-table command-decisions-table';

        const thead = document.createElement('thead');
        const headRow = document.createElement('tr');
        ['Entscheidung', 'Verantwortlich', 'Fällig', 'Status'].forEach((headerLabel) => {
            const th = document.createElement('th');
            th.textContent = headerLabel;
            headRow.appendChild(th);
        });
        thead.appendChild(headRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        decisions.forEach((decision) => {
            const row = document.createElement('tr');

            const labelCell = document.createElement('td');
            const title = document.createElement('strong');
            title.textContent = decision.label || decision.id || 'Entscheidung';
            labelCell.appendChild(title);
            if (decision.note) {
                const note = document.createElement('small');
                note.textContent = decision.note;
                labelCell.appendChild(note);
            }
            row.appendChild(labelCell);

            const ownerCell = document.createElement('td');
            ownerCell.textContent = decision.owner || '—';
            row.appendChild(ownerCell);

            const dueCell = document.createElement('td');
            dueCell.textContent = decision.due || '—';
            row.appendChild(dueCell);

            const statusCell = document.createElement('td');
            statusCell.appendChild(
                createStatusBadge(getStatusInfo(decision.status, { fallbackLabel: decision.status || 'Status' }))
            );
            row.appendChild(statusCell);

            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        missionBody.appendChild(table);
        missionHasContent = true;
    }

    if (missionHasContent) {
        missionBody.appendChild(
            createButtonRow([
                { label: 'Prioritäten aktualisieren' },
                { label: 'Lage an Crew senden', tone: 'ghost' }
            ])
        );
    } else {
        appendEmptyState(missionBody, 'Keine Missionsdaten vorhanden.');
    }

    const authBody = createPanel(container, {
        title: 'Globale Freigaben & Sperren',
        description: 'Systemfreigaben verwalten und Verantwortlichkeiten dokumentieren.'
    });

    if (!authorizations.length) {
        appendEmptyState(authBody, 'Keine Freigaben konfiguriert.');
    } else {
        const list = document.createElement('div');
        list.className = 'operations-control-list';

        authorizations.forEach((auth, index) => {
            const description =
                auth.note ||
                (Array.isArray(auth.requires) && auth.requires.length
                    ? `Erfordert: ${auth.requires.join(', ')}`
                    : '');
            const control = createToggleControl({
                id: auth.id || `command-authorization-${index}`,
                label: auth.label || auth.id || 'Freigabe',
                defaultChecked: Boolean(auth.granted),
                description,
                tone: auth.tone || 'accent'
            });

            if (auth.status) {
                const statusBadge = createStatusBadge(
                    getStatusInfo(auth.status, { fallbackLabel: auth.status || 'Status' })
                );
                statusBadge.classList.add('command-authorization-status');
                control.appendChild(statusBadge);
            }

            const metaParts = [];
            if (Array.isArray(auth.requires) && auth.requires.length) {
                auth.requires.forEach((role) => metaParts.push(role));
            }
            if (auth.lastChange) {
                metaParts.push(`Letzte Änderung ${auth.lastChange}`);
            }
            if (auth.expires) {
                metaParts.push(`Gültig bis ${auth.expires}`);
            }

            if (metaParts.length) {
                const meta = document.createElement('div');
                meta.className = 'command-authorization-meta';
                metaParts.forEach((part) => {
                    const chip = document.createElement('span');
                    chip.textContent = part;
                    meta.appendChild(chip);
                });
                control.appendChild(meta);
            }

            list.appendChild(control);
        });

        authBody.appendChild(list);
        authBody.appendChild(
            createButtonRow([
                { label: 'Freigaben protokollieren' },
                { label: 'Sperre anfordern', tone: 'ghost' }
            ])
        );
    }

    const macroBody = createPanel(container, {
        title: 'Notfall-Makros',
        description: 'Vordefinierte Kommandosequenzen für kritische Situationen auslösen.'
    });

    if (!macros.length) {
        appendEmptyState(macroBody, 'Keine Makros hinterlegt.');
    } else {
        const grid = document.createElement('div');
        grid.className = 'command-macro-grid';

        macros.forEach((macro) => {
            const card = document.createElement('div');
            card.className = 'command-macro';

            const header = document.createElement('div');
            header.className = 'command-macro__header';

            const title = document.createElement('span');
            title.className = 'command-macro__title';
            title.textContent = macro.label || macro.id || 'Makro';
            header.appendChild(title);

            if (macro.status) {
                header.appendChild(
                    createStatusBadge(getStatusInfo(macro.status, { fallbackLabel: macro.status || 'Status' }))
                );
            }

            card.appendChild(header);

            if (macro.description) {
                const desc = document.createElement('p');
                desc.className = 'command-macro__description';
                desc.textContent = macro.description;
                card.appendChild(desc);
            }

            if (Array.isArray(macro.actions) && macro.actions.length) {
                const actionsList = document.createElement('ul');
                actionsList.className = 'command-macro__actions';
                macro.actions.forEach((action) => {
                    const item = document.createElement('li');
                    item.textContent = action;
                    actionsList.appendChild(item);
                });
                card.appendChild(actionsList);
            }

            const footer = document.createElement('div');
            footer.className = 'command-macro__footer';
            if (macro.cooldown) {
                const cooldown = document.createElement('span');
                cooldown.textContent = `Cooldown ${macro.cooldown}`;
                footer.appendChild(cooldown);
            }
            if (macro.note) {
                const note = document.createElement('span');
                note.textContent = macro.note;
                footer.appendChild(note);
            }
            if (footer.childElementCount) {
                card.appendChild(footer);
            }

            card.appendChild(
                createButtonRow([
                    { label: 'Makro auslösen', tone: macro.tone || 'accent' },
                    { label: 'Details anzeigen', tone: 'ghost' }
                ])
            );

            grid.appendChild(card);
        });

        macroBody.appendChild(grid);
    }

    const directivesBody = createPanel(container, {
        title: 'Direktiven & Einsatzteams',
        description: 'Aktive Befehle koordinieren und Status der Teams überwachen.'
    });

    if (!directives.length) {
        appendEmptyState(directivesBody, 'Keine Direktiven aktiv.');
    } else {
        const table = document.createElement('table');
        table.className = 'operations-table command-directives-table';

        const thead = document.createElement('thead');
        const headRow = document.createElement('tr');
        ['Direktive', 'Verantwortlich', 'Status', 'ETA'].forEach((headerLabel) => {
            const th = document.createElement('th');
            th.textContent = headerLabel;
            headRow.appendChild(th);
        });
        thead.appendChild(headRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        directives.forEach((directive) => {
            const row = document.createElement('tr');

            const labelCell = document.createElement('td');
            const title = document.createElement('strong');
            title.textContent = directive.label || directive.id || 'Direktive';
            labelCell.appendChild(title);
            if (directive.note) {
                const note = document.createElement('small');
                note.textContent = directive.note;
                labelCell.appendChild(note);
            }
            row.appendChild(labelCell);

            const ownerCell = document.createElement('td');
            ownerCell.textContent = directive.owner || '—';
            row.appendChild(ownerCell);

            const statusCell = document.createElement('td');
            statusCell.appendChild(
                createStatusBadge(getStatusInfo(directive.status, { fallbackLabel: directive.status || 'Status' }))
            );
            row.appendChild(statusCell);

            const etaCell = document.createElement('td');
            etaCell.textContent = directive.eta || '—';
            row.appendChild(etaCell);

            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        directivesBody.appendChild(table);
        directivesBody.appendChild(
            createButtonRow([
                { label: 'Direktiven aktualisieren' },
                { label: 'Statusbericht senden', tone: 'ghost' }
            ])
        );
    }

    const logBody = createPanel(container, {
        title: 'Führungslogbuch',
        description: 'Relevante Entscheidungen und Meldungen dokumentieren.'
    });

    if (!commandLog.length) {
        appendEmptyState(logBody, 'Keine Logbucheinträge vorhanden.');
    } else {
        logBody.appendChild(createLog(commandLog));
        logBody.appendChild(createButtonRow([{ label: 'Log exportieren', tone: 'ghost' }]));
    }
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
    const powerMetrics = Array.isArray(scenarioData?.power?.metrics) ? scenarioData.power.metrics : [];

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

    const energyBody = createPanel(container, {
        title: 'Netzbelastung & Reserven',
        description: 'Reaktorleistung gegenüber Gesamtnetzlast und Pufferkapazität kontrollieren.'
    });

    const prioritizedPowerMetrics = ['metric-total-load', 'metric-reserve', 'metric-buffer']
        .map((metricId) => powerMetrics.find((metric) => metric.id === metricId))
        .filter((metric) => metric && typeof metric.value === 'number');

    const fallbackPowerMetrics = powerMetrics.filter((metric) => typeof metric?.value === 'number');
    const selectedPowerMetrics = prioritizedPowerMetrics.length
        ? prioritizedPowerMetrics
        : fallbackPowerMetrics.slice(0, 3);

    if (!selectedPowerMetrics.length) {
        appendEmptyState(energyBody, 'Keine aktuellen Leistungskennzahlen verfügbar.');
    } else {
        const grid = document.createElement('div');
        grid.className = 'operations-metric-grid';

        selectedPowerMetrics.forEach((metric) => {
            grid.appendChild(
                createMetric({
                    label: metric.label || metric.id || 'Kennzahl',
                    value: metric.value ?? 0,
                    unit: metric.unit || '',
                    status: mapMetricStatus(metric.status),
                    note: metric.note || undefined,
                    min: metric.min ?? 0,
                    max: metric.max ?? Math.max(metric.value ?? 0, 120)
                })
            );
        });

        energyBody.appendChild(grid);
    }

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

async function renderEngPower(container) {
    let scenarioData = null;
    try {
        scenarioData = await loadScenarioData();
    } catch (error) {
        console.error('Fehler beim Laden der Szenariodaten für Energieverteilung:', error);
    }

    const powerData = scenarioData?.power ?? {};

    const distributionBody = createPanel(container, {
        title: 'Leistungszuweisung',
        description: 'Reaktorleistung auf Busse und Subsysteme verteilen.'
    });

    const distributionList = document.createElement('div');
    distributionList.className = 'operations-distribution';

    const buses = Array.isArray(powerData.distribution) && powerData.distribution.length
        ? powerData.distribution
        : [
              { id: 'power-shields', name: 'Schilde', value: 32, max: 45, status: 'Gefechtsbereit', tone: 'accent' },
              { id: 'power-weapons', name: 'Waffen', value: 26, max: 40, status: 'Ladezyklen stabil', tone: 'warning' },
              { id: 'power-life', name: 'Lebenserhaltung', value: 12, max: 20, status: 'Nominal', tone: 'success' },
              { id: 'power-eng', name: 'Engineering Hilfssysteme', value: 18, max: 25, status: 'Überwacht', tone: 'warning' }
          ];

    buses.forEach((bus, index) => {
        const row = document.createElement('div');
        row.className = 'operations-distribution__row';

        const header = document.createElement('div');
        header.className = 'operations-distribution__header';

        const title = document.createElement('span');
        title.className = 'operations-distribution__title';
        title.textContent = bus.name || `Energiebus ${index + 1}`;
        header.appendChild(title);

        if (bus.status) {
            header.appendChild(createStatusBadge({ label: bus.status, tone: bus.tone || 'default' }));
        }

        row.appendChild(header);

        const range = createRangeControl({
            id: bus.id || `power-bus-${index}`,
            label: bus.controlLabel || 'Leistungsanteil',
            min: bus.min ?? 0,
            max: bus.max ?? 100,
            step: bus.step ?? 1,
            value: bus.value ?? 0,
            unit: bus.unit || '%',
            description:
                bus.description ||
                bus.note ||
                (bus.max != null ? `Grenzlast ${formatValue(bus.max)}${bus.unit || '%'}` : undefined)
        });

        row.appendChild(range);
        distributionList.appendChild(row);
    });

    if (!distributionList.children.length) {
        appendEmptyState(distributionBody, 'Keine Daten zur Leistungszuweisung vorhanden.');
    } else {
        distributionBody.appendChild(distributionList);
    }

    const priorityBody = createPanel(container, {
        title: 'Prioritätsprofile',
        description: 'Vordefinierte Verteilprofile laden und aktivieren.'
    });

    const profiles = Array.isArray(powerData.profiles) ? powerData.profiles : [];
    if (profiles.length) {
        const defaultProfile = profiles.find((profile) => profile.active) || profiles[0];
        const options = profiles.map((profile, index) => ({
            label: profile.label || profile.name || `Profil ${index + 1}`,
            value: profile.id || `profile-${index}`,
            description: profile.description || profile.note || ''
        }));

        priorityBody.appendChild(
            createRadioGroup({
                name: 'power-profile',
                label: 'Profil auswählen',
                options,
                defaultValue: defaultProfile?.id || options[0]?.value
            })
        );
    } else {
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
    }

    priorityBody.appendChild(createButtonRow([{ label: 'Profil anwenden' }, { label: 'Anpassung speichern', tone: 'ghost' }]));

    const loadBody = createPanel(container, {
        title: 'Lastabwurf & Schutzschalter',
        description: 'Vorbereitete Bypässe und Brownout-Pfade prüfen.'
    });

    const circuits = Array.isArray(powerData.circuits) && powerData.circuits.length
        ? powerData.circuits
        : [
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

    if (!circuits.length) {
        appendEmptyState(loadBody, 'Keine Lastabwurfpfade konfiguriert.');
    } else {
        const circuitList = document.createElement('div');
        circuitList.className = 'operations-control-list';
        circuits.forEach((circuit, index) => {
            circuitList.appendChild(
                createToggleControl({
                    id: circuit.id || `shed-${index}`,
                    label: circuit.label || `Pfad ${index + 1}`,
                    defaultChecked: Boolean(circuit.defaultChecked ?? circuit.armed ?? circuit.enabled),
                    description: circuit.description || circuit.note || '',
                    tone: circuit.tone || 'default'
                })
            );
        });
        loadBody.appendChild(circuitList);
        loadBody.appendChild(
            createButtonRow([{ label: 'Lastabwurf auslösen', tone: 'danger' }, { label: 'Abwurfplan sichern', tone: 'ghost' }])
        );
    }

    const monitorBody = createPanel(container, {
        title: 'Netzüberwachung',
        description: 'Verbrauch, Reserven und Puffer im Blick behalten.'
    });

    const metrics = Array.isArray(powerData.metrics) && powerData.metrics.length
        ? powerData.metrics
        : [
              { label: 'Gesamtverbrauch', value: 87, unit: '%', status: 'warning', note: 'Schwellwert 90%', min: 0, max: 120 },
              { label: 'Reserveleistung', value: 14, unit: '%', status: 'critical', note: 'Unter Soll 18%', min: 0, max: 40 },
              { label: 'Pufferkapazität', value: 62, unit: '%', status: 'normal', note: 'Batteriedecks', min: 0, max: 100 }
          ];

    if (!metrics.length) {
        appendEmptyState(monitorBody, 'Keine Monitoringdaten verfügbar.');
    } else {
        const monitorMetrics = document.createElement('div');
        monitorMetrics.className = 'operations-metric-grid';
        metrics.forEach((metric) => {
            monitorMetrics.append(
                createMetric({
                    label: metric.label || 'Messwert',
                    value: metric.value ?? 0,
                    unit: metric.unit || '',
                    status: metric.status || 'normal',
                    note: metric.note || undefined,
                    min: metric.min ?? 0,
                    max: metric.max ?? (metric.unit === '%' ? 100 : metric.value ?? 100)
                })
            );
        });
        monitorBody.appendChild(monitorMetrics);
    }

    const logEntries = Array.isArray(powerData.log) && powerData.log.length
        ? powerData.log
        : ['05:18 - Brownout-Warnung Deck 4 behoben', '05:02 - Reservebank 2 geladen (82%)', '04:47 - Verteiler 7A neu kalibriert'];
    monitorBody.appendChild(createLog(logEntries));
}

async function renderEngThermal(container) {
    let scenarioData = null;
    try {
        scenarioData = await loadScenarioData();
    } catch (error) {
        console.error('Fehler beim Laden der Szenariodaten für Thermalkontrolle:', error);
    }

    const thermalData = scenarioData?.thermal ?? {};

    const radiatorBody = createPanel(container, {
        title: 'Radiatorfelder',
        description: 'Abstrahlleistung und Temperaturen der Felder überwachen.'
    });

    const radiators = Array.isArray(thermalData.radiators) && thermalData.radiators.length
        ? thermalData.radiators
        : [
              { label: 'Radiator Alpha', value: 68, status: 'warning', note: 'Sonnenexposition hoch' },
              { label: 'Radiator Beta', value: 54, status: 'normal', note: 'Nominal' },
              { label: 'Radiator Gamma', value: 73, status: 'warning', note: 'Kühlmittelkreislauf prüfen' },
              { label: 'Radiator Delta', value: 49, status: 'normal', note: 'Reserve aktiv' }
          ];

    if (!radiators.length) {
        appendEmptyState(radiatorBody, 'Keine Radiatorfelder im Szenario definiert.');
    } else {
        const radiatorMetrics = document.createElement('div');
        radiatorMetrics.className = 'operations-metric-grid';
        radiators.forEach((radiator, index) => {
            radiatorMetrics.appendChild(
                createMetric({
                    label: radiator.label || radiator.name || `Radiator ${index + 1}`,
                    value: radiator.value ?? radiator.load ?? 0,
                    unit: radiator.unit || '%',
                    status: radiator.status || 'normal',
                    note: radiator.note || radiator.description || undefined,
                    min: radiator.min ?? 0,
                    max: radiator.max ?? 100
                })
            );
        });
        radiatorBody.appendChild(radiatorMetrics);
    }

    const flowBody = createPanel(container, {
        title: 'Kühlkreisläufe',
        description: 'Pumpenleistung und Ventile je Kreislauf steuern.'
    });

    const loops = Array.isArray(thermalData.loops) && thermalData.loops.length
        ? thermalData.loops
        : [
              { id: 'loop-primary', name: 'Primärer Kernkreislauf', pump: 76, flow: 540, note: 'Ventil 4 offen' },
              { id: 'loop-secondary', name: 'Sekundärkreislauf', pump: 64, flow: 410, note: 'Reserve-Radiator gekoppelt' },
              { id: 'loop-aux', name: 'Auxiliar / Lebenserhaltung', pump: 58, flow: 320, note: 'Temperatur stabil' }
          ];

    if (!loops.length) {
        appendEmptyState(flowBody, 'Keine Kühlkreisläufe verfügbar.');
    } else {
        const flowGrid = document.createElement('div');
        flowGrid.className = 'operations-loop-grid';

        loops.forEach((loop, index) => {
            const card = document.createElement('div');
            card.className = 'operations-loop-card';

            const header = document.createElement('div');
            header.className = 'operations-loop-card__header';
            const title = document.createElement('span');
            title.className = 'operations-loop-card__title';
            title.textContent = loop.name || `Kreislauf ${index + 1}`;
            header.appendChild(title);

            const badgeLabel = loop.flow != null
                ? `${formatValue(loop.flow)} ${loop.flowUnit || 'l/min'}`
                : loop.statusLabel || loop.status || 'Status';
            header.appendChild(
                createStatusBadge({ label: badgeLabel, tone: loop.statusTone || loop.tone || 'accent' })
            );
            card.appendChild(header);

            card.appendChild(
                createRangeControl({
                    id: `${loop.id || `loop-${index}`}-pump`,
                    label: loop.controlLabel || 'Pumpendrehzahl',
                    min: loop.min ?? 40,
                    max: loop.max ?? 100,
                    step: loop.step ?? 5,
                    value: loop.pump ?? 0,
                    unit: loop.unit || '%',
                    description: loop.description || undefined
                })
            );

            if (loop.note) {
                const note = document.createElement('p');
                note.className = 'operations-loop-card__note';
                note.textContent = loop.note;
                card.appendChild(note);
            }

            flowGrid.appendChild(card);
        });

        flowBody.appendChild(flowGrid);
    }

    const emergencyBody = createPanel(container, {
        title: 'Notfallmaßnahmen',
        description: 'Hitzeabfuhr für Extremsituationen vorbereiten.'
    });

    const emergencyChecklist = Array.isArray(thermalData.emergencyChecklist) && thermalData.emergencyChecklist.length
        ? thermalData.emergencyChecklist
        : [
              { id: 'venting-ready', label: 'Radiatoren entfalten / venten vorbereitet', checked: true },
              { id: 'heatsinks-arm', label: 'Heat-Sink-Module geladen', note: 'Letzte Ladung: 28 min' },
              { id: 'purge-lines', label: 'Kühlmittelleitungen gespült' },
              { id: 'emergency-fans', label: 'Notlüfter in Bereitschaft' }
          ];

    if (!emergencyChecklist.length) {
        appendEmptyState(emergencyBody, 'Keine Notfallmaßnahmen hinterlegt.');
    } else {
        emergencyBody.appendChild(
            createChecklist(
                emergencyChecklist.map((item, index) => ({
                    id: item.id || `thermal-check-${index}`,
                    label: item.label || item.name || `Schritt ${index + 1}`,
                    checked: Boolean(item.checked || item.completed),
                    note: item.note || item.description || undefined
                }))
            )
        );
    }

    emergencyBody.appendChild(
        createButtonRow([{ label: 'Abfuhrsequenz starten' }, { label: 'Alarm eskalieren', tone: 'danger' }])
    );

    const logBody = createPanel(container, {
        title: 'Temperaturmeldungen',
        description: 'Zeitliche Historie für Engineering und Brücke.'
    });

    const thermalLog = Array.isArray(thermalData.log) && thermalData.log.length
        ? thermalData.log
        : [
              '05:12 - Radiator Beta wieder im grünen Bereich',
              '04:58 - Warnung: Radiator Gamma 72% Last',
              '04:41 - Kühlkreislauf Auxiliar entlüftet'
          ];
    logBody.appendChild(createLog(thermalLog));
}

async function renderEngPropulsion(container) {
    let scenarioData = null;
    try {
        scenarioData = await loadScenarioData();
    } catch (error) {
        console.error('Fehler beim Laden der Szenariodaten für Antriebskontrolle:', error);
    }

    const propulsionData = scenarioData?.propulsion ?? {};

    const thrustBody = createPanel(container, {
        title: 'Schubkontrolle',
        description: 'Hauptantrieb und Nachbrennerleistung einstellen.'
    });

    const throttle = propulsionData.throttle || {
        id: 'propulsion-throttle',
        label: 'Hauptschub',
        min: 0,
        max: 110,
        step: 5,
        value: 72,
        unit: '%',
        description: 'Maximale Dauerlast 95%, Nachbrenner bis 110%.'
    };

    thrustBody.appendChild(
        createRangeControl({
            id: throttle.id || 'propulsion-throttle',
            label: throttle.label || 'Hauptschub',
            min: throttle.min ?? 0,
            max: throttle.max ?? 110,
            step: throttle.step ?? 1,
            value: throttle.value ?? 0,
            unit: throttle.unit || '%',
            description: throttle.description || undefined
        })
    );

    const deltaV = propulsionData.deltaV || {
        label: 'Verfügbares Delta-V',
        value: 4.6,
        unit: ' km/s',
        status: 'normal',
        note: 'Berechnet mit aktueller Masse',
        min: 0,
        max: 12
    };

    thrustBody.appendChild(
        createMetric({
            label: deltaV.label || 'Verfügbares Delta-V',
            value: deltaV.value ?? 0,
            unit: deltaV.unit || ' km/s',
            status: deltaV.status || 'normal',
            note: deltaV.note || undefined,
            min: deltaV.min ?? 0,
            max: deltaV.max ?? (deltaV.value ? Math.max(deltaV.value * 1.5, 1) : 10)
        })
    );

    const vectorBody = createPanel(container, {
        title: 'Vektorsteuerung',
        description: 'Pitch, Yaw und Roll für Flugmanöver anpassen.'
    });

    const vectorAxes = Array.isArray(propulsionData.vectorAxes) && propulsionData.vectorAxes.length
        ? propulsionData.vectorAxes
        : [
              { id: 'vector-pitch', label: 'Pitch', min: -30, max: 30, step: 1, value: 2, unit: '°' },
              { id: 'vector-yaw', label: 'Yaw', min: -30, max: 30, step: 1, value: -1, unit: '°' },
              { id: 'vector-roll', label: 'Roll', min: -15, max: 15, step: 1, value: 0, unit: '°' }
          ];

    if (!vectorAxes.length) {
        appendEmptyState(vectorBody, 'Keine Vektordaten verfügbar.');
    } else {
        const vectorControls = document.createElement('div');
        vectorControls.className = 'operations-control-list';
        vectorAxes.forEach((axis, index) => {
            vectorControls.append(
                createRangeControl({
                    id: axis.id || `vector-axis-${index}`,
                    label: axis.label || `Achse ${index + 1}`,
                    min: axis.min ?? -10,
                    max: axis.max ?? 10,
                    step: axis.step ?? 1,
                    value: axis.value ?? 0,
                    unit: axis.unit || ''
                })
            );
        });
        vectorBody.appendChild(vectorControls);
    }

    const rcsBody = createPanel(container, {
        title: 'RCS-Triebwerke',
        description: 'Status der Lagekontroll-Düsen überwachen und freigeben.'
    });

    const thrusters = Array.isArray(propulsionData.thrusters) && propulsionData.thrusters.length
        ? propulsionData.thrusters
        : [
              { id: 'fore-port', name: 'Bug • Backbord', active: true, status: 'Bereit', tone: 'success' },
              { id: 'fore-starboard', name: 'Bug • Steuerbord', active: true, status: 'Bereit', tone: 'success' },
              { id: 'aft-port', name: 'Heck • Backbord', active: true, status: 'Bereit', tone: 'success' },
              { id: 'aft-starboard', name: 'Heck • Steuerbord', active: false, status: 'Service nötig', tone: 'warning' },
              { id: 'ventral', name: 'Ventral Cluster', active: true, status: 'Überwacht', tone: 'warning' },
              { id: 'dorsal', name: 'Dorsal Cluster', active: true, status: 'Bereit', tone: 'success' }
          ];

    if (!thrusters.length) {
        appendEmptyState(rcsBody, 'Keine RCS-Daten im Szenario hinterlegt.');
    } else {
        const matrix = document.createElement('div');
        matrix.className = 'operations-matrix';

        thrusters.forEach((thruster, index) => {
            const cell = document.createElement('div');
            cell.className = 'operations-matrix__cell';

            const header = document.createElement('div');
            header.className = 'operations-matrix__header';
            const title = document.createElement('span');
            title.className = 'operations-matrix__title';
            title.textContent = thruster.name || `Düse ${index + 1}`;
            header.appendChild(title);
            if (thruster.status) {
                header.appendChild(createStatusBadge({ label: thruster.status, tone: thruster.tone || 'default' }));
            }
            cell.appendChild(header);

            cell.appendChild(
                createCompactToggle({
                    id: `rcs-${thruster.id || index}`,
                    onLabel: thruster.onLabel || 'Online',
                    offLabel: thruster.offLabel || 'Offline',
                    defaultChecked: Boolean(thruster.active || thruster.enabled)
                })
            );

            if (thruster.note) {
                const note = document.createElement('p');
                note.className = 'operations-matrix__note';
                note.textContent = thruster.note;
                cell.appendChild(note);
            }

            matrix.appendChild(cell);
        });

        rcsBody.appendChild(matrix);
    }

    rcsBody.appendChild(createButtonRow([{ label: 'RCS-Testimpuls senden' }, { label: 'Fehlermeldung loggen', tone: 'ghost' }]));

    const checklistBody = createPanel(container, {
        title: 'Manöverfreigaben',
        description: 'Vorflug-Checkliste für neue Manöver.'
    });

    const checklistItems = Array.isArray(propulsionData.checklist) && propulsionData.checklist.length
        ? propulsionData.checklist
        : [
              { id: 'prop-prime', label: 'Triebwerke auf Bereitschaft gebracht', checked: true },
              { id: 'prop-balance', label: 'Massenausgleich geprüft', note: 'Cargo bestätigt' },
              { id: 'prop-flightplan', label: 'Flight-Command bestätigt Manöverfenster' }
          ];

    if (!checklistItems.length) {
        appendEmptyState(checklistBody, 'Keine Checkliste hinterlegt.');
    } else {
        checklistBody.appendChild(
            createChecklist(
                checklistItems.map((item, index) => ({
                    id: item.id || `prop-check-${index}`,
                    label: item.label || item.name || `Schritt ${index + 1}`,
                    checked: Boolean(item.checked || item.completed),
                    note: item.note || item.description || undefined
                }))
            )
        );
    }

    checklistBody.appendChild(
        createButtonRow([{ label: 'Bereitschaft melden' }, { label: 'Rückmeldung an Brücke', tone: 'ghost' }])
    );
}
async function renderEngFtl(container) {
    let scenarioData = null;
    try {
        scenarioData = await loadScenarioData();
    } catch (error) {
        console.error('Fehler beim Laden der Szenariodaten für FTL-Steuerung:', error);
    }

    const ftlData = scenarioData?.ftl ?? {};

    const chargeBody = createPanel(container, {
        title: 'Spulenladung',
        description: 'Ladung, Countdown und Startfreigabe koordinieren.'
    });

    const chargeMetric = ftlData.charge || {
        label: 'Aktuelle Ladung',
        value: 62,
        unit: '%',
        status: 'warning',
        note: 'Sprungbereit ab 95%',
        min: 0,
        max: 100
    };

    chargeBody.appendChild(
        createMetric({
            label: chargeMetric.label || 'Aktuelle Ladung',
            value: chargeMetric.value ?? 0,
            unit: chargeMetric.unit || '%',
            status: chargeMetric.status || 'normal',
            note: chargeMetric.note || undefined,
            min: chargeMetric.min ?? 0,
            max: chargeMetric.max ?? 100
        })
    );

    const chargeTarget = ftlData.target || { id: 'ftl-charge-target', label: 'Ladeziel', min: 80, max: 100, step: 1, value: 95, unit: '%' };

    chargeBody.appendChild(
        createRangeControl({
            id: chargeTarget.id || 'ftl-charge-target',
            label: chargeTarget.label || 'Ladeziel',
            min: chargeTarget.min ?? 0,
            max: chargeTarget.max ?? 100,
            step: chargeTarget.step ?? 1,
            value: chargeTarget.value ?? 0,
            unit: chargeTarget.unit || '%',
            description: chargeTarget.description || undefined
        })
    );

    chargeBody.appendChild(
        createButtonRow([{ label: 'Ladungssynchronisation starten' }, { label: 'Countdown übertragen', tone: 'ghost' }])
    );

    const stabilityBody = createPanel(container, {
        title: 'Feldstabilität',
        description: 'Stabilität, Vibrationen und Anomalien beobachten.'
    });

    const stabilityMetricsData = Array.isArray(ftlData.stabilityMetrics) && ftlData.stabilityMetrics.length
        ? ftlData.stabilityMetrics
        : [
              { label: 'Feldstabilität', value: 91, unit: '%', status: 'normal', note: 'Nominal', min: 0, max: 100 },
              { label: 'Jitter', value: 0.6, unit: '%', status: 'warning', note: 'Grenze 0,8%', min: 0, max: 3 },
              { label: 'Strukturbelastung', value: 38, unit: '%', status: 'normal', note: 'Innerhalb Limits', min: 0, max: 100 }
          ];

    if (!stabilityMetricsData.length) {
        appendEmptyState(stabilityBody, 'Keine Stabilitätsdaten verfügbar.');
    } else {
        const stabilityMetrics = document.createElement('div');
        stabilityMetrics.className = 'operations-metric-grid';
        stabilityMetricsData.forEach((metric, index) => {
            stabilityMetrics.append(
                createMetric({
                    label: metric.label || `Messwert ${index + 1}`,
                    value: metric.value ?? 0,
                    unit: metric.unit || '',
                    status: metric.status || 'normal',
                    note: metric.note || undefined,
                    min: metric.min ?? 0,
                    max: metric.max ?? (metric.unit === '%' ? 100 : metric.value ?? 100)
                })
            );
        });
        stabilityBody.appendChild(stabilityMetrics);
    }

    const stabilityLog = Array.isArray(ftlData.stabilityLog) && ftlData.stabilityLog.length
        ? ftlData.stabilityLog
        : ['05:09 - Navigationsdaten bestätigt', '05:03 - Feldkalibrierung abgeschlossen', '04:55 - Sicherheitsinterlock erfolgreich getestet'];
    stabilityBody.appendChild(createLog(stabilityLog));

    const interlockBody = createPanel(container, {
        title: 'Interlocks & Freigaben',
        description: 'Mehrfachfreigaben für Sprungvorbereitung verwalten.'
    });

    const interlocks = Array.isArray(ftlData.interlocks) && ftlData.interlocks.length
        ? ftlData.interlocks
        : [
              { id: 'ftl-lock-captain', label: 'Captain-Freigabe', defaultChecked: true, tone: 'accent', description: 'Bestätigung via Brücke' },
              { id: 'ftl-lock-engineer', label: 'Chefingenieur', defaultChecked: true, tone: 'success', description: 'Reaktorleistung gesichert' },
              { id: 'ftl-lock-navigation', label: 'Navigation', defaultChecked: false, tone: 'warning', description: 'Sprungfenster noch in Berechnung' }
          ];

    if (!interlocks.length) {
        appendEmptyState(interlockBody, 'Keine Interlocks konfiguriert.');
    } else {
        const interlockList = document.createElement('div');
        interlockList.className = 'operations-control-list';
        interlocks.forEach((interlock, index) => {
            interlockList.appendChild(
                createToggleControl({
                    id: interlock.id || `ftl-lock-${index}`,
                    label: interlock.label || `Freigabe ${index + 1}`,
                    defaultChecked: Boolean(interlock.defaultChecked ?? interlock.enabled),
                    description: interlock.description || interlock.note || '',
                    tone: interlock.tone || 'default'
                })
            );
        });
        interlockBody.appendChild(interlockList);
    }

    const abortBody = createPanel(container, {
        title: 'Abbruch & Sicherheit',
        description: 'Notfall-Abbruch vorbereiten und dokumentieren.'
    });

    const abortPlaceholder = ftlData.abortPlaceholder || 'z. B. Signaturanstieg, Kursabweichung, Crew-Feedback';
    abortBody.appendChild(
        createTextAreaControl({
            id: 'ftl-abort-note',
            label: 'Abbruchgrund / Beobachtung',
            placeholder: abortPlaceholder
        })
    );

    abortBody.appendChild(
        createButtonRow([{ label: 'FTL-Abbruch auslösen', tone: 'danger' }, { label: 'Protokoll speichern', tone: 'ghost' }])
    );

    const abortLog = Array.isArray(ftlData.abortLog) && ftlData.abortLog.length
        ? ftlData.abortLog
        : ['04:50 - Sicherheitscheckliste abgeschlossen', '04:46 - Warnung: Jitter 0,8% (innerhalb Limits)', '04:38 - Navigation meldet Kursfenster t+11 Minuten'];
    abortBody.appendChild(createLog(abortLog));
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
    const powerMetrics = Array.isArray(scenarioData?.power?.metrics)
        ? scenarioData.power.metrics
        : [];
    const radiators = Array.isArray(scenarioData?.thermal?.radiators)
        ? scenarioData.thermal.radiators
        : [];
    const thermalLoops = Array.isArray(scenarioData?.thermal?.loops) ? scenarioData.thermal.loops : [];

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

    const overviewBody = createPanel(container, {
        title: 'Maschinenraumlage',
        description: 'Reaktorlast, Netzreserve und Wärmeabfuhr für Lageberichte der Schadenskontrolle.'
    });

    const overviewMetrics = [];

    const addScenarioMetric = (metric) => {
        if (!metric || typeof metric.value !== 'number') {
            return;
        }
        overviewMetrics.push({
            label: metric.label || metric.id || 'Kennzahl',
            value: metric.value,
            unit: metric.unit || '',
            status: mapMetricStatus(metric.status),
            note: metric.note || undefined,
            min: metric.min ?? 0,
            max: metric.max ?? Math.max(metric.value, 100)
        });
    };

    const totalLoadMetric = powerMetrics.find((metric) => metric.id === 'metric-total-load');
    const reserveMetric = powerMetrics.find((metric) => metric.id === 'metric-reserve');
    const bufferMetric = powerMetrics.find((metric) => metric.id === 'metric-buffer');

    addScenarioMetric(totalLoadMetric);
    addScenarioMetric(reserveMetric);
    addScenarioMetric(bufferMetric);

    if (!overviewMetrics.length) {
        powerMetrics.slice(0, 2).forEach(addScenarioMetric);
    }

    if (radiators.length) {
        const hottestRadiator = radiators.reduce((currentMax, radiator) => {
            const currentValue = toNumber(currentMax?.value) ?? -Infinity;
            const candidateValue = toNumber(radiator?.value) ?? -Infinity;
            return candidateValue > currentValue ? radiator : currentMax;
        }, null);

        if (hottestRadiator && toNumber(hottestRadiator.value) !== null) {
            overviewMetrics.push({
                label: hottestRadiator.label || hottestRadiator.name || 'Radiator',
                value: toNumber(hottestRadiator.value) ?? 0,
                unit: hottestRadiator.unit || '%',
                status: mapMetricStatus(hottestRadiator.status),
                note:
                    hottestRadiator.note ||
                    (hottestRadiator.route ? `Segment ${hottestRadiator.route}` : 'Höchste aktuelle Strahlungsleistung'),
                min: hottestRadiator.min ?? 0,
                max: hottestRadiator.max ?? 120
            });
        }
    }

    if (thermalLoops.length) {
        const busiestLoop = thermalLoops.reduce((currentMax, loop) => {
            const currentValue = toNumber(currentMax?.pump) ?? -Infinity;
            const candidateValue = toNumber(loop?.pump) ?? -Infinity;
            return candidateValue > currentValue ? loop : currentMax;
        }, null);

        if (busiestLoop && toNumber(busiestLoop.pump) !== null) {
            const flowNote =
                busiestLoop.flow != null
                    ? `Durchfluss ${formatValue(busiestLoop.flow)} ${busiestLoop.flowUnit || 'l/min'}`
                    : busiestLoop.note || undefined;
            overviewMetrics.push({
                label: busiestLoop.name || busiestLoop.id || 'Kühlkreislauf',
                value: toNumber(busiestLoop.pump) ?? 0,
                unit: busiestLoop.unit || '%',
                status: mapMetricStatus(busiestLoop.status),
                note: flowNote,
                min: busiestLoop.min ?? 0,
                max: busiestLoop.max ?? 110
            });
        }
    }

    if (!overviewMetrics.length) {
        appendEmptyState(overviewBody, 'Keine laufenden Statusdaten für den Maschinenraum verfügbar.');
    } else {
        const grid = document.createElement('div');
        grid.className = 'operations-metric-grid';
        overviewMetrics.forEach((metric) => {
            grid.appendChild(createMetric(metric));
        });
        overviewBody.appendChild(grid);
    }

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

async function renderDefShields(container) {
    let scenarioData = null;
    try {
        scenarioData = await loadScenarioData();
    } catch (error) {
        console.error('Fehler beim Laden der Szenariodaten für Schildsteuerung:', error);
    }

    const shieldsData = scenarioData?.defense?.shields ?? {};
    const sectors = Array.isArray(shieldsData.sectors) ? shieldsData.sectors : [];
    const reinforcement = shieldsData?.reinforcement ?? null;
    const walls = Array.isArray(shieldsData.walls) ? shieldsData.walls : [];
    const priorities = Array.isArray(shieldsData.priorities) ? shieldsData.priorities : [];
    const log = Array.isArray(shieldsData.log) ? shieldsData.log : [];

    const sectorsBody = createPanel(container, {
        title: 'Schildsektoren',
        description: 'Kapazität, Regeneration und taktischer Fokus je Quadrant.'
    });

    if (!sectors.length) {
        appendEmptyState(sectorsBody, 'Keine Schildsektoren im Szenario vorhanden.');
    } else {
        const grid = document.createElement('div');
        grid.className = 'operations-metric-grid';

        sectors.forEach((sector) => {
            const noteParts = [];
            if (sector.arc) {
                noteParts.push(`Sektor ${sector.arc}`);
            }
            if (sector.focus) {
                noteParts.push(`Fokus ${sector.focus}`);
            }
            if (sector.regen != null) {
                noteParts.push(`Regeneration ${formatValue(sector.regen)}%`);
            }

            grid.appendChild(
                createMetric({
                    label: sector.label || sector.id || 'Sektor',
                    value: sector.strength ?? 0,
                    unit: '%',
                    status: mapMetricStatus(sector.status),
                    note: noteParts.join(' • ') || undefined,
                    min: 0,
                    max: sector.capacity ?? 120
                })
            );
        });

        sectorsBody.appendChild(grid);
        sectorsBody.appendChild(
            createButtonRow([{ label: 'Fokus mit Taktik synchronisieren' }, { label: 'Status an Brücke melden', tone: 'ghost' }])
        );
    }

    const reinforcementBody = createPanel(container, {
        title: 'Verstärkung & Regeneration',
        description: 'Modi, Regenerationsziele und Reserven der Schildnetzwerke einstellen.'
    });

    if (!reinforcement) {
        appendEmptyState(reinforcementBody, 'Keine Verstärkungsdaten hinterlegt.');
    } else {
        const modes = Array.isArray(reinforcement.modes) ? reinforcement.modes : [];
        if (modes.length) {
            reinforcementBody.appendChild(
                createRadioGroup({
                    name: 'shield-mode',
                    label: 'Verteilungsmodus',
                    options: modes.map((mode) => ({
                        label: mode.label || mode.value || 'Modus',
                        value: mode.value || mode.label || '',
                        description: mode.description || ''
                    })),
                    defaultValue: reinforcement.currentMode || undefined
                })
            );
        }

        if (reinforcement.regenTarget) {
            reinforcementBody.appendChild(
                createRangeControl({
                    id: reinforcement.regenTarget.id || 'shield-regen-target',
                    label: reinforcement.regenTarget.label || 'Regenerationsziel',
                    min: reinforcement.regenTarget.min ?? 0,
                    max: reinforcement.regenTarget.max ?? 140,
                    step: reinforcement.regenTarget.step ?? 5,
                    value: reinforcement.regenTarget.value ?? 0,
                    unit: reinforcement.regenTarget.unit || '%',
                    description: reinforcement.regenTarget.description || ''
                })
            );
        }

        const boosts = Array.isArray(reinforcement.boosts) ? reinforcement.boosts : [];
        if (boosts.length) {
            const boostList = document.createElement('div');
            boostList.className = 'operations-control-list';

            boosts.forEach((boost, index) => {
                const control = createRangeControl({
                    id: boost.id || `shield-boost-${index}`,
                    label: boost.label || 'Verstärkung',
                    min: boost.min ?? 0,
                    max: boost.max ?? 30,
                    step: boost.step ?? 5,
                    value: boost.value ?? 0,
                    unit: boost.unit || '%',
                    description: boost.note || ''
                });

                if (boost.status) {
                    const head = control.querySelector('.operations-control__head');
                    if (head) {
                        head.appendChild(createStatusBadge(getStatusInfo(boost.status, { fallbackLabel: boost.status })));
                    }
                }

                boostList.appendChild(control);
            });

            reinforcementBody.appendChild(boostList);
        }

        const reserves = Array.isArray(reinforcement.reserves) ? reinforcement.reserves : [];
        if (reserves.length) {
            const reserveList = document.createElement('div');
            reserveList.className = 'operations-control-list';

            reserves.forEach((reserve, index) => {
                reserveList.appendChild(
                    createToggleControl({
                        id: reserve.id || `shield-reserve-${index}`,
                        label: reserve.label || 'Reservebank',
                        defaultChecked: Boolean(reserve.defaultChecked),
                        description: reserve.description || '',
                        tone: reserve.tone || 'default'
                    })
                );
            });

            reinforcementBody.appendChild(reserveList);
        }

        reinforcementBody.appendChild(
            createButtonRow([{ label: 'Konfiguration speichern' }, { label: 'Automatik synchronisieren', tone: 'ghost' }])
        );
    }

    const wallsBody = createPanel(container, {
        title: 'Notfallbarrieren & Interlocks',
        description: 'Sicherheitsbarrieren vorbereiten und Freigaben prüfen.'
    });

    if (!walls.length) {
        appendEmptyState(wallsBody, 'Keine Notfallbarrieren definiert.');
    } else {
        const list = document.createElement('div');
        list.className = 'operations-bypass-list';

        walls.forEach((wall, index) => {
            const item = document.createElement('div');
            item.className = 'operations-bypass';

            const header = document.createElement('div');
            header.className = 'operations-bypass__header';

            const title = document.createElement('span');
            title.className = 'operations-bypass__title';
            title.textContent = wall.label || wall.id || 'Notwall';
            header.appendChild(title);
            header.appendChild(createStatusBadge(getStatusInfo(wall.status, { fallbackLabel: wall.status || 'Status' })));
            item.appendChild(header);

            if (wall.cooldown) {
                const meta = document.createElement('div');
                meta.className = 'operations-bypass__meta';
                meta.textContent = `Cooldown ${wall.cooldown}`;
                item.appendChild(meta);
            }

            const interlocks = Array.isArray(wall.interlocks) ? wall.interlocks : [];
            if (interlocks.length) {
                const interlockInfo = document.createElement('p');
                interlockInfo.className = 'operations-bypass__note';
                interlockInfo.textContent = interlocks
                    .map((lock) => {
                        const status = getStatusInfo(lock.status, { fallbackLabel: lock.status || 'Status' });
                        return `${lock.label || lock.id || 'Freigabe'}: ${status.label}`;
                    })
                    .join(' • ');
                item.appendChild(interlockInfo);
            }

            if (wall.note) {
                const note = document.createElement('p');
                note.className = 'operations-bypass__note';
                note.textContent = wall.note;
                item.appendChild(note);
            }

            item.appendChild(
                createButtonRow([
                    { label: 'Barriere aktivieren', tone: 'danger' },
                    { label: 'Freigaben melden', tone: 'ghost' }
                ])
            );

            list.appendChild(item);
        });

        wallsBody.appendChild(list);
    }

    const prioritiesBody = createPanel(container, {
        title: 'Taktische Prioritäten',
        description: 'Zielabdeckung und sektorspezifische Schutzaufträge koordinieren.'
    });

    if (!priorities.length) {
        appendEmptyState(prioritiesBody, 'Keine taktischen Prioritäten hinterlegt.');
    } else {
        const table = document.createElement('table');
        table.className = 'operations-table';

        const thead = document.createElement('thead');
        const headRow = document.createElement('tr');
        ['Ziel', 'Priorität', 'Sektor', 'Hinweis'].forEach((header) => {
            const th = document.createElement('th');
            th.textContent = header;
            headRow.appendChild(th);
        });
        thead.appendChild(headRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        priorities.forEach((priority) => {
            const row = document.createElement('tr');

            const targetCell = document.createElement('td');
            const title = document.createElement('strong');
            title.textContent = priority.target || priority.id || 'Ziel';
            targetCell.appendChild(title);
            row.appendChild(targetCell);

            const priorityCell = document.createElement('td');
            priorityCell.textContent = priority.priority || '—';
            row.appendChild(priorityCell);

            const alignmentCell = document.createElement('td');
            alignmentCell.textContent = priority.alignment || '—';
            row.appendChild(alignmentCell);

            const noteCell = document.createElement('td');
            noteCell.textContent = priority.note || '—';
            row.appendChild(noteCell);

            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        prioritiesBody.appendChild(table);
    }

    const logBody = createPanel(container, {
        title: 'Schild-Logbuch',
        description: 'Ereignisse und Anpassungen der Schildkonfiguration.'
    });

    if (!log.length) {
        appendEmptyState(logBody, 'Keine Logbucheinträge vorhanden.');
    } else {
        logBody.appendChild(createLog(log));
    }
}

async function renderDefHull(container) {
    let scenarioData = null;
    try {
        scenarioData = await loadScenarioData();
    } catch (error) {
        console.error('Fehler beim Laden der Szenariodaten für Hüllenüberwachung:', error);
    }

    const hullData = scenarioData?.defense?.hull ?? {};
    const integrityMetrics = Array.isArray(hullData.integrityMetrics) ? hullData.integrityMetrics : [];
    const stressPoints = Array.isArray(hullData.stressPoints) ? hullData.stressPoints : [];
    const bulkheads = Array.isArray(hullData.bulkheads) ? hullData.bulkheads : [];
    const bracing = Array.isArray(hullData.bracing) ? hullData.bracing : [];
    const resonanceAlerts = Array.isArray(hullData.resonanceAlerts) ? hullData.resonanceAlerts : [];
    const log = Array.isArray(hullData.log) ? hullData.log : [];

    const integrityBody = createPanel(container, {
        title: 'Integrität & Belastung',
        description: 'Gesamtstatus und kritische Belastungswerte der Hülle.'
    });

    if (!integrityMetrics.length) {
        appendEmptyState(integrityBody, 'Keine Integritätsdaten verfügbar.');
    } else {
        const grid = document.createElement('div');
        grid.className = 'operations-metric-grid';

        integrityMetrics.forEach((metric) => {
            grid.appendChild(
                createMetric({
                    label: metric.label || metric.id || 'Messwert',
                    value: metric.value ?? 0,
                    unit: metric.unit || '',
                    status: mapMetricStatus(metric.status),
                    note: metric.note || undefined,
                    min: metric.min ?? 0,
                    max: metric.max ?? 100
                })
            );
        });

        integrityBody.appendChild(grid);
    }

    const stressBody = createPanel(container, {
        title: 'Strukturlasten & Resonanzen',
        description: 'Hotspots überwachen und Manöverbelastungen bewerten.'
    });

    if (!stressPoints.length) {
        appendEmptyState(stressBody, 'Keine Belastungspunkte definiert.');
    } else {
        const grid = document.createElement('div');
        grid.className = 'operations-metric-grid';

        stressPoints.forEach((point) => {
            const noteParts = [];
            if (point.resonance != null) {
                noteParts.push(`Resonanz ${formatValue(point.resonance)} Hz`);
            }
            if (point.note) {
                noteParts.push(point.note);
            }

            grid.appendChild(
                createMetric({
                    label: point.label || point.id || 'Sektion',
                    value: point.load ?? 0,
                    unit: '%',
                    status: mapMetricStatus(point.status),
                    note: noteParts.join(' • ') || undefined,
                    min: 0,
                    max: 120
                })
            );
        });

        stressBody.appendChild(grid);
        stressBody.appendChild(
            createButtonRow([{ label: 'Vibrationsanalyse starten' }, { label: 'Meldung an Engineering', tone: 'ghost' }])
        );
    }

    const bulkheadBody = createPanel(container, {
        title: 'Schottstatus & Abdichtung',
        description: 'Schotte überwachen und Drucksicherheit dokumentieren.'
    });

    if (!bulkheads.length) {
        appendEmptyState(bulkheadBody, 'Keine Schottdaten hinterlegt.');
    } else {
        const table = document.createElement('table');
        table.className = 'operations-table';

        const thead = document.createElement('thead');
        const headRow = document.createElement('tr');
        ['Sektion', 'Status', 'Druck', 'Versiegelung'].forEach((header) => {
            const th = document.createElement('th');
            th.textContent = header;
            headRow.appendChild(th);
        });
        thead.appendChild(headRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        bulkheads.forEach((bulkhead) => {
            const row = document.createElement('tr');

            const locationCell = document.createElement('td');
            const title = document.createElement('strong');
            title.textContent = bulkhead.location || bulkhead.id || 'Sektion';
            locationCell.appendChild(title);
            row.appendChild(locationCell);

            const statusCell = document.createElement('td');
            statusCell.appendChild(
                createStatusBadge(getStatusInfo(bulkhead.status, { fallbackLabel: bulkhead.status || 'Status' }))
            );
            row.appendChild(statusCell);

            const pressureCell = document.createElement('td');
            pressureCell.textContent =
                bulkhead.pressure != null
                    ? `${formatValue(bulkhead.pressure)} ${bulkhead.pressureUnit || 'kPa'}`
                    : '—';
            row.appendChild(pressureCell);

            const sealCell = document.createElement('td');
            sealCell.textContent = bulkhead.seal || '—';
            row.appendChild(sealCell);

            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        bulkheadBody.appendChild(table);
    }

    const bracingBody = createPanel(container, {
        title: 'Verstrebungen & Sicherungen',
        description: 'Notstützen aktivieren und strukturelle Sicherungen nachverfolgen.'
    });

    if (!bracing.length) {
        appendEmptyState(bracingBody, 'Keine Verstrebungen im Szenario erfasst.');
    } else {
        const list = document.createElement('div');
        list.className = 'operations-control-list';

        bracing.forEach((brace, index) => {
            list.appendChild(
                createToggleControl({
                    id: brace.id || `brace-${index}`,
                    label: brace.label || brace.id || 'Verstrebung',
                    defaultChecked: brace.engaged ?? false,
                    description: brace.description || '',
                    tone: brace.tone || 'default'
                })
            );
        });

        bracingBody.appendChild(list);
        bracingBody.appendChild(
            createButtonRow([{ label: 'Einsatz dokumentieren' }, { label: 'Sicherung lösen', tone: 'ghost' }])
        );
    }

    const resonanceBody = createPanel(container, {
        title: 'Resonanzwarnungen',
        description: 'Aktive Resonanzmeldungen und Gegenmaßnahmen.'
    });

    if (!resonanceAlerts.length) {
        appendEmptyState(resonanceBody, 'Keine Resonanzwarnungen aktiv.');
    } else {
        const table = document.createElement('table');
        table.className = 'operations-table';

        const thead = document.createElement('thead');
        const headRow = document.createElement('tr');
        ['Frequenz', 'Schwere', 'Empfehlung'].forEach((header) => {
            const th = document.createElement('th');
            th.textContent = header;
            headRow.appendChild(th);
        });
        thead.appendChild(headRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        resonanceAlerts.forEach((alert) => {
            const row = document.createElement('tr');

            const freqCell = document.createElement('td');
            freqCell.textContent = alert.frequency || '—';
            row.appendChild(freqCell);

            const severityCell = document.createElement('td');
            severityCell.appendChild(createStatusBadge(getSeverityInfo(alert.severity)));
            row.appendChild(severityCell);

            const recommendationCell = document.createElement('td');
            recommendationCell.textContent = alert.recommendation || '—';
            row.appendChild(recommendationCell);

            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        resonanceBody.appendChild(table);
    }

    const logBody = createPanel(container, {
        title: 'Hüllen-Logbuch',
        description: 'Relevante Ereignisse und Maßnahmen zur strukturellen Integrität.'
    });

    if (!log.length) {
        appendEmptyState(logBody, 'Keine Logbucheinträge vorhanden.');
    } else {
        logBody.appendChild(createLog(log));
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
