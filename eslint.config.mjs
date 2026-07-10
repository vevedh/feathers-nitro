import antfu from '@gabortorma/antfu-eslint-config'

export default antfu({
  rules: {
    'unused-imports/no-unused-vars': 'off',
  },
})
  .prepend({
    ignores: [
      '.release-it.ts',
      '**/node_modules/**',
      '**/dist/**',
      '**/.nuxt/**',
      '**/.output/**',
      '**/coverage/**',
      'playground/**',
      'test/fixtures/**',
    ],
  })
  .append({
    files: ['test/**/*.ts'],
    linterOptions: {
      reportUnusedDisableDirectives: false,
    },
    rules: {
      'test/prefer-lowercase-title': 'off',
      'ts/no-unsafe-argument': 'off',
      'ts/no-unsafe-assignment': 'off',
      'ts/no-unsafe-member-access': 'off',
    },
  })
