module.exports = {
  root: true,
  parser: '@typescript-eslint/parser', // если используете TS
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended', // если TS
    'plugin:astro/recommended',            // правила для Astro
    'plugin:prettier/recommended'          // интеграция с Prettier
  ],
  plugins: ['@typescript-eslint', 'prettier'],
  env: {
    browser: true,
    node: true,
    es2021: true
  },
  overrides: [
    {
      files: ['*.astro'],
      parser: 'astro-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser',
        extraFileExtensions: ['.astro']
      }
    }
  ],
  rules: {
    // ваши дополнительные правила
    'prettier/prettier': 'error'
  }
};
