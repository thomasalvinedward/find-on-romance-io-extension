(async () => {
  "use strict";
  const RIO = globalThis.FindOnRomanceIO;

  function readAudibleMetadata() {
    const script = document.querySelector('adbl-product-metadata script[type="application/json"]');
    if (!script?.textContent) return null;

    try {
      const data = JSON.parse(script.textContent);
      return {
        authors: Array.isArray(data.authors)
          ? data.authors.map((author) => RIO.cleanWhitespace(author?.name)).filter(Boolean)
          : [],
        narrators: Array.isArray(data.narrators)
          ? data.narrators.map((narrator) => RIO.cleanWhitespace(narrator?.name)).filter(Boolean)
          : []
      };
    } catch {
      return null;
    }
  }

  function extractAudibleBook() {
    const structured = RIO.extractStructuredBook();
    const audibleMetadata = readAudibleMetadata();

    const rawTitle = RIO.textFrom([
      'adbl-title-lockup h1[slot="title"]',
      'adbl-product-hero h1[slot="title"]',
      '[data-testid="product-title"]',
      ".product-title h1",
      "h1.bc-heading",
      "h1"
    ]) || structured?.title;

    let authors = audibleMetadata?.authors ?? [];
    if (!authors.length) {
      authors = RIO.textsFrom([
        'adbl-product-metadata a[href*="/author/"]',
        '[data-testid="author-name"] a',
        ".authorLabel a",
        "li.authorLabel a",
        'adbl-product-hero a[href*="/author/"]',
        '.product-detail a[href*="/author/"]'
      ]);
    }
    if (!authors.length) authors = structured?.authors ?? [];

    return {
      source: "audible",
      rawTitle: RIO.cleanWhitespace(rawTitle),
      coreTitle: RIO.getCoreTitle(rawTitle),
      authors: RIO.unique(authors),
      asin: location.pathname.match(/\/([A-Z0-9]{10})(?:[/?]|$)/i)?.[1] ?? "",
      isbn: structured?.isbn ?? ""
    };
  }

  function findLastBuyBoxRow(buyBox) {
    const children = [...buyBox.children];
    for (let index = children.length - 1; index >= 0; index -= 1) {
      if (children[index].matches("div")) return children[index];
    }
    return buyBox.lastElementChild;
  }

  const buyBox = await RIO.waitForElement([
    "#adbl-common-buybox #adbl-buybox-area",
    "#adbl-buybox-area"
  ]);

  if (buyBox) {
    const lastBuyBoxRow = findLastBuyBoxRow(buyBox);
    if (lastBuyBoxRow) {
      RIO.insertButton({
        container: lastBuyBoxRow,
        position: "before",
        bookProvider: extractAudibleBook,
        variant: "audible"
      });
      return;
    }
  }

  const fallbackBuyBox = await RIO.waitForElement([
    "#adbl-buy-box",
    "#adbl-common-buybox",
    "#adbl-buy-box-area",
    '[data-testid="buybox"]',
    ".adblBuyBoxArea",
    ".adblBuyBox",
    ".adbl-buybox",
    ".buybox"
  ]);

  if (fallbackBuyBox) {
    RIO.insertButton({
      container: fallbackBuyBox,
      position: "prepend",
      bookProvider: extractAudibleBook,
      variant: "audible"
    });
    return;
  }

  const hero = await RIO.waitForElement([
    "adbl-product-hero",
    "adbl-title-lockup",
    'h1[slot="title"]',
    '[data-testid="product-title"]',
    ".product-title h1",
    "h1"
  ]);

  if (hero) {
    RIO.insertButton({
      container: hero,
      position: "after",
      bookProvider: extractAudibleBook,
      variant: "audible"
    });
  }
})();
