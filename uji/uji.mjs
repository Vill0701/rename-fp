// Uji pengurai terhadap PDF contoh: nama berkas contoh = nama yang diharapkan.
// Pakai: node uji/uji.mjs <folder PDF> (perlu pdfjs-dist terpasang: npm i pdfjs-dist@4.10.38)
import fs from "fs";
import path from "path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { susunBaris, uraiFaktur, namaBerkas } from "../js/urai.js";

const dir = process.argv[2];
let salah = 0;
for (const f of fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".pdf"))) {
  const doc = await getDocument({ data: new Uint8Array(fs.readFileSync(path.join(dir, f))), verbosity: 0 }).promise;
  const halaman = [];
  for (let p = 1; p <= doc.numPages; p++) halaman.push((await (await doc.getPage(p)).getTextContent()).items);
  const nama = namaBerkas(uraiFaktur(susunBaris(halaman))) + ".pdf";
  const ok = nama === f;
  if (!ok) salah++;
  console.log(`${ok ? "✔" : "✖"} ${nama}${ok ? "" : `\n   harapan: ${f}`}`);
}
const cek = (a, b) => { if (a !== b) { salah++; console.log(`✖ pola: ${JSON.stringify(a)} != ${JSON.stringify(b)}`); } };
cek(namaBerkas({ referensi: "", pembeli: "PT A/B", nomor: "0400" }), "PT A_B - 0400");
cek(namaBerkas({ referensi: "R1", pembeli: "", nomor: "0400" }), "R1 - 0400");
cek(namaBerkas({ referensi: "R1", pembeli: "X", nomor: "0400" }, "{nomor}_{pembeli}"), "0400_X");
console.log(salah ? `${salah} GAGAL` : "Semua cocok");
process.exit(salah ? 1 : 0);
