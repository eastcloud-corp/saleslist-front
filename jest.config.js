const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testPathIgnorePatterns: [
    '<rootDir>/.next/', 
    '<rootDir>/node_modules/',
    '<rootDir>/test-results/',
    '<rootDir>/tests/',
    '<rootDir>/__tests__/e2e/'
  ],
  collectCoverageFrom: [
    'lib/csv-utils.ts',
    'components/companies/csv-import-dialog.tsx',
    'components/companies/csv-steps/**/*.tsx',
    'app/projects/components/project-history-dialog.tsx',
    'hooks/use-ng-list.tsx',
    'components/clients/ng-list-tab.tsx',
  ],
}

module.exports = createJestConfig(customJestConfig)
