(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* menu */
  const menuBtn = $(".menu-btn");
  const mobileNav = $("#mobile-nav");
  if (menuBtn && mobileNav) {
    menuBtn.addEventListener("click", () => {
      const open = mobileNav.hasAttribute("hidden");
      if (open) mobileNav.removeAttribute("hidden");
      else mobileNav.setAttribute("hidden", "");
      menuBtn.setAttribute("aria-expanded", String(open));
    });
    mobileNav.addEventListener("click", (e) => {
      if (e.target.closest("a")) {
        mobileNav.setAttribute("hidden", "");
        menuBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* custom cursor */
  const cursor = $(".cursor");
  const cursorLabel = $(".cursor-label");
  if (cursor && fine) {
    document.body.classList.add("has-cursor");
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let cx = x;
    let cy = y;
    const setLabel = (t) => {
      const label = t?.closest?.("[data-cursor]")?.dataset.cursor || "";
      cursorLabel.textContent = label;
      cursor.classList.toggle("is-hot", !!label);
    };
    document.addEventListener("pointermove", (e) => {
      x = e.clientX;
      y = e.clientY;
      setLabel(e.target);
    }, { passive: true });
    document.addEventListener("pointerover", (e) => setLabel(e.target), { passive: true });
    document.addEventListener("mouseleave", () => { cursor.style.opacity = "0"; });
    document.addEventListener("mouseenter", () => { cursor.style.opacity = "1"; });
    const tick = () => {
      const ease = reduce ? 1 : 0.28;
      cx += (x - cx) * ease;
      cy += (y - cy) * ease;
      cursor.style.transform = `translate(${cx}px, ${cy}px)`;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* draggable hero cards */
  const board = $("#hero-board");
  if (board) {
    $$("[data-drag]", board).forEach((card) => {
      let dragging = false;
      let moved = false;
      let sx = 0;
      let sy = 0;
      let ox = 0;
      let oy = 0;
      const apply = () => {
        card.style.transform = `translate(${ox}px, ${oy}px)`;
      };
      card.addEventListener("pointerdown", (e) => {
        if (e.button != null && e.button !== 0) return;
        dragging = true;
        moved = false;
        sx = e.clientX - ox;
        sy = e.clientY - oy;
        card.classList.add("is-dragging");
        card.setPointerCapture(e.pointerId);
      });
      card.addEventListener("pointermove", (e) => {
        if (!dragging) return;
        const nx = e.clientX - sx;
        const ny = e.clientY - sy;
        if (Math.abs(nx - ox) + Math.abs(ny - oy) > 3) moved = true;
        ox = nx;
        oy = ny;
        apply();
      });
      const end = (e) => {
        if (!dragging) return;
        dragging = false;
        card.classList.remove("is-dragging");
        if (card.hasPointerCapture?.(e.pointerId)) card.releasePointerCapture(e.pointerId);
        if (moved) {
          card.dataset.didDrag = "1";
          setTimeout(() => { delete card.dataset.didDrag; }, 80);
        }
      };
      card.addEventListener("pointerup", end);
      card.addEventListener("pointercancel", end);
      card.addEventListener("click", (e) => {
        if (card.dataset.didDrag) {
          e.preventDefault();
          e.stopPropagation();
        }
      }, true);
    });
  }

  /* filter + FLIP */
  const filterBtns = $$(".filters button");
  const posterGrid = $("#poster-grid");
  const posters = $$(".poster-card");
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.filter;
      filterBtns.forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-selected", String(on));
      });
      const first = new Map(posters.map((c) => [c, c.getBoundingClientRect()]));
      posters.forEach((card) => {
        const show = key === "all" || card.dataset.series === key;
        card.classList.toggle("is-hidden", !show);
      });
      if (reduce) return;
      posters.forEach((card) => {
        if (card.classList.contains("is-hidden")) return;
        const last = card.getBoundingClientRect();
        const f = first.get(card);
        const dx = f.left - last.left;
        const dy = f.top - last.top;
        if (dx || dy) {
          card.animate(
            [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0, 0)" }],
            { duration: 420, easing: "cubic-bezier(.2,.8,.2,1)" }
          );
        } else if (first.get(card).width === 0) {
          card.animate(
            [{ opacity: 0, transform: "scale(0.92)" }, { opacity: 1, transform: "scale(1)" }],
            { duration: 320, easing: "cubic-bezier(.2,.8,.2,1)" }
          );
        }
      });
    });
  });

  /* films */
  const video = $("#film-video");
  const filmCaption = $("#film-caption");
  const filmBtns = $$(".film-item");
  filmBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filmBtns.forEach((b) => b.classList.toggle("is-on", b === btn));
      if (!video) return;
      const src = btn.dataset.src;
      const poster = btn.dataset.poster;
      if (video.getAttribute("src") !== src) {
        video.pause();
        video.poster = poster;
        video.src = src;
        video.load();
      }
      if (filmCaption) {
        filmCaption.innerHTML = `<b>${btn.dataset.title || ""}</b><i>${btn.dataset.meta || ""}</i>`;
      }
      video.play().catch(() => {});
    });
  });

  /* lightbox */
  const viewer = $("#viewer");
  const viewerImg = $("#viewer-image");
  const viewerTitle = $("#viewer-title");
  const viewerKicker = $("#viewer-kicker");
  const viewerCount = $("#viewer-count");
  let group = [];
  let index = 0;
  let lastFocus = null;

  const visibleCards = (name) =>
    $$(`[data-group="${name}"]`).filter((el) =>
      !el.closest("#hero-board") &&
      !el.classList.contains("is-hidden") &&
      !el.closest(".is-hidden")
    );

  const paint = () => {
    const card = group[index];
    if (!card) return;
    const src = card.dataset.full;
    viewerImg.src = src;
    const img = card.querySelector("img");
    viewerImg.alt = img?.alt || card.dataset.title || "";
    viewerTitle.textContent = card.dataset.title || "";
    viewerKicker.textContent = card.dataset.kicker || "";
    viewerCount.textContent = `${index + 1} / ${group.length}`;
  };

  const openViewer = (card) => {
    if (card.closest("[data-drag]")?.dataset.didDrag) return;
    const host = card.closest("[data-group]") || card;
    const name = host.dataset.group;
    if (!name) return;
    group = visibleCards(name);
    const full = host.dataset.full;
    index = Math.max(0, group.findIndex((c) => c === host || c.dataset.full === full));
    lastFocus = document.activeElement;
    viewer.hidden = false;
    document.body.classList.add("is-viewer");
    document.body.style.overflow = "hidden";
    paint();
    $(".viewer-close")?.focus();
  };

  const closeViewer = () => {
    viewer.hidden = true;
    document.body.classList.remove("is-viewer");
    document.body.style.overflow = "";
    viewerImg.removeAttribute("src");
    lastFocus?.focus?.();
  };

  const step = (dir) => {
    if (!group.length) return;
    index = (index + dir + group.length) % group.length;
    paint();
  };

  $$("[data-group]").forEach((card) => {
    const trigger = card.matches("button") ? card : card.querySelector("button[data-group], button.float-skin") || card;
    trigger.addEventListener("click", (e) => {
      if (card.dataset.didDrag || card.closest("[data-drag]")?.dataset.didDrag) return;
      e.preventDefault();
      openViewer(trigger.dataset.group ? trigger : card);
    });
  });

  $(".viewer-close")?.addEventListener("click", closeViewer);
  $(".viewer-prev")?.addEventListener("click", () => step(-1));
  $(".viewer-next")?.addEventListener("click", () => step(1));
  viewer?.addEventListener("click", (e) => {
    if (e.target === viewer) closeViewer();
  });
  document.addEventListener("keydown", (e) => {
    if (viewer?.hidden) return;
    if (e.key === "Escape") closeViewer();
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });

  let touchX = null;
  viewer?.addEventListener("touchstart", (e) => {
    touchX = e.changedTouches[0].clientX;
  }, { passive: true });
  viewer?.addEventListener("touchend", (e) => {
    if (touchX == null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
    touchX = null;
  });

  /* scroll reveal */
  const reveals = $$(".reveal");
  if (reduce) {
    reveals.forEach((el) => el.classList.add("is-in"));
  } else if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("is-in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-in"));
  }
})();
