import { STATION_DEFINITIONS } from './stations-data.js';
import { resolveStationPaths } from './station-utils.js';

function groupStationsByCategory() {
    const groups = new Map();
    const order = [];

    STATION_DEFINITIONS.forEach((station) => {
        if (!groups.has(station.category)) {
            groups.set(station.category, []);
            order.push(station.category);
        }
        groups.get(station.category).push(station);
    });

    order.forEach((category) => {
        groups.get(category).sort((a, b) => {
            if (a.code && b.code) {
                return a.code.localeCompare(b.code, 'de');
            }
            return a.name.localeCompare(b.name, 'de');
        });
    });

    return { groups, order };
}

function createStationCard(station) {
    const card = document.createElement('a');
    card.className = 'portal-card';
    const { route } = resolveStationPaths(station.htmlPath);
    card.href = route;

    const header = document.createElement('div');
    header.className = 'portal-card-header';

    const code = document.createElement('span');
    code.className = 'portal-card-code';
    code.textContent = station.code || '';
    header.appendChild(code);

    const locality = document.createElement('span');
    locality.className = 'portal-card-locality';
    locality.textContent = station.locality || '';
    header.appendChild(locality);

    const title = document.createElement('h3');
    title.textContent = station.name;

    const summary = document.createElement('p');
    summary.className = 'portal-card-summary';
    summary.textContent = station.summary || '';

    const taskList = document.createElement('ul');
    taskList.className = 'portal-card-tasks';
    const tasks = station.tasks ? station.tasks.slice(0, 2) : [];
    tasks.forEach((task) => {
        const li = document.createElement('li');
        li.textContent = task;
        taskList.appendChild(li);
    });
    if (!taskList.children.length) {
        const li = document.createElement('li');
        li.textContent = 'Keine Aufgaben definiert.';
        taskList.appendChild(li);
    }

    card.appendChild(header);
    card.appendChild(title);
    card.appendChild(summary);
    card.appendChild(taskList);

    return card;
}

function renderStationGroups() {
    const container = document.getElementById('station-groups');
    if (!container) {
        return;
    }

    const { groups, order } = groupStationsByCategory();
    const stationCountElement = document.getElementById('portal-station-count');
    const categoryCountElement = document.getElementById('portal-category-count');

    if (stationCountElement) {
        stationCountElement.textContent = STATION_DEFINITIONS.length.toString();
    }

    if (categoryCountElement) {
        categoryCountElement.textContent = order.length.toString();
    }

    order.forEach((category) => {
        const section = document.createElement('section');
        section.className = 'portal-group';

        const groupHeader = document.createElement('header');
        groupHeader.className = 'portal-group-header';

        const heading = document.createElement('h2');
        heading.textContent = category;

        const count = document.createElement('span');
        count.className = 'portal-group-count';
        count.textContent = `${groups.get(category).length} Stationen`;

        groupHeader.appendChild(heading);
        groupHeader.appendChild(count);

        const grid = document.createElement('div');
        grid.className = 'portal-card-grid';

        groups.get(category).forEach((station) => {
            grid.appendChild(createStationCard(station));
        });

        section.appendChild(groupHeader);
        section.appendChild(grid);
        container.appendChild(section);
    });
}

function renderResourceTable() {
    const tableBody = document.getElementById('resource-table-body');
    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = '';

    STATION_DEFINITIONS.forEach((station) => {
        const row = document.createElement('tr');

        const { route, file } = resolveStationPaths(station.htmlPath);

        const category = document.createElement('td');
        category.textContent = station.category;
        row.appendChild(category);

        const code = document.createElement('td');
        code.textContent = station.code || '';
        row.appendChild(code);

        const name = document.createElement('td');
        const link = document.createElement('a');
        link.href = route;
        link.textContent = station.name;
        link.className = 'station-link';
        name.appendChild(link);
        row.appendChild(name);

        const htmlCell = document.createElement('td');
        const htmlLink = document.createElement('a');
        htmlLink.href = file;
        htmlLink.textContent = file;
        htmlLink.className = 'station-link';
        htmlCell.appendChild(htmlLink);
        row.appendChild(htmlCell);

        const locality = document.createElement('td');
        locality.textContent = station.locality || '';
        row.appendChild(locality);

        tableBody.appendChild(row);
    });
}

function renderJsResources() {
    const list = document.getElementById('js-resource-list');
    if (!list) {
        return;
    }

    list.innerHTML = '';
    const uniqueModules = new Set([
        'assets/js/stations-data.js',
        'assets/js/station-page.js',
        'assets/js/station-utils.js',
        'assets/js/portal.js'
    ]);

    STATION_DEFINITIONS.forEach((station) => {
        (station.jsModules || []).forEach((module) => uniqueModules.add(module));
    });

    Array.from(uniqueModules)
        .sort((a, b) => a.localeCompare(b, 'de'))
        .forEach((module) => {
            const li = document.createElement('li');
            const link = document.createElement('a');
            link.href = `/${module}`;
            link.textContent = module;
            link.className = 'station-link';
            li.appendChild(link);
            list.appendChild(li);
        });
}

document.addEventListener('DOMContentLoaded', () => {
    renderStationGroups();
    renderResourceTable();
    renderJsResources();
});
