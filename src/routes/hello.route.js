import { Router } from 'express';
import { getGreeting } from '../services/message.service.js';

export const helloRouter = Router();

helloRouter.get('/', async (req, res, next) => {
  try {
    const greeting = await getGreeting();
    res.json({ data: greeting });
  } catch (error) {
    next(error);
  }
});

