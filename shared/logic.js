(() => {
  "use strict";

  const NS = globalThis.FindOnRomanceIO ?? {};

  const TITLE_STOP_WORDS = new Set([
    "a", "an", "and", "at", "by", "for", "from", "in", "into", "of", "on",
    "or", "the", "to", "with"
  ]);

  const SUBTITLE_MARKERS = [
    "a romance", "an mm", "a mm", "mm romance", "m m romance", "mpreg",
    "omegaverse", "paranormal romance", "shifter romance", "human shifter",
    "secret baby", "fated mate", "rejected mate", "dark romance",
    "enemies to lovers", "friends to lovers", "age gap", "sports romance",
    "hockey romance", "gay romance", "lgbtq romance", "romantic suspense",
    "standalone romance", "a novel", "unabridged", "audiobook"
  ];

  function cleanWhitespace(value) {
    return String(value ?? "").replace(/\s+/g, " ").trim();
  }

  function normalize(value) {
    return cleanWhitespace(value)
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[’'`]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .replace(/\s+/g, " ");
  }

  function compactInitials(value) {
    return cleanWhitespace(value)
      .replace(/\b((?:[A-Za-z]\.\s*){2,})/g, (match) =>
        `${match.replace(/[^A-Za-z]/g, "")} `
      )
      .trim()
      .replace(/\s+/g, " ");
  }

  function meaningfulTokens(value) {
    return normalize(value)
      .split(" ")
      .filter((token) => token.length > 0 && !TITLE_STOP_WORDS.has(token));
  }

  function unique(values) {
    return [...new Set(values.filter(Boolean))];
  }

  function looksLikeSubtitle(suffix) {
    const normalizedSuffix = normalize(suffix);
    return SUBTITLE_MARKERS.some((marker) => normalizedSuffix.includes(normalize(marker))) ||
      /\b(?:book|series|duet|trilogy|saga|chronicles)\s*\d*\b/i.test(suffix);
  }

  function getCoreTitle(rawTitle) {
    let title = cleanWhitespace(rawTitle)
      .replace(/^\s*(?:audiobook|kindle edition)\s*[:–—-]\s*/i, "")
      .replace(/\s*\[(?:unabridged|audiobook|audio)\]\s*$/i, "")
      .trim();

    // Retailer titles often end with series, edition, or marketing details.
    let previous;
    do {
      previous = title;
      title = title.replace(/\s*\([^()]+\)\s*$/u, "").trim();
    } while (title !== previous);

    const colonIndex = title.indexOf(":");
    if (colonIndex > 0) {
      title = title.slice(0, colonIndex).trim();
    } else {
      const dashMatch = title.match(/\s+[–—-]\s+(.+)$/u);
      if (dashMatch && looksLikeSubtitle(dashMatch[1])) {
        title = title.slice(0, dashMatch.index).trim();
      }
    }

    return title || cleanWhitespace(rawTitle);
  }

  function authorTokens(author) {
    return normalize(author)
      .split(" ")
      .filter((token) => token.length > 0);
  }

  function authorAppearsInText(author, text) {
    const authorVariants = unique([
      normalize(author),
      normalize(compactInitials(author))
    ]);
    const textVariants = unique([
      normalize(text),
      normalize(compactInitials(text))
    ]);
    if (!authorVariants.length || !textVariants.length) return false;
    if (authorVariants.some((authorValue) =>
      textVariants.some((textValue) => textValue.includes(authorValue))
    )) {
      return true;
    }

    const tokens = unique(authorVariants.flatMap((authorValue) =>
      authorValue.split(" ").filter((token) => token.length > 0)
    ));
    if (tokens.length === 1) {
      return textVariants.some((textValue) =>
        new RegExp(`(?:^| )${escapeRegExp(tokens[0])}(?: |$)`).test(textValue)
      );
    }

    return textVariants.some((textValue) =>
      tokens.every((token) =>
        new RegExp(`(?:^| )${escapeRegExp(token)}(?: |$)`).test(textValue)
      )
    );
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function orderedCoverage(sourceTokens, candidateTokens) {
    if (!sourceTokens.length || !candidateTokens.length) return 0;
    let sourceIndex = 0;
    let matched = 0;
    for (const token of candidateTokens) {
      if (token === sourceTokens[sourceIndex]) {
        matched += 1;
        sourceIndex += 1;
        if (sourceIndex >= sourceTokens.length) break;
      }
    }
    return matched / sourceTokens.length;
  }

  function setCoverage(sourceTokens, candidateTokens) {
    if (!sourceTokens.length || !candidateTokens.length) return 0;
    const candidateSet = new Set(candidateTokens);
    const matches = sourceTokens.filter((token) => candidateSet.has(token)).length;
    return matches / sourceTokens.length;
  }

  function scoreCandidate(book, candidate) {
    const coreTitle = normalize(book.coreTitle || getCoreTitle(book.rawTitle));
    const rawTitle = normalize(book.rawTitle);
    const candidateTitle = normalize(candidate.title);
    const candidateContext = normalize([
      candidate.title,
      candidate.contextText,
      candidate.slug
    ].filter(Boolean).join(" "));

    if (!coreTitle || !candidateContext) {
      return { score: 0, authorMatched: false, reasons: ["missing title data"] };
    }

    const authors = Array.isArray(book.authors) ? book.authors.filter(Boolean) : [];
    const authorMatched = authors.length > 0 && authors.some((author) =>
      authorAppearsInText(author, candidateContext)
    );

    // Require author evidence before redirecting from generic title matches.
    if (!authorMatched) {
      return { score: 0, authorMatched: false, reasons: ["author did not match"] };
    }

    let titleScore = 0;
    const reasons = ["author matched"];

    if (candidateTitle === coreTitle) {
      titleScore = 0.74;
      reasons.push("exact core title");
    } else if (
      candidateTitle.startsWith(`${coreTitle} `) ||
      coreTitle.startsWith(`${candidateTitle} `) ||
      candidateContext.startsWith(`${coreTitle} `)
    ) {
      titleScore = 0.59;
      reasons.push("core title prefix");
    } else if (candidateContext.includes(coreTitle)) {
      titleScore = 0.54;
      reasons.push("core title contained in result");
    } else {
      const sourceTokens = meaningfulTokens(coreTitle);
      const candidateTokens = meaningfulTokens(candidateTitle || candidateContext);
      const coverage = setCoverage(sourceTokens, candidateTokens);
      const ordered = orderedCoverage(sourceTokens, candidateTokens);
      titleScore = Math.min(0.64, (coverage * 0.46) + (ordered * 0.18));
      reasons.push(`title token coverage ${coverage.toFixed(2)}`);
    }

    const rawTokens = meaningfulTokens(rawTitle);
    const contextTokens = meaningfulTokens(candidateContext);
    const fullTitleBonus = Math.min(0.08, setCoverage(rawTokens, contextTokens) * 0.08);
    const score = Math.min(1, titleScore + 0.24 + fullTitleBonus);

    return {
      score,
      authorMatched: true,
      reasons
    };
  }

  function pickBestMatch(book, candidates, options = {}) {
    const threshold = options.threshold ?? 0.90;
    const minimumLead = options.minimumLead ?? 0.08;

    // A result must be both strong and clearly ahead of alternatives before the
    // extension redirects away from the search results page.
    const ranked = candidates
      .map((candidate) => ({
        ...candidate,
        ...scoreCandidate(book, candidate)
      }))
      .sort((a, b) => b.score - a.score);

    const best = ranked[0] ?? null;
    const second = ranked[1] ?? null;
    const lead = best ? best.score - (second?.score ?? 0) : 0;
    const confident = Boolean(
      best &&
      best.score >= threshold &&
      (ranked.length === 1 || lead >= minimumLead)
    );

    return { confident, best, second, lead, ranked };
  }

  function createSearchUrl(book, lookupId) {
    const query = normalize(compactInitials([
      book.coreTitle || getCoreTitle(book.rawTitle),
      ...(book.authors ?? [])
    ].join(" ")));
    const url = new URL("https://www.romance.io/search");
    url.searchParams.set("q", query);
    if (lookupId) {
      // The hash keeps lookup IDs out of the server request while still making
      // them available to the Romance.io content script.
      url.hash = `find-on-romance-io=${encodeURIComponent(lookupId)}`;
    }
    return url.toString();
  }

  function createBookRecord({ source, rawTitle, authors, identifiers = {}, structured = null }) {
    const cleanedTitle = cleanWhitespace(rawTitle);
    return {
      source,
      rawTitle: cleanedTitle,
      coreTitle: getCoreTitle(cleanedTitle),
      authors: unique(authors ?? []),
      ...identifiers,
      isbn: cleanWhitespace(identifiers.isbn || structured?.isbn || "")
    };
  }

  function parseJsonLd() {
    const scripts = [...document.querySelectorAll('script[type="application/ld+json"]')];
    const values = [];
    for (const script of scripts) {
      try {
        values.push(JSON.parse(script.textContent));
      } catch {
        // Ignore malformed JSON-LD and continue through visible-DOM fallbacks.
      }
    }
    return values;
  }

  function walkJson(value, visitor) {
    if (Array.isArray(value)) {
      for (const item of value) walkJson(item, visitor);
      return;
    }
    if (!value || typeof value !== "object") return;
    visitor(value);
    for (const child of Object.values(value)) walkJson(child, visitor);
  }

  function extractStructuredBook() {
    const found = [];
    for (const root of parseJsonLd()) {
      walkJson(root, (node) => {
        const types = Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]];
        const relevant = types.some((type) =>
          ["Book", "Audiobook", "Product", "CreativeWork"].includes(type)
        );
        if (!relevant || !node.name) return;

        const authorValue = node.author ?? node.creator;
        const authorList = Array.isArray(authorValue) ? authorValue : [authorValue];
        const authors = authorList
          .map((author) => typeof author === "string" ? author : author?.name)
          .map(cleanWhitespace)
          .filter(Boolean);

        found.push({
          title: cleanWhitespace(node.name),
          authors,
          isbn: cleanWhitespace(node.isbn || node.gtin13),
          sku: cleanWhitespace(node.sku)
        });
      });
    }

    const ranked = found.sort((a, b) => {
      const score = (item) =>
        Number(Boolean(item.title)) +
        (Number(item.authors.length > 0) * 4) +
        Number(Boolean(item.isbn)) +
        Number(Boolean(item.sku));
      return score(b) - score(a);
    });
    const best = ranked[0] ?? null;
    if (!best) return null;

    const compatible = ranked.find((item) =>
      item !== best &&
      normalize(item.title) === normalize(best.title) &&
      (item.isbn || item.sku)
    );

    return {
      ...best,
      isbn: best.isbn || compatible?.isbn || "",
      sku: best.sku || compatible?.sku || ""
    };
  }

  function textFrom(selectors, root = document) {
    for (const selector of selectors) {
      const element = root.querySelector(selector);
      const value = cleanWhitespace(element?.textContent);
      if (value) return value;
    }
    return "";
  }

  function textsFrom(selectors, root = document) {
    const values = [];
    for (const selector of selectors) {
      for (const element of root.querySelectorAll(selector)) {
        const value = cleanWhitespace(element.textContent);
        if (value) values.push(value);
      }
    }
    return unique(values);
  }

  Object.assign(NS, {
    cleanWhitespace,
    normalize,
    compactInitials,
    meaningfulTokens,
    unique,
    getCoreTitle,
    authorAppearsInText,
    scoreCandidate,
    pickBestMatch,
    createSearchUrl,
    createBookRecord,
    extractStructuredBook,
    textFrom,
    textsFrom
  });

  globalThis.FindOnRomanceIO = NS;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = NS;
  }
})();
