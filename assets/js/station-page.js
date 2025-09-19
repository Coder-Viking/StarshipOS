import { getStationById, getStationsByCategory } from './stations-data.js';
import { resolveStationPaths } from './station-utils.js';

function createListItems(container, items) {
    container.innerHTML = '';
    if (!items || !items.length) {
        const empty = document.createElement('li');
        empty.className = 'station-list-empty';
        empty.textContent = 'Keine Einträge verfügbar.';
        container.appendChild(empty);
        return;
    }

    items.forEach((entry) => {
        const li = document.createElement('li');
        li.textContent = entry;
        container.appendChild(li);
    });
}

function createRelatedStations(station) {
    const related = getStationsByCategory(station.category).filter((item) => item.id !== station.id);
    if (!related.length) {
        return [{ name: 'Keine weiteren Stationen in dieser Kategorie', htmlPath: null }];
    }
    return related.map((item) => ({ name: item.name, htmlPath: item.htmlPath }));
}

function renderStation(stationId) {
    const station = getStationById(stationId);
    const titleElement = document.getElementById('station-title');
    const breadcrumb = document.getElementById('station-breadcrumb');
    const code = document.getElementById('station-code');
    const summary = document.getElementById('station-summary');
    const tasks = document.getElementById('station-tasks');
    const controls = document.getElementById('station-controls');
    const dependencies = document.getElementById('station-dependencies');
    const locality = document.getElementById('station-locality');
    const htmlPath = document.getElementById('station-html');
    const jsModules = document.getElementById('station-js');
    const relatedList = document.getElementById('station-related');

    if (!station) {
        document.title = 'Station nicht gefunden | StarshipOS';
        if (titleElement) {
            titleElement.textContent = 'Station nicht gefunden';
        }
        if (summary) {
            summary.textContent = 'Für die angeforderte Station liegen keine Daten vor. Bitte prüfen Sie die URL.';
        }
        return;
    }

    document.title = `${station.name} | StarshipOS Station`;
    if (titleElement) {
        titleElement.textContent = station.name;
    }
    if (breadcrumb) {
        breadcrumb.textContent = `${station.category} • ${station.name}`;
    }
    if (code) {
        code.textContent = station.code || '';
    }
    if (summary) {
        summary.textContent = station.summary || 'Keine Beschreibung vorhanden.';
    }

    if (tasks) {
        createListItems(tasks, station.tasks);
    }

    if (controls) {
        createListItems(controls, station.controls);
    }

    if (dependencies) {
        createListItems(dependencies, station.dependencies);
    }

    if (locality) {
        locality.textContent = station.locality || 'Keine Angaben zum Betriebsmodus.';
    }

    if (htmlPath) {
        const { route, file } = resolveStationPaths(station.htmlPath);
        const link = document.createElement('a');
        link.href = route;
        link.textContent = file;
        link.className = 'station-link';
        htmlPath.innerHTML = '';
        htmlPath.appendChild(link);
    }

    if (jsModules) {
        jsModules.innerHTML = '';
        const modules = new Set(
            station.jsModules && station.jsModules.length ? station.jsModules : ['assets/js/station-page.js']
        );
        modules.add('assets/js/stations-data.js');
        modules.add('assets/js/station-utils.js');

        Array.from(modules)
            .sort((a, b) => a.localeCompare(b, 'de'))
            .forEach((mod, index, arr) => {
            const link = document.createElement('a');
            link.href = `/${mod}`;
            link.textContent = mod;
            link.className = 'station-link';
            jsModules.appendChild(link);
            if (index < arr.length - 1) {
                jsModules.appendChild(document.createElement('br'));
            }
        });
    }

    if (relatedList) {
        relatedList.innerHTML = '';
        const relatedStations = createRelatedStations(station);
        relatedStations.forEach((item) => {
            const li = document.createElement('li');
            if (item.htmlPath) {
                const link = document.createElement('a');
                const { route } = resolveStationPaths(item.htmlPath);
                link.href = route;
                link.textContent = item.name;
                link.className = 'station-link';
                li.appendChild(link);
            } else {
                li.textContent = item.name;
            }
            relatedList.appendChild(li);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const stationId = document.body?.dataset?.station;
    if (!stationId) {
        console.warn('Keine Stations-ID am Body gefunden.');
        return;
    }
    renderStation(stationId);
});
