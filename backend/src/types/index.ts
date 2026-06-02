import { Request } from 'express';

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export type UserRole = 'admin' | 'technician' | 'viewer';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type TicketStatus = 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed';
export type EventSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';
export type EventType =
  | 'login_success'
  | 'login_failed'
  | 'access_denied'
  | 'ticket_created'
  | 'ticket_deleted'
  | 'role_changed'
  | 'suspicious_ip'
  | 'rate_limit_triggered'
  | 'web_audit_executed'
  | 'web_audit_blocked';
