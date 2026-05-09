import { db } from "./supabase.js";

import { rupiah } from "../utils/format.js";

// =========================
// INIT DASHBOARD
// =========================
export async function initDashboard() {
  await Promise.all([loadKas(), loadHutang(), loadPiutang(), loadProduksi(), loadDashboardSummary()]);

  // =========================
  // ICON
  // =========================
  if (window.lucide) {
    lucide.createIcons();
  }
}

// =========================
// LOAD KAS
// =========================
async function loadKas() {
  const { data, error } = await db.from("pembayaran").select(`
      arah,
      nominal
    `);

  if (error) {
    console.error(error);

    return;
  }

  const totalMasuk = (data || []).filter((x) => x.arah === "MASUK").reduce((a, b) => a + Number(b.nominal || 0), 0);

  const totalKeluar = (data || []).filter((x) => x.arah === "KELUAR").reduce((a, b) => a + Number(b.nominal || 0), 0);

  const saldoKas = totalMasuk - totalKeluar;

  document.getElementById("total-kas").innerText = rupiah(saldoKas);
}

// =========================
// LOAD HUTANG
// =========================
async function loadHutang() {
  const { data, error } = await db.from("v_hutang").select(`
      sisa
    `);

  if (error) {
    console.error(error);

    return;
  }

  const total = (data || []).reduce((a, b) => a + Number(b.sisa || 0), 0);

  document.getElementById("total-hutang").innerText = rupiah(total);
}

// =========================
// LOAD PIUTANG
// =========================
async function loadPiutang() {
  const { data, error } = await db.from("v_piutang").select(`
      sisa
    `);

  if (error) {
    console.error(error);

    return;
  }

  const total = (data || []).reduce((a, b) => a + Number(b.sisa || 0), 0);

  document.getElementById("total-piutang").innerText = rupiah(total);
}

// =========================
// LOAD PRODUKSI
// =========================
async function loadProduksi() {
  const { count, error } = await db
    .from("produksi")
    .select("*", {
      count: "exact",
      head: true,
    })
    .neq("status", "Selesai");

  if (error) {
    console.error(error);

    return;
  }

  document.getElementById("total-produksi").innerText = count || 0;
}

// =========================
// DASHBOARD SUMMARY
// =========================
async function loadDashboardSummary() {
  try {
    // =========================
    // PENJUALAN HEADER
    // =========================
    const { data: penjualan, error: penjualanError } = await db.from("penjualan_header").select(`
        id,
        total
      `);

    if (penjualanError) {
      console.error(penjualanError);

      return;
    }

    // =========================
    // PENJUALAN DETAIL
    // =========================
    const { data: detail, error: detailError } = await db.from("penjualan_detail").select(`
        qty
      `);

    if (detailError) {
      console.error(detailError);

      return;
    }

    // =========================
    // PEMBAYARAN
    // =========================
    const { data: pembayaran, error: pembayaranError } = await db.from("pembayaran").select(`
        arah,
        nominal
      `);

    if (pembayaranError) {
      console.error(pembayaranError);

      return;
    }

    // =========================
    // OMSET
    // =========================
    const omset = (penjualan || []).reduce((a, b) => a + Number(b.total || 0), 0);

    // =========================
    // TOTAL NOTA
    // =========================
    const totalNota = (penjualan || []).length;

    // =========================
    // QTY TERJUAL
    // =========================
    const qtyTerjual = (detail || []).reduce((a, b) => a + Number(b.qty || 0), 0);

    // =========================
    // KAS MASUK
    // =========================
    const kasMasuk = (pembayaran || []).filter((x) => x.arah === "MASUK").reduce((a, b) => a + Number(b.nominal || 0), 0);

    // =========================
    // KAS KELUAR
    // =========================
    const kasKeluar = (pembayaran || []).filter((x) => x.arah === "KELUAR").reduce((a, b) => a + Number(b.nominal || 0), 0);

    // =========================
    // RENDER
    // =========================
    document.getElementById("dashboard-omset").innerText = rupiah(omset);

    document.getElementById("dashboard-nota").innerText = totalNota.toLocaleString("id-ID");

    document.getElementById("dashboard-qty").innerText = qtyTerjual.toLocaleString("id-ID");

    document.getElementById("dashboard-kas-masuk").innerText = rupiah(kasMasuk);

    document.getElementById("dashboard-kas-keluar").innerText = rupiah(kasKeluar);
  } catch (err) {
    console.error(err);
  }
}
