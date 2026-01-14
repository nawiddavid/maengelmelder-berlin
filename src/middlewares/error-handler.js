import { logError } from '../logger.js';

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  logError('error', err);

  if (res.headersSent) {
    return;
  }

  const status = err.statusCode ?? 500;

  res.status(status).json({
    error: err.expose ? err.message : 'internal_error',
  });
}

