import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';

export const getLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { severity, eventType, userId, ip, from, to, limit } = req.query as Record<string, string>;
    const where: any = {};
    if (severity) where.severity = severity;
    if (eventType) where.eventType = eventType;
    if (userId) where.userId = userId;
    if (ip) where.ip = { contains: ip, mode: 'insensitive' };
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const logs = await prisma.securityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit ? Math.min(parseInt(limit), 500) : 200,
    });
    res.json(logs);
  } catch (err) {
    throw err;
  }
};

export const getSecurityStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      total,
      critical,
      loginFailed,
      accessDenied,
      recent,
      bySeverity,
      byType,
      byCountry,
    ] = await Promise.all([
      prisma.securityLog.count(),
      prisma.securityLog.count({ where: { severity: 'critical' } }),
      prisma.securityLog.count({ where: { eventType: 'login_failed' } }),
      prisma.securityLog.count({ where: { eventType: 'access_denied' } }),
      prisma.securityLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.securityLog.groupBy({
        by: ['severity'],
        _count: true,
      }),
      prisma.securityLog.groupBy({
        by: ['eventType'],
        _count: true,
      }),
      prisma.securityLog.groupBy({
        by: ['country'],
        _count: true,
        orderBy: { _count: { country: 'desc' } },
        take: 10,
      }),
    ]);

    const suspiciousIps = await prisma.securityLog.groupBy({
      by: ['ip'],
      where: { severity: { in: ['high', 'critical'] } },
      _count: true,
      orderBy: { _count: { ip: 'desc' } },
      take: 5,
    });

    const last24hCount = await prisma.securityLog.count({
      where: { createdAt: { gte: last24h } },
    });

    res.json({
      total,
      critical,
      loginFailed,
      accessDenied,
      last24h: last24hCount,
      suspiciousIps: suspiciousIps.map((s) => ({ ip: s.ip, count: s._count })),
      recent,
      bySeverity: bySeverity.map((s) => ({ severity: s.severity, count: s._count })),
      byType: byType.map((t) => ({ type: t.eventType, count: t._count })),
      byCountry: byCountry.map((c) => ({ country: c.country, count: c._count })),
    });
  } catch (err) {
    throw err;
  }
};
