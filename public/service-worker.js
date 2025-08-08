const cacheName = 'mediametadataread-cache';
const filestoCache = [
    './',
    './index.html',
    './manifest.json',
    './logo_dark.png',
    './logo_dark.svg',
    './logo_light.png',
    './logo_light.svg',
    './assets/index.css',
    './assets/index.js',
    './assets/index2.js',
    './assets/work-sans-latin-400-normal.woff2',
    './assets/work-sans-vietnamese-400-normal.woff2',
    './assets/work-sans-latin-ext-400-normal.woff2',
    './assets/work-sans-latin-700-normal.woff2',
    './assets/work-sans-latin-ext-700-normal.woff',
    './assets/work-sans-vietnamese-700-normal.woff2',
    './assets/AbstractID3Parser.js',
    './assets/AiffParser.js',
    './assets/AsfParser.js',
    './assets/DsdiffParser.js',
    './assets/FlacParser.js',
    './assets/ID3v2Parser.js',
    './assets/MatroskaParser.js',
    './assets/MP4Parser.js',
    './assets/MpegParser.js',
    './assets/MusepackParser.js',
    './assets/OggParser.js',
    './assets/WaveParser.js',
    './assets/WavPackParser.js',
];
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(cacheName)
            .then(cache => cache.addAll(filestoCache))
    );
});
self.addEventListener('activate', e => self.clients.claim());
self.addEventListener('fetch', event => {
    const req = event.request;
    if (req.url.indexOf("updatecode") !== -1) event.respondWith(fetch(req)); else event.respondWith(networkFirst(req));
});


async function networkFirst(req) {
    try {
        const networkResponse = await fetch(req);
        const cache = await caches.open(cacheName);
        await cache.delete(req);
        await cache.put(req, networkResponse.clone());
        return networkResponse;
    } catch (error) {
        const cachedResponse = await caches.match(req);
        return cachedResponse;
    }
}