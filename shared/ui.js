(() => {
  "use strict";

  const NS = globalThis.FindOnRomanceIO ?? {};
  const BUTTON_ID = "find-on-romance-io-extension-button";
  const WRAPPER_ID = "find-on-romance-io-extension-wrapper";
  const STYLE_ID = "find-on-romance-io-extension-style";

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${WRAPPER_ID} {
        box-sizing: border-box;
        display: block;
        width: 100%;
        margin: 0 0 14px 0;
        padding: 0;
        position: relative;
        z-index: 2;
      }

      /* Default / fallback button styling */
      #${BUTTON_ID} {
        appearance: none;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        min-height: 44px;
        padding: 10px 16px;
        border: 1px solid #DD0489;
        border-radius: 30px;
        background: #DD0489;
        color: #FFFFFF !important;
        font: 700 15px/1.25 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        letter-spacing: 0;
        text-align: center;
        text-decoration: none !important;
        cursor: pointer;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.18);
        transition: background-color 120ms ease, border-color 120ms ease,
          box-shadow 120ms ease, transform 120ms ease;
      }
      #${BUTTON_ID}:hover {
        background: #BE0376;
        border-color: #BE0376;
        color: #FFFFFF !important;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.22);
      }
      #${BUTTON_ID}:active {
        transform: translateY(1px);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.18);
      }
      #${BUTTON_ID}:focus-visible {
        outline: 3px solid rgba(221, 4, 137, 0.35);
        outline-offset: 2px;
      }
      #${BUTTON_ID}[aria-busy="true"] {
        cursor: progress;
        opacity: 0.82;
      }

      /* Amazon */
      #${WRAPPER_ID}.find-on-romance-io--amazon {
        margin: 8px 0 12px;
        padding: 0;
      }
      #${WRAPPER_ID}.find-on-romance-io--amazon #${BUTTON_ID} {
        min-height: 31px;
        padding: 0 10px;
        border: 1px solid #DD0489;
        border-radius: 100px;
        background: #DD0489;
        color: #FFFFFF !important;
        font: 700 13px/29px Arial, sans-serif;
        box-shadow: none;
      }
      #${WRAPPER_ID}.find-on-romance-io--amazon #${BUTTON_ID}:hover {
        background: #BE0376;
        border-color: #BE0376;
        color: #FFFFFF !important;
        box-shadow: none;
      }
      #${WRAPPER_ID}.find-on-romance-io--amazon #${BUTTON_ID}:active {
        transform: none;
        background: #BE0376;
        box-shadow: none;
      }

      /* Audible */
      #${WRAPPER_ID}.find-on-romance-io--audible {
        margin: 0;
        padding: 0;
      }
      #${WRAPPER_ID}.find-on-romance-io--audible #${BUTTON_ID} {
        appearance: none;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        min-height: 42px;
        padding: 0 24px;
        border: 2px solid #DD0489;
        border-radius: 999px;
        background: #DD0489;
        color: #FFFFFF !important;
        font: 700 16px/1.25 "Audible Sans", Arial, Helvetica, sans-serif;
        text-align: center;
        cursor: pointer;
        box-shadow: none;
        transform: none;
      }
      #${WRAPPER_ID}.find-on-romance-io--audible #${BUTTON_ID}:hover {
        background: #BE0376;
        border-color: #BE0376;
        color: #FFFFFF !important;
        box-shadow: none;
      }

      /* Goodreads */
      #${WRAPPER_ID}.find-on-romance-io--goodreads {
        margin: 0;
      }
      #${WRAPPER_ID}.find-on-romance-io--goodreads .find-on-romance-io-goodreads-button {
        background: #DD0489 !important;
        border-color: #DD0489 !important;
        color: #FFFFFF !important;
        text-decoration: none !important;
      }
      #${WRAPPER_ID}.find-on-romance-io--goodreads .find-on-romance-io-goodreads-button:hover {
        background: #BE0376 !important;
        border-color: #BE0376 !important;
        color: #FFFFFF !important;
      }
      #${WRAPPER_ID}.find-on-romance-io--goodreads .find-on-romance-io-goodreads-button:focus-visible {
        outline: 3px solid rgba(221, 4, 137, 0.35);
        outline-offset: 2px;
      }
      #${WRAPPER_ID}.find-on-romance-io--goodreads .find-on-romance-io-goodreads-button[aria-busy="true"] {
        cursor: progress;
        opacity: 0.82;
      }

      /* Smashwords */
      #${WRAPPER_ID}.find-on-romance-io--smashwords {
        display: inline-block;
        width: auto;
        margin: 12px 0;
      }
      #${WRAPPER_ID}.find-on-romance-io--smashwords #${BUTTON_ID} {
        display: inline-block;
        width: auto;
        min-height: 29px;
        padding: 4px 8px;
        border: 1px solid #DD0489;
        border-radius: 3px;
        background: #DD0489;
        color: #FFFFFF !important;
        font: 700 12.6px/18.9px Arial, "Helvetica Neue", Helvetica, sans-serif;
        box-shadow: none;
      }
      #${WRAPPER_ID}.find-on-romance-io--smashwords #${BUTTON_ID}:hover {
        background: #BE0376;
        border-color: #BE0376;
        box-shadow: none;
      }
      #${WRAPPER_ID}.find-on-romance-io--smashwords #${BUTTON_ID}:active {
        transform: none;
      }

      /* Kobo */
      #${WRAPPER_ID}.find-on-romance-io--kobo {
        margin: 12px auto 0;
        width: 188px;
        max-width: 100%;
      }
      #${WRAPPER_ID}.find-on-romance-io--kobo #${BUTTON_ID} {
        display: block;
        width: 100%;
        min-height: 35px;
        padding: 5px 7px;
        border: 3px solid #DD0489;
        border-radius: 0;
        background: #DD0489;
        color: #FFFFFF !important;
        font: 700 14px/normal "Trebuchet MS", Trebuchet, Arial, sans-serif;
        box-shadow: none;
      }
      #${WRAPPER_ID}.find-on-romance-io--kobo #${BUTTON_ID}:hover {
        background: #BE0376;
        border-color: #BE0376;
        box-shadow: none;
      }
      #${WRAPPER_ID}.find-on-romance-io--kobo #${BUTTON_ID}:active {
        transform: none;
      }

      /* StoryGraph */
      #${WRAPPER_ID}.find-on-romance-io--storygraph {
        margin: 12px 0 0;
      }
      #${WRAPPER_ID}.find-on-romance-io--storygraph #${BUTTON_ID} {
        display: inline-block;
        width: 100%;
        min-height: 36px;
        padding: 8px 16px;
        border: 2px solid #DD0489;
        border-radius: 2px;
        background: #DD0489;
        color: #FFFFFF !important;
        font: 600 12px/16px Poppins, sans-serif;
        text-align: center;
        box-shadow: none;
      }
      #${WRAPPER_ID}.find-on-romance-io--storygraph #${BUTTON_ID}:hover {
        background: #BE0376;
        border-color: #BE0376;
        box-shadow: none;
      }
      #${WRAPPER_ID}.find-on-romance-io--storygraph #${BUTTON_ID}:active {
        transform: none;
      }

      /* Barnes & Noble */
      #${WRAPPER_ID}.find-on-romance-io--barnesandnoble {
        margin: 12px auto 0;
        width: 100%;
        display: flex;
        justify-content: center;
      }
      #${WRAPPER_ID}.find-on-romance-io--barnesandnoble #${BUTTON_ID} {
        min-height: 48px;
        max-width: 240px;
        padding: 12px 20px;
        margin: 0;
        border: 1px solid #DD0489;
        border-radius: 0;
        background: #DD0489;
        color: #FFFFFF !important;
        font: 700 14px/20px Arial, Helvetica, sans-serif;
        box-shadow: none;
        transform: none;
      }
      #${WRAPPER_ID}.find-on-romance-io--barnesandnoble #${BUTTON_ID}:hover {
        background: #BE0376;
        border-color: #BE0376;
        box-shadow: none;
      }

      /* Bookshop.org */
      #${WRAPPER_ID}.find-on-romance-io--bookshop {
        margin: 12px 0 0;
      }
      #${WRAPPER_ID}.find-on-romance-io--bookshop #${BUTTON_ID} {
        min-height: 52px;
        padding: 16px;
        border: 1px solid #DD0489;
        border-radius: 999px;
        background: #DD0489;
        color: #FFFFFF !important;
        font: 700 14px/20px Arial, Helvetica, sans-serif;
        text-transform: uppercase;
        box-shadow: none;
        transform: none;
      }
      #${WRAPPER_ID}.find-on-romance-io--bookshop #${BUTTON_ID}:hover {
        background: #BE0376;
        border-color: #BE0376;
        box-shadow: none;
      }

      /* eBooks.com */
      #${WRAPPER_ID}.find-on-romance-io--ebooks {
        margin: 14px 0 0;
      }
      #${WRAPPER_ID}.find-on-romance-io--ebooks #${BUTTON_ID} {
        min-height: 38px;
        padding: 8px 12px;
        border: 1px solid #DD0489;
        border-radius: 9px;
        background: #DD0489;
        color: #FFFFFF !important;
        font: 700 14px/20px "Helvetica Neue", Helvetica, Arial, sans-serif;
        box-shadow: none;
        transform: none;
      }
      #${WRAPPER_ID}.find-on-romance-io--ebooks #${BUTTON_ID}:hover {
        background: #BE0376;
        border-color: #BE0376;
        box-shadow: none;
      }
    `;
    document.documentElement.append(style);
  }

  function attachClickHandler(button, bookProvider) {
    function isExtensionContextError(error) {
      return String(error?.message ?? error).includes("Extension context invalidated");
    }

    button.addEventListener("click", async () => {
      if (button.getAttribute("aria-busy") === "true") return;
      button.setAttribute("aria-busy", "true");
      const originalText = button.textContent;
      button.textContent = "Opening Romance.io…";

      try {
        const book = await bookProvider();
        if (!book?.rawTitle || !book?.authors?.length) {
          throw new Error("Could not identify both the title and author on this page.");
        }

        const enriched = {
          ...book,
          coreTitle: book.coreTitle || NS.getCoreTitle(book.rawTitle),
          sourceUrl: location.href
        };
        const lookupId = await NS.saveLookup(enriched);
        const searchUrl = NS.createSearchUrl(enriched, lookupId);
        NS.debugLog?.("source metadata", {
          source: enriched.source,
          sourceUrl: enriched.sourceUrl,
          rawTitle: enriched.rawTitle,
          titleParts: enriched.titleParts ?? NS.extractTitleParts(enriched.rawTitle),
          coreTitle: enriched.coreTitle,
          authors: enriched.authors,
          identifiers: {
            amazonAsin: enriched.amazonAsin,
            audibleAsin: enriched.audibleAsin,
            barnesAndNobleId: enriched.barnesAndNobleId,
            bookshopId: enriched.bookshopId,
            ebooksId: enriched.ebooksId,
            goodreadsId: enriched.goodreadsId,
            koboId: enriched.koboId,
            smashwordsId: enriched.smashwordsId,
            storygraphId: enriched.storygraphId,
            isbn: enriched.isbn
          },
          lookupId,
          searchUrl
        });
        window.open(searchUrl, "_blank", "noopener,noreferrer");
      } catch (error) {
        if (isExtensionContextError(error)) {
          console.warn("Find on Romance.io: extension was reloaded; refresh this page to use the updated extension.");
          button.textContent = "Refresh page to use extension";
          button.title = "The extension was reloaded after this page opened. Refresh the page and try again.";
        } else {
          console.error("Find on Romance.io:", error);
          button.textContent = "Couldn’t identify this book";
          button.title = error instanceof Error ? error.message : String(error);
        }
        setTimeout(() => {
          button.textContent = originalText;
          button.removeAttribute("aria-busy");
        }, 2600);
        return;
      }

      button.textContent = originalText;
      button.removeAttribute("aria-busy");
    });
  }

  function buildDefaultButton(bookProvider) {
    const wrapper = document.createElement("div");
    wrapper.id = WRAPPER_ID;

    const button = document.createElement("button");
    button.id = BUTTON_ID;
    button.type = "button";
    button.textContent = "Find on Romance.io";
    button.setAttribute("aria-label", "Find this book on Romance.io");

    attachClickHandler(button, bookProvider);
    wrapper.append(button);
    return wrapper;
  }

  function buildAmazonButton(bookProvider) {
    const wrapper = buildDefaultButton(bookProvider);
    wrapper.classList.add("find-on-romance-io--amazon");
    return wrapper;
  }

  function buildGoodreadsButton(container, bookProvider) {
    const sampleContainer = container.querySelector(':scope > .Button__container, :scope > [class*="Button__container"]');
    const sampleButton = sampleContainer?.querySelector('button, a[role="button"], .Button') ||
      container.querySelector('button, a[role="button"], .Button');

    const wrapper = document.createElement("div");
    wrapper.id = WRAPPER_ID;
    wrapper.classList.add("find-on-romance-io--goodreads");
    wrapper.className += sampleContainer?.className
      ? ` ${sampleContainer.className}`
      : " Button__container Button__container--block";

    const button = document.createElement("button");
    button.id = BUTTON_ID;
    button.type = "button";
    button.textContent = "Find on Romance.io";
    button.setAttribute("aria-label", "Find this book on Romance.io");
    button.className = sampleButton?.className
      ? `${sampleButton.className} find-on-romance-io-goodreads-button`
      : "Button Button--medium Button--block find-on-romance-io-goodreads-button";

    attachClickHandler(button, bookProvider);
    wrapper.append(button);
    return wrapper;
  }

  function buildAudibleButton(bookProvider) {
    const wrapper = buildDefaultButton(bookProvider);
    wrapper.className = "bc-row bc-spacing-top-s1 find-on-romance-io--audible";

    const button = wrapper.querySelector(`#${BUTTON_ID}`);
    button.className = "mosaic-buybox-button find-on-romance-io-audible-button";
    return wrapper;
  }

  function buildKoboButton(bookProvider) {
    const wrapper = buildDefaultButton(bookProvider);
    wrapper.classList.add("find-on-romance-io--kobo");

    const button = wrapper.querySelector(`#${BUTTON_ID}`);
    button.className = "purchase-action buy-now find-on-romance-io-kobo-button";
    return wrapper;
  }

  function buildSmashwordsButton(bookProvider) {
    const wrapper = buildDefaultButton(bookProvider);
    wrapper.classList.add("find-on-romance-io--smashwords");

    const button = wrapper.querySelector(`#${BUTTON_ID}`);
    button.className = "btn btn-outline-secondary btn-sm find-on-romance-io-smashwords-button";
    return wrapper;
  }

  function buildBarnesAndNobleButton(bookProvider) {
    const wrapper = buildDefaultButton(bookProvider);
    wrapper.classList.add("find-on-romance-io--barnesandnoble");

    const button = wrapper.querySelector(`#${BUTTON_ID}`);
    button.className = "btn btn--primary w-full lg:w-[240px] find-on-romance-io-barnesandnoble-button";
    return wrapper;
  }

  function buildBookshopButton(bookProvider) {
    const wrapper = buildDefaultButton(bookProvider);
    wrapper.classList.add("find-on-romance-io--bookshop");

    const button = wrapper.querySelector(`#${BUTTON_ID}`);
    button.className = "flex w-full cursor-pointer items-center justify-center gap-2 rounded-full px-4 py-4 text-sm font-bold uppercase tracking-wider text-white find-on-romance-io-bookshop-button";
    return wrapper;
  }

  function buildEbooksButton(bookProvider) {
    const wrapper = buildDefaultButton(bookProvider);
    wrapper.classList.add("find-on-romance-io--ebooks");

    const button = wrapper.querySelector(`#${BUTTON_ID}`);
    button.className = "btn btn-primary btn-block find-on-romance-io-ebooks-button";
    return wrapper;
  }

  function buildVariantButton(bookProvider, variant) {
    const wrapper = buildDefaultButton(bookProvider);
    wrapper.classList.add(`find-on-romance-io--${variant}`);
    return wrapper;
  }

  function makeButton(bookProvider, options = {}) {
    installStyles();
    const variant = options.variant || "default";
    if (variant === "amazon") return buildAmazonButton(bookProvider);
    if (variant === "goodreads") return buildGoodreadsButton(options.container, bookProvider);
    if (variant === "audible") return buildAudibleButton(bookProvider);
    if (variant === "kobo") return buildKoboButton(bookProvider);
    if (variant === "smashwords") return buildSmashwordsButton(bookProvider);
    if (variant === "barnesandnoble") return buildBarnesAndNobleButton(bookProvider);
    if (variant === "bookshop") return buildBookshopButton(bookProvider);
    if (variant === "ebooks") return buildEbooksButton(bookProvider);
    if (variant === "storygraph") return buildVariantButton(bookProvider, variant);
    return buildDefaultButton(bookProvider);
  }

  function insertButton({ container, position = "prepend", bookProvider, variant = "default" }) {
    if (!container || document.getElementById(BUTTON_ID)) return false;
    const wrapper = makeButton(bookProvider, { variant, container });
    if (position === "after") {
      container.insertAdjacentElement("afterend", wrapper);
    } else if (position === "before") {
      container.insertAdjacentElement("beforebegin", wrapper);
    } else if (position === "append") {
      container.append(wrapper);
    } else {
      container.prepend(wrapper);
    }
    return true;
  }

  function waitForElement(selectors, timeoutMs = 12000) {
    const selectorList = Array.isArray(selectors) ? selectors : [selectors];
    const find = () => selectorList.map((selector) => document.querySelector(selector)).find(Boolean);
    const immediate = find();
    if (immediate) return Promise.resolve(immediate);

    return new Promise((resolve) => {
      const observer = new MutationObserver(() => {
        const element = find();
        if (element) {
          observer.disconnect();
          clearTimeout(timer);
          resolve(element);
        }
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
      const timer = setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeoutMs);
    });
  }

  Object.assign(NS, { insertButton, waitForElement });
  globalThis.FindOnRomanceIO = NS;
})();
