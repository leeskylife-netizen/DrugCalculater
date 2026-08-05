const CACHE_NAME = 'ncd-app-cache-v13'; // v13: รองรับหลายผังครอบครัว (case switcher)
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './family-tree.html',
  './family-tree.bundle.js',
  './family-tree.css',
  './fonts/sarabun.css',
  './fonts/sarabun-300-thai.woff2',
  './fonts/sarabun-300-latin.woff2',
  './fonts/sarabun-400-thai.woff2',
  './fonts/sarabun-400-latin.woff2',
  './fonts/sarabun-500-thai.woff2',
  './fonts/sarabun-500-latin.woff2',
  './fonts/sarabun-600-thai.woff2',
  './fonts/sarabun-600-latin.woff2',
  './fonts/sarabun-700-thai.woff2',
  './fonts/sarabun-700-latin.woff2',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting()) // บังคับให้เริ่มทำงานทันทีที่ติดตั้งเสร็จ
  );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim()) // ควบคุมเพจทั้งหมดทันที
  );
});

// ใช้กลยุทธ์ Network First (เช็คอินเทอร์เน็ตดึงข้อมูลล่าสุดก่อน หากออฟไลน์ค่อยดึงจากแคช)
// ป้องกันปัญหาแคชค้างในเบราว์เซอร์ของผู้ใช้งาน
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // หากดึงข้อมูลสำเร็จ ให้อัปเดตข้อมูลลงแคชด้วย
        if (networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // หากไม่มีอินเทอร์เน็ต ให้ดึงไฟล์จากแคชมาใช้แทน
        return caches.match(event.request);
      })
  );
});
