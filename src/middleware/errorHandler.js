export function errorHandler(err, req, res, _next) {
  console.error(`[ERROR] ${err.message}`, err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.expose ? err.message : 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.expose = true;
  }
}
