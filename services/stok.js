import { db } from "./supabase.js";
import { rupiah } from "../utils/format.js";

let DATA_STOK = [];

export async function initStok() {
  bindEvents();

  await loadStok();
}

async function loadStok() {
  const tbody = document.getElementById("stok-body");

  tbody.innerHTML = `
    <tr>
      <td colspan="8" style="text-align:center; padding:30px;">
        Loading...
      </td>
    </tr>
  `;

  const { data, error } = await db.from("v_stok").select("*").order("nama_produk");

  if (error) {
    console.error(error);

    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center; color:red; padding:30px;">
          Gagal load data
        </td>
      </tr>
    `;

    return;
  }

  DATA_STOK = data || [];

  renderTable(DATA_STOK);

  renderSummary(DATA_STOK);
}

function renderTable(data) {
  const tbody = document.getElementById("stok-body");

  if (!data.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8"
          style="
            text-align:center;
            padding:40px;
            color:#94a3b8;
          "
        >
          Belum ada data stok
        </td>
      </tr>
    `;

    return;
  }

  tbody.innerHTML = data.map((item, index) => renderRow(item, index)).join("");

  bindDetailButtons();
}

function renderRow(item, index) {
  const stok = Number(item.stok || 0);

  const hpp = Math.round(Number(item.hpp_avg || 0));

  const nilaiStok = Math.round(stok * hpp);

  return `
    <tr>

      <!-- NO -->
      <td
        style="
          text-align:center;
          font-weight:600;
        "
      >
        ${index + 1}
      </td>

      <!-- KODE -->
      <td
        style="
          white-space:nowrap;
          font-weight:600;
        "
      >
        ${item.kode_produk || "-"}
      </td>

      <!-- PRODUK -->
      <td>
        ${item.nama_produk || "-"}
      </td>

      <!-- STOK -->
      <td
        style="
          text-align:center;
          font-weight:600;
        "
      >
        ${stok}
      </td>

      <!-- HPP -->
      <td
        style="
          text-align:right;
          white-space:nowrap;
        "
      >
        ${rupiah(hpp)}
      </td>

      <!-- NILAI -->
      <td
        style="
          text-align:right;
          white-space:nowrap;
          font-weight:600;
        "
      >
        ${rupiah(nilaiStok)}
      </td>

      <!-- STATUS -->
      <td
        style="
          text-align:center;
        "
      >
        ${renderBadge(stok)}
      </td>

      <!-- AKSI -->
      <td
        style="
          text-align:center;
        "
      >
        <button
          class="btn btn-primary btn-detail"
          data-id="${item.id || ""}"
        >
          Detail
        </button>
      </td>

    </tr>
  `;
}

function renderBadge(stok) {
  if (stok <= 0) {
    return `
      <span class="badge badge-danger">
        Habis
      </span>
    `;
  }

  if (stok <= 10) {
    return `
      <span class="badge badge-warning">
        Menipis
      </span>
    `;
  }

  return `
    <span class="badge badge-success">
      Aman
    </span>
  `;
}

function bindEvents() {
  const searchInput = document.getElementById("search-stok");

  const filterSelect = document.getElementById("filter-stok");

  const btnRefresh = document.getElementById("btn-refresh");

  if (searchInput) {
    searchInput.addEventListener("input", filterData);
  }

  if (filterSelect) {
    filterSelect.addEventListener("change", filterData);
  }

  if (btnRefresh) {
    btnRefresh.addEventListener("click", loadStok);
  }
}

function filterData() {
  const keyword = document.getElementById("search-stok")?.value.toLowerCase() || "";

  const filter = document.getElementById("filter-stok")?.value || "semua";

  let filtered = [...DATA_STOK];

  // SEARCH
  filtered = filtered.filter((item) => {
    const nama = (item.nama_produk || "").toLowerCase();

    const kode = (item.kode_produk || "").toLowerCase();

    return nama.includes(keyword) || kode.includes(keyword);
  });

  // FILTER
  filtered = filtered.filter((item) => {
    const stok = Number(item.stok || 0);

    if (filter === "habis") {
      return stok <= 0;
    }

    if (filter === "menipis") {
      return stok > 0 && stok <= 10;
    }

    if (filter === "aman") {
      return stok > 10;
    }

    return true;
  });

  renderTable(filtered);

  renderSummary(filtered);
}

function renderSummary(data) {
  const totalProduk = data.length;

  const totalQty = data.reduce((sum, item) => {
    return sum + Number(item.stok || 0);
  }, 0);

  const totalNilai = data.reduce((sum, item) => {
    const stok = Number(item.stok || 0);

    const hpp = Number(item.hpp_avg || 0);

    return sum + stok * hpp;
  }, 0);

  const stokMenipis = data.filter((item) => {
    const stok = Number(item.stok || 0);

    return stok > 0 && stok <= 10;
  }).length;

  const elProduk = document.getElementById("summary-total-produk");

  const elQty = document.getElementById("summary-total-qty");

  const elNilai = document.getElementById("summary-total-nilai");

  const elMenipis = document.getElementById("summary-menipis");

  if (elProduk) {
    elProduk.innerText = totalProduk;
  }

  if (elQty) {
    elQty.innerText = totalQty;
  }

  if (elNilai) {
    elNilai.innerText = rupiah(totalNilai);
  }

  if (elMenipis) {
    elMenipis.innerText = stokMenipis;
  }
}

function bindDetailButtons() {
  document.querySelectorAll(".btn-detail").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;

      const item = DATA_STOK.find((x) => String(x.id) === String(id));

      if (!item) return;

      alert(`
Produk : ${item.nama_produk}
Kode   : ${item.kode_produk}
Stok   : ${item.stok}
HPP    : ${rupiah(item.hpp_avg)}
      `);
    });
  });
}
