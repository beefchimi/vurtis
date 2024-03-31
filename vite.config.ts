import {defineConfig} from 'vite';
import dts from 'vite-plugin-dts';
// import pluginReact from '@vitejs/plugin-react';

import pkg from './package.json';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'vurtis',
      fileName: (format) => `vurtis.${format}.js`,
    },
    rollupOptions: {
      // We might need to define global variables
      // to use in the UMD build.
      external: Object.keys(pkg.peerDependencies),
    },
    minify: false,
  },
  plugins: [
    // pluginReact(),
    dts({rollupTypes: true}),
  ],
  test: {
    setupFiles: 'config/tests-setup',
  },
});

/*
rollupOptions: {
  external: [
    'react',
  ],
  output: {
    globals: {
      react: 'React',
    },
  },
},
*/
