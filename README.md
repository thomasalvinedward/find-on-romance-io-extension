# Find on Romance.io

A Chrome extension for quickly finding books on [Romance.io](https://www.romance.io/) from Amazon, Barnes & Noble, Bookshop.org, eBooks.com, Goodreads, Audible, Smashwords, Kobo, StoryGraph, or selected text on any page.

## Features

- Adds a **Find on Romance.io** button to supported book pages.
- Opens a Romance.io search using the detected title and author.
- Redirects to the best matching Romance.io book page when the match is confident.
- Falls back to Romance.io search results when no confident match is found.
- Adds a right-click menu item for searching highlighted text on Romance.io.

## Supported Sites

- Amazon
- Barnes & Noble
- Bookshop.org
- eBooks.com
- Goodreads
- Audible
- Smashwords
- Kobo
- StoryGraph
- Romance.io

## How It Works

On supported retailer pages, the extension reads visible book metadata and structured page metadata, then opens Romance.io with a search query based on the book title and author. On Romance.io search results, it compares available results with the original book details and redirects only when the best match passes a strict confidence check.

Highlighted text searches work separately: select text on any page, right-click, and choose **Search Romance.io for "..."**.

## Demo

See Find on Romance.io jump from a supported book page to its Romance.io listing:

https://github.com/user-attachments/assets/69ac8768-bcf9-489f-b7b6-131fbc3a273b


## Install Locally

1. Download or clone this repository.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode**.
4. Select **Load unpacked**.
5. Choose this project folder.
6. Refresh any already-open Amazon, Barnes & Noble, Bookshop.org, eBooks.com, Goodreads, Audible, Smashwords, Kobo, StoryGraph, or Romance.io tabs.

## Permissions

The extension requests:

- `storage`: temporarily stores book details while moving from a retailer page to Romance.io search results.
- `contextMenus`: adds the selected-text right-click search action.

Temporary lookup records are stored in Chrome extension storage and expire after one hour. They are removed earlier when a Romance.io result is evaluated.

## Privacy

Find on Romance.io does not collect, sell, transmit, or analyze personal data. Searches are opened directly in your browser on Romance.io. See [PRIVACY.md](PRIVACY.md) for more details.

## Development

Project structure:

- `manifest.json`: Chrome extension manifest
- `background/context-menu.js`: selected-text context menu search
- `content/amazon.js`: Amazon page integration
- `content/barnesandnoble.js`: Barnes & Noble page integration
- `content/bookshop.js`: Bookshop.org page integration
- `content/ebooks.js`: eBooks.com page integration
- `content/goodreads.js`: Goodreads page integration
- `content/audible.js`: Audible page integration
- `content/smashwords.js`: Smashwords page integration
- `content/kobo.js`: Kobo page integration
- `content/storygraph.js`: StoryGraph page integration
- `content/romance-search.js`: Romance.io search result matching
- `shared/logic.js`: title cleanup, matching, and search URL helpers
- `shared/storage.js`: temporary lookup storage
- `shared/ui.js`: shared button UI

Retailer integrations follow the same extraction pattern: define site-specific title and author selectors, prefer embedded or structured metadata when it is the most reliable source, use audited page-scoped selectors as fallbacks, and return through `createBookRecord()` so every site produces the same normalized book shape.

Run syntax checks:

```bash
node --check background/context-menu.js
node --check shared/logic.js
node --check shared/storage.js
node --check shared/ui.js
node --check content/amazon.js
node --check content/barnesandnoble.js
node --check content/bookshop.js
node --check content/ebooks.js
node --check content/goodreads.js
node --check content/audible.js
node --check content/smashwords.js
node --check content/kobo.js
node --check content/storygraph.js
node --check content/romance-search.js
```

## Disclaimer

Find on Romance.io is an independent, unofficial project and is not affiliated with, authorized by, endorsed by, or sponsored by Romance.io or any supported website or service.

All product names, trademarks, and brand identifiers belong to their respective owners. See [DISCLAIMER.md](DISCLAIMER.md) for full details.
