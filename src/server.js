import app from './app.js';
import { log } from './logger.js';

const port = Number.parseInt(process.env.PORT, 10) || 3000;

app.listen(port, () => {
  log('server', `listening on http://localhost:${port}`);
});

