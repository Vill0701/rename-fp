# Rename FP

Halaman web untuk mengganti nama PDF Faktur Pajak (FP Keluaran) yang diunduh dari Coretax menjadi:

```
Nomor Referensi - Nama Pembeli - Nomor FP.pdf
```

contoh: `SI.2026.11.00001 - TIGA WIJAYA SUKSES - 04002600454899474.pdf`

Dibuat terutama untuk tablet/HP Android, tempat ekstensi Chrome tidak bisa dipasang, tetapi jalan di browser apa saja.

## Cara pakai

1. Unduh PDF faktur dari Coretax seperti biasa.
2. Buka halaman Rename FP, ketuk **Pilih PDF Faktur Pajak**, lalu pilih semua PDF-nya (boleh banyak sekaligus).
3. Periksa daftar nama baru. Nama bisa diubah langsung bila perlu.
4. Simpan dengan salah satu cara:
   - **Bagikan / Simpan** (Android): kirim langsung ke WhatsApp, Drive, email, atau simpan ke Files dengan nama baru.
   - **Unduh ZIP**: semua PDF dalam satu ZIP.
   - **Unduh satu per satu**: tiap PDF diunduh terpisah dengan nama baru.

Data dibaca dari teks di dalam PDF:

| Bagian nama | Diambil dari |
|---|---|
| Nomor Referensi | `(Referensi: …)` di bawah tanda tangan |
| Nama Pembeli | `Nama :` di bagian *Pembeli Barang Kena Pajak/Penerima Jasa Kena Pajak* |
| Nomor FP | `Kode dan Nomor Seri Faktur Pajak` |

Bila salah satu tidak ada (misalnya faktur tanpa referensi), bagian itu dibuang beserta pemisahnya. Pola nama bisa diubah di **Pola nama** dengan `{referensi}`, `{pembeli}`, `{nomor}`.

## Privasi

Semua proses berjalan di browser. PDF tidak diunggah ke server mana pun. Setelah dibuka sekali, halaman bisa dipasang ("Tambahkan ke layar utama") dan dipakai tanpa internet.

## Menjalankan sendiri

Halaman memakai modul JavaScript, jadi harus dibuka lewat `http(s)://` (misalnya GitHub Pages), bukan dengan membuka `index.html` langsung dari berkas. Untuk mencoba di komputer:

```
npx serve .
```

## Uji

Taruh PDF faktur yang sudah bernama benar di folder `contoh/` (folder ini tidak ikut di-commit), lalu:

```
npm install
npm run uji
```

Uji membaca tiap PDF dan membandingkan nama hasil dengan nama berkasnya.

## Pihak ketiga

`vendor/pdfjs/` berisi [pdf.js](https://github.com/mozilla/pdf.js) 4.10.38 (Apache-2.0, lihat `vendor/pdfjs/LICENSE`).
