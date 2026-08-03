(async () => {
  "use strict";
  const RIO = globalThis.FindOnRomanceIO;

  const SOURCE = "audible";
  const TITLE_SELECTORS = [
    'adbl-title-lockup h1[slot="title"]',
    'adbl-product-hero h1[slot="title"]',
    '[data-testid="product-title"]',
    ".product-title h1"
  ];
  const AUTHOR_FALLBACK_SELECTORS = [
    'adbl-product-metadata a[href*="/author/"]',
    '[data-testid="author-name"] a',
    ".authorLabel a",
    "li.authorLabel a",
    'adbl-product-hero a[href*="/author/"]',
    '.product-detail a[href*="/author/"]'
  ];
  const PRIMARY_PLACEMENT_SELECTORS = [
    "#adbl-common-buybox #adbl-buybox-area",
    "#adbl-buybox-area"
  ];
  const FALLBACK_BUYBOX_SELECTORS = [
    "#adbl-buy-box",
    "#adbl-common-buybox",
    "#adbl-buy-box-area",
    '[data-testid="buybox"]',
    ".adblBuyBoxArea",
    ".adblBuyBox",
    ".adbl-buybox",
    ".buybox"
  ];
  const FALLBACK_PLACEMENT_SELECTORS = [
    "adbl-product-hero",
    "adbl-title-lockup",
    'h1[slot="title"]',
    '[data-testid="product-title"]',
    ".product-title h1"
  ];

  function isSupportedPage() {
    return /\/(?:pd|ac)\/.+\/[A-Z0-9]{10}(?:[/?]|$)/i.test(location.pathname) ||
      /\/(?:pd|ac)\/.+/i.test(location.pathname);
  }

  function readMetadata() {
    for (const script of document.querySelectorAll('adbl-product-metadata script[type="application/json"]')) {
      try {
        const data = JSON.parse(script.textContent);
        const authors = Array.isArray(data.authors)
          ? data.authors.map((author) => RIO.cleanWhitespace(author?.name)).filter(Boolean)
          : [];
        if (!authors.length) continue;

        return {
          authors,
          narrators: Array.isArray(data.narrators)
            ? data.narrators.map((narrator) => RIO.cleanWhitespace(narrator?.name)).filter(Boolean)
            : []
        };
      } catch {
        // Continue through other product metadata scripts.
      }
    }

    return null;
  }

  function getTitle(structured) {
    return RIO.textFrom(TITLE_SELECTORS) || structured?.title;
  }

  function getAuthors(structured) {
    const metadata = readMetadata();
    if (metadata?.authors?.length) return metadata.authors;

    const fallbackAuthors = RIO.textsFrom(AUTHOR_FALLBACK_SELECTORS);
    return fallbackAuthors.length ? fallbackAuthors : structured?.authors ?? [];
  }

  function getIdentifiers() {
    return {
      asin: location.pathname.match(/\/([A-Z0-9]{10})(?:[/?]|$)/i)?.[1] ?? ""
    };
  }

  function extractBook() {
    const structured = RIO.extractStructuredBook();
    return RIO.createBookRecord({
      source: SOURCE,
      rawTitle: getTitle(structured),
      authors: getAuthors(structured),
      identifiers: getIdentifiers(),
      structured
    });
  }

  function findLastBuyBoxRow(buyBox) {
    const children = [...buyBox.children];
    for (let index = children.length - 1; index >= 0; index -= 1) {
      if (children[index].matches("div")) return children[index];
    }
    return buyBox.lastElementChild;
  }

  async function insertRomanceButton() {
    if (!(await RIO.isButtonEnabled(SOURCE))) return false;

    const buyBox = await RIO.waitForElement(PRIMARY_PLACEMENT_SELECTORS);
    const lastBuyBoxRow = buyBox ? findLastBuyBoxRow(buyBox) : null;
    if (lastBuyBoxRow) {
      return RIO.insertButton({
        container: lastBuyBoxRow,
        position: "before",
        bookProvider: extractBook,
        variant: SOURCE
      });
    }

    const fallbackBuyBox = await RIO.waitForElement(FALLBACK_BUYBOX_SELECTORS);
    if (fallbackBuyBox) {
      return RIO.insertButton({
        container: fallbackBuyBox,
        position: "prepend",
        bookProvider: extractBook,
        variant: SOURCE
      });
    }

    const fallback = await RIO.waitForElement(FALLBACK_PLACEMENT_SELECTORS);
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
})();
