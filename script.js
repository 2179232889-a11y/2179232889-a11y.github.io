document.documentElement.classList.add("js");

const menuButton = document.querySelector(".menu-button");
const navigation = document.querySelector(".site-nav");
const navLinks = [...document.querySelectorAll('.site-nav a[href^="#"]')];

menuButton?.addEventListener("click", () => {
  const open = navigation.classList.toggle("is-open");
  menuButton.setAttribute("aria-expanded", String(open));
  document.body.classList.toggle("menu-open", open);
});

for (const link of navLinks) {
  link.addEventListener("click", () => {
    navigation.classList.remove("is-open");
    menuButton?.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
  });
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-in");
      revealObserver.unobserve(entry.target);
    }
  },
  { rootMargin: "0px 0px -11% 0px", threshold: 0.08 }
);

document.querySelectorAll("[data-reveal]").forEach((element) => {
  revealObserver.observe(element);
});

const sections = [...document.querySelectorAll("main section[id], main#main-content")];
const navById = new Map(navLinks.map((link) => [link.getAttribute("href"), link]));

const sectionObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      navLinks.forEach((link) => link.classList.remove("is-active"));
      navById.get(`#${entry.target.id}`)?.classList.add("is-active");
    }
  },
  { rootMargin: "-22% 0px -62% 0px", threshold: 0.01 }
);

sections.forEach((section) => sectionObserver.observe(section));

const dialog = document.querySelector(".media-dialog");
const dialogVideo = dialog.querySelector("video");
const dialogImage = dialog.querySelector("img");
const dialogCaption = dialog.querySelector(".dialog-caption");
const closeDialog = dialog.querySelector(".dialog-close");

function openMedia(trigger) {
  const type = trigger.dataset.mediaType;
  const source = trigger.dataset.src;
  const title = trigger.dataset.title;

  dialogVideo.pause();
  dialogVideo.hidden = type !== "video";
  dialogImage.hidden = type !== "image";
  dialogCaption.textContent = title;

  if (type === "video") {
    dialogVideo.src = source;
    dialogVideo.load();
    dialogVideo.play().catch(() => {});
  } else {
    dialogImage.src = source;
    dialogImage.alt = title;
  }

  dialog.showModal();
}

document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-media-type]");
  if (trigger) openMedia(trigger);
});

function closeMedia() {
  dialogVideo.pause();
  dialogVideo.removeAttribute("src");
  dialogVideo.load();
  dialogImage.removeAttribute("src");
  dialog.close();
}

closeDialog.addEventListener("click", closeMedia);
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) closeMedia();
});

const clipVideo = document.querySelector(".autoplay-reel");
const clipTitle = document.querySelector("#current-clip-title");
const clipOptions = [...document.querySelectorAll(".clip-option")];
const clipPlayButton = document.querySelector(".video-stage [data-media-type='video']");

for (const option of clipOptions) {
  option.addEventListener("click", () => {
    if (!clipVideo || option.classList.contains("is-active")) return;

    for (const button of clipOptions) {
      button.classList.toggle("is-active", button === option);
      button.setAttribute("aria-pressed", String(button === option));
    }

    const source = clipVideo.querySelector("source");
    clipVideo.pause();
    clipVideo.poster = option.dataset.poster;
    clipVideo.setAttribute("aria-label", option.dataset.title);
    source.src = option.dataset.video;
    clipVideo.load();
    clipTitle.textContent = option.dataset.clipTitle;

    if (clipPlayButton) {
      clipPlayButton.dataset.src = option.dataset.video;
      clipPlayButton.dataset.title = option.dataset.title;
    }

    if (clipVideo.dataset.inView === "true" && !reducedMotion.matches) {
      clipVideo.play().catch(() => {});
    }
  });
}

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const autoplayVideos = [...document.querySelectorAll("video[autoplay], .discipline-video video, .autoplay-reel")];

function syncVideoPlayback() {
  for (const video of autoplayVideos) {
    if (reducedMotion.matches || document.hidden) {
      video.pause();
    } else if (video.dataset.inView === "true") {
      video.play().catch(() => {});
    }
  }
}

const videoObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      entry.target.dataset.inView = String(entry.isIntersecting);
    }
    syncVideoPlayback();
  },
  { threshold: 0.22 }
);

autoplayVideos.forEach((video) => {
  videoObserver.observe(video);
});

document.addEventListener("visibilitychange", syncVideoPlayback);
reducedMotion.addEventListener("change", syncVideoPlayback);

const posterViewport = document.querySelector(".poster-viewport");
const posterTrack = document.querySelector(".poster-rail");

if (posterViewport && posterTrack && posterTrack.querySelector(".poster-card")) {
  const posterOriginals = [...posterTrack.querySelectorAll(".poster-card")];

  for (const card of posterOriginals) {
    const clone = card.cloneNode(true);
    clone.dataset.clone = "true";
    clone.setAttribute("aria-hidden", "true");
    clone.tabIndex = -1;
    posterTrack.append(clone);
  }

  function syncPosterDuration() {
    const distance = posterTrack.scrollWidth / 2;
    const duration = Math.max(30, distance / 26);
    posterTrack.style.animationDuration = `${duration}s`;
    posterTrack.classList.add("is-ready");
  }

  function restartPosterMarquee() {
    posterTrack.style.animationName = "none";
    void posterTrack.offsetWidth;
    syncPosterDuration();
    posterTrack.style.animationName = "";
  }

  posterViewport.addEventListener("dragstart", (event) => event.preventDefault());
  addEventListener("resize", restartPosterMarquee);
  document.fonts?.ready.then(restartPosterMarquee);
  restartPosterMarquee();
}

const awardViewport = document.querySelector(".award-viewport");
const awardTrack = document.querySelector(".award-rail");

if (awardViewport && awardTrack && awardTrack.querySelector(".award-card")) {
  const awardOriginals = [...awardTrack.querySelectorAll(".award-card")];

  for (const card of awardOriginals) {
    const clone = card.cloneNode(true);
    clone.dataset.clone = "true";
    clone.setAttribute("aria-hidden", "true");
    clone.tabIndex = -1;
    awardTrack.append(clone);
  }

  function syncAwardDuration() {
    const distance = awardTrack.scrollWidth / 2;
    const duration = Math.max(42, distance / 24);
    awardTrack.style.animationDuration = `${duration}s`;
    awardTrack.classList.add("is-ready");
  }

  function restartAwardMarquee() {
    awardTrack.style.animationName = "none";
    void awardTrack.offsetWidth;
    syncAwardDuration();
    awardTrack.style.animationName = "";
  }

  awardViewport.addEventListener("dragstart", (event) => event.preventDefault());
  addEventListener("resize", restartAwardMarquee);
  document.fonts?.ready.then(restartAwardMarquee);
  restartAwardMarquee();
}
