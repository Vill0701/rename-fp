// Pengurai teks Faktur Pajak (PDF dari Coretax) & penyusun nama berkas.
// Dipakai di browser (app.js) dan di uji Node (uji/uji.mjs), jadi tidak bergantung pada DOM.

// Item teks pdf.js ({ str, transform }) -> baris teks per halaman, urut dari atas ke bawah.
// Item dengan posisi y yang hampir sama (selisih <= 2) dianggap satu baris.
export function susunBaris(halaman) {
  const hasil = [];
  for (const items of halaman) {
    const baris = [];
    for (const it of items) {
      if (!it.str || !it.str.trim()) continue;
      const [x, y] = [it.transform[4], it.transform[5]];
      let b = baris.find((r) => Math.abs(r.y - y) <= 2);
      if (!b) baris.push((b = { y, isi: [] }));
      b.isi.push([x, it.str]);
    }
    baris.sort((a, b) => b.y - a.y);
    for (const b of baris) hasil.push(b.isi.sort((a, b) => a[0] - b[0]).map(([, s]) => s).join(" ").replace(/\s+/g, " ").trim());
  }
  return hasil;
}

// Baris teks -> { nomor, pembeli, referensi } (nilai yang tidak ditemukan = "")
export function uraiFaktur(baris) {
  const teks = baris.join("\n");
  const nomor = /Kode dan Nomor Seri Faktur Pajak\s*:\s*([0-9.\-\s]{13,25})/.exec(teks)?.[1].replace(/\D/g, "") ?? "";
  // Nama pembeli: baris "Nama :" pertama setelah judul bagian Pembeli; nama panjang bisa terpotong ke baris
  // berikutnya, jadi baris lanjutan digabung sampai baris "Alamat".
  let pembeli = "";
  const iPembeli = baris.findIndex((b) => /^Pembeli Barang Kena Pajak/i.test(b));
  if (iPembeli >= 0) {
    const iNama = baris.findIndex((b, i) => i > iPembeli && /^Nama\s*:/i.test(b));
    if (iNama >= 0) {
      const bagian = [baris[iNama].replace(/^Nama\s*:\s*/i, "")];
      for (let i = iNama + 1; i < baris.length && i <= iNama + 3 && !/^(Alamat|NPWP|NIK)\s*:/i.test(baris[i]); i++) bagian.push(baris[i]);
      pembeli = bagian.join(" ").replace(/\s+/g, " ").trim();
    }
  }
  const referensi = /\(\s*Referensi\s*:\s*([^)\n]*?)\s*\)/i.exec(teks)?.[1].trim() ?? "";
  return { nomor, pembeli, referensi };
}

// Karakter yang dilarang di nama berkas (Windows/Android) diganti; spasi dirapatkan; titik/spasi di ujung dibuang
export const amanNama = (s, maks = 120) =>
  String(s ?? "")
    .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maks)
    .replace(/^[. ]+|[. ]+$/g, "");

// Pola nama: {referensi}, {pembeli}, {nomor}. Bagian yang kosong ikut dibuang bersama pemisahnya.
export const POLA_BAWAAN = "{referensi} - {pembeli} - {nomor}";
export function namaBerkas(data, pola = POLA_BAWAAN) {
  // [pemisah sebelum token, nilai token]; token kosong dibuang bersama pemisahnya
  const bagian = pola.split(/\{(referensi|pembeli|nomor)\}/);
  const isi = [];
  for (let i = 1; i < bagian.length; i += 2) isi.push([bagian[i - 1], amanNama(data[bagian[i]])]);
  const ada = isi.filter(([, v]) => v);
  const hasil = ada.map(([p, v], i) => (i ? p : "") + v).join("") + (ada.length ? bagian.at(-1) : "");
  return amanNama(hasil, 200) || "faktur";
}
