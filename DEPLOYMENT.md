# Set up Corsen Context for Express on your own site

This guide takes the reference server from "runs locally with sample content"
to "serves your public content on your domain". Every step is verifiable; no
step relies on the demo corpus.

## 1. Requirements

- Node.js 22.12 or newer and npm 10 or newer
- A public HTTPS origin for the site (for example `https://www.example.com`)
- Your public content reachable from the server: a CMS API, a database, or
  files generated at build time

## 2. Install

```bash
git clone https://github.com/CorsenAI/corsen-context-express.git
cd corsen-context-express
npm ci
cp .env.example .env
```

Edit `.env`:

| Variable                               | Value                                                                 |
| -------------------------------------- | --------------------------------------------------------------------- |
| `SITE_URL`                             | The canonical public origin, without a trailing slash                 |
| `PORT`                                 | The local port the process listens on (default `3000`)                |
| `HOST`                                 | Keep `127.0.0.1` behind a reverse proxy; `0.0.0.0` only if required   |
| `CORSEN_CONTEXT_MCP_ENABLED`           | `true` to publish `/v1/mcp` and `/webmcp.js`; `false` removes both    |
| `CORSEN_CONTEXT_LLMS_TXT_ENABLED`      | `true` to publish `/llms.txt`                                         |
| `CORSEN_CONTEXT_LLMS_FULL_TXT_ENABLED` | `false` unless every exported page is intentionally public            |
| `TRUST_PROXY`                          | `1` only when exactly one proxy you control overwrites client-IP data |

## 3. Replace the sample content with yours

`content.js` is the single source of truth for the human pages **and** the four
tools. Replace its records with your own public pages. Each record needs:

- `path` — the public URL path on your site, for example `/guides/start`
- `title` and `description` — what the human page shows
- `body` — the readable text of the page (Markdown or plain text)
- `type` — `page`, `post`, `product`, or your own public type
- `lastModified` — an ISO date

If your content lives in a CMS or database, implement the `ContentProvider`
interface from `@corsenai/corsen-context` instead of editing records:

```js
const provider = {
  async getPages() {
    /* return only published, public pages with their canonical URLs */
  },
  async getPageContent(url) {
    /* return { url, title, markdown, metadata } or null when not public */
  },
  async searchContent(query, limit) {
    /* return at most `limit` public matches */
  },
};
```

The provider is part of the security boundary: it must enforce publication
status, membership rules, canonical same-site URLs, and a field allowlist.
Never return drafts, account pages, or personalized responses.

## 4. Run and test

```bash
npm start
npm test
```

`npm test` starts the delivered server on an isolated port and verifies the
MCP handshake, the initialization notification, the exact four-tool contract,
a search-to-page flow, the same-origin policy, `llms.txt`, the WebMCP bridge,
and the page's link to this repository.

## 5. Deploy

Run the process under a supervisor and put it behind your HTTPS reverse proxy.
A minimal systemd unit:

```ini
[Unit]
Description=Corsen Context Express site
After=network.target

[Service]
User=www-data
WorkingDirectory=/opt/corsen-context-express
EnvironmentFile=/opt/corsen-context-express/.env
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Reverse-proxy the whole site, or at least these exact paths, from the public
origin named in `SITE_URL`:

```nginx
location = /v1/mcp   { proxy_pass http://127.0.0.1:3000/v1/mcp;   proxy_set_header Host $host; }
location = /webmcp.js { proxy_pass http://127.0.0.1:3000/webmcp.js; proxy_set_header Host $host; }
location = /llms.txt { proxy_pass http://127.0.0.1:3000/llms.txt; proxy_set_header Host $host; }
```

Platform notes: on Render, Railway, Fly.io, or a container platform, set the
same environment variables in the platform dashboard, keep `HOST=0.0.0.0`
only when the platform requires it, and confirm the public URL matches
`SITE_URL` before enabling MCP.

## 6. Verify the public deployment

```bash
npx @corsenai/corsen-context-cli@2.0.1 doctor --url https://www.example.com
```

Then confirm by hand:

1. `GET https://www.example.com/llms.txt` returns your pages.
2. `GET https://www.example.com/v1/mcp` returns `405` with `Allow: POST`.
3. `POST /v1/mcp` with `initialize` negotiates protocol `2025-11-25`.
4. `tools/list` returns exactly `search_site`, `get_page_content`,
   `list_content`, `get_sitemap`.
5. `search_site` for a term from your content returns one of your URLs, and
   `get_page_content` on that URL returns its Markdown.
6. In a WebMCP-capable browser, open the site and check that the four tools
   are registered (see the monorepo's browser setup guide).

## 7. Revoke or roll back

- `CORSEN_CONTEXT_MCP_ENABLED=false` and restart: `/v1/mcp` and `/webmcp.js`
  answer `404`, and pages stop loading the bridge.
- `CORSEN_CONTEXT_LLMS_TXT_ENABLED=false` and restart: both text exports
  answer `404`.
- Remove the proxy routes and stop the service to remove the integration
  entirely; purge any CDN copy of `/llms.txt`.

## 8. Choose one endpoint mode

The browser bridge sends no cookies, credentials, or API key. Either run a
public, read-only, rate-limited `/v1/mcp` backed only by public content (the
default), or protect `/v1/mcp` with `CORSEN_CONTEXT_API_KEY` for server-side
clients and remove the bridge from your pages. Never embed a key in HTML.
