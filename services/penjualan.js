import { db } from "./supabase.js";
import { state } from "../utils/state.js";
import { rupiah } from "../utils/format.js";

export function addItem() {
  const produk_id = selectedProduk;

  const qtyInput = document.getElementById("qty-item");

  const hargaInput = document.getElementById("harga-item");

  // =========================
  // VALUE
  // =========================

  const qty = Number(qtyInput.value || 0);

  const harga = Number(hargaInput.value || 0);

  // =========================
  // VALIDASI
  // =========================
  if (!produk_id) {
    alert("Pilih produk");

    return;
  }

  if (qty <= 0) {
    alert("Qty harus lebih dari 0");

    return;
  }

  if (harga <= 0) {
    alert("Harga harus lebih dari 0");

    return;
  }

  // =========================
  // AMBIL PRODUK DARI STATE
  // =========================
  const produk = state.produk.find((item) => item.id == produk_id);

  if (!produk) {
    alert("Produk tidak ditemukan");

    return;
  }

  // =========================
  // DATA PRODUK
  // =========================
  const nama_produk = produk.nama_produk;

  const stok = Number(produk.stok || 0);

  const hpp = Number(produk.hpp_avg || produk.hpp || 0);

  // =========================
  // VALIDASI STOK
  // =========================
  if (qty > stok) {
    alert(`Stok tidak cukup. Sisa stok: ${stok}`);

    return;
  }

  // =========================
  // HITUNG SUBTOTAL
  // =========================
  const subtotal = qty * harga;

  // =========================
  // PUSH ITEM
  // =========================
  state.penjualanItems.push({
    produk_id,

    nama_produk,

    qty,

    harga,

    subtotal,

    stok,

    hpp,
  });

  // =========================
  // RESET INPUT
  // =========================
  document.getElementById("produk-search").value = "";

  selectedProduk = null;

  qtyInput.value = "";

  hargaInput.value = "";

  // =========================
  // RENDER
  // =========================
  renderItems();

  hitungTotal();
}

export function renderItems() {
  const tbody = document.getElementById("item-body");

  if (state.penjualanItems.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td
          colspan="5"
          style="
            text-align:center;
            padding:40px;
            color:#94a3b8;
          "
        >
          Belum ada item penjualan
        </td>
      </tr>
    `;

    return;
  }

  tbody.innerHTML = state.penjualanItems
    .map((item, index) => {
      return `
        <tr>

          <td>
            ${item.nama_produk}
          </td>

          <td>
            ${item.qty}
          </td>

          <td>
            ${rupiah(item.harga)}
          </td>

          <td>
            ${rupiah(item.subtotal)}
          </td>

          <td>
            <button
              class="btn btn-danger"
              onclick="removeItem(${index})"
            >
              Hapus
            </button>
          </td>

        </tr>
      `;
    })
    .join("");
}

export function removeItem(index) {
  state.penjualanItems.splice(index, 1);

  renderItems();

  hitungTotal();
}

export function hitungTotal() {
  const subtotal = state.penjualanItems.reduce((sum, item) => {
    return sum + item.subtotal;
  }, 0);

  const diskon = Number(document.getElementById("diskon")?.value || 0);

  const ongkir = Number(document.getElementById("ongkir")?.value || 0);

  const grandTotal = subtotal - diskon + ongkir;

  const dibayar = Number(document.getElementById("dibayar")?.value || 0);

  const sisaPiutang = grandTotal - dibayar;

  document.getElementById("subtotal").innerText = rupiah(subtotal);

  document.getElementById("grand-total").innerText = rupiah(grandTotal);

  document.getElementById("sisa-piutang").innerText = rupiah(sisaPiutang);
}

window.removeItem = removeItem;

async function loadSales() {
  const select = document.getElementById("sales");

  const { data, error } = await db.from("sales").select("*").order("nama");

  if (error) {
    console.error(error);
    return;
  }

  select.innerHTML = `
    <option value="">
      Pilih Sales
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

async function loadRekening() {
  const select = document.getElementById("rekening");

  const { data, error } = await db.from("rekening").select("*").order("nama");

  if (error) {
    console.error(error);
    return;
  }

  select.innerHTML = `
    <option value="">
      Pilih Rekening
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

function isiHargaProduk() {
  const produkSelect = document.getElementById("produk-item");

  const hargaInput = document.getElementById("harga-item");

  const selected = produkSelect.options[produkSelect.selectedIndex];

  const harga = selected.dataset.harga || 0;

  hargaInput.value = harga;
}

let selectedCustomer = null;

let selectedProduk = null;

// =========================
// CUSTOMER SEARCH
// =========================
async function initCustomerSearch() {
  const input = document.getElementById("customer-search");

  const dropdown = document.getElementById("customer-dropdown");

  if (!input || !dropdown) return;

  const { data, error } = await db.from("customer").select("*").order("nama");

  if (error) {
    console.error(error);
    return;
  }

  const customers = data || [];

  function render(keyword = "") {
    const filtered = customers.filter((item) => item.nama?.toLowerCase().includes(keyword.toLowerCase()));

    if (!filtered.length) {
      dropdown.innerHTML = `
        <div class="search-empty">
          Customer tidak ditemukan
        </div>
      `;

      return;
    }

    dropdown.innerHTML = filtered
      .map((item) => {
        return `
          <div
            class="search-option"
            data-id="${item.id}"
            data-name="${item.nama}"
          >
            ${item.nama}
          </div>
        `;
      })
      .join("");

    dropdown.querySelectorAll(".search-option").forEach((option) => {
      option.addEventListener("click", () => {
        selectedCustomer = option.dataset.id;

        input.value = option.dataset.name;

        dropdown.classList.remove("show");
      });
    });
  }

  input.addEventListener("focus", () => {
    dropdown.classList.add("show");

    render(input.value);
  });

  input.addEventListener("input", () => {
    dropdown.classList.add("show");

    render(input.value);
  });

  document.addEventListener("click", (e) => {
    if (!document.getElementById("customer-select")?.contains(e.target)) {
      dropdown.classList.remove("show");
    }
  });

  render();
}

// =========================
// PRODUK SEARCH
// =========================
async function initProdukSearch() {
  const input = document.getElementById("produk-search");

  const dropdown = document.getElementById("produk-dropdown");

  if (!input || !dropdown) return;

  const { data, error } = await db.from("v_stok").select("*").order("nama_produk");

  if (error) {
    console.error(error);
    return;
  }

  state.produk = data || [];

  function render(keyword = "") {
    const filtered = state.produk.filter((item) => item.nama_produk?.toLowerCase().includes(keyword.toLowerCase()));

    if (!filtered.length) {
      dropdown.innerHTML = `
        <div class="search-empty">
          Produk tidak ditemukan
        </div>
      `;

      return;
    }

    dropdown.innerHTML = filtered
      .map((item) => {
        return `
          <div
            class="search-option"
            data-id="${item.id}"
            data-name="${item.nama_produk}"
            data-harga="${item.harga_jual || 0}"
          >
            ${item.nama_produk}
          </div>
        `;
      })
      .join("");

    dropdown.querySelectorAll(".search-option").forEach((option) => {
      option.addEventListener("click", () => {
        selectedProduk = option.dataset.id;

        input.value = option.dataset.name;

        document.getElementById("harga-item").value = option.dataset.harga || 0;

        dropdown.classList.remove("show");
      });
    });
  }

  input.addEventListener("focus", () => {
    dropdown.classList.add("show");

    render(input.value);
  });

  input.addEventListener("input", () => {
    dropdown.classList.add("show");

    render(input.value);
  });

  document.addEventListener("click", (e) => {
    if (!document.getElementById("produk-select")?.contains(e.target)) {
      dropdown.classList.remove("show");
    }
  });

  render();
}

export async function initPenjualan() {
  await initCustomerSearch();

  await loadSales();

  await loadRekening();

  await initProdukSearch();

  const tanggalInput = document.getElementById("tanggal");

  if (tanggalInput && !tanggalInput.value) {
    tanggalInput.value = new Date().toISOString().split("T")[0];
  }

  const produkSelect = document.getElementById("produk-item");

  if (produkSelect) {
    produkSelect.addEventListener("change", isiHargaProduk);
  }

  const btnAdd = document.getElementById("btn-add-item");

  if (btnAdd) {
    btnAdd.addEventListener("click", addItem);
  }

  const btnSimpan = document.getElementById("btn-simpan-penjualan");

  if (btnSimpan) {
    btnSimpan.addEventListener("click", () => {
      // =========================
      // MODE EDIT / CREATE
      // =========================
      if (state.modePenjualan === "edit") {
        alert("Edit penjualan dinonaktifkan");

        return;
      } else {
        simpanPenjualan();
      }
    });
  }

  // EDIT DINONAKTIFKAN
  state.editPenjualan = null;

  ["diskon", "ongkir", "dibayar"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", hitungTotal);
  });

  renderItems();

  hitungTotal();
}

async function simpanPenjualan() {
  try {
    // =========================
    // LOCK BUTTON
    // =========================
    const btn = document.getElementById("btn-simpan-penjualan");

    if (btn) {
      btn.disabled = true;
      btn.innerText = "Menyimpan...";
    }

    // =========================
    // HEADER
    // =========================
    const tanggal = document.getElementById("tanggal")?.value;

    const no_inv = `INV-${Date.now()}`;

    const customer_id = selectedCustomer;

    const sales_id = document.getElementById("sales")?.value || null;

    const pembayaran = document.getElementById("pembayaran")?.value;

    let rekening_id = document.getElementById("rekening")?.value || null;

    if (pembayaran === "Tempo") {
      rekening_id = null;
    }

    const catatan = document.getElementById("catatan")?.value || "";

    // =========================
    // VALIDASI HEADER
    // =========================
    if (!tanggal || !customer_id) {
      alert("Lengkapi header penjualan");

      return;
    }

    // =========================
    // VALIDASI ITEM
    // =========================
    if (!state.penjualanItems || state.penjualanItems.length === 0) {
      alert("Item penjualan masih kosong");

      return;
    }

    // =========================
    // VALIDASI REKENING
    // =========================
    if (pembayaran !== "Tempo" && !rekening_id) {
      alert("Pilih rekening");

      return;
    }

    // =========================
    // HITUNG TOTAL
    // =========================
    const subtotal = state.penjualanItems.reduce((sum, item) => {
      return sum + Number(item.qty || 0) * Number(item.harga || 0);
    }, 0);

    const diskon = Number(document.getElementById("diskon")?.value || 0);

    const ongkir = Number(document.getElementById("ongkir")?.value || 0);

    const total = subtotal - diskon + ongkir;

    const dibayar = Number(document.getElementById("dibayar")?.value || 0);

    const sisa = total - dibayar;

    let status_pembayaran = "BELUM LUNAS";

    if (sisa <= 0) {
      status_pembayaran = "LUNAS";
    } else if (dibayar > 0) {
      status_pembayaran = "CICIL";
    }

    // =========================
    // INSERT HEADER
    // =========================
    const { data: penjualan, error: errHeader } = await db
      .from("penjualan_header")
      .insert({
        tanggal,

        no_inv,

        customer_id,

        sales_id,

        pembayaran,

        rekening_id,

        catatan,

        subtotal,

        diskon,

        ongkir,

        total,

        bayar: dibayar,

        sisa,

        status_pembayaran,
      })
      .select()
      .single();

    // =========================
    // ERROR HEADER
    // =========================
    if (errHeader) {
      console.error(errHeader);

      alert(errHeader.message || "Gagal simpan header");

      return;
    }

    // =========================
    // INSERT DETAIL
    // =========================
    const details = state.penjualanItems.map((item) => ({
      header_id: penjualan.id,

      produk_id: item.produk_id,

      nama_produk: item.nama_produk,

      qty: Number(item.qty || 0),

      harga: Number(item.harga || 0),

      hpp: Number(item.hpp || 0),
    }));

    const { error: errDetail } = await db.from("penjualan_detail").insert(details);

    // =========================
    // ERROR DETAIL
    // =========================
    if (errDetail) {
      console.error(errDetail);

      // ROLLBACK HEADER
      await db.from("penjualan_header").delete().eq("id", penjualan.id);

      alert(errDetail.message || "Gagal simpan detail");

      return;
    }

    // =========================
    // RESET STATE
    // =========================
    state.penjualanItems = [];

    // =========================
    // RESET FORM
    // =========================
    renderItems();

    hitungTotal();

    document.getElementById("customer-search").value = "";

    selectedCustomer = null;

    document.getElementById("sales").value = "";

    document.getElementById("pembayaran").value = "Cash";

    document.getElementById("rekening").value = "";

    document.getElementById("catatan").value = "";

    document.getElementById("diskon").value = 0;

    document.getElementById("ongkir").value = 0;

    document.getElementById("dibayar").value = 0;

    document.getElementById("qty-item").value = "";

    document.getElementById("harga-item").value = "";

    document.getElementById("produk-search").value = "";

    selectedProduk = null;

    document.getElementById("tanggal").value = new Date().toISOString().split("T")[0];

    // =========================
    // SUCCESS
    // =========================
    alert("Penjualan berhasil");
  } catch (err) {
    console.error(err);

    alert(err.message || "Terjadi error");
  } finally {
    // =========================
    // UNLOCK BUTTON
    // =========================
    const btn = document.getElementById("btn-simpan-penjualan");

    if (btn) {
      btn.disabled = false;
      btn.innerText = "Simpan Penjualan";
    }
  }
}

// =========================
// LOAD EDIT PENJUALAN
// =========================
function loadEditPenjualan() {
  const edit = state.editPenjualan;

  if (!edit) return;

  const header = edit.header;

  // =========================
  // HEADER
  // =========================
  document.getElementById("tanggal").value = header.tanggal || "";

  document.getElementById("customer").value = header.customer_id || "";

  document.getElementById("dibayar").value = header.bayar || 0;

  document.getElementById("sales").value = header.sales_id || "";

  document.getElementById("pembayaran").value = header.pembayaran || "Cash";

  document.getElementById("rekening").value = header.rekening_id || "";

  document.getElementById("catatan").value = header.catatan || "";

  document.getElementById("diskon").value = header.diskon || 0;

  document.getElementById("ongkir").value = header.ongkir || 0;

  document.getElementById("dibayar").value = header.bayar || 0;

  /// =========================
  // ITEM
  // =========================
  state.penjualanItems = [];

  edit.detail.forEach((item) => {
    state.penjualanItems.push({
      produk_id: item.produk_id,
      nama_produk: item.nama_produk,
      qty: Number(item.qty || 0),
      harga: Number(item.harga || 0),
      subtotal: Number(item.qty || 0) * Number(item.harga || 0),
      hpp: Number(item.hpp || 0),
    });
  });

  renderItems();

  hitungTotal();

  // =========================
  // MODE
  // =========================
  state.modePenjualan = "edit";

  state.editIdPenjualan = edit.id;

  // =========================
  // TITLE
  // =========================
  const title = document.querySelector(".page-header h1");

  if (title) {
    title.innerText = "Edit Penjualan";
  }
}

async function updatePenjualan() {
  try {
    const id = state.editIdPenjualan;

    if (!id) {
      alert("ID penjualan tidak ditemukan");
      return;
    }

    // =========================
    // FORM
    // =========================
    const tanggal = document.getElementById("tanggal").value;

    const customer_id = document.getElementById("customer").value;

    const sales_id = document.getElementById("sales").value || null;

    const pembayaran = document.getElementById("pembayaran").value;

    let rekening_id = document.getElementById("rekening").value || null;

    if (pembayaran === "Tempo") {
      rekening_id = null;
    }

    const catatan = document.getElementById("catatan").value || "";

    const diskon = Number(document.getElementById("diskon").value || 0);

    const ongkir = Number(document.getElementById("ongkir").value || 0);

    const dibayar = Number(document.getElementById("dibayar").value || 0);

    // =========================
    // TOTAL
    // =========================
    const subtotal = state.penjualanItems.reduce((a, b) => a + Number(b.subtotal || 0), 0);

    const total = subtotal - diskon + ongkir;

    const sisa = total - dibayar;

    let status_pembayaran = "BELUM LUNAS";

    if (sisa <= 0) {
      status_pembayaran = "LUNAS";
    } else if (dibayar > 0) {
      status_pembayaran = "CICIL";
    }

    // =========================
    // UPDATE HEADER
    // =========================
    const { error: errHeader } = await db
      .from("penjualan_header")
      .update({
        tanggal,
        customer_id,
        sales_id,
        pembayaran,
        rekening_id,
        catatan,
        subtotal,
        diskon,
        ongkir,
        total,
        bayar: dibayar,
        sisa,
        status_pembayaran,
      })
      .eq("id", id);

    if (errHeader) {
      console.error(errHeader);

      alert("Gagal update header");

      return;
    }

    // =========================
    // HAPUS DETAIL LAMA
    // =========================
    await db.from("penjualan_detail").delete().eq("header_id", id);

    // =========================
    // INSERT DETAIL BARU
    // =========================
    const details = state.penjualanItems.map((item) => ({
      header_id: id,

      produk_id: item.produk_id,

      nama_produk: item.nama_produk,

      qty: Number(item.qty || 0),

      harga: Number(item.harga || 0),

      hpp: Number(item.hpp || 0),
    }));

    const { error: errDetail } = await db.from("penjualan_detail").insert(details);

    if (errDetail) {
      console.error(errDetail);

      alert("Gagal update detail");

      return;
    }

    // =========================
    // RESET MODE
    // =========================
    state.modePenjualan = null;

    state.editIdPenjualan = null;

    state.editPenjualan = null;

    // =========================
    // SUCCESS
    // =========================
    alert("Penjualan berhasil diupdate");

    loadPage("data-penjualan");
  } catch (err) {
    console.error(err);

    alert("Terjadi error update");
  }
}
