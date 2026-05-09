import { db } from "./supabase.js";

let DATA = [];

/* =========================
   INIT
========================= */
export async function initDataPembayaran() {
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
      <td colspan="7" class="text-center">
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
        <td colspan="7" class="text-center">
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
  const masuk = data.filter((x) => x.arah === "MASUK").reduce((a, b) => a + Number(b.nominal || 0), 0);

  const keluar = data.filter((x) => x.arah === "KELUAR").reduce((a, b) => a + Number(b.nominal || 0), 0);

  document.getElementById("totalMasuk").innerText = rupiah(masuk);

  document.getElementById("totalKeluar").innerText = rupiah(keluar);

  document.getElementById("saldo").innerText = rupiah(masuk - keluar);
}

/* =========================
   TABLE
========================= */
function renderTable(data) {
  const tbody = document.getElementById("tbody");

  if (!data.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center">
          Belum ada data pembayaran
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
          ${item.arah === "MASUK" ? "success" : "danger"}
        ">
          ${item.arah || "-"}
        </span>

      </td>

      <td>
        ${rupiah(item.nominal)}
      </td>

      <td>
        ${item.metode || "-"}
      </td>

      <td>
        ${item.kategori || "-"}
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
  ["tglAwal", "tglAkhir", "filterJenis", "filterArah", "filterMetode", "search"].forEach((id) => {
    const el = document.getElementById(id);

    if (!el) return;

    el.addEventListener("input", filterData);
  });
}

/* =========================
   FILTER DATA
========================= */
function filterData() {
  const tglAwal = document.getElementById("tglAwal").value;

  const tglAkhir = document.getElementById("tglAkhir").value;

  const jenis = document.getElementById("filterJenis").value;

  const arah = document.getElementById("filterArah").value;

  const metode = document.getElementById("filterMetode").value;

  const search = document.getElementById("search").value.toLowerCase();

  let filtered = [...DATA];

  /* FILTER TANGGAL */
  if (tglAwal) {
    filtered = filtered.filter((x) => x.tanggal >= tglAwal);
  }

  if (tglAkhir) {
    filtered = filtered.filter((x) => x.tanggal <= tglAkhir);
  }

  /* FILTER JENIS */
  if (jenis) {
    filtered = filtered.filter((x) => x.ref_type === jenis);
  }

  /* FILTER ARAH */
  if (arah) {
    filtered = filtered.filter((x) => x.arah === arah);
  }

  /* FILTER METODE */
  if (metode) {
    filtered = filtered.filter((x) => x.metode === metode);
  }

  /* SEARCH */
  if (search) {
    filtered = filtered.filter((x) => (x.keterangan || "").toLowerCase().includes(search));
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

  return new Date(date).toLocaleDateString("id-ID");
}
