import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';
import { createLog, getClientIp } from '../services/log.service';

export const getUsers = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (err) {
    throw err;
  }
};

export const getUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
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

export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  try {
    const { email, password, name, role } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ message: 'El email ya está registrado' });
      return;
    }
    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password: hashed, name, role: role || 'viewer' },
      select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
    });
    res.status(201).json(user);
  } catch (err) {
    throw err;
  }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, role, active } = req.body;
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    if (role && role !== existing.role) {
      await createLog({
        eventType: 'role_changed',
        userId: req.user!.userId,
        userEmail: req.user!.email,
        ip: getClientIp(req as any),
        severity: 'high',
        description: `Rol cambiado para ${existing.email}: ${existing.role} → ${role}`,
      });
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(role && { role }),
        ...(active !== undefined && { active }),
      },
      select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
    });
    res.json(updated);
  } catch (err) {
    throw err;
  }
};

export const getTechnicians = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const technicians = await prisma.user.findMany({
      where: { role: { in: ['technician', 'admin'] }, active: true },
      select: { id: true, name: true, email: true, role: true },
    });
    res.json(technicians);
  } catch (err) {
    throw err;
  }
};
