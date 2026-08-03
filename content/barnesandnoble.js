(async () => {
  "use strict";
  const RIO = globalThis.FindOnRomanceIO;

  const SOURCE = "barnesandnoble";
  const TITLE_SELECTORS = [
    "h1.product__title",
    "h1"
  ];
  const AUTHOR_SELECTORS = [
    ".product__header a[href*='/authors/']",
    ".product__contributor a[href*='/authors/']"
  ];
  const PRIMARY_PLACEMENT_SELECTORS = [
    ".product-image__gallery",
    ".product-image__main",
    ".product__image",
    "img[alt*='Cover']",
    "img[src*='pimages']"
  ];
  const FALLBACK_PLACEMENT_SELECTORS = [
    ".product-bropis",
    ".product__details",
    ".product__header",
    "h1.product__title"
  ];
  const BUTTON_ID = "find-on-romance-io-extension-button";
  const WRAPPER_ID = "find-on-romance-io-extension-wrapper";
  const REINSERT_DEBOUNCE_MS = 150;

  function isSupportedPage() {
    return /^\/w\//.test(location.pathname);
  }

  function getTitle(structured) {
    return structured?.title || RIO.textFrom(TITLE_SELECTORS);
  }

  function getAuthors(structured) {
    if (structured?.authors?.length) return structured.authors;

    const details = document.querySelector(".product__details") ?? document;
    const authors = RIO.textsFrom(AUTHOR_SELECTORS, details);
    if (authors.length) return authors;

    return RIO.textsFrom(AUTHOR_SELECTORS);
  }

  function getIdentifiers(structured) {
    return {
      barnesAndNobleId: location.pathname.match(/\/w\/[^/]+\/(\d+)/)?.[1] ?? "",
      isbn: new URLSearchParams(location.search).get("ean") || structured?.isbn || structured?.sku || ""
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

  function isVisible(element) {
    if (!element?.isConnected) return false;
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.display !== "none" &&
      style.visibility !== "hidden"
    );
  }

  function existingButtonIsUsable() {
    const wrapper = document.getElementById(WRAPPER_ID);
    const button = document.getElementById(BUTTON_ID);
    return Boolean(wrapper && button && isVisible(wrapper) && isVisible(button));
  }

  function removeStaleButton() {
    const wrapper = document.getElementById(WRAPPER_ID);
    const button = document.getElementById(BUTTON_ID);
    if ((wrapper || button) && !existingButtonIsUsable()) {
      wrapper?.remove();
      button?.remove();
    }
  }

  function normalizePlacementTarget(element) {
    if (!element) return null;
    if (element.matches("img")) {
      return element.closest("picture, figure, .product-image__gallery, .product-image__main, .product__image") ?? element;
    }
    return element;
  }

  function waitForVisibleElement(selectors, timeoutMs = 12000) {
    const visible = findVisibleElement(selectors);
    if (visible) return Promise.resolve(visible);

    return new Promise((resolve) => {
      const started = Date.now();
      const observer = new MutationObserver(() => {
        const element = findVisibleElement(selectors);
        if (element || Date.now() - started >= timeoutMs) {
          observer.disconnect();
          resolve(element || null);
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
    if (!(await RIO.isButtonEnabled(SOURCE))) return false;

    if (existingButtonIsUsable()) return true;
    removeStaleButton();

    const primary = await waitForVisibleElement(PRIMARY_PLACEMENT_SELECTORS);
    if (primary) {
      const target = normalizePlacementTarget(primary);
      return RIO.insertButton({
        container: target,
        position: target.matches(".product__image") ? "append" : "after",
        bookProvider: extractBook,
        variant: SOURCE
      });
    }

    const fallback = await waitForVisibleElement(FALLBACK_PLACEMENT_SELECTORS, 3000);
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
  RIO.watchButtonSetting(SOURCE, insertRomanceButton);
  if (!(await RIO.isButtonEnabled(SOURCE))) return;
  await insertRomanceButton();

  let reinsertTimer = null;
  let reinsertInProgress = false;
  const scheduleReinsert = () => {
    if (reinsertTimer || reinsertInProgress) return;
    reinsertTimer = setTimeout(async () => {
      reinsertTimer = null;
      reinsertInProgress = true;
      await insertRomanceButton();
      reinsertInProgress = false;
    }, REINSERT_DEBOUNCE_MS);
  };

  const observer = new MutationObserver(() => {
    if (!existingButtonIsUsable()) scheduleReinsert();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true });
  setTimeout(scheduleReinsert, 3000);
})();
