import { db } from "./supabase.js";

import { state } from "../utils/state.js";

import { rupiah } from "../utils/format.js";

// =========================
// INIT DATA PENJUALAN
// =========================
export async function initDataPenjualan() {
  await loadHistoryPenjualan();

  // =========================
  // REFRESH
  // =========================
  const btnRefresh = document.getElementById("btn-refresh-history");

  if (btnRefresh) {
    btnRefresh.addEventListener("click", loadHistoryPenjualan);
  }
}

// =========================
// LOAD HISTORY
// =========================
async function loadHistoryPenjualan() {
  const tbody = document.getElementById("history-body");

  if (!tbody) return;

  // =========================
  // LOADING
  // =========================
  tbody.innerHTML = `
    <tr>
      <td
        colspan="8"
        style="
          text-align:center;
          padding:40px;
          color:#94a3b8;
        "
      >
        Memuat data...
      </td>
    </tr>
  `;

  // =========================
  // QUERY
  // =========================
  const { data, error } = await db
    .from("penjualan_header")
    .select(
      `
      id,
      no_inv,
      tanggal,
      total,
      bayar,
      sisa,
      status_pembayaran,
      customer:customer_id (
        nama
      )
    `,
    )
    .order("created_at", {
      ascending: false,
    });

  // =========================
  // ERROR
  // =========================
  if (error) {
    console.error(error);

    tbody.innerHTML = `
      <tr>
        <td
          colspan="8"
          style="
            text-align:center;
            padding:40px;
            color:#ef4444;
          "
        >
          Gagal load data penjualan
        </td>
      </tr>
    `;

    return;
  }

  // =========================
  // EMPTY
  // =========================
  if (!data || data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td
          colspan="8"
          style="
            text-align:center;
            padding:40px;
            color:#94a3b8;
          "
        >
          Belum ada data penjualan
        </td>
      </tr>
    `;

    return;
  }

  // =========================
  // SAVE STATE
  // =========================
  state.historyPenjualan = data;

  // =========================
  // RENDER
  // =========================
  tbody.innerHTML = data
    .map((item) => {
      // =========================
      // STATUS
      // =========================
      const rawStatus = item.status_pembayaran || "-";

      const statusClass = rawStatus.toLowerCase().replace(/\s+/g, "-");

      const statusLabel = rawStatus.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

      return `
      <tr
        class="table-row-click"
        onclick="
          localStorage.setItem(
            'detail_penjualan_id',
            '${item.id}'
          );

          loadPage('detail-penjualan');
        "
      >

        <!-- INVOICE -->
        <td class="col-invoice">
          <strong class="invoice-text">
            ${item.no_inv || "-"}
          </strong>
        </td>

        <!-- TANGGAL -->
        <td class="col-date">
          ${formatDate(item.tanggal)}
        </td>

        <!-- CUSTOMER -->
        <td class="col-customer">
          ${item.customer?.nama || "-"}
        </td>

        <!-- TOTAL -->
        <td class="col-money text-right">
          ${rupiah(item.total || 0)}
        </td>

        <!-- DIBAYAR -->
        <td class="col-money text-right">
          ${rupiah(item.bayar || 0)}
        </td>

        <!-- SISA -->
        <td class="col-money text-right">
          ${rupiah(item.sisa || 0)}
        </td>

        <!-- STATUS -->
        <td class="col-status text-center">
          <span class="badge badge-${statusClass}">
            ${statusLabel}
          </span>
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
// HELPERS
// =========================
function formatDate(date) {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// =========================
// LIHAT INVOICE
// =========================
window.lihatInvoicePenjualan = async function () {
  const id = localStorage.getItem("detail_penjualan_id");

  if (!id) return;

  const { data, error } = await db
    .from("penjualan_header")
    .select(
      `
      *,
      customer:customer_id (
        nama,
        telp,
        alamat
      )
    `,
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    alert("Invoice tidak ditemukan");
    return;
  }

  alert(`
INVOICE PENJUALAN

No Invoice :
${data.no_inv || "-"}

Tanggal :
${formatDate(data.tanggal)}

Customer :
${data.customer?.nama || "-"}

Total :
${rupiah(data.total || 0)}

Dibayar :
${rupiah(data.bayar || 0)}

Sisa :
${rupiah(data.sisa || 0)}

Status :
${data.status_pembayaran || "-"}
  `);
};

// =========================
// LIHAT PEMBAYARAN
// =========================
window.lihatPembayaranPenjualan = async function () {
  const id = localStorage.getItem("detail_penjualan_id");

  if (!id) return;

  const { data, error } = await db.from("pembayaran_penjualan").select("*").eq("penjualan_id", id).order("created_at", {
    ascending: false,
  });

  if (error) {
    console.error(error);

    alert("Gagal load pembayaran");

    return;
  }

  if (!data || data.length === 0) {
    alert("Belum ada pembayaran");

    return;
  }

  const text = data
    .map(
      (item, i) => `
#${i + 1}

Tanggal :
${formatDate(item.tanggal)}

Nominal :
${rupiah(item.nominal || 0)}

Metode :
${item.metode || "-"}

Keterangan :
${item.keterangan || "-"}
`,
    )
    .join("\n----------------------\n");

  alert(text);
};

// =========================
// EDIT PENJUALAN
// =========================
window.editPenjualan = async function () {
  const id = localStorage.getItem("detail_penjualan_id");

  if (!id) return;

  // =========================
  // AMBIL HEADER
  // =========================
  const { data: header, error: headerError } = await db
    .from("penjualan_header")
    .select(
      `
      *,
      customer:customer_id (
        id,
        nama
      )
    `,
    )
    .eq("id", id)
    .single();

  if (headerError || !header) {
    console.error(headerError);

    alert("Data penjualan tidak ditemukan");

    return;
  }

  // =========================
  // AMBIL DETAIL
  // =========================
  const { data: detail, error: detailError } = await db.from("penjualan_detail").select("*").eq("header_id", id);

  if (detailError) {
    console.error(detailError);

    alert("Detail penjualan gagal dimuat");

    return;
  }

  // =========================
  // SIMPAN KE STATE EDIT
  // =========================
  state.editPenjualan = {
    id,
    header,
    detail: detail || [],
  };

  // =========================
  // PINDAH PAGE
  // =========================
  loadPage("penjualan");
};

// =========================
// HAPUS PENJUALAN
// =========================
window.hapusPenjualan = async function () {
  const id = localStorage.getItem("detail_penjualan_id");

  if (!id) return;

  const confirmDelete = confirm("Yakin ingin menghapus transaksi penjualan ini?");

  if (!confirmDelete) return;

  // =========================
  // DELETE DETAIL
  // =========================
  const { error: detailError } = await db.from("penjualan_detail").delete().eq("header_id", id);

  if (detailError) {
    console.error(detailError);

    alert("Gagal hapus detail");

    return;
  }

  // =========================
  // DELETE PEMBAYARAN
  // =========================
  await db.from("pembayaran_penjualan").delete().eq("penjualan_id", id);

  // =========================
  // DELETE HEADER
  // =========================
  const { error: headerError } = await db.from("penjualan_header").delete().eq("id", id);

  if (headerError) {
    console.error(headerError);

    alert("Gagal hapus penjualan");

    return;
  }

  alert("Penjualan berhasil dihapus");

  localStorage.removeItem("detail_penjualan_id");

  loadPage("data-penjualan");
};
