// Mock automático de Prisma para tests
// Jest usa este archivo cuando se llama a jest.mock('../lib/prisma') o jest.mock('../../lib/prisma')

const prisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  ticket: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  ticketComment: {
    create: jest.fn(),
    createMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  securityLog: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  $disconnect: jest.fn(),
};

export default prisma;
