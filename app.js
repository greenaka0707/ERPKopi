import { db } from "./services/supabase.js";

import { state } from "./utils/state.js";

import { initDashboard } from "./services/dashboard.js";

// =========================
// TRANSAKSI
// =========================
import { initPembelian } from "./services/pembelian.js";

import { initPenjualan } from "./services/penjualan.js";

import { initProduksi } from "./services/produksi.js";

// =========================
// DATA
// =========================
import { initDataPembelian } from "./services/data-pembelian.js";

import { initDataPenjualan } from "./services/data-penjualan.js";

import { initDataProduksi } from "./services/data-produksi.js";

import { initDataPembayaran } from "./services/data-pembayaran.js";

// =========================
// DETAIL
// =========================
import { initDetailPenjualan } from "./services/detail-penjualan.js";

import { initDetailProduksi } from "./services/detail-produksi.js";

import { initDetailHutang } from "./services/detail-hutang.js";

// =========================
// KEUANGAN
// =========================
import { initHutang } from "./services/hutang.js";

import { initPiutang } from "./services/piutang.js";

import { initKas } from "./services/kas.js";

// =========================
// STOK
// =========================
import { initStok } from "./services/stok.js";

// =========================
// AUTH
// =========================
import { initLogin } from "./services/login.js";

/* =========================
   LOAD COMPONENT
========================= */
async function loadComponent(id, file) {
  try {
    const res = await fetch(file);

    if (!res.ok) {
      throw new Error(`Component ${file} tidak ditemukan`);
    }

    const html = await res.text();

    document.getElementById(id).innerHTML = html;
  } catch (err) {
    console.error(err);
  }
}

/* =========================
   ACTIVE MENU
========================= */
function setActiveMenu(page) {
  // SIDEBAR
  document.querySelectorAll(".sidebar-wrapper button").forEach((btn) => {
    btn.classList.remove("active");

    if (btn.dataset.page === page) {
      btn.classList.add("active");
    }
  });

  // NAVBAR
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.remove("active");

    if (btn.dataset.page === page) {
      btn.classList.add("active");
    }
  });
}

/* =========================
   LOAD PAGE
========================= */
window.loadPage = async function (page) {
  const app = document.getElementById("app");

  const loader = document.getElementById("page-loader");

  if (!app) return;

  try {
    // =========================
    // SHOW LOADER
    // =========================
    loader?.classList.add("show");

    app.classList.add("page-loading");

    // =========================
    // FETCH HTML
    // =========================
    const res = await fetch(`pages/${page}.html`);

    if (!res.ok) {
      throw new Error("Page not found");
    }

    const html = await res.text();

    // =========================
    // SMALL DELAY
    // =========================
    await new Promise((resolve) => setTimeout(resolve, 180));

    // =========================
    // RENDER HTML
    // =========================
    app.innerHTML = html;

    // =========================
    // CLOSE MOBILE SIDEBAR
    // =========================
    document.getElementById("sidebar")?.classList.remove("show");

    document.getElementById("sidebar-overlay")?.classList.remove("show");

    // =========================
    // ACTIVE SIDEBAR
    // =========================
    document.querySelectorAll(".sidebar-menu button").forEach((btn) => {
      btn.classList.remove("active");

      if (btn.dataset.page === page) {
        btn.classList.add("active");
      }
    });

    // =========================
    // ACTIVE NAVBAR
    // =========================
    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.classList.remove("active");

      if (btn.dataset.page === page) {
        btn.classList.add("active");
      }
    });

    // =========================
    // ICON
    // =========================
    if (window.lucide) {
      lucide.createIcons();
    }

    // =========================
    // INIT PAGE
    // =========================
    switch (page) {
      case "login":
        initLogin();
        break;
      case "dashboard":
        await initDashboard();
        break;

      case "stok":
        await initStok();
        break;

      case "data-pembayaran":
        await initDataPembayaran();
        break;

      case "data-penjualan":
        await initDataPenjualan();
        break;

      case "data-pembelian":
        await initDataPembelian();
        break;

      case "data-produksi":
        await initDataProduksi();
        break;

      case "hutang":
        await initHutang();
        break;

      case "piutang":
        await initPiutang();
        break;

      case "kas":
        await initKas();
        break;

      case "penjualan":
        await initPenjualan();
        break;

      case "pembelian":
        await initPembelian();
        break;

      case "produksi":
        await initProduksi();
        break;
    }

    // =========================
    // SHOW PAGE
    // =========================
    requestAnimationFrame(() => {
      app.classList.remove("page-loading");
    });
  } catch (err) {
    console.error(err);

    alert("Gagal load halaman");
  } finally {
    // =========================
    // HIDE LOADER
    // =========================
    setTimeout(() => {
      loader?.classList.remove("show");
    }, 150);
  }
};

/* =========================
   BOOTSTRAP
========================= */
async function bootstrap() {
  try {
    // =========================
    // COMPONENT
    // =========================
    await loadComponent("sidebar", "./components/sidebar.html");

    await loadComponent("navbar", "./components/navbar.html");

    // =========================
    // ICON
    // =========================
    if (window.lucide) {
      lucide.createIcons();
    }

    // =========================
    // SIDEBAR
    // =========================
    initSidebar();

    // =========================
    // MOBILE
    // =========================
    initMobileSidebar();

    // =========================
    // DEFAULT PAGE
    // =========================
    await loadPage("dashboard");
    await loadUserProfile();
  } catch (err) {
    console.error(err);
  }
}

/* =========================
   SIDEBAR
========================= */
function initSidebar() {
  const sidebar = document.querySelector(".sidebar-wrapper");

  const btnSidebar = document.getElementById("btn-sidebar-toggle");

  const overlay = document.getElementById("sidebar-overlay");

  if (!sidebar || !btnSidebar) return;

  // =========================
  // LOAD STATE
  // =========================
  const isMini = localStorage.getItem("sidebar-mini") === "true";

  if (window.innerWidth > 768 && isMini) {
    sidebar.classList.add("mini");

    btnSidebar.innerHTML = `
      <i data-lucide="panel-left-open"></i>
    `;
  }

  // =========================
  // TOGGLE
  // =========================
  btnSidebar.onclick = () => {
    // MOBILE
    if (window.innerWidth <= 768) {
      document.getElementById("sidebar")?.classList.remove("show");

      overlay?.classList.remove("show");

      return;
    }

    // DESKTOP
    sidebar.classList.toggle("mini");

    const mini = sidebar.classList.contains("mini");

    localStorage.setItem("sidebar-mini", mini);

    btnSidebar.innerHTML = mini
      ? `
        <i data-lucide="panel-left-open"></i>
      `
      : `
        <i data-lucide="panel-left-close"></i>
      `;

    if (window.lucide) {
      lucide.createIcons();
    }
  };

  if (window.lucide) {
    lucide.createIcons();
  }
}

/* =========================
   MOBILE SIDEBAR
========================= */
function initMobileSidebar() {
  const btn = document.getElementById("btn-mobile-sidebar");

  const sidebar = document.getElementById("sidebar");

  const overlay = document.getElementById("sidebar-overlay");

  if (!sidebar || !overlay) return;

  // =========================
  // OPEN
  // =========================
  if (btn) {
    btn.addEventListener("click", () => {
      sidebar.classList.add("show");

      overlay.classList.add("show");
    });
  }

  // =========================
  // CLOSE OVERLAY
  // =========================
  overlay.addEventListener("click", () => {
    sidebar.classList.remove("show");

    overlay.classList.remove("show");
  });

  // =========================
  // CLOSE AFTER MENU CLICK
  // =========================
  document.querySelectorAll(".sidebar-menu button").forEach((menuBtn) => {
    menuBtn.addEventListener("click", () => {
      if (window.innerWidth <= 768) {
        sidebar.classList.remove("show");

        overlay.classList.remove("show");
      }
    });
  });

  // =========================
  // RESIZE RESET
  // =========================
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      sidebar.classList.remove("show");

      overlay.classList.remove("show");
    }
  });
}

/* =========================
   AUTH CHECK
========================= */
async function checkAuth() {
  try {
    const {
      data: { session },
    } = await db.auth.getSession();

    // =========================
    // BELUM LOGIN
    // =========================
    if (!session) {
      // HIDE LAYOUT
      document.getElementById("sidebar").innerHTML = "";

      document.getElementById("navbar").innerHTML = "";

      // LOAD LOGIN
      await loadPage("login");

      return;
    }

    // =========================
    // SUDAH LOGIN
    // =========================
    await bootstrap();
  } catch (err) {
    console.error(err);
  }
}
/* =========================
   LOGOUT
========================= */
window.logout = async function () {
  const confirmLogout = confirm("Yakin ingin logout?");

  if (!confirmLogout) return;

  try {
    await db.auth.signOut();

    location.reload();
  } catch (err) {
    console.error(err);

    alert("Gagal logout");
  }
};

/* =========================
   LOAD USER
========================= */
async function loadUserProfile() {
  try {
    const {
      data: { user },
    } = await db.auth.getUser();

    if (!user) return;

    // =========================
    // PROFILE
    // =========================
    const { data: profile, error } = await db
      .from("users_profile")
      .select(
        `
        nama,
        role
      `,
      )
      .eq("id", user.id)
      .single();

    if (error) {
      console.error(error);
    }

    // =========================
    // DATA
    // =========================
    const nama = profile?.nama || user.email || "User";

    const role = profile?.role || "operator";

    // =========================
    // AVATAR
    // =========================
    const avatar = nama.charAt(0).toUpperCase();

    // =========================
    // ELEMENT
    // =========================
    const avatarEl = document.getElementById("navbar-avatar");

    const nameEl = document.getElementById("navbar-user-name");

    const roleEl = document.getElementById("navbar-user-role");

    // =========================
    // RENDER
    // =========================
    if (avatarEl) {
      avatarEl.innerText = avatar;
    }

    if (nameEl) {
      nameEl.innerText = nama;
    }

    if (roleEl) {
      roleEl.innerText = role.toUpperCase();
    }
  } catch (err) {
    console.error(err);
  }
}

// =========================
// GLOBAL LOADER
// =========================
function showLoader() {
  document.getElementById("page-loader")?.classList.add("show");
}

function hideLoader() {
  document.getElementById("page-loader")?.classList.remove("show");
}

/* =========================
   GLOBAL ROUTE
========================= */
window.loadPage = loadPage;

/* =========================
   START APP
========================= */
checkAuth();
