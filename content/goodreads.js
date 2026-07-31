(async () => {
  "use strict";
  const RIO = globalThis.FindOnRomanceIO;

  function extractGoodreadsBook() {
    const structured = RIO.extractStructuredBook();
    const rawTitle = RIO.textFrom([
      '[data-testid="bookTitle"]',
      "h1.Text__title1",
      ".BookPageTitleSection h1",
      "h1"
    ]) || structured?.title;

    let authors = RIO.textsFrom([
      '[data-testid="name"]',
      '.ContributorLink__name',
      '.BookPageMetadataSection a[href*="/author/show/"] span',
      'a[href*="/author/show/"] .Text'
    ]);
    if (!authors.length) authors = structured?.authors ?? [];

    return {
      source: "goodreads",
      rawTitle: RIO.cleanWhitespace(rawTitle),
      coreTitle: RIO.getCoreTitle(rawTitle),
      authors: RIO.unique(authors),
      goodreadsId: location.pathname.match(/\/book\/show\/(\d+)/)?.[1] ?? "",
      isbn: structured?.isbn ?? ""
    };
  }

  const actionsContainer = await RIO.waitForElement([
    ".BookActions",
    '[data-testid="bookActions"]',
    '[class*="BookActions"]'
  ]);

  if (actionsContainer) {
    RIO.insertButton({
      container: actionsContainer,
      position: "prepend",
      bookProvider: extractGoodreadsBook,
      variant: "goodreads"
    });
    return;
  }

  const rightColumn = await RIO.waitForElement([
    ".BookPage__rightColumn",
    '[class*="BookPage__rightColumn"]',
    ".BookPageMetadataSection"
  ]);

  if (rightColumn) {
    RIO.insertButton({
      container: rightColumn,
      bookProvider: extractGoodreadsBook,
      variant: "goodreads"
    });
    return;
  }

  const title = await RIO.waitForElement([
    '[data-testid="bookTitle"]',
    "h1.Text__title1",
    "h1"
  ]);
  if (title?.parentElement) {
    RIO.insertButton({
      container: title.parentElement,
      position: "after",
      bookProvider: extractGoodreadsBook
    });
  }
})();
