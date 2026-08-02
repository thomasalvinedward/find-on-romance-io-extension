(async () => {
  "use strict";
  const RIO = globalThis.FindOnRomanceIO;
  const hashMatch = location.hash.match(/(?:^#|&)find-on-romance-io=([^&]+)/);
  if (!hashMatch) return;

  const lookupId = decodeURIComponent(hashMatch[1]);
  const book = await RIO.getLookup(lookupId);
  if (!book) return;
  RIO.debugLog?.("loaded lookup metadata", {
    lookupId,
    source: book.source,
    sourceUrl: book.sourceUrl,
    rawTitle: book.rawTitle,
    titleParts: book.titleParts ?? RIO.extractTitleParts(book.rawTitle),
    coreTitle: book.coreTitle,
    authors: book.authors,
    identifiers: {
      amazonAsin: book.amazonAsin,
      audibleAsin: book.audibleAsin,
      barnesAndNobleId: book.barnesAndNobleId,
      bookshopId: book.bookshopId,
      ebooksId: book.ebooksId,
      goodreadsId: book.goodreadsId,
      koboId: book.koboId,
      smashwordsId: book.smashwordsId,
      storygraphId: book.storygraphId,
      isbn: book.isbn
    }
  });

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

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function stripKnownAuthorSuffix(value) {
    let title = value;
    const authorNames = RIO.unique((book.authors ?? [])
      .flatMap((author) => [author, RIO.compactInitials(author)])
      .map(RIO.cleanWhitespace))
      .sort((a, b) => b.length - a.length);

    for (const author of authorNames) {
      const pattern = new RegExp(`\\s+(?:by\\s+)?${escapeRegExp(author)}\\s*$`, "i");
      if (pattern.test(title)) {
        title = title.replace(pattern, "").trim();
        break;
      }
    }

    return title;
  }

  function titleValuesFromAnchor(anchor, slug) {
    const explicit = RIO.cleanWhitespace(
      anchor.getAttribute("title") || anchor.getAttribute("aria-label")
    );
    const visible = RIO.cleanWhitespace(anchor.textContent);
    const imageAlt = RIO.cleanWhitespace(anchor.querySelector("img")?.alt);
    return RIO.unique([explicit, visible, imageAlt, slug])
      .map(cleanResultTitle)
      .filter(Boolean);
  }

  function cleanResultTitle(value) {
    return RIO.extractTitleParts(stripKnownAuthorSuffix(RIO.cleanWhitespace(value)
      .replace(/^#?\{?index\}?\s*[-–—]\s*/i, "")
      .replace(/^cover image of\s+/i, ""))).displayTitle;
  }

  function scoreForCandidate(candidate) {
    return RIO.scoreCandidate(book, candidate).score;
  }

  function collectCandidates() {
    const candidatesByPath = new Map();
    let inspectedAnchors = 0;
    let skippedAnchors = 0;
    for (const anchor of document.querySelectorAll('a[href*="/books/"]')) {
      inspectedAnchors += 1;
      let url;
      try {
        url = new URL(anchor.href, location.href);
      } catch {
        skippedAnchors += 1;
        continue;
      }
      if (!/(^|\.)romance\.io$/i.test(url.hostname) || !/^\/books\/[a-f0-9]{12,}(?:\/[^/]+)?/i.test(url.pathname)) {
        skippedAnchors += 1;
        continue;
      }

      const slug = getSlug(anchor);
      const container = findResultContainer(anchor);
      const contextText = RIO.cleanWhitespace(container?.innerText);
      const urlValue = `${url.origin}${url.pathname}${url.search}`;
      for (const title of titleValuesFromAnchor(anchor, slug)) {
        const candidate = {
          url: urlValue,
          title,
          titleParts: RIO.extractTitleParts(title),
          contextText,
          slug
        };
        const existing = candidatesByPath.get(url.pathname);
        if (!existing || scoreForCandidate(candidate) > scoreForCandidate(existing)) {
          candidatesByPath.set(url.pathname, candidate);
        }
      }
    }
    const candidates = [...candidatesByPath.values()];
    RIO.debugLog?.("candidate extraction", {
      inspectedAnchors,
      skippedAnchors,
      uniqueBookCandidates: candidates.length
    });
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
    RIO.debugTable?.("ranked result scores", result.ranked.slice(0, 25).map((candidate, index) => ({
      rank: index + 1,
      score: Number(candidate.score.toFixed(3)),
      authorMatched: candidate.authorMatched,
      title: candidate.title,
      displayTitle: candidate.titleParts?.displayTitle,
      coreTitle: candidate.titleParts?.coreTitle,
      subtitle: candidate.titleParts?.subtitle,
      reasons: candidate.reasons.join("; "),
      url: candidate.url
    })));
    RIO.debugLog?.("match decision", {
      confident: result.confident,
      threshold: 0.90,
      minimumLead: 0.08,
      lead: Number(result.lead.toFixed(3)),
      best: result.best && {
        title: result.best.title,
        score: result.best.score,
        reasons: result.best.reasons,
        url: result.best.url
      },
      second: result.second && {
        title: result.second.title,
        score: result.second.score,
        reasons: result.second.reasons,
        url: result.second.url
      }
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
