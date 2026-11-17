import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: [
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
      'playwright-report/**',
      'test-results/**',
      '.agents/**',
    ],
  },
  {
    files: [
      'src/features/**/*.{ts,tsx}',
      'src/components/**/*.{ts,tsx}',
      'src/lib/**/*.{ts,tsx}',
      'src/shared/**/*.{ts,tsx}',
      'src/app/**/page.tsx',
      'src/app/**/layout.tsx',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/server', '@/server/*', '**/server/**'],
              message: 'Client/UI layers must never import from src/server/*. Call /api/* instead.',
            },
            {
              group: ['next/image'],
              message: 'Use plain <img> with fallback /icons/placeholder-product.svg instead of next/image.',
            },
          ],
        },
      ],
      '@next/next/no-img-element': 'off',
    },
  },
  {
    files: ['src/features/**/*.{ts,tsx}', 'src/app/policies/**/*.{ts,tsx}'],
    ignores: ['src/features/admin/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXOpeningElement[name.name='ul']",
          message: 'Do not render <ul> in customer-facing UI. Use prose, tables, spec rows, or cards.',
        },
        {
          selector: "JSXOpeningElement[name.name='ol']",
          message: 'Do not render <ol> in customer-facing UI. Use prose, tables, spec rows, or cards.',
        },
      ],
    },
  },
];

export default eslintConfig;
