import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer as createPortProbe } from 'node:net';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

async function availablePort() {
  const probe = createPortProbe();
  probe.listen(0, '127.0.0.1');
  await once(probe, 'listening');
  const address = probe.address();
  assert.ok(address && typeof address === 'object');
  const { port } = address;
  probe.close();
  await once(probe, 'close');
  return port;
}

async function runClient(baseUrl) {
  const client = spawn(
    process.execPath,
    [
      'scripts/mcp-smoke.mjs',
      baseUrl,
      'Express standalone',
      'MCP',
      'https://github.com/CorsenAI/corsen-context-express',
    ],
    { cwd: root, env: process.env, stdio: 'inherit' },
  );
  const [code, signal] = await once(client, 'exit');
  assert.equal(signal, null, `smoke client terminated by ${signal}`);
  assert.equal(code, 0, 'smoke client failed');
}

const port = await availablePort();
const baseUrl = `http://127.0.0.1:${port}`;
Object.assign(process.env, {
  CORSEN_CONTEXT_SMOKE: '1',
  CORSEN_CONTEXT_MCP_ENABLED: 'true',
  CORSEN_CONTEXT_LLMS_TXT_ENABLED: 'true',
  CORSEN_CONTEXT_LLMS_FULL_TXT_ENABLED: 'false',
  HOST: '127.0.0.1',
  PORT: String(port),
  SITE_URL: baseUrl,
  TRUST_PROXY: '0',
});

const { default: app } = await import('../server.js');
const server = app.listen(port, '127.0.0.1');
await once(server, 'listening');

try {
  await runClient(baseUrl);
} finally {
  server.close();
  await once(server, 'close');
}
