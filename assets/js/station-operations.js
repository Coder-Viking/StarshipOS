
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

function renderEngReactor(container) {
    const statusBody = createPanel(container, {
        title: 'Reaktorstatus',
        description: 'Leistungsausgabe, Kernparameter und Kontrollstabposition im Blick behalten.'
    });

    const metrics = document.createElement('div');
    metrics.className = 'operations-metric-grid';
    metrics.append(
        createMetric({ label: 'Leistungsausgabe', value: 84, unit: '%', status: 'warning', note: 'Sollwert 85%', min: 0, max: 120 }),
        createMetric({ label: 'Kern-Temperatur', value: 612, unit: '°C', status: 'warning', note: 'Grenze 750°C', min: 0, max: 900 }),
        createMetric({ label: 'Neutronenfluss', value: 68, unit: '%', status: 'normal', note: 'Stabil', min: 0, max: 120 }),
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

function renderEngDamage(container) {
    const sectionBody = createPanel(container, {
        title: 'Sektionenübersicht',
        description: 'Strukturschäden und Leitungsstatus nach Bereich.'
    });

    const sections = [
        { name: 'Maschinenraum', integrity: 78, status: 'warning', note: 'Deck 3 Leitungsschaden' },
        { name: 'Reaktorraum', integrity: 88, status: 'normal', note: 'Vibrationen im Rahmen' },
        { name: 'Antriebstunnel', integrity: 61, status: 'critical', note: 'Strebenverstärkung erforderlich' },
        { name: 'Versorgungstrakt', integrity: 84, status: 'normal', note: 'Notbeleuchtung aktiv' }
    ];

    const sectionMetrics = document.createElement('div');
    sectionMetrics.className = 'operations-metric-grid';
    sections.forEach((section) => {
        sectionMetrics.appendChild(
            createMetric({
                label: section.name,
                value: section.integrity,
                unit: '%',
                status: section.status,
                note: section.note,
                min: 0,
                max: 100
            })
        );
    });
    sectionBody.appendChild(sectionMetrics);

    const circuitsBody = createPanel(container, {
        title: 'Leitungsschemata & Isolation',
        description: 'Ventile, Breaker und Bypässe pro Leitung setzen.'
    });

    const circuitToggles = [
        {
            id: 'dc-plasma-main',
            label: 'Plasma-Hauptleitung Deck 3',
            defaultChecked: false,
            description: 'Ventil geschlossen • Bypass aktiv',
            tone: 'danger'
        },
        {
            id: 'dc-power-alpha',
            label: 'Energie-Bus Alpha',
            defaultChecked: true,
            description: 'Breaker geschlossen • Normalbetrieb',
            tone: 'success'
        },
        {
            id: 'dc-coolant-delta',
            label: 'Kühlmittel Delta-Loop',
            defaultChecked: true,
            description: 'Strömung 68% • Druck stabil',
            tone: 'accent'
        }
    ];

    const circuitList = document.createElement('div');
    circuitList.className = 'operations-control-list';
    circuitToggles.forEach((toggle) => {
        circuitList.appendChild(
            createToggleControl({
                id: toggle.id,
                label: toggle.label,
                defaultChecked: toggle.defaultChecked,
                description: toggle.description,
                tone: toggle.tone
            })
        );
    });
    circuitsBody.appendChild(circuitList);

    const teamBody = createPanel(container, {
        title: 'Reparaturteams',
        description: 'Einsatzaufträge vergeben und Status melden.'
    });

    const assignments = [
        {
            team: 'DC-1',
            status: 'Unterwegs',
            tone: 'warning',
            tasks: [
                { label: 'Sektion 3 • Plasmaleitung abdichten', value: 'plasma' },
                { label: 'Sektion 4 • Struktur stützen', value: 'structure' }
            ],
            selected: 'plasma',
            note: 'ETA 6 Minuten'
        },
        {
            team: 'DC-2',
            status: 'Vor Ort',
            tone: 'accent',
            tasks: [
                { label: 'Reaktorschott verstärken', value: 'reactor-door' },
                { label: 'Schotte Deck 3 prüfen', value: 'bulkhead' }
            ],
            selected: 'reactor-door',
            note: 'Benötigt Schweißtrupp'
        },
        {
            team: 'DC-3',
            status: 'Bereit',
            tone: 'success',
            tasks: [
                { label: 'Versorgungstrakt • Kabel neu verlegen', value: 'cabling' },
                { label: 'Logistikdepot • Ersatzteile holen', value: 'logistics' }
            ],
            selected: 'cabling',
            note: 'Freie Kapazität'
        }
    ];

    const table = document.createElement('table');
    table.className = 'operations-table';

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    ['Team', 'Status', 'Einsatz', 'Bemerkung'].forEach((header) => {
        const th = document.createElement('th');
        th.textContent = header;
        headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    assignments.forEach((assignment) => {
        const row = document.createElement('tr');

        const teamCell = document.createElement('td');
        teamCell.textContent = assignment.team;
        row.appendChild(teamCell);

        const statusCell = document.createElement('td');
        statusCell.appendChild(createStatusBadge({ label: assignment.status, tone: assignment.tone }));
        row.appendChild(statusCell);

        const taskCell = document.createElement('td');
        taskCell.appendChild(
            createSelect({
                id: `assignment-${assignment.team.toLowerCase()}`,
                options: assignment.tasks,
                value: assignment.selected
            })
        );
        row.appendChild(taskCell);

        const noteCell = document.createElement('td');
        noteCell.textContent = assignment.note;
        row.appendChild(noteCell);

        tbody.appendChild(row);
    });
    table.appendChild(tbody);
    teamBody.appendChild(table);
    teamBody.appendChild(createButtonRow([{ label: 'Einsatzplan senden' }, { label: 'Status an Brücke melden', tone: 'ghost' }]));

    const inventoryBody = createPanel(container, {
        title: 'Ersatzteile & Meldungen',
        description: 'Bestände prüfen und Beschaffungen anstoßen.'
    });

    const inventoryMetrics = document.createElement('div');
    inventoryMetrics.className = 'operations-metric-grid';
    [
        { label: 'Leitungsmodule', value: 54, status: 'warning', note: 'Restbestand 32 Stk.' },
        { label: 'Strukturplatten', value: 63, status: 'normal', note: 'Bestellung unterwegs' },
        { label: 'Versorgungsleitungen', value: 41, status: 'critical', note: 'Anforderung an Logistik' },
        { label: 'Notfall-Kits', value: 88, status: 'normal', note: 'Bereit für Einsatz' }
    ].forEach((item) => {
        inventoryMetrics.appendChild(
            createMetric({ label: item.label, value: item.value, unit: '%', status: item.status, note: item.note, min: 0, max: 100 })
        );
    });
    inventoryBody.appendChild(inventoryMetrics);

    inventoryBody.appendChild(createButtonRow([{ label: 'Nachschub anfordern' }, { label: 'Bestand aktualisieren', tone: 'ghost' }]));

    inventoryBody.appendChild(
        createLog([
            '05:15 - Nachschubticket #3482 erstellt',
            '05:05 - DC-1 meldet Ventil repariert',
            '04:52 - Lagerinventur abgeschlossen'
        ])
    );
}

export function renderOperationsForStation(station, container) {
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

    renderer(container, station);
}

export function hasOperationsRenderer(stationId) {
    return Boolean(OPERATIONS_RENDERERS[stationId]);
}
