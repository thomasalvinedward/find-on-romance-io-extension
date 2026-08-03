(() => {
  "use strict";

  const NS = globalThis.FindOnRomanceIO ?? {};
  const PREFIX = "findOnRomanceIo.lookup.";
  const SETTINGS_KEY = "findOnRomanceIo.settings";
  const MAX_AGE_MS = 60 * 60 * 1000;
  const DEFAULT_SETTINGS = Object.freeze({
    buttons: Object.freeze({
      amazon: true,
      audible: true,
      barnesandnoble: true,
      bookshop: true,
      ebooks: true,
      goodreads: true,
      kobo: true,
      smashwords: true,
      storygraph: true
    }),
    contextMenu: true
  });

  function normalizeSettings(settings) {
    const buttons = settings?.buttons ?? {};
    return {
      buttons: Object.fromEntries(
        Object.entries(DEFAULT_SETTINGS.buttons).map(([source, defaultValue]) => [
          source,
          buttons[source] ?? defaultValue
        ])
      ),
      contextMenu: settings?.contextMenu ?? DEFAULT_SETTINGS.contextMenu
    };
  }

  // Lookup records carry retailer page metadata to the Romance.io search tab.
  // They are short-lived and removed after matching succeeds, fails, or expires.
  async function pruneLookups() {
    const all = await chrome.storage.local.get(null);
    const now = Date.now();
    const staleKeys = Object.entries(all)
      .filter(([key, value]) =>
        key.startsWith(PREFIX) &&
        (!value?.createdAt || now - value.createdAt > MAX_AGE_MS)
      )
      .map(([key]) => key);

    if (staleKeys.length) {
      await chrome.storage.local.remove(staleKeys);
    }
  }

  async function saveLookup(book) {
    await pruneLookups();
    const id = crypto.randomUUID();
    await chrome.storage.local.set({
      [`${PREFIX}${id}`]: {
        ...book,
        createdAt: Date.now()
      }
    });
    return id;
  }

  async function getLookup(id) {
    if (!id) return null;
    const key = `${PREFIX}${id}`;
    const result = await chrome.storage.local.get(key);
    return result[key] ?? null;
  }

  async function removeLookup(id) {
    if (id) await chrome.storage.local.remove(`${PREFIX}${id}`);
  }

  async function getSettings() {
    const result = await chrome.storage.local.get(SETTINGS_KEY);
    return normalizeSettings(result[SETTINGS_KEY]);
  }

  async function saveSettings(settings) {
    const normalized = normalizeSettings(settings);
    await chrome.storage.local.set({ [SETTINGS_KEY]: normalized });
    return normalized;
  }

  async function isButtonEnabled(source) {
    const settings = await getSettings();
    return settings.buttons[source] !== false;
  }

  Object.assign(NS, {
    DEFAULT_SETTINGS,
    SETTINGS_KEY,
    getSettings,
    saveSettings,
    isButtonEnabled,
    saveLookup,
    getLookup,
    removeLookup,
    pruneLookups
  });
  globalThis.FindOnRomanceIO = NS;
})();
