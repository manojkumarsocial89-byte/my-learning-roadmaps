/**
 * shared/roadmap.js
 * Common logic for all roadmap pages.
 * Each page calls initRoadmap({ storageKey, themeKey, phaseIds }) on DOMContentLoaded.
 */

(function () {
  // ── THEME ──────────────────────────────────────────────
  window.setTheme = function (t, themeKey) {
    document.documentElement.setAttribute("data-theme", t);
    const btnDark = document.getElementById("btn-dark");
    const btnLight = document.getElementById("btn-light");
    if (btnDark) btnDark.classList.toggle("active", t === "dark");
    if (btnLight) btnLight.classList.toggle("active", t === "light");
    try {
      localStorage.setItem(themeKey, t);
      if (window.onRoadmapStateChange) {
        window.onRoadmapStateChange(themeKey, t);
      }
    } catch (e) {}
  };

  // ── TOPIC EXPAND/COLLAPSE ───────────────────────────────
  window.toggleTopic = function (id) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle("open");
  };

  // ── MARK DONE ──────────────────────────────────────────
  window.markDone = function (e, id) {
    e.stopPropagation();
    const el = document.getElementById(id);
    if (!el) return;
    const isDone = el.classList.toggle("done-topic");
    const check = el.querySelector(".topic-check");
    if (check) check.textContent = isDone ? "✓" : "";
    window._roadmapSave();
    window._roadmapUpdateProgress();
  };

  // ── SKIP PHASE ─────────────────────────────────────────
  window.skipPhase = function (containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.querySelectorAll(".topic").forEach((t) => {
      t.classList.add("done-topic");
      const c = t.querySelector(".topic-check");
      if (c) c.textContent = "✓";
    });
    window._roadmapSave();
    window._roadmapUpdateProgress();
  };

  // ── MOBILE SIDEBAR ─────────────────────────────────────
  function initMobileSidebar() {
    const btn = document.querySelector(".mobile-menu-btn");
    const sidebar = document.querySelector(".sidebar");
    const overlay = document.querySelector(".sidebar-overlay");
    if (!btn || !sidebar) return;

    btn.addEventListener("click", () => {
      sidebar.classList.toggle("open");
      if (overlay) overlay.classList.toggle("open");
    });
    if (overlay) {
      overlay.addEventListener("click", () => {
        sidebar.classList.remove("open");
        overlay.classList.remove("open");
      });
    }
    // Close sidebar on nav link click (mobile)
    sidebar.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", () => {
        if (window.innerWidth <= 820) {
          sidebar.classList.remove("open");
          if (overlay) overlay.classList.remove("open");
        }
      });
    });
  }

  // ── INIT ───────────────────────────────────────────────
  window.initRoadmap = function ({ storageKey, themeKey, phaseIds }) {
    // ── Save / Load ──
    window._roadmapSave = function () {
      const state = {};
      document.querySelectorAll(".topic").forEach((t) => {
        state[t.id] = t.classList.contains("done-topic");
      });
      try {
        localStorage.setItem(storageKey, JSON.stringify(state));
        if (window.onRoadmapStateChange) {
          window.onRoadmapStateChange(storageKey, state);
        }
      } catch (e) {}
    };

    function loadState() {
      try {
        const state = JSON.parse(localStorage.getItem(storageKey) || "{}");
        Object.entries(state).forEach(([id, done]) => {
          if (!done) return;
          const el = document.getElementById(id);
          if (el) {
            el.classList.add("done-topic");
            const c = el.querySelector(".topic-check");
            if (c) c.textContent = "✓";
          }
        });
      } catch (e) {}
    }

    // ── Progress ──
    function updateNavDone() {
      const navLinks = document.querySelectorAll(".nav-link");
      phaseIds.forEach((id, i) => {
        const phaseEl = document.getElementById(id);
        if (!phaseEl) return;
        const all = phaseEl.querySelectorAll(".topic");
        const done = phaseEl.querySelectorAll(".topic.done-topic");
        if (navLinks[i] && all.length > 0 && all.length === done.length)
          navLinks[i].classList.add("section-done");
        else if (navLinks[i]) navLinks[i].classList.remove("section-done");
      });
    }

    window._roadmapUpdateProgress = function () {
      const all = document.querySelectorAll(".topic");
      const done = document.querySelectorAll(".topic.done-topic");
      const pct = all.length ? Math.round((done.length / all.length) * 100) : 0;
      const pctEl = document.getElementById("prog-pct");
      const fillEl = document.getElementById("prog-fill");
      const countEl = document.getElementById("prog-counts");
      if (pctEl) pctEl.textContent = pct + "%";
      if (fillEl) fillEl.style.width = pct + "%";
      if (countEl)
        countEl.textContent = done.length + " / " + all.length + " topics done";
      updateNavDone();
    };

    // ── Theme init ──
    try {
      const saved = localStorage.getItem(themeKey);
      if (saved) setTheme(saved, themeKey);
    } catch (e) {}

    // ── Intersection observer for nav highlight ──
    const phases = document.querySelectorAll(".phase");
    const navLinks = document.querySelectorAll(".nav-link");
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const id = e.target.id;
            navLinks.forEach((l) =>
              l.classList.toggle("active", l.getAttribute("href") === "#" + id),
            );
          }
        });
      },
      { threshold: 0.15, rootMargin: "-70px 0px -55% 0px" },
    );
    phases.forEach((p) => obs.observe(p));

    // ── Mobile sidebar ──
    initMobileSidebar();

    // ── Boot ──
    loadState();
    window._roadmapUpdateProgress();
  };
})();
