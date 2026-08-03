(() => {
  "use strict";

  const MENU_ID = "find-on-romance-io-selection";
  const SETTINGS_KEY = "findOnRomanceIo.settings";
  const MAX_QUERY_LENGTH = 300;
  const DEFAULT_SETTINGS = Object.freeze({
    contextMenu: true
  });

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

  async function getSettings() {
    const result = await chrome.storage.local.get(SETTINGS_KEY);
    return {
      contextMenu: result[SETTINGS_KEY]?.contextMenu ?? DEFAULT_SETTINGS.contextMenu
    };
  }

  async function isContextMenuEnabled() {
    const settings = await getSettings();
    return settings.contextMenu !== false;
  }

  async function syncContextMenu() {
    const enabled = await isContextMenuEnabled();
    chrome.contextMenus.removeAll(() => {
      if (enabled) createContextMenu();
    });
  }

  // Recreate the menu during extension lifecycle events so the registered title
  // and contexts always match this version of the extension.
  chrome.runtime.onInstalled.addListener(() => {
    syncContextMenu();
  });

  chrome.runtime.onStartup.addListener(() => {
    syncContextMenu();
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes[SETTINGS_KEY]) syncContextMenu();
  });

  chrome.contextMenus.onClicked.addListener(async (info) => {
    if (info.menuItemId !== MENU_ID) return;
    if (!(await isContextMenuEnabled())) return;

    const query = cleanWhitespace(info.selectionText);
    if (!query) return;

    chrome.tabs.create({
      url: createSelectionSearchUrl(query)
    });
  });
})();
