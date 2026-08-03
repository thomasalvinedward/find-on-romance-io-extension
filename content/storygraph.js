(async () => {
  "use strict";
  const RIO = globalThis.FindOnRomanceIO;

  const SOURCE = "storygraph";
  const TITLE_SELECTORS = [
    ".book-title-author-and-series h3"
  ];
  const AUTHOR_FALLBACK_SELECTORS = [
    '.book-title-author-and-series a[href*="/authors/"]',
    'a[href*="/authors/"]'
  ];
  const PRIMARY_PLACEMENT_SELECTORS = [
    ".on-book-page.action-menu",
    ".mobile-action-menu"
  ];
  const FALLBACK_PLACEMENT_SELECTORS = [
    ".book-title-author-and-series",
    ".book-cover"
  ];

  function isSupportedPage() {
    if (!/^\/books\/[0-9a-f-]+(?:\/)?$/i.test(location.pathname)) return false;
    return Boolean(getTitle() && getAuthors().length);
  }

  function metaContent(selector) {
    return RIO.cleanWhitespace(document.querySelector(selector)?.content);
  }

  function ogTitleParts() {
    const value = metaContent('meta[property="og:title"]');
    const match = value.match(/^(.+?)\s+by\s+(.+)$/i);
    return {
      title: RIO.cleanWhitespace(match?.[1]),
      author: RIO.cleanWhitespace(match?.[2])
    };
  }

  function getTitle() {
    return RIO.textFrom(TITLE_SELECTORS) || ogTitleParts().title;
  }

  function getAuthors() {
    const authors = RIO.textsFrom(AUTHOR_FALLBACK_SELECTORS);
    if (authors.length) return authors;

    const ogAuthor = ogTitleParts().author;
    return ogAuthor ? [ogAuthor] : [];
  }

  function getIdentifiers() {
    const isbnMatch = document.body.textContent.match(/\bISBN\/UID:\s*([0-9X-]{10,17})\b/i);
    return {
      storygraphId: location.pathname.match(/^\/books\/([0-9a-f-]+)/i)?.[1] ?? "",
      isbn: isbnMatch?.[1]?.replace(/-/g, "") ?? ""
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

  async function waitForVisibleElement(selectors, timeoutMs) {
    const element = findVisibleElement(selectors);
    if (element) return element;

    await RIO.waitForElement(selectors, timeoutMs);
    return findVisibleElement(selectors);
  }

  async function insertRomanceButton() {
    if (!(await RIO.isButtonEnabled(SOURCE))) return false;

    const primary = await waitForVisibleElement(PRIMARY_PLACEMENT_SELECTORS, 12000);
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
