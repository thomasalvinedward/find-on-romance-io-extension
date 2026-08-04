(() => {
  "use strict";

  const RIO = globalThis.FindOnRomanceIO;
  const SITE_LABELS = [
    ["amazon", "Amazon"],
    ["audible", "Audible"],
    ["barnesandnoble", "Barnes & Noble"],
    ["bookshop", "Bookshop.org"],
    ["ebooks", "eBooks.com"],
    ["goodreads", "Goodreads"],
    ["kobo", "Kobo"],
    ["smashwords", "Smashwords"],
    ["storygraph", "StoryGraph"]
  ];

  const status = document.getElementById("status");
  const version = document.getElementById("version");
  const buttonSettings = document.getElementById("button-settings");
  const siteOptions = document.getElementById("site-options");
  let settings = null;
  let statusTimer = null;

  function searchButtonIsEnabled() {
    return Object.values(settings.buttons).some((enabled) => enabled !== false);
  }

  function showStatus(message) {
    status.textContent = message;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => {
      status.textContent = "";
    }, 1400);
  }

  function createToggle({ label, setting, checked }) {
    const row = document.createElement("label");
    row.className = "toggle-row";

    const labelText = document.createElement("span");
    labelText.className = "toggle-label";
    labelText.textContent = label;

    const input = document.createElement("input");
    input.type = "checkbox";
    input.dataset.setting = setting;
    input.checked = checked;

    const switchTrack = document.createElement("span");
    switchTrack.className = "switch";
    switchTrack.setAttribute("aria-hidden", "true");

    row.append(labelText, input, switchTrack);
    return row;
  }

  function createSiteCheckbox({ label, setting, checked }) {
    const row = document.createElement("label");
    row.className = "site-checkbox";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.dataset.setting = setting;
    input.checked = checked;

    const labelText = document.createElement("span");
    labelText.textContent = label;

    row.append(input, labelText);
    return row;
  }

  function updateSearchButtonView() {
    const enabled = searchButtonIsEnabled();
    document.querySelector("[data-setting='searchButton']").checked = enabled;
    siteOptions.hidden = !enabled;
  }

  function setAllButtons(enabled) {
    for (const source of Object.keys(settings.buttons)) {
      settings.buttons[source] = enabled;
    }
    for (const input of buttonSettings.querySelectorAll("input[data-setting^='buttons.']")) {
      input.checked = enabled;
    }
  }

  async function saveChangedSetting(path, checked) {
    if (path === "contextMenu") {
      settings.contextMenu = checked;
    } else if (path === "autoOpenBestMatch") {
      settings.autoOpenBestMatch = checked;
    } else if (path === "searchButton") {
      setAllButtons(checked);
    } else if (path.startsWith("buttons.")) {
      const source = path.slice("buttons.".length);
      settings.buttons[source] = checked;
    }

    settings = await RIO.saveSettings(settings);
    updateSearchButtonView();
    showStatus("Saved");
  }

  async function init() {
    settings = await RIO.getSettings();
    version.textContent = `v${chrome.runtime.getManifest().version}`;

    for (const [source, label] of SITE_LABELS) {
      buttonSettings.append(
        createSiteCheckbox({
          label,
          setting: `buttons.${source}`,
          checked: settings.buttons[source] !== false
        })
      );
    }

    document
      .querySelector("[data-setting='contextMenu']")
      .checked = settings.contextMenu !== false;
    document
      .querySelector("[data-setting='autoOpenBestMatch']")
      .checked = settings.autoOpenBestMatch !== false;
    updateSearchButtonView();

    document.addEventListener("change", async (event) => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement) || !input.dataset.setting) return;

      try {
        await saveChangedSetting(input.dataset.setting, input.checked);
      } catch (error) {
        console.error("Find on Romance.io: failed to save settings", error);
        showStatus("Error");
        input.checked = !input.checked;
      }
    });
  }

  init().catch((error) => {
    console.error("Find on Romance.io: failed to initialize popup", error);
    showStatus("Error");
  });
})();
