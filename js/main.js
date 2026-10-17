(() => {
  const nav = document.getElementById("nav");
  const toggle = document.getElementById("navToggle");
  const drawer = document.getElementById("navDrawer");
  const year = document.getElementById("year");
  const form = document.getElementById("contactForm");
  const formNote = document.getElementById("formNote");
  const hero = document.getElementById("home");
  const heroVideo = document.getElementById("heroVideo");

  if (year) year.textContent = String(new Date().getFullYear());

  /* Hero video: muted loop; fall back to poster when motion is reduced or play fails */
  if (heroVideo && hero) {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const markReady = () => hero.classList.add("is-video-ready");
    if (reduce) {
      heroVideo.removeAttribute("autoplay");
      heroVideo.pause();
    } else {
      const tryPlay = () => {
        const play = heroVideo.play();
        if (play && typeof play.then === "function") {
          play.then(markReady).catch(() => {});
        } else {
          markReady();
        }
      };
      if (heroVideo.readyState >= 2) tryPlay();
      else heroVideo.addEventListener("loadeddata", tryPlay, { once: true });
      heroVideo.addEventListener("playing", markReady, { once: true });
    }
  }

  const onScroll = () => {
    if (!nav) return;
    nav.classList.toggle("is-solid", window.scrollY > 24);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (toggle && drawer) {
    toggle.addEventListener("click", () => {
      const open = drawer.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    drawer.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        drawer.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  const navAnchors = document.querySelectorAll(".nav__links a[href^='#'], .nav__drawer a[href^='#']");
  const watched = [];
  navAnchors.forEach((anchor) => {
    const id = anchor.getAttribute("href");
    const section = id ? document.querySelector(id) : null;
    if (!section || watched.includes(section)) return;
    watched.push(section);
  });
  const markCurrent = (id) => {
    navAnchors.forEach((anchor) => {
      anchor.classList.toggle("is-current", anchor.getAttribute("href") === id);
    });
  };
  if ("IntersectionObserver" in window && watched.length) {
    const spy = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) markCurrent(`#${visible.target.id}`);
      },
      { rootMargin: "-40% 0px -45% 0px", threshold: [0.15, 0.4] }
    );
    watched.forEach((section) => spy.observe(section));
  }

  const reveal = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    reveal.forEach((el) => io.observe(el));
  } else {
    reveal.forEach((el) => el.classList.add("is-in"));
  }

  const counters = document.querySelectorAll("[data-count]");
  const animateCount = (el) => {
    const target = Number(el.getAttribute("data-count") || 0);
    const duration = 1100;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = String(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if ("IntersectionObserver" in window) {
    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            cio.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    counters.forEach((el) => cio.observe(el));
  }

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (formNote) {
      formNote.hidden = false;
      form.reset();
    }
  });
})();
