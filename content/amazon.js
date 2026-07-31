(async () => {
  "use strict";
  const RIO = globalThis.FindOnRomanceIO;

  function isBookPage() {
    if (!/\/(?:dp|gp\/product)\/[A-Z0-9]{10}/i.test(location.pathname)) return false;
    if (!document.querySelector("#productTitle, #ebooksProductTitle, h1#title span")) return false;

    const structured = RIO.extractStructuredBook();
    if (structured?.authors?.length || structured?.isbn) return true;

    const authorByline = [...document.querySelectorAll("#bylineInfo .author")].some((span) => {
      const role = RIO.normalize(span.querySelector(".contribution")?.textContent);
      return role.includes("author") || role.includes("editor");
    });
    if (authorByline) return true;

    const bookSignals = [
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

    return bookSignals.some((selector) => document.querySelector(selector)) &&
      /\b(?:isbn|publisher|publication date|print length|audible audiobook|kindle|paperback|hardcover)\b/.test(detailText);
  }

  function extractAmazonBook() {
    const structured = RIO.extractStructuredBook();
    const rawTitle = RIO.textFrom([
      "#productTitle",
      "#ebooksProductTitle",
      "h1#title span",
      "h1"
    ]) || structured?.title;

    const authorSpans = [...document.querySelectorAll("#bylineInfo .author")];
    let authors = authorSpans
      .filter((span) => {
        const role = RIO.normalize(span.querySelector(".contribution")?.textContent);
        return !role || role.includes("author") || role.includes("editor");
      })
      .flatMap((span) => [...span.querySelectorAll("a")])
      .map((anchor) => RIO.cleanWhitespace(anchor.textContent))
      .filter(Boolean);

    if (!authors.length) {
      authors = RIO.textsFrom([
        "#bylineInfo .author a",
        "#bylineInfo a.contrib-link",
        "#bylineInfo a[href*='/e/']"
      ]);
    }
    if (!authors.length) authors = structured?.authors ?? [];

    return {
      source: "amazon",
      rawTitle: RIO.cleanWhitespace(rawTitle),
      coreTitle: RIO.getCoreTitle(rawTitle),
      authors: RIO.unique(authors),
      asin: location.pathname.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i)?.[1] ?? "",
      isbn: structured?.isbn ?? ""
    };
  }

  if (!isBookPage()) return;

  const rightCol = await RIO.waitForElement("#rightCol");
  if (rightCol) {
    RIO.insertButton({
      container: rightCol,
      bookProvider: extractAmazonBook,
      variant: "amazon"
    });
    return;
  }

  const fallback = await RIO.waitForElement(["#centerCol", "#title_feature_div"]);
  if (fallback) {
    RIO.insertButton({
      container: fallback,
      bookProvider: extractAmazonBook,
      variant: "amazon"
    });
  }
})();
