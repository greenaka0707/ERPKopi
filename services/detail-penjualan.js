import { db } from "./supabase.js";

import { rupiah, formatDate } from "../utils/format.js";

// =========================
// INIT DETAIL PENJUALAN
// =========================
export async function initDetailPenjualan() {
  const id = localStorage.getItem("detail_penjualan_id");

  if (!id) return;

  // =========================
  // LOAD HEADER
  // =========================
  const { data: header, error: headerError } = await db
    .from("penjualan_header")
    .select(
      `
      *,
      customer:customer_id (
        nama
      )
    `,
    )
    .eq("id", id)
    .single();

  if (headerError) {
    console.log(headerError);

    return;
  }

  if (!header) return;

  // =========================
  // LOAD DETAIL
  // =========================
  const { data: items, error: detailError } = await db
    .from("penjualan_detail")
    .select(
      `
      *,
      produk:produk_id (
        nama_produk
      )
    `,
    )
    .eq("header_id", id);

  if (detailError) {
    console.log(detailError);
  }

  // =========================
  // RENDER HEADER
  // =========================
  document.getElementById("detail-no-ref").innerText = header.no_inv || "-";

  document.getElementById("detail-customer").innerText = header.customer?.nama || "-";

  // =========================
  // STATUS
  // =========================
  const rawStatus = header.status_pembayaran || "-";

  const statusLabel = rawStatus.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  document.getElementById("detail-status").innerHTML = `
    <span
      class="
        badge
        badge-${rawStatus.toLowerCase().replace(/\s+/g, "-")}
      "
    >
      ${statusLabel}
    </span>
  `;

  document.getElementById("detail-total").innerText = rupiah(header.total || 0);

  // =========================
  // RENDER ITEM
  // =========================
  const tbody = document.getElementById("detail-items");

  if (!tbody) return;

  // =========================
  // EMPTY
  // =========================
  if (!items || items.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td
          colspan="4"
          style="
            text-align:center;
            padding:30px;
            color:#94a3b8;
          "
        >
          Tidak ada item penjualan
        </td>
      </tr>
    `;

    return;
  }

  // =========================
  // RENDER TABLE
  // =========================
  tbody.innerHTML = items
    .map((item) => {
      return `
      <tr>

        <!-- PRODUK -->
        <td class="cell-product">
          ${item.produk?.nama_produk || item.nama_produk || "-"}
        </td>

        <!-- QTY -->
        <td class="cell-center">
          ${Number(item.qty || 0).toLocaleString("id-ID")}
        </td>

        <!-- HARGA -->
        <td class="cell-right">
          ${rupiah(item.harga || 0)}
        </td>

        <!-- SUBTOTAL -->
        <td class="cell-right">
          ${rupiah(item.subtotal || 0)}
        </td>

      </tr>
    `;
    })
    .join("");

  // =========================
  // ICON
  // =========================
  if (window.lucide) {
    lucide.createIcons();
  }
}

// =========================
// EDIT PENJUALAN
// =========================
window.editPenjualan = async function () {
  const id = localStorage.getItem("detail_penjualan_id");

  if (!id) return;

  localStorage.setItem("edit_penjualan_id", id);

  loadPage("penjualan");
};

// =========================
// HAPUS PENJUALAN
// =========================
window.hapusPenjualan = function () {
  alert("Hapus penjualan dinonaktifkan untuk menjaga konsistensi stok dan ledger");
};

// =========================
// LIHAT INVOICE
// =========================
window.lihatInvoice = function () {
  alert("Fitur invoice belum dibuat");
};

// =========================
// PEMBAYARAN
// =========================
window.inputPembayaran = function () {
  alert("Fitur pembayaran belum dibuat");
};
