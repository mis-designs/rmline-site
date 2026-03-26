/* =========================
   PARTIALS
========================= */
async function loadPartial(targetId, partialPath) {
  const el = document.getElementById(targetId);
  if (!el) return;

  const res = await fetch(partialPath, { cache: "no-store" });
  if (!res.ok) throw new Error(`Errore caricamento ${partialPath}`);
  el.innerHTML = await res.text();
}

function setActiveNavLink() {
  const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll("[data-nav]").forEach((a) => {
    const href = (a.getAttribute("data-nav") || "").toLowerCase();
    if (href === path) a.classList.add("is-active");
  });
}

function renderBreadcrumbs(catalog) {
  const path = window.location.pathname.toLowerCase();
  const file = (path.split("/").pop() || "index.html").toLowerCase();
  const isHome =
    file === "" ||
    file === "index.html" ||
    path.endsWith("/") ||
    path === "/";

  const existing = document.querySelector(".breadcrumb-bar");
  existing?.remove();
  if (isHome) return;

  const main = document.querySelector("main");
  if (!main) return;

  const labels = {
    "about.html": "Chi siamo",
    "products.html": "Prodotti",
    "details.html": "Dettagli",
    "contact.html": "Contatti",
    "privacy.html": "Privacy Policy",
    "cookie.html": "Cookie Policy",
  };

  const crumbs = [{ label: "Home", href: "index.html" }];

  if (file === "category.html") {
    crumbs.push({ label: "Prodotti", href: "products.html" });
    const catId = getQueryParam("cat");
    const catName = (catalog?.categories || []).find((cat) => cat.id === catId)?.name || "Categoria";
    crumbs.push({ label: cleanText(catName, "Categoria") });
  } else {
    const title = labels[file] || cleanText(document.title.replace(/\s*-\s*RM Line\s*$/i, ""), "Pagina");
    crumbs.push({ label: title });
  }

  const bar = document.createElement("div");
  bar.className = "breadcrumb-bar";
  bar.innerHTML = `
    <div class="container">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        ${crumbs.map((crumb, index) => {
    const isLast = index === crumbs.length - 1;
    const separator = index < crumbs.length - 1 ? `<span class="breadcrumb__sep" aria-hidden="true">/</span>` : "";

    if (isLast || !crumb.href) {
      return `<span class="breadcrumb__current" aria-current="page">${crumb.label}</span>${separator}`;
    }

    return `<a class="breadcrumb__link" href="${crumb.href}">${crumb.label}</a>${separator}`;
  }).join("")}
      </nav>
    </div>
  `;

  main.before(bar);
}

/* =========================
   FIXED HEADER OFFSET
========================= */
function applyFixedHeaderOffset() {
  const header = document.querySelector(".site-header");
  if (!header) return;

  const setOffset = () => {
    const h = Math.ceil(header.getBoundingClientRect().height);
    document.body.style.paddingTop = `${h}px`;
    document.documentElement.style.setProperty("--header-h", `${h}px`);
  };

  setOffset();
  window.addEventListener("load", setOffset, { passive: true });
  window.addEventListener("resize", setOffset, { passive: true });

  if ("ResizeObserver" in window) {
    const ro = new ResizeObserver(setOffset);
    ro.observe(header);
  }
}

/* =========================
   MOBILE MENU
========================= */
function setupMobileMenu() {
  const toggle = document.querySelector(".nav__toggle");
  const menu = document.querySelector(".nav__menu");
  const nav = document.querySelector(".nav");
  if (!toggle || !menu || !nav) return;

  const close = () => {
    menu.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.classList.remove("is-open"); // Aggiunto per l'animazione dell'hamburger
  };

  const open = () => {
    menu.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.classList.add("is-open"); // Aggiunto per l'animazione dell'hamburger
  };

  toggle.addEventListener("click", () => {
    const isOpen = toggle.classList.contains("is-open"); // Controlla lo stato sul pulsante toggle stesso
    if (isOpen) close();
    else open();
  });

  menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", close));

  document.addEventListener("click", (e) => {
    if (!menu.classList.contains("is-open")) return;
    if (!nav.contains(e.target)) close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu.classList.contains("is-open")) close();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 860) close();
  }, { passive: true });
}

function setFooterYear() {
  const y = document.getElementById("year");
  if (y) y.textContent = String(new Date().getFullYear());
}

/* =========================
   HOME SLIDER
========================= */
function initSlider() {
  const slider = document.querySelector("[data-slider]");
  if (!slider) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const track = slider.querySelector(".slides");
  const slides = Array.from(slider.querySelectorAll(".slide"));
  const dots = Array.from(slider.querySelectorAll(".dot"));
  const prevBtn = slider.querySelector("[data-prev]");
  const nextBtn = slider.querySelector("[data-next]");

  if (!track || slides.length <= 1) return;

  if (!track.querySelector(".slide.is-clone")) {
    const firstClone = slides[0].cloneNode(true);
    firstClone.classList.add("is-clone");
    track.appendChild(firstClone);
  }

  const realCount = slides.length;
  const interval = Math.max(Number(slider.getAttribute("data-interval") || 5000), 2500);
  let index = 0;
  let visualIndex = 0;
  let timer = null;
  let isAnimating = false;
  let touchStartX = 0;
  let touchStartY = 0;
  let touchDeltaX = 0;

  function setTransition(on) {
    track.style.transition = on ? "transform .6s ease" : "none";
  }

  function updateDots() {
    dots.forEach((dot, i) => {
      dot.classList.toggle("is-active", i === index);
      dot.setAttribute("aria-current", i === index ? "true" : "false");
    });
  }

  function render() {
    track.style.transform = `translateX(-${visualIndex * 100}%)`;
    updateDots();
  }

  function goToVisual(vIdx, realIdx, withAnim = true) {
    if (isAnimating) return;
    isAnimating = withAnim;

    setTransition(withAnim);
    visualIndex = vIdx;
    index = realIdx;
    render();

    if (!withAnim) isAnimating = false;
  }

  track.addEventListener("transitionend", () => {
    isAnimating = false;

    if (visualIndex === realCount) {
      setTransition(false);
      visualIndex = 0;
      index = 0;
      render();
      void track.offsetHeight;
      setTransition(true);
    }
  });

  function next() {
    if (visualIndex === realCount) return;
    const nextVisual = visualIndex + 1;

    if (nextVisual === realCount) {
      goToVisual(nextVisual, 0, true);
      return;
    }

    goToVisual(nextVisual, nextVisual, true);
  }

  function prev() {
    if (isAnimating) return;

    if (visualIndex === 0) {
      setTransition(false);
      visualIndex = realCount;
      index = realCount - 1;
      render();
      void track.offsetHeight;
      setTransition(true);
      visualIndex = realCount - 1;
      index = realCount - 1;
      render();
      return;
    }

    visualIndex -= 1;
    index = Math.min(visualIndex, realCount - 1);
    render();
  }

  function start() {
    if (prefersReducedMotion) return;
    stop();
    timer = window.setInterval(next, interval);
  }

  function stop() {
    if (timer) window.clearInterval(timer);
    timer = null;
  }

  dots.forEach((dot, i) => dot.addEventListener("click", () => {
    goToVisual(i, i, true);
    start();
  }));
  prevBtn?.addEventListener("click", () => {
    prev();
    start();
  });
  nextBtn?.addEventListener("click", () => {
    next();
    start();
  });

  slider.addEventListener("mouseenter", stop);
  slider.addEventListener("mouseleave", start);
  slider.addEventListener("focusin", stop);
  slider.addEventListener("focusout", start);
  slider.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchDeltaX = 0;
    stop();
  }, { passive: true });
  slider.addEventListener("touchmove", (e) => {
    if (!touchStartX || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - touchStartX;
    const deltaY = e.touches[0].clientY - touchStartY;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      touchDeltaX = deltaX;
    }
  }, { passive: true });
  slider.addEventListener("touchend", () => {
    if (Math.abs(touchDeltaX) > 44) {
      touchDeltaX < 0 ? next() : prev();
    }
    touchStartX = 0;
    touchStartY = 0;
    touchDeltaX = 0;
    start();
  }, { passive: true });
  slider.addEventListener("touchcancel", () => {
    touchStartX = 0;
    touchStartY = 0;
    touchDeltaX = 0;
    start();
  }, { passive: true });

  setTransition(true);
  render();
  start();
}

/* =========================
   CATALOGO
========================= */
async function loadCatalog() {
  const res = await fetch("assets/data/catalog.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Impossibile caricare assets/data/catalog.json");
  return await res.json();
}

function getQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

function cleanText(value, fallback = "") {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed ? trimmed : fallback;
}

function renderHomeCategories(categories) {
  const grid = document.getElementById("homeProductsGrid");
  if (!grid) return;

  const featured = categories.filter((c) => c.featured === true);
  const list = (featured.length ? featured : categories).slice(0, 4);

  grid.innerHTML = list.map((c) => {
    const cover = c.cover || "";
    const title = cleanText(c.name, "Categoria");
    const desc = cleanText(c.desc, "Scopri la selezione di prodotti disponibili.");
    const descShort = desc.length > 110 ? `${desc.slice(0, 107)}...` : desc;
    const media = cover
      ? `<img class="home-mini-card__img" src="${cover}" alt="${title}" loading="lazy">`
      : `<div class="home-mini-card__img home-mini-card__img--empty" aria-hidden="true"></div>`;

    return `
      <a class="home-mini-card" href="category.html?cat=${encodeURIComponent(c.id)}" aria-label="Apri categoria ${title}">
        ${media}
        <div class="home-mini-card__body">
          <h3 class="home-mini-card__title">${title}</h3>
          <p class="home-mini-card__text">${descShort}</p>
        </div>
      </a>
    `;
  }).join("");
}

function renderCategoriesPage(categories) {
  const grid = document.getElementById("categoriesGrid");
  if (!grid) return;

  grid.innerHTML = categories.map((c) => {
    const cover = c.cover || "";
    const bg = cover ? `background-image:url('${cover}'); background-size:cover; background-position:center;` : "";
    const title = cleanText(c.name, "Categoria");
    const desc = cleanText(c.desc, "Scopri i prodotti disponibili in questa categoria.");
    const itemsCount = Array.isArray(c.items) ? c.items.length : 0;
    const countLabel = itemsCount === 1 ? "1 modello" : `${itemsCount} modelli`;

    return `
      <a class="showcase-card" href="category.html?cat=${encodeURIComponent(c.id)}" aria-label="Apri categoria ${title}">
        <div class="showcase-card__media" style="${bg}"></div>
        <div class="showcase-card__overlay"></div>
        <div class="showcase-card__body">
          <div class="showcase-card__top">
            <span class="showcase-card__count">${countLabel}</span>
          </div>
          <div class="showcase-card__content">
            <h3 class="showcase-card__title">${title}</h3>
            <p class="showcase-card__text">${desc}</p>
          </div>
          <div class="showcase-card__footer">
              <span class="showcase-card__cta">Esplora la collezione</span>
            </div>
          </div>
        </a>
      `;
  }).join("");
}

function resolveCategory(catalog) {
  const categories = catalog.categories || [];
  if (!categories.length) return null;

  const catId = getQueryParam("cat");
  const found = categories.find((x) => x.id === catId);
  return found || categories[0];
}

function renderCategoryItemsPage(catalog) {
  const grid = document.getElementById("categoryGrid");
  if (!grid) return null;

  const cat = resolveCategory(catalog);
  if (!cat) return null;

  const title = document.getElementById("categoryTitle");
  const desc = document.getElementById("categoryDesc");
  const meta = document.getElementById("categoryMeta");

  if (title) title.textContent = cleanText(cat.name, "Categoria");
  if (desc) desc.textContent = cleanText(cat.desc, "Seleziona un prodotto per vedere dettagli e galleria.");
  document.title = `${cleanText(cat.name, "Categoria")} - RM Line`;

  const items = cat.items || [];

  if (meta) {
    const modelsLabel = items.length === 1 ? "1 modello disponibile" : `${items.length} modelli disponibili`;
    meta.innerHTML = `
      <span class="category-hero__chip">${modelsLabel}</span>
      <span class="category-hero__chip">Gallery prodotto</span>
      <span class="category-hero__chip">Personalizzazione su richiesta</span>
    `;
  }

  const itemsHtml = items.map((item, itemIndex) => {
    const cover = (item.images && item.images[0]) ? item.images[0] : "";
    const bg = cover
      ? `background-image:url('${cover}'); background-size:cover; background-position:center;`
      : "";
    const itemName = cleanText(item.name, `Modello ${itemIndex + 1}`);
    const itemShort = cleanText(item.short, "Apri la scheda per vedere dettagli e galleria.");
    const galleryCount = Array.isArray(item.images) ? item.images.length : 0;
    const galleryLabel = galleryCount === 1 ? "1 immagine" : `${galleryCount} immagini`;

      return `
        <div class="collection-card" data-item="${item.id}" role="button" tabindex="0" aria-label="Apri dettagli ${itemName}">
          <div class="collection-card__media" style="${bg}"></div>
          <div class="collection-card__body">
            <span class="collection-card__meta">${galleryLabel}</span>
            <h3 class="collection-card__title">${itemName}</h3>
            <p class="collection-card__text">${itemShort}</p>
            <span class="collection-card__cta">Apri dettagli</span>
          </div>
        </div>
      `;
    }).join("");

  grid.innerHTML = itemsHtml;

  return cat;
}

/* =========================
   MODAL ITEMS
========================= */
  function initItemModal(catalog) {
    const modal = document.querySelector("[data-modal]");
    if (!modal) return;

      const title = modal.querySelector("[data-modal-title]");
      const mainImg = modal.querySelector("[data-gallery-main]");
      const desc = modal.querySelector("[data-modal-desc]");
      const closeBtn = modal.querySelector("[data-modal-close]");
      const thumbsWrap = modal.querySelector("[data-modal-thumbs]");
      const modalPanel = modal.querySelector(".modal__panel");
      const contentWrap = modal.querySelector(".modal__content");
      const panel = modal.querySelector(".panel");

  const itemIndex = new Map();
  (catalog.categories || []).forEach((c) => {
    (c.items || []).forEach((it) => itemIndex.set(it.id, it));
  });

    let imgs = [];
    let idx = 0;
    let currentItemName = "Prodotto";

    const preload = (src) => {
      if (!src) return;
      const im = new Image();
      im.src = src;
    };

    const syncOrientation = () => {
      if (!modalPanel || !mainImg) return;
      const isPortrait = mainImg.naturalHeight > mainImg.naturalWidth;
      modalPanel.classList.toggle("is-portrait", isPortrait);
      modalPanel.classList.toggle("is-landscape", !isPortrait);
    };

    mainImg?.addEventListener("load", syncOrientation);

    const show = (i) => {
      if (!imgs.length) return;
      idx = (i + imgs.length) % imgs.length;
      mainImg.src = imgs[idx];
      mainImg.alt = `${currentItemName} - immagine ${idx + 1}`;

      if (thumbsWrap) {
        thumbsWrap.querySelectorAll(".modal-thumb").forEach((thumb, thumbIndex) => {
          thumb.classList.toggle("is-active", thumbIndex === idx);
        });
    }

    preload(imgs[(idx + 1) % imgs.length]);
    preload(imgs[(idx - 1 + imgs.length) % imgs.length]);
  };

    const open = (item) => {
      currentItemName = cleanText(item.name, "Prodotto");
      title.textContent = currentItemName;
      desc.textContent = cleanText(item.desc, "Dettagli disponibili su richiesta.");

      imgs = (item.images || []).filter(Boolean);
    idx = 0;

      if (thumbsWrap) {
        thumbsWrap.innerHTML = imgs.map((src, i) => `
          <button class="modal-thumb${i === 0 ? " is-active" : ""}" type="button" data-thumb-index="${i}">
            <img src="${src}" alt="${currentItemName} - anteprima ${i + 1}">
          </button>
        `).join("");

      thumbsWrap.querySelectorAll("[data-thumb-index]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const thumbIndex = Number(btn.getAttribute("data-thumb-index"));
          show(thumbIndex);
        });
      });
    }

    show(0);

    const prevBtn = modal.querySelector("[data-gprev]");
    const nextBtn = modal.querySelector("[data-gnext]");
    if (prevBtn && nextBtn) {
      const prevClone = prevBtn.cloneNode(true);
      const nextClone = nextBtn.cloneNode(true);
      prevBtn.replaceWith(prevClone);
      nextBtn.replaceWith(nextClone);

      prevClone.addEventListener("click", () => show(idx - 1));
      nextClone.addEventListener("click", () => show(idx + 1));
    }

    modal.classList.add("is-open");
    document.body.style.overflow = "hidden";
    if (contentWrap) contentWrap.scrollTop = 0;
    if (panel) panel.scrollTop = 0;
    if (thumbsWrap) thumbsWrap.scrollLeft = 0;
    if (modalPanel) modalPanel.scrollTop = 0;
    window.requestAnimationFrame(() => {
      if (contentWrap) contentWrap.scrollTop = 0;
      if (panel) panel.scrollTop = 0;
    });
  };

  const close = () => {
    modal.classList.remove("is-open");
    document.body.style.overflow = "";
  };

    closeBtn?.addEventListener("click", close);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) close();
    });

    modalPanel?.addEventListener("wheel", (e) => {
      if (!modal.classList.contains("is-open")) return;

      const panelCanScroll = panel && panel.scrollHeight > panel.clientHeight + 4;
      const contentCanScroll = contentWrap && contentWrap.scrollHeight > contentWrap.clientHeight + 4;
      const target = panelCanScroll ? panel : (contentCanScroll ? contentWrap : null);
      if (!target) return;

      e.preventDefault();
      target.scrollTop += e.deltaY;
    }, { passive: false });
  
    document.addEventListener("keydown", (e) => {
      if (!modal.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(idx - 1);
    if (e.key === "ArrowRight") show(idx + 1);
  });

  document.addEventListener("click", (e) => {
    const card = e.target.closest?.("[data-item]");
    if (!card) return;
    const id = card.getAttribute("data-item");
    const item = itemIndex.get(id);
    if (item) open(item);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const card = e.target.closest?.("[data-item]");
    if (!card) return;
    e.preventDefault();
    const id = card.getAttribute("data-item");
    const item = itemIndex.get(id);
    if (item) open(item);
  });
}

/* =========================
   CONTACT FORM (mailto)
========================= */
function initContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const data = new FormData(form);
    const name = data.get("name") || "";
    const company = data.get("company") || "";
    const email = data.get("email") || "";
    const phone = data.get("phone") || "";
    const product = data.get("product") || "";
    const message = data.get("message") || "";

    const subject = `Richiesta informazioni - ${product || "Generale"} - ${name}`;
    const body =
      `Nome: ${name}
Azienda: ${company}
Email: ${email}
Telefono: ${phone}
Prodotto: ${product}

Messaggio:
${message}
`;

    const to = "info@rmline.com";
    const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  });
}

/* =========================
   CONTACT MAP
========================= */
function initContactMap() {
  const mapEl = document.getElementById("contactMap");
  if (!mapEl || typeof window.L === "undefined") return;

  const lat = Number(mapEl.getAttribute("data-lat"));
  const lng = Number(mapEl.getAttribute("data-lng"));
  const title = mapEl.getAttribute("data-title") || "RM Line";
  const address = mapEl.getAttribute("data-address") || "";

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

  const map = L.map(mapEl, {
    zoomControl: false,
    scrollWheelZoom: false,
    attributionControl: true,
  }).setView([lat, lng], 15);

  L.control.zoom({ position: "bottomright" }).addTo(map);

  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: "abcd",
    maxZoom: 19,
  }).addTo(map);

  const marker = L.marker([lat, lng]).addTo(map);
  marker.bindPopup(`<strong>${title}</strong><br>${address}`).openPopup();
}

/* =========================
   BOOT
========================= */
async function boot() {
  try {
    await loadPartial("site-navbar", "partials/navbar.html");
    await loadPartial("site-footer", "partials/footer.html");

    applyFixedHeaderOffset();
    setActiveNavLink();
    setupMobileMenu();
    setFooterYear();

    initSlider();

    const catalog = await loadCatalog();
    const categories = catalog.categories || [];

    renderHomeCategories(categories);
    renderCategoriesPage(categories);
    renderCategoryItemsPage(catalog);
    renderBreadcrumbs(catalog);
    initItemModal(catalog);

    initContactForm();
    initContactMap();
  } catch (err) {
    console.error(err);
  }
}

document.addEventListener("DOMContentLoaded", boot);
