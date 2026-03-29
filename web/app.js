// ─── State ────────────────────────────────────────────────────────────────────

const state = {
  focus: "all",
  year: null,
  category: new Set(),
  style: new Set(),
  tech: new Set(),
};

// Prompt chips — tracked separately so they stack additively with the text query
const activePromptChips = new Set();

const STATIC_CATALOG = window.__DESIGN_REFS_CATALOG__ || null;
const STATIC_IMAGE_SEARCH_MESSAGE = "Image search requires the local Python server.";
let apiReachable = null;

const QUERY_ALIASES = {
  // ── Domains / product types ──────────────────────────────────────────────
  "agency":        ["design", "agencies", "portfolio"],
  "app":           ["mobile", "apps", "ui", "design"],
  "app-ui":        ["mobile", "apps", "ui", "design"],
  "b2b":           ["technology", "saas", "corporate"],
  "brand":         ["portfolio", "agency", "design"],
  "checkout":      ["e-commerce", "consumer", "ui", "design", "clean"],
  "corporate":     ["technology", "business", "clean"],
  "dashboard":     ["technology", "startups", "ui", "design", "data"],
  "e-commerce":    ["e-commerce", "consumer", "clean"],
  "event":         ["promotional", "storytelling", "scrolling"],
  "fashion":       ["luxury", "editorial", "photography"],
  "fintech":       ["technology", "startups", "business", "corporate", "clean"],
  "food":          ["luxury", "e-commerce", "editorial", "photography"],
  "gaming":        ["dark", "immersive", "3d", "experimental"],
  "health":        ["clean", "minimal", "technology"],
  "landing-page":  ["promotional", "storytelling", "scrolling", "typography"],
  "magazine":      ["editorial", "typography", "graphic"],
  "mobile":        ["mobile", "apps", "ui", "design"],
  "music":         ["motion", "animation", "storytelling", "dark"],
  "nft":           ["experimental", "art", "illustration"],
  "onboarding":    ["mobile", "apps", "clean", "ui", "interaction"],
  "portfolio":     ["portfolio", "agency", "design"],
  "product":       ["technology", "clean", "ui", "design"],
  "product-design":["app-ui", "saas", "clean"],
  "restaurant":    ["luxury", "editorial", "photography"],
  "saas":          ["technology", "startups", "clean", "ui", "design"],
  "startup":       ["saas", "fintech", "technology"],
  "studio":        ["portfolio", "agency", "design"],
  "tech":          ["technology", "startups", "clean"],
  "travel":        ["editorial", "photography", "storytelling"],
  // ── Motion / interaction ─────────────────────────────────────────────────
  "3d":            ["immersive", "webgl", "3d"],
  "animation":     ["animation", "motion", "scrolling"],
  "animated":      ["animation", "motion", "scrolling"],
  "canvas":        ["experimental", "webgl", "animation"],
  "creative-coding":["experimental", "webgl", "canvas"],
  "hero":          ["storytelling", "scrolling", "immersive"],
  "hover":         ["microinteractions", "interaction", "animation"],
  "immersive":     ["animation", "storytelling", "3d", "scrolling", "webgl"],
  "interactive":   ["interaction", "animation", "scrolling"],
  "kinetic":       ["animation", "motion", "typography"],
  "loading":       ["animation", "microinteractions"],
  "microinteraction":["microinteractions", "interaction", "animation"],
  "motion":        ["animation", "transitions", "microinteractions", "scrolling"],
  "parallax":      ["scrolling", "animation", "parallax"],
  "scroll":        ["scrolling", "animation", "parallax"],
  "scroll-driven": ["scrolling", "animation", "parallax"],
  "scrolling":     ["scrolling", "animation", "parallax"],
  "transition":    ["animation", "transitions", "motion"],
  "video":         ["storytelling", "motion", "animation", "cinematic"],
  "webgl":         ["immersive", "3d", "experimental"],
  // ── Typography / layout ──────────────────────────────────────────────────
  "big-type":      ["typography", "bold", "graphic"],
  "display":       ["typography", "bold", "editorial"],
  "editorial":     ["typography", "graphic", "editorial"],
  "expressive":    ["typography", "experimental", "graphic"],
  "headline":      ["typography", "editorial", "bold"],
  "lettering":     ["typography", "graphic", "illustration"],
  "serif":         ["editorial", "typography", "luxury"],
  "text-heavy":    ["typography", "editorial", "graphic"],
  "type":          ["typography", "editorial", "graphic"],
  "type-led":      ["typography", "editorial", "graphic"],
  "typeface":      ["typography", "editorial", "graphic"],
  "typographic":   ["typography", "editorial", "graphic"],
  "typography":    ["typography", "editorial", "graphic"],
  // ── Visual quality adjectives ────────────────────────────────────────────
  "airy":          ["minimal", "clean", "editorial"],
  "brutal":        ["graphic", "experimental", "brutalist", "typography"],
  "brutalist":     ["graphic", "experimental", "brutalist", "typography"],
  "busy":          ["colorful", "graphic", "experimental"],
  "chaotic":       ["experimental", "graphic", "brutalist"],
  "cinematic":     ["cinematic", "dark", "storytelling", "photography"],
  "clean":         ["minimal", "clean"],
  "complex":       ["immersive", "3d", "experimental"],
  "crisp":         ["minimal", "clean", "typography"],
  "dark":          ["dark", "cinematic", "minimal"],
  "delicate":      ["minimal", "clean", "editorial"],
  "dense":         ["editorial", "typography", "graphic"],
  "detailed":      ["editorial", "graphic", "illustration"],
  "dramatic":      ["cinematic", "dark", "immersive"],
  "dreamy":        ["minimal", "colorful", "illustration"],
  "dynamic":       ["animation", "bold", "scrolling"],
  "edgy":          ["experimental", "dark", "brutalist"],
  "elegant":       ["luxury", "minimal", "editorial"],
  "energetic":     ["bold", "colorful", "animation"],
  "experimental":  ["experimental", "graphic", "brutalist"],
  "flat":          ["minimal", "clean", "ui"],
  "fluid":         ["animation", "minimal", "scrolling"],
  "focused":       ["minimal", "clean", "typography"],
  "frosted":       ["minimal", "clean", "ui"],
  "futuristic":    ["technology", "experimental", "3d", "dark"],
  "geometric":     ["graphic", "minimal", "experimental"],
  "glassy":        ["minimal", "clean", "ui"],
  "glossy":        ["minimal", "clean", "technology"],
  "gritty":        ["experimental", "graphic", "brutalist"],
  "groovy":        ["colorful", "graphic", "experimental"],
  "heavy":         ["bold", "typography", "graphic"],
  "immersive":     ["animation", "storytelling", "3d", "scrolling", "webgl"],
  "layered":       ["editorial", "graphic", "experimental"],
  "light":         ["minimal", "clean", "editorial"],
  "loud":          ["bold", "colorful", "graphic"],
  "lush":          ["colorful", "illustration", "photography"],
  "luxurious":     ["luxury", "editorial", "photography"],
  "luxury":        ["luxury"],
  "maximalist":    ["colorful", "graphic", "editorial"],
  "minimal":       ["minimal", "clean"],
  "minimalist":    ["minimal", "clean"],
  "moody":         ["dark", "cinematic", "photography"],
  "neutral":       ["minimal", "clean", "editorial"],
  "open":          ["minimal", "clean", "editorial"],
  "opulent":       ["luxury", "editorial", "photography"],
  "organic":       ["minimal", "clean", "illustration"],
  "ornate":        ["luxury", "editorial", "graphic"],
  "polished":      ["minimal", "clean", "technology"],
  "premium":       ["luxury", "minimal", "clean"],
  "quiet":         ["minimal", "clean"],
  "raw":           ["experimental", "brutalist", "graphic"],
  "refined":       ["minimal", "luxury", "editorial"],
  "retro":         ["graphic", "experimental", "colorful"],
  "rich":          ["luxury", "colorful", "photography"],
  "rough":         ["experimental", "brutalist", "graphic"],
  "saturated":     ["colorful", "bold", "photography"],
  "sharp":         ["minimal", "clean", "typography", "editorial"],
  "simple":        ["minimal", "clean"],
  "sleek":         ["minimal", "clean", "technology"],
  "slow":          ["cinematic", "storytelling", "minimal"],
  "smooth":        ["minimal", "clean", "animation"],
  "soft":          ["minimal", "clean", "colorful"],
  "spacious":      ["minimal", "clean", "editorial"],
  "sparse":        ["minimal", "clean"],
  "striking":      ["bold", "colorful", "graphic"],
  "structured":    ["editorial", "clean", "graphic"],
  "subtle":        ["minimal", "clean", "editorial"],
  "surreal":       ["experimental", "illustration", "3d"],
  "tactile":       ["graphic", "illustration", "editorial"],
  "textured":      ["graphic", "editorial", "experimental"],
  "tight":         ["typography", "editorial", "graphic"],
  "understated":   ["minimal", "clean", "editorial"],
  "unique":        ["experimental", "graphic", "brutalist"],
  "unusual":       ["experimental", "brutalist", "graphic"],
  "vibrant":       ["colorful", "bold", "animation"],
  "vintage":       ["editorial", "graphic", "photography"],
  "warm":          ["colorful", "editorial", "photography"],
  "weird":         ["experimental", "brutalist", "graphic"],
  "wide":          ["editorial", "minimal", "photography"],
  // ── Color / tone ─────────────────────────────────────────────────────────
  "black":         ["dark", "minimal", "cinematic"],
  "blue":          ["technology", "minimal", "clean", "dark"],
  "bright":        ["colorful", "bold"],
  "brown":         ["editorial", "photography", "luxury"],
  "colorful":      ["colorful", "bold", "illustration"],
  "cool":          ["minimal", "technology", "dark"],
  "duotone":       ["minimal", "graphic", "editorial"],
  "gold":          ["luxury", "editorial"],
  "gradient":      ["colorful", "bold"],
  "green":         ["minimal", "health", "clean"],
  "high-contrast": ["bold", "dark", "graphic"],
  "low-contrast":  ["minimal", "clean", "editorial"],
  "monochrome":    ["minimal", "dark", "editorial"],
  "muted":         ["minimal", "clean", "editorial"],
  "neon":          ["experimental", "dark", "animation", "colorful"],
  "orange":        ["bold", "colorful"],
  "pastel":        ["colorful", "playful", "clean"],
  "pink":          ["colorful", "playful"],
  "purple":        ["dark", "luxury", "immersive", "experimental"],
  "red":           ["bold", "colorful", "animation"],
  "white":         ["minimal", "clean", "editorial"],
  "yellow":        ["bold", "colorful", "graphic"],
  // ── Mood / atmosphere ────────────────────────────────────────────────────
  "aggressive":    ["bold", "dark", "experimental"],
  "approachable":  ["clean", "colorful", "illustration"],
  "calm":          ["minimal", "clean", "editorial"],
  "casual":        ["colorful", "clean", "illustration"],
  "confident":     ["bold", "typography", "graphic"],
  "cool":          ["minimal", "dark", "technology"],
  "dark":          ["dark", "cinematic", "minimal"],
  "energetic":     ["bold", "colorful", "animation"],
  "ethereal":      ["minimal", "colorful", "illustration"],
  "exclusive":     ["luxury", "minimal", "dark"],
  "formal":        ["editorial", "clean", "minimal"],
  "friendly":      ["colorful", "illustration", "clean"],
  "fun":           ["colorful", "illustration", "animation"],
  "glamorous":     ["luxury", "photography", "dark"],
  "human":         ["photography", "editorial", "illustration"],
  "intimate":      ["photography", "editorial", "minimal"],
  "joyful":        ["colorful", "illustration", "animation"],
  "mysterious":    ["dark", "experimental", "cinematic"],
  "nostalgic":     ["editorial", "graphic", "photography"],
  "optimistic":    ["colorful", "clean", "illustration"],
  "playful":       ["colorful", "illustration", "animation"],
  "professional":  ["clean", "minimal", "technology"],
  "provocative":   ["experimental", "brutalist", "bold"],
  "rebellious":    ["experimental", "brutalist", "dark"],
  "serious":       ["minimal", "dark", "editorial"],
  "sophisticated": ["luxury", "minimal", "editorial"],
  "tense":         ["dark", "cinematic", "experimental"],
  "trustworthy":   ["clean", "minimal", "technology"],
  "whimsical":     ["colorful", "illustration", "animation"],
  // ── Design movements / styles ────────────────────────────────────────────
  "art-deco":      ["luxury", "editorial", "graphic"],
  "bauhaus":       ["graphic", "minimal", "typography"],
  "claymorphism":  ["colorful", "illustration", "clean"],
  "dark-mode":     ["dark", "cinematic", "minimal"],
  "glassmorphism": ["minimal", "clean", "ui"],
  "memphis":       ["colorful", "graphic", "experimental"],
  "modernist":     ["minimal", "editorial", "graphic"],
  "neomorphism":   ["minimal", "clean", "ui"],
  "swiss":         ["minimal", "typography", "editorial"],
  "y2k":           ["experimental", "colorful", "graphic"],
  // ── Slang / casual / street vocabulary ───────────────────────────────────
  "aesthetic":     ["minimal", "colorful", "editorial"],
  "basic":         ["minimal", "clean"],
  "bling":         ["luxury", "gold", "bold", "colorful"],
  "blingy":        ["luxury", "gold", "bold", "colorful"],
  "bussin":        ["bold", "colorful", "animation"],
  "chill":         ["minimal", "clean", "editorial"],
  "class":         ["luxury", "minimal", "editorial"],
  "classy":        ["luxury", "minimal", "editorial"],
  "cool":          ["minimal", "dark", "technology"],
  "dope":          ["bold", "experimental", "dark"],
  "elite":         ["luxury", "minimal"],
  "expensive":     ["luxury", "minimal", "editorial"],
  "extra":         ["luxury", "colorful", "bold"],
  "fancy":         ["luxury", "editorial", "minimal"],
  "fire":          ["bold", "animation", "colorful"],
  "flashy":        ["luxury", "bold", "colorful", "animation"],
  "gaudy":         ["luxury", "colorful", "bold"],
  "highkey":       ["bold", "colorful"],
  "hype":          ["bold", "animation", "colorful"],
  "janky":         ["experimental", "brutalist", "graphic"],
  "lit":           ["bold", "colorful", "animation"],
  "lowkey":        ["minimal", "clean"],
  "money":         ["luxury", "gold", "bold"],
  "posh":          ["luxury", "minimal", "dark"],
  "premium":       ["luxury", "minimal", "clean"],
  "punchy":        ["bold", "typography", "colorful"],
  "rich":          ["luxury", "colorful", "photography"],
  "sick":          ["bold", "experimental", "graphic"],
  "slick":         ["minimal", "clean", "technology"],
  "snappy":        ["animation", "bold", "typography"],
  "sparkly":       ["colorful", "animation", "luxury"],
  "swanky":        ["luxury", "dark", "minimal"],
  "tacky":         ["experimental", "colorful", "graphic"],
  "trashy":        ["experimental", "brutalist", "graphic"],
  "vibe":          ["minimal", "colorful", "editorial"],
  "wavy":          ["animation", "colorful", "experimental"],
  "weird":         ["experimental", "brutalist", "graphic"],
  // ── Material / surface ───────────────────────────────────────────────────
  "chrome":        ["minimal", "technology", "experimental"],
  "glass":         ["minimal", "clean", "ui"],
  "glittery":      ["colorful", "luxury", "animation"],
  "glossy":        ["minimal", "clean", "technology"],
  "matte":         ["minimal", "clean", "editorial"],
  "metallic":      ["minimal", "technology", "dark"],
  "shiny":         ["minimal", "clean", "luxury"],
  "sparkle":       ["colorful", "animation", "luxury"],
};

const FOCUS_PRESETS = {
  "all": {
    label: "All",
    description: "Let the natural-language query steer the results.",
    categories: [],
    query_terms: [],
  },
  "web-interactive": {
    label: "Web & Interactive",
    description: "Broader digital-experience references.",
    categories: ["Web & Interactive"],
    query_terms: ["web"],
  },
  "mobile-ui": {
    label: "Mobile & UI",
    description: "UI-heavy and product-oriented references.",
    categories: [],
    query_terms: ["app-ui", "onboarding"],
  },
  "technology": {
    label: "Technology",
    description: "Startup, SaaS, and product storytelling references.",
    categories: ["Technology"],
    query_terms: ["saas"],
  },
  "architecture": {
    label: "Architecture",
    description: "Spatial, gallery-like, and architectural presentation work.",
    categories: ["Architecture"],
    query_terms: ["architecture", "minimalist"],
  },
  "luxury": {
    label: "Luxury",
    description: "Premium, polished, image-led references.",
    categories: ["Luxury"],
    query_terms: ["luxury", "premium"],
  },
  "e-commerce": {
    label: "E-Commerce",
    description: "Commerce, product, and checkout-oriented references.",
    categories: ["E-Commerce"],
    query_terms: ["checkout"],
  },
  "typography": {
    label: "Typography",
    description: "Type-led, editorial, and lettering-forward references.",
    categories: [],
    query_terms: ["typography", "editorial", "type-led"],
  },
  "color": {
    label: "Color & Palette",
    description: "Bold, expressive, or distinctive use of color.",
    categories: [],
    query_terms: ["colorful", "bold-color", "gradient"],
  },
  "motion": {
    label: "Motion & Animation",
    description: "Animation-rich, scroll-driven, and motion-forward work.",
    categories: [],
    query_terms: ["motion", "animation", "scroll-driven", "parallax"],
  },
  "dark": {
    label: "Dark Mode",
    description: "Dark-background, cinematic, and night-mode aesthetics.",
    categories: [],
    query_terms: ["dark", "dark-mode", "cinematic"],
  },
  "minimal": {
    label: "Minimal",
    description: "Clean, restrained, whitespace-first design.",
    categories: [],
    query_terms: ["minimalist", "minimal", "clean"],
  },
  "3d": {
    label: "3D & Immersive",
    description: "Three-dimensional, WebGL, and spatially immersive work.",
    categories: [],
    query_terms: ["3d", "webgl", "immersive", "spatial"],
  },
  "portfolio": {
    label: "Portfolio & Studio",
    description: "Agency, creative studio, and personal portfolio work.",
    categories: [],
    query_terms: ["portfolio", "agency", "studio"],
  },
};

const QUERY_HINTS = {
  "app": ["app-ui"],
  "apps": ["app-ui"],
  "architecture": ["architecture"],
  "animation": ["motion"],
  "b2b": ["b2b"],
  "brand": ["brand"],
  "brutalist": ["brutalist"],
  "canvas": ["canvas"],
  "checkout": ["checkout"],
  "corporate": ["corporate"],
  "creative coding": ["creative-coding"],
  "dark": ["dark-mode"],
  "dark mode": ["dark-mode"],
  "dark theme": ["dark-mode"],
  "dashboard": ["dashboard"],
  "editorial": ["editorial"],
  "event": ["event"],
  "fashion": ["fashion"],
  "fintech": ["fintech"],
  "food": ["food"],
  "glass": ["glassmorphism"],
  "glassmorphism": ["glassmorphism"],
  "gradient": ["gradient"],
  "health": ["health"],
  "immersive": ["immersive"],
  "landing page": ["landing-page"],
  "luxury": ["luxury"],
  "magazine": ["magazine"],
  "medical": ["health"],
  "mobile": ["app-ui"],
  "motion": ["motion"],
  "music": ["music"],
  "nft": ["nft"],
  "onboarding": ["onboarding"],
  "portfolio": ["portfolio"],
  "premium": ["luxury"],
  "product": ["product-design"],
  "restaurant": ["restaurant"],
  "saas": ["saas"],
  "scroll": ["scroll-driven"],
  "scrolling": ["scroll-driven"],
  "serif": ["serif"],
  "startup": ["startup"],
  "studio": ["studio"],
  "tech": ["tech"],
  "travel": ["travel"],
  "type": ["type-led"],
  "typography": ["type-led"],
  "video": ["video"],
  "webgl": ["webgl"],
  "3d": ["3d"],
};

const DESIGN_CATEGORIES = new Set([
  "Web & Interactive",
  "Design Agencies",
  "Experimental",
  "Art & Illustration",
  "Architecture",
  "Technology",
  "Startups",
  "Culture & Education",
  "Photography",
  "E-Commerce",
  "Mobile & Apps",
  "Magazine / Newspaper / Blog",
]);

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
  motionLabView: document.getElementById("motion-lab-view"),
  motionLabBack: document.getElementById("motion-lab-back"),
  motionLabStage: document.getElementById("motion-lab-stage"),
  motionLabCarousel: document.getElementById("motion-lab-carousel"),
  motionLabTrack: document.getElementById("motion-lab-track"),
  motionLabPrev: document.getElementById("motion-lab-prev"),
  motionLabNext: document.getElementById("motion-lab-next"),
  motionLabPosition: document.getElementById("motion-lab-position"),
  motionLabDatasetPill: document.getElementById("motion-lab-dataset-pill"),
  motionLabNote: document.getElementById("motion-lab-note"),

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
  openMotionLab: document.getElementById("open-motion-lab"),
  toggleAdvanced: document.getElementById("toggle-advanced"),
  advancedPanel: document.getElementById("advanced-panel"),
  advancedApply: document.getElementById("advanced-apply"),
  activeFilters: document.getElementById("active-filters"),
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
  } else if (hash.startsWith("#/motion-lab")) {
    showMotionLab();
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
  if (els.motionLabView) els.motionLabView.hidden = true;
  teardownMotionLabInteraction();
  document.body.style.overflow = "hidden";
  document.title = "Design Refs";
  // Resume stagger reveal if feed is loaded
  if (feedLoaded) startFloatingCopy();
}

function showResults() {
  els.feedView.hidden = true;
  els.resultsView.hidden = false;
  els.detailView.hidden = true;
  if (els.motionLabView) els.motionLabView.hidden = true;
  teardownMotionLabInteraction();
  document.body.style.overflow = "";
  document.title = "Search · Design Refs";
  // Pause the stagger animation while not on feed
  if (startFloatingCopy._stop) startFloatingCopy._stop();
  // Auto-load a default browse view if the results grid is empty
  if (!els.results.children.length && !autoSearchPending) {
    loadDefaultBrowse();
  }
  if (pendingAdvancedOpen) {
    setAdvancedOpen(true);
    pendingAdvancedOpen = false;
  }
}

async function showDetail(slug) {
  els.feedView.hidden = true;
  els.resultsView.hidden = true;
  els.detailView.hidden = false;
  if (els.motionLabView) els.motionLabView.hidden = true;
  teardownMotionLabInteraction();
  document.body.style.overflow = "";
  els.detailView.replaceChildren(makeStatusNode("detail-loading", "Loading…"));

  try {
    const ref = await requestJson(`/api/ref/${encodeURIComponent(slug)}`, {
      fallback: () => getStaticRef(slug),
    });
    renderDetail(ref);
    document.title = `${ref.title} · Design Refs`;
  } catch (err) {
    els.detailView.replaceChildren(makeStatusNode("detail-error", err.message));
  }
}

async function showMotionLab() {
  if (!els.motionLabView) {
    window.location.hash = "#/";
    return;
  }
  els.feedView.hidden = true;
  els.resultsView.hidden = true;
  els.detailView.hidden = true;
  els.motionLabView.hidden = false;
  document.body.style.overflow = "";
  document.title = "Motion Lab · Design Refs";
  if (startFloatingCopy._stop) startFloatingCopy._stop();
  await loadMotionLab();
}

window.addEventListener("hashchange", route);

// ─── Feed (landing swipe view) ────────────────────────────────────────────────

let feedEntries = [];
let feedLoaded = false;
let autoSearchPending = false; // guard against re-entrant auto-browse search
let pendingAdvancedOpen = false;
let motionLabLoaded = false;
let motionLabController = null;
const feedThumbnailMetaCache = new Map();

const FEED_QUALITY_GATE = {
  rules: {
    minWidth: 1700,
    minHeight: 900,
    maxCoverScale: 1.85,
  },
  targetSlides: 90,
  minSlides: 20,
  maxProbeCandidates: 260,
  probeConcurrency: 12,
  probeTimeoutMs: 6500,
};

function getFeedViewportSize() {
  const trackW = els.feedTrack ? els.feedTrack.clientWidth : 0;
  const trackH = els.feedTrack ? els.feedTrack.clientHeight : 0;
  return {
    width: Math.max(trackW, window.innerWidth || 0, 1),
    height: Math.max(trackH, window.innerHeight || 0, 1),
  };
}

function evaluateFeedThumbnailQuality(meta, viewport, rules) {
  const width = meta.width || 0;
  const height = meta.height || 0;
  if (width < rules.minWidth || height < rules.minHeight) {
    return {
      ok: false,
      reason: `source too small (${width}x${height})`,
      coverScale: Infinity,
    };
  }
  const coverScale = Math.max(
    viewport.width / Math.max(width, 1),
    viewport.height / Math.max(height, 1),
  );
  if (coverScale > rules.maxCoverScale) {
    return {
      ok: false,
      reason: `upscale too high (${coverScale.toFixed(2)}x)`,
      coverScale,
    };
  }
  return { ok: true, reason: "ok", coverScale };
}

function probeFeedThumbnailMeta(url) {
  return new Promise((resolve) => {
    const img = new Image();
    let settled = false;
    const cleanup = () => {
      img.onload = null;
      img.onerror = null;
    };
    const finish = (payload) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(payload);
    };
    const timer = window.setTimeout(() => {
      finish({ ok: false, width: 0, height: 0, reason: "timeout" });
    }, FEED_QUALITY_GATE.probeTimeoutMs);

    img.onload = () => {
      window.clearTimeout(timer);
      finish({
        ok: true,
        width: img.naturalWidth || 0,
        height: img.naturalHeight || 0,
        reason: "loaded",
      });
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      finish({ ok: false, width: 0, height: 0, reason: "load-error" });
    };
    img.src = url;
  });
}

async function getFeedThumbnailMeta(url) {
  const cached = feedThumbnailMetaCache.get(url);
  if (cached) {
    if (typeof cached.then === "function") return cached;
    return cached;
  }
  const pending = probeFeedThumbnailMeta(url).then((meta) => {
    feedThumbnailMetaCache.set(url, meta);
    return meta;
  });
  feedThumbnailMetaCache.set(url, pending);
  return pending;
}

async function curateFeedEntriesByQuality(entries, limit) {
  const requested = Math.min(
    entries.length,
    Math.max(limit || 0, FEED_QUALITY_GATE.minSlides),
  );
  const target = Math.min(requested, FEED_QUALITY_GATE.targetSlides);
  const maxCandidates = Math.min(entries.length, FEED_QUALITY_GATE.maxProbeCandidates);
  const candidates = entries.slice(0, maxCandidates);
  const viewport = getFeedViewportSize();
  const accepted = [];
  let cursor = 0;

  async function worker() {
    while (true) {
      if (accepted.length >= target) return;
      const index = cursor;
      cursor += 1;
      if (index >= candidates.length) return;

      const entry = candidates[index];
      if (!entry.thumbnail_url) {
        continue;
      }
      const meta = await getFeedThumbnailMeta(entry.thumbnail_url);
      if (!meta.ok) continue;
      const quality = evaluateFeedThumbnailQuality(meta, viewport, FEED_QUALITY_GATE.rules);
      if (quality.ok) accepted.push({ index, entry });
    }
  }

  const workers = Array.from({ length: FEED_QUALITY_GATE.probeConcurrency }, () => worker());
  await Promise.all(workers);

  const sorted = accepted
    .sort((a, b) => a.index - b.index)
    .map((item) => item.entry)
    .slice(0, requested);

  return {
    entries: sorted,
    screened: maxCandidates,
    accepted: sorted.length,
    requested,
    gate: FEED_QUALITY_GATE.rules,
  };
}

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
    const data = await requestJson("/api/discover?limit=200", {
      fallback: () => getStaticDiscover(200),
    });
    loading.textContent = "Screening thumbnail quality…";
    const rawEntries = data.entries || [];
    const curated = await curateFeedEntriesByQuality(rawEntries, rawEntries.length);
    feedEntries = curated.entries;
    if (!feedEntries.length) {
      throw new Error("No slides passed the quality gate. Try again later.");
    }
    els.feedTrack.replaceChildren();
    feedEntries.forEach((entry) => {
      els.feedTrack.appendChild(buildFeedSlide(entry));
    });

    console.info(
      `[feed-quality] screened=${curated.screened} accepted=${curated.accepted} requested=${curated.requested} gate=${curated.gate.minWidth}x${curated.gate.minHeight}@${curated.gate.maxCoverScale.toFixed(2)}x`,
    );

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

function teardownMotionLabInteraction() {
  if (motionLabController) {
    motionLabController.destroy();
    motionLabController = null;
  }
}

function setMotionLabPosition(index, total) {
  if (!els.motionLabPosition) return;
  const safeTotal = Math.max(total || 0, 0);
  if (!safeTotal) {
    els.motionLabPosition.textContent = "0 / 0";
    return;
  }
  const safeIndex = Math.min(Math.max(index || 0, 0), safeTotal - 1);
  els.motionLabPosition.textContent = `${safeIndex + 1} / ${safeTotal}`;
}

function openMotionLabCard(entry) {
  const targetUrl = entry.live_url || entry.source_url;
  if (!targetUrl) return;
  window.open(targetUrl, "_blank", "noopener,noreferrer");
}

function buildMotionLabCard(entry) {
  const card = document.createElement("article");
  card.className = "motion-card";
  card.dataset.slug = entry.slug || "";

  const imageWrap = document.createElement("div");
  imageWrap.className = "motion-card-image";
  const img = document.createElement("img");
  img.className = "motion-card-thumb";
  img.loading = "lazy";
  img.alt = entry.title || "Design reference";
  if (entry.thumbnail_url) img.src = entry.thumbnail_url;
  imageWrap.appendChild(img);

  const body = document.createElement("div");
  body.className = "motion-card-body";

  const title = document.createElement("h3");
  title.className = "motion-card-title";
  title.textContent = entry.title || "Untitled";
  body.appendChild(title);

  const subtitle = document.createElement("p");
  subtitle.className = "motion-card-subtitle";
  subtitle.textContent = formatDate(entry.award_date);
  body.appendChild(subtitle);

  const chips = document.createElement("div");
  chips.className = "motion-card-chips";
  const labels = [
    ...(entry.categories || []),
    ...(entry.style_tags || []),
  ].slice(0, 2);
  labels.forEach((label) => {
    const chip = document.createElement("span");
    chip.className = "motion-card-chip";
    chip.textContent = label;
    chips.appendChild(chip);
  });
  body.appendChild(chips);

  const actions = document.createElement("div");
  actions.className = "motion-card-actions";
  if (entry.live_url || entry.source_url) {
    const live = document.createElement("a");
    live.className = "motion-card-action";
    live.href = entry.live_url || entry.source_url;
    live.target = "_blank";
    live.rel = "noreferrer";
    live.textContent = "Open ↗";
    actions.appendChild(live);
  }
  if (entry.slug) {
    const detail = document.createElement("a");
    detail.className = "motion-card-action";
    detail.href = `#/ref/${encodeURIComponent(entry.slug)}`;
    detail.textContent = "Details";
    actions.appendChild(detail);
  }
  body.appendChild(actions);

  card.appendChild(imageWrap);
  card.appendChild(body);

  if (entry.live_url || entry.source_url) {
    card.classList.add("is-clickable");
    card.setAttribute("role", "link");
    card.tabIndex = 0;
    card.addEventListener("click", (event) => {
      if (event.target.closest("a")) return;
      openMotionLabCard(entry);
    });
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openMotionLabCard(entry);
      }
    });
  }

  return card;
}

function startMotionLabInteraction() {
  teardownMotionLabInteraction();
  if (!els.motionLabStage || !els.motionLabCarousel || !els.motionLabTrack) return;
  const cards = els.motionLabTrack.querySelectorAll(".motion-card");
  if (!cards.length || typeof window.PointerCarouselLab !== "function") return;
  motionLabController = new window.PointerCarouselLab({
    stage: els.motionLabStage,
    scroller: els.motionLabCarousel,
    cards,
    onActiveChange: setMotionLabPosition,
  });
  setMotionLabPosition(0, cards.length);

  if (els.motionLabPrev) {
    els.motionLabPrev.onclick = () => {
      if (motionLabController) motionLabController.scrollByStep(-1);
    };
  }
  if (els.motionLabNext) {
    els.motionLabNext.onclick = () => {
      if (motionLabController) motionLabController.scrollByStep(1);
    };
  }
}

async function loadMotionLab() {
  if (!els.motionLabTrack) return;

  if (motionLabLoaded) {
    startMotionLabInteraction();
    return;
  }

  els.motionLabTrack.replaceChildren(makeStatusNode("motion-lab-loading", "Building motion lab…"));
  setMotionLabPosition(0, 0);

  try {
    let datasetLabel = (els.datasetName && els.datasetName.textContent) || "Design refs";
    let sourceEntries = feedEntries.filter((entry) => entry.thumbnail_url);

    if (sourceEntries.length < 18) {
      const data = await requestJson("/api/discover?limit=200", {
        fallback: () => getStaticDiscover(200),
      });
      datasetLabel = data.dataset || datasetLabel;
      sourceEntries = (data.entries || []).filter((entry) => entry.thumbnail_url);
    }

    if (!sourceEntries.length) {
      throw new Error("No entries available for motion lab.");
    }

    const curated = await curateFeedEntriesByQuality(sourceEntries, Math.min(sourceEntries.length, 64));
    const entries = (curated.entries || []).slice(0, 20);

    if (!entries.length) {
      throw new Error("No entries passed the motion-lab quality gate.");
    }

    els.motionLabTrack.replaceChildren();
    entries.forEach((entry) => {
      els.motionLabTrack.appendChild(buildMotionLabCard(entry));
    });

    if (els.motionLabDatasetPill) {
      els.motionLabDatasetPill.textContent = `${datasetLabel} · ${entries.length} entries`;
    }
    if (els.motionLabNote) {
      els.motionLabNote.textContent = `Quality-gated set loaded (${entries.length} cards). Carousel drifts across a curved rail; use your wheel to jump one-by-one, and hover to slow with gyro focus.`;
    }

    startMotionLabInteraction();
    motionLabLoaded = true;
  } catch (error) {
    els.motionLabTrack.replaceChildren(makeStatusNode("motion-lab-error", error.message));
    setMotionLabPosition(0, 0);
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

  // Results page prompt chips — toggle additively (multiple chips can combine)
  document.querySelectorAll(".results-chip[data-prompt]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const term = btn.dataset.prompt;
      if (activePromptChips.has(term)) {
        activePromptChips.delete(term);
        btn.classList.remove("active");
      } else {
        activePromptChips.add(term);
        btn.classList.add("active");
      }
      try { await runSearch(); }
      catch (error) { handleSearchError(error); }
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
      pendingAdvancedOpen = true;
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
  const shell = node("div", "detail-shell-inner");
  root.appendChild(shell);

  const nav = node("div", "archive-frame detail-nav-row");
  const back = node("button", "button ghost back-button detail-back-button");
  back.textContent = "← Back";
  back.addEventListener("click", () => history.back());
  const sourcePill = node("span", "dataset-pill detail-dataset-pill");
  sourcePill.textContent = ref.award_source || "Design Awards";
  nav.append(back, sourcePill);
  shell.appendChild(nav);

  const feature = node("section", "archive-frame detail-feature");
  const mediaColumn = node("div", "detail-media-column");
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
  mediaColumn.appendChild(hero);

  const contentColumn = node("div", "detail-feature-copy");
  const titleBlock = node("div", "detail-title-block");
  const eyebrow = node("p", "eyebrow");
  eyebrow.textContent = ref.award_source || "Design Awards";
  const title = node("h1", "detail-title");
  title.textContent = ref.title;
  const metaLine = node("p", "detail-meta-line");
  const rankPart = ref.source_rank ? ` · #${ref.source_rank}` : "";
  const yearPart = ref.award_year ? ` · ${ref.award_year}` : "";
  metaLine.textContent = `${ref.award_name || "Award"} · ${formatDate(ref.award_date)}${yearPart}${rankPart}`;
  titleBlock.append(eyebrow, title, metaLine);
  contentColumn.appendChild(titleBlock);

  const metaPills = node("div", "detail-meta-pills");
  if (ref.award_name) metaPills.appendChild(makeTag(ref.award_name));
  if (ref.award_year) metaPills.appendChild(makeTag(String(ref.award_year)));
  if (ref.source_rank) metaPills.appendChild(makeTag(`Rank #${ref.source_rank}`, "accent"));
  if (metaPills.childElementCount) contentColumn.appendChild(metaPills);

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
  contentColumn.appendChild(links);

  if (ref.short_description) {
    const desc = node("p", "detail-description");
    desc.textContent = ref.short_description;
    contentColumn.appendChild(desc);
  }

  feature.append(mediaColumn, contentColumn);
  shell.appendChild(feature);

  const tagSets = [
    ["Categories", ref.categories],
    ["Style", ref.style_tags],
    ["Motion", ref.motion_tags],
    ["Layout", ref.layout_tags],
    ["Tech", ref.tech_tags],
  ].filter(([, values]) => values && values.length);

  if (tagSets.length) {
    const tagsPanel = node("section", "archive-frame detail-tags-panel");
    tagSets.forEach(([label, values]) => {
      const group = node("div", "detail-tag-group");
      const heading = node("p", "meta-label");
      heading.textContent = label;
      const row = node("div", "tag-row");
      values.forEach((v) => row.appendChild(makeTag(v)));
      group.append(heading, row);
      tagsPanel.appendChild(group);
    });
    shell.appendChild(tagsPanel);
  }

  if (ref.related && ref.related.length) {
    const relSection = node("section", "archive-frame detail-related");
    const relEyebrow = node("p", "eyebrow");
    relEyebrow.textContent = "Related references";
    const relHeading = node("h2", "detail-related-heading");
    relHeading.textContent = "You might also like";
    relSection.append(relEyebrow, relHeading);
    const relGrid = node("div", "related-grid");
    ref.related.forEach((rel) => {
      const card = node("a", "related-card");
      card.href = `#/ref/${encodeURIComponent(rel.slug)}`;
      if (rel.thumbnail_url) {
        const thumb = node("img", "related-card-thumb");
        thumb.src = rel.thumbnail_url;
        thumb.alt = rel.title;
        thumb.addEventListener("load", () => thumb.classList.add("loaded"), { once: true });
        card.appendChild(thumb);
      }
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
    shell.appendChild(relSection);
  }
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function setStatus(message, isError = false) {
  els.statusText.replaceChildren();
  els.statusText.hidden = !message;
  els.statusText.classList.toggle("has-content", Boolean(message));
  els.statusText.dataset.error = String(isError);
  if (message) els.statusText.textContent = message;
}

function focusLabelFor(key) {
  return focusOptions.find((option) => option.key === key)?.label || FOCUS_PRESETS[key]?.label || "All";
}

function currentUiFilters() {
  return {
    query: els.query.value.trim(),
    similar_to: els.similarTo ? els.similarTo.value.trim() : "",
    focus: state.focus,
    focus_label: focusLabelFor(state.focus),
    year: state.year,
    category: [...state.category],
    style: [...state.style],
    tech: [...state.tech],
  };
}

function hasActiveUiFilters() {
  const filters = currentUiFilters();
  return Boolean(
    filters.query ||
    filters.similar_to ||
    filters.focus !== "all" ||
    filters.year !== null ||
    filters.category.length ||
    filters.style.length ||
    filters.tech.length
  );
}

function resetUiFilters({ clearQuery = true } = {}) {
  if (clearQuery) els.query.value = "";
  if (els.similarTo) els.similarTo.value = "";
  if (els.limit) els.limit.value = "24";
  state.focus = "all";
  state.year = null;
  ["category", "style", "tech"].forEach((kind) => state[kind].clear());
  syncFocusButtons();
  syncYearButtons();
  syncFilterButtons();
  renderActiveFilters();
}

function renderActiveFilters() {
  const filters = currentUiFilters();
  els.activeFilters.replaceChildren();

  const entries = [];
  if (filters.query) {
    entries.push({
      label: `Query: ${filters.query}`,
      remove: () => { els.query.value = ""; },
    });
  }
  if (filters.focus !== "all") {
    entries.push({
      label: `Focus: ${filters.focus_label}`,
      remove: () => { state.focus = "all"; syncFocusButtons(); },
    });
  }
  if (filters.similar_to) {
    entries.push({
      label: `Similar to: ${filters.similar_to}`,
      remove: () => { if (els.similarTo) els.similarTo.value = ""; },
    });
  }
  if (filters.year !== null) {
    entries.push({
      label: `Year: ${filters.year}`,
      remove: () => { state.year = null; syncYearButtons(); },
    });
  }
  filters.category.forEach((value) => entries.push({
    label: `Category: ${value}`,
    remove: () => { state.category.delete(value); syncFilterButtons(); },
  }));
  filters.style.forEach((value) => entries.push({
    label: `Style: ${value}`,
    remove: () => { state.style.delete(value); syncFilterButtons(); },
  }));
  filters.tech.forEach((value) => entries.push({
    label: `Tech: ${value}`,
    remove: () => { state.tech.delete(value); syncFilterButtons(); },
  }));

  if (!entries.length) {
    els.activeFilters.hidden = true;
    return;
  }

  const label = node("p", "subtle-label active-filter-label");
  label.textContent = "Active filters";
  const cloud = node("div", "chip-cloud active-filter-cloud");

  entries.forEach((entry) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip active-filter-pill";
    button.textContent = `${entry.label} ×`;
    button.addEventListener("click", async () => {
      entry.remove();
      renderActiveFilters();
      try { await runSearch(); }
      catch (searchError) { handleSearchError(searchError); }
    });
    cloud.appendChild(button);
  });

  els.activeFilters.append(label, cloud);
  els.activeFilters.hidden = false;
}

function renderStateCard({ eyebrowText, title, copy, actions = [] }) {
  els.readoutPanel.hidden = true;
  els.results.replaceChildren();

  const empty = document.createElement("article");
  empty.className = "panel empty-state archive-frame";
  if (eyebrowText) {
    const eyebrow = document.createElement("p");
    eyebrow.className = "eyebrow";
    eyebrow.textContent = eyebrowText;
    empty.appendChild(eyebrow);
  }
  const heading = document.createElement("h3");
  heading.textContent = title;
  const copyNode = document.createElement("p");
  copyNode.textContent = copy;
  empty.append(heading, copyNode);

  if (actions.length) {
    const actionRow = document.createElement("div");
    actionRow.className = "empty-state-actions";
    actions.forEach((action) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `button ${action.variant || "ghost"}`;
      button.textContent = action.label;
      button.addEventListener("click", action.onClick);
      actionRow.appendChild(button);
    });
    empty.appendChild(actionRow);
  }

  els.results.appendChild(empty);
}

function handleSearchError(error) {
  els.resultsHead.hidden = false;

  if (error.message !== "no matches") {
    els.resultsTitle.textContent = "Search unavailable";
    setStatus(error.message, true);
    renderStateCard({
      eyebrowText: "Search error",
      title: "The archive could not answer that search.",
      copy: error.message,
      actions: hasActiveUiFilters()
        ? [{
            label: "Clear filters",
            variant: "ghost",
            onClick: async () => {
              resetUiFilters();
              try { await runSearch(); }
              catch (searchError) { setStatus(searchError.message, true); }
            },
          }]
        : [],
    });
    renderActiveFilters();
    return;
  }

  const query = els.query.value.trim();
  const suggestions = query ? spellSuggest(query) : [];
  const corrected = query
    ? query.split(/\s+/).map((word) => {
        const match = suggestions.find((item) => item.original === word.toLowerCase());
        return match ? match.suggestion : word;
      }).join(" ")
    : "";

  els.resultsTitle.textContent = query ? `No matches for “${query}”` : "No matches";
  setStatus(
    suggestions.length
      ? "No exact matches. Try the suggested spelling or relax a filter."
      : "No matches found. Try a broader query or remove a filter.",
    true,
  );

  const actions = [];
  if (suggestions.length && corrected) {
    actions.push({
      label: `Try “${corrected}”`,
      variant: "secondary",
      onClick: async () => {
        els.query.value = corrected;
        try { await runSearch(); }
        catch (searchError) { handleSearchError(searchError); }
      },
    });
  }
  if (hasActiveUiFilters()) {
    actions.push({
      label: "Clear filters",
      variant: "ghost",
      onClick: async () => {
        resetUiFilters();
        try { await runSearch(); }
        catch (searchError) { handleSearchError(searchError); }
      },
    });
  }

  renderStateCard({
    eyebrowText: "Search result",
    title: "Nothing in the archive matches that combination yet.",
    copy: suggestions.length
      ? "Try the corrected spelling, or remove one of the active filters and search again."
      : "Broaden the wording, remove a filter, or try a related reference instead.",
    actions,
  });
  renderActiveFilters();
}

function setAdvancedOpen(isOpen) {
  els.advancedPanel.hidden = !isOpen;
  els.toggleAdvanced.setAttribute("aria-expanded", String(isOpen));
  els.toggleAdvanced.textContent = isOpen ? "Hide Advanced Search" : "Advanced Search";
  els.resultsView.classList.toggle("advanced-open", isOpen);
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
    payload.filters.year !== null ||
    payload.filters.category.length ||
    payload.filters.style.length ||
    payload.filters.tech.length ||
    payload.filters.similar_to
  ) lenses.push("Advanced");
  return lenses.join(" + ") || "Natural language";
}

function buildHeadline(payload) {
  if (payload.filters.query) return `Results for "${payload.filters.query}"`;
  if (payload.filters.year !== null) return `${payload.filters.year} references`;
  if (payload.filters.focus_label !== "All") return `${payload.filters.focus_label} references`;
  return "Top references";
}

function formatDate(rawValue) {
  const date = new Date(`${rawValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return rawValue;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function listValues(entries, key) {
  return [...new Set(entries.flatMap((entry) => entry[key] || []))].sort((a, b) => a.localeCompare(b));
}

function firstValue(params, key, defaultValue = "") {
  const value = (params[key] || [defaultValue])[0];
  return value.trim();
}

function splitValues(values = []) {
  return values
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

function normalizePhrase(text) {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

function tokens(text) {
  return new Set((text.toLowerCase().match(/[a-z0-9][a-z0-9.+/&'-]*/g) || []));
}

function tokenizedValues(values = []) {
  const combined = new Set();
  values.forEach((value) => {
    tokens(value).forEach((token) => combined.add(token));
    combined.add(normalizePhrase(value));
  });
  return combined;
}

function paramsObjectFromSearchParams(searchParams) {
  const params = {};
  searchParams.forEach((value, key) => {
    if (!params[key]) params[key] = [];
    params[key].push(value);
  });
  return params;
}

function clampLimit(rawValue) {
  const limit = Number.parseInt(rawValue, 10);
  if (Number.isNaN(limit)) throw new Error("limit must be an integer");
  return Math.max(1, Math.min(limit, 48));
}

function extractHintTerms(query) {
  const normalizedQuery = normalizePhrase(query);
  const hintTerms = [];
  Object.entries(QUERY_HINTS).forEach(([phrase, aliases]) => {
    if (normalizedQuery.includes(phrase)) hintTerms.push(...aliases);
  });
  return uniqueValues(hintTerms);
}

function expandQueryTerms(queryTerms) {
  const expanded = new Set(queryTerms);
  [...queryTerms].forEach((term) => {
    (QUERY_ALIASES[term] || []).forEach((value) => expanded.add(value));
  });
  return expanded;
}

function buildAssistantSummary(filters, hintTerms) {
  const parts = [];
  if (filters.query) parts.push(`You described "${filters.query}".`);
  else parts.push("You are browsing the catalog.");

  if (filters.focus_label !== "All") parts.push(`I used the ${filters.focus_label} lens.`);

  if (hintTerms.length) {
    const readableTerms = hintTerms.map((term) => term.replaceAll("-", " ")).join(", ");
    parts.push(`I also nudged the search toward ${readableTerms}.`);
  }

  if (filters.year !== null || filters.category.length || filters.style.length || filters.tech.length) {
    const active = [];
    if (filters.year !== null) active.push(`year: ${filters.year}`);
    if (filters.category.length) active.push(`categories: ${filters.category.join(", ")}`);
    if (filters.style.length) active.push(`styles: ${filters.style.join(", ")}`);
    if (filters.tech.length) active.push(`tech: ${filters.tech.join(", ")}`);
    parts.push(`Advanced filters applied: ${active.join(" | ")}.`);
  }

  return parts.join(" ");
}

function buildSearchRequest(params) {
  const query = firstValue(params, "q");
  const similarTo = firstValue(params, "similar_to");
  const focusKey = firstValue(params, "focus", "all") || "all";
  const focus = FOCUS_PRESETS[focusKey] || FOCUS_PRESETS.all;

  const manualCategories = splitValues(params.category || []);
  const styles = splitValues(params.style || []);
  const techs = splitValues(params.tech || []);
  const limit = clampLimit(firstValue(params, "limit", "24"));
  const hintTerms = extractHintTerms(query);
  const yearRaw = firstValue(params, "year");
  const year = yearRaw ? parseInt(yearRaw, 10) : null;

  const categories = uniqueValues([...focus.categories, ...manualCategories]);
  const expandedQueryParts = uniqueValues([query, ...focus.query_terms, ...hintTerms]);
  const effectiveQuery = expandedQueryParts.join(" ").trim();

  const filters = {
    query,
    similar_to: similarTo,
    focus: focusKey,
    focus_label: focus.label,
    category: categories,
    style: styles,
    tech: techs,
    year,
    limit,
  };
  const assistant = {
    focus_label: focus.label,
    hint_terms: hintTerms,
    effective_query: effectiveQuery,
    summary: buildAssistantSummary(filters, hintTerms),
  };
  return { filters, assistant };
}

function entryMatchesFilters(entry, categories, styles, techs, year = null) {
  if (year !== null && entry.award_year !== year) return false;
  const entryCategories = new Set((entry.categories || []).map((value) => normalizePhrase(value)));
  const entryStyles = new Set((entry.style_tags || []).map((value) => normalizePhrase(value)));
  const entryTech = new Set((entry.tech_tags || []).map((value) => normalizePhrase(value)));

  if (categories.some((value) => !entryCategories.has(normalizePhrase(value)))) return false;
  if (styles.some((value) => !entryStyles.has(normalizePhrase(value)))) return false;
  if (techs.some((value) => !entryTech.has(normalizePhrase(value)))) return false;
  return true;
}

function queryScore(entry, queryTerms) {
  const haystacks = {
    title: tokens(entry.title || ""),
    slug: tokens(entry.slug || ""),
    categories: tokenizedValues(entry.categories || []),
    style_tags: tokenizedValues(entry.style_tags || []),
    tech_tags: tokenizedValues(entry.tech_tags || []),
    tags: tokenizedValues(entry.tags || []),
  };

  let score = 0;
  const matched = [];

  queryTerms.forEach((term) => {
    if (haystacks.title.has(term)) {
      score += 3.0;
      matched.push(`title:${term}`);
    } else if (haystacks.slug.has(term)) {
      score += 2.5;
      matched.push(`slug:${term}`);
    } else if (haystacks.categories.has(term)) {
      score += 2.2;
      matched.push(`category:${term}`);
    } else if (haystacks.style_tags.has(term)) {
      score += 2.0;
      matched.push(`style:${term}`);
    } else if (haystacks.tech_tags.has(term)) {
      score += 1.8;
      matched.push(`tech:${term}`);
    } else if (haystacks.tags.has(term)) {
      score += 1.5;
      matched.push(`tag:${term}`);
    }
  });

  return { score, matched };
}

function findReference(entries, needle) {
  const target = normalizePhrase(needle);
  const exactMatch = entries.find(
    (entry) => normalizePhrase(entry.title || "") === target || normalizePhrase(entry.slug || "") === target,
  );
  if (exactMatch) return exactMatch;
  return entries.find(
    (entry) => normalizePhrase(entry.title || "").includes(target) || normalizePhrase(entry.slug || "").includes(target),
  ) || null;
}

function searchSimilarityScore(base, candidate) {
  const baseTerms = new Set([...(base.categories || []), ...(base.style_tags || []), ...(base.tech_tags || [])]);
  const candidateTerms = new Set([...(candidate.categories || []), ...(candidate.style_tags || []), ...(candidate.tech_tags || [])]);
  const shared = [...baseTerms].filter((term) => candidateTerms.has(term));
  const union = new Set([...baseTerms, ...candidateTerms]);
  let score = union.size ? shared.length / union.size : 0;
  score += shared.length * 0.05;
  return score;
}

function relatedSimilarityScore(base, candidate) {
  const baseTerms = new Set([...(base.categories || []), ...(base.style_tags || []), ...(base.tech_tags || [])]);
  const candidateTerms = new Set([...(candidate.categories || []), ...(candidate.style_tags || []), ...(candidate.tech_tags || [])]);
  const shared = [...baseTerms].filter((term) => candidateTerms.has(term)).length;
  const union = new Set([...baseTerms, ...candidateTerms]).size;
  return union ? shared / union : 0;
}

function getStaticCatalog() {
  if (!STATIC_CATALOG) throw new Error("Static catalog unavailable.");
  return STATIC_CATALOG;
}

function buildStaticOptions() {
  const catalog = getStaticCatalog();
  const entries = catalog.entries || [];
  const years = [...new Set(entries.map((e) => e.award_year).filter(Boolean))].sort((a, b) => b - a);
  return {
    dataset: catalog.dataset,
    datasets: catalog.datasets || [],
    focus: Object.entries(FOCUS_PRESETS).map(([key, value]) => ({
      key,
      label: value.label,
      description: value.description,
    })),
    categories: listValues(entries, "categories"),
    styles: listValues(entries, "style_tags"),
    tech: listValues(entries, "tech_tags"),
    years,
  };
}

function getStaticDiscover(limit = 100) {
  const entries = (getStaticCatalog().entries || []).filter(
    (entry) => entry.thumbnail_url && (entry.categories || []).some((value) => DESIGN_CATEGORIES.has(value)),
  );
  const shuffled = [...entries];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const swapIndex = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[i]];
  }
  const limited = shuffled.slice(0, limit);
  return {
    dataset: getStaticCatalog().dataset,
    entries: limited,
    count: limited.length,
  };
}

function getStaticRef(slug) {
  const catalog = getStaticCatalog();
  const entries = catalog.entries || [];
  const entry = entries.find((candidate) => candidate.slug === slug);
  if (!entry) throw new Error(`Reference "${slug}" not found`);

  const related = entries
    .filter((candidate) => candidate.slug !== slug)
    .map((candidate) => ({ score: relatedSimilarityScore(entry, candidate), entry: candidate }))
    .sort((a, b) => (b.score - a.score) || ((a.entry.rank || 9999) - (b.entry.rank || 9999)))
    .filter((item) => item.score > 0)
    .slice(0, 4)
    .map((item) => item.entry);

  return { ...entry, related };
}

function runStaticSearch(params) {
  const catalog = getStaticCatalog();
  const request = buildSearchRequest(params);
  const entries = catalog.entries || [];
  const filtered = entries.filter((entry) => entryMatchesFilters(
    entry,
    request.filters.category,
    request.filters.style,
    request.filters.tech,
    request.filters.year,
  ));

  let scored = [];
  if (request.filters.similar_to) {
    const base = findReference(filtered.length ? filtered : entries, request.filters.similar_to);
    if (!base) throw new Error(`no reference found for "${request.filters.similar_to}"`);
    scored = (filtered.length ? filtered : entries)
      .filter((entry) => entry.slug !== base.slug)
      .map((entry) => ({
        score: searchSimilarityScore(base, entry),
        match_reason: `similar to ${base.title}`,
        ...entry,
      }))
      .sort((a, b) => (b.score - a.score) || ((a.rank || 9999) - (b.rank || 9999)));
  } else {
    const queryTerms = expandQueryTerms(tokens(request.assistant.effective_query));
    scored = filtered
      .map((entry) => {
        const { score, matched } = queryScore(entry, queryTerms);
        return {
          score,
          match_reason: matched.length ? matched.join(", ") : "top-ranked seed reference",
          ...entry,
        };
      })
      .filter((entry) => !queryTerms.size || entry.score > 0)
      .sort((a, b) => (b.score - a.score) || ((a.rank || 9999) - (b.rank || 9999)));
  }

  const results = scored.slice(0, request.filters.limit);
  if (!results.length) throw new Error("no matches");

  return {
    dataset: catalog.dataset,
    results,
    filters: request.filters,
    assistant: request.assistant,
  };
}

function buildMarkdownFromPayload(payload) {
  const filters = payload.filters;
  const summary = [];
  if (filters.query) summary.push(`query "${filters.query}"`);
  if (filters.focus_label !== "All") summary.push(`focus "${filters.focus_label}"`);
  if (filters.similar_to) summary.push(`similar to "${filters.similar_to}"`);
  if (filters.category.length) summary.push(`categories: ${filters.category.join(", ")}`);
  if (filters.style.length) summary.push(`styles: ${filters.style.join(", ")}`);
  if (filters.tech.length) summary.push(`tech: ${filters.tech.join(", ")}`);

  const lines = [
    `# Design Reference Pack: ${summary.length ? summary.join(" | ") : "top references"}`,
    "",
    `Dataset: ${payload.dataset}`,
    "",
    "References:",
  ];

  payload.results.forEach((result) => {
    lines.push(
      `- ${result.title} (${result.award_date})`,
      `  Live: ${result.live_url}`,
      `  Source: ${result.source_url}`,
      `  Why it fits: matched ${humanizeReason(result.match_reason).join(", ")}`,
      `  Categories: ${(result.categories || []).join(", ") || "-"}`,
      `  Style: ${(result.style_tags || []).join(", ") || "-"}`,
      `  Tech: ${(result.tech_tags || []).join(", ") || "-"}`,
      "",
    );
  });

  return `${lines.join("\n").trimEnd()}\n`;
}

async function requestJson(path, { fallback } = {}) {
  if (fallback && STATIC_CATALOG && apiReachable === false) return fallback();
  try {
    const response = await fetch(path);
    if (response.ok) {
      apiReachable = true;
      return await response.json();
    }
    if (fallback && response.status === 404) {
      apiReachable = false;
      return fallback();
    }
    apiReachable = true;
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `Request failed (${response.status})`);
  } catch (error) {
    if (fallback && STATIC_CATALOG && error instanceof TypeError) {
      apiReachable = false;
      return fallback();
    }
    throw error;
  }
}

async function requestText(path, { fallback } = {}) {
  if (fallback && STATIC_CATALOG && apiReachable === false) return fallback();
  try {
    const response = await fetch(path);
    if (response.ok) {
      apiReachable = true;
      return await response.text();
    }
    if (fallback && response.status === 404) {
      apiReachable = false;
      return fallback();
    }
    apiReachable = true;
    throw new Error(`Request failed (${response.status})`);
  } catch (error) {
    if (fallback && STATIC_CATALOG && error instanceof TypeError) {
      apiReachable = false;
      return fallback();
    }
    throw error;
  }
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

function renderYearFilters(years) {
  const root = document.getElementById("year-filters");
  if (!root) return;
  root.replaceChildren();
  years.forEach((year) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip year-chip";
    btn.dataset.year = String(year);
    btn.textContent = String(year);
    btn.addEventListener("click", () => {
      state.year = state.year === year ? null : year;
      syncYearButtons();
    });
    root.appendChild(btn);
  });
  syncYearButtons();
}

function syncYearButtons() {
  document.querySelectorAll(".year-chip").forEach((btn) => {
    btn.classList.toggle("active", Number(btn.dataset.year) === state.year);
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

// ─── Spell correction ─────────────────────────────────────────────────────────

function editDistance(a, b) {
  if (Math.abs(a.length - b.length) > 3) return 99;
  const dp = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

function spellSuggest(queryText) {
  const known = Object.keys(QUERY_ALIASES);
  const suggestions = [];
  [...tokens(queryText)].forEach((term) => {
    if (term.length < 3 || QUERY_ALIASES[term]) return;
    let best = null, bestDist = Math.min(3, Math.floor(term.length / 3) + 1);
    known.forEach((k) => {
      const d = editDistance(term, k);
      if (d < bestDist) { best = k; bestDist = d; }
    });
    if (best) suggestions.push({ original: term, suggestion: best });
  });
  return suggestions;
}

// ─── Search ───────────────────────────────────────────────────────────────────

function serializeState() {
  const params = new URLSearchParams();
  const query = els.query.value.trim();
  const similarTo = els.similarTo ? els.similarTo.value.trim() : "";
  const limit = els.limit ? els.limit.value.trim() || "24" : "24";

  const chipQuery = [...activePromptChips].join(" ");
  const combined = [query, chipQuery].filter(Boolean).join(" ");
  if (combined) params.set("q", combined);
  if (state.focus !== "all") params.set("focus", state.focus);
  if (state.year !== null) params.set("year", String(state.year));
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
  } else {
    els.resultsTitle.textContent = "Browse all";
  }
  els.readoutCopy.textContent = payload.assistant.summary;
  els.resultCount.textContent = String(payload.results.length);
  els.activeLenses.textContent = activeLensLabel(payload);
}

function renderResults(payload) {
  els.results.replaceChildren();

  if (!payload.results.length) {
    renderStateCard({
      eyebrowText: "Search result",
      title: "No matches",
      copy: "Try broadening the search or using Advanced Search.",
    });
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
    const data = await requestJson("/api/discover?limit=12", {
      fallback: () => getStaticDiscover(12),
    });
    // Render as seed cards (score=0 → no match score or reason shown)
    const fakePayload = {
      results: (data.entries || []).map((e) => ({ ...e, score: 0, match_reason: "" })),
      filters: { query: "" },
      dataset: data.dataset || (STATIC_CATALOG ? getStaticCatalog().dataset : ""),
      assistant: { summary: "", focus_label: "All", hint_terms: [], effective_query: "" },
    };
    els.readoutPanel.hidden = true;
    els.resultsHead.hidden = false;
    els.resultsTitle.textContent = "Browse all";
    renderResults(fakePayload);
    renderActiveFilters();
    setStatus("");
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
  if (STATIC_CATALOG && apiReachable === false) {
    setStatus(STATIC_IMAGE_SEARCH_MESSAGE, true);
    return;
  }

  setStatus("Analysing image…");
  if (window.location.hash !== "#/results") {
    window.location.hash = "#/results";
    await new Promise((r) => setTimeout(r, 50));
  }

  const limit = els.limit ? els.limit.value.trim() || "24" : "24";
  const formData = new FormData();
  formData.append("image", stagedImageFile, stagedImageFile.name);

  try {
    const res = await fetch(`/api/search-by-image?limit=${limit}`, { method: "POST", body: formData });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 404 && STATIC_CATALOG) {
        apiReachable = false;
        throw new Error(STATIC_IMAGE_SEARCH_MESSAGE);
      }
      apiReachable = true;
      throw new Error(payload.error || "Image search failed.");
    }
    apiReachable = true;

    // Populate the text query box with what Claude extracted so user can refine
    if (payload.vision?.query) els.query.value = payload.vision.query;

    renderReadout(payload);
    renderResults(payload);
    const mood = payload.vision?.mood ? ` · ${payload.vision.mood} mood` : "";
    setStatus(`${payload.results.length} result(s) found from image${mood}.`);
  } catch (err) {
    if (STATIC_CATALOG && err instanceof TypeError) apiReachable = false;
    const message = STATIC_CATALOG && err instanceof TypeError ? STATIC_IMAGE_SEARCH_MESSAGE : err.message;
    setStatus(message, true);
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

  const payload = await requestJson(`/api/search?${params.toString()}`, {
    fallback: () => runStaticSearch(paramsObjectFromSearchParams(params)),
  });

  renderReadout(payload);
  renderResults(payload);
  renderActiveFilters();
  setStatus(`${payload.results.length} result(s) found.`);
}

async function loadOptions() {
  const payload = await requestJson("/api/options", {
    fallback: () => buildStaticOptions(),
  });
  els.datasetName.textContent = payload.dataset;
  if (els.resultsDatasetPill) els.resultsDatasetPill.textContent = payload.dataset;
  renderFocusFilters(payload.focus);
  if (payload.years) renderYearFilters(payload.years);
  renderFilterGroup("category", payload.categories);
  renderFilterGroup("style", payload.styles);
  renderFilterGroup("tech", payload.tech);
}

async function copyMarkdown() {
  const params = serializeState();
  const markdown = await requestText(`/api/export.md?${params.toString()}`, {
    fallback: () => buildMarkdownFromPayload(runStaticSearch(paramsObjectFromSearchParams(params))),
  });
  await navigator.clipboard.writeText(markdown);
  setStatus("Markdown copied to clipboard.");
}

// ─── Surprise me ──────────────────────────────────────────────────────────────

function surpriseMe() {
  if (!STATIC_CATALOG) return;
  const entries = (getStaticCatalog().entries || []).filter((e) => e.thumbnail_url && e.slug);
  if (!entries.length) return;
  const entry = entries[Math.floor(Math.random() * entries.length)];
  window.location.hash = `#/ref/${encodeURIComponent(entry.slug)}`;
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
      catch (error) { handleSearchError(error); }
    });
  }

  // Wire image search
  bindImageSearch();

  // Wire results view search form — routes to image search if an image is staged
  els.searchForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    try { await (stagedImageFile ? runImageSearch() : runSearch()); }
    catch (error) { handleSearchError(error); }
  });

  // Advanced search panel
  els.toggleAdvanced.addEventListener("click", () => setAdvancedOpen(els.advancedPanel.hidden));
  els.advancedApply.addEventListener("click", async () => {
    try { await runSearch(); }
    catch (error) { handleSearchError(error); }
  });

  // Reset filters
  els.resetFilters.addEventListener("click", async () => {
    resetUiFilters();
    try { await runSearch(); }
    catch (error) { setStatus(error.message, true); }
  });

  // Surprise me
  const surpriseBtn = document.getElementById("surprise-btn");
  if (surpriseBtn) surpriseBtn.addEventListener("click", surpriseMe);

  // Motion lab navigation
  if (els.openMotionLab) {
    els.openMotionLab.addEventListener("click", () => {
      window.location.hash = "#/motion-lab";
    });
  }
  if (els.motionLabBack) {
    els.motionLabBack.addEventListener("click", () => {
      window.location.hash = "#/results";
    });
  }

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
