import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import dts from 'rollup-plugin-dts';

const packageJson = require('./package.json');

const external = [
  ...Object.keys(packageJson.peerDependencies || {}),
  ...Object.keys(packageJson.dependencies || {}),
  'react',
  'react-dom',
  'uuid'
];

const commonConfig = {
  external,
  plugins: [
    resolve({
      browser: true,
      preferBuiltins: false,
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: false,
    }),
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/**',
      presets: [
        '@babel/preset-env',
        '@babel/preset-react',
        '@babel/preset-typescript',
      ],
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    }),
  ],
};

export default [
  // ESM build
  {
    ...commonConfig,
    input: 'src/index.ts',
    output: {
      file: packageJson.module,
      format: 'esm',
      sourcemap: true,
    },
  },
  // CJS build
  {
    ...commonConfig,
    input: 'src/index.ts',
    output: {
      file: packageJson.main,
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
    },
  },
  // Minified ESM build
  {
    ...commonConfig,
    input: 'src/index.ts',
    output: {
      file: 'dist/index.min.esm.js',
      format: 'esm',
      sourcemap: true,
    },
    plugins: [
      ...commonConfig.plugins,
      terser({
        compress: {
          drop_console: true,
        },
      }),
    ],
  },
  // Minified CJS build
  {
    ...commonConfig,
    input: 'src/index.ts',
    output: {
      file: 'dist/index.min.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
    },
    plugins: [
      ...commonConfig.plugins,
      terser({
        compress: {
          drop_console: true,
        },
      }),
    ],
  },
  // Type definitions
  {
    input: 'dist/index.d.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'esm',
    },
    plugins: [dts()],
    external: [/\.css$/],
  },
];
