'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const esbuild = require('esbuild');

const root = path.resolve(__dirname, '..');
const staging = fs.mkdtempSync(path.join(root, '.build-'));

// Every output is completed before any public file is replaced. In particular,
// Tailwind never truncates the CSS currently being served by the local preview.
try {
  const common = {
    absWorkingDir: root,
    bundle: true,
    minify: true,
    format: 'esm',
    target: 'es2020',
    jsx: 'automatic',
    nodePaths: (process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean),
    define: { 'process.env.NODE_ENV': '"production"' },
    legalComments: 'eof',
  };

  esbuild.buildSync({
    ...common,
    entryPoints: ['experience.tsx'],
    external: ['three'],
    outfile: path.join(staging, 'experience.js'),
  });
  esbuild.buildSync({
    ...common,
    entryPoints: ['activity.tsx'],
    outfile: path.join(staging, 'skyline.js'),
  });

  const sourcePath = (relative) => JSON.stringify(path.join(root, relative).replaceAll('\\', '/'));
  const theme = fs.readFileSync(require.resolve('tailwindcss/theme.css'), 'utf8');
  const input = path.join(staging, 'utilities.css');
  fs.writeFileSync(input, [
    theme,
    '@custom-variant dark (&:where(.dark, .dark *));',
    '@tailwind utilities source(none);',
    `@source ${sourcePath('components/ui')};`,
    `@source ${sourcePath('activity.tsx')};`,
    `@source ${sourcePath('experience.tsx')};`,
  ].join('\n'));

  const cliPackage = require.resolve('@tailwindcss/cli/package.json');
  const cli = path.join(path.dirname(cliPackage), 'dist', 'index.mjs');
  const result = spawnSync(process.execPath, [cli, '-i', input, '-o', path.join(staging, 'skyline.css'), '--minify'], {
    cwd: root,
    stdio: 'inherit',
    windowsHide: true,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Tailwind non riuscito (codice ${result.status}).`);

  for (const name of ['experience.js', 'skyline.js', 'skyline.css']) {
    fs.renameSync(path.join(staging, name), path.join(root, name));
  }
  console.log('Build completata: experience.js, skyline.js, skyline.css.');
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  const resolvedStaging = path.resolve(staging);
  if (!resolvedStaging.startsWith(root + path.sep + '.build-')) {
    throw new Error('Directory temporanea fuori dal progetto.');
  }
  fs.rmSync(resolvedStaging, { recursive: true, force: true });
}
