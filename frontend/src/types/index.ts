export type UserRole = 'admin' | 'technician' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type TicketStatus = 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed';

export interface TicketComment {
  id: string;
  content: string;
  action?: string;
  createdAt: string;
  user: { id: string; name: string; role: string };
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  priority: TicketPriority;
  status: TicketStatus;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  creator: { id: string; name: string; email: string };
  assignee?: { id: string; name: string; email: string } | null;
  comments: TicketComment[];
}

export type EventSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export interface SecurityLog {
  id: string;
  eventType: string;
  userId?: string;
  userEmail?: string;
  ip?: string;
  country?: string;
  severity: EventSeverity;
  description: string;
  userAgent?: string;
  createdAt: string;
}

export interface SecurityStats {
  total: number;
  critical: number;
  loginFailed: number;
  accessDenied: number;
  last24h: number;
  suspiciousIps: { ip: string; count: number }[];
  recent: SecurityLog[];
  bySeverity: { severity: string; count: number }[];
  byType: { type: string; count: number }[];
  byCountry: { country: string; count: number }[];
}

export interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  critical: number;
}

export interface AuditHeaderCheck {
  header: string;
  present: boolean;
  value: string | null;
  recommendation: string;
  severity: string;
  weight: number;
}

export interface AuditResult {
  url: string;
  timestamp: string;
  score: number;
  httpsEnabled: boolean;
  statusCode: number;
  redirects: string[];
  server: string | null;
  headerChecks: AuditHeaderCheck[];
  passed: string[];
  risks: { title: string; severity: string; description: string }[];
  recommendations: string[];
}
