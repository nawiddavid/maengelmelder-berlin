import prisma from '../db.js';

export function listMessages() {
  return prisma.message.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export function findFirstMessage() {
  return prisma.message.findFirst({
    orderBy: {
      createdAt: 'asc',
    },
  });
}

export function findMessageById(id) {
  return prisma.message.findUnique({
    where: { id },
  });
}

export function insertMessage(text) {
  return prisma.message.create({
    data: { text },
  });
}

