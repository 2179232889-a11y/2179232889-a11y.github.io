(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var desk = document.getElementById("desk");
  var dock = document.getElementById("desk-dock");
  var deskSlot = document.getElementById("desk-slot");
  var zTop = 20;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* ---------------- mobile menu + scroll spy ---------------- */
  var menuBtn = $(".menu-btn");
  var mobileNav = $("#mobile-nav");
  if (menuBtn && mobileNav) {
    menuBtn.addEventListener("click", function () {
      var open = menuBtn.getAttribute("aria-expanded") === "true";
      menuBtn.setAttribute("aria-expanded", String(!open));
      menuBtn.textContent = open ? "菜单" : "收起";
      if (open) mobileNav.setAttribute("hidden", "");
      else mobileNav.removeAttribute("hidden");
    });
    mobileNav.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        menuBtn.setAttribute("aria-expanded", "false");
        menuBtn.textContent = "菜单";
        mobileNav.setAttribute("hidden", "");
      }
    });
  }
  var spyLinks = $$(".hud-nav a");
  if (spyLinks.length && "IntersectionObserver" in window) {
    var spyMap = {};
    spyLinks.forEach(function (a) {
      var id = a.getAttribute("href").slice(1);
      spyMap[id] = a;
    });
    var spyObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        spyLinks.forEach(function (a) { a.classList.remove("is-on"); });
        if (spyMap[en.target.id]) spyMap[en.target.id].classList.add("is-on");
      });
    }, { rootMargin: "-40% 0px -45% 0px", threshold: 0 });
    ["posters", "films", "awards", "cv"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) spyObs.observe(el);
    });
  }

  /* ---------------- custom claw cursor ---------------- */
  var cursor = $("#cursor");
  var cursorLabel = $("#cursor-label");
  if (cursor && finePointer && !reduce) {
    document.body.classList.add("has-cursor");
    var cx = 0, cy = 0, tx = 0, ty = 0;
    window.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      tx = e.clientX;
      ty = e.clientY;
    }, { passive: true });
    document.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse") cursor.classList.add("is-grab");
    });
    document.addEventListener("pointerup", function () { cursor.classList.remove("is-grab"); });
    document.addEventListener("pointerover", function (e) {
      var host = e.target.closest("[data-cursor]");
      var label = host ? host.getAttribute("data-cursor") : "";
      cursorLabel.textContent = label || "";
      cursor.classList.toggle("has-label", !!label);
    });
    (function loop() {
      cx += (tx - cx) * 0.35;
      cy += (ty - cy) * 0.35;
      cursor.style.transform = "translate(" + (cx - 20) + "px," + (cy - 8) + "px)";
      requestAnimationFrame(loop);
    })();
  }

  /* ---------------- bake / clamp helpers ---------------- */
  function deskRect() { return desk.getBoundingClientRect(); }

  function bakePiece(el) {
    var d = deskRect();
    var r = el.getBoundingClientRect();
    var rot = el.style.getPropertyValue("--r") || "0deg";
    el.style.left = (r.left - d.left) + "px";
    el.style.top = (r.top - d.top) + "px";
    el.style.width = r.width + "px";
    el.style.transform = "rotate(" + rot + ")";
    el._homeX = r.left - d.left;
    el._homeY = r.top - d.top;
    el._homeW = r.width;
    el._rot = rot;
  }

  function bakeAll() {
    $$(".piece", desk).forEach(bakePiece);
    bakeMarbles();
  }

  function clampPiece(el, x, y) {
    var d = deskRect();
    var r = el.getBoundingClientRect();
    var maxX = d.width - r.width;
    var maxY = d.height - r.height;
    return {
      x: Math.max(6, Math.min(maxX - 6, x)),
      y: Math.max(6, Math.min(maxY - 6, y))
    };
  }

  /* ---------------- desk drag + inertia ---------------- */
  var drag = null;
  var vx = 0, vy = 0, lastX = 0, lastY = 0, lastT = 0;

  function bringFront(el) {
    zTop += 1;
    el.style.zIndex = String(zTop);
  }

  function centerHits(el, slot) {
    if (!el || !slot) return false;
    var a = el.getBoundingClientRect();
    var b = slot.getBoundingClientRect();
    var cx = a.left + a.width / 2;
    var cy = a.top + a.height / 2;
    return cx > b.left && cx < b.right && cy > b.top && cy < b.bottom;
  }

  function setDockHot(slotHost, on) {
    if (slotHost) slotHost.classList.toggle("is-hot", !!on);
  }

  function onDeskDown(e) {
    if (e.button != null && e.button !== 0) return;
    if (e.target.closest(".reset-btn") || e.target.closest(".dock")) return;
    var marble = e.target.closest("[data-marble]");
    if (marble) {
      startMarbleDrag(e, marble);
      return;
    }
    var piece = e.target.closest(".piece[data-drag]");
    if (!piece) return;
    var d = deskRect();
    var r = piece.getBoundingClientRect();
    drag = {
      el: piece,
      kind: "piece",
      ox: e.clientX - r.left,
      oy: e.clientY - r.top,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      pointerId: e.pointerId
    };
    vx = vy = 0;
    lastX = e.clientX;
    lastY = e.clientY;
    lastT = performance.now();
    piece.classList.add("is-held");
    piece.classList.remove("is-dropping");
    bringFront(piece);
    piece._vx = 0;
    piece._vy = 0;
    try { piece.setPointerCapture(e.pointerId); } catch (err) {}
    e.preventDefault();
  }

  function onDeskMove(e) {
    if (marbleDrag) {
      moveMarbleDrag(e);
      return;
    }
    if (!drag || drag.kind !== "piece") return;
    var dx = e.clientX - drag.startX;
    var dy = e.clientY - drag.startY;
    if (!drag.moved && dx * dx + dy * dy > 36) drag.moved = true;
    if (!drag.moved) return;
    var d = deskRect();
    var x = e.clientX - d.left - drag.ox;
    var y = e.clientY - d.top - drag.oy;
    var c = clampPiece(drag.el, x, y);
    drag.el.style.left = c.x + "px";
    drag.el.style.top = c.y + "px";
    var now = performance.now();
    var dt = Math.max(8, now - lastT);
    vx = (e.clientX - lastX) / dt * 16;
    vy = (e.clientY - lastY) / dt * 16;
    lastX = e.clientX;
    lastY = e.clientY;
    lastT = now;
    if (drag.el.hasAttribute("data-open")) {
      setDockHot(dock, centerHits(drag.el, deskSlot));
    }
  }

  function releasePiece(e) {
    if (!drag || drag.kind !== "piece") return;
    var el = drag.el;
    var moved = drag.moved;
    el.classList.remove("is-held");
    setDockHot(dock, false);
    try { el.releasePointerCapture(drag.pointerId); } catch (err) {}

    if (!moved && el.hasAttribute("data-open")) {
      drag = null;
      openFrom(el);
      return;
    }
    if (moved && el.hasAttribute("data-open") && centerHits(el, deskSlot)) {
      drag = null;
      dropIntoDock(el, dock, function () { openFrom(el); });
      return;
    }
    if (moved && !reduce) {
      el._vx = vx;
      el._vy = vy;
      startInertia(el);
    }
    drag = null;
  }

  var flying = [];
  function startInertia(el) {
    if (flying.indexOf(el) === -1) flying.push(el);
  }
  function tickInertia() {
    if (!flying.length) return;
    var d = deskRect();
    flying = flying.filter(function (el) {
      if (el.classList.contains("is-held")) return false;
      var x = parseFloat(el.style.left) + (el._vx || 0);
      var y = parseFloat(el.style.top) + (el._vy || 0);
      var r = el.getBoundingClientRect();
      if (x < 6) { x = 6; el._vx = -(el._vx || 0) * 0.55; }
      if (y < 6) { y = 6; el._vy = -(el._vy || 0) * 0.55; }
      if (x + r.width > d.width - 6) { x = d.width - r.width - 6; el._vx = -(el._vx || 0) * 0.55; }
      if (y + r.height > d.height - 6) { y = d.height - r.height - 6; el._vy = -(el._vy || 0) * 0.55; }
      el.style.left = x + "px";
      el.style.top = y + "px";
      el._vx *= 0.92;
      el._vy *= 0.92;
      return Math.abs(el._vx) + Math.abs(el._vy) > 0.35;
    });
  }

  function dropIntoDock(el, host, done) {
    var d = deskRect();
    var slot = host.querySelector(".dock-slot, .window-slot") || deskSlot;
    var s = slot.getBoundingClientRect();
    var r = el.getBoundingClientRect();
    var tx = s.left - d.left + (s.width - r.width) / 2;
    var ty = s.top - d.top + (s.height - r.height) / 2;
    el.classList.add("is-dropping");
    el.style.left = tx + "px";
    el.style.top = ty + "px";
    el.style.opacity = "0.35";
    setTimeout(function () {
      el.style.opacity = "";
      el.classList.remove("is-dropping");
      if (el._homeX != null) {
        el.style.left = el._homeX + "px";
        el.style.top = el._homeY + "px";
      }
      if (done) done();
    }, reduce ? 0 : 280);
  }

  desk.addEventListener("pointerdown", onDeskDown);
  window.addEventListener("pointermove", onDeskMove);
  window.addEventListener("pointerup", releasePiece);
  window.addEventListener("pointercancel", releasePiece);

  var resetBtn = $("#reset-desk");
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      $$(".piece", desk).forEach(function (el) {
        if (el._homeX == null) return;
        el.style.left = el._homeX + "px";
        el.style.top = el._homeY + "px";
        el._vx = el._vy = 0;
        el.style.opacity = "";
        el.classList.remove("is-held", "is-dropping");
      });
      resetMarbles();
    });
  }

  /* ---------------- marbles physics ---------------- */
  var marbles = [];
  var marbleDrag = null;
  var physOn = !reduce;
  var lastPhys = 0;

  function bakeMarbles() {
    var d = deskRect();
    marbles = $$("[data-marble]", desk).map(function (el) {
      var r = el.getBoundingClientRect();
      var size = r.width;
      var x = r.left - d.left;
      var y = r.top - d.top;
      el.style.left = x + "px";
      el.style.top = y + "px";
      var m = {
        el: el,
        x: x,
        y: y,
        r: size / 2,
        vx: physOn ? (Math.random() * 1.4 - 0.7) : 0,
        vy: physOn ? (Math.random() * 1.2 - 0.6) : 0,
        homeX: x,
        homeY: y
      };
      el._m = m;
      return m;
    });
  }

  function resetMarbles() {
    marbles.forEach(function (m) {
      m.x = m.homeX;
      m.y = m.homeY;
      m.vx = 0;
      m.vy = 0;
      m.el.style.left = m.x + "px";
      m.el.style.top = m.y + "px";
    });
  }

  function startMarbleDrag(e, el) {
    var m = el._m;
    if (!m) return;
    var d = deskRect();
    marbleDrag = {
      m: m,
      ox: e.clientX - d.left - m.x,
      oy: e.clientY - d.top - m.y,
      startX: e.clientX,
      startY: e.clientY,
      pointerId: e.pointerId
    };
    m.vx = m.vy = 0;
    el.classList.add("is-held");
    try { el.setPointerCapture(e.pointerId); } catch (err) {}
    e.preventDefault();
  }

  function moveMarbleDrag(e) {
    if (!marbleDrag) return;
    var d = deskRect();
    var m = marbleDrag.m;
    var x = e.clientX - d.left - marbleDrag.ox;
    var y = e.clientY - d.top - marbleDrag.oy;
    var maxX = d.width - m.r * 2 - 6;
    var maxY = d.height - m.r * 2 - 6;
    m.x = Math.max(6, Math.min(maxX, x));
    m.y = Math.max(6, Math.min(maxY, y));
    var now = performance.now();
    var dt = Math.max(8, now - lastT);
    m.vx = (e.clientX - lastX) / dt * 16;
    m.vy = (e.clientY - lastY) / dt * 16;
    lastX = e.clientX;
    lastY = e.clientY;
    lastT = now;
    m.el.style.left = m.x + "px";
    m.el.style.top = m.y + "px";
  }

  function endMarbleDrag() {
    if (!marbleDrag) return;
    marbleDrag.m.el.classList.remove("is-held");
    try { marbleDrag.m.el.releasePointerCapture(marbleDrag.pointerId); } catch (err) {}
    marbleDrag = null;
  }
  window.addEventListener("pointerup", endMarbleDrag);
  window.addEventListener("pointercancel", endMarbleDrag);

  function obstacleBoxes() {
    var d = deskRect();
    return $$(".piece, .dock", desk).map(function (el) {
      var r = el.getBoundingClientRect();
      return {
        l: r.left - d.left,
        t: r.top - d.top,
        r: r.right - d.left,
        b: r.bottom - d.top,
        vx: el._vx || 0,
        vy: el._vy || 0,
        moving: el.classList.contains("is-held") || Math.abs(el._vx || 0) + Math.abs(el._vy || 0) > 0.4
      };
    });
  }

  function resolveCircleRect(m, box) {
    var cx = m.x + m.r;
    var cy = m.y + m.r;
    var nx = Math.max(box.l, Math.min(cx, box.r));
    var ny = Math.max(box.t, Math.min(cy, box.b));
    var dx = cx - nx;
    var dy = cy - ny;
    var dist2 = dx * dx + dy * dy;
    if (dist2 >= m.r * m.r) return;
    var dist = Math.sqrt(dist2) || 0.001;
    var overlap = m.r - dist;
    var ux = dx / dist;
    var uy = dy / dist;
    m.x += ux * overlap;
    m.y += uy * overlap;
    var vn = m.vx * ux + m.vy * uy;
    if (vn < 0) {
      m.vx -= 1.6 * vn * ux;
      m.vy -= 1.6 * vn * uy;
    }
    if (box.moving) {
      m.vx += box.vx * 0.55;
      m.vy += box.vy * 0.55;
    }
  }

  function stepPhysics(dt) {
    if (!physOn || rebaking || !marbles.length) return;
    var d = deskRect();
    var boxes = obstacleBoxes();
    var damp = Math.pow(0.986, dt / 16);
    var i, j, m, n;

    for (i = 0; i < marbles.length; i++) {
      m = marbles[i];
      if (marbleDrag && marbleDrag.m === m) continue;
      m.vx *= damp;
      m.vy *= damp;
      m.x += m.vx * dt / 16;
      m.y += m.vy * dt / 16;

      if (m.x < 6) { m.x = 6; m.vx = Math.abs(m.vx) * 0.72; }
      if (m.y < 6) { m.y = 6; m.vy = Math.abs(m.vy) * 0.72; }
      if (m.x + m.r * 2 > d.width - 6) { m.x = d.width - 6 - m.r * 2; m.vx = -Math.abs(m.vx) * 0.72; }
      if (m.y + m.r * 2 > d.height - 6) { m.y = d.height - 6 - m.r * 2; m.vy = -Math.abs(m.vy) * 0.72; }

      for (j = 0; j < boxes.length; j++) resolveCircleRect(m, boxes[j]);
    }

    for (i = 0; i < marbles.length; i++) {
      for (j = i + 1; j < marbles.length; j++) {
        m = marbles[i];
        n = marbles[j];
        var dx = (n.x + n.r) - (m.x + m.r);
        var dy = (n.y + n.r) - (m.y + m.r);
        var min = m.r + n.r;
        var dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
        if (dist >= min) continue;
        var ux = dx / dist;
        var uy = dy / dist;
        var overlap = (min - dist) / 2;
        var mHeld = marbleDrag && marbleDrag.m === m;
        var nHeld = marbleDrag && marbleDrag.m === n;
        if (!mHeld) { m.x -= ux * overlap; m.y -= uy * overlap; }
        if (!nHeld) { n.x += ux * overlap; n.y += uy * overlap; }
        var rvx = n.vx - m.vx;
        var rvy = n.vy - m.vy;
        var vn = rvx * ux + rvy * uy;
        if (vn > 0) continue;
        var impulse = vn * 0.9;
        if (!mHeld) { m.vx += impulse * ux; m.vy += impulse * uy; }
        if (!nHeld) { n.vx -= impulse * ux; n.vy -= impulse * uy; }
      }
    }

    for (i = 0; i < marbles.length; i++) {
      m = marbles[i];
      m.el.style.left = m.x + "px";
      m.el.style.top = m.y + "px";
    }
  }

  function loop(now) {
    var dt = Math.min(32, now - lastPhys || 16);
    lastPhys = now;
    tickInertia();
    stepPhysics(dt);
    requestAnimationFrame(loop);
  }

  /* ---------------- lightbox ---------------- */
  var viewer = $("#viewer");
  var viewerImg = $("#viewer-image");
  var viewerTitle = $("#viewer-title");
  var viewerKicker = $("#viewer-kicker");
  var viewerCount = $("#viewer-count");
  var groups = { posters: [], awards: [] };
  var viewState = { group: "posters", index: 0 };

  function collectGroups() {
    groups.posters = [];
    groups.awards = [];
    var seen = { posters: {}, awards: {} };
    $$("[data-group][data-full]").forEach(function (el) {
      var g = el.getAttribute("data-group");
      var full = el.getAttribute("data-full");
      if (!groups[g] || seen[g][full]) return;
      seen[g][full] = true;
      groups[g].push({
        full: full,
        title: el.getAttribute("data-title") || "",
        kicker: el.getAttribute("data-kicker") || "",
        alt: (el.querySelector("img") && el.querySelector("img").alt) || el.getAttribute("data-title") || ""
      });
    });
  }

  function showViewer(group, index) {
    var list = groups[group];
    if (!list || !list.length) return;
    viewState.group = group;
    viewState.index = (index + list.length) % list.length;
    var item = list[viewState.index];
    viewerImg.src = item.full;
    viewerImg.alt = item.alt;
    viewerTitle.textContent = item.title;
    viewerKicker.textContent = item.kicker;
    viewerCount.textContent = (viewState.index + 1) + " / " + list.length;
    viewer.removeAttribute("hidden");
    document.body.style.overflow = "hidden";
    $(".viewer-close").focus();
  }

  function closeViewer() {
    viewer.setAttribute("hidden", "");
    viewerImg.src = "";
    document.body.style.overflow = "";
  }

  function openFrom(el) {
    var group = el.getAttribute("data-group");
    var full = el.getAttribute("data-full");
    var list = groups[group] || [];
    var idx = 0;
    for (var i = 0; i < list.length; i++) if (list[i].full === full) { idx = i; break; }
    showViewer(group, idx);
  }

  collectGroups();
  $(".viewer-close").addEventListener("click", closeViewer);
  $(".viewer-prev").addEventListener("click", function () { showViewer(viewState.group, viewState.index - 1); });
  $(".viewer-next").addEventListener("click", function () { showViewer(viewState.group, viewState.index + 1); });
  viewer.addEventListener("click", function (e) { if (e.target === viewer) closeViewer(); });
  document.addEventListener("keydown", function (e) {
    if (viewer.hasAttribute("hidden")) return;
    if (e.key === "Escape") closeViewer();
    if (e.key === "ArrowLeft") showViewer(viewState.group, viewState.index - 1);
    if (e.key === "ArrowRight") showViewer(viewState.group, viewState.index + 1);
  });
  (function swipeViewer() {
    var x0 = 0, y0 = 0, active = false;
    viewer.addEventListener("touchstart", function (e) {
      if (!e.changedTouches[0]) return;
      active = true;
      x0 = e.changedTouches[0].clientX;
      y0 = e.changedTouches[0].clientY;
    }, { passive: true });
    viewer.addEventListener("touchend", function (e) {
      if (!active || !e.changedTouches[0]) return;
      active = false;
      var dx = e.changedTouches[0].clientX - x0;
      var dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
      if (dx < 0) showViewer(viewState.group, viewState.index + 1);
      else showViewer(viewState.group, viewState.index - 1);
    }, { passive: true });
  })();

  /* ---------------- pick-up cards in later stages ---------------- */
  var pick = null;

  function homeOf(el) {
    return el._pickHome || (el._pickHome = el.getBoundingClientRect());
  }

  function liftPick(el) {
    var r = el.getBoundingClientRect();
    el._pickHome = { left: r.left, top: r.top, width: r.width, height: r.height };
    el.classList.add("is-held");
    el.style.position = "fixed";
    el.style.left = r.left + "px";
    el.style.top = r.top + "px";
    el.style.width = r.width + "px";
    el.style.margin = "0";
    el.style.zIndex = "80";
    el.style.transform = "rotate(0deg) scale(1.04)";
    el.style.pointerEvents = "none";
  }

  function snapPick(el, done) {
    var h = el._pickHome;
    if (!h) { resetPickStyle(el); if (done) done(); return; }
    el.style.left = h.left + "px";
    el.style.top = h.top + "px";
    el.style.transition = reduce ? "none" : "left .28s ease, top .28s ease, transform .28s ease";
    setTimeout(function () {
      resetPickStyle(el);
      if (done) done();
    }, reduce ? 0 : 280);
  }

  function resetPickStyle(el) {
    el.classList.remove("is-held");
    el.style.position = "";
    el.style.left = "";
    el.style.top = "";
    el.style.width = "";
    el.style.margin = "";
    el.style.zIndex = "";
    el.style.transform = "";
    el.style.transition = "";
    el.style.pointerEvents = "";
  }

  function stageDockFor(el) {
    if (el.hasAttribute("data-film")) return { host: $("#tv-dock"), slot: $("#tv-dock") };
    if (el.getAttribute("data-group") === "awards") return { host: $("#award-dock"), slot: $("#award-slot") };
    if (el.getAttribute("data-group") === "posters") return { host: $("#poster-dock"), slot: $("#poster-slot") };
    return null;
  }

  document.addEventListener("pointerdown", function (e) {
    if (e.button != null && e.button !== 0) return;
    if (e.target.closest("#desk")) return;
    if (e.target.closest("#viewer")) return;
    var el = e.target.closest("[data-pick]");
    if (!el) return;
    pick = {
      el: el,
      startX: e.clientX,
      startY: e.clientY,
      ox: 0,
      oy: 0,
      moved: false,
      pointerId: e.pointerId,
      lifted: false
    };
    try { el.setPointerCapture(e.pointerId); } catch (err) {}
  });

  document.addEventListener("pointermove", function (e) {
    if (!pick) return;
    var dx = e.clientX - pick.startX;
    var dy = e.clientY - pick.startY;
    if (!pick.moved && dx * dx + dy * dy > 36) {
      pick.moved = true;
      liftPick(pick.el);
      pick.lifted = true;
      var r = pick.el.getBoundingClientRect();
      pick.ox = e.clientX - r.left;
      pick.oy = e.clientY - r.top;
    }
    if (!pick.lifted) return;
    pick.el.style.left = (e.clientX - pick.ox) + "px";
    pick.el.style.top = (e.clientY - pick.oy) + "px";
    var dockInfo = stageDockFor(pick.el);
    if (dockInfo) setDockHot(dockInfo.host, centerHits(pick.el, dockInfo.slot));
  });

  function endPick() {
    if (!pick) return;
    var el = pick.el;
    var moved = pick.moved;
    var dockInfo = stageDockFor(el);
    if (dockInfo) setDockHot(dockInfo.host, false);
    try { el.releasePointerCapture(pick.pointerId); } catch (err) {}
    pick = null;
    if (!moved) {
      if (el.hasAttribute("data-film")) playFilm(el);
      else openFrom(el);
      return;
    }
    if (dockInfo && centerHits(el, dockInfo.slot)) {
      snapPick(el, function () {
        if (el.hasAttribute("data-film")) playFilm(el);
        else openFrom(el);
      });
      return;
    }
    snapPick(el);
  }
  document.addEventListener("pointerup", endPick);
  document.addEventListener("pointercancel", endPick);

  /* ---------------- filters ---------------- */
  $$(".filters [data-filter]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      $$(".filters [data-filter]").forEach(function (b) {
        b.classList.toggle("is-on", b === btn);
        b.setAttribute("aria-selected", b === btn ? "true" : "false");
      });
      var key = btn.getAttribute("data-filter");
      $$("#poster-grid .sticker-card").forEach(function (card) {
        var show = key === "all" || card.getAttribute("data-series") === key;
        card.classList.toggle("is-away", !show);
      });
    });
  });

  /* ---------------- films ---------------- */
  var video = $("#film-video");
  var caption = $("#film-caption");
  function playFilm(btn) {
    $$(".film-ticket").forEach(function (b) { b.classList.toggle("is-on", b === btn); });
    if (!video) return;
    video.poster = btn.getAttribute("data-poster");
    video.src = btn.getAttribute("data-src");
    video.load();
    var playPromise = video.play();
    if (playPromise && playPromise.catch) playPromise.catch(function () {});
    if (caption) {
      caption.innerHTML = "<b>" + btn.getAttribute("data-title") + "</b><i>" + btn.getAttribute("data-meta") + "</i>";
    }
  }
  $$(".film-ticket").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      /* click is also fired after a tap without drag; pick handler already plays.
         Ignore synthetic double if we already handled pointerup as a tap. */
    });
  });

  /* ---------------- stage entrances ---------------- */
  var gate = $("#gate");
  var gateStage = $("#gate-stage");
  var gateTitle = $("#gate-title");
  var gateBusy = false;
  function playGate(section) {
    if (reduce || !gate || gateBusy) return;
    if (section.dataset.entered === "1") return;
    section.dataset.entered = "1";
    gateBusy = true;
    gateStage.textContent = section.getAttribute("data-stage") || "";
    gateTitle.textContent = section.getAttribute("data-stage-title") || "";
    gate.removeAttribute("hidden");
    gate.classList.remove("is-open", "is-show");
    requestAnimationFrame(function () {
      gate.classList.add("is-show");
      setTimeout(function () {
        gate.classList.add("is-open");
        setTimeout(function () {
          gate.setAttribute("hidden", "");
          gate.classList.remove("is-open", "is-show");
          gateBusy = false;
        }, 850);
      }, 520);
    });
  }
  if ("IntersectionObserver" in window) {
    var gateObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && en.intersectionRatio > 0.22) playGate(en.target);
      });
    }, { threshold: [0.22, 0.35] });
    $$(".level").forEach(function (s) { gateObs.observe(s); });
  }

  /* ---------------- init + resize ---------------- */
  var bakeTimer = 0;
  function scheduleBake() {
    clearTimeout(bakeTimer);
    bakeTimer = setTimeout(function () {
      // only rebake if pieces still use percent (first run) or window resized a lot
      bakeAll();
    }, 60);
  }

  function init() {
    bakeAll();
    lastPhys = performance.now();
    requestAnimationFrame(loop);
  }

  if (document.readyState === "complete") init();
  else window.addEventListener("load", init);

  var lastW = window.innerWidth, lastH = window.innerHeight;
  var rebaking = false;
  function relayoutDesk() {
    rebaking = true;
    $$(".piece", desk).forEach(function (el) {
      el.style.left = "";
      el.style.top = "";
      el.style.width = "";
      el.style.transform = "";
      el.style.zIndex = "";
      el._vx = el._vy = 0;
    });
    $$("[data-marble]", desk).forEach(function (el) {
      el.style.left = "";
      el.style.top = "";
    });
    marbles = [];
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        bakeAll();
        rebaking = false;
      });
    });
  }
  window.addEventListener("resize", function () {
    if (Math.abs(window.innerWidth - lastW) < 24 && Math.abs(window.innerHeight - lastH) < 24) return;
    lastW = window.innerWidth;
    lastH = window.innerHeight;
    relayoutDesk();
  });
})();
