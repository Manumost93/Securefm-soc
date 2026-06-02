/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Setup global antes de cada test suite (establece env vars)
  setupFiles: ['<rootDir>/tests/setup.ts'],
  // Los tests están en la carpeta tests/
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  // Alias de imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Cobertura
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/server.ts',       // Punto de entrada, no testeable en aislamiento
    '!src/lib/prisma.ts',   // Singleton mockeado en tests
    '!src/**/__mocks__/**', // Mocks no cuentan como código a cubrir
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // Timeout por test (10s es suficiente para tests de integración con mock)
  testTimeout: 10000,
  // Limpia mocks entre tests automáticamente
  clearMocks: true,
};
