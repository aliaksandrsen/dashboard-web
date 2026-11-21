import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const EXACT_SEMVER_RE = /^\d+\.\d+\.\d+(?:-[\da-zA-Z.-]+)?(?:\+[\da-zA-Z.-]+)?$/;
const DEPENDENCY_FIELDS = ['dependencies', 'devDependencies', 'optionalDependencies'];

const pkgPath = resolve(process.cwd(), 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

const violations = [];

for (const field of DEPENDENCY_FIELDS) {
  const deps = pkg[field];
  if (!deps || typeof deps !== 'object') {
    continue;
  }

  for (const [name, version] of Object.entries(deps)) {
    if (typeof version !== 'string' || !EXACT_SEMVER_RE.test(version)) {
      violations.push(`${field}.${name}: "${version}"`);
    }
  }
}

if (violations.length > 0) {
  console.error(
    'Non-exact dependency versions found in package.json:\n' +
      violations.map((item) => `  - ${item}`).join('\n'),
  );
  process.exit(1);
}

console.log('All dependency versions in package.json are exact.');
