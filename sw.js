// === SERVICE WORKER — 11in1 RETRO SYSTEM ===
// キャッシュ優先戦略のため、ファイル更新時は必ずバージョンを上げること
const CACHE_NAME = '11in1-v2';

const ASSETS = [
    './',
    './index.html',
    './main.js',
    './sprites.js',
    './pc.js',
    './biotope.js',
    './horror.js',
    './guide.js',
    './tetri.js',
    './action.js',
    './online.js',
    './rhythm.js',
    './slot.js',
    './musou.js',
    './abyss.js',
    './noise.js',
    './chain.js',
    './dash.js',
    './king_angry.png',
    './king_disappointed.png',
    './king_laughing.png',
    './king_normal.png',
    './king_thinking.png'
];

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', e => {
    // GET 以外はキャッシュ不可 (cache.put が例外を投げる)
    if (e.request.method !== 'GET') return;
    // Google Fonts など cross-origin はネットワーク優先、失敗しても無視
    if (!e.request.url.startsWith(self.location.origin)) {
        e.respondWith(fetch(e.request).catch(() => new Response('')));
        return;
    }
    // ゲームアセット: キャッシュ優先
    e.respondWith(
        caches.match(e.request).then(cached => {
            if (cached) return cached;
            return fetch(e.request).then(res => {
                if (res.ok) {
                    // ボディ消費前に同期的に clone しておく (遅延 clone は例外になる)
                    const copy = res.clone();
                    caches.open(CACHE_NAME).then(c => c.put(e.request, copy)).catch(() => {});
                }
                return res;
            }).catch(() => new Response('', { status: 504, statusText: 'offline' }));
        })
    );
});
