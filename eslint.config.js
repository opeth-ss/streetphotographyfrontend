import js from '@eslint/js';
import pluginSecurity from 'eslint-plugin-security';

export default [
  js.configs.recommended,
  {
    plugins: {
      security: pluginSecurity,
    },
    rules: {
      ...pluginSecurity.configs.recommended.rules,
      'security/detect-object-injection': 'off', // optionally override noisy rules
    },
  },
];
