import { db } from "./supabase.js";

import { rupiah, formatDate } from "../utils/format.js";

// =========================
// CURRENT ID
// =========================
let CURRENT_ID = null;

let CURRENT_HEADER = null;

// =========================
// INIT
// =========================
// =========================
// INIT
// =========================
export async function initDetailProduksi() {
  try {
    CURRENT_ID = localStorage.getItem("detail_produksi_id");

    // VALIDASI ID
    if (!CURRENT_ID) {
      loadPage("data-produksi");
      return;
    }

    // LOAD MASTER
    await loadProdukHasil();

    // LOAD DETAIL
    await loadDetailProduksi();

    // =========================
    // BUTTON SIMPAN
    // =========================
    const btnSimpan = document.getElementById("btn-simpan-hasil");

    if (btnSimpan) {
      // RESET STATE
      btnSimpan.disabled = false;

      btnSimpan.innerHTML = `
        Simpan
      `;

      // HINDARI DOUBLE BIND
      btnSimpan.onclick = null;

      // CLICK
      btnSimpan.onclick = async () => {
        try {
          // LOADING
          btnSimpan.disabled = true;

          btnSimpan.innerHTML = `
            Menyimpan...
          `;

          // SIMPAN
          await simpanHasilProduksi();
        } catch (err) {
          console.log(err);

          alert(err.message || "Terjadi kesalahan");
        } finally {
          // RESET BUTTON
          btnSimpan.disabled = false;

          btnSimpan.innerHTML = `
            Simpan
          `;
        }
      };
    }

    // =========================
    // ICON
    // =========================
    if (window.lucide) {
      lucide.createIcons();
    }
  } catch (err) {
    console.log(err);

    alert(err.message || "Gagal load detail produksi");
  }
}

// =========================
// LOAD DETAIL
// =========================
async function loadDetailProduksi() {
  try {
    // =========================
    // HEADER
    // =========================
    const { data: header, error: headerError } = await db
      .from("produksi")
      .select(
        `
          *,
          produk:produk_bahan_id (
            nama_produk
          )
        `,
      )
      .eq("id", CURRENT_ID)
      .single();

    if (headerError) {
      console.log(headerError);

      return;
    }

    if (!header) return;

    CURRENT_HEADER = header;

    // =========================
    // HASIL
    // =========================
    const { data: hasil, error: hasilError } = await db
      .from("hasil_produksi")
      .select(
        `
          *,
          produk:produk_id (
            nama_produk
          )
        `,
      )
      .eq("produksi_id", CURRENT_ID)
      .order("created_at", {
        ascending: false,
      });

    if (hasilError) {
      console.log(hasilError);
    }
    // =========================
    // DATA DARI DATABASE
    // =========================
    const qtyKirim = Number(header.qty_kirim || 0);

    const qtyHasil = Number(header.qty_hasil || 0);

    const targetHasil = Number(header.target_hasil || qtyKirim);

    const sisa = Number(header.sisa || 0);

    const status = header.status || "Pending";

    // =========================
    // RENDER HEADER
    // =========================
    setText("detail-no-produksi", header.no_prd || "-");

    setText("detail-bahan", header.produk?.nama_produk || "-");

    setText("detail-kirim", qtyKirim.toLocaleString("id-ID"));

    setText("detail-hasil", qtyHasil.toLocaleString("id-ID"));

    setText("detail-target", targetHasil.toLocaleString("id-ID"));

    setText("detail-sisa", sisa.toLocaleString("id-ID"));

    // =========================
    // STATUS BADGE
    // =========================
    const elStatus = document.getElementById("detail-status");

    if (elStatus) {
      const statusClass = status.toLowerCase().replace(/\s+/g, "-");

      elStatus.innerHTML = `
        <span class="badge badge-${statusClass}">
          ${status}
        </span>
      `;
    }

    // =========================
    // PROGRESS
    // =========================
    const progress = targetHasil > 0 ? Math.min(Math.round((qtyHasil / targetHasil) * 100), 100) : 0;

    const progressFill = document.getElementById("progress-fill");

    const progressPercent = document.getElementById("progress-percent");

    const progressText = document.getElementById("progress-text");

    if (progressFill) {
      progressFill.style.width = `${progress}%`;
    }

    if (progressPercent) {
      progressPercent.innerText = `${progress}%`;
    }

    if (progressText) {
      progressText.innerText = `
       ${qtyHasil} / ${targetHasil}
      `;
    }

    // =========================
    // TABLE
    // =========================
    const tbody = document.getElementById("hasil-body");

    if (!tbody) return;

    if (!hasil || hasil.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center">
            Belum ada hasil produksi
          </td>
        </tr>
      `;

      return;
    }

    tbody.innerHTML = hasil
      .map((item) => {
        return `
          <tr>

            <td>
              ${formatDate(item.created_at)}
            </td>

            <td>
              ${item.produk?.nama_produk || "-"}
            </td>

            <td class="text-right">
              ${Number(item.qty || 0).toLocaleString("id-ID")}
            </td>

            <td>
              ${item.catatan || "-"}
            </td>

          </tr>
        `;
      })
      .join("");

    // ICON
    if (window.lucide) {
      lucide.createIcons();
    }
  } catch (err) {
    console.log(err);
  }
}

// =========================
// LOAD PRODUK
// =========================
async function loadProdukHasil() {
  const select = document.getElementById("produk-hasil");

  if (!select) return;

  const { data, error } = await db
    .from("produk")
    .select(
      `
      id,
      nama_produk
    `,
    )
    .order("nama_produk");

  if (error) {
    console.log(error);

    return;
  }

  select.innerHTML = `
    <option value="">
      Pilih Produk
    </option>
  `;

  (data || []).forEach((item) => {
    select.innerHTML += `
      <option value="${item.id}">
        ${item.nama_produk}
      </option>
    `;
  });
}

// =========================
// SIMPAN HASIL
// =========================
async function simpanHasilProduksi() {
  try {
    // =========================
    // FORM
    // =========================
    const produk_id = document.getElementById("produk-hasil")?.value;

    const qty = Number(document.getElementById("qty-hasil")?.value || 0);

    const catatan = document.getElementById("catatan-hasil")?.value || "";

    // =========================
    // VALIDASI BASIC
    // =========================
    if (!produk_id) {
      alert("Produk wajib dipilih");
      return;
    }

    if (qty <= 0) {
      alert("Qty tidak valid");
      return;
    }

    // =========================
    // INSERT ONLY
    // =========================
    const { error } = await db.from("hasil_produksi").insert([
      {
        produksi_id: CURRENT_ID,

        produk_id,

        qty,

        catatan,
      },
    ]);

    // =========================
    // ERROR
    // =========================
    if (error) {
      console.log(error);

      alert(error.message || "Gagal simpan hasil produksi");

      return;
    }

    // =========================
    // RELOAD
    // =========================
    await loadDetailProduksi();

    // =========================
    // RESET
    // =========================
    resetModal();

    closeModalHasil();

    // =========================
    // SUCCESS
    // =========================
    alert("Hasil produksi berhasil disimpan");
  } catch (err) {
    console.log(err);

    alert(err.message || "Terjadi kesalahan");
  }
}

// =========================
// RESET MODAL
// =========================
function resetModal() {
  const produk = document.getElementById("produk-hasil");

  const qty = document.getElementById("qty-hasil");

  const catatan = document.getElementById("catatan-hasil");

  if (produk) produk.value = "";

  if (qty) qty.value = "";

  if (catatan) catatan.value = "";
}

// =========================
// HELPERS
// =========================
function setText(id, value) {
  const el = document.getElementById(id);

  if (!el) return;

  el.innerText = value;
}

// =========================
// MODAL
// =========================
window.openModalHasil = function () {
  const modal = document.getElementById("modal-hasil-produksi");

  if (!modal) return;

  modal.style.display = "flex";
};

window.closeModalHasil = function () {
  const modal = document.getElementById("modal-hasil-produksi");

  if (!modal) return;

  modal.style.display = "none";
};

// =========================
// EDIT
// =========================
window.editProduksi = function () {
  localStorage.setItem("edit_produksi_id", CURRENT_ID);

  loadPage("produksi");
};

// =========================
// HAPUS
// =========================
window.hapusProduksi = async function () {
  const yes = confirm("Yakin ingin menghapus produksi ini?");

  if (!yes) return;

  try {
    // DELETE HASIL
    await db.from("hasil_produksi").delete().eq("produksi_id", CURRENT_ID);

    // DELETE PRODUKSI
    const { error } = await db.from("produksi").delete().eq("id", CURRENT_ID);

    if (error) {
      console.log(error);

      alert("Gagal hapus produksi");

      return;
    }

    alert("Produksi berhasil dihapus");

    loadPage("data-produksi");
  } catch (err) {
    console.log(err);

    alert("Terjadi kesalahan");
  }
};
