(async () => {
  "use strict";
  const RIO = globalThis.FindOnRomanceIO;

  const SOURCE = "ebooks";
  const TITLE_SELECTORS = [
    ".product-page-header h1#main-content",
    "h1#main-content",
    "h1"
  ];
  const AUTHOR_SELECTORS = [
    ".product-page-header .author-list a[href*='/author/']",
    ".product-page-header a[href*='/author/']",
    "article.book-article a[href*='/author/']"
  ];
  const PRIMARY_PLACEMENT_SELECTORS = [
    "#book-action-desktop",
    "#book-action-tablet",
    "#book-action-mobile",
    "#book-action-mobile-desktop",
    "#book-action-mobile-tablet",
    "#book-action-mobile-mobile",
    ".book-availability #cart-add a[href*='/cart/add/']"
  ];
  const FALLBACK_PLACEMENT_SELECTORS = [
    ".product-page-header-container",
    ".product-page-header",
    "h1#main-content",
    ".product-page-main"
  ];
  const BUTTON_ID = "find-on-romance-io-extension-button";

  function isSupportedPage() {
    return /^\/[^/]+\/book\/\d+\//.test(location.pathname);
  }

  function cleanAuthor(value) {
    let text = RIO.cleanWhitespace(value)
      .replace(/^author:\s*/i, "")
      .replace(/\s*,?\s*author\s*$/i, "");

    const midpoint = Math.floor(text.length / 2);
    const first = RIO.cleanWhitespace(text.slice(0, midpoint));
    const second = RIO.cleanWhitespace(text.slice(midpoint));
    if (first && first === second) text = first;

    return text;
  }

  function getTitle(structured) {
    return structured?.title || RIO.textFrom(TITLE_SELECTORS);
  }

  function getAuthors(structured) {
    if (structured?.authors?.length) return structured.authors;
    return RIO.unique(RIO.textsFrom(AUTHOR_SELECTORS).map(cleanAuthor));
  }

  function getIdentifiers(structured) {
    return {
      ebooksId: location.pathname.match(/\/book\/(\d+)\//)?.[1] ?? "",
      isbn: structured?.isbn || structured?.sku || ""
    };
  }

  function extractBook() {
    const structured = RIO.extractStructuredBook();
    return RIO.createBookRecord({
      source: SOURCE,
      rawTitle: getTitle(structured),
      authors: getAuthors(structured),
      identifiers: getIdentifiers(structured),
      structured
    });
  }

  function findVisibleElement(selectors) {
    for (const selector of selectors) {
      for (const element of document.querySelectorAll(selector)) {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        if (
          rect.width > 0 &&
          rect.height > 0 &&
          style.display !== "none" &&
          style.visibility !== "hidden"
        ) {
          return element;
        }
      }
    }
    return null;
  }

  function waitForVisibleElement(selectors, timeoutMs = 12000) {
    const element = findVisibleElement(selectors);
    if (element) return Promise.resolve(element);

    return new Promise((resolve) => {
      const started = Date.now();
      const observer = new MutationObserver(() => {
        const visible = findVisibleElement(selectors);
        if (visible || Date.now() - started >= timeoutMs) {
          observer.disconnect();
          resolve(visible || null);
        }
      });
      observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true });

      setTimeout(() => {
        observer.disconnect();
        resolve(findVisibleElement(selectors));
      }, timeoutMs);
    });
  }

  async function insertRomanceButton() {
    const primary = await waitForVisibleElement(PRIMARY_PLACEMENT_SELECTORS, 12000);
    if (primary) {
      return RIO.insertButton({
        container: primary,
        position: "after",
        bookProvider: extractBook,
        variant: SOURCE
      });
    }

    const fallback = await RIO.waitForElement(FALLBACK_PLACEMENT_SELECTORS, 3000);
    if (fallback) {
      return RIO.insertButton({
        container: fallback,
        position: "after",
        bookProvider: extractBook,
        variant: SOURCE
      });
    }

    return false;
  }

  if (!isSupportedPage()) return;
  await insertRomanceButton();
  if (!document.getElementById(BUTTON_ID)) {
    setTimeout(insertRomanceButton, 3000);
  }
})();
