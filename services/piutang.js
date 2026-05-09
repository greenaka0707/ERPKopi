import { db } from "./supabase.js";

let DATA = [];

/* =========================
   INIT
========================= */
export async function initPiutang() {
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
      <td colspan="7" class="text-center">
        Memuat data...
      </td>
    </tr>
  `;

  const { data, error } = await db.from("v_piutang").select("*").order("tanggal", {
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
  const totalPiutang = data.reduce((a, b) => a + Number(b.sisa || 0), 0);

  const belumLunas = data.filter((x) => x.status_pembayaran === "BELUM LUNAS").length;

  const cicil = data.filter((x) => x.status_pembayaran === "CICIL").length;

  const lunas = data.filter((x) => x.status_pembayaran === "LUNAS").length;

  document.getElementById("totalPiutang").innerText = rupiah(totalPiutang);

  document.getElementById("belumLunas").innerText = belumLunas;

  document.getElementById("cicil").innerText = cicil;

  document.getElementById("lunas").innerText = lunas;
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
        <td colspan="8" class="text-center">
          Tidak ada data piutang
        </td>
      </tr>
    `;

    return;
  }

  tbody.innerHTML = data
    .map(
      (item) => `

    <tr>

      <!-- TANGGAL -->
      <td>
        ${formatDate(item.tanggal)}
      </td>


      <!-- CUSTOMER -->
      <td>
        ${item.nama || "-"}
      </td>


      <!-- NO REF -->
      <td>
        ${item.no_ref || "-"}
      </td>


      <!-- TOTAL -->
      <td class="text-right">
        ${rupiah(item.total)}
      </td>


      <!-- BAYAR -->
      <td class="text-right">
        ${rupiah(item.bayar)}
      </td>


      <!-- SISA -->
      <td class="text-right">
        ${rupiah(item.sisa)}
      </td>


      <!-- STATUS -->
      <td>

        <span class="
          badge
          ${getBadgeClass(item.status_pembayaran)}
        ">
          ${item.status_pembayaran}
        </span>

      </td>


      <!-- AKSI -->
      <td class="text-center">

        <div class="table-action">

          <!-- DETAIL -->
          <button
            class="btn btn-secondary btn-sm"
            onclick="
              openDetailPiutang(
                '${item.id}'
              )
            "
          >
            Detail
          </button>


          <!-- BAYAR -->
          ${
            item.status_pembayaran !== "LUNAS"
              ? `
                <button
                  class="btn btn-primary btn-sm"
                  onclick="
                    openModalPembayaran(
                      '${item.id}'
                    )
                  "
                >
                  Bayar
                </button>
              `
              : `
                <span class="
                  badge
                  badge-success
                ">
                  Lunas
                </span>
              `
          }

        </div>

      </td>

    </tr>

  `,
    )
    .join("");
}
/* =========================
   OPEN DETAIL
========================= */
window.openDetailPiutang = async function (id) {
  const item = DATA.find((x) => x.id == id);

  if (!item) return;

  /* OPEN MODAL */
  document.getElementById("modalDetailPiutang").classList.add("show");

  /* SET DATA */
  document.getElementById("detailNoRef").innerText = item.no_ref || "-";

  document.getElementById("detailCustomer").value = item.nama || "-";

  document.getElementById("detailStatus").value = item.status_pembayaran || "-";

  document.getElementById("detailTotal").innerText = rupiah(item.total);

  document.getElementById("detailBayar").innerText = rupiah(item.bayar);

  document.getElementById("detailSisa").innerText = rupiah(item.sisa);

  /* LOAD HISTORI */
  loadHistoriPembayaran(id);
};

/* =========================
   CLOSE DETAIL
========================= */
window.closeDetailPiutang = function () {
  document.getElementById("modalDetailPiutang").classList.remove("show");
};

/* =========================
   OPEN MODAL BAYAR
========================= */
window.openModalPembayaran = async function (id) {
  const item = DATA.find((x) => x.id == id);

  if (!item) return;

  /* OPEN */
  document.getElementById("modalPembayaran").classList.add("show");

  /* SIMPAN ID */
  window.PIUTANG_ID = id;

  /* LOAD REKENING */
  await loadRekening();

  /* SET DATA */
  document.getElementById("modalCustomer").value = item.nama || "-";

  document.getElementById("modalRef").value = item.no_ref || "-";

  document.getElementById("modalTotal").value = rupiah(item.total);

  document.getElementById("modalSisa").value = rupiah(item.sisa);

  document.getElementById("modalNominal").value = "";

  document.getElementById("modalKeterangan").value = `Pembayaran ${item.no_ref}`;
};

/* =========================
   LOAD REKENING
========================= */
async function loadRekening() {
  const select = document.getElementById("modalRekening");

  if (!select) return;

  select.innerHTML = `
    <option value="">
      Memuat rekening...
    </option>
  `;

  const { data, error } = await db.from("rekening").select("*").eq("is_active", true).order("jenis");

  if (error) {
    console.log(error);

    select.innerHTML = `
      <option value="">
        Gagal load rekening
      </option>
    `;

    return;
  }

  if (!data?.length) {
    select.innerHTML = `
      <option value="">
        Tidak ada rekening
      </option>
    `;

    return;
  }

  select.innerHTML = `
    <option value="">
      Pilih rekening
    </option>
  `;

  data.forEach((item) => {
    select.innerHTML += `
      <option value="${item.id}">
        ${item.jenis}
      </option>
    `;
  });
}

/* =========================
   CLOSE MODAL BAYAR
========================= */
window.closeModalPembayaran = function () {
  document.getElementById("modalPembayaran").classList.remove("show");
};

/* =========================
   SUBMIT PEMBAYARAN
========================= */
window.submitPembayaranPiutang = async function () {
  const id = window.PIUTANG_ID;

  const item = DATA.find((x) => x.id == id);

  if (!item) return;

  const nominal = Number(document.getElementById("modalNominal").value || 0);

  if (nominal <= 0) {
    alert("Nominal tidak valid");

    return;
  }

  if (nominal > item.sisa) {
    alert("Nominal melebihi sisa");

    return;
  }

  const rekening = document.getElementById("modalRekening").value;

  if (!rekening) {
    alert("Pilih rekening");

    return;
  }

  /* HITUNG */
  const bayarBaru = Number(item.bayar || 0) + nominal;

  const sisaBaru = Number(item.total || 0) - bayarBaru;

  /* STATUS */
  let status = "BELUM LUNAS";

  if (sisaBaru <= 0) {
    status = "LUNAS";
  } else if (bayarBaru > 0) {
    status = "CICIL";
  }

  /* UPDATE PENJUALAN */
  const { error } = await db
    .from("penjualan_header")
    .update({
      bayar: bayarBaru,

      sisa: sisaBaru,

      status_pembayaran: status,
    })
    .eq("id", id);

  if (error) {
    console.log(error);

    alert(error.message);

    return;
  }

  /* INSERT PEMBAYARAN */
  const { error: pembayaranError } = await db.from("pembayaran").insert([
    {
      tanggal: new Date().toISOString(),

      ref_type: "PENJUALAN",

      ref_id: id,

      arah: "MASUK",

      nominal: nominal,

      metode: document.getElementById("modalMetode").value,

      kategori: "PIUTANG",

      rekening_id: rekening,

      keterangan: document.getElementById("modalKeterangan").value,
    },
  ]);

  if (pembayaranError) {
    console.log(pembayaranError);

    alert(pembayaranError.message);

    return;
  }

  alert("Pembayaran berhasil");

  closeModalPembayaran();

  closeDetailPiutang();

  await loadData();
};

/* =========================
   LOAD HISTORI
========================= */
async function loadHistoriPembayaran(id) {
  const tbody = document.getElementById("tbodyHistoriPiutang");

  const { data } = await db.from("pembayaran").select("*").eq("ref_id", id).order("tanggal", {
    ascending: false,
  });

  if (!data?.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center">
          Belum ada pembayaran
        </td>
      </tr>
    `;

    return;
  }

  tbody.innerHTML = data
    .map(
      (x) => `

    <tr>

      <td>
        ${formatDate(x.tanggal)}
      </td>

      <td>
        ${x.metode || "-"}
      </td>

      <td>
        ${x.keterangan || "-"}
      </td>

      <td class="text-right">
        ${rupiah(x.nominal)}
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
  ["search", "filterStatus"].forEach((id) => {
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

  const status = document.getElementById("filterStatus").value;

  let filtered = [...DATA];

  /* SEARCH */
  if (search) {
    filtered = filtered.filter((x) => (x.nama || "").toLowerCase().includes(search));
  }

  /* STATUS */
  if (status) {
    filtered = filtered.filter((x) => x.status_pembayaran === status);
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
