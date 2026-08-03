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
  const buttonSettings = document.getElementById("button-settings");
  let settings = null;
  let statusTimer = null;

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

  async function saveChangedSetting(path, checked) {
    if (path === "contextMenu") {
      settings.contextMenu = checked;
    } else if (path.startsWith("buttons.")) {
      const source = path.slice("buttons.".length);
      settings.buttons[source] = checked;
    }

    settings = await RIO.saveSettings(settings);
    showStatus("Saved");
  }

  async function init() {
    settings = await RIO.getSettings();

    for (const [source, label] of SITE_LABELS) {
      buttonSettings.append(
        createToggle({
          label,
          setting: `buttons.${source}`,
          checked: settings.buttons[source] !== false
        })
      );
    }

    document
      .querySelector("[data-setting='contextMenu']")
      .checked = settings.contextMenu !== false;

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
