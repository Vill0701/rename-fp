// Penulis ZIP minimal (metode simpan, tanpa kompresi: PDF sudah terkompresi), tanpa library luar.
// berkas: [{ nama, data: Uint8Array }] -> Blob. Nama memakai UTF-8 (flag bit 11). Tanpa ZIP64 (maks. 65.535 berkas / 4 GB).
const TABEL = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
export function crc32(u8) {
  let c = 0xffffffff;
  for (let i = 0; i < u8.length; i++) c = TABEL[(c ^ u8[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export function buatZip(berkas) {
  const enc = new TextEncoder();
  const t = new Date();
  const waktu = (t.getHours() << 11) | (t.getMinutes() << 5) | (t.getSeconds() >> 1);
  const tanggal = ((t.getFullYear() - 1980) << 9) | ((t.getMonth() + 1) << 5) | t.getDate();
  const bagian = [];
  const pusat = [];
  let offset = 0;
  for (const { nama, data } of berkas) {
    const n = enc.encode(nama);
    const crc = crc32(data);
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true);
    h.setUint16(10, waktu, true); h.setUint16(12, tanggal, true);
    h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true);
    h.setUint16(26, n.length, true);
    bagian.push(new Uint8Array(h.buffer), n, data);
    const p = new DataView(new ArrayBuffer(46));
    p.setUint32(0, 0x02014b50, true); p.setUint16(4, 20, true); p.setUint16(6, 20, true); p.setUint16(8, 0x0800, true);
    p.setUint16(12, waktu, true); p.setUint16(14, tanggal, true);
    p.setUint32(16, crc, true); p.setUint32(20, data.length, true); p.setUint32(24, data.length, true);
    p.setUint16(28, n.length, true); p.setUint32(42, offset, true);
    pusat.push(new Uint8Array(p.buffer), n);
    offset += 30 + n.length + data.length;
  }
  const ukPusat = pusat.reduce((a, b) => a + b.length, 0);
  if (berkas.length > 0xffff || offset + ukPusat > 0xffffffff) throw new Error("ZIP terlalu besar");
  const e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, berkas.length, true); e.setUint16(10, berkas.length, true);
  e.setUint32(12, ukPusat, true); e.setUint32(16, offset, true);
  return new Blob([...bagian, ...pusat, new Uint8Array(e.buffer)], { type: "application/zip" });
}
