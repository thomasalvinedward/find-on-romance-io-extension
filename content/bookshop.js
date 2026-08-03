(async () => {
  "use strict";
  const RIO = globalThis.FindOnRomanceIO;

  const SOURCE = "bookshop";
  const TITLE_SELECTORS = [
    "main[aria-label='primary content'] h1",
    "h1"
  ];
  const PRIMARY_PLACEMENT_SELECTORS = [
    "form[action*='_action=cart.addToCart']",
    "main[aria-label='primary content'] button[type='submit']"
  ];
  const FALLBACK_PLACEMENT_SELECTORS = [
    "main[aria-label='primary content'] h1",
    "h1"
  ];

  function isSupportedPage() {
    if (!/^\/p\/books\//.test(location.pathname)) return false;
    const structured = RIO.extractStructuredBook();
    return Boolean(
      getTitle(structured) &&
      getAuthors(structured).length
    );
  }

  function getTitle(structured) {
    return structured?.title || RIO.textFrom(TITLE_SELECTORS);
  }

  function authorLabelsFromPage() {
    const root = document.querySelector("main[aria-label='primary content']") ?? document;
    const values = [];
    for (const element of root.querySelectorAll("a, p, span, div")) {
      const text = RIO.cleanWhitespace(element.textContent);
      if (text.length > 120) continue;
      const match = text.match(/^(.+?)\s*\((?:Author|Editor|Contributor)\)$/i);
      if (match?.[1]) values.push(RIO.cleanWhitespace(match[1]));
    }
    return RIO.unique(values);
  }

  function getAuthors(structured) {
    if (structured?.authors?.length) return structured.authors;
    return authorLabelsFromPage();
  }

  function getIdentifiers(structured) {
    const params = new URLSearchParams(location.search);
    return {
      bookshopId: location.pathname.split("/").filter(Boolean).at(-1) ?? "",
      isbn: params.get("ean") || structured?.isbn || structured?.sku || ""
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

  function hasWishlistAction(element) {
    return Array.from(element.querySelectorAll("a, button"))
      .some((action) => /wishlist/i.test(RIO.cleanWhitespace(action.textContent)));
  }

  function findPurchaseActionRow(cartForm) {
    let element = cartForm.parentElement;
    const main = document.querySelector("main[aria-label='primary content']") ?? document.body;

    while (element && element !== main && element !== document.body) {
      if (hasWishlistAction(element)) return element;
      element = element.parentElement;
    }

    return cartForm;
  }

  async function insertRomanceButton() {
    if (!(await RIO.isButtonEnabled(SOURCE))) return false;

    const primary = await RIO.waitForElement(PRIMARY_PLACEMENT_SELECTORS);
    if (primary) {
      const container = primary.matches("form")
        ? findPurchaseActionRow(primary)
        : primary;

      return RIO.insertButton({
        container,
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
  RIO.watchButtonSetting(SOURCE, insertRomanceButton);
  if (!(await RIO.isButtonEnabled(SOURCE))) return;
  await insertRomanceButton();
})();
