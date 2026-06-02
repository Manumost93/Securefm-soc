import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';
import { createLog, getClientIp } from '../services/log.service';

export const login = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { email, password } = req.body as { email: string; password: string };
  const ip = getClientIp(req as AuthRequest);
  const userAgent = req.headers['user-agent'];

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.active) {
      await createLog({
        eventType: 'login_failed',
        userEmail: email,
        ip,
        severity: 'medium',
        description: `Intento de login fallido para ${email}`,
        userAgent,
      });
      res.status(401).json({ message: 'Credenciales inválidas' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      await createLog({
        eventType: 'login_failed',
        userEmail: email,
        ip,
        severity: 'medium',
        description: `Contraseña incorrecta para ${email}`,
        userAgent,
      });
      res.status(401).json({ message: 'Credenciales inválidas' });
      return;
    }

    const secret = process.env.JWT_SECRET as string;
    const expiresIn = process.env.JWT_EXPIRES_IN || '8h';
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn } as jwt.SignOptions
    );

    await createLog({
      eventType: 'login_success',
      userId: user.id,
      userEmail: user.email,
      ip,
      severity: 'info',
      description: `Login exitoso para ${user.email}`,
      userAgent,
    });

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    throw err;
  }
};

export const me = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
    });
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }
    res.json(user);
  } catch (err) {
    throw err;
  }
};
