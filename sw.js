/* ====================================================
   SERVICE WORKER - cài app về máy + dùng được khi offline
   Đổi CACHE_NAME (v1 -> v2...) khi muốn xoá sạch cache cũ.
   ==================================================== */
const CACHE_NAME = 'tinhdiemhe4-v2';
const TIMEOUT_MS = 4500;

// File của mình: luôn tải sẵn để offline vẫn mở được
const SHELL = [
    './',
    'index.html',
    'style.css',
    'app.js',
    'manifest.json',
    'assets/logo.png',
    'assets/background.svg',
    'assets/girl_smile.png',
    'assets/girl_thumbsup.png'
];

// File ngoài (font, icon, thư viện QR): tải sẵn nếu được, lỗi cũng không sao
const CDN = [
    'https://fonts.googleapis.com/css2?family=Fredoka:wght@300..700&family=Paytone+One&family=Quicksand:wght@400;500;600;700&family=Tapestry&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) =>
            cache.addAll(SHELL).then(() =>
                Promise.all(CDN.map((url) =>
                    // dùng fetch + put (không dùng cache.add) vì file ngoài
                    // có thể trả về dạng opaque, cache.add sẽ từ chối
                    fetch(url).then((res) => cache.put(url, res)).catch(() => {})
                ))
            )
        ).then(() => self.skipWaiting())
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

function luuVaoCache(req, res) {
    const copy = res.clone();
    caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
    return res;
}

function quaHan(ms) {
    return new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms));
}

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET' || !req.url.startsWith('http')) return;

    const laCungNha = new URL(req.url).origin === self.location.origin;

    // File ngoài (font/icon/thư viện): lấy cache trước cho nhanh, nền tự cập nhật
    if (!laCungNha) {
        event.respondWith(
            caches.match(req).then((hit) => {
                const mang = fetch(req).then((res) => luuVaoCache(req, res));
                mang.catch(() => {});
                return hit || mang;
            })
        );
        return;
    }

    // File của mình: ưu tiên mạng (luôn thấy bản mới), mạng chậm/rớt thì lấy cache
    event.respondWith((function () {
        const mang = fetch(req).then((res) => luuVaoCache(req, res));
        mang.catch(() => {});

        return Promise.race([mang, quaHan(TIMEOUT_MS)])
            .catch(() => caches.match(req).then((hit) => hit || mang))
            .catch(() => caches.match('index.html'));
    })());
});
