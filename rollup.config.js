const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const typescript = require('@rollup/plugin-typescript');
const babel = require('@rollup/plugin-babel');
const terser = require('@rollup/plugin-terser');
const dts = require('rollup-plugin-dts');

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

module.exports = [
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
];
