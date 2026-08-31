/* ====================================================
   SERVICE WORKER - cho phép cài app về điện thoại
   và mở lại được khi không có mạng.
   Đổi CACHE_NAME (v1 -> v2...) nếu muốn xoá sạch cache cũ.
   ==================================================== */
const CACHE_NAME = 'tinhdiemhe4-v1';

// Các file cần có sẵn để app chạy được lúc offline
const SHELL = [
    './',
    'index.html',
    'style.css',
    'app.js',
    'assets/logo.png',
    'assets/background.svg',
    'assets/girl_smile.png',
    'assets/girl_thumbsup.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(
                keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
            ))
            .then(() => self.clients.claim())
    );
});

// Ưu tiên mạng (để người dùng luôn thấy bản mới nhất),
// rớt mạng thì lấy trong cache ra dùng.
self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET' || !req.url.startsWith('http')) return;

    event.respondWith(
        fetch(req)
            .then((res) => {
                const copy = res.clone();
                caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
                return res;
            })
            .catch(() => caches.match(req).then((hit) => hit || caches.match('index.html')))
    );
});
