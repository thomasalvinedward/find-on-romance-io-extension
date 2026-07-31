(() => {
  "use strict";

  const MENU_ID = "find-on-romance-io-selection";
  const MAX_QUERY_LENGTH = 300;

  // Selected-text searches are plain Romance.io searches. They do not create a
  // lookup record because highlighted text has no reliable title/author split.
  function cleanWhitespace(value) {
    return String(value ?? "").replace(/\s+/g, " ").trim();
  }

  function createSelectionSearchUrl(selectionText) {
    const query = cleanWhitespace(selectionText).slice(0, MAX_QUERY_LENGTH);
    const url = new URL("https://www.romance.io/search");
    url.searchParams.set("q", query);
    return url.toString();
  }

  function createContextMenu() {
    chrome.contextMenus.create({
      id: MENU_ID,
      title: "Search Romance.io for \"%s\"",
      contexts: ["selection"]
    });
  }

  // Recreate the menu during extension lifecycle events so the registered title
  // and contexts always match this version of the extension.
  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.removeAll(createContextMenu);
  });

  chrome.runtime.onStartup.addListener(() => {
    chrome.contextMenus.removeAll(createContextMenu);
  });

  chrome.contextMenus.onClicked.addListener((info) => {
    if (info.menuItemId !== MENU_ID) return;

    const query = cleanWhitespace(info.selectionText);
    if (!query) return;

    chrome.tabs.create({
      url: createSelectionSearchUrl(query)
    });
  });
})();
