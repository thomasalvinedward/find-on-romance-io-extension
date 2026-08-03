(async () => {
  "use strict";
  const RIO = globalThis.FindOnRomanceIO;

  const SOURCE = "smashwords";
  const TITLE_SELECTORS = [
    "#react-root h1"
  ];
  const AUTHOR_FALLBACK_SELECTORS = [
    '#react-root a[href*="/profile/view/"]',
    '#react-root a[href*="/profile/"]',
    'a[href*="/profile/view/"]'
  ];
  const SAMPLE_BUTTON_SELECTORS = [
    '#react-root a.btn[href*="/extreader/readEpub/"][href$="/sample"]',
    '#react-root a.btn[href*="/books/read/"][href*="/sample"]'
  ];
  const PRIMARY_PLACEMENT_SELECTORS = [
    "#react-root .book-cover-frame",
    "#react-root img.book-cover",
    '#react-root img[src*="bookCovers"]',
    "#react-root h1"
  ];
  const FALLBACK_PLACEMENT_SELECTOR = "#react-root";
  const BOOK_PATH_PATTERN = /^\/books\/(?:view\/)?(\d+)(?:\/|$)/;

  function isSupportedPage() {
    if (!BOOK_PATH_PATTERN.test(location.pathname)) return false;
    const structured = RIO.extractStructuredBook();
    return Boolean(structured?.title && structured?.authors?.length);
  }

  function metaContent(selector) {
    return RIO.cleanWhitespace(document.querySelector(selector)?.content);
  }

  function authorFromProfileUrl() {
    const value = metaContent('meta[property="books:author"]');
    if (!value) return "";

    try {
      const slug = new URL(value, location.href).pathname.split("/").filter(Boolean).at(-1);
      return RIO.cleanWhitespace(decodeURIComponent(slug ?? "").replace(/[-_]+/g, " "));
    } catch {
      return "";
    }
  }

  function getTitle(structured) {
    return RIO.textFrom(TITLE_SELECTORS) || structured?.title || metaContent('meta[property="og:title"]');
  }

  function getAuthors(structured) {
    if (structured?.authors?.length) return structured.authors;

    const fallbackAuthors = RIO.textsFrom(AUTHOR_FALLBACK_SELECTORS);
    if (fallbackAuthors.length) return fallbackAuthors;

    const profileAuthor = authorFromProfileUrl();
    return profileAuthor ? [profileAuthor] : [];
  }

  function getIdentifiers() {
    return {
      smashwordsId: location.pathname.match(BOOK_PATH_PATTERN)?.[1] ?? "",
      isbn: metaContent('meta[property="books:isbn"]')
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

  function setButtonWidthFromSample(sampleButton) {
    const wrapper = document.getElementById("find-on-romance-io-extension-wrapper");
    const width = sampleButton?.getBoundingClientRect().width;
    if (wrapper && width > 0) {
      wrapper.style.setProperty("--find-on-romance-io-smashwords-width", `${width}px`);
    }
  }

  async function insertRomanceButton() {
    if (!(await RIO.isButtonEnabled(SOURCE))) return false;

    const sampleButton = await RIO.waitForElement(SAMPLE_BUTTON_SELECTORS, 12000);
    if (sampleButton) {
      const inserted = RIO.insertButton({
        container: sampleButton,
        position: "after",
        bookProvider: extractBook,
        variant: SOURCE
      });
      if (inserted) setButtonWidthFromSample(sampleButton);
      return inserted;
    }

    const primary = await RIO.waitForElement(PRIMARY_PLACEMENT_SELECTORS);
    if (primary) {
      const isTitle = primary.matches("h1");
      const container = isTitle
        ? primary
        : primary.closest(".card, .col, [class*='cover'], div") ?? primary;

      return RIO.insertButton({
        container,
        position: "after",
        bookProvider: extractBook,
        variant: SOURCE
      });
    }

    const fallback = await RIO.waitForElement(FALLBACK_PLACEMENT_SELECTOR, 2000);
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
