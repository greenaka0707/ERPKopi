import { db } from "./supabase.js";

let DATA = [];

/* =========================
   INIT
========================= */
export async function initHutang() {
  await loadData();

  initFilter();
}

/* =========================
   LOAD DATA
========================= */
async function loadData() {
  const tbody = document.getElementById("tbody");

  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td
        colspan="8"
        class="text-center"
      >
        Memuat data...
      </td>
    </tr>
  `;

  const { data, error } = await db.from("v_hutang").select("*").order("tanggal", {
    ascending: false,
  });

  if (error) {
    console.log(error);

    tbody.innerHTML = `
      <tr>
        <td
          colspan="8"
          class="text-center"
        >
          Gagal memuat data
        </td>
      </tr>
    `;

    return;
  }

  DATA = data || [];

  render(DATA);
}

/* =========================
   RENDER
========================= */
function render(data) {
  renderSummary(data);

  renderTable(data);
}

/* =========================
   SUMMARY
========================= */
function renderSummary(data) {
  const normalize = (val = "") => val.toString().trim().toUpperCase();

  const totalHutang = data.reduce((a, b) => a + Number(b.sisa || 0), 0);

  const belumLunas = data.filter((x) => {
    const status = normalize(x.status_pembayaran);

    return status.includes("BELUM") || status.includes("BAYAR") || status.includes("DIGANTI");
  }).length;

  const cicil = data.filter((x) => normalize(x.status_pembayaran).includes("CICIL")).length;

  document.getElementById("totalHutang").innerText = rupiah(totalHutang);

  document.getElementById("belumLunas").innerText = belumLunas;

  document.getElementById("cicil").innerText = cicil;
}

/* =========================
   TABLE
========================= */
function renderTable(data) {
  const tbody = document.getElementById("tbody");

  if (!tbody) return;

  if (!data.length) {
    tbody.innerHTML = `
      <tr>
        <td
          colspan="8"
          class="text-center"
        >
          Tidak ada data hutang
        </td>
      </tr>
    `;

    return;
  }

  tbody.innerHTML = data
    .map(
      (item) => `

      <tr
        class="table-row-click"
        onclick="
          openDetailHutang(
            '${item.id}'
          )
        "
        style="cursor:pointer"
      >

        <td>
          ${formatDate(item.tanggal)}
        </td>

        <td>
          ${item.jenis || "-"}
        </td>

        <td>
          ${item.nama || "-"}
        </td>

        <td>
          ${item.no_ref || "-"}
        </td>

        <td class="text-right">
          ${rupiah(item.total)}
        </td>

        <td class="text-right">
          ${rupiah(item.bayar)}
        </td>

        <td class="text-right">
          ${rupiah(item.sisa)}
        </td>

        <td>

          <span class="
            badge
            ${getBadgeClass(item.status_pembayaran)}
          ">
            ${item.status_pembayaran}
          </span>

        </td>

      </tr>

    `,
    )
    .join("");
}

/* =========================
   FILTER
========================= */
function initFilter() {
  ["search", "filterJenis", "filterStatus"].forEach((id) => {
    const el = document.getElementById(id);

    if (!el) return;

    el.addEventListener("input", filterData);
  });
}

/* =========================
   FILTER DATA
========================= */
function filterData() {
  const search = document.getElementById("search").value.toLowerCase();

  const jenis = document.getElementById("filterJenis").value;

  const status = document.getElementById("filterStatus").value;

  let filtered = [...DATA];

  /* SEARCH */
  if (search) {
    filtered = filtered.filter((x) => (x.nama || "").toLowerCase().includes(search));
  }

  /* JENIS */
  if (jenis) {
    filtered = filtered.filter((x) => x.jenis === jenis);
  }

  /* STATUS */
  if (status) {
    filtered = filtered.filter((x) => x.status_pembayaran === status);
  }

  render(filtered);
}

/* =========================
   OPEN DETAIL
========================= */
window.openDetailHutang = function (id) {
  window.HUTANG_ID = id;

  loadPage("detail-hutang");
};

/* =========================
   HELPERS
========================= */
function rupiah(n = 0) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));
}

function formatDate(date) {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getBadgeClass(status) {
  switch (status) {
    case "LUNAS":
      return "badge-success";

    case "CICIL":
      return "badge-parsial";

    default:
      return "badge-danger";
  }
}
