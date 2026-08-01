(async () => {
  "use strict";
  const RIO = globalThis.FindOnRomanceIO;

  const SOURCE = "goodreads";
  const TITLE_SELECTORS = [
    '[data-testid="bookTitle"]',
    "h1.Text__title1",
    ".BookPageTitleSection h1"
  ];
  const AUTHOR_FALLBACK_SELECTORS = [
    '.BookPageMetadataSection .ContributorLink__name',
    '.BookPageMetadataSection a[href*="/author/show/"] span[data-testid="name"]',
    '.BookPageMetadataSection a[href*="/author/show/"]'
  ];
  const PRIMARY_PLACEMENT_SELECTORS = [
    '[data-testid="bookActions"]',
    ".BookActions",
    '[class*="BookActions"]',
    ".BookActions__button"
  ];
  const FALLBACK_PLACEMENT_SELECTORS = [
    ".BookPage__rightColumn",
    '[class*="BookPage__rightColumn"]',
    ".BookPageMetadataSection"
  ];

  function isSupportedPage() {
    return /^\/(?:en\/)?book\/show\//.test(location.pathname);
  }

  function getTitle(structured) {
    return RIO.textFrom(TITLE_SELECTORS) || structured?.title;
  }

  function getAuthors(structured) {
    if (structured?.authors?.length) return structured.authors;
    return RIO.textsFrom(AUTHOR_FALLBACK_SELECTORS);
  }

  function getIdentifiers() {
    return {
      goodreadsId: location.pathname.match(/\/book\/show\/(\d+)/)?.[1] ?? ""
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

  async function insertRomanceButton() {
    const primary = await RIO.waitForElement(PRIMARY_PLACEMENT_SELECTORS);
    if (primary) {
      const isButtonLike = primary.matches("button, a, .BookActions__button");
      const container = isButtonLike
        ? primary.closest('[data-testid="bookActions"], .BookActions, [class*="BookActions"]')?.parentElement ?? primary
        : primary;

      return RIO.insertButton({
        container,
        position: isButtonLike ? "after" : "prepend",
        bookProvider: extractBook,
        variant: SOURCE
      });
    }

    const fallback = await RIO.waitForElement(FALLBACK_PLACEMENT_SELECTORS);
    if (fallback) {
      return RIO.insertButton({
        container: fallback,
        bookProvider: extractBook,
        variant: SOURCE
      });
    }

    const title = await RIO.waitForElement(TITLE_SELECTORS);
    if (title?.parentElement) {
      return RIO.insertButton({
        container: title.parentElement,
        position: "after",
        bookProvider: extractBook,
        variant: SOURCE
      });
    }

    return false;
  }

  if (!isSupportedPage()) return;
  await insertRomanceButton();
})();
