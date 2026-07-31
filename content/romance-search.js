(async () => {
  "use strict";
  const RIO = globalThis.FindOnRomanceIO;
  const hashMatch = location.hash.match(/(?:^#|&)find-on-romance-io=([^&]+)/);
  if (!hashMatch) return;

  const lookupId = decodeURIComponent(hashMatch[1]);
  const book = await RIO.getLookup(lookupId);
  if (!book) return;

  const STATUS_ID = "find-on-romance-io-search-status";
  let hasEvaluated = false;

  // Search pages can load results asynchronously. The status message makes the
  // redirect decision visible instead of silently changing pages or doing nothing.
  function showStatus(message, kind = "neutral") {
    let status = document.getElementById(STATUS_ID);
    if (!status) {
      status = document.createElement("div");
      status.id = STATUS_ID;
      status.setAttribute("role", "status");
      status.style.cssText = [
        "box-sizing:border-box",
        "width:min(920px,calc(100% - 32px))",
        "margin:16px auto",
        "padding:12px 16px",
        "border-radius:8px",
        "font:600 14px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
        "position:relative",
        "z-index:9999"
      ].join(";");
      (document.querySelector("main") ?? document.body).prepend(status);
    }
    status.textContent = message;
    if (kind === "failure") {
      status.style.background = "#FFF1F8";
      status.style.border = "1px solid #DD0489";
      status.style.color = "#6E0345";
    } else {
      status.style.background = "#F6F6F6";
      status.style.border = "1px solid #D8D8D8";
      status.style.color = "#333";
    }
  }

  function getSlug(anchor) {
    try {
      const parts = new URL(anchor.href, location.href).pathname.split("/").filter(Boolean);
      return decodeURIComponent(parts.at(-1) ?? "").replace(/-/g, " ");
    } catch {
      return "";
    }
  }

  function findResultContainer(anchor) {
    const preferred = anchor.closest([
      "article",
      "li",
      '[class*="book-card"]',
      '[class*="bookCard"]',
      '[class*="search-result"]',
      '[class*="searchResult"]',
      '[class*="book-list"]',
      '[class*="bookList"]'
    ].join(","));
    if (preferred) return preferred;

    // Romance.io markup can change, so fall back to a nearby compact container
    // that has enough text to compare but not an entire page worth of content.
    let current = anchor.parentElement;
    for (let depth = 0; current && depth < 5; depth += 1, current = current.parentElement) {
      const textLength = RIO.cleanWhitespace(current.innerText).length;
      const resultLinks = current.querySelectorAll('a[href*="/books/"]').length;
      if (textLength >= 12 && textLength <= 1800 && resultLinks <= 4) return current;
    }
    return anchor.parentElement ?? anchor;
  }

  function titleFromAnchor(anchor) {
    const explicit = RIO.cleanWhitespace(
      anchor.getAttribute("title") || anchor.getAttribute("aria-label")
    );
    const visible = RIO.cleanWhitespace(anchor.textContent);
    const imageAlt = RIO.cleanWhitespace(anchor.querySelector("img")?.alt);
    return explicit || visible || imageAlt || getSlug(anchor);
  }

  function collectCandidates() {
    const seen = new Set();
    const candidates = [];
    for (const anchor of document.querySelectorAll('a[href*="/books/"]')) {
      let url;
      try {
        url = new URL(anchor.href, location.href);
      } catch {
        continue;
      }
      if (url.origin !== location.origin || !/^\/books\/[^/]+\/[^/]+/.test(url.pathname)) continue;
      if (seen.has(url.pathname)) continue;
      seen.add(url.pathname);

      const container = findResultContainer(anchor);
      candidates.push({
        url: `${url.origin}${url.pathname}${url.search}`,
        title: titleFromAnchor(anchor),
        contextText: RIO.cleanWhitespace(container?.innerText),
        slug: getSlug(anchor)
      });
    }
    return candidates;
  }

  async function evaluate() {
    if (hasEvaluated) return true;
    const candidates = collectCandidates();
    if (!candidates.length) return false;
    hasEvaluated = true;

    const result = RIO.pickBestMatch(book, candidates, {
      threshold: 0.90,
      minimumLead: 0.08
    });

    await RIO.removeLookup(lookupId);

    // Redirect only when matching logic is confident. Otherwise leave the user
    // on the visible search results with an explanation.
    if (result.confident && result.best?.url) {
      location.replace(result.best.url);
      return true;
    }

    console.info("Find on Romance.io: no confident redirect", result);
    showStatus(
      `No high-confidence match was found for “${book.coreTitle}” by ${book.authors.join(", ")}. Showing the Romance.io search results instead.`,
      "failure"
    );
    return true;
  }

  showStatus(`Checking Romance.io for “${book.coreTitle}”…`);

  if (await evaluate()) return;

  const observer = new MutationObserver(async () => {
    if (await evaluate()) observer.disconnect();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  setTimeout(async () => {
    observer.disconnect();
    if (hasEvaluated) return;
    await RIO.removeLookup(lookupId);
    showStatus(
      `Romance.io did not return a result I could verify for “${book.coreTitle}” by ${book.authors.join(", ")}.`,
      "failure"
    );
  }, 10000);
})();
