import { db } from "./supabase.js";
import { state } from "../utils/state.js";

import { rupiah } from "../utils/format.js";

export function addItem() {
  const produkSelect = document.getElementById("produk-item");

  const qtyInput = document.getElementById("qty-item");

  const hargaInput = document.getElementById("harga-item");

  const produk_id = produkSelect.value;

  const nama_produk = produkSelect.options[produkSelect.selectedIndex].text;

  const qty = Number(qtyInput.value);

  const harga = Number(hargaInput.value);

  if (!produk_id || qty <= 0 || harga <= 0) {
    alert("Lengkapi item");

    return;
  }

  const subtotal = qty * harga;

  state.pembelianItems.push({
    produk_id,
    nama_produk,
    qty,
    harga,
    subtotal,
  });

  qtyInput.value = "";

  hargaInput.value = "";

  renderItems();

  hitungTotal();
}

export function renderItems() {
  const tbody = document.getElementById("item-body");

  if (state.pembelianItems.length === 0) {
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
          Belum ada item pembelian
        </td>
      </tr>
    `;

    return;
  }

  tbody.innerHTML = state.pembelianItems
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
  state.pembelianItems.splice(index, 1);

  renderItems();

  hitungTotal();
}

export function hitungTotal() {
  const total = state.pembelianItems.reduce((sum, item) => {
    return sum + item.subtotal;
  }, 0);

  document.getElementById("grand-total").innerText = rupiah(total);
}

window.removeItem = removeItem;

async function loadSupplier() {
  const select = document.getElementById("supplier");

  const { data, error } = await db.from("supplier").select("*").order("nama");

  if (error) {
    console.error(error);
    return;
  }

  select.innerHTML = `
    <option value="">
      Pilih Supplier
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

async function loadProduk() {
  const select = document.getElementById("produk-item");

  const { data, error } = await db.from("produk").select("*").order("nama_produk");

  if (error) {
    console.error(error);
    return;
  }

  select.innerHTML = `
    <option value="">
      Pilih Produk
    </option>
  `;

  data.forEach((item) => {
    select.innerHTML += `
      <option 
        value="${item.id}"
        data-harga="${item.harga_beli || 0}"
      >
        ${item.nama_produk}
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

async function simpanPembelian() {
  try {
    const tanggal = document.getElementById("tanggal").value;

    const no_ref = `PO-${Date.now()}`;

    const supplier_id = document.getElementById("supplier").value;

    const pembayaran = document.getElementById("pembayaran").value;

    let rekening_id = document.getElementById("rekening").value;

    const catatan = document.getElementById("catatan").value;

    /* =========================
       VALIDASI
    ========================= */
    if (!tanggal || !supplier_id) {
      alert("Lengkapi header pembelian");

      return;
    }

    if (state.pembelianItems.length === 0) {
      alert("Item pembelian masih kosong");

      return;
    }

    /* =========================
       TEMPO = TANPA REKENING
    ========================= */
    if (pembayaran === "Tempo") {
      rekening_id = null;
    }

    /* =========================
       CASH / TRANSFER
    ========================= */
    if (pembayaran !== "Tempo" && !rekening_id) {
      alert("Pilih rekening");

      return;
    }

    /* =========================
       HITUNG TOTAL
    ========================= */
    const total = state.pembelianItems.reduce((sum, item) => {
      return sum + item.subtotal;
    }, 0);

    /* =========================
       STATUS PEMBAYARAN
    ========================= */
    let bayar = 0;

    let sisa = total;

    let status_pembayaran = "Belum Lunas";

    /* =========================
       LANGSUNG BAYAR
    ========================= */
    if (pembayaran !== "Tempo") {
      bayar = total;

      sisa = 0;

      status_pembayaran = "Lunas";
    }

    /* =========================
       INSERT HEADER
    ========================= */
    const { data: pembelian, error: errHeader } = await db
      .from("pembelian_header")
      .insert({
        tanggal,
        no_ref,
        supplier_id,
        pembayaran,
        rekening_id,
        catatan,

        total,
        bayar,
        sisa,

        status_pembayaran,
      })
      .select()
      .single();

    if (errHeader) {
      console.error(errHeader);

      alert("Gagal simpan header");

      return;
    }

    /* =========================
       INSERT DETAIL
    ========================= */
    const details = state.pembelianItems.map((item) => ({
      header_id: pembelian.id,

      produk_id: item.produk_id,

      qty: item.qty,

      harga: item.harga,
    }));

    const { error: errDetail } = await db.from("pembelian_detail").insert(details);

    if (errDetail) {
      console.error(errDetail);

      alert("Gagal simpan detail");

      return;
    }

    /* =========================
       CEK REKENING
    ========================= */
    let isTalangan = false;

    if (rekening_id) {
      const { data: rekeningData } = await db.from("rekening").select("*").eq("id", rekening_id).single();

      const namaRekening = rekeningData?.nama || "";

      isTalangan = namaRekening.toLowerCase().includes("talangan");
    }

    /* =========================
       PEMBAYARAN NORMAL
    ========================= */
    if (pembayaran !== "Tempo" && !isTalangan) {
      const { error: errBayar } = await db.from("pembayaran").insert([
        {
          tanggal,

          ref_type: "PEMBELIAN",

          ref_id: pembelian.id,

          arah: "KELUAR",

          nominal: total,

          metode: pembayaran.toUpperCase(),

          kategori: "HUTANG",

          rekening_id,

          keterangan: `Pembayaran ${no_ref}`,
        },
      ]);

      if (errBayar) {
        console.error(errBayar);

        alert("Pembayaran gagal dicatat");

        return;
      }
    }

    /* =========================
       TALANGAN TIM
    ========================= */
    if (isTalangan) {
      const { error: errReimburse } = await db.from("reimbursement").insert([
        {
          tanggal,

          pembelian_id: pembelian.id,

          rekening_id,

          nominal: total,

          status: "BELUM DIGANTI",

          keterangan: `Talangan pembelian ${no_ref}`,
        },
      ]);

      if (errReimburse) {
        console.error(errReimburse);

        alert("Reimbursement gagal dibuat");

        return;
      }
    }

    /* =========================
       RESET
    ========================= */
    state.pembelianItems = [];

    renderItems();

    hitungTotal();

    document.getElementById("supplier").value = "";

    document.getElementById("pembayaran").value = "Cash";

    document.getElementById("rekening").value = "";

    document.getElementById("catatan").value = "";

    document.getElementById("qty-item").value = "";

    document.getElementById("harga-item").value = "";

    document.getElementById("produk-item").selectedIndex = 0;

    document.getElementById("tanggal").value = new Date().toISOString().split("T")[0];

    alert("Pembelian berhasil");
  } catch (err) {
    console.error(err);

    alert("Terjadi error");
  }
}

// =========================
// INIT PEMBELIAN
// =========================
export async function initPembelian() {
  // LOAD MASTER
  await loadSupplier();

  await loadRekening();

  await loadProduk();
  const tanggalInput = document.getElementById("tanggal");

  if (tanggalInput && !tanggalInput.value) {
    tanggalInput.value = new Date().toISOString().split("T")[0];
  }
  // PRODUK CHANGE
  const produkSelect = document.getElementById("produk-item");

  if (produkSelect) {
    produkSelect.addEventListener("change", isiHargaProduk);
  }

  // ADD ITEM
  const btnAdd = document.getElementById("btn-add-item");

  if (btnAdd) {
    btnAdd.addEventListener("click", addItem);
  }

  // SIMPAN
  const btnSimpan = document.getElementById("btn-simpan-pembelian");

  if (btnSimpan) {
    btnSimpan.addEventListener("click", simpanPembelian);
  }

  // RENDER
  renderItems();

  hitungTotal();
}
