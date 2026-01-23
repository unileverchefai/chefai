module.exports = {
  root: true,
  extends: 'airbnb-base',
  env: {
    browser: true,
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    allowImportExportEverywhere: true,
    sourceType: 'module',
    requireConfigFile: false,
    babelOptions: {
      presets: ['@babel/preset-react'],
    },
  },
  rules: {
    'import/extensions': ['error', { js: 'always' }], // require js file extensions in imports
    'import/no-unresolved': 'off', // import maps resolve at runtime, ESLint can't statically resolve them
    'linebreak-style': ['error', 'unix'], // enforce unix linebreaks
    'no-param-reassign': [2, { props: false }], // allow modifying properties of param
    'no-underscore-dangle': ['error', { allow: ['_id'] }], // allow underscore in Gifted Chat format
    'no-use-before-define': ['error', { functions: false, classes: false, variables: true }], // allow function hoisting
  },
};
