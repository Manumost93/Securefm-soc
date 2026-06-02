import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';

export const getMetrics = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [
      totalTickets,
      openTickets,
      criticalTickets,
      totalEvents,
      criticalEvents,
      auditScans,
      auditBlocked,
    ] = await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: 'open' } }),
      prisma.ticket.count({ where: { priority: 'critical', status: { not: 'closed' } } }),
      prisma.securityLog.count(),
      prisma.securityLog.count({ where: { severity: 'critical' } }),
      prisma.securityLog.count({ where: { eventType: 'web_audit_executed' } }),
      prisma.securityLog.count({ where: { eventType: 'web_audit_blocked' } }),
    ]);

    res.json({
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      tickets: {
        total: totalTickets,
        open: openTickets,
        critical_open: criticalTickets,
      },
      security: {
        total_events: totalEvents,
        critical_events: criticalEvents,
        audit_scans: auditScans,
        audit_blocked: auditBlocked,
      },
    });
  } catch (err) {
    throw err;
  }
};
