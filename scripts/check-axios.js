#!/usr/bin/env node
/**
 * Blocks known compromised axios versions from being installed.
 * Compromised: 1.14.1 (RAT), 0.30.4 (RAT) — see https://github.com/axios/axios/issues/10604
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const BLOCKED = ['1.14.1', '0.30.4'];

function findAxiosVersions(root) {
  const found = [];
  const queue = [root];
  while (queue.length) {
    const dir = queue.shift();
    const axiosPkg = path.join(dir, 'node_modules', 'axios', 'package.json');
    if (fs.existsSync(axiosPkg)) {
      const { version } = JSON.parse(fs.readFileSync(axiosPkg, 'utf8'));
      found.push({ version, location: axiosPkg });
    }
    const nmDir = path.join(dir, 'node_modules');
    if (!fs.existsSync(nmDir)) continue;
    for (const pkg of fs.readdirSync(nmDir)) {
      const sub = path.join(nmDir, pkg, 'node_modules');
      if (fs.existsSync(sub)) queue.push(path.join(nmDir, pkg));
    }
  }
  return found;
}

const root = path.resolve(__dirname, '..');
const installations = findAxiosVersions(root);
const compromised = installations.filter(({ version }) => BLOCKED.includes(version));

if (compromised.length > 0) {
  console.error('\n\x1b[31m[SECURITY] COMPROMISED axios version detected!\x1b[0m');
  console.error('The following installations contain malware (RAT):');
  compromised.forEach(({ version, location }) => {
    console.error(`  axios@${version} at ${location}`);
  });
  console.error('\nSee: https://github.com/axios/axios/issues/10604');
  console.error('Run: yarn install (yarn resolutions should prevent this — check your lock file)\n');
  process.exit(1);
} else {
  console.log(`[check-axios] OK — no compromised axios versions found (checked ${installations.length} installation(s))`);
}
