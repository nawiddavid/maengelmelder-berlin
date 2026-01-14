import { log } from '../logger.js';
import {
  listMessages,
  findFirstMessage,
  insertMessage,
} from '../repositories/message.repository.js';

function toApiMessage(message) {
  if (!message) {
    return null;
  }

  return {
    id: message.id,
    text: message.text,
    created_at: message.createdAt.toISOString(),
  };
}

export async function getGreeting() {
  const message = await findFirstMessage();

  if (!message) {
    const error = new Error('no_messages_available');
    error.statusCode = 404;
    error.expose = true;
    throw error;
  }

  log('svc', 'greeting-resolved', { messageId: message.id });
  return toApiMessage(message);
}

export async function getAllMessages() {
  const messages = await listMessages();
  return messages.map(toApiMessage);
}

export async function createMessage({ text }) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    const error = new Error('text_required');
    error.statusCode = 400;
    error.expose = true;
    throw error;
  }

  const trimmed = text.trim().slice(0, 256);
  const created = await insertMessage(trimmed);
  log('svc', 'message-created', { messageId: created.id });
  return toApiMessage(created);
}

