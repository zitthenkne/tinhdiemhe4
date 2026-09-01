/* ====================================================
   SERVICE WORKER - cài app về máy + dùng được khi offline

   Nguyên tắc chia 2 loại cho khỏi lẫn lộn bản cũ/bản mới:
   - Code (html/css/js/manifest): LUÔN lấy từ mạng. Rớt mạng mới lấy cache.
     Không đặt timeout, vì timeout chính là thứ gây ra cảnh
     "lúc bản cũ lúc bản mới".
   - Ảnh + thư viện ngoài (font, icon, QR): lấy cache trước cho nhanh,
     nền tự tải bản mới. Mấy file này gần như không đổi.

   Sửa code xong nhớ đổi CACHE_NAME (v3 -> v4...) để máy user xoá cache cũ.
   ==================================================== */
const CACHE_NAME = 'tinhdiemhe4-v4';

// File của mình: luôn tải sẵn để offline vẫn mở được
const SHELL = [
    './',
    'index.html',
    'style.css',
    'app.js',
    'manifest.json',
    'assets/logo.webp',
    'assets/logo-192.png',
    'assets/background.webp',
    'assets/girl_smile.webp',
    'assets/girl_thumbsup.webp'
];

// File ngoài (font, icon, thư viện QR): tải sẵn nếu được, lỗi cũng không sao
const CDN = [
    'https://fonts.googleapis.com/css2?family=Fredoka:wght@300..700&family=Paytone+One&family=Quicksand:wght@400;500;600;700&family=Tapestry&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
];

const LA_ANH = /\.(png|jpe?g|svg|webp|gif|ico|woff2?)$/i;

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) =>
            // cache: 'reload' để lấy bản mới tinh từ server,
            // không xài lại bản cũ trong HTTP cache của trình duyệt
            cache.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' })))
                .then(() => Promise.all(CDN.map((url) =>
                    // dùng fetch + put (không dùng cache.add) vì file ngoài
                    // có thể trả về dạng opaque, cache.add sẽ từ chối
                    fetch(url).then((res) => cache.put(url, res)).catch(() => {})
                )))
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

// Lấy cache trước, đồng thời tải bản mới về để dành cho lần sau
function cacheTruoc(req) {
    return caches.match(req).then((hit) => {
        const mang = fetch(req).then((res) => luuVaoCache(req, res));
        mang.catch(() => {});
        return hit || mang;
    });
}

// Luôn hỏi mạng trước; mạng chết mới lấy cache ra dùng
function mangTruoc(req) {
    return fetch(req)
        .then((res) => luuVaoCache(req, res))
        .catch(() => caches.match(req).then((hit) =>
            hit || (req.mode === 'navigate' ? caches.match('index.html') : Promise.reject(new Error('offline')))
        ));
}

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET' || !req.url.startsWith('http')) return;

    const cungNha = new URL(req.url).origin === self.location.origin;

    if (!cungNha || LA_ANH.test(new URL(req.url).pathname)) {
        event.respondWith(cacheTruoc(req));
        return;
    }

    event.respondWith(mangTruoc(req));
});
