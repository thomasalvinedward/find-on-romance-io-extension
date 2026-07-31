(() => {
  "use strict";

  const NS = globalThis.FindOnRomanceIO ?? {};
  const PREFIX = "findOnRomanceIo.lookup.";
  const MAX_AGE_MS = 60 * 60 * 1000;

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

  Object.assign(NS, { saveLookup, getLookup, removeLookup, pruneLookups });
  globalThis.FindOnRomanceIO = NS;
})();
