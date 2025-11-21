import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'react/react-in-jsx-scope': 'off', // Not needed in React 17+
      'react/prop-types': 'off', // Using TypeScript or don't want prop-types
    },
  },
  // Separate config for Node.js scripts and config files
  {
    files: [
      '*.cjs', 
      '*.mjs', 
      'functions/**/*.js', 
      'vite.config.js', 
      '*.config.js',
      'manage-admins.js',
      'fix-*.js',
      '*-console.js',
      'assign-*.cjs',
      'migrate*.cjs',
      'sync-*.cjs',
      'sync-*.mjs',
      'createTestCheck.js',
      'estrai-setter.js',
      'recupera-setter.js',
      'ricrea-collaboratori.js',
      'sync-nomi.js',
    ],
    languageOptions: {
      globals: {
        ...globals.node,
        process: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'writable',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
  },
  // Service worker specific config
  {
    files: ['**/service-worker.js', '**/firebase-messaging-sw.js'],
    languageOptions: {
      globals: {
        ...globals.serviceworker,
        importScripts: 'readonly',
        firebase: 'readonly',
      },
    },
  },
  // Test files specific config
  {
    files: ['**/__tests__/**/*.(js|jsx)', '**/*.(test|spec).(js|jsx)'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
      },
    },
  },
]
