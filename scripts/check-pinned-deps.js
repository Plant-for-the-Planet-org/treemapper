#!/usr/bin/env node
/**
 * Dependency pin validator.
 *
 * WHY THIS EXISTS
 * ---------------
 * `yarn install --frozen-lockfile` does NOT protect this repo. Yarn 1 only
 * checks the root package.json against yarn.lock; edits to workspace child
 * manifests (apps/*, packages/*) are silently honoured. Verified: adding
 * `left-pad@1.3.0` to apps/server/package.json, with zero left-pad entries in
 * yarn.lock, installs it and exits 0. yarn.lock is not even rewritten, so
 * `git diff --exit-code yarn.lock` does not catch it either.
 *
 * Since nearly every dependency here lives in apps/*, that is exactly where the
 * built-in guard is blind. This script closes that gap.
 *
 * WHAT IT CHECKS
 * --------------
 *   1. Lock coverage  - every declared dep spec exists as a key in yarn.lock,
 *                       so the installed version cannot drift from the lock.
 *   2. Exact versions - no ^ ranges, no tags, no wildcards. Tilde is allowed
 *                       only where Expo tooling requires it (see TILDE_ALLOWED).
 *   3. Resolutions    - every root resolution value is an exact version.
 *
 * Zero dependencies on purpose: a guard that protects the dependency tree must
 * not itself add to it.
 *
 * Usage:  node scripts/check-pinned-deps.js
 * Exit:   0 = all pinned, 1 = problems found (details printed)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const BOLD = '\x1b[1m';
const OFF = '\x1b[0m';

/**
 * Where `~` (patch-float) is tolerated. CLAUDE.md documents why: Expo tooling
 * (`expo install`, `expo-doctor`) rewrites these and fights exact pins. The
 * lock-coverage check still applies, so a tilde dep cannot drift without the
 * lockfile changing too.
 */
const TILDE_ALLOWED = [
  { manifest: 'apps/mobile/package.json' }, // Expo SDK + React Native packages
  { name: '@types/react' }, // kept in step with the React types Expo ships
];

/** Specs that are not registry versions and cannot be lock-checked this way. */
const NON_REGISTRY = /^(file:|link:|portal:|workspace:|git\+|git:|https?:|npm:)/;

function isTildeAllowed(manifestRel, name) {
  return TILDE_ALLOWED.some(
    (rule) =>
      (rule.manifest === undefined || rule.manifest === manifestRel) &&
      (rule.name === undefined || rule.name === name),
  );
}

/**
 * Parse a yarn v1 lockfile into the set of its entry keys ("name@spec").
 *
 * Entry headers sit at column 0 and end with ':'. One header can list several
 * comma-separated specs that resolved to the same version, and any spec may be
 * quoted (scoped packages always are):
 *
 *   "@fastify/static@8.3.0":
 *   brace-expansion@2.1.4, brace-expansion@^1.1.7:
 */
function parseLockKeys(lockText) {
  const keys = new Set();

  for (const rawLine of lockText.split('\n')) {
    if (!rawLine || rawLine.startsWith('#')) continue;
    if (/^\s/.test(rawLine)) continue; // indented => a field, not a header
    if (!rawLine.endsWith(':')) continue;

    for (let spec of rawLine.slice(0, -1).split(',')) {
      spec = spec.trim().replace(/^"|"$/g, '');
      if (spec) keys.add(spec);
    }
  }
  return keys;
}

/**
 * Last package name in a resolutions key. The key is a path of package names,
 * and any segment may be scoped, so a plain split on '/' would turn
 * "@types/react" into "react":
 *
 *   "@types/react"                            -> @types/react
 *   "glob/minimatch/brace-expansion"          -> brace-expansion
 *   "@expo/fingerprint/minimatch/brace-expansion" -> brace-expansion
 */
function lastPackageInPath(target) {
  const parts = target.split('/');
  const names = [];
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].startsWith('@') && i + 1 < parts.length) {
      names.push(`${parts[i]}/${parts[i + 1]}`);
      i++;
    } else {
      names.push(parts[i]);
    }
  }
  return names[names.length - 1];
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/** Root manifest + every workspace matched by the `workspaces` globs. */
function findManifests() {
  const manifests = ['package.json'];
  const rootPkg = readJson(path.join(ROOT, 'package.json'));
  const globs = Array.isArray(rootPkg.workspaces)
    ? rootPkg.workspaces
    : (rootPkg.workspaces && rootPkg.workspaces.packages) || [];

  for (const glob of globs) {
    // Only the "dir/*" form is used here; anything else needs a real matcher.
    const dir = glob.replace(/\/\*$/, '');
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) continue;
    for (const entry of fs.readdirSync(abs).sort()) {
      const rel = path.posix.join(dir, entry, 'package.json');
      if (fs.existsSync(path.join(ROOT, rel))) manifests.push(rel);
    }
  }
  return manifests;
}

const lockPath = path.join(ROOT, 'yarn.lock');
if (!fs.existsSync(lockPath)) {
  console.error(`${RED}[check-pinned-deps] yarn.lock is missing.${OFF}`);
  process.exit(1);
}

const lockKeys = parseLockKeys(fs.readFileSync(lockPath, 'utf8'));
const manifests = findManifests();

// Workspace-internal deps (e.g. "shared-core": "*") never appear in the lock.
const workspaceNames = new Set(
  manifests
    .map((rel) => readJson(path.join(ROOT, rel)).name)
    .filter(Boolean),
);

const problems = [];
let checked = 0;

for (const rel of manifests) {
  const pkg = readJson(path.join(ROOT, rel));

  for (const field of ['dependencies', 'devDependencies', 'optionalDependencies']) {
    for (const [name, spec] of Object.entries(pkg[field] || {})) {
      if (workspaceNames.has(name)) continue; // resolved from the workspace
      if (typeof spec !== 'string' || NON_REGISTRY.test(spec)) continue;
      checked++;

      // 1. Exactness.
      if (spec.startsWith('^')) {
        problems.push({
          rel,
          detail: `${field}: ${name}@${spec} uses a caret range`,
          fix: `pin it exactly, e.g. "${name}": "${spec.slice(1)}"`,
        });
        continue;
      }
      if (spec.startsWith('~')) {
        if (!isTildeAllowed(rel, name)) {
          problems.push({
            rel,
            detail: `${field}: ${name}@${spec} uses a tilde range`,
            fix: `pin it exactly, or add it to TILDE_ALLOWED with a reason`,
          });
          continue;
        }
      } else if (!/^\d+\.\d+\.\d+/.test(spec)) {
        problems.push({
          rel,
          detail: `${field}: ${name}@${spec} is not an exact version`,
          fix: `use a full version like 1.2.3 (no tags, ranges or wildcards)`,
        });
        continue;
      }

      // 2. Lock coverage. This is the check --frozen-lockfile skips.
      if (!lockKeys.has(`${name}@${spec}`)) {
        problems.push({
          rel,
          detail: `${field}: ${name}@${spec} has no entry in yarn.lock`,
          fix: `run \`yarn install\` and commit the updated yarn.lock`,
        });
      }
    }
  }

  // 3. Resolution values must be exact, otherwise the override itself floats.
  for (const [target, spec] of Object.entries(pkg.resolutions || {})) {
    if (typeof spec !== 'string' || NON_REGISTRY.test(spec)) continue;
    checked++;
    const name = lastPackageInPath(target);
    if (spec.startsWith('~') && isTildeAllowed(rel, name)) continue;
    if (!/^\d+\.\d+\.\d+/.test(spec)) {
      problems.push({
        rel,
        detail: `resolutions: "${target}": "${spec}" is not an exact version`,
        fix: `resolutions must pin exactly, or they defeat the purpose`,
      });
    }
  }
}

if (problems.length === 0) {
  console.log(
    `${GREEN}[check-pinned-deps] OK${OFF} — ${checked} specs across ` +
      `${manifests.length} manifests are exact and present in yarn.lock.`,
  );
  process.exit(0);
}

console.error('');
console.error(`${RED}${BOLD}  [check-pinned-deps] dependency pinning is broken${OFF}`);
console.error('');

let current = null;
for (const p of problems) {
  if (p.rel !== current) {
    current = p.rel;
    console.error(`  ${BOLD}${current}${OFF}`);
  }
  console.error(`    ${RED}x${OFF} ${p.detail}`);
  console.error(`      ${YELLOW}->${OFF} ${p.fix}`);
}

console.error('');
console.error(
  `  ${BOLD}Why this matters:${OFF} \`yarn install --frozen-lockfile\` does not`,
);
console.error('  validate workspace manifests, so these would install silently.');
console.error('');
process.exit(1);
