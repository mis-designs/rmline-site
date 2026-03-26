// site/assets/js/cookie-loader.js
(async function () {
  const KEY = "rmline_cookie_consent"; // accepted | declined

  try {
    // Se già scelto, non mostrare
    const saved = localStorage.getItem(KEY);
    if (saved === "accepted" || saved === "declined") return;

    // Evita doppio inserimento
    if (document.getElementById("cookieBanner")) return;

    // Prova più percorsi (root, relative, parent) — utile se sei in /en/
    const candidates = [
      new URL("cookie.html", document.baseURI).toString(),
      new URL("../cookie.html", document.baseURI).toString(),
      "/cookie.html",
      "cookie.html",
      "../cookie.html"
    ];

    let html = null;
    let lastErr = null;

    for (const url of candidates) {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (res.ok) {
          html = await res.text();
          break;
        }
      } catch (e) {
        lastErr = e;
      }
    }

    if (!html) {
      console.error("Cookie banner: impossibile caricare cookie.html. Percorsi provati:", candidates, lastErr);
      return;
    }

    const holder = document.createElement("div");
    holder.id = "cookie-holder";
    holder.innerHTML = html;
    document.body.appendChild(holder);

    const banner = document.getElementById("cookieBanner");
    if (!banner) {
      console.error("Cookie banner: cookie.html caricato ma #cookieBanner non trovato.");
      return;
    }

    const acceptBtn = banner.querySelector("[data-cookie-accept]");
    const declineBtn = banner.querySelector("[data-cookie-decline]");

    banner.hidden = false;

    function close(choice) {
      localStorage.setItem(KEY, choice);
      holder.remove();
    }

    acceptBtn?.addEventListener("click", () => close("accepted"));
    declineBtn?.addEventListener("click", () => close("declined"));
  } catch (e) {
    console.error("Cookie banner error:", e);
  }
})();