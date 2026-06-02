import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('[ERROR]', err.message);
  const isDev = process.env.NODE_ENV === 'development';
  res.status(500).json({
    message: 'Error interno del servidor',
    ...(isDev && { detail: err.message }),
  });
};

export const notFound = (_req: Request, res: Response): void => {
  res.status(404).json({ message: 'Recurso no encontrado' });
};
