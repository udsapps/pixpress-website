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
      navToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    });

    mobileNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mobileNav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.setAttribute("aria-label", "Open menu");
      });
    });
  }

  // ---------- Tabbed feature showcase (swipeable like Android ViewPager) ----------
  (function () {
    var tabs = document.querySelectorAll(".showcase-tab");
    var wrap = document.querySelector(".showcase-panel-wrap");
    var panels = document.querySelectorAll(".showcase-panel");
    if (!tabs.length || !wrap || !panels.length) return;

    var programmatic = false;
    var programmaticTimer = null;
    var current = 0;

    // Scrolls only the tab strip itself (never the page) to reveal the active pill.
    function revealTab(tab) {
      var strip = tab.parentElement;
      var target = tab.offsetLeft - (strip.clientWidth - tab.offsetWidth) / 2;
      strip.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
    }

    function setActive(index, scrollToPanel) {
      if (index === current && !scrollToPanel) return;
      current = index;
      tabs.forEach(function (t, i) {
        var isActive = i === index;
        t.classList.toggle("is-active", isActive);
        t.setAttribute("aria-selected", isActive ? "true" : "false");
      });
      panels.forEach(function (p, i) {
        p.classList.toggle("is-active", i === index);
        p.setAttribute("aria-hidden", i === index ? "false" : "true");
      });
      revealTab(tabs[index]);
      if (scrollToPanel) {
        programmatic = true;
        panels[index].scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
        window.clearTimeout(programmaticTimer);
        programmaticTimer = window.setTimeout(function () {
          programmatic = false;
        }, 600);
      }
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () {
        setActive(i, true);
      });
    });

    // Detects which panel the user swiped/scrolled to, and syncs the active tab.
    var observer = new IntersectionObserver(
      function (entries) {
        if (programmatic) return;
        entries.forEach(function (entry) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            var index = Array.prototype.indexOf.call(panels, entry.target);
            if (index !== -1) setActive(index, false);
          }
        });
      },
      { root: wrap, threshold: [0.6] }
    );
    panels.forEach(function (p) {
      observer.observe(p);
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
    var heroSection = document.querySelector(".hero");
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

    // Only animate while the hero is actually on screen and the tab is visible:
    // this loop used to run forever in the background, burning CPU/battery for
    // no visible benefit once the user scrolled past it or switched tabs.
    var active = false;
    var pendingTimer = null;
    var rafId = null;

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function runCycle() {
      if (!active) return;
      var start = null;
      progressEl.classList.remove("is-done");

      function step(ts) {
        if (!active) return;
        if (start === null) start = ts;
        var elapsed = ts - start;
        var t = Math.min(1, elapsed / COMPRESS_MS);
        var eased = easeOutCubic(t);
        var currentKb = START_KB - (START_KB - TARGET_KB) * eased;
        valueEl.textContent = formatSize(currentKb);
        progressEl.style.width = eased * 100 + "%";
        if (t < 1) {
          rafId = requestAnimationFrame(step);
        } else {
          progressEl.classList.add("is-done");
          pendingTimer = setTimeout(function () {
            if (!active) return;
            progressEl.classList.remove("is-done");
            valueEl.textContent = formatSize(START_KB);
            progressEl.style.width = "0%";
            pendingTimer = setTimeout(runCycle, RESET_PAUSE_MS);
          }, HOLD_MS);
        }
      }
      rafId = requestAnimationFrame(step);
    }

    function start() {
      if (active) return;
      active = true;
      runCycle();
    }

    function stop() {
      active = false;
      if (rafId) cancelAnimationFrame(rafId);
      if (pendingTimer) clearTimeout(pendingTimer);
      rafId = null;
      pendingTimer = null;
    }

    if (heroSection && "IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting && document.visibilityState === "visible") {
              start();
            } else {
              stop();
            }
          });
        },
        { threshold: 0 }
      );
      io.observe(heroSection);

      document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "hidden") {
          stop();
        } else {
          var rect = heroSection.getBoundingClientRect();
          if (rect.bottom > 0 && rect.top < window.innerHeight) {
            start();
          }
        }
      });
    } else {
      start();
    }
  })();

  // ---------- Hero shot pointer tilt (desktop only) ----------
  (function () {
    var device = document.querySelector(".hero-shot-wrap");
    var visual = document.querySelector(".hero-visual");
    if (!device || !visual) return;
    var canHover = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!canHover || prefersReducedMotion) return;

    // Cache the rect once per hover (it doesn't change mid-gesture) instead of
    // calling getBoundingClientRect() on every mousemove, which forces a
    // layout read dozens of times a second and was a real source of jank.
    var rect = null;
    var pendingEvent = null;
    var rafScheduled = false;

    function applyTilt() {
      rafScheduled = false;
      if (!rect || !pendingEvent) return;
      var relX = (pendingEvent.clientX - rect.left) / rect.width - 0.5;
      var relY = (pendingEvent.clientY - rect.top) / rect.height - 0.5;
      var rotateY = relX * 10;
      var rotateX = relY * -10;
      device.style.transform = "rotateY(" + rotateY + "deg) rotateX(" + rotateX + "deg)";
    }

    visual.addEventListener("mouseenter", function () {
      rect = visual.getBoundingClientRect();
    });
    visual.addEventListener("mousemove", function (e) {
      pendingEvent = e;
      if (!rafScheduled) {
        rafScheduled = true;
        requestAnimationFrame(applyTilt);
      }
    });
    visual.addEventListener("mouseleave", function () {
      rect = null;
      device.style.transform = "";
    });
  })();

  // ---------- Hero floating pixel background ----------
  (function () {
    var canvas = document.getElementById("heroCanvas");
    var heroSection = document.querySelector(".hero");
    if (!canvas || !heroSection) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var DPR = Math.min(window.devicePixelRatio || 1, 2);
    var PARTICLE_COUNT = 34;
    var particles = [];
    var width = 0;
    var height = 0;
    var active = false;
    var rafId = null;

    function themeColors() {
      var styles = getComputedStyle(document.documentElement);
      return [
        (styles.getPropertyValue("--color-primary") || "#2F6FED").trim(),
        (styles.getPropertyValue("--color-accent") || "#16A34A").trim()
      ];
    }

    function resize() {
      width = heroSection.clientWidth;
      height = heroSection.clientHeight;
      canvas.width = width * DPR;
      canvas.height = height * DPR;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    function makeParticles() {
      var colors = themeColors();
      particles = [];
      for (var i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: 3.5 + Math.random() * 4.5,
          speedX: (Math.random() - 0.5) * 0.18,
          speedY: (Math.random() - 0.5) * 0.18,
          color: colors[i % 2],
          opacity: 0.15 + Math.random() * 0.25
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.x < -5) p.x = width + 5;
        if (p.x > width + 5) p.x = -5;
        if (p.y < -5) p.y = height + 5;
        if (p.y > height + 5) p.y = -5;
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
      ctx.globalAlpha = 1;
    }

    function loop() {
      if (!active) return;
      draw();
      rafId = requestAnimationFrame(loop);
    }

    function start() {
      if (active) return;
      active = true;
      rafId = requestAnimationFrame(loop);
    }

    function stop() {
      active = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    }

    resize();
    makeParticles();

    if (prefersReducedMotion) {
      draw();
      return;
    }

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting && document.visibilityState === "visible") {
              start();
            } else {
              stop();
            }
          });
        },
        { threshold: 0 }
      );
      io.observe(heroSection);

      document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "hidden") {
          stop();
        } else {
          var rect = heroSection.getBoundingClientRect();
          if (rect.bottom > 0 && rect.top < window.innerHeight) {
            start();
          }
        }
      });
    } else {
      start();
    }

    var resizeTimer = null;
    window.addEventListener(
      "resize",
      function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
          resize();
          makeParticles();
        }, 200);
      },
      { passive: true }
    );
  })();
})();
