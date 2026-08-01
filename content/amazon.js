(async () => {
  "use strict";
  const RIO = globalThis.FindOnRomanceIO;

  const SOURCE = "amazon";
  const TITLE_SELECTORS = [
    "#productTitle",
    "#ebooksProductTitle",
    "h1#title span"
  ];
  const AUTHOR_FALLBACK_SELECTORS = [
    "#bylineInfo .author a",
    "#bylineInfo a.contrib-link",
    "#bylineInfo a[href*='/e/']"
  ];
  const PRIMARY_PLACEMENT_SELECTORS = [
    "#desktop-below-image-block",
    "#imageBlock_feature_div",
    "#imageBlock",
    "#leftCol"
  ];
  const FALLBACK_PLACEMENT_SELECTORS = [
    "#rightCol",
    "#title_feature_div"
  ];

  function isSupportedPage() {
    if (!/\/(?:dp|gp\/product)\/[A-Z0-9]{10}/i.test(location.pathname)) return false;
    if (!document.querySelector(TITLE_SELECTORS.join(","))) return false;

    const structured = RIO.extractStructuredBook();
    if (structured?.authors?.length || structured?.isbn) return true;
    if (hasBookByline()) return true;

    return hasBookDetailSignals();
  }

  function hasBookByline() {
    return [...document.querySelectorAll("#bylineInfo .author")].some((span) => {
      const role = RIO.normalize(span.querySelector(".contribution")?.textContent);
      return role.includes("author") || role.includes("editor");
    });
  }

  function hasBookDetailSignals() {
    const selectors = [
      "#tmmSwatches",
      "#mediaMatrix",
      "#formats",
      "#bookDescription_feature_div",
      "#detailBullets_feature_div",
      "#productDetailsTable",
      'a[href*="/kindle-dbs/"]',
      'a[href*="/dp/"][href*="binding="]',
      'input[name="ASIN.0"]'
    ];
    const detailText = RIO.normalize(RIO.textFrom([
      "#detailBullets_feature_div",
      "#productDetailsTable",
      "#detailBulletsWrapper_feature_div"
    ]));

    return selectors.some((selector) => document.querySelector(selector)) &&
      /\b(?:isbn|publisher|publication date|print length|audible audiobook|kindle|paperback|hardcover)\b/.test(detailText);
  }

  function getTitle(structured) {
    return RIO.textFrom(TITLE_SELECTORS) || structured?.title;
  }

  function getAuthors(structured) {
    const authors = [...document.querySelectorAll("#bylineInfo .author")]
      .filter((span) => {
        const role = RIO.normalize(span.querySelector(".contribution")?.textContent);
        return !role || role.includes("author") || role.includes("editor");
      })
      .flatMap((span) => [...span.querySelectorAll("a")])
      .map((anchor) => RIO.cleanWhitespace(anchor.textContent))
      .filter(Boolean);
    if (authors.length) return authors;

    const fallbackAuthors = RIO.textsFrom(AUTHOR_FALLBACK_SELECTORS);
    return fallbackAuthors.length ? fallbackAuthors : structured?.authors ?? [];
  }

  function getIdentifiers() {
    return {
      asin: location.pathname.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i)?.[1] ?? ""
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
      return RIO.insertButton({
        container: primary,
        position: "after",
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

    return false;
  }

  if (!isSupportedPage()) return;
  await insertRomanceButton();
})();
