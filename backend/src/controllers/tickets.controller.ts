import { Response } from 'express';
import { validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';
import { createLog, getClientIp } from '../services/log.service';

const ticketSelect = {
  id: true,
  title: true,
  description: true,
  category: true,
  location: true,
  priority: true,
  status: true,
  imageUrl: true,
  createdAt: true,
  updatedAt: true,
  creator: { select: { id: true, name: true, email: true } },
  assignee: { select: { id: true, name: true, email: true } },
  comments: {
    orderBy: { createdAt: 'asc' as const },
    include: { user: { select: { id: true, name: true, role: true } } },
  },
};

export const getTickets = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, priority, category, assigneeId, search, from, to } = req.query as Record<string, string>;
    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;
    if (assigneeId) where.assigneeId = assigneeId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const tickets = await prisma.ticket.findMany({
      where,
      select: ticketSelect,
      orderBy: { updatedAt: 'desc' },
    });
    res.json(tickets);
  } catch (err) {
    throw err;
  }
};

export const getTicket = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      select: ticketSelect,
    });
    if (!ticket) {
      res.status(404).json({ message: 'Ticket no encontrado' });
      return;
    }
    res.json(ticket);
  } catch (err) {
    throw err;
  }
};

export const createTicket = async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  try {
    const { title, description, category, location, priority, assigneeId } = req.body;
    const ticket = await prisma.ticket.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        category,
        location: location.trim(),
        priority: priority || 'medium',
        creatorId: req.user!.userId,
        assigneeId: assigneeId || null,
      },
      select: ticketSelect,
    });

    await createLog({
      eventType: 'ticket_created',
      userId: req.user!.userId,
      userEmail: req.user!.email,
      ip: getClientIp(req as any),
      severity: 'info',
      description: `Ticket creado: ${title}`,
    });

    res.status(201).json(ticket);
  } catch (err) {
    throw err;
  }
};

export const updateTicket = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ticket = await prisma.ticket.findUnique({ where: { id: req.params.id } });
    if (!ticket) {
      res.status(404).json({ message: 'Ticket no encontrado' });
      return;
    }

    const { title, description, category, location, priority, status, assigneeId, imageUrl } = req.body;
    const updated = await prisma.ticket.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title: title.trim() }),
        ...(description && { description: description.trim() }),
        ...(category && { category }),
        ...(location && { location: location.trim() }),
        ...(priority && { priority }),
        ...(status && { status }),
        ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
        ...(imageUrl !== undefined && { imageUrl }),
      },
      select: ticketSelect,
    });

    if (status && status !== ticket.status) {
      await prisma.ticketComment.create({
        data: {
          content: `Estado cambiado de ${ticket.status} a ${status}`,
          action: 'status_change',
          ticketId: req.params.id,
          userId: req.user!.userId,
        },
      });
    }

    res.json(updated);
  } catch (err) {
    throw err;
  }
};

export const deleteTicket = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ticket = await prisma.ticket.findUnique({ where: { id: req.params.id } });
    if (!ticket) {
      res.status(404).json({ message: 'Ticket no encontrado' });
      return;
    }
    await prisma.ticket.delete({ where: { id: req.params.id } });

    await createLog({
      eventType: 'ticket_deleted',
      userId: req.user!.userId,
      userEmail: req.user!.email,
      ip: getClientIp(req as any),
      severity: 'medium',
      description: `Ticket eliminado: ${ticket.title}`,
    });

    res.json({ message: 'Ticket eliminado correctamente' });
  } catch (err) {
    throw err;
  }
};

export const addComment = async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  try {
    const ticket = await prisma.ticket.findUnique({ where: { id: req.params.id } });
    if (!ticket) {
      res.status(404).json({ message: 'Ticket no encontrado' });
      return;
    }
    const comment = await prisma.ticketComment.create({
      data: {
        content: req.body.content.trim(),
        ticketId: req.params.id,
        userId: req.user!.userId,
      },
      include: { user: { select: { id: true, name: true, role: true } } },
    });
    res.status(201).json(comment);
  } catch (err) {
    throw err;
  }
};

export const getStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [total, open, inProgress, resolved, critical] = await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: 'open' } }),
      prisma.ticket.count({ where: { status: 'in_progress' } }),
      prisma.ticket.count({ where: { status: 'resolved' } }),
      prisma.ticket.count({ where: { priority: 'critical' } }),
    ]);
    res.json({ total, open, inProgress, resolved, critical });
  } catch (err) {
    throw err;
  }
};
