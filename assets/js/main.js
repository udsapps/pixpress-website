(function () {
  "use strict";

  var prefersReducedMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  // ---------- Play Store link attribution ----------
  // Lets one canonical site URL work for every share channel: append ?src=telegram
  // (or ?src=reddit, ?src=quora, ?src=linkedin, etc.) to the link you share, and every
  // "Get it on Google Play" button on the page is tagged with a matching install
  // referrer that Play Console's Acquisition report reads automatically.
  (function () {
    try {
      var SAFE = /^[a-zA-Z0-9_-]{1,40}$/;
      var params = new URLSearchParams(window.location.search);
      var hadExplicitSource = !!(params.get("src") || params.get("utm_source"));

      var source = params.get("src") || params.get("utm_source") || "website";
      var medium = params.get("utm_medium") || (hadExplicitSource ? "social" : "referral");
      var campaign = params.get("utm_campaign") || "landing_page";

      if (!SAFE.test(source)) source = "website";
      if (!SAFE.test(medium)) medium = "referral";
      if (!SAFE.test(campaign)) campaign = "landing_page";

      var referrerValue = "utm_source=" + source + "&utm_medium=" + medium + "&utm_campaign=" + campaign;

      document.querySelectorAll("[data-play-link]").forEach(function (a) {
        try {
          var url = new URL(a.href);
          url.searchParams.set("referrer", referrerValue);
          a.href = url.toString();
        } catch (e) {
          /* malformed href; leave the untagged link as a safe fallback */
        }
      });
    } catch (e) {
      /* URLSearchParams/URL unsupported; links keep working, just untagged */
    }
  })();

  // ---------- Theme toggle ----------
  var THEME_KEY = "pixpress-theme";
  var root = document.documentElement;
  var toggleBtn = document.getElementById("themeToggle");

  function getStoredTheme() {
    try {
      return localStorage.getItem(THEME_KEY);
    } catch (e) {
      return null;
    }
  }

  function setTheme(theme) {
    if (theme === "light" || theme === "dark") {
      root.setAttribute("data-theme", theme);
    } else {
      root.removeAttribute("data-theme");
    }
    try {
      if (theme) {
        localStorage.setItem(THEME_KEY, theme);
      } else {
        localStorage.removeItem(THEME_KEY);
      }
    } catch (e) {
      /* storage unavailable; theme still applies for this page view */
    }
  }

  if (toggleBtn) {
    toggleBtn.addEventListener("click", function () {
      var current = root.getAttribute("data-theme");
      var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      var effectiveIsDark = current ? current === "dark" : prefersDark;
      setTheme(effectiveIsDark ? "light" : "dark");
      toggleBtn.setAttribute("aria-pressed", String(!effectiveIsDark));
    });
  }

  // ---------- Mobile nav ----------
  var navToggle = document.getElementById("navToggle");
  var mobileNav = document.getElementById("mobileNav");

  if (navToggle && mobileNav) {
    navToggle.addEventListener("click", function () {
      var isOpen = mobileNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    mobileNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mobileNav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // ---------- Tabbed feature showcase ----------
  (function () {
    var tabs = document.querySelectorAll(".showcase-tab");
    if (!tabs.length) return;
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) {
          t.classList.remove("is-active");
          t.setAttribute("aria-selected", "false");
        });
        tab.classList.add("is-active");
        tab.setAttribute("aria-selected", "true");
        document.querySelectorAll(".showcase-panel").forEach(function (p) {
          p.classList.remove("is-active");
          p.hidden = true;
        });
        var panel = document.getElementById(tab.getAttribute("aria-controls"));
        if (panel) {
          panel.hidden = false;
          panel.classList.add("is-active");
        }
      });
    });
  })();

  // ---------- Current year in footer ----------
  var yearEl = document.getElementById("currentYear");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  // ---------- Sticky header scroll state ----------
  var header = document.querySelector(".site-header");
  if (header) {
    var onHeaderScroll = function () {
      if (window.scrollY > 8) {
        header.classList.add("is-scrolled");
      } else {
        header.classList.remove("is-scrolled");
      }
    };
    document.addEventListener("scroll", onHeaderScroll, { passive: true });
    onHeaderScroll();
  }

  // ---------- Scroll-reveal ----------
  var revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length) {
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      revealEls.forEach(function (el) {
        el.classList.add("is-visible");
      });
    } else {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
      );
      revealEls.forEach(function (el) {
        io.observe(el);
      });
    }
  }

  // ---------- Hero live compression stat badge ----------
  (function () {
    var valueEl = document.getElementById("demoValue");
    var progressEl = document.getElementById("demoProgress");
    if (!valueEl || !progressEl) return;

    var START_KB = 2400;
    var TARGET_KB = 100;

    function formatSize(kb) {
      if (kb >= 1000) {
        return (kb / 1000).toFixed(1) + " MB";
      }
      return Math.round(kb) + " KB";
    }

    if (prefersReducedMotion) {
      valueEl.textContent = formatSize(TARGET_KB);
      progressEl.style.width = "100%";
      progressEl.classList.add("is-done");
      return;
    }

    var COMPRESS_MS = 1700;
    var HOLD_MS = 1600;
    var RESET_PAUSE_MS = 650;

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function runCycle() {
      var start = null;
      progressEl.classList.remove("is-done");

      function step(ts) {
        if (start === null) start = ts;
        var elapsed = ts - start;
        var t = Math.min(1, elapsed / COMPRESS_MS);
        var eased = easeOutCubic(t);
        var currentKb = START_KB - (START_KB - TARGET_KB) * eased;
        valueEl.textContent = formatSize(currentKb);
        progressEl.style.width = eased * 100 + "%";
        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          progressEl.classList.add("is-done");
          setTimeout(function () {
            progressEl.classList.remove("is-done");
            valueEl.textContent = formatSize(START_KB);
            progressEl.style.width = "0%";
            setTimeout(runCycle, RESET_PAUSE_MS);
          }, HOLD_MS);
        }
      }
      requestAnimationFrame(step);
    }

    runCycle();
  })();

  // ---------- Hero shot pointer tilt (desktop only) ----------
  (function () {
    var device = document.querySelector(".hero-shot-wrap");
    var visual = document.querySelector(".hero-visual");
    if (!device || !visual) return;
    var canHover = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!canHover || prefersReducedMotion) return;

    visual.addEventListener("mousemove", function (e) {
      var rect = visual.getBoundingClientRect();
      var relX = (e.clientX - rect.left) / rect.width - 0.5;
      var relY = (e.clientY - rect.top) / rect.height - 0.5;
      var rotateY = relX * 10;
      var rotateX = relY * -10;
      device.style.transform = "rotateY(" + rotateY + "deg) rotateX(" + rotateX + "deg)";
    });
    visual.addEventListener("mouseleave", function () {
      device.style.transform = "";
    });
  })();
})();
