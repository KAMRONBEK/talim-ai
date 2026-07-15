// Shared flat config (eslint 9) for the non-Next packages (@talim/api, @talim/ui).
// Next apps (web/admin) lint via `next lint` + .eslintrc.json instead.
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', '.next/**', 'node_modules/**'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Match the codebase's existing style — this repo was never lint-enforced,
      // so keep rules pragmatic rather than aspirational.
      '@typescript-eslint/no-explicit-any': 'off',
      // Consecutive case labels with an explanatory comment between them are a
      // deliberate pattern here (e.g. the FLASHCARD passthrough note in
      // lib/assessment-prompt.ts).
      'no-fallthrough': ['error', { allowEmptyCase: true }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
    },
  },
);
