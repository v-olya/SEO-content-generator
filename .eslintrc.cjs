module.exports = {
  root: true,
  overrides: [
    {
      files: ['*.ts'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: ['tsconfig.app.json', 'tsconfig.spec.json', 'backend/tsconfig.json'],
        tsconfigRootDir: __dirname,
        sourceType: 'module',
      },
      excludedFiles: ['backend/src/constants.ts'],
      plugins: ['@typescript-eslint', '@angular-eslint'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@angular-eslint/recommended',
        'plugin:@angular-eslint/template/process-inline-templates',
      ],
    },
    {
      files: ['*.html'],
      parser: '@angular-eslint/template-parser',
      extends: ['plugin:@angular-eslint/template/recommended'],
    },
  ],
};
