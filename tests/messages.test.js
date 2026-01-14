import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';

let app;
let prisma;

beforeAll(async () => {
  process.env.DATABASE_URL = 'file:./test.db';

  ({ default: app } = await import('../src/app.js'));
  ({ default: prisma } = await import('../src/db.js'));

  await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS messages;');
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
});

beforeEach(async () => {
  await prisma.message.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('GET /api/hello', () => {
  it('liefert 404, wenn keine Nachrichten vorhanden sind', async () => {
    const response = await request(app).get('/api/hello');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'no_messages_available' });
  });

  it('liefert den ersten gespeicherten Eintrag', async () => {
    await prisma.message.create({ data: { text: 'Hallo Welt' } });
    await prisma.message.create({ data: { text: 'Zweite Nachricht' } });

    const response = await request(app).get('/api/hello');

    expect(response.status).toBe(200);
    expect(response.body.data.text).toBe('Hallo Welt');
  });
});

describe('POST /api/messages', () => {
  it('validiert den Text', async () => {
    const response = await request(app).post('/api/messages').send({ text: '' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'text_required' });
  });

  it('legt eine neue Nachricht an', async () => {
    const response = await request(app)
      .post('/api/messages')
      .send({ text: 'Neue Nachricht' });

    expect(response.status).toBe(201);
    expect(response.body.data.text).toBe('Neue Nachricht');

    const messages = await prisma.message.count();
    expect(messages).toBe(1);
  });
});

describe('GET /api/messages', () => {
  it('liefert alle Nachrichten', async () => {
    await prisma.message.create({ data: { text: 'Test A' } });
    await prisma.message.create({ data: { text: 'Test B' } });

    const response = await request(app).get('/api/messages');

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBe(2);
  });
});

