import { createLogEntry } from './utils.js';

export class Kernel {
    constructor(initialState = {}, options = {}) {
        this.state = structuredCloneSafe(initialState);
        this.options = {
            ticksPerSecond: 1,
            onLog: null,
            onError: null,
            ...options
        };
        this.modules = new Map();
        this.runningModules = new Set();
        this.listeners = new Map();
        this.moduleListeners = new Map();
        this.errorStates = new Map();
        this.tickHandle = null;
        this.tickCount = 0;
    }

    registerModule(id, definition = {}) {
        if (this.modules.has(id)) {
            throw new Error(`Module '${id}' bereits registriert.`);
        }

        const moduleData = {
            id,
            definition,
            status: 'registered',
            locals: {},
            context: null
        };

        moduleData.context = this.createModuleContext(moduleData);

        if (typeof definition.onInit === 'function') {
            try {
                definition.onInit(moduleData.context);
            } catch (error) {
                this.handleModuleError(moduleData, error, 'onInit');
            }
        }

        this.modules.set(id, moduleData);
        return moduleData;
    }

    startModule(id) {
        const moduleData = this.modules.get(id);
        if (!moduleData) {
            throw new Error(`Unbekanntes Modul '${id}'.`);
        }
        if (moduleData.status === 'running') {
            return moduleData;
        }

        this.clearModuleError(id);

        try {
            moduleData.definition.onStart?.(moduleData.context);
            moduleData.status = 'running';
            this.runningModules.add(id);
            this.log('log', `Modul '${id}' gestartet.`);
        } catch (error) {
            this.handleModuleError(moduleData, error, 'onStart');
        }

        return moduleData;
    }

    stopModule(id, reason = 'Angehalten durch Kernel') {
        const moduleData = this.modules.get(id);
        if (!moduleData || moduleData.status !== 'running') {
            return;
        }

        try {
            moduleData.definition.onStop?.(moduleData.context, reason);
        } catch (error) {
            this.handleModuleError(moduleData, error, 'onStop');
        }

        this.runningModules.delete(id);
        moduleData.status = 'stopped';
        this.removeModuleListeners(id);
        this.log('log', `Modul '${id}' gestoppt (${reason}).`);
    }

    boot() {
        if (this.tickHandle) {
            return;
        }
        const interval = Math.max(1, Math.round(1000 / this.options.ticksPerSecond));
        this.tickHandle = setInterval(() => this.tick(), interval);
        this.log('log', 'Kernel-Bootsequenz abgeschlossen.');
        this.emit('kernel:booted');
    }

    shutdown(reason = 'Kernel wird heruntergefahren') {
        if (this.tickHandle) {
            clearInterval(this.tickHandle);
            this.tickHandle = null;
        }
        Array.from(this.runningModules).forEach(id => this.stopModule(id, reason));
        this.log('log', reason);
        this.emit('kernel:shutdown', { reason });
    }

    tick() {
        this.tickCount += 1;
        this.emit('kernel:tick', { tick: this.tickCount });

        this.runningModules.forEach(id => {
            const moduleData = this.modules.get(id);
            if (!moduleData) {
                return;
            }
            try {
                moduleData.definition.onTick?.(moduleData.context, this.tickCount);
            } catch (error) {
                this.handleModuleError(moduleData, error, 'onTick');
            }
        });
    }

    emit(type, payload = {}, origin) {
        const listeners = this.listeners.get(type);
        if (!listeners) {
            return;
        }
        listeners.forEach(listener => {
            try {
                listener.handler({ type, payload, origin });
            } catch (error) {
                const moduleData = this.modules.get(listener.moduleId);
                if (moduleData) {
                    this.handleModuleError(moduleData, error, 'onEvent');
                } else {
                    this.log('error', `Fehler im globalen Listener für ${type}: ${error.message}`);
                    this.options.onError?.({ moduleId: null, type: 'listener', error });
                }
            }
        });
    }

    on(type, handler, moduleId = null) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, new Set());
        }
        const entry = { handler, moduleId };
        this.listeners.get(type).add(entry);
        if (moduleId) {
            if (!this.moduleListeners.has(moduleId)) {
                this.moduleListeners.set(moduleId, new Set());
            }
            this.moduleListeners.get(moduleId).add({ type, entry });
        }
        return () => {
            this.listeners.get(type)?.delete(entry);
            if (moduleId && this.moduleListeners.has(moduleId)) {
                const moduleEntries = this.moduleListeners.get(moduleId);
                moduleEntries.forEach(stored => {
                    if (stored.entry === entry) {
                        moduleEntries.delete(stored);
                    }
                });
                if (moduleEntries.size === 0) {
                    this.moduleListeners.delete(moduleId);
                }
            }
        };
    }

    setState(key, value) {
        const previous = this.state[key];
        this.state[key] = value;
        this.emit('state:changed', { key, value, previous });
        return this.state[key];
    }

    updateState(key, updater) {
        const previous = this.state[key];
        const next = typeof updater === 'function' ? updater(previous) : updater;
        return this.setState(key, next);
    }

    getState(key) {
        return key ? this.state[key] : this.state;
    }

    log(type, message, meta) {
        const entry = createLogEntry(type, message);
        if (!Array.isArray(this.state.logs)) {
            this.state.logs = [];
        }
        const enriched = { ...entry, meta };
        this.state.logs.push(enriched);
        this.options.onLog?.(enriched);
        return enriched;
    }

    flagError(moduleId, error, phase) {
        const errorState = {
            moduleId,
            phase,
            error,
            timestamp: new Date()
        };
        this.errorStates.set(moduleId, errorState);
        this.options.onError?.(errorState);
        return errorState;
    }

    clearModuleError(moduleId) {
        if (this.errorStates.has(moduleId)) {
            this.errorStates.delete(moduleId);
        }
    }

    createModuleContext(moduleData) {
        const context = {
            id: moduleData.id,
            kernel: this,
            state: this.state,
            locals: moduleData.locals,
            log: (message, meta) => this.log('log', `[${moduleData.id}] ${message}`, meta),
            error: (message, error) => {
                const err = error instanceof Error ? error : new Error(String(error));
                this.log('error', `[${moduleData.id}] ${message}: ${err.message}`);
                this.flagError(moduleData.id, err, 'custom');
            },
            emit: (type, payload) => this.emit(type, payload, moduleData.id),
            on: (type, handler) => this.on(type, handler, moduleData.id),
            setState: (key, value) => this.setState(key, value),
            updateState: (key, updater) => this.updateState(key, updater),
            getState: key => this.getState(key)
        };
        return context;
    }

    removeModuleListeners(moduleId) {
        const listeners = this.moduleListeners.get(moduleId);
        if (!listeners) {
            return;
        }
        listeners.forEach(({ type, entry }) => {
            this.listeners.get(type)?.delete(entry);
        });
        this.moduleListeners.delete(moduleId);
    }

    handleModuleError(moduleData, error, phase) {
        const err = error instanceof Error ? error : new Error(String(error));
        moduleData.status = 'error';
        this.runningModules.delete(moduleData.id);
        this.removeModuleListeners(moduleData.id);
        this.log('error', `Modul '${moduleData.id}' Fehler (${phase}): ${err.message}`);
        this.flagError(moduleData.id, err, phase);
    }
}

function structuredCloneSafe(value) {
    if (typeof structuredClone === 'function') {
        return structuredClone(value);
    }
    return deepClone(value);
}

function deepClone(value) {
    if (value === null || typeof value !== 'object') {
        return value;
    }
    if (Array.isArray(value)) {
        return value.map(item => deepClone(item));
    }
    if (value instanceof Date) {
        return new Date(value.getTime());
    }
    const clone = {};
    Object.keys(value).forEach(key => {
        clone[key] = deepClone(value[key]);
    });
    return clone;
}
