import { db } from "./supabase.js";

import { state } from "../utils/state.js";

import { rupiah } from "../utils/format.js";

// =========================
// INIT DATA PEMBELIAN
// =========================
export async function initDataPembelian() {
  await loadHistoryPembelian();

  // =========================
  // REFRESH
  // =========================
  const btnRefresh = document.getElementById("btn-refresh-history");

  if (btnRefresh) {
    btnRefresh.addEventListener("click", loadHistoryPembelian);
  }
}

// =========================
// LOAD HISTORY
// =========================
async function loadHistoryPembelian() {
  const tbody = document.getElementById("history-body");

  if (!tbody) return;

  const { data, error } = await db
    .from("pembelian_header")
    .select(
      `
      id,
      no_ref,
      tanggal,
      total,
      bayar,
      sisa,
      status_pembayaran,
      supplier:supplier_id (
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
            padding:30px;
            color:#ef4444;
          "
        >
          Gagal load data pembelian
        </td>
      </tr>
    `;

    return;
  }

  // =========================
  // EMPTY
  // =========================
  if (!data?.length) {
    tbody.innerHTML = `
      <tr>
        <td
          colspan="8"
          style="
            text-align:center;
            padding:30px;
            color:#94a3b8;
          "
        >
          Belum ada data pembelian
        </td>
      </tr>
    `;

    return;
  }

  // =========================
  // SAVE STATE
  // =========================
  state.historyPembelian = data || [];

  // =========================
  // RENDER
  // =========================
  tbody.innerHTML = data
    .map((item) => {
      const status = (item.status_pembayaran || "").toLowerCase();

      return `
        <tr>

          <!-- NO PO -->
          <td>
            <strong>
              ${item.no_ref || "-"}
            </strong>
          </td>

          <!-- TANGGAL -->
          <td>
            ${item.tanggal || "-"}
          </td>

          <!-- SUPPLIER -->
          <td>
            ${item.supplier?.nama || "-"}
          </td>

          <!-- TOTAL -->
          <td>
            ${rupiah(item.total || 0)}
          </td>

          <!-- DIBAYAR -->
          <td>
            ${rupiah(item.bayar || 0)}
          </td>

          <!-- SISA -->
          <td>
            ${rupiah(item.sisa || 0)}
          </td>

          <!-- STATUS -->
          <td>
            <span class="badge badge-${status}">
              ${item.status_pembayaran || "-"}
            </span>
          </td>

          <!-- AKSI -->
          <td>
            <button
              class="btn btn-secondary btn-sm"
              onclick="detailPembelian('${item.id}')"
            >
              Detail
            </button>
          </td>

        </tr>
      `;
    })
    .join("");
}

// =========================
// DETAIL
// =========================
window.detailPembelian = function (id) {
  const data = state.historyPembelian?.find((item) => item.id === id);

  if (!data) return;

  alert(`
No PO : ${data.no_ref || "-"}
Tanggal : ${data.tanggal || "-"}
Supplier : ${data.supplier?.nama || "-"}
Total : ${rupiah(data.total || 0)}
Dibayar : ${rupiah(data.bayar || 0)}
Sisa : ${rupiah(data.sisa || 0)}
Status : ${data.status_pembayaran || "-"}
  `);
};
