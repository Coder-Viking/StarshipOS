import { randBetween } from './utils.js';

const EMPTY_LIFE_SUPPORT = {
    cycles: [],
    sections: [],
    leaks: [],
    filters: { banks: [] }
};

export function normalizeLifeSupportData(raw) {
    if (!raw || typeof raw !== 'object') {
        return null;
    }
    const cycles = Array.isArray(raw.cycles)
        ? raw.cycles.map((cycle, index) => normalizeCycle(cycle, index)).filter(Boolean)
        : [];
    const sections = Array.isArray(raw.sections)
        ? raw.sections.map((section, index) => normalizeSection(section, index)).filter(Boolean)
        : [];
    const leaks = Array.isArray(raw.leaks)
        ? raw.leaks.map((leak, index) => normalizeLeak(leak, index)).filter(Boolean)
        : [];
    const filters = normalizeFilters(raw.filters);
    return { cycles, sections, leaks, filters };
}

export function createLifeSupportModule(options = {}) {
    const onUpdate = typeof options.onUpdate === 'function' ? options.onUpdate : null;

    return {
        onInit(context) {
            context.locals.unsubscribe = [];
            resetLocals(context.locals);
        },
        onStart(context) {
            const baseline = ensureLifeSupport(context.state.lifeSupport ?? options.lifeSupport);
            const runtime = cloneLifeSupport(baseline);
            applyBaselineToLocals(context.locals, baseline);
            context.setState('lifeSupport', cloneLifeSupport(runtime));
            updateSystemSensors(context, runtime);
            emitUpdate(context, runtime, 'startup');

            context.locals.unsubscribe = [
                context.on('systems:reinitialized', () => {
                    const nextBaseline = ensureLifeSupport(context.state.lifeSupport ?? options.lifeSupport);
                    const runtimeState = cloneLifeSupport(nextBaseline);
                    applyBaselineToLocals(context.locals, nextBaseline);
                    context.setState('lifeSupport', cloneLifeSupport(runtimeState));
                    updateSystemSensors(context, runtimeState);
                    emitUpdate(context, runtimeState, 'scenario');
                })
            ];
        },
        onTick(context) {
            if (context.state.simulationPaused) return;
            const current = ensureLifeSupport(context.state.lifeSupport ?? context.locals.baseline);
            if (!current) {
                return;
            }
            const next = stepLifeSupport(context, current);
            context.setState('lifeSupport', cloneLifeSupport(next));
            updateSystemSensors(context, next);
            emitUpdate(context, next, 'tick');
        },
        onStop(context) {
            context.locals.unsubscribe?.forEach(unsub => unsub());
            context.locals.unsubscribe = [];
        }
    };

    function emitUpdate(context, data, reason) {
        context.emit('life-support:updated', { lifeSupport: data, reason });
        if (onUpdate) {
            onUpdate(data, reason);
        }
    }
}

function ensureLifeSupport(raw) {
    const normalized = normalizeLifeSupportData(raw);
    if (!normalized) {
        return cloneLifeSupport(EMPTY_LIFE_SUPPORT);
    }
    const filters = normalized.filters ?? { banks: [] };
    return {
        cycles: normalized.cycles ?? [],
        sections: normalized.sections ?? [],
        leaks: normalized.leaks ?? [],
        filters: filters ?? { banks: [] }
    };
}

function stepLifeSupport(context, current) {
    const baseline = context.locals.baseline ?? cloneLifeSupport(current);
    const next = cloneLifeSupport(current);

    updateCycles(next, baseline, context);
    updateSections(next, baseline, context);
    updateLeaks(next, baseline, context);
    updateFilters(next, baseline, context);

    return next;
}

function updateCycles(next, baseline, context) {
    next.cycles = next.cycles.map(cycle => {
        const baseCycle = baseline.cycles.find(item => item.id === cycle.id) ?? cycle;
        const baselineNote = context.locals.baselineNotes.get(cycle.id) ?? cycle.note ?? '';
        const metrics = cycle.metrics.map(metric => {
            const baseMetric = baseCycle.metrics.find(entry => matchMetric(entry, metric)) ?? metric;
            const baselineValue = toNumber(baseMetric.value, toNumber(metric.value));
            const unit = metric.unit ?? baseMetric.unit ?? '';
            const bias = biasForMetric(cycle.id, metric);
            const bounds = boundsForMetric(unit, baselineValue);
            const nextValue = driftValue(metric.value, baselineValue, { unit, bias, min: bounds.min, max: bounds.max });
            return { ...metric, value: nextValue };
        });

        const updatedCycle = { ...cycle, metrics };
        applyCycleEvents(updatedCycle, baseCycle, context);
        const severity = determineCycleSeverity(updatedCycle);
        updateCycleStatusLogs(context, updatedCycle, severity);
        const note = severity.note ?? (severity.level === 'nominal' ? baselineNote : baselineNote);
        return {
            ...updatedCycle,
            status: labelForSeverity(severity.level, baseCycle.status),
            note
        };
    });
}

function updateSections(next, baseline, context) {
    next.sections = next.sections.map(section => {
        const baseSection = baseline.sections.find(item => item.id === section.id) ?? section;
        const pressure = driftValue(section.pressure?.value, baseSection.pressure?.value, {
            unit: section.pressure?.unit ?? baseSection.pressure?.unit ?? 'kPa',
            min: (baseSection.pressure?.value ?? 0) - 1,
            max: (baseSection.pressure?.value ?? 0) + 1
        });
        const temperature = driftValue(section.temperature?.value, baseSection.temperature?.value, {
            unit: section.temperature?.unit ?? baseSection.temperature?.unit ?? '°C',
            min: (baseSection.temperature?.value ?? 0) - 1.2,
            max: (baseSection.temperature?.value ?? 0) + 1.2
        });
        const humidityValue = section.humidity ? section.humidity.value : baseSection.humidity?.value;
        const humidity = typeof humidityValue === 'number'
            ? driftValue(humidityValue, baseSection.humidity?.value ?? humidityValue, {
                unit: section.humidity?.unit ?? '%',
                min: 25,
                max: 60
            })
            : null;

        const status = determineSectionStatus(section, baseSection, { pressure, temperature, humidity });
        updateSectionLogs(context, section, status);

        return {
            ...section,
            pressure: { value: pressure, unit: section.pressure?.unit ?? baseSection.pressure?.unit ?? 'kPa' },
            temperature: { value: temperature, unit: section.temperature?.unit ?? baseSection.temperature?.unit ?? '°C' },
            humidity: humidity !== null ? { value: humidity, unit: section.humidity?.unit ?? '%' } : section.humidity ?? null,
            status
        };
    });
}

function updateLeaks(next, baseline, context) {
    if (!next.leaks.length) {
        return;
    }
    let activeLeak = null;
    if (context.locals.activeLeakId) {
        activeLeak = next.leaks.find(leak => leak.id === context.locals.activeLeakId) ?? null;
    }
    if (!activeLeak) {
        activeLeak = next.leaks.find(leak => !isLeakSealed(leak));
        if (activeLeak) {
            context.locals.activeLeakId = activeLeak.id;
        }
    }

    if (activeLeak) {
        const progressDelta = 0.8 + Math.random() * 1.6;
        activeLeak.progress = clampNumber(activeLeak.progress + progressDelta, 0, 100);
        activeLeak.note = 'Abdichtung in Arbeit. Feldteams aktiv.';
        if (activeLeak.progress >= 100) {
            activeLeak.progress = 100;
            activeLeak.status = 'Versiegelt';
            activeLeak.note = 'Dichtungen gesetzt, Nachscan läuft.';
            context.log(`Lebenserhaltung: Mikroleck in ${activeLeak.location} versiegelt.`);
            context.locals.leakCooldown = randBetween(200, 360);
            context.locals.activeLeakId = null;
        }
    } else {
        if (context.locals.leakCooldown > 0) {
            context.locals.leakCooldown -= 1;
        } else if (next.leaks.length) {
            const target = next.leaks[next.leaks.length - 1];
            const baselineLeak = baseline.leaks.find(leak => leak.id === target.id);
            target.status = 'Analyse läuft';
            target.severity = 'Spur';
            target.progress = randBetween(8, 20);
            target.note = 'Sensorcluster meldet Druckabfall – Abdichtung eingeleitet.';
            context.log(`Lebenserhaltung: Mikroleck in ${target.location} entdeckt. Teams unterwegs.`);
            context.locals.activeLeakId = target.id;
            context.locals.leakCooldown = randBetween(240, 360);
            if (baselineLeak && baselineLeak.progress >= 100) {
                context.locals.baselineLeakNotes.set(target.id, baselineLeak.note ?? '');
            }
        }
    }
}

function updateFilters(next, baseline, context) {
    if (!next.filters) {
        next.filters = { banks: [] };
    }
    const baseFilters = baseline.filters ?? { banks: [] };
    const baselineStatuses = context.locals.baselineFilterStatus;

    next.filters.banks = (next.filters.banks ?? []).map(bank => {
        const baseBank = baseFilters.banks.find(entry => entry.id === bank.id) ?? bank;
        const saturationUnit = bank.saturation?.unit ?? baseBank.saturation?.unit ?? '%';
        const baselineSaturation = toNumber(baseBank.saturation?.value, toNumber(bank.saturation?.value));
        const updatedSaturation = driftValue(bank.saturation?.value, baselineSaturation + 4, {
            unit: saturationUnit,
            bias: 0.03,
            min: 0,
            max: 100
        });
        const result = {
            ...bank,
            saturation: { value: updatedSaturation, unit: saturationUnit }
        };

        const timeUnit = bank.timeBuffer?.unit ?? baseBank.timeBuffer?.unit ?? 'min';
        const baselineTime = toNumber(baseBank.timeBuffer?.value, toNumber(bank.timeBuffer?.value));
        const updatedTime = driftValue(bank.timeBuffer?.value, baselineTime, {
            unit: timeUnit,
            bias: -0.35,
            min: 0,
            max: Math.max(baselineTime + 120, baselineTime * 1.1),
            decimals: timeUnit.toLowerCase().includes('min') ? 0 : 1
        });
        result.timeBuffer = { value: updatedTime, unit: timeUnit };

        applyFilterWarnings(
            context,
            result,
            baselineStatuses.get(bank.id) ?? baseBank.status ?? 'Aktiv',
            baseBank
        );
        return result;
    });

    const buffers = next.filters;
    applyBufferMetrics(context, buffers, baseFilters);
}

function applyBufferMetrics(context, filters, baselineFilters) {
    if (typeof filters.reserveAirMinutes === 'number' || typeof baselineFilters.reserveAirMinutes === 'number') {
        const baseline = toNumber(baselineFilters.reserveAirMinutes, filters.reserveAirMinutes ?? 0);
        filters.reserveAirMinutes = driftValue(filters.reserveAirMinutes, baseline, {
            unit: 'min',
            bias: -0.3,
            min: 0,
            max: Math.max(baseline + 120, baseline * 1.15),
            decimals: 0
        });
        applyBufferWarning(context, 'reserve', filters.reserveAirMinutes, {
            threshold: 480,
            message: 'Lebenserhaltung: Luftreserve unter 8 Stunden. Nachspeisung prüfen.',
            resolve: 'Lebenserhaltung: Luftreserve stabilisiert sich wieder.'
        });
    }

    if (typeof filters.scrubberMarginMinutes === 'number' || typeof baselineFilters.scrubberMarginMinutes === 'number') {
        const baseline = toNumber(baselineFilters.scrubberMarginMinutes, filters.scrubberMarginMinutes ?? 0);
        filters.scrubberMarginMinutes = driftValue(filters.scrubberMarginMinutes, baseline, {
            unit: 'min',
            bias: -0.25,
            min: 0,
            max: Math.max(baseline + 90, baseline * 1.2),
            decimals: 0
        });
        applyBufferWarning(context, 'scrubber', filters.scrubberMarginMinutes, {
            threshold: 120,
            message: 'Lebenserhaltung: Scrubber-Puffer unter 2 Stunden. Regeneration einplanen.',
            resolve: 'Lebenserhaltung: Scrubber-Puffer wieder aufgefüllt.'
        });
    }

    if (typeof filters.emergencyBufferMinutes === 'number' || typeof baselineFilters.emergencyBufferMinutes === 'number') {
        const baseline = toNumber(baselineFilters.emergencyBufferMinutes, filters.emergencyBufferMinutes ?? 0);
        filters.emergencyBufferMinutes = driftValue(filters.emergencyBufferMinutes, baseline, {
            unit: 'min',
            bias: -0.18,
            min: 0,
            max: Math.max(baseline + 90, baseline * 1.2),
            decimals: 0
        });
        applyBufferWarning(context, 'emergency', filters.emergencyBufferMinutes, {
            threshold: 180,
            message: 'Lebenserhaltung: Notfall-O₂-Puffer fällt unter 3 Stunden. Reserve auffüllen.',
            resolve: 'Lebenserhaltung: Notfall-O₂-Puffer stabilisiert.'
        });
    }
}

function applyCycleEvents(cycle, baselineCycle, context) {
    if (cycle.id === 'co2-scrubber') {
        const saturationMetric = cycle.metrics.find(metric => isSaturationMetric(metric));
        if (saturationMetric) {
            const saturation = saturationMetric.value;
            if (saturation >= 90 && !context.locals.cycleEvents.has(cycle.id)) {
                context.log('Lebenserhaltung: CO₂-Sättigung über 90%. Automatische Regeneration läuft.');
                context.locals.cycleEvents.set(cycle.id, 'regenerating');
                const baseValue = baselineCycle.metrics.find(metric => isSaturationMetric(metric))?.value ?? saturation;
                saturationMetric.value = Math.max(baseValue + 8, saturation - 18);
            } else if (saturation < 72 && context.locals.cycleEvents.get(cycle.id) === 'regenerating') {
                context.log('Lebenserhaltung: CO₂-Scrubber wieder im Nominalbereich.');
                context.locals.cycleEvents.delete(cycle.id);
            }
        }
    }
}

function updateCycleStatusLogs(context, cycle, severity) {
    const previous = context.locals.cycleStatus.get(cycle.id) ?? 'nominal';
    if (severity.level !== previous) {
        context.locals.cycleStatus.set(cycle.id, severity.level);
        if (severity.level === 'warning') {
            context.log(`Lebenserhaltung: ${cycle.label} meldet erhöhte Werte (${severity.metricLabel}).`);
        } else if (severity.level === 'critical') {
            context.log(`Lebenserhaltung: Kritischer Zustand im Zyklus ${cycle.label}! (${severity.metricLabel})`);
        } else if (severity.level === 'nominal' && previous !== 'nominal') {
            context.log(`Lebenserhaltung: ${cycle.label} wieder im grünen Bereich.`);
        }
    }
}

function determineCycleSeverity(cycle) {
    let level = 'nominal';
    let note = null;
    let metricLabel = '';

    const efficiency = cycle.metrics.find(metric => isEfficiencyMetric(metric));
    if (efficiency) {
        metricLabel = efficiency.label;
        if (efficiency.value < 96) {
            level = 'critical';
            note = 'O₂-Regeneration unter Soll – Notzufuhr prüfen!';
        } else if (efficiency.value < 97.4) {
            level = 'warning';
            note = 'Effizienz fällt, automatische Kalibrierung läuft.';
        }
    }

    const saturation = cycle.metrics.find(metric => isSaturationMetric(metric));
    if (saturation) {
        metricLabel = saturation.label;
        if (saturation.value >= 90) {
            level = 'critical';
            note = 'Scrubber am Limit – Regeneration erforderlich!';
        } else if (saturation.value >= 75 && level !== 'critical') {
            level = 'warning';
            note = 'Sättigung steigt, Regenerationsfenster vorbereiten.';
        }
    }

    return { level, note, metricLabel };
}

function determineSectionStatus(section, baselineSection, values) {
    if (baselineSection.status && baselineSection.status !== 'Stabil') {
        return baselineSection.status;
    }
    const pressureBaseline = baselineSection.pressure?.value ?? values.pressure;
    const temperatureBaseline = baselineSection.temperature?.value ?? values.temperature;
    const humidityBaseline = baselineSection.humidity?.value ?? values.humidity;

    const pressureDelta = Math.abs(values.pressure - pressureBaseline);
    const temperatureDelta = Math.abs(values.temperature - temperatureBaseline);
    const humidityDelta = typeof values.humidity === 'number' && typeof humidityBaseline === 'number'
        ? Math.abs(values.humidity - humidityBaseline)
        : 0;

    if (pressureDelta > 0.8 || temperatureDelta > 1.4 || humidityDelta > 12) {
        return 'Warnung';
    }
    if (pressureDelta > 0.45 || temperatureDelta > 0.9 || humidityDelta > 8) {
        return 'Anpassung';
    }
    return 'Stabil';
}

function updateSectionLogs(context, section, status) {
    const key = section.id ?? section.name;
    const previous = context.locals.sectionAlerts.get(key) ?? 'Stabil';
    if (status !== previous) {
        context.locals.sectionAlerts.set(key, status);
        if (status === 'Warnung') {
            context.log(`Lebenserhaltung: Druck- oder Temperaturabweichung in ${section.name}. Regulatoren justieren.`);
        } else if (status === 'Anpassung' && previous === 'Warnung') {
            context.log(`Lebenserhaltung: ${section.name} kehrt in den Sollbereich zurück.`);
        } else if (status === 'Stabil' && previous !== 'Stabil') {
            context.log(`Lebenserhaltung: ${section.name} wieder stabil.`);
        }
    }
}

function applyFilterWarnings(context, bank, baselineStatus, baselineBank) {
    const saturation = bank.saturation?.value ?? 0;
    let severity = 'nominal';
    if (saturation >= 90) {
        severity = 'critical';
    } else if (saturation >= 75) {
        severity = 'warning';
    }

    const previous = context.locals.filterStatus.get(bank.id) ?? 'nominal';
    if (severity !== previous) {
        context.locals.filterStatus.set(bank.id, severity);
        if (severity === 'warning') {
            context.log(`Lebenserhaltung: Filterbank ${bank.label ?? bank.id} erreicht ${formatNumber(saturation, 1)}% Sättigung.`);
        } else if (severity === 'critical') {
            context.log(`Lebenserhaltung: Filterbank ${bank.label ?? bank.id} über ${formatNumber(saturation, 1)}% – Regeneration gestartet.`);
            const baselineValue = toNumber(baselineBank?.saturation?.value, saturation);
            const target = Math.min(saturation - 16, baselineValue + 6);
            bank.saturation.value = clampNumber(target, 0, 100);
        } else if (severity === 'nominal' && previous !== 'nominal') {
            context.log(`Lebenserhaltung: Filterbank ${bank.label ?? bank.id} wieder im Normalbereich.`);
        }
    }

    bank.status = severity === 'critical'
        ? 'Regeneration'
        : severity === 'warning'
            ? 'Überwachung'
            : baselineStatus ?? bank.status ?? 'Aktiv';
}

function applyBufferWarning(context, key, value, messages) {
    const previous = context.locals.reserveWarnings[key] ?? false;
    if (value <= messages.threshold && !previous) {
        context.locals.reserveWarnings[key] = true;
        context.log(messages.message);
    } else if (value > messages.threshold && previous) {
        context.locals.reserveWarnings[key] = false;
        context.log(messages.resolve);
    }
}

function updateSystemSensors(context, lifeSupport) {
    const sensors = buildSensors(lifeSupport);
    context.updateState('systems', systems => {
        if (!Array.isArray(systems)) {
            return systems;
        }
        let changed = false;
        const updated = systems.map(system => {
            if (system.id !== 'life-support') {
                return system;
            }
            const currentSensors = system.details?.sensors ?? [];
            if (!arraysEqual(currentSensors, sensors)) {
                const details = { ...system.details, sensors };
                changed = true;
                return { ...system, details };
            }
            return system;
        });
        return changed ? updated : systems;
    });
}

function buildSensors(lifeSupport) {
    const sensors = [];
    const o2Cycle = lifeSupport.cycles.find(cycle => cycle.id?.includes('o2') || cycle.metrics.some(isEfficiencyMetric));
    if (o2Cycle) {
        const metric = o2Cycle.metrics.find(isEfficiencyMetric);
        if (metric && typeof metric.value === 'number') {
            sensors.push(`O₂ Effizienz ${formatNumber(metric.value, 1)}${metric.unit || '%'}`);
        }
    }

    const co2Cycle = lifeSupport.cycles.find(cycle => cycle.id?.includes('co2') || cycle.metrics.some(isSaturationMetric));
    if (co2Cycle) {
        const metric = co2Cycle.metrics.find(isSaturationMetric);
        if (metric && typeof metric.value === 'number') {
            sensors.push(`CO₂ Sättigung ${formatNumber(metric.value, 1)}${metric.unit || '%'}`);
        }
    }

    if (Array.isArray(lifeSupport.sections) && lifeSupport.sections.length > 0) {
        const unstable = lifeSupport.sections.filter(section => section.status && section.status !== 'Stabil').length;
        sensors.push(`Sektionen ${lifeSupport.sections.length - unstable}/${lifeSupport.sections.length} stabil`);
    }

    if (lifeSupport.filters?.banks?.length) {
        const maxSaturation = lifeSupport.filters.banks.reduce((max, bank) => {
            const value = toNumber(bank.saturation?.value, 0);
            return value > max ? value : max;
        }, 0);
        sensors.push(`Filter max ${formatNumber(maxSaturation, 1)}%`);
    }

    if (typeof lifeSupport.filters?.reserveAirMinutes === 'number') {
        sensors.push(`Luftpuffer ${formatMinutesShort(lifeSupport.filters.reserveAirMinutes)}`);
    }

    return sensors;
}

function resetLocals(locals) {
    locals.baseline = cloneLifeSupport(EMPTY_LIFE_SUPPORT);
    locals.baselineNotes = new Map();
    locals.baselineFilterStatus = new Map();
    locals.baselineLeakNotes = new Map();
    locals.cycleStatus = new Map();
    locals.cycleEvents = new Map();
    locals.filterStatus = new Map();
    locals.sectionAlerts = new Map();
    locals.reserveWarnings = { reserve: false, scrubber: false, emergency: false };
    locals.leakCooldown = 0;
    locals.activeLeakId = null;
}

function applyBaselineToLocals(locals, baseline) {
    locals.baseline = cloneLifeSupport(baseline);
    locals.baselineNotes = new Map(baseline.cycles.map(cycle => [cycle.id, cycle.note ?? '']));
    locals.baselineFilterStatus = new Map((baseline.filters?.banks ?? []).map(bank => [bank.id, bank.status ?? 'Aktiv']));
    locals.baselineLeakNotes = new Map((baseline.leaks ?? []).map(leak => [leak.id, leak.note ?? '']));
    locals.cycleStatus = new Map();
    locals.cycleEvents = new Map();
    locals.filterStatus = new Map();
    locals.sectionAlerts = new Map();
    locals.reserveWarnings = { reserve: false, scrubber: false, emergency: false };
    locals.leakCooldown = 0;
    locals.activeLeakId = determineInitialLeak(baseline.leaks ?? []);
}

function determineInitialLeak(leaks) {
    const active = leaks.find(leak => !isLeakSealed(leak));
    return active ? active.id : null;
}

function normalizeCycle(cycle, index) {
    if (!cycle || typeof cycle !== 'object') {
        return null;
    }
    const id = String(cycle.id ?? `cycle-${index + 1}`);
    const label = String(cycle.label ?? `Zyklus ${index + 1}`);
    const status = cycle.status ? String(cycle.status) : 'Stabil';
    const metrics = Array.isArray(cycle.metrics)
        ? cycle.metrics.map((metric, metricIndex) => normalizeMetric(metric, metricIndex)).filter(Boolean)
        : [];
    const note = typeof cycle.note === 'string' ? cycle.note : '';
    return { id, label, status, metrics, note };
}

function normalizeMetric(metric, index) {
    if (!metric || typeof metric !== 'object') {
        return null;
    }
    const key = metric.key ? String(metric.key) : null;
    const label = metric.label ? String(metric.label) : `Metrik ${index + 1}`;
    const unit = metric.unit ? String(metric.unit) : '';
    const value = toNumber(metric.value, 0);
    return { key, label, unit, value };
}

function normalizeSection(section, index) {
    if (!section || typeof section !== 'object') {
        return null;
    }
    const id = String(section.id ?? `section-${index + 1}`);
    const name = String(section.name ?? `Sektion ${index + 1}`);
    const pressure = normalizeReading(section.pressure, section.pressureUnit ?? section.pressure?.unit, 'kPa');
    const temperature = normalizeReading(section.temperature, section.temperatureUnit ?? section.temperature?.unit, '°C');
    const humidity = section.humidity !== undefined && section.humidity !== null
        ? normalizeReading(section.humidity, section.humidityUnit ?? section.humidity?.unit, '%')
        : null;
    const status = section.status ? String(section.status) : 'Stabil';
    return { id, name, pressure, temperature, humidity, status };
}

function normalizeLeak(leak, index) {
    if (!leak || typeof leak !== 'object') {
        return null;
    }
    const id = String(leak.id ?? `leak-${index + 1}`);
    const location = String(leak.location ?? `Sektion ${index + 1}`);
    const severity = leak.severity ? String(leak.severity) : 'Unbekannt';
    const status = leak.status ? String(leak.status) : 'Analyse läuft';
    const progress = clampNumber(toNumber(leak.progress, 0), 0, 100);
    const note = typeof leak.note === 'string' ? leak.note : '';
    return { id, location, severity, status, progress, note };
}

function normalizeFilters(filters) {
    if (!filters || typeof filters !== 'object') {
        return { banks: [] };
    }
    const banks = Array.isArray(filters.banks)
        ? filters.banks.map((bank, index) => normalizeFilterBank(bank, index)).filter(Boolean)
        : [];
    const reserveAirMinutes = filters.reserveAirMinutes !== undefined ? toNumber(filters.reserveAirMinutes) : undefined;
    const scrubberMarginMinutes = filters.scrubberMarginMinutes !== undefined ? toNumber(filters.scrubberMarginMinutes) : undefined;
    const emergencyBufferMinutes = filters.emergencyBufferMinutes !== undefined ? toNumber(filters.emergencyBufferMinutes) : undefined;
    return { banks, reserveAirMinutes, scrubberMarginMinutes, emergencyBufferMinutes };
}

function normalizeFilterBank(bank, index) {
    if (!bank || typeof bank !== 'object') {
        return null;
    }
    const id = String(bank.id ?? `bank-${index + 1}`);
    const label = String(bank.label ?? `Filterbank ${index + 1}`);
    const status = bank.status ? String(bank.status) : 'Aktiv';
    const saturation = normalizeReading(bank.saturation, bank.saturationUnit ?? bank.saturation?.unit, '%');
    const timeBuffer = normalizeReading(bank.timeBuffer, bank.timeBufferUnit ?? bank.timeBuffer?.unit, 'min');
    return { id, label, status, saturation, timeBuffer };
}

function normalizeReading(value, unit, fallbackUnit) {
    if (value && typeof value === 'object' && 'value' in value) {
        return { value: toNumber(value.value, 0), unit: value.unit ? String(value.unit) : (unit ?? fallbackUnit ?? '') };
    }
    return {
        value: toNumber(value, 0),
        unit: unit ? String(unit) : fallbackUnit ?? ''
    };
}

function cloneLifeSupport(value) {
    if (value === null || value === undefined) {
        return null;
    }
    return JSON.parse(JSON.stringify(value));
}

function toNumber(value, fallback = 0) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? fallback : parsed;
}

function driftValue(value, baseline, { unit = '', bias = 0, min = -Infinity, max = Infinity, decimals } = {}) {
    const current = toNumber(value, baseline ?? 0);
    const target = typeof baseline === 'number' ? baseline : current;
    const correction = (target - current) * 0.06;
    const jitter = (Math.random() * 2 - 1) * driftScale(unit, target);
    const next = clampNumber(current + correction + jitter + bias, min, max);
    return roundValue(next, unit, decimals);
}

function driftScale(unit, baseline) {
    if (!unit) {
        return Math.max(Math.abs(baseline) * 0.01, 0.05);
    }
    const normalized = unit.toLowerCase();
    if (normalized.includes('%')) {
        return Math.max(0.15, Math.abs(baseline) * 0.004);
    }
    if (normalized.includes('kg')) {
        return Math.max(Math.abs(baseline) * 0.01, 0.05);
    }
    if (normalized.includes('kpa')) {
        return 0.08;
    }
    if (normalized.includes('°') || normalized.includes('c')) {
        return 0.07;
    }
    if (normalized.includes('min')) {
        return Math.max(Math.abs(baseline) * 0.005, 0.4);
    }
    return Math.max(Math.abs(baseline) * 0.01, 0.05);
}

function boundsForMetric(unit, baseline) {
    const normalized = (unit || '').toLowerCase();
    if (normalized.includes('%')) {
        return { min: 0, max: 100 };
    }
    if (normalized.includes('kg')) {
        return { min: 0, max: Math.max(baseline + 5, baseline * 1.2) };
    }
    if (normalized.includes('min')) {
        return { min: 0, max: Math.max(baseline + 40, baseline * 1.25) };
    }
    if (normalized.includes('kpa')) {
        return { min: Math.max(0, baseline - 1.2), max: baseline + 1.2 };
    }
    if (normalized.includes('°') || normalized.includes('c')) {
        return { min: baseline - 1.5, max: baseline + 1.5 };
    }
    return { min: baseline - Math.abs(baseline) * 0.2, max: baseline + Math.abs(baseline) * 0.2 };
}

function roundValue(value, unit, decimalsOverride) {
    const decimals = typeof decimalsOverride === 'number' ? decimalsOverride : decimalsForUnit(unit);
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}

function decimalsForUnit(unit) {
    const normalized = (unit || '').toLowerCase();
    if (normalized.includes('kg')) {
        return 2;
    }
    if (normalized.includes('%')) {
        return 1;
    }
    if (normalized.includes('kpa')) {
        return 1;
    }
    if (normalized.includes('°') || normalized.includes('c')) {
        return 1;
    }
    if (normalized.includes('min')) {
        return 0;
    }
    return 1;
}

function formatNumber(value, decimals = 1) {
    return toNumber(value, 0).toLocaleString('de-DE', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

function formatMinutesShort(minutes) {
    const total = Math.max(0, Math.round(minutes));
    const hours = Math.floor(total / 60);
    const mins = total % 60;
    if (hours <= 0) {
        return `${mins}m`;
    }
    return `${hours}h ${mins.toString().padStart(2, '0')}m`;
}

function clampNumber(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function matchMetric(a, b) {
    if (a.key && b.key) {
        return a.key === b.key;
    }
    if (a.label && b.label) {
        return a.label === b.label;
    }
    return false;
}

function biasForMetric(cycleId, metric) {
    if (cycleId?.includes('co2') && isSaturationMetric(metric)) {
        return 0.04;
    }
    return 0;
}

function isEfficiencyMetric(metric) {
    if (!metric) return false;
    const key = metric.key ? metric.key.toLowerCase() : '';
    const label = metric.label ? metric.label.toLowerCase() : '';
    return key.includes('effizienz') || key.includes('efficiency') || label.includes('effizienz');
}

function isSaturationMetric(metric) {
    if (!metric) return false;
    const key = metric.key ? metric.key.toLowerCase() : '';
    const label = metric.label ? metric.label.toLowerCase() : '';
    return key.includes('sättigung') || key.includes('saturation') || label.includes('sättigung');
}

function labelForSeverity(severity, baselineStatus = 'Stabil') {
    if (severity === 'critical') {
        return 'Alarm';
    }
    if (severity === 'warning') {
        return 'Warnung';
    }
    return baselineStatus ?? 'Stabil';
}

function arraysEqual(a, b) {
    if (a === b) return true;
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
}

function isLeakSealed(leak) {
    return leak.status?.toLowerCase().includes('versiegelt') && leak.progress >= 100;
}
