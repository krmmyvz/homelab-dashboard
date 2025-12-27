import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  {
  ignores: ['dist', 'node_modules', '*.d.ts', 'build', 'backup-servers/**', 'backup/**', 'archive/**', 'server.log']
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node, // Add Node.js globals for server files
        process: 'readonly', // Explicitly define process as readonly
        __dirname: 'readonly', // Define __dirname for vite.config.js
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'no-unused-vars': [
        'error', 
        { 
          varsIgnorePattern: '^[A-Z_]|^motion$|^useMemo$|^useCallback$|^editMode$|^toggleEditMode$|^activeTags$|^viewTitle$|^viewSubtitle$|^groupIds$|^updateAllServerStatuses$|^kebabKey$',
          argsIgnorePattern: '^_|^e$|^error$|^down$|^cols$'
        }
      ],
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  // Special config for server files
  {
    files: ['server.js', 'src/services/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        process: 'readonly',
        __dirname: 'readonly',
      },
    },
  },
  // Special config for vite.config.js
  {
    files: ['vite.config.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        process: 'readonly',
        __dirname: 'readonly',
      },
    },
  },
]
