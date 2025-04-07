module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  transform: {},
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.js$',
  moduleFileExtensions: ['js', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  setupFiles: ['dotenv/config']
};