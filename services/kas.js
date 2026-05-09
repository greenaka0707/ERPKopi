import { db } from "./supabase.js";

let DATA = [];

/* =========================
   INIT
========================= */
export async function initKas() {
  await loadData();

  initFilter();
}

/* =========================
   LOAD DATA
========================= */
async function loadData() {
  const tbody = document.getElementById("tbody");

  tbody.innerHTML = `
    <tr>
      <td colspan="6" class="text-center">
        Memuat data...
      </td>
    </tr>
  `;

  const { data, error } = await db.from("pembayaran").select("*").order("tanggal", {
    ascending: false,
  });

  if (error) {
    console.log(error);

    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center">
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
  const totalMasuk = data.filter((x) => x.arah === "MASUK").reduce((a, b) => a + Number(b.nominal || 0), 0);

  const totalKeluar = data.filter((x) => x.arah === "KELUAR").reduce((a, b) => a + Number(b.nominal || 0), 0);

  const saldoKas = totalMasuk - totalKeluar;

  document.getElementById("saldoKas").innerText = rupiah(saldoKas);

  document.getElementById("totalMasuk").innerText = rupiah(totalMasuk);

  document.getElementById("totalKeluar").innerText = rupiah(totalKeluar);
}

/* =========================
   TABLE
========================= */
function renderTable(data) {
  const tbody = document.getElementById("tbody");

  if (!data.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center">
          Tidak ada data kas
        </td>
      </tr>
    `;

    return;
  }

  tbody.innerHTML = data
    .map(
      (item) => `

    <tr>

      <td>
        ${formatDate(item.tanggal)}
      </td>

      <td>
        ${item.ref_type || "-"}
      </td>

      <td>

        <span class="
          badge
          ${item.arah === "MASUK" ? "badge-success" : "badge-danger"}
        ">
          ${item.arah || "-"}
        </span>

      </td>

      <td class="text-right">
        ${rupiah(item.nominal)}
      </td>

      <td>
        ${item.metode || "-"}
      </td>

      <td>
        ${item.keterangan || "-"}
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
  ["search", "filterArah", "filterMetode"].forEach((id) => {
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

  const arah = document.getElementById("filterArah").value;

  const metode = document.getElementById("filterMetode").value;

  let filtered = [...DATA];

  /* SEARCH */
  if (search) {
    filtered = filtered.filter((x) => (x.keterangan || "").toLowerCase().includes(search));
  }

  /* ARAH */
  if (arah) {
    filtered = filtered.filter((x) => x.arah === arah);
  }

  /* METODE */
  if (metode) {
    filtered = filtered.filter((x) => x.metode === metode);
  }

  render(filtered);
}

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
