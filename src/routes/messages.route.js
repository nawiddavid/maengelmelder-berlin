import { Router } from 'express';
import {
  createMessage,
  getAllMessages,
} from '../services/message.service.js';

export const messagesRouter = Router();

messagesRouter.get('/', async (req, res, next) => {
  try {
    const messages = await getAllMessages();
    res.json({ data: messages });
  } catch (error) {
    next(error);
  }
});

messagesRouter.post('/', async (req, res, next) => {
  try {
    const message = await createMessage({ text: req.body.text });
    res.status(201).json({ data: message });
  } catch (error) {
    next(error);
  }
});

messagesRouter.get('/simulate-error', () => {
  const error = new Error('simulated_failure');
  error.statusCode = 500;
  throw error;
});

