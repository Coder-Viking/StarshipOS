export function resolveStationPaths(htmlPath = '') {
    const trimmed = (htmlPath || '').trim();
    if (!trimmed) {
        return {
            route: '/',
            file: '/index.html'
        };
    }

    let normalized = trimmed.replace(/^\/+/, '');

    if (normalized.toLowerCase().endsWith('index.html')) {
        normalized = normalized.slice(0, -'index.html'.length);
    }

    if (normalized && !normalized.endsWith('/')) {
        normalized += '/';
    }

    const route = `/${normalized}`;
    const file = `${route}index.html`;

    return { route, file };
}
