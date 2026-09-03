# Corsen Context for Express

A self-contained Express example with four read-only MCP tools, `/llms.txt`,
an opt-in `/llms-full.txt`, and a same-origin WebMCP bridge.

[Live demo](https://express-webmcp.corsen.ai) ·
[GitHub repository](https://github.com/CorsenAI/corsen-context-express) ·
[Download ZIP](https://github.com/CorsenAI/corsen-context-express/archive/refs/heads/main.zip)

## Set up on your own site

1. Clone this repository or add `@corsenai/corsen-context` to an existing
   Express app, then `npm ci`.
2. Copy `.env.example` to `.env` and set `SITE_URL` to your public origin.
3. Replace the sample records in `content.js` with your public pages, or
   implement the `ContentProvider` interface over your CMS or database.
4. Run `npm test`, then run the server behind your HTTPS reverse proxy so
   `/v1/mcp`, `/webmcp.js` and `/llms.txt` share your site's origin.
5. Verify with `npx @corsenai/corsen-context-cli@2.0.1 doctor --url https://your-site.example`
   and a WebMCP-capable browser.
6. Revoke at any time with `CORSEN_CONTEXT_MCP_ENABLED=false` and a restart.

The complete walkthrough, with a systemd unit, Nginx routes, platform notes,
verification steps and rollback, is in [DEPLOYMENT.md](DEPLOYMENT.md).

## Requirements

- Node.js 22.12 or newer (`.nvmrc` pins 22.13.0)
- npm 10 or newer

## Install and run

```bash
git clone https://github.com/CorsenAI/corsen-context-express.git
cd corsen-context-express
npm ci
npm start
```

Open <http://localhost:3000>. The committed lockfile resolves the published
`@corsenai/corsen-context` package to 2.0.1; no monorepo files are required.

For configuration, copy `.env.example` to `.env`. Set `SITE_URL` to the
canonical public origin and set `HOST=0.0.0.0` only when a deployment platform
requires a public listener. Replace the sample provider in `server.js` with
your public CMS or database adapter.

## Test

```bash
npm test
```

The smoke test starts the delivered Express server on an isolated local port
and verifies the MCP handshake, initialization notification, exact four-tool
contract, search-to-page flow, same-origin policy, `llms.txt`, WebMCP bridge,
and the page's link to this repository.

## Endpoints and switches

- `GET /llms.txt` — bounded discovery file
- `POST /v1/mcp` — JSON-RPC MCP endpoint
- `GET /webmcp.js` — same-origin browser bridge
- `CORSEN_CONTEXT_MCP_ENABLED=false` — disables MCP and WebMCP
- `CORSEN_CONTEXT_LLMS_TXT_ENABLED=false` — disables text exports
- `CORSEN_CONTEXT_LLMS_FULL_TXT_ENABLED=true` — enables the full export

The public bridge sends no credentials. Keep its provider read-only and expose
only public content. If the MCP endpoint must require a secret key, remove the
bridge from the rendered page.

The page navigation links directly to this repository:
<https://github.com/CorsenAI/corsen-context-express>.

See [SECURITY.md](SECURITY.md) for private reporting. Released under the
[MIT License](LICENSE).
