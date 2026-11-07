// Halaman Rename FP: PDF Faktur Pajak dibaca di perangkat (pdf.js), lalu diberi nama menurut pola.
import * as pdfjs from "../vendor/pdfjs/pdf.min.mjs";
import { susunBaris, uraiFaktur, namaBerkas, POLA_BAWAAN } from "./urai.js";
import { buatZip } from "./zip.js";

pdfjs.GlobalWorkerOptions.workerSrc = new URL("../vendor/pdfjs/pdf.worker.min.mjs", import.meta.url).href;

const $ = (s) => document.querySelector(s);
const simpanan = {
  ambil: (k, bawaan) => { try { return localStorage.getItem(k) ?? bawaan; } catch { return bawaan; } },
  taruh: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
};

// [{ asal, data: Uint8Array, info: { nomor, pembeli, referensi }, nama, diubah, url, galat }]
let daftar = [];
let pola = simpanan.ambil("pola", POLA_BAWAAN);

// ---------- Membaca PDF ----------
async function baca(file) {
  const data = new Uint8Array(await file.arrayBuffer());
  const x = { asal: file.name, data, info: null, nama: "", diubah: false, url: null, galat: "" };
  try {
    // pdf.js memindahkan buffer ke worker, jadi yang dikirim salinannya
    const doc = await pdfjs.getDocument({ data: data.slice(), verbosity: 0 }).promise;
    const halaman = [];
    for (let p = 1; p <= doc.numPages; p++) halaman.push((await (await doc.getPage(p)).getTextContent()).items);
    await doc.destroy();
    x.info = uraiFaktur(susunBaris(halaman));
    if (!x.info.nomor && !x.info.pembeli && !x.info.referensi) x.galat = "Bukan Faktur Pajak Coretax, atau teksnya tidak terbaca";
  } catch (e) {
    x.galat = `PDF tidak bisa dibaca (${e.message})`;
  }
  x.nama = x.info && !x.galat ? namaBerkas(x.info, pola) : x.asal.replace(/\.pdf$/i, "");
  return x;
}

async function tambah(files) {
  const pdf = [...files].filter((f) => /\.pdf$/i.test(f.name) || f.type === "application/pdf");
  if (!pdf.length) return;
  $("#hasil").hidden = false;
  $("#ringkas").textContent = `Membaca ${pdf.length} PDF…`;
  for (const f of pdf) {
    daftar.push(await baca(f));
    tampil();
  }
}

// ---------- Nama akhir: nama kembar diberi akhiran (2), (3) ----------
function namaAkhir() {
  const dipakai = new Map();
  return daftar.map((x) => {
    const dasar = x.nama.trim() || "faktur";
    const ke = (dipakai.get(dasar.toLowerCase()) ?? 0) + 1;
    dipakai.set(dasar.toLowerCase(), ke);
    return `${dasar}${ke > 1 ? ` (${ke})` : ""}.pdf`;
  });
}

// ---------- Tampilan ----------
function tampil() {
  const nama = namaAkhir();
  const kurang = daftar.filter((x) => !x.galat && (!x.info.nomor || !x.info.pembeli || !x.info.referensi)).length;
  const gagal = daftar.filter((x) => x.galat).length;
  $("#ringkas").textContent =
    `${daftar.length} PDF` + (gagal ? ` · ${gagal} tidak terbaca` : "") + (kurang ? ` · ${kurang} datanya kurang` : "");
  $("#hasil").hidden = !daftar.length;
  const ol = $("#daftar");
  ol.textContent = "";
  daftar.forEach((x, i) => {
    const li = document.createElement("li");
    const asal = Object.assign(document.createElement("div"), { className: "asal", textContent: x.asal });
    const baris = Object.assign(document.createElement("div"), { className: "baru" });
    const inp = Object.assign(document.createElement("input"), { type: "text", value: x.nama, spellcheck: false });
    inp.setAttribute("aria-label", `Nama baru untuk ${x.asal}`);
    inp.addEventListener("input", () => {
      x.nama = inp.value;
      x.diubah = true;
      perbaruiTautan();
    });
    inp.addEventListener("change", tampil); // akhiran nama kembar dihitung ulang
    const ext = Object.assign(document.createElement("span"), { className: "ext", textContent: ".pdf" });
    x.url ??= URL.createObjectURL(new Blob([x.data], { type: "application/pdf" }));
    const a = Object.assign(document.createElement("a"), { href: x.url, download: nama[i], textContent: "Unduh" });
    a.dataset.i = i;
    baris.append(inp, ext, a);
    const ket = document.createElement("div");
    if (x.galat) Object.assign(ket, { className: "ket gagal", textContent: x.galat });
    else {
      const hilang = [["referensi", "Referensi"], ["pembeli", "Nama Pembeli"], ["nomor", "Nomor FP"]].filter(([k]) => !x.info[k]).map(([, t]) => t);
      Object.assign(ket, hilang.length
        ? { className: "ket kurang", textContent: `Tidak ditemukan: ${hilang.join(", ")}` }
        : { className: "ket ok", textContent: "✓ Referensi, Nama Pembeli & Nomor FP terbaca" });
    }
    if (nama[i] !== `${x.nama.trim() || "faktur"}.pdf`) ket.textContent += ` · disimpan sebagai ${nama[i]} (nama kembar)`;
    li.append(asal, baris, ket);
    ol.append(li);
  });
  $("#bagikan").hidden = !bisaBagikan();
}
function perbaruiTautan() {
  const nama = namaAkhir();
  document.querySelectorAll("#daftar a[data-i]").forEach((a) => (a.download = nama[a.dataset.i]));
}

// ---------- Menyimpan ----------
const berkasAkhir = () => namaAkhir().map((nama, i) => new File([daftar[i].data], nama, { type: "application/pdf" }));
function bisaBagikan() {
  try {
    return !!navigator.canShare && daftar.length > 0 && navigator.canShare({ files: berkasAkhir().slice(0, 1) });
  } catch {
    return false;
  }
}
function unduh(blob, nama) {
  const url = URL.createObjectURL(blob);
  Object.assign(document.createElement("a"), { href: url, download: nama }).click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
$("#bagikan").onclick = async () => {
  try {
    await navigator.share({ files: berkasAkhir(), title: "Faktur Pajak" });
  } catch (e) {
    if (e.name !== "AbortError") alert(`Tidak bisa membagikan: ${e.message}. Gunakan "Unduh ZIP".`);
  }
};
$("#zip").onclick = () => {
  const nama = namaAkhir();
  const t = new Date();
  const p2 = (n) => String(n).padStart(2, "0");
  unduh(buatZip(daftar.map((x, i) => ({ nama: nama[i], data: x.data }))),
    `Faktur Pajak ${t.getFullYear()}-${p2(t.getMonth() + 1)}-${p2(t.getDate())} ${p2(t.getHours())}${p2(t.getMinutes())}.zip`);
};
$("#satu-satu").onclick = async () => {
  const btn = $("#satu-satu");
  btn.disabled = true;
  for (const f of berkasAkhir()) {
    unduh(f, f.name);
    await new Promise((r) => setTimeout(r, 400)); // beri jeda agar browser tidak menggabungkan/menolak unduhan
  }
  btn.disabled = false;
};
$("#bersihkan").onclick = () => {
  daftar.forEach((x) => x.url && URL.revokeObjectURL(x.url));
  daftar = [];
  $("#berkas").value = "";
  tampil();
};

// ---------- Pola nama ----------
function aturPola(baru) {
  pola = baru.trim() || POLA_BAWAAN;
  simpanan.taruh("pola", pola);
  $("#pola-teks").textContent = pola;
  for (const x of daftar) if (!x.diubah && x.info && !x.galat) x.nama = namaBerkas(x.info, pola);
  tampil();
}
$("#pola").value = pola;
$("#pola-teks").textContent = pola;
$("#pola").addEventListener("change", (e) => aturPola(e.target.value));
$("#pola-bawaan").onclick = () => {
  $("#pola").value = POLA_BAWAAN;
  aturPola(POLA_BAWAAN);
};

// ---------- Memilih berkas ----------
$("#berkas").addEventListener("change", (e) => tambah(e.target.files));
const pilih = $("#pilih");
pilih.addEventListener("dragover", (e) => { e.preventDefault(); pilih.classList.add("seret"); });
pilih.addEventListener("dragleave", () => pilih.classList.remove("seret"));
pilih.addEventListener("drop", (e) => {
  e.preventDefault();
  pilih.classList.remove("seret");
  tambah(e.dataTransfer.files);
});

// Bisa dipasang & dipakai tanpa internet setelah dibuka sekali
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
