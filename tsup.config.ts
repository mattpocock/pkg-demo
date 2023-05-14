import type { Options } from 'tsup';

export const tsup: Options = {
    splitting: true,
    clean: true, // clean up the dist folder
    dts: true, // generate dts files
    format: ['cjs', 'esm'], // generate cjs and esm files
    minify: true,
    bundle: true,
    skipNodeModulesBundle: true,
    target: 'es2016',
    outDir: 'dist',
    entry: ['src/**/*.ts'], //include all files under src
};