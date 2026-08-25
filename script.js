const mobileMenu = document.querySelector(".site-menu");
const mobileMenuSummary = mobileMenu?.querySelector("summary");

mobileMenu?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => mobileMenu.removeAttribute("open"));
});

document.addEventListener("pointerdown", (event) => {
  if (mobileMenu?.open && !mobileMenu.contains(event.target)) mobileMenu.removeAttribute("open");
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !mobileMenu?.open) return;
  mobileMenu.removeAttribute("open");
  mobileMenuSummary?.focus();
});

const countdown = document.querySelector("[data-countdown]");
const countdownTarget = countdown ? Date.parse(countdown.dataset.countdown || "") : Number.NaN;
let countdownTimer = 0;

const updateCountdown = () => {
  if (!countdown || !Number.isFinite(countdownTarget)) return;
  const remaining = Math.max(0, countdownTarget - Date.now());
  const totalSeconds = Math.floor(remaining / 1000);
  const values = {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60
  };

  Object.entries(values).forEach(([unit, value]) => {
    const output = countdown.querySelector(`[data-countdown-unit="${unit}"]`);
    if (output) output.textContent = String(value).padStart(2, "0");
  });

  countdown.setAttribute(
    "aria-label",
    remaining > 0
      ? `距離婚禮還有 ${values.days} 天 ${values.hours} 小時 ${values.minutes} 分鐘`
      : "今天是 Fifi 與 Leo 的婚禮日"
  );

  if (remaining === 0 && countdownTimer) window.clearInterval(countdownTimer);
};

if (countdown && Number.isFinite(countdownTarget)) {
  updateCountdown();
  countdownTimer = window.setInterval(updateCountdown, 1000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) updateCountdown();
  });
}

const addImageFallback = (image) => {
  const frame = image.closest("figure");
  if (!frame || frame.classList.contains("has-image-error")) return;
  frame.classList.add("has-image-error");
  const fallback = document.createElement("p");
  fallback.className = "image-fallback";
  fallback.setAttribute("role", "status");
  fallback.textContent = "圖片暫時無法載入，請重新整理頁面後再試。";
  frame.append(fallback);
};

const clearImageFallback = (image) => {
  const frame = image.closest("figure");
  if (!frame?.classList.contains("has-image-error")) return;
  frame.classList.remove("has-image-error");
  frame.querySelector(".image-fallback")?.remove();
};

document.querySelectorAll("main img").forEach((image) => {
  image.addEventListener("error", () => addImageFallback(image), { once: true });
  image.addEventListener("load", () => clearImageFallback(image));
  if (image.complete && image.currentSrc && image.naturalWidth === 0) addImageFallback(image);
});

const photoDialog = document.querySelector("#photo-dialog");
const dialogCaption = photoDialog?.querySelector("#photo-dialog-caption");
const dialogStatus = photoDialog?.querySelector("[data-dialog-status]");
const dialogRetry = photoDialog?.querySelector("[data-image-retry]");
const dialogImage = document.createElement("img");
dialogImage.alt = "";
dialogImage.decoding = "async";
let activeGalleryButton = null;
let dialogSource = "";

if (photoDialog && dialogCaption) photoDialog.insertBefore(dialogImage, photoDialog.querySelector(".photo-dialog__feedback"));

const setDialogState = (state, message = "") => {
  if (!photoDialog) return;
  photoDialog.dataset.state = state;
  photoDialog.setAttribute("aria-busy", String(state === "loading"));
  if (dialogStatus) dialogStatus.textContent = message;
  if (dialogRetry) dialogRetry.hidden = state !== "error";
};

const loadDialogImage = (source, retry = false) => {
  if (!source) return;
  setDialogState("loading", "照片載入中…");
  dialogImage.removeAttribute("src");
  const imageUrl = new URL(source, document.baseURI);
  if (retry) imageUrl.searchParams.set("retry", Date.now().toString());
  dialogImage.src = imageUrl.href;
};

dialogImage.addEventListener("load", () => setDialogState("ready"));
dialogImage.addEventListener("error", () => setDialogState("error", "照片暫時無法載入。請重新載入，或關閉後稍候再試。"));

document.querySelectorAll("[data-gallery-src]").forEach((button) => {
  button.addEventListener("click", () => {
    const sourceImage = button.querySelector("img");
    const responsiveSource = [...button.querySelectorAll("source")]
      .find((source) => !source.media || window.matchMedia(source.media).matches)
      ?.srcset.split(",")[0]
      ?.trim()
      .split(/\s+/)[0];
    const source = responsiveSource || sourceImage?.currentSrc || sourceImage?.src || button.dataset.gallerySrc;
    if (!source) return;

    if (!photoDialog || typeof photoDialog.showModal !== "function") {
      window.location.assign(source);
      return;
    }

    activeGalleryButton = button;
    dialogSource = source;
    dialogImage.width = Number(sourceImage?.getAttribute("width")) || 1448;
    dialogImage.height = Number(sourceImage?.getAttribute("height")) || 1086;
    dialogImage.alt = sourceImage?.alt || "";
    if (dialogCaption) dialogCaption.textContent = button.dataset.galleryCaption || sourceImage?.alt || "Wedding photograph";
    loadDialogImage(dialogSource);

    if (!photoDialog.open) {
      try {
        photoDialog.showModal();
      } catch {
        window.location.assign(source);
      }
    }
  });
});

document.querySelector("[data-dialog-close]")?.addEventListener("click", () => {
  if (photoDialog?.open) photoDialog.close();
});

dialogRetry?.addEventListener("click", () => loadDialogImage(dialogSource, true));

photoDialog?.addEventListener("click", (event) => {
  if (event.target === photoDialog) photoDialog.close();
});

photoDialog?.addEventListener("close", () => {
  const returnFocus = activeGalleryButton;
  dialogImage.removeAttribute("src");
  dialogImage.alt = "";
  dialogSource = "";
  photoDialog.removeAttribute("data-state");
  photoDialog.removeAttribute("aria-busy");
  if (dialogStatus) dialogStatus.textContent = "";
  if (dialogCaption) dialogCaption.textContent = "";
  activeGalleryButton = null;
  window.requestAnimationFrame(() => {
    if (returnFocus?.isConnected) returnFocus.focus();
  });
});

const gallerySequence = document.querySelector(".gallery-sequence");
const galleryItems = [...document.querySelectorAll(".gallery-item")];
const galleryCurrent = document.querySelector("[data-gallery-current]");
const galleryTotal = document.querySelector("[data-gallery-total]");
const galleryPrevious = document.querySelector("[data-gallery-previous]");
const galleryNext = document.querySelector("[data-gallery-next]");
let galleryIndex = 0;
let galleryFrame = 0;

if (galleryTotal) galleryTotal.textContent = String(galleryItems.length);
if (!galleryItems.length) {
  if (galleryCurrent) galleryCurrent.textContent = "0";
  if (galleryPrevious) galleryPrevious.disabled = true;
  if (galleryNext) galleryNext.disabled = true;
}

const moveGallery = (direction) => {
  if (!galleryItems.length) return;
  galleryIndex = (galleryIndex + direction + galleryItems.length) % galleryItems.length;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  galleryItems[galleryIndex].scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "nearest", inline: "center" });
  if (galleryCurrent) galleryCurrent.textContent = String(galleryIndex + 1);
};

galleryPrevious?.addEventListener("click", () => moveGallery(-1));
galleryNext?.addEventListener("click", () => moveGallery(1));

gallerySequence?.addEventListener("scroll", () => {
  if (galleryFrame) return;
  galleryFrame = window.requestAnimationFrame(() => {
    galleryFrame = 0;
    const sequenceCenter = gallerySequence.getBoundingClientRect().left + gallerySequence.clientWidth / 2;
    const nearestIndex = galleryItems.reduce((nearest, item, index) => {
      const rect = item.getBoundingClientRect();
      const distance = Math.abs(rect.left + rect.width / 2 - sequenceCenter);
      return distance < nearest.distance ? { index, distance } : nearest;
    }, { index: 0, distance: Number.POSITIVE_INFINITY }).index;
    galleryIndex = nearestIndex;
    if (galleryCurrent) galleryCurrent.textContent = String(nearestIndex + 1);
  });
}, { passive: true });

const getHashTarget = () => {
  if (window.location.hash.length < 2) return null;
  try {
    return document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
  } catch {
    return null;
  }
};

window.addEventListener("load", () => {
  const target = getHashTarget();
  if (target) window.setTimeout(() => target.scrollIntoView({ block: "start" }), 120);
});

const dayPath = document.querySelector(".day-path");
const formZones = [...document.querySelectorAll(".rsvp, .guest-messages")];

if (dayPath && formZones.length && "IntersectionObserver" in window) {
  const visibleFormZones = new Set();
  const formZoneObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) visibleFormZones.add(entry.target);
      else visibleFormZones.delete(entry.target);
    });
    dayPath.classList.toggle("day-path--yielded", visibleFormZones.size > 0);
  }, { threshold: 0.05 });

  formZones.forEach((zone) => formZoneObserver.observe(zone));
}
