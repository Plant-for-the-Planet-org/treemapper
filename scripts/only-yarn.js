#!/usr/bin/env node
/**
 * Package manager guard. Runs from the root `preinstall` script.
 *
 * WHY THIS EXISTS
 * ---------------
 * This repo's pinning rests entirely on `yarn.lock` plus the yarn-only
 * `resolutions` field. Any other package manager throws both away:
 *
 *   - There is no package-lock.json, and npm does not read yarn.lock. It
 *     re-resolves the whole tree from the manifests.
 *   - `resolutions` is Yarn-only. npm honours `overrides`, which this repo does
 *     not define. Measured on 2026-08-10: `npm install` violated 9 of 22
 *     checkable pins, including minimatch 10.2.5 -> 3.1.5. Several of those
 *     pins exist to hold packages above a published advisory.
 *
 * So `npm install` here silently downgrades security-relevant transitive
 * versions. This script makes it fail loudly instead.
 *
 * Yarn 2+ is refused too: it migrates the v1 lockfile to its own format, which
 * re-resolves versions. `packageManager` pins yarn 1.22.19 for corepack.
 *
 * Zero dependencies on purpose -- preinstall runs before node_modules exists.
 *
 * Limitation: `--ignore-scripts` skips this, as it skips every lifecycle hook.
 * The build-time gate is `scripts/check-pinned-deps.js`, which cannot be
 * skipped that way.
 */

const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BOLD = '\x1b[1m';
const OFF = '\x1b[0m';

// Set by every npm-family client. Yarn 1: "yarn/1.22.19 npm/? node/v22.x ...".
// npm 10:  "npm/10.9.8 node/v22.x darwin x64 workspaces/true".
const agent = process.env.npm_config_user_agent || '';
const client = agent.split(' ')[0] || ''; // e.g. "yarn/1.22.19"
const [clientName, clientVersion = ''] = client.split('/');

// No agent at all means this was not run by a package manager (a bare
// `node scripts/only-yarn.js`). Nothing to guard against, so allow it.
if (!agent) process.exit(0);

function fail(what, why) {
  console.error('');
  console.error(`${RED}${BOLD}  Refusing to install with ${what}.${OFF}`);
  console.error('');
  console.error(`  ${why}`);
  console.error('');
  console.error(`  Use ${BOLD}yarn install${OFF} instead (yarn 1.22.19, see "packageManager").`);
  console.error(`  If yarn is missing: ${YELLOW}corepack enable${OFF} under Node 22.`);
  console.error('');
  process.exit(1);
}

if (clientName !== 'yarn') {
  fail(
    clientName || 'this package manager',
    'It ignores yarn.lock and the yarn-only "resolutions" field, so it would\n' +
      '  re-resolve transitive packages and silently undo pinned security versions.',
  );
}

if (clientVersion && !clientVersion.startsWith('1.')) {
  fail(
    `yarn ${clientVersion}`,
    'Yarn 2+ migrates the v1 lockfile to its own format, which re-resolves\n' +
      '  every version. This repo is pinned to yarn 1.22.19.',
  );
}
