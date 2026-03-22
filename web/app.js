// ─── State ────────────────────────────────────────────────────────────────────

const state = {
  focus: "all",
  category: new Set(),
  style: new Set(),
  tech: new Set(),
};

// ─── Element refs ─────────────────────────────────────────────────────────────

const els = {
  // Feed view
  feedView: document.getElementById("feed-view"),
  feedTrack: document.getElementById("feed-track"),

  feedCredit: document.getElementById("feed-credit"),
  feedCreditTitle: document.getElementById("feed-credit-title"),
  feedSwipeHint: document.getElementById("feed-swipe-hint"),
  feedSlideTemplate: document.getElementById("feed-slide-template"),
  feedEditorial: document.getElementById("feed-editorial"),

  // Results view
  resultsView: document.getElementById("results-view"),
  resultsBack: document.getElementById("results-back"),
  resultsDatasetPill: document.getElementById("results-dataset-pill"),

  // Detail view
  detailView: document.getElementById("detail-view"),

  // Feed view search (bridges value to results view on submit)
  feedQuery: document.getElementById("feed-query"),
  feedSearchForm: document.getElementById("feed-search-form"),

  // Shared search elements (in results view)
  datasetName: document.getElementById("dataset-name"),
  query: document.getElementById("query"),
  similarTo: document.getElementById("similar-to"),
  limit: document.getElementById("limit"),
  results: document.getElementById("results"),
  resultsTitle: document.getElementById("results-title"),
  resultsHead: document.querySelector(".results-head"),
  summaryTitle: document.getElementById("summary-title"),
  readoutCopy: document.getElementById("readout-copy"),
  readoutPanel: document.getElementById("assistant-readout"),
  resultCount: document.getElementById("result-count"),
  activeLenses: document.getElementById("active-lenses"),
  statusText: document.getElementById("status-text"),
  searchForm: document.getElementById("search-form"),
  resetFilters: document.getElementById("reset-filters"),
  copyMarkdown: document.getElementById("copy-markdown"),
  toggleAdvanced: document.getElementById("toggle-advanced"),
  advancedModal: document.getElementById("advanced-modal"),
  advancedModalBackdrop: document.getElementById("advanced-modal-backdrop"),
  advancedModalClose: document.getElementById("advanced-modal-close"),
  advancedApply: document.getElementById("advanced-apply"),
  focusRoot: document.getElementById("focus-filters"),
  filterRoots: {
    category: document.getElementById("category-filters"),
    style: document.getElementById("style-filters"),
    tech: document.getElementById("tech-filters"),
  },
  template: document.getElementById("result-card-template"),

  // Image search
  imageSearchBtn: document.getElementById("image-search-btn"),
  imageFileInput: document.getElementById("image-file-input"),
  imageDropZone: document.getElementById("image-drop-zone"),
  imagePreview: document.getElementById("image-preview"),
  imageClearBtn: document.getElementById("image-clear-btn"),
};

// ─── Router ───────────────────────────────────────────────────────────────────

function route() {
  const hash = window.location.hash;
  if (hash.startsWith("#/ref/")) {
    const slug = decodeURIComponent(hash.slice(6));
    showDetail(slug);
  } else if (hash.startsWith("#/results")) {
    showResults();
  } else {
    showFeed();
  }
}

function showFeed() {
  els.feedView.hidden = false;
  els.resultsView.hidden = true;
  els.detailView.hidden = true;
  document.body.style.overflow = "hidden";
  document.title = "Design Refs";
  // Resume stagger reveal if feed is loaded
  if (feedLoaded) startFloatingCopy();
}

function showResults() {
  els.feedView.hidden = true;
  els.resultsView.hidden = false;
  els.detailView.hidden = true;
  document.body.style.overflow = "";
  document.title = "Search · Design Refs";
  // Pause the stagger animation while not on feed
  if (startFloatingCopy._stop) startFloatingCopy._stop();
  // Auto-load a default browse view if the results grid is empty
  if (!els.results.children.length && !autoSearchPending) {
    loadDefaultBrowse();
  }
}

async function showDetail(slug) {
  els.feedView.hidden = true;
  els.resultsView.hidden = true;
  els.detailView.hidden = false;
  document.body.style.overflow = "";
  els.detailView.replaceChildren(makeStatusNode("detail-loading", "Loading…"));

  try {
    const response = await fetch(`/api/ref/${encodeURIComponent(slug)}`);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || "Reference not found.");
    }
    const ref = await response.json();
    renderDetail(ref);
    document.title = `${ref.title} · Design Refs`;
  } catch (err) {
    els.detailView.replaceChildren(makeStatusNode("detail-error", err.message));
  }
}

window.addEventListener("hashchange", route);

// ─── Feed (landing swipe view) ────────────────────────────────────────────────

let feedEntries = [];
let feedLoaded = false;
let autoSearchPending = false; // guard against re-entrant auto-browse search

function makeFeedTag(label) {
  const span = document.createElement("span");
  span.className = "discover-tag";
  span.textContent = label;
  return span;
}

function buildFeedSlide(entry) {
  const fragment = els.feedSlideTemplate.content.cloneNode(true);
  const slide = fragment.querySelector(".feed-slide");

  const link = fragment.querySelector(".feed-slide-link");
  const thumb = fragment.querySelector(".feed-slide-thumb");
  const eyebrow = fragment.querySelector(".feed-slide-eyebrow");
  const title = fragment.querySelector(".feed-slide-title");
  const tagsRow = fragment.querySelector(".feed-slide-tags");
  const openBtn = fragment.querySelector(".discover-action-btn.primary");
  const detailBtn = fragment.querySelector(".discover-action-btn.ghost");

  if (entry.thumbnail_url) {
    thumb.src = entry.thumbnail_url;
    thumb.alt = entry.title;
    thumb.addEventListener("load", () => thumb.classList.add("loaded"), { once: true });
    thumb.addEventListener("error", () => {
      const slideEl = thumb.closest(".feed-slide");
      if (slideEl) slideEl.remove();
    }, { once: true });
  } else {
    thumb.hidden = true;
  }
  link.href = entry.live_url || "#";

  // Category eyebrow removed — keep slide visually clean
  eyebrow.hidden = true;
  title.textContent = entry.title;

  // Show up to 3 style/motion tags as small chips below the title
  const allTags = [
    ...(entry.style_tags || []),
    ...(entry.motion_tags || []),
    ...(entry.layout_tags || []),
  ].slice(0, 3);
  allTags.forEach((t) => tagsRow.appendChild(makeFeedTag(t)));

  openBtn.href = entry.live_url || "#";
  const slug = entry.slug || "";
  detailBtn.href = slug ? `#/ref/${encodeURIComponent(slug)}` : "#/";

  applySlideAccent(entry, slide);

  return slide;
}

// ─── Dominant-hue extraction for slide tag colors ─────────────────────────────

// ─── Tag accent colors — semantic hue map + slug hash fallback ────────────────
// CDN CORS is unreliable so we derive the hue from the design's own tags instead.

const TAG_HUE_MAP = {
  // Bold / energetic — red-orange
  "bold": 8, "colorful": 18, "promotional": 22, "e-commerce": 26,
  "retail/e-commerce": 26, "gestures / interaction": 14,

  // Warm / premium — gold-orange
  "luxury": 38, "typography": 44, "editorial": 48, "storytelling": 52,
  "graphic design": 35, "fashion": 32, "fashion/beauty": 32,
  "film & tv": 345, "photo & video": 350,

  // Cultural / educational — yellow-green
  "culture & education": 68, "art & illustration": 75, "illustration": 72,
  "experimental": 82, "unusual navigation": 88,

  // Portfolio / studio — green
  "portfolio": 150, "gallery": 158, "studio": 155, "gaming": 130,
  "games & entertainment": 130, "design agencies": 145,
  "music": 142, "music & sound": 140,

  // Spatial / 3D / immersive — teal-cyan
  "architecture": 172, "3d": 182, "3d & immersive": 185, "immersive": 190,
  "webgl": 188, "three.js": 185, "canvas api": 180,

  // Web / scroll / tech — blue-teal
  "web & interactive": 205, "scrolling": 208, "scroll": 205,
  "parallax": 215, "big background images": 200, "technology": 218,
  "startups": 212, "business & corporate": 222,

  // Clean / UI / minimal — blue
  "minimal": 248, "clean": 252, "flat design": 255, "dark mode": 235,
  "ui design": 242, "figma": 246, "mobile & apps": 240,
  "app style": 244, "institutions": 228,

  // Motion / interaction / animation — purple-blue
  "animation": 272, "motion": 278, "microinteractions": 268,
  "interaction design": 265, "transitions": 275, "gsap": 280,
  "interactive": 285, "lottie": 270,

  // Artistic / video / editorial — violet-magenta
  "video": 312, "film/animation": 318, "about page": 295,
  "unusual": 300, "photography": 308, "social responsibility": 160,
};

function getSlideHue(entry) {
  const tags = [
    ...(entry.style_tags  || []),
    ...(entry.motion_tags || []),
    ...(entry.layout_tags || []),
    ...(entry.categories  || []),
  ];
  for (const tag of tags) {
    const hue = TAG_HUE_MAP[tag.toLowerCase()];
    if (hue !== undefined) return hue;
  }
  // Fallback: deterministic hash of the slug so same slide = same color
  let h = 0;
  for (const c of (entry.slug || entry.title || "")) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return h % 360;
}

function applySlideAccent(entry, slide) {
  const fallbackHue = getSlideHue(entry);
  function applyHue(hue) {
    slide.style.setProperty("--tag-border", `hsla(${hue}, 65%, 68%, 0.85)`);
    slide.style.setProperty("--tag-color",  `hsl(${hue}, 70%, 88%)`);
    slide.style.setProperty("--tag-bg",     `hsla(${hue}, 55%, 14%, 0.42)`);
  }
  applyHue(fallbackHue); // apply semantic hue immediately

  // Try to extract real dominant hue from thumbnail via a hidden CORS-enabled img
  const url = entry.thumbnail_url;
  if (!url) return;
  const sampler = new Image();
  sampler.crossOrigin = "anonymous";
  sampler.onload = () => {
    try {
      const canvas = document.createElement("canvas");
      const size = 60; // small sample for speed
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(sampler, 0, 0, size, size);
      const pixels = ctx.getImageData(0, 0, size, size).data;

      // Accumulate hues weighted by saturation (ignore grays)
      let hueSum = 0, hueWeight = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i] / 255, g = pixels[i+1] / 255, b = pixels[i+2] / 255;
        const max = Math.max(r,g,b), min = Math.min(r,g,b), d = max - min;
        if (d < 0.1) continue; // skip grays / near-white / near-black
        const l = (max + min) / 2;
        if (l < 0.08 || l > 0.92) continue; // skip very dark / very light
        let h;
        if (max === r) h = ((g - b) / d + 6) % 6 * 60;
        else if (max === g) h = ((b - r) / d + 2) * 60;
        else h = ((r - g) / d + 4) * 60;
        const sat = d / (1 - Math.abs(2 * l - 1));
        hueSum += h * sat;
        hueWeight += sat;
      }
      if (hueWeight > 0) applyHue(Math.round(hueSum / hueWeight));
    } catch (e) {
      // SecurityError = CDN blocked CORS; keep semantic fallback already applied
    }
  };
  sampler.src = url; // only set src after crossOrigin is set
}

// ─── Per-word stagger reveal ───────────────────────────────────────────────────
// Words fade in one at a time, hold, then fade out. Repeats from a new position.
// No bounce — meditative, not mechanical.

let bounceRAF = null; // kept as null; no longer used for RAF but cancellation checks remain

// Phrases to cycle through — imply "even the best study the best"
const STAGGER_PHRASES = [
  ["even", "the greats", "study", "the greats."],
  ["the best designers", "still", "look up."],
  ["good taste", "is just", "practiced", "flattery."],
  ["if flattery", "gets you everywhere,", "start here."],
  ["every great designer", "has a", "reference folder."],
];

// Positions: [top%, left%] pairs — avoid bottom 35% (slide meta) and top 12% (topbar)
const STAGGER_POSITIONS = [
  [14, 8], [16, 52], [38, 6], [42, 55],
  [55, 10], [58, 50], [22, 30], [48, 28],
];

// Size variants — Raleway Dots looks great at different weights of scale
const STAGGER_SIZES = ["1.5rem", "2rem", "2.6rem", "1.8rem"];

function startFloatingCopy() {
  // The .floating-copy elements live inside each slide — we pick the one in the
  // currently visible slide and animate its .floating-title word by word.
  let phraseIdx = Math.floor(Math.random() * STAGGER_PHRASES.length);
  let posIdx    = Math.floor(Math.random() * STAGGER_POSITIONS.length);
  let sizeIdx   = Math.floor(Math.random() * STAGGER_SIZES.length);
  let timer     = null;

  function currentCopy() {
    const slides = els.feedTrack.querySelectorAll(".feed-slide");
    const idx = Math.round(els.feedTrack.scrollTop / (els.feedTrack.clientHeight || 1));
    return slides[idx] ? slides[idx].querySelector(".floating-copy") : null;
  }

  function allCopies() {
    return els.feedTrack.querySelectorAll(".floating-copy");
  }

  function placeAt(copy, posI) {
    const [top, left] = STAGGER_POSITIONS[posI];
    copy.style.top  = top  + "%";
    copy.style.left = left + "%";
    copy.style.transform = "";
  }

  function runPhrase() {
    // Reset ALL copies to hidden first
    allCopies().forEach(c => {
      c.style.transition = "none";
      c.style.opacity = "0";
      const t = c.querySelector(".floating-title");
      if (t) t.textContent = "";
    });

    const copy = currentCopy();
    if (!copy) { timer = setTimeout(runPhrase, 1000); return; }

    const titleEl = copy.querySelector(".floating-title");
    if (!titleEl) { timer = setTimeout(runPhrase, 1000); return; }

    // Pick next phrase / position / size
    phraseIdx = (phraseIdx + 1) % STAGGER_PHRASES.length;
    posIdx    = (posIdx    + 1) % STAGGER_POSITIONS.length;
    sizeIdx   = (sizeIdx   + 1) % STAGGER_SIZES.length;

    const words = STAGGER_PHRASES[phraseIdx];
    const size  = STAGGER_SIZES[sizeIdx];

    placeAt(copy, posIdx);
    titleEl.style.fontSize = size;
    titleEl.textContent = "";
    copy.style.opacity = "0";

    let wordI = 0;
    function revealNextWord() {
      if (wordI >= words.length) {
        // All words shown — hold, then fade out
        timer = setTimeout(() => {
          copy.style.transition = "opacity 1.2s ease";
          copy.style.opacity = "0";
          timer = setTimeout(runPhrase, 1400);
        }, 2800);
        return;
      }
      titleEl.textContent = words.slice(0, wordI + 1).join(" ");
      copy.style.transition = "opacity 0.9s ease";
      copy.style.opacity = "1";
      wordI++;
      timer = setTimeout(revealNextWord, 900 + wordI * 120);
    }

    // Short pause before first word
    timer = setTimeout(revealNextWord, 400);
  }

  // Kick off after a brief initial delay
  timer = setTimeout(runPhrase, 1800);

  // Stop when navigating away (bounceRAF reuse as a sentinel isn't needed;
  // callers cancel via clearTimeout approach — expose stopper instead)
  startFloatingCopy._stop = () => { clearTimeout(timer); timer = null; };
}

function updateFeedProgress() {
  const track = els.feedTrack;
  const slides = track.querySelectorAll(".feed-slide");
  if (!slides.length) return;

  const scrollTop = track.scrollTop;
  const h = track.clientHeight;
  const current = Math.round(scrollTop / h);

  // Hide swipe hint after first swipe
  if (scrollTop > 20 && els.feedSwipeHint) {
    els.feedSwipeHint.style.opacity = "0";
  }
}

function navigateFeed(direction) {
  const h = els.feedTrack.clientHeight;
  els.feedTrack.scrollBy({ top: direction * h, behavior: "smooth" });
}

async function loadFeed() {
  if (feedLoaded) return;

  const loading = document.createElement("div");
  loading.className = "discover-loading";
  loading.textContent = "Loading…";
  els.feedTrack.replaceChildren(loading);

  try {
    const res = await fetch("/api/discover?limit=200");
    if (!res.ok) throw new Error("Failed to load.");
    const data = await res.json();
    feedEntries = data.entries || [];
    els.feedTrack.replaceChildren();
    feedEntries.forEach((entry) => {
      els.feedTrack.appendChild(buildFeedSlide(entry));
    });

    // Featured credit removed — swipe hint provides the navigation cue

    feedLoaded = true;
    updateFeedProgress();
    startFloatingCopy();
  } catch (err) {
    const empty = document.createElement("div");
    empty.className = "discover-empty";
    empty.textContent = err.message;
    els.feedTrack.replaceChildren(empty);
  }
}

function bindFeed() {
  // Scroll progress
  els.feedTrack.addEventListener("scroll", updateFeedProgress, { passive: true });

  // Touch swipe
  let touchStartY = 0;
  let touchStartX = 0;
  let isSwiping = false;

  els.feedTrack.addEventListener("touchstart", (e) => {
    touchStartY = e.touches[0].clientY;
    touchStartX = e.touches[0].clientX;
    isSwiping = true;
  }, { passive: true });

  els.feedTrack.addEventListener("touchend", (e) => {
    if (!isSwiping) return;
    isSwiping = false;
    const dy = touchStartY - e.changedTouches[0].clientY;
    const dx = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 40) {
      navigateFeed(dy > 0 ? 1 : -1);
    }
  }, { passive: true });

  els.feedTrack.addEventListener("touchcancel", () => { isSwiping = false; }, { passive: true });

  // Keyboard
  document.addEventListener("keydown", (e) => {
    if (!els.feedView.hidden && document.activeElement !== els.query) {
      if (e.key === "ArrowDown") { e.preventDefault(); navigateFeed(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); navigateFeed(-1); }
    }
  });

  // Results page prompt chips — set query and run search
  document.querySelectorAll(".results-chip[data-prompt]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      els.query.value = btn.dataset.prompt;
      els.query.focus();
      try { await runSearch(); }
      catch (error) { setStatus(error.message, true); }
    });
  });

  // Legacy feed chips (kept for compatibility)
  document.querySelectorAll(".feed-chip[data-prompt]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (els.feedQuery) els.feedQuery.value = btn.dataset.prompt;
    });
  });

  // Advanced search link
  const advLink = document.getElementById("feed-advanced-link");
  if (advLink) {
    advLink.addEventListener("click", (e) => {
      e.preventDefault();
      showResults();
      window.location.hash = "#/results";
    });
  }

  // Results back button
  els.resultsBack.addEventListener("click", () => {
    window.location.hash = "#/";
  });
}

// ─── Detail page ──────────────────────────────────────────────────────────────

function node(tag, className) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  return n;
}

function makeStatusNode(className, text) {
  const p = node("p", className);
  p.textContent = text;
  return p;
}

function makeDetailInitial(title) {
  const span = node("span", "detail-initial");
  span.textContent = title.charAt(0).toUpperCase();
  return span;
}

function renderDetail(ref) {
  const root = els.detailView;
  root.replaceChildren();

  const back = node("button", "button secondary back-button");
  back.textContent = "← Back";
  back.addEventListener("click", () => history.back());
  root.appendChild(back);

  const hero = node("div", ref.thumbnail_url ? "detail-hero" : "detail-hero detail-hero-placeholder");
  if (ref.thumbnail_url) {
    const img = node("img", "detail-hero-img");
    img.src = ref.thumbnail_url;
    img.alt = ref.title;
    img.addEventListener("error", () => {
      hero.classList.add("detail-hero-placeholder");
      img.remove();
      hero.appendChild(makeDetailInitial(ref.title));
    });
    hero.appendChild(img);
  } else {
    hero.appendChild(makeDetailInitial(ref.title));
  }
  root.appendChild(hero);

  const titleBlock = node("div", "detail-title-block");
  const eyebrow = node("p", "eyebrow");
  eyebrow.textContent = ref.award_source || "Design Awards";
  const title = node("h1", "detail-title");
  title.textContent = ref.title;
  const metaLine = node("p", "detail-meta-line");
  metaLine.textContent = `${ref.award_name || "Award"} · ${formatDate(ref.award_date)}`;
  titleBlock.append(eyebrow, title, metaLine);
  root.appendChild(titleBlock);

  const links = node("div", "detail-links");
  const liveLink = node("a", "button primary");
  liveLink.href = ref.live_url;
  liveLink.target = "_blank";
  liveLink.rel = "noreferrer";
  liveLink.textContent = "Open Live Site";
  const sourceLink = node("a", "button secondary");
  sourceLink.href = ref.source_url;
  sourceLink.target = "_blank";
  sourceLink.rel = "noreferrer";
  sourceLink.textContent = "Open Awwwards Page";
  links.append(liveLink, sourceLink);
  root.appendChild(links);

  const tagSets = [
    ["Categories", ref.categories],
    ["Style", ref.style_tags],
    ["Motion", ref.motion_tags],
    ["Layout", ref.layout_tags],
    ["Tech", ref.tech_tags],
  ].filter(([, values]) => values && values.length);

  if (tagSets.length) {
    const tagsPanel = node("div", "detail-tags-panel");
    tagSets.forEach(([label, values]) => {
      const group = node("div", "detail-tag-group");
      const heading = node("p", "meta-label");
      heading.textContent = label;
      const row = node("div", "tag-row");
      values.forEach((v) => row.appendChild(makeTag(v)));
      group.append(heading, row);
      tagsPanel.appendChild(group);
    });
    root.appendChild(tagsPanel);
  }

  if (ref.short_description) {
    const desc = node("p", "detail-description");
    desc.textContent = ref.short_description;
    root.appendChild(desc);
  }

  if (ref.related && ref.related.length) {
    const relSection = node("div", "detail-related");
    const relEyebrow = node("p", "eyebrow");
    relEyebrow.textContent = "Related references";
    const relHeading = node("h2", "detail-related-heading");
    relHeading.textContent = "You might also like";
    relSection.append(relEyebrow, relHeading);
    const relGrid = node("div", "related-grid");
    ref.related.forEach((rel) => {
      const card = node("a", "related-card");
      card.href = `#/ref/${encodeURIComponent(rel.slug)}`;
      const relTitle = node("h3", "related-title");
      relTitle.textContent = rel.title;
      const relDate = node("p", "related-date");
      relDate.textContent = formatDate(rel.award_date);
      const relTags = node("div", "tag-row related-tags");
      (rel.style_tags || []).slice(0, 3).forEach((t) => relTags.appendChild(makeTag(t)));
      card.append(relTitle, relDate, relTags);
      relGrid.appendChild(card);
    });
    relSection.appendChild(relGrid);
    root.appendChild(relSection);
  }
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function setStatus(message, isError = false) {
  els.statusText.textContent = message;
  els.statusText.dataset.error = String(isError);
}

function setAdvancedOpen(isOpen) {
  els.advancedModal.hidden = !isOpen;
  els.toggleAdvanced.setAttribute("aria-expanded", String(isOpen));
  if (isOpen) {
    document.body.style.overflow = "hidden";
    els.advancedModal.classList.add("is-open");
  } else {
    document.body.style.overflow = "";
    els.advancedModal.classList.remove("is-open");
  }
}

function makeTag(label, variant = "default") {
  const chip = document.createElement("span");
  chip.className = `tag ${variant}`;
  chip.textContent = label;
  return chip;
}

function prettyLabel(kind) {
  return { category: "Category", style: "Style", tech: "Tech" }[kind] || kind;
}

function humanizeReason(reason) {
  return reason
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [kind, ...rest] = part.split(":");
      if (!rest.length) return part;
      return `${prettyLabel(kind)}: ${rest.join(":")}`;
    });
}

function activeLensLabel(payload) {
  const lenses = [];
  if (payload.filters.focus_label !== "All") lenses.push(payload.filters.focus_label);
  if (
    payload.filters.category.length ||
    payload.filters.style.length ||
    payload.filters.tech.length ||
    payload.filters.similar_to
  ) lenses.push("Advanced");
  return lenses.join(" + ") || "Natural language";
}

function buildHeadline(payload) {
  if (payload.filters.query) return `Results for "${payload.filters.query}"`;
  if (payload.filters.focus_label !== "All") return `${payload.filters.focus_label} references`;
  return "Top references";
}

function formatDate(rawValue) {
  const date = new Date(`${rawValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return rawValue;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
}

// ─── Filter UI ────────────────────────────────────────────────────────────────

let focusOptions = [];

function renderFocusFilters(options) {
  focusOptions = options.slice();
  els.focusRoot.replaceChildren();
  options.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip focus-chip";
    button.dataset.focusKey = option.key;
    button.textContent = option.label;
    button.title = option.description;
    button.addEventListener("click", () => {
      state.focus = option.key;
      syncFocusButtons();
    });
    els.focusRoot.appendChild(button);
  });
}

function syncFocusButtons() {
  els.focusRoot.querySelectorAll(".focus-chip").forEach((button) => {
    button.classList.toggle("active", button.dataset.focusKey === state.focus);
  });
}

function renderFilterGroup(kind, values) {
  const root = els.filterRoots[kind];
  root.replaceChildren();
  values.forEach((value) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip";
    button.dataset.kind = kind;
    button.dataset.value = value;
    button.textContent = value;
    button.addEventListener("click", () => {
      const bucket = state[kind];
      if (bucket.has(value)) { bucket.delete(value); button.classList.remove("active"); }
      else { bucket.add(value); button.classList.add("active"); }
    });
    root.appendChild(button);
  });
}

function syncFilterButtons() {
  Object.entries(els.filterRoots).forEach(([kind, root]) => {
    root.querySelectorAll(".chip").forEach((button) => {
      button.classList.toggle("active", state[kind].has(button.dataset.value));
    });
  });
}

// ─── Search ───────────────────────────────────────────────────────────────────

function serializeState() {
  const params = new URLSearchParams();
  const query = els.query.value.trim();
  const similarTo = els.similarTo ? els.similarTo.value.trim() : "";
  const limit = els.limit ? els.limit.value.trim() || "8" : "8";

  if (query) params.set("q", query);
  if (state.focus !== "all") params.set("focus", state.focus);
  if (similarTo) params.set("similar_to", similarTo);
  params.set("limit", limit);

  ["category", "style", "tech"].forEach((kind) => {
    [...state[kind]].sort((a, b) => a.localeCompare(b)).forEach((value) => params.append(kind, value));
  });

  return params;
}

function renderReadout(payload) {
  const headline = buildHeadline(payload);
  const hasQuery = !!(payload.filters && payload.filters.query);
  // When a real search is active: show readout panel, hide the static results-head
  // When browsing (no query): hide readout panel, show static results-head
  els.readoutPanel.hidden = !hasQuery;
  els.resultsHead.hidden = hasQuery;
  if (hasQuery) {
    els.summaryTitle.textContent = headline;
    els.resultsTitle.textContent = headline;
  }
  els.readoutCopy.textContent = payload.assistant.summary;
  els.resultCount.textContent = String(payload.results.length);
  els.activeLenses.textContent = activeLensLabel(payload);
}

function renderResults(payload) {
  els.results.replaceChildren();

  if (!payload.results.length) {
    const empty = document.createElement("article");
    empty.className = "panel empty-state";
    const h = document.createElement("h3");
    h.textContent = "No matches";
    const p = document.createElement("p");
    p.textContent = "Try broadening the search or using Advanced Search.";
    empty.append(h, p);
    els.results.appendChild(empty);
    return;
  }

  payload.results.forEach((result) => {
    const fragment = els.template.content.cloneNode(true);
    const reasons = humanizeReason(result.match_reason);
    const slug = result.slug || "";
    const detailHref = slug ? `#/ref/${encodeURIComponent(slug)}` : "#/";

    const imageWrap = fragment.querySelector(".card-image-wrap");
    imageWrap.href = detailHref;
    const imageArea = fragment.querySelector(".card-image");
    const cardInitial = fragment.querySelector(".card-initial");
    const cardThumb = fragment.querySelector(".card-thumb");

    cardInitial.textContent = result.title.charAt(0).toUpperCase();

    const thumbUrl = result.thumbnail_url || "";
    if (thumbUrl) {
      cardThumb.src = thumbUrl;
      cardThumb.alt = result.title;
      cardThumb.addEventListener("load", () => imageArea.classList.add("loaded"));
      cardThumb.addEventListener("error", () => {
        cardThumb.remove();
        imageArea.classList.add("failed");
      });
    } else {
      imageArea.classList.add("failed");
    }

    const titleLink = fragment.querySelector(".card-title-link");
    titleLink.href = detailHref;
    titleLink.textContent = result.title;

    fragment.querySelector(".rank-badge").textContent = `#${result.rank}`;
    fragment.querySelector(".card-date").textContent = formatDate(result.award_date);

    const scorePill = fragment.querySelector(".score-pill");
    const isSeed = result.score === 0;
    // For default browse (seed results), hide score + reason — keep cards clean
    if (isSeed) {
      scorePill.remove();
      fragment.querySelector(".card-reason").remove();
      fragment.querySelector(".reason-chips").remove();
    } else {
      scorePill.textContent = `${result.score.toFixed(1)} match`;
      fragment.querySelector(".card-reason").textContent = reasons.length
        ? `Why it fits: ${reasons.join(" · ")}`
        : "";
      const reasonRoot = fragment.querySelector(".reason-chips");
      if (reasons.length) { reasons.forEach((label) => reasonRoot.appendChild(makeTag(label, "accent"))); }
      else { reasonRoot.remove(); }
    }

    [
      ["categories", result.categories],
      ["styles", result.style_tags],
      ["tech", result.tech_tags],
    ].forEach(([selector, values]) => {
      const root = fragment.querySelector(`.${selector}`);
      (values || []).forEach((value) => root.appendChild(makeTag(value)));
    });

    fragment.querySelector("[data-live-link]").href = result.live_url;
    fragment.querySelector("[data-source-link]").href = result.source_url;

    els.results.appendChild(fragment);
  });
}

async function loadDefaultBrowse() {
  autoSearchPending = true;
  try {
    const res = await fetch("/api/discover?limit=12");
    if (!res.ok) throw new Error("discover failed");
    const data = await res.json();
    // Render as seed cards (score=0 → no match score or reason shown)
    const fakePayload = {
      results: (data.entries || []).map((e) => ({ ...e, score: 0, match_reason: "" })),
      filters: { query: "" },
      dataset: data.dataset || "",
      assistant: { summary: "", focus_label: "All", hint_terms: [], effective_query: "" },
    };
    els.readoutPanel.hidden = true;
    renderResults(fakePayload);
  } catch (_) {
    // silently fail — grid stays empty, user can search manually
  } finally {
    autoSearchPending = false;
  }
}

// ─── Image search ─────────────────────────────────────────────────────────────

let stagedImageFile = null; // File object waiting to be searched

function stageImage(file) {
  if (!file || !file.type.startsWith("image/")) return;
  stagedImageFile = file;
  const url = URL.createObjectURL(file);
  els.imagePreview.src = url;
  els.imageDropZone.hidden = false;
  els.query.value = "";
  els.query.placeholder = "Image staged — hit Search to find similar designs";
}

function clearStagedImage() {
  stagedImageFile = null;
  if (els.imagePreview.src.startsWith("blob:")) URL.revokeObjectURL(els.imagePreview.src);
  els.imagePreview.src = "";
  els.imageDropZone.hidden = true;
  els.query.placeholder = "e.g. premium fintech onboarding for a startup";
}

function bindImageSearch() {
  // Camera / file icon button → open file picker
  els.imageSearchBtn.addEventListener("click", () => els.imageFileInput.click());

  // File picker selection
  els.imageFileInput.addEventListener("change", () => {
    const file = els.imageFileInput.files[0];
    if (file) stageImage(file);
    els.imageFileInput.value = "";
  });

  // Clear staged image
  els.imageClearBtn.addEventListener("click", clearStagedImage);

  // Paste anywhere on the results page
  document.addEventListener("paste", (e) => {
    if (els.resultsView.hidden) return;
    const item = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith("image/"));
    if (item) {
      e.preventDefault();
      stageImage(item.getAsFile());
    }
  });

  // Drag-and-drop onto the results view
  els.resultsView.addEventListener("dragover", (e) => {
    if ([...e.dataTransfer.items].some((i) => i.type.startsWith("image/"))) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      els.resultsView.classList.add("drag-over");
    }
  });
  els.resultsView.addEventListener("dragleave", () => els.resultsView.classList.remove("drag-over"));
  els.resultsView.addEventListener("drop", (e) => {
    els.resultsView.classList.remove("drag-over");
    const file = [...e.dataTransfer.files].find((f) => f.type.startsWith("image/"));
    if (file) { e.preventDefault(); stageImage(file); }
  });
}

async function runImageSearch() {
  if (!stagedImageFile) return runSearch();

  setStatus("Analysing image…");
  if (window.location.hash !== "#/results") {
    window.location.hash = "#/results";
    await new Promise((r) => setTimeout(r, 50));
  }

  const limit = els.limit ? els.limit.value.trim() || "8" : "8";
  const formData = new FormData();
  formData.append("image", stagedImageFile, stagedImageFile.name);

  try {
    const res = await fetch(`/api/search-by-image?limit=${limit}`, { method: "POST", body: formData });
    const payload = await res.json();
    if (!res.ok) throw new Error(payload.error || "Image search failed.");

    // Populate the text query box with what Claude extracted so user can refine
    if (payload.vision?.query) els.query.value = payload.vision.query;

    renderReadout(payload);
    renderResults(payload);
    const mood = payload.vision?.mood ? ` · ${payload.vision.mood} mood` : "";
    setStatus(`${payload.results.length} result(s) found from image${mood}.`);
  } catch (err) {
    setStatus(err.message, true);
  }
}

async function runSearch() {
  const params = serializeState();
  setStatus("Searching…");

  // Navigate to results view
  if (window.location.hash !== "#/results") {
    window.location.hash = "#/results";
  } else {
    showResults(); // already on results — router won't re-fire
  }

  const response = await fetch(`/api/search?${params.toString()}`);
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Search failed.");

  renderReadout(payload);
  renderResults(payload);
  setStatus(`${payload.results.length} result(s) found.`);
}

async function loadOptions() {
  const response = await fetch("/api/options");
  if (!response.ok) throw new Error("Unable to load filters.");
  const payload = await response.json();
  els.datasetName.textContent = payload.dataset;
  if (els.resultsDatasetPill) els.resultsDatasetPill.textContent = payload.dataset;
  renderFocusFilters(payload.focus);
  renderFilterGroup("category", payload.categories);
  renderFilterGroup("style", payload.styles);
  renderFilterGroup("tech", payload.tech);
}

async function copyMarkdown() {
  const response = await fetch(`/api/export.md?${serializeState().toString()}`);
  if (!response.ok) throw new Error("Export failed.");
  const markdown = await response.text();
  await navigator.clipboard.writeText(markdown);
  setStatus("Markdown copied to clipboard.");
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

async function boot() {
  bindFeed();

  try {
    await loadOptions();
  } catch (error) {
    console.warn("Options load failed:", error.message);
  }

  // Wire feed search form — bridges query to results view then searches
  if (els.feedSearchForm) {
    els.feedSearchForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (els.feedQuery && els.query) {
        els.query.value = els.feedQuery.value;
      }
      showResults();
      window.location.hash = "#/results";
      try { await runSearch(); }
      catch (error) { setStatus(error.message, true); }
    });
  }

  // Wire image search
  bindImageSearch();

  // Wire results view search form — routes to image search if an image is staged
  els.searchForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    try { await (stagedImageFile ? runImageSearch() : runSearch()); }
    catch (error) { setStatus(error.message, true); }
  });

  // Advanced search modal
  els.toggleAdvanced.addEventListener("click", () => setAdvancedOpen(true));
  els.advancedModalClose.addEventListener("click", () => setAdvancedOpen(false));
  els.advancedModalBackdrop.addEventListener("click", () => setAdvancedOpen(false));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setAdvancedOpen(false); });
  els.advancedApply.addEventListener("click", async () => {
    setAdvancedOpen(false);
    try { await runSearch(); }
    catch (error) { setStatus(error.message, true); }
  });

  // Reset filters
  els.resetFilters.addEventListener("click", async () => {
    els.query.value = "";
    if (els.similarTo) els.similarTo.value = "";
    if (els.limit) els.limit.value = "8";
    state.focus = "all";
    ["category", "style", "tech"].forEach((kind) => state[kind].clear());
    syncFocusButtons();
    syncFilterButtons();
    setAdvancedOpen(false);
    try { await runSearch(); }
    catch (error) { setStatus(error.message, true); }
  });

  // Copy markdown
  els.copyMarkdown.addEventListener("click", async () => {
    try { await copyMarkdown(); }
    catch (error) { setStatus(error.message, true); }
  });

  // Route then load feed
  route();
  loadFeed();
}

boot();
