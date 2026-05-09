import { db } from "./supabase.js";

import { state } from "../utils/state.js";

import { rupiah, formatDate } from "../utils/format.js";

// =========================
// INIT DATA PRODUKSI
// =========================
export async function initDataProduksi() {
  await loadHistoryProduksi();

  // =========================
  // REFRESH
  // =========================
  const btnRefresh = document.getElementById("btn-refresh-history");

  if (btnRefresh) {
    btnRefresh.addEventListener("click", loadHistoryProduksi);
  }

  // =========================
  // ICON
  // =========================
  if (window.lucide) {
    lucide.createIcons();
  }
}

// =========================
// DETAIL PRODUKSI
// =========================
export function detailProduksi(id) {
  localStorage.setItem("detail_produksi_id", id);

  loadPage("detail-produksi");
}

window.detailProduksi = detailProduksi;

// =========================
// LOAD HISTORY
// =========================
async function loadHistoryProduksi() {
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
        Memuat data produksi...
      </td>
    </tr>
  `;

  // =========================
  // QUERY
  // =========================
  const { data, error } = await db
    .from("produksi")
    .select(
      `
  id,
  no_prd,
  tanggal,

  qty_kirim,
  qty_hasil,
  target_hasil,
  sisa,

  biaya_produksi,
  biaya_jasa,

  status,

  produk:produk_bahan_id (
    nama_produk
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
          Gagal load data produksi
        </td>
      </tr>
    `;

    return;
  }

  // =========================
  // SAVE STATE
  // =========================
  state.historyProduksi = data || [];

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
            padding:40px;
            color:#94a3b8;
          "
        >
          Belum ada data produksi
        </td>
      </tr>
    `;

    return;
  }

  // =========================
  // RENDER
  // =========================
  tbody.innerHTML = data
    .map((item, index) => {
      // =========================
      // STATUS
      // =========================
      const rawStatus = (item.status || "PENDING").toUpperCase();

      const statusClass = rawStatus.toLowerCase().replace(/\s+/g, "-");

      const statusLabel = rawStatus.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

      return `
        <tr
          class="table-row-click"
          onclick="
            localStorage.setItem(
              'detail_produksi_id',
              '${item.id}'
            );

            loadPage(
              'detail-produksi'
            );
          "
        >

          <!-- NO -->
          <td
            style="
              text-align:center;
              font-weight:600;
            "
          >
            ${index + 1}
          </td>

          

          <!-- TANGGAL -->
          <td class="col-date">
            ${formatDate(item.tanggal)}
          </td>

          <!-- BAHAN -->
          <td class="col-product">

            ${item.produk?.nama_produk || "-"}

          </td>

          <!-- QTY KIRIM -->
          <td
            class="
              col-qty
              text-right
            "
          >
            ${Number(item.qty_kirim || 0).toLocaleString("id-ID")}
          </td>

          <!-- QTY HASIL -->
          <td
            class="
              col-qty
              text-right
            "
          >
            ${Number(item.qty_hasil || 0).toLocaleString("id-ID")}
          </td>

          <!-- SISA -->
          <td
            class="
              col-qty
              text-right
            "
          >
            ${Number(item.sisa || 0).toLocaleString("id-ID")}
          </td>

          <!-- BIAYA -->
          <td
            class="
              col-money
              text-right
            "
          >
            ${rupiah(item.biaya_produksi || item.biaya_jasa || 0)}
          </td>

          <!-- STATUS -->
          <td
            class="
              col-status
              text-center
            "
          >

            <span
              class="
                badge
                badge-${statusClass}
              "
            >
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
