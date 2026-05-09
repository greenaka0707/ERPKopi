import { db } from "./supabase.js";
import { state } from "../utils/state.js";

function rupiah(nominal) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(nominal);
}

// =========================
// LOAD JASA
// =========================
async function loadJasa() {
  const select = document.getElementById("jasa");

  const { data, error } = await db.from("jasa_produksi").select("*").eq("is_active", true).order("nama");

  if (error) {
    console.error(error);

    return;
  }

  state.jasa = data || [];

  select.innerHTML = `
    <option value="">
      Pilih Jasa
    </option>
  `;

  data.forEach((item) => {
    select.innerHTML += `
      <option value="${item.id}">
        ${item.nama}
      </option>
    `;
  });
}

// =========================
// LOAD PRODUK
// =========================
async function loadProduk() {
  const input = document.getElementById("produk-search");

  const hidden = document.getElementById("produk-bahan");

  const dropdown = document.getElementById("produk-dropdown");

  // =========================
  // GET DATA
  // =========================
  const { data, error } = await db.from("v_stok").select("*").order("nama_produk");

  if (error) {
    console.error(error);

    return;
  }

  state.produk = data || [];

  // =========================
  // DEFAULT RENDER
  // =========================
  renderDropdown(state.produk.slice(0, 3));

  // =========================
  // SEARCH
  // =========================
  input?.addEventListener("input", () => {
    const keyword = input.value.toLowerCase();

    const filtered = state.produk.filter((item) => {
      return item.nama_produk?.toLowerCase().includes(keyword) || item.kode_produk?.toLowerCase().includes(keyword);
    });

    renderDropdown(filtered);

    dropdown?.classList.add("show");
  });

  // =========================
  // FOCUS
  // =========================
  input?.addEventListener("focus", () => {
    renderDropdown(state.produk.slice(0, 3));

    dropdown?.classList.add("show");
  });

  // =========================
  // CLICK OUTSIDE
  // =========================
  document.addEventListener("click", (e) => {
    const wrapper = document.getElementById("produk-search-wrapper");

    if (!wrapper?.contains(e.target)) {
      dropdown?.classList.remove("show");
    }
  });

  // =========================
  // RENDER DROPDOWN
  // =========================
  function renderDropdown(items) {
    if (!dropdown) return;

    dropdown.innerHTML = "";

    if (!items.length) {
      dropdown.innerHTML = `
        <div class="search-item">
          <small>
            Produk tidak ditemukan
          </small>
        </div>
      `;

      return;
    }

    items.forEach((item) => {
      const div = document.createElement("div");

      div.className = "search-item";

      div.innerHTML = `
        <strong>
          ${item.nama_produk}
        </strong>

        <small>
          Stok:
          ${Number(item.stok || 0).toFixed(2)}

          •

          HPP:
          ${rupiah(item.hpp_avg || 0)}
        </small>
      `;

      // =========================
      // SELECT ITEM
      // =========================
      div.onclick = () => {
        hidden.value = item.id;

        input.value = item.nama_produk;

        dropdown.classList.remove("show");

        hitungProduksi();
      };

      dropdown.appendChild(div);
    });
  }
}

// =========================
// HITUNG ESTIMASI
// =========================
export function hitungProduksi() {
  const produk_id = document.getElementById("produk-bahan").value;

  const qtyKirim = Number(document.getElementById("qty-kirim").value || 0);

  const estimasiSusut = Number(document.getElementById("estimasi-susut").value || 0);

  const biayaJasa = Number(document.getElementById("biaya-jasa").value || 0);

  const produk = state.produk.find((item) => item.id == produk_id);

  if (!produk) {
    document.getElementById("hpp-bahan").innerText = rupiah(0);

    document.getElementById("nilai-bahan").innerText = rupiah(0);

    document.getElementById("estimasi-hasil").innerText = "0 Kg";

    document.getElementById("hpp-hasil").innerText = rupiah(0);

    return;
  }

  const hpp = Number(produk.hpp_avg || produk.hpp || 0);

  const nilaiBahan = qtyKirim * hpp;

  const estimasiHasil = qtyKirim - (qtyKirim * estimasiSusut) / 100;

  const totalProduksi = nilaiBahan + biayaJasa;

  const hppHasil = estimasiHasil > 0 ? totalProduksi / estimasiHasil : 0;

  document.getElementById("hpp-bahan").innerText = rupiah(hpp);

  document.getElementById("nilai-bahan").innerText = rupiah(nilaiBahan);

  document.getElementById("estimasi-hasil").innerText = `${estimasiHasil.toFixed(2)} Kg`;

  document.getElementById("hpp-hasil").innerText = rupiah(hppHasil);
}
async function loadProdukHasil() {
  const select = document.getElementById("produk-hasil");

  if (!select) return;

  const { data, error } = await db.from("produk").select("*").eq("is_active", true).order("nama_produk");

  if (error) {
    console.error(error);

    return;
  }

  select.innerHTML = `
    <option value="">
      Pilih Produk
    </option>
  `;

  data.forEach((item) => {
    select.innerHTML += `
      <option value="${item.id}">
        ${item.nama_produk}
      </option>
    `;
  });
}

// =========================
// SIMPAN PRODUKSI
// =========================
async function simpanProduksi() {
  try {
    // =========================
    // LOCK BUTTON
    // =========================
    const btn = document.getElementById("btn-simpan-produksi");

    if (btn) {
      btn.disabled = true;
      btn.innerText = "Menyimpan...";
    }

    // =========================
    // HEADER
    // =========================
    const tanggal = document.getElementById("tanggal").value;

    const no_prd = `PRD-${Date.now()}`;

    const jasa_id = document.getElementById("jasa").value;

    const produk_bahan_id = document.getElementById("produk-bahan").value;

    const qty_kirim = Number(document.getElementById("qty-kirim").value || 0);

    const estimasi_susut = Number(document.getElementById("estimasi-susut").value || 20);

    const biaya_jasa = Number(document.getElementById("biaya-jasa").value || 0);

    // =========================
    // STATUS
    // =========================
    const status_pembayaran = document.getElementById("status-pembayaran").value;

    const status = document.getElementById("status").value;

    const catatan = document.getElementById("catatan").value || "";

    // =========================
    // VALIDASI
    // =========================
    if (!tanggal || !jasa_id || !produk_bahan_id) {
      alert("Lengkapi data produksi");

      return;
    }

    if (qty_kirim <= 0) {
      alert("Qty kirim harus lebih dari 0");

      return;
    }

    // =========================
    // AMBIL PRODUK
    // =========================
    const produk = state.produk.find((item) => item.id == produk_bahan_id);

    if (!produk) {
      alert("Produk tidak ditemukan");

      return;
    }

    // =========================
    // VALIDASI STOK
    // =========================
    const stok = Number(produk.stok || 0);

    if (qty_kirim > stok) {
      alert(`Stok tidak cukup. Sisa stok: ${stok}`);

      return;
    }

    // =========================
    // HITUNG TARGET HASIL
    // =========================
    const target_hasil = Math.max(
      Math.round(qty_kirim - (qty_kirim * estimasi_susut) / 100),

      0,
    );

    // =========================
    // HPP BAHAN
    // =========================
    const hpp_bahan = Number(produk.hpp_avg || produk.hpp || 0);

    // =========================
    // HELPER FRONTEND
    // =========================
    const total_bahan = qty_kirim * hpp_bahan;

    const estimasi_hpp_hasil = target_hasil > 0 ? (total_bahan + biaya_jasa) / target_hasil : 0;

    console.log({
      qty_kirim,
      target_hasil,
      hpp_bahan,
      total_bahan,
      biaya_jasa,
      estimasi_hpp_hasil,
    });

    // =========================
    // INSERT PRODUKSI
    // =========================
    const { data: produksi, error: errProduksi } = await db
      .from("produksi")
      .insert({
        no_prd,

        tanggal,

        jasa_id,

        produk_bahan_id,

        qty_kirim,

        estimasi_susut,

        target_hasil,

        qty_hasil: 0,

        sisa: target_hasil,

        hpp_bahan,

        biaya_produksi: biaya_jasa,

        // =========================
        // PEMBAYARAN
        // =========================
        total: biaya_jasa,

        dibayar: status_pembayaran === "Lunas" ? biaya_jasa : 0,

        sisa_bayar: status_pembayaran === "Lunas" ? 0 : biaya_jasa,

        status_pembayaran,

        status,

        catatan,
      })
      .select()
      .single();

    // =========================
    // ERROR PRODUKSI
    // =========================
    if (errProduksi) {
      console.error(errProduksi);

      alert(errProduksi.message || "Gagal simpan produksi");

      return;
    }

    // =========================
    // RESET FORM
    // =========================
    document.getElementById("tanggal").value = "";

    document.getElementById("jasa").value = "";

    document.getElementById("produk-bahan").value = "";

    document.getElementById("qty-kirim").value = "";

    document.getElementById("estimasi-susut").value = 20;

    document.getElementById("biaya-jasa").value = 0;

    document.getElementById("status-pembayaran").value = "Belum Bayar";

    document.getElementById("status").value = "Pending";

    document.getElementById("catatan").value = "";

    // =========================
    // RESET SUMMARY
    // =========================
    if (typeof hitungProduksi === "function") {
      hitungProduksi();
    }

    // =========================
    // SUCCESS
    // =========================
    alert("Produksi berhasil disimpan");

    loadPage("data-produksi");
  } catch (err) {
    console.error(err);

    alert(err.message || "Terjadi error");
  } finally {
    // =========================
    // UNLOCK BUTTON
    // =========================
    const btn = document.getElementById("btn-simpan-produksi");

    if (btn) {
      btn.disabled = false;
      btn.innerText = "Kirim Produksi";
    }
  }
}

// =========================
// HISTORY
// =========================

export function openHasilProduksi(id) {
  window.selectedProduksiId = id;

  const modal = document.getElementById("modal-hasil-produksi");

  if (!modal) {
    alert("Modal hasil produksi tidak ditemukan");

    return;
  }

  modal.style.display = "flex";

  document.getElementById("produk-hasil").selectedIndex = 0;

  document.getElementById("qty-hasil").value = "";

  document.getElementById("catatan-hasil").value = "";

  document.getElementById("modal-hpp-hasil").innerText = rupiah(0);
}

function closeModalHasil() {
  const modal = document.getElementById("modal-hasil-produksi");

  if (!modal) return;

  modal.style.display = "none";
}

// =========================
// INIT
// =========================
export async function initProduksi() {
  try {
    // =========================
    // LOAD MASTER DATA
    // =========================
    await loadJasa();

    await loadProduk();

    await loadProdukHasil();

    // =========================
    // DEFAULT DATE
    // =========================
    const tanggalInput = document.getElementById("tanggal");

    if (tanggalInput && !tanggalInput.value) {
      tanggalInput.value = new Date().toISOString().split("T")[0];
    }

    // =========================
    // ELEMENTS
    // =========================
    const produkBahan = document.getElementById("produk-bahan");

    const qtyKirim = document.getElementById("qty-kirim");

    const estimasiSusut = document.getElementById("estimasi-susut");

    const biayaJasa = document.getElementById("biaya-jasa");

    const btnSimpanProduksi = document.getElementById("btn-simpan-produksi");

    const btnResetProduksi = document.getElementById("btn-reset-produksi");

    const qtyHasil = document.getElementById("qty-hasil");

    const btnSimpanHasil = document.getElementById("btn-simpan-hasil");

    // =========================
    // HITUNG PRODUKSI
    // =========================
    produkBahan?.addEventListener("change", hitungProduksi);

    qtyKirim?.addEventListener("input", hitungProduksi);

    estimasiSusut?.addEventListener("input", hitungProduksi);

    biayaJasa?.addEventListener("input", hitungProduksi);

    // =========================
    // SIMPAN PRODUKSI
    // =========================
    btnSimpanProduksi?.addEventListener("click", simpanProduksi);

    // =========================
    // RESET FORM
    // =========================
    btnResetProduksi?.addEventListener("click", () => {
      document.getElementById("jasa").value = "";

      document.getElementById("produk-bahan").value = "";

      document.getElementById("qty-kirim").value = "";

      document.getElementById("estimasi-susut").value = 20;

      document.getElementById("biaya-jasa").value = 0;

      document.getElementById("status").value = "Pending";

      document.getElementById("catatan").value = "";

      hitungProduksi();
    });

    // =========================
    // LIVE HPP HASIL
    // =========================
    qtyHasil?.addEventListener("input", () => {
      const produksi = state.historyProduksi?.find((item) => item.id == window.selectedProduksiId);

      if (!produksi) {
        document.getElementById("modal-hpp-hasil").innerText = rupiah(0);

        return;
      }

      // TOTAL BAHAN
      const totalBahan = Number(produksi.qty_kirim || 0) * Number(produksi.hpp_bahan || 0);

      // TOTAL MODAL
      const totalCost = totalBahan + Number(produksi.biaya_jasa || 0);

      // ESTIMASI HASIL BATCH
      const estimasiHasil = Number(produksi.qty_kirim || 0) - (Number(produksi.qty_kirim || 0) * Number(produksi.estimasi_susut || 0)) / 100;

      // HPP BATCH
      const hpp = estimasiHasil > 0 ? totalCost / estimasiHasil : 0;

      document.getElementById("modal-hpp-hasil").innerText = rupiah(hpp);
    });

    // =========================
    // INIT SUMMARY
    // =========================
    hitungProduksi();
  } catch (err) {
    console.error(err);

    alert("Gagal inisialisasi halaman produksi");
  }
}

// =========================
// GLOBAL WINDOW
// =========================
window.openHasilProduksi = openHasilProduksi;

window.closeModalHasil = closeModalHasil;
