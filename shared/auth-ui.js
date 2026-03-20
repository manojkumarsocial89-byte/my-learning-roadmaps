/**
 * shared/auth-ui.js
 * Single source of truth for: theme, loader, auth modal, and sync.
 * Import and call initAuth() on every page.
 */

import { login, signup, logout, onAuthChange } from "./auth.js";
import { syncLocalStorageWithFirestore, saveProgress } from "./db.js";

/* ─── Constants ─────────────────────────────────────────── */
export const THEME_KEY = "hub-theme";

/* ─── Module-level user id ──────────────────────────────── */
let _uid = null;

/* ═══════════════════════════════════════════════════════════
   LOADER
══════════════════════════════════════════════════════════════ */
export function showLoader(msg = "Loading...") {
  const el = document.getElementById("page-loader");
  const txt = document.getElementById("page-loader-text");
  if (txt) txt.textContent = msg;
  if (el) el.classList.add("visible");
}

export function hideLoader() {
  document.getElementById("page-loader")?.classList.remove("visible");
}

/* ═══════════════════════════════════════════════════════════
   THEME  — single global key, saves to Firestore when logged in
══════════════════════════════════════════════════════════════ */
export function setTheme(t) {
  document.documentElement.setAttribute("data-theme", t);
  document.getElementById("btn-dark")?.classList.toggle("active", t === "dark");
  document
    .getElementById("btn-light")
    ?.classList.toggle("active", t === "light");
  try {
    localStorage.setItem(THEME_KEY, t);
  } catch (e) {}
  if (_uid) saveProgress(_uid, { [THEME_KEY]: t });
}

// Expose to window so onclick="setTheme('dark')" works in HTML
window.setTheme = setTheme;

// Re-apply stored theme now that the DOM is ready (modules run after parse)
(function applyStoredTheme() {
  try {
    const t = localStorage.getItem(THEME_KEY);
    if (t) setTheme(t);
  } catch (e) {}
})();

/* ═══════════════════════════════════════════════════════════
   AUTH INIT
   Call once per page after importing this module.

   opts.containerId  – ID of the element that shows Login button / user info
   opts.mode         – 'topbar' | 'sidebar'  (controls layout)
   opts.onLogin      – optional callback(user) after sync completes
   opts.onLogout     – optional callback() on sign-out
══════════════════════════════════════════════════════════════ */
export function initAuth({
  containerId = "auth-container",
  mode = "topbar",
  onLogin,
  onLogout,
} = {}) {
  const modal = document.getElementById("auth-modal");
  if (!modal) return;

  const authForm = document.getElementById("auth-form");
  const emailInput = document.getElementById("auth-email");
  const passInput = document.getElementById("auth-password");
  const submitBtn = document.getElementById("auth-submit");
  const errorEl = document.getElementById("auth-error");
  const switchLink = document.getElementById("auth-switch-link");

  let isLoginMode = true;

  /* ── Modal open / close ── */
  document.addEventListener("click", (e) => {
    const id = e.target.id;
    if (id === "login-trigger" || id === "login-trigger-new") {
      modal.classList.add("active");
    } else if (id === "modal-close" || e.target === modal) {
      modal.classList.remove("active");
    }
  });

  /* ── Toggle login ↔ signup ── */
  if (switchLink) {
    switchLink.onclick = () => {
      isLoginMode = !isLoginMode;
      if (submitBtn) submitBtn.textContent = isLoginMode ? "Login" : "Sign Up";
      switchLink.textContent = isLoginMode
        ? "Don't have an account? Sign up"
        : "Already have an account? Login";
    };
  }

  /* ── Form submit ── */
  if (authForm) {
    authForm.onsubmit = async (e) => {
      e.preventDefault();
      if (errorEl) errorEl.style.display = "none";
      showLoader("Signing you in...");
      try {
        if (isLoginMode) await login(emailInput.value, passInput.value);
        else await signup(emailInput.value, passInput.value);
        modal.classList.remove("active");
      } catch (err) {
        if (errorEl) {
          errorEl.textContent = err.message;
          errorEl.style.display = "block";
        }
      } finally {
        hideLoader();
      }
    };
  }

  /* ── Auth state listener ── */
  onAuthChange(async (user) => {
    _uid = user ? user.uid : null;

    // Register hook so roadmap.js can persist topic progress
    window.onRoadmapStateChange = user
      ? (key, data) => saveProgress(_uid, { [key]: data })
      : null;

    _renderContainer(document.getElementById(containerId), user, mode);

    if (user) {
      if (!sessionStorage.getItem("synced")) {
        showLoader("Syncing your progress...");
      }

      const synced = await syncLocalStorageWithFirestore(user.uid);

      if (synced && !sessionStorage.getItem("synced")) {
        // First sync on this session — reload to apply cloud data
        sessionStorage.setItem("synced", "true");
        location.reload();
        return; // loader stays during reload — no flash
      }

      hideLoader();
      if (onLogin) onLogin(user);
    } else {
      hideLoader();
      if (onLogout) onLogout();
    }
  });
}

/* ─── Internal: render login button or user info ──────────── */
function _renderContainer(container, user, mode) {
  if (!container) return;

  if (user) {
    container.innerHTML =
      mode === "sidebar"
        ? `<div style="display:flex;flex-direction:column;gap:8px;">
           <div style="font-size:10px;color:var(--a1);text-overflow:ellipsis;
                       overflow:hidden;white-space:nowrap;">${user.email}</div>
           <button class="auth-btn" id="logout-btn"
                   style="width:100%;justify-content:center;">Logout</button>
         </div>`
        : `<div class="auth-user-info">
           <span class="user-email">${user.email}</span>
           <button class="auth-btn" id="logout-btn">Logout</button>
         </div>`;

    document.getElementById("logout-btn")?.addEventListener("click", () => {
      sessionStorage.removeItem("synced");
      logout();
    });
  } else {
    const label = mode === "topbar" ? "Login / Signup" : "Login to Sync";
    const sideStyle =
      mode === "sidebar" ? ' style="width:100%;justify-content:center;"' : "";
    container.innerHTML = `<button class="auth-btn" id="login-trigger-new"${sideStyle}>${label}</button>`;
  }
}
