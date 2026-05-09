import { db } from "./supabase.js";

import { rupiah, formatDate } from "../utils/format.js";

/* =========================
   CURRENT
========================= */
let CURRENT_ID = null;

let CURRENT_DATA = null;

/* =========================
   INIT
========================= */
export async function initDetailHutang() {
  try {
    CURRENT_ID = window.HUTANG_ID || localStorage.getItem("detail_hutang_id");

    // =========================
    // VALIDASI
    // =========================
    if (!CURRENT_ID) {
      loadPage("hutang");

      return;
    }

    // =========================
    // LOAD
    // =========================
    await loadDetailHutang();

    // =========================
    // ICON
    // =========================
    if (window.lucide) {
      lucide.createIcons();
    }
  } catch (err) {
    console.log(err);

    alert(err.message || "Gagal load detail hutang");
  }
}

/* =========================
   LOAD DETAIL
========================= */
async function loadDetailHutang() {
  try {
    // =========================
    // HEADER
    // =========================
    const { data: header, error: headerError } = await db.from("v_hutang").select("*").eq("id", CURRENT_ID).single();

    if (headerError) {
      console.log(headerError);

      return;
    }

    if (!header) return;

    CURRENT_DATA = header;

    // =========================
    // HISTORI
    // =========================
    const { data: histori, error: historiError } = await db.from("pembayaran").select("*").eq("ref_id", CURRENT_ID).order("tanggal", {
      ascending: false,
    });

    if (historiError) {
      console.log(historiError);
    }

    // =========================
    // HEADER INFO
    // =========================
    setText("detail-no-ref", header.no_ref || "-");

    setText("detail-nama", header.nama || "-");

    setText("detail-total", rupiah(header.total));

    setText("detail-bayar", rupiah(header.bayar));

    setText("detail-sisa", rupiah(header.sisa));

    // =========================
    // STATUS
    // =========================
    const statusEl = document.getElementById("detail-status");

    if (statusEl) {
      statusEl.innerHTML = `
        <span class="
          badge
          ${getBadgeClass(header.status_pembayaran)}
        ">
          ${header.status_pembayaran}
        </span>
      `;
    }

    // =========================
    // TABLE
    // =========================
    const tbody = document.getElementById("detail-items");

    if (!tbody) return;

    if (!histori || histori.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td
            colspan="4"
            class="table-empty"
          >
            Belum ada pembayaran
          </td>
        </tr>
      `;

      return;
    }

    tbody.innerHTML = histori
      .map(
        (item) => `

        <tr>

          <td>
            ${formatDate(item.tanggal)}
          </td>

          <td>
            ${item.metode || "-"}
          </td>

          <td>
            ${item.keterangan || "-"}
          </td>

          <td class="text-right">
            ${rupiah(item.nominal)}
          </td>

        </tr>

      `,
      )
      .join("");

    // =========================
    // ICON
    // =========================
    if (window.lucide) {
      lucide.createIcons();
    }
  } catch (err) {
    console.log(err);
  }
}

/* =========================
   BAYAR HUTANG
========================= */
window.bayarHutang = async function () {
  try {
    // =========================
    // VALIDASI
    // =========================
    if (!CURRENT_DATA) {
      alert("Data hutang tidak ditemukan");

      return;
    }

    // =========================
    // SUDAH LUNAS
    // =========================
    if (Number(CURRENT_DATA.sisa || 0) <= 0) {
      alert("Hutang sudah lunas");

      return;
    }

    // =========================
    // INPUT NOMINAL
    // =========================
    const nominalInput = prompt(`Nominal pembayaran\nSisa hutang: ${rupiah(CURRENT_DATA.sisa)}`);

    if (nominalInput === null) return;

    const nominal = Number(String(nominalInput).replace(/\./g, "").replace(/,/g, ""));

    // =========================
    // VALIDASI NOMINAL
    // =========================
    if (isNaN(nominal) || nominal <= 0) {
      alert("Nominal tidak valid");

      return;
    }

    // =========================
    // LEBIH BESAR
    // =========================
    if (nominal > Number(CURRENT_DATA.sisa || 0)) {
      alert("Nominal melebihi sisa hutang");

      return;
    }

    // =========================
    // METODE
    // =========================
    const metode = prompt("Metode pembayaran\n(Cash / Transfer / QRIS)") || "Cash";

    // =========================
    // KETERANGAN
    // =========================
    const keterangan = prompt("Keterangan pembayaran") || "";

    // =========================
    // INSERT PEMBAYARAN
    // =========================
    const { error } = await db.from("pembayaran").insert([
      {
        tanggal: new Date(),

        ref_id: CURRENT_ID,

        ref_type: "HUTANG",

        arah: "KELUAR",

        nominal,

        metode,

        keterangan: keterangan || `Pembayaran hutang ${CURRENT_DATA.no_ref}`,
      },
    ]);

    // =========================
    // ERROR
    // =========================
    if (error) {
      console.log(error);

      alert(error.message || "Gagal bayar hutang");

      return;
    }

    // =========================
    // UPDATE HEADER
    // =========================
    const bayarBaru = Number(CURRENT_DATA.bayar || 0) + nominal;

    const sisaBaru = Number(CURRENT_DATA.total || 0) - bayarBaru;

    let statusBaru = "BELUM LUNAS";

    if (sisaBaru <= 0) {
      statusBaru = "LUNAS";
    } else if (bayarBaru > 0) {
      statusBaru = "CICIL";
    }

    // =========================
    // PEMBELIAN
    // =========================
    if (CURRENT_DATA.jenis === "PEMBELIAN") {
      await db
        .from("pembelian_header")
        .update({
          bayar: bayarBaru,

          sisa: sisaBaru,

          status_pembayaran: statusBaru,
        })
        .eq("id", CURRENT_ID);
    }

    // =========================
    // PRODUKSI
    // =========================
    if (CURRENT_DATA.jenis === "PRODUKSI") {
      await db
        .from("produksi")
        .update({
          dibayar: bayarBaru,

          sisa_bayar: sisaBaru,

          status_pembayaran: statusBaru,
        })
        .eq("id", CURRENT_ID);
    }

    // =========================
    // SUCCESS
    // =========================
    alert("Pembayaran berhasil");

    // =========================
    // RELOAD
    // =========================
    await loadDetailHutang();
  } catch (err) {
    console.log(err);

    alert(err.message || "Terjadi kesalahan");
  }
};

/* =========================
   PRINT
========================= */
window.printDetailHutang = function () {
  window.print();
};

/* =========================
   HELPERS
========================= */
function setText(id, value) {
  const el = document.getElementById(id);

  if (!el) return;

  el.innerText = value;
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
