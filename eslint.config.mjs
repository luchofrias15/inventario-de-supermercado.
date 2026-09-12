import nextPlugin from '@next/eslint-plugin-next';
import { globalIgnores } from 'eslint/config';

const eslintConfig = [
  globalIgnores([
    '.next/**',
    'node_modules/**',
    'coverage/**',
    'next-env.d.ts',
  ]),
  {
    rules: {
      'no-undef': 'error',
      'no-unused-vars': 'off',
    }
  },
  nextPlugin.configs['core-web-vitals'],
];

export default eslintConfig;
