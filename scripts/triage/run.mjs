// Bundles the triage entry with native modules stubbed, then runs it in Node.
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const stub = resolve(here, 'stub.mjs');
const out = resolve(here, '_bundle.mjs');

const stubNatives = {
  name: 'stub-natives',
  setup(b) {
    const re = /^(react-native$|react-native\/|react-native-|@react-native|expo$|expo-|@expo\/)/;
    b.onResolve({ filter: re }, () => ({ path: stub }));
  },
};

await build({
  entryPoints: [resolve(here, 'entry.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  jsx: 'automatic',
  tsconfig: resolve(here, '../../tsconfig.json'),
  outfile: out,
  plugins: [stubNatives],
  logLevel: 'error',
  define: { __DEV__: 'false' },
});

await import(`file://${out}`);
