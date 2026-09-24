import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

export default defineConfig(
  globalIgnores(['node_modules', '.playwright', 'eslint.config.js']),

  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
    },
  },

  // Page objects and fixtures: only the locator rules. expectLoaded() is the one expect outside a test.
  {
    files: ['src/**/*.ts'],
    plugins: { playwright },
    rules: {
      'playwright/no-raw-locators': 'warn',
      'playwright/prefer-native-locators': 'warn',
    },
  },

  // Specs: the full recommended set, plus the rules the playbook makes errors.
  {
    files: ['tests/**/*.ts'],
    extends: [playwright.configs['flat/recommended']],
    rules: {
      'playwright/no-raw-locators': 'warn',
      'playwright/prefer-native-locators': 'warn',
      'playwright/expect-expect': ['error', { assertFunctionNames: ['expectLoaded', '*.expectLoaded'] }],
      'playwright/no-conditional-in-test': 'error',
      'playwright/no-conditional-expect': 'error',
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-wait-for-selector': 'error',
      'playwright/no-networkidle': 'error',
      'playwright/no-force-option': 'error',
      'playwright/no-skipped-test': 'error',
      'playwright/no-focused-test': 'error',
      'playwright/prefer-web-first-assertions': 'error',
      'playwright/prefer-lowercase-title': 'error',
    },
  },
);
