(async () => {
  "use strict";
  const RIO = globalThis.FindOnRomanceIO;

  const SOURCE = "kobo";
  const TITLE_SELECTORS = [
    ".item-info h1.title.product-field",
    ".title-widget h1.title.product-field",
    "h1.title.product-field"
  ];
  const AUTHOR_FALLBACK_SELECTORS = [
    ".item-info p.author.no-border a.contributor-name",
    ".item-info span.authors.product-field a.contributor-name",
    "p.author.no-border a.contributor-name",
    "span.authors.product-field a.contributor-name"
  ];
  const PRIMARY_PLACEMENT_SELECTORS = [
    ".primary-right-container .pricing-details .action-container",
    ".item-info .pricing-details .action-container"
  ];
  const FALLBACK_PLACEMENT_SELECTORS = [
    ".primary-right-container .pricing-details",
    ".item-info .pricing-details",
    ".item-info",
    ".primary-right-container",
    ".item-primary-metadata"
  ];

  function isSupportedPage() {
    if (!/^\/[^/]+\/[^/]+\/ebook\/[^/]+/.test(location.pathname)) return false;
    const structured = RIO.extractStructuredBook();
    return Boolean(
      getTitle(structured) &&
      getAuthors(structured).length
    );
  }

  function getTitle(structured) {
    return structured?.title || RIO.textFrom(TITLE_SELECTORS);
  }

  function getAuthors(structured) {
    if (structured?.authors?.length) return structured.authors;
    return RIO.textsFrom(AUTHOR_FALLBACK_SELECTORS);
  }

  function getIdentifiers(structured) {
    return {
      koboSlug: location.pathname.split("/").filter(Boolean).at(-1) ?? "",
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
        if (rect.width > 0 && rect.height > 0) return element;
      }
    }
    return null;
  }

  function findVisiblePrimaryActions() {
    for (const selector of PRIMARY_PLACEMENT_SELECTORS) {
      for (const element of document.querySelectorAll(selector)) {
        const rect = element.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) continue;
        if (element.querySelector(".purchase-action, .library-action")) return element;
      }
    }
    return null;
  }

  async function waitForVisiblePrimaryActions(timeoutMs) {
    const element = findVisiblePrimaryActions();
    if (element) return element;

    await RIO.waitForElement(PRIMARY_PLACEMENT_SELECTORS, timeoutMs);
    return findVisiblePrimaryActions();
  }

  async function waitForVisibleElement(selectors, timeoutMs) {
    const element = findVisibleElement(selectors);
    if (element) return element;

    await RIO.waitForElement(selectors, timeoutMs);
    return findVisibleElement(selectors);
  }

  async function insertRomanceButton() {
    if (!(await RIO.isButtonEnabled(SOURCE))) return false;

    const primary = await waitForVisiblePrimaryActions(12000);
    if (primary) {
      return RIO.insertButton({
        container: primary,
        position: "after",
        bookProvider: extractBook,
        variant: SOURCE
      });
    }

    const fallback = await waitForVisibleElement(FALLBACK_PLACEMENT_SELECTORS, 3000);
    if (fallback) {
      return RIO.insertButton({
        container: fallback,
        position: "prepend",
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
})();
