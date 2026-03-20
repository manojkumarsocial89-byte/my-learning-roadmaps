/**
 * shared/roadmap.js
 * Core roadmap logic. auth-ui.js handles theme Firestore sync.
 * initRoadmap({ storageKey, phaseIds })  ← themeKey removed
 */
(function () {
  const THEME_KEY = "hub-theme";

  /* ── Theme (minimal; auth-ui.js overrides window.setTheme with full version) ── */
  window.setTheme = function (t) {
    document.documentElement.setAttribute("data-theme", t);
    document
      .getElementById("btn-dark")
      ?.classList.toggle("active", t === "dark");
    document
      .getElementById("btn-light")
      ?.classList.toggle("active", t === "light");
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch (e) {}
    // auth-ui.js wires window.onRoadmapStateChange to persist theme to Firestore
    if (window.onRoadmapStateChange) {
      window.onRoadmapStateChange(THEME_KEY, t);
    }
  };

  /* ── Topic expand / collapse ── */
  window.toggleTopic = function (id) {
    document.getElementById(id)?.classList.toggle("open");
  };

  /* ── Mark topic done ── */
  window.markDone = function (e, id) {
    e.stopPropagation();
    const el = document.getElementById(id);
    if (!el) return;
    const done = el.classList.toggle("done-topic");
    const check = el.querySelector(".topic-check");
    if (check) check.textContent = done ? "✓" : "";
    window._roadmapSave();
    window._roadmapUpdateProgress();
  };

  /* ── Skip phase ── */
  window.skipPhase = function (containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.querySelectorAll(".topic").forEach((t) => {
      t.classList.add("done-topic");
      const c = t.querySelector(".topic-check");
      if (c) c.textContent = "✓";
    });
    window._roadmapSave();
    window._roadmapUpdateProgress();
  };

  /* ── Mobile sidebar ── */
  function initMobileSidebar() {
    const btn = document.querySelector(".mobile-menu-btn");
    const sidebar = document.querySelector(".sidebar");
    const overlay = document.querySelector(".sidebar-overlay");
    if (!btn || !sidebar) return;

    btn.addEventListener("click", () => {
      sidebar.classList.toggle("open");
      overlay?.classList.toggle("open");
    });
    overlay?.addEventListener("click", () => {
      sidebar.classList.remove("open");
      overlay.classList.remove("open");
    });
    sidebar.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", () => {
        if (window.innerWidth <= 820) {
          sidebar.classList.remove("open");
          overlay?.classList.remove("open");
        }
      });
    });
  }

  /* ══════════════════════════════════════
     MAIN INIT  — called by each roadmap page
  ══════════════════════════════════════ */
  window.initRoadmap = function ({ storageKey, phaseIds }) {
    /* Save state to localStorage (+ Firestore via hook if logged in) */
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

    /* Load state from localStorage */
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

    /* Update sidebar nav checkmarks */
    function updateNavDone() {
      const links = document.querySelectorAll(".nav-link");
      phaseIds.forEach((id, i) => {
        const phase = document.getElementById(id);
        if (!phase) return;
        const all = phase.querySelectorAll(".topic");
        const done = phase.querySelectorAll(".topic.done-topic");
        if (links[i]) {
          links[i].classList.toggle(
            "section-done",
            all.length > 0 && all.length === done.length,
          );
        }
      });
    }

    /* Update progress bar */
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
        countEl.textContent = `${done.length} / ${all.length} topics done`;
      updateNavDone();
    };

    /* Apply saved theme */
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved) window.setTheme(saved);
    } catch (e) {}

    /* Nav highlight on scroll */
    const phases = document.querySelectorAll(".phase");
    const links = document.querySelectorAll(".nav-link");
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            links.forEach((l) =>
              l.classList.toggle("active", l.getAttribute("href") === "#" + id),
            );
          }
        });
      },
      { threshold: 0.15, rootMargin: "-70px 0px -55% 0px" },
    );
    phases.forEach((p) => obs.observe(p));

    initMobileSidebar();
    loadState();
    window._roadmapUpdateProgress();
  };
})();
