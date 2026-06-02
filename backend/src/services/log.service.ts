import prisma from '../lib/prisma';
import { EventType, EventSeverity } from '../types';

interface LogParams {
  eventType: EventType;
  userId?: string;
  userEmail?: string;
  ip?: string;
  country?: string;
  severity?: EventSeverity;
  description: string;
  userAgent?: string;
}

export async function createLog(params: LogParams): Promise<void> {
  await prisma.securityLog.create({
    data: {
      eventType: params.eventType,
      userId: params.userId,
      userEmail: params.userEmail,
      ip: params.ip || '0.0.0.0',
      country: params.country ?? null,
      severity: params.severity || 'info',
      description: params.description,
      userAgent: params.userAgent,
    },
  });
}

export function getClientIp(req: { ip?: string; headers: Record<string, string | string[] | undefined> }): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    return ip.trim();
  }
  return req.ip || '127.0.0.1';
}
