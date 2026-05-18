// Centralized error handler — registered last in server.js

export function errorHandler(err, req, res, next) {
  const status  = err.statusCode || 500;
  const message = err.message    || 'Internal Server Error';

  if (process.env.NODE_ENV !== 'production') {
    console.error(`[${status}] ${req.method} ${req.originalUrl} — ${message}`);
  }

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}

// Helper: create an error with a custom status code
export function createError(message, statusCode = 500) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}
