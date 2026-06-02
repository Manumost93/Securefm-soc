import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) { res.status(404).json({ message: 'Usuario no encontrado' }); return; }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) { res.status(401).json({ message: 'Contraseña actual incorrecta' }); return; }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) { throw err; }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name } = req.body as { name: string };
    if (!name?.trim()) { res.status(400).json({ message: 'Nombre requerido' }); return; }
    const updated = await prisma.user.update({
      where: { id: req.user!.userId },
      data: { name: name.trim() },
      select: { id: true, email: true, name: true, role: true },
    });
    res.json(updated);
  } catch (err) { throw err; }
};
