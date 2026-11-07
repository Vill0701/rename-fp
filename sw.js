// Cache semua berkas halaman agar Rename FP bisa dipakai tanpa internet setelah dibuka sekali.
// Ganti VERSI setiap kali ada berkas yang berubah, supaya cache lama dibuang.
const VERSI = "rename-fp-v2";
const BERKAS = [
  "./",
  "index.html",
  "css/gaya.css",
  "js/app.js",
  "js/urai.js",
  "js/zip.js",
  "vendor/pdfjs/pdf.min.mjs",
  "vendor/pdfjs/pdf.worker.min.mjs",
  "manifest.webmanifest",
  "ikon/192.png",
  "ikon/512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSI).then((c) => c.addAll(BERKAS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((k) => Promise.all(k.filter((n) => n !== VERSI).map((n) => caches.delete(n)))).then(() => self.clients.claim())
  );
});
// Jaringan dulu (agar pembaruan langsung terpakai), cache bila sedang offline
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((r) => {
        if (r.ok) {
          const salinan = r.clone();
          caches.open(VERSI).then((c) => c.put(e.request, salinan));
        }
        return r;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
