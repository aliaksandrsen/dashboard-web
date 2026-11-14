import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

const EXACT_SEMVER_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const DEP_SECTIONS = ['dependencies', 'devDependencies', 'optionalDependencies'];

const violations = [];

for (const section of DEP_SECTIONS) {
  const deps = pkg[section];
  if (!deps || typeof deps !== 'object') continue;

  for (const [name, version] of Object.entries(deps)) {
    if (typeof version !== 'string' || !EXACT_SEMVER_RE.test(version)) {
      violations.push(`${section}.${name}: "${version}"`);
    }
  }
}

if (violations.length > 0) {
  console.error('Inexact dependency versions are forbidden in package.json:');
  for (const v of violations) {
    console.error(`  - ${v}`);
  }
  process.exit(1);
}

console.log('All dependency versions in package.json are exact.');
