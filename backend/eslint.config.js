import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import n from 'eslint-plugin-n';
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export default [
  js.configs.recommended,
  {
    plugins: {
      prettier: prettierPlugin,
      n,
    },
    rules: {
      // Prettier integration
      'prettier/prettier': 'error',

      // Code quality
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-unused-vars': ['error', { argsIgnorePattern: 'req|res|next|val' }],
      'no-var': 'error',
      'prefer-const': 'error',
      'no-undef': 'error',

      // Node.js
      'n/no-missing-import': 'off', // Handled by Node's own resolution
      'n/no-unsupported-features/es-syntax': 'off', // We target Node >=20
    },
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      // The full Node global set rather than a hand-maintained list. The previous two
      // entries meant every other Node built-in tripped `no-undef` — `fetch`, `Buffer`,
      // `setTimeout`, `setInterval`, `clearInterval` were all reported as undefined in code
      // that runs perfectly well, which trains people to ignore lint output. `globals` is
      // the package ESLint itself uses for this and tracks the runtime's real surface.
      globals: globals.node,
    },
  },
  // Disable all rules that conflict with Prettier
  prettier,
  {
    // Ignore built artifacts and dependencies
    ignores: ['node_modules/**', 'dist/**'],
  },
];
