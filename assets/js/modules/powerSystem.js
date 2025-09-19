import { clamp } from './utils.js';

const GROUP_LABELS = {
    engines: 'Antrieb',
    shields: 'Schilde',
    weapons: 'Waffen',
    aux: 'Hilfssysteme'
};

const GROUP_TEMPLATES = {
    engines: ['engines'],
    shields: ['shields'],
    weapons: ['weapons']
};

const SYSTEM_PRIORITY = {
    'life-support': { priority: 5, min: 0.75, boost: 1.1 },
    medical: { priority: 5, min: 0.65, boost: 1.15 },
    communications: { priority: 3, min: 0.45, boost: 1.15 },
    sensors: { priority: 4, min: 0.55, boost: 1.2 },
    science: { priority: 2, min: 0.3, boost: 1.15 },
    engines: { priority: 5, min: 0.55, boost: 1.4 },
    shields: { priority: 4, min: 0.5, boost: 1.35 },
    weapons: { priority: 3, min: 0.35, boost: 1.3 }
};

const DEFAULT_PRIORITY = { priority: 2, min: 0.3, boost: 1.2 };
const BROWNOUT_THRESHOLD = 0.7;
const CRITICAL_THRESHOLD = 0.4;
const OVERLOAD_THRESHOLD = 1.2;

export function createPowerSystemModule(options = {}) {
    const readDistribution = typeof options.readDistribution === 'function' ? options.readDistribution : null;
    const syncDistribution = typeof options.syncDistribution === 'function' ? options.syncDistribution : null;
    const onAutoBalance = typeof options.onAutoBalance === 'function' ? options.onAutoBalance : null;

    return {
        onInit(context) {
            context.locals.groups = {};
            context.locals.systemToGroup = new Map();
            context.locals.baseline = new Map();
            context.locals.groupTotals = {};
            context.locals.recommendedDistribution = {};
            context.locals.currentDistribution = {};
            context.locals.lastBrownouts = new Set();
            context.locals.lastOverloads = new Set();
            context.locals.unsubscribe = [];
        },
        onStart(context) {
            setupBaseline(context);
            const initialDistribution = readDistribution?.() ?? context.locals.recommendedDistribution;
            applyDistribution(context, initialDistribution, { source: 'startup', syncUi: true, force: true });

            context.locals.unsubscribe = [
                context.on('ui:power-adjusted', ({ payload }) => {
                    const distribution = payload?.distribution ?? readDistribution?.();
                    if (!distribution) return;
                    applyDistribution(context, distribution, { source: payload?.source ?? 'manual', syncUi: false });
                }),
                context.on('systems:reinitialized', () => {
                    setupBaseline(context);
                    const latest = readDistribution?.() ?? context.locals.recommendedDistribution;
                    applyDistribution(context, latest, { source: 'scenario', syncUi: true, force: true });
                }),
                context.on('power:request-balance', ({ payload }) => {
                    const distribution = computeAutoBalance(context);
                    if (onAutoBalance) onAutoBalance(payload?.source ?? 'auto');
                    applyDistribution(context, distribution, { source: 'auto', syncUi: true });
                })
            ];

            if (syncDistribution) {
                syncDistribution(context.locals.recommendedDistribution);
            }
        },
        onStop(context) {
            context.locals.unsubscribe?.forEach(unsub => unsub());
            context.locals.unsubscribe = [];
        }
    };

    function setupBaseline(context) {
        const { state, locals } = context;
        const groups = buildGroups(state.systems ?? []);
        locals.groups = groups;
        locals.systemToGroup = mapSystemsToGroups(groups);
        locals.baseline = captureBaseline(state.systems ?? []);
        locals.groupTotals = computeGroupTotals(groups, locals.baseline);
        locals.recommendedDistribution = computeRecommendedDistribution(groups, locals.baseline);
        locals.currentDistribution = { ...locals.recommendedDistribution };
    }

    function applyDistribution(context, distribution, { source = 'manual', syncUi = false, force = false } = {}) {
        const { state, locals } = context;
        if (!state.systems || state.systems.length === 0) {
            return;
        }

        const normalized = normalizeDistribution(distribution, locals.recommendedDistribution);
        if (!force && distributionsEqual(normalized, locals.currentDistribution)) {
            if (syncUi && syncDistribution) syncDistribution(normalized);
            return;
        }

        const allocationResult = allocatePower(context, normalized);
        const { allocations, brownouts, overloads } = allocationResult;
        const updatedSystems = state.systems.map(system => {
            if (!allocations.has(system.id)) {
                return system;
            }
            const assigned = allocations.get(system.id);
            const baselineData = locals.baseline.get(system.id) ?? { power: system.power, status: system.status };
            const basePower = baselineData.power || 0;
            const ratio = basePower > 0 ? assigned / basePower : assigned > 0 ? 2 : 1;
            const nextStatus = deriveStatus(baselineData.status ?? system.status, ratio);
            const nextPower = clamp(Math.round(assigned), 0, 100);
            if (nextPower === system.power && nextStatus === system.status) {
                return system;
            }
            return { ...system, power: nextPower, status: nextStatus };
        });

        const hasChanged = updatedSystems.some((system, index) => system !== state.systems[index]);
        if (hasChanged) {
            context.setState('systems', updatedSystems);
            context.emit('systems:power-updated', {
                distribution: normalized,
                brownouts: Array.from(brownouts),
                overloads: Array.from(overloads),
                source
            });
        }

        locals.currentDistribution = normalized;
        if (syncUi && syncDistribution) {
            syncDistribution(normalized);
        }
        emitDistributionApplied(context, source, normalized);
        logPowerChanges(context, brownouts, overloads);
    }

    function allocatePower(context, distribution) {
        const { locals } = context;
        const allocations = new Map();
        const brownouts = new Set();
        const overloads = new Set();

        Object.entries(locals.groups).forEach(([groupId, group]) => {
            if (!group.systems.length) return;
            const baselineTotal = locals.groupTotals[groupId] ?? 0;
            if (baselineTotal <= 0) {
                group.systems.forEach(id => allocations.set(id, 0));
                return;
            }

            const baseShare = locals.recommendedDistribution[groupId] ?? (100 / Object.keys(locals.groups).length);
            const targetShare = distribution[groupId] ?? 0;
            const ratio = baseShare > 0 ? targetShare / baseShare : 1;
            const available = baselineTotal * ratio;

            const allocation = distributeWithinGroup(group.systems, available, locals.baseline);
            allocation.allocations.forEach((value, systemId) => {
                allocations.set(systemId, value);
                const baselineData = locals.baseline.get(systemId);
                const basePower = baselineData?.power ?? 0;
                if (basePower <= 0) return;
                const supplyRatio = value / basePower;
                if (supplyRatio < BROWNOUT_THRESHOLD) {
                    brownouts.add(systemId);
                }
                if (supplyRatio < CRITICAL_THRESHOLD) {
                    brownouts.add(systemId);
                }
                if (supplyRatio > OVERLOAD_THRESHOLD) {
                    overloads.add(systemId);
                }
            });
        });

        return { allocations, brownouts, overloads };
    }

    function distributeWithinGroup(systemIds, availablePower, baseline) {
        const list = systemIds
            .filter(id => baseline.has(id))
            .map(id => ({
                id,
                baseline: baseline.get(id)?.power ?? 0,
                config: SYSTEM_PRIORITY[id] ?? DEFAULT_PRIORITY
            }))
            .sort((a, b) => {
                if (b.config.priority !== a.config.priority) {
                    return b.config.priority - a.config.priority;
                }
                return (b.baseline ?? 0) - (a.baseline ?? 0);
            });

        let remaining = availablePower;
        const allocations = new Map();

        // Pass 1: ensure minimum reserves for high priority systems
        list.forEach(entry => {
            const minPower = Math.min(entry.baseline, entry.baseline * entry.config.min);
            const assigned = Math.min(minPower, remaining);
            allocations.set(entry.id, assigned);
            remaining -= assigned;
        });

        // Pass 2: bring systems back to their nominal baseline
        list.forEach(entry => {
            if (remaining <= 0) return;
            const current = allocations.get(entry.id) ?? 0;
            const needed = Math.max(0, entry.baseline - current);
            if (needed <= 0) return;
            const assigned = Math.min(needed, remaining);
            allocations.set(entry.id, current + assigned);
            remaining -= assigned;
        });

        // Pass 3: distribute any surplus respecting boost caps
        list.forEach(entry => {
            if (remaining <= 0) return;
            const current = allocations.get(entry.id) ?? 0;
            const boostCap = Math.min(100, entry.baseline * entry.config.boost);
            const headroom = Math.max(0, boostCap - current);
            if (headroom <= 0) return;
            const assigned = Math.min(headroom, remaining);
            allocations.set(entry.id, current + assigned);
            remaining -= assigned;
        });

        // Normalize values to integers for display consistency
        const rounded = new Map();
        let totalRounded = 0;
        list.forEach((entry, index) => {
            const value = allocations.get(entry.id) ?? 0;
            const roundedValue = index === list.length - 1 ? Math.max(0, availablePower - totalRounded) : Math.round(value);
            rounded.set(entry.id, clamp(roundedValue, 0, 100));
            totalRounded += roundedValue;
        });

        return { allocations: rounded };
    }

    function computeAutoBalance(context) {
        const { locals, state } = context;
        const weights = { ...locals.recommendedDistribution };
        state.systems?.forEach(system => {
            const group = locals.systemToGroup.get(system.id);
            if (!group) return;
            if (system.status === 'critical') {
                weights[group] = (weights[group] ?? 0) + 6;
            } else if (system.status === 'warning') {
                weights[group] = (weights[group] ?? 0) + 3;
            }
        });
        return normalizeDistribution(weights, locals.recommendedDistribution);
    }

    function logPowerChanges(context, brownouts, overloads) {
        const { locals, state } = context;
        const startedBrownouts = difference(brownouts, locals.lastBrownouts);
        const resolvedBrownouts = difference(locals.lastBrownouts, brownouts);
        const newOverloads = difference(overloads, locals.lastOverloads);
        const resolvedOverloads = difference(locals.lastOverloads, overloads);

        if (startedBrownouts.size > 0) {
            context.log(`Lastabwurf aktiv: ${formatSystemNames(state.systems, startedBrownouts)} auf Notversorgung.`);
        }
        if (resolvedBrownouts.size > 0) {
            context.log(`Lastabwurf beendet: ${formatSystemNames(state.systems, resolvedBrownouts)} stabilisiert.`);
        }
        if (newOverloads.size > 0) {
            context.log(`Überlastmodus aktiv: ${formatSystemNames(state.systems, newOverloads)} im Leistungsboost.`);
        }
        if (resolvedOverloads.size > 0) {
            context.log(`Überlastmodus beendet: ${formatSystemNames(state.systems, resolvedOverloads)} zurück in Normallast.`);
        }

        locals.lastBrownouts = brownouts;
        locals.lastOverloads = overloads;
    }

    function emitDistributionApplied(context, source, distribution) {
        context.emit('power:distribution-applied', { source, distribution });
    }
}

function buildGroups(systems) {
    const groups = {};
    const assigned = new Set(['reactor']);

    Object.entries(GROUP_TEMPLATES).forEach(([groupId, ids]) => {
        const present = ids.filter(id => systems.some(system => system.id === id));
        groups[groupId] = {
            label: GROUP_LABELS[groupId],
            systems: present
        };
        present.forEach(id => assigned.add(id));
    });

    const auxSystems = systems
        .map(system => system.id)
        .filter(id => !assigned.has(id));

    groups.aux = {
        label: GROUP_LABELS.aux,
        systems: auxSystems
    };

    return groups;
}

function mapSystemsToGroups(groups) {
    const map = new Map();
    Object.entries(groups).forEach(([groupId, group]) => {
        group.systems.forEach(id => {
            map.set(id, groupId);
        });
    });
    return map;
}

function captureBaseline(systems) {
    const map = new Map();
    systems.forEach(system => {
        map.set(system.id, { power: clamp(Number(system.power) || 0, 0, 100), status: system.status ?? 'idle' });
    });
    return map;
}

function computeGroupTotals(groups, baseline) {
    const totals = {};
    Object.entries(groups).forEach(([groupId, group]) => {
        totals[groupId] = group.systems.reduce((sum, systemId) => {
            const base = baseline.get(systemId)?.power ?? 0;
            return sum + base;
        }, 0);
    });
    return totals;
}

function computeRecommendedDistribution(groups, baseline) {
    const totals = computeGroupTotals(groups, baseline);
    const sum = Object.values(totals).reduce((acc, value) => acc + value, 0);
    if (sum <= 0) {
        const groupCount = Object.keys(groups).length || 1;
        const fallback = Math.round(100 / groupCount);
        return Object.keys(groups).reduce((acc, key, index) => {
            const value = index === groupCount - 1 ? clamp(100 - fallback * (groupCount - 1), 0, 100) : fallback;
            acc[key] = value;
            return acc;
        }, {});
    }

    const distribution = {};
    let accumulated = 0;
    const entries = Object.entries(groups);
    entries.forEach(([groupId], index) => {
        if (index === entries.length - 1) {
            distribution[groupId] = clamp(100 - accumulated, 0, 100);
        } else {
            const percent = Math.round((totals[groupId] / sum) * 100);
            distribution[groupId] = percent;
            accumulated += percent;
        }
    });

    const diff = 100 - Object.values(distribution).reduce((acc, value) => acc + value, 0);
    if (diff !== 0) {
        const lastKey = entries[entries.length - 1][0];
        distribution[lastKey] = clamp(distribution[lastKey] + diff, 0, 100);
    }

    return distribution;
}

function normalizeDistribution(distribution, fallback = {}) {
    const normalized = {};
    let sum = 0;
    Object.keys(GROUP_LABELS).forEach(groupId => {
        const raw = distribution?.[groupId];
        const value = Number.isFinite(raw) ? Number(raw) : Number(fallback[groupId] ?? 0);
        const clamped = clamp(value, 0, 100);
        normalized[groupId] = clamped;
        sum += clamped;
    });

    if (sum <= 0) {
        return { ...fallback };
    }

    const scaled = {};
    let accumulated = 0;
    const entries = Object.entries(normalized);
    entries.forEach(([groupId, value], index) => {
        if (index === entries.length - 1) {
            const finalValue = clamp(100 - accumulated, 0, 100);
            scaled[groupId] = finalValue;
        } else {
            const percent = Math.round((value / sum) * 100);
            scaled[groupId] = percent;
            accumulated += percent;
        }
    });

    const diff = 100 - Object.values(scaled).reduce((acc, value) => acc + value, 0);
    if (diff !== 0) {
        const lastKey = entries[entries.length - 1][0];
        scaled[lastKey] = clamp((scaled[lastKey] ?? 0) + diff, 0, 100);
    }

    return scaled;
}

function deriveStatus(baselineStatus, ratio) {
    if (ratio <= CRITICAL_THRESHOLD) {
        return 'critical';
    }
    if (ratio < BROWNOUT_THRESHOLD) {
        return 'warning';
    }
    if (baselineStatus === 'idle' && ratio >= 0.75) {
        return 'idle';
    }
    if (baselineStatus === 'offline') {
        return ratio >= 0.75 ? 'warning' : 'offline';
    }
    if (ratio > OVERLOAD_THRESHOLD && baselineStatus !== 'offline') {
        return 'online';
    }
    return baselineStatus ?? 'online';
}

function distributionsEqual(a, b) {
    if (!a || !b) return false;
    return Object.keys(GROUP_LABELS).every(groupId => (a[groupId] ?? 0) === (b[groupId] ?? 0));
}

function difference(setA, setB) {
    const result = new Set();
    setA.forEach(value => {
        if (!setB.has(value)) {
            result.add(value);
        }
    });
    return result;
}

function formatSystemNames(systems, ids) {
    const map = new Map();
    systems?.forEach(system => {
        map.set(system.id, system.name ?? system.id);
    });
    const names = [];
    ids.forEach(id => {
        names.push(map.get(id) ?? id);
    });
    return names.join(', ');
}
