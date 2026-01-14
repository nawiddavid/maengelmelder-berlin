import express from 'express';
import { log } from './logger.js';
import { notFoundHandler } from './middlewares/not-found.js';
import { errorHandler } from './middlewares/error-handler.js';
import { helloRouter } from './routes/hello.route.js';
import { messagesRouter } from './routes/messages.route.js';

const app = express();

app.use(express.json());
app.use(express.static('public'));

app.get('/health', (req, res) => {
  log('route', 'health-check');
  res.json({ data: 'ok' });
});

app.use('/api/hello', helloRouter);
app.use('/api/messages', messagesRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;

