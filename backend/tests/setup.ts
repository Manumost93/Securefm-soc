// Variables de entorno requeridas por el backend antes de importar app
process.env.JWT_SECRET = 'test-secret-for-jest-minimum-32-characters-long!!';
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
