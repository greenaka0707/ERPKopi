import { db } from "./supabase.js";

// =========================
// INIT
// =========================
export function initLogin() {
  const btn = document.getElementById("btn-login");

  if (!btn) return;

  btn.addEventListener("click", login);
}

// =========================
// LOGIN
// =========================
async function login() {
  const email = document.getElementById("email").value;

  const password = document.getElementById("password").value;

  if (!email || !password) {
    alert("Lengkapi email dan password");

    return;
  }

  const { error } = await db.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    alert(error.message);

    return;
  }

  location.reload();
}
