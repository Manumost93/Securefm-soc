import { Response } from 'express';
import { validationResult } from 'express-validator';
import { promises as dns } from 'dns';
import { isIP } from 'net';
import { AuthRequest } from '../types';
import { createLog, getClientIp } from '../services/log.service';

interface HeaderCheck {
  header: string;
  present: boolean;
  value: string | null;
  recommendation: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  weight: number;
}

interface AuditResult {
  url: string;
  timestamp: string;
  score: number;
  httpsEnabled: boolean;
  statusCode: number;
  redirects: string[];
  server: string | null;
  headerChecks: HeaderCheck[];
  passed: string[];
  risks: { title: string; severity: string; description: string }[];
  recommendations: string[];
}

const SECURITY_HEADERS = [
  { header: 'content-security-policy', recommendation: 'Añadir Content-Security-Policy para prevenir XSS.', severity: 'high' as const, weight: 20 },
  { header: 'x-frame-options', recommendation: 'Añadir X-Frame-Options: DENY o SAMEORIGIN para prevenir Clickjacking.', severity: 'high' as const, weight: 15 },
  { header: 'x-content-type-options', recommendation: 'Añadir X-Content-Type-Options: nosniff para prevenir MIME sniffing.', severity: 'medium' as const, weight: 10 },
  { header: 'strict-transport-security', recommendation: 'Añadir Strict-Transport-Security (HSTS) para forzar HTTPS.', severity: 'high' as const, weight: 20 },
  { header: 'referrer-policy', recommendation: 'Añadir Referrer-Policy para controlar cabeceras Referer.', severity: 'low' as const, weight: 5 },
  { header: 'permissions-policy', recommendation: 'Añadir Permissions-Policy para controlar el acceso a APIs del navegador.', severity: 'medium' as const, weight: 10 },
];

// Rangos de IP privados / no enrutables que deben bloquearse (SSRF)
const BLOCKED_IP_PATTERNS = [
  /^127\./,                           // Loopback IPv4
  /^0\.0\.0\.0/,                      // Any address
  /^::1$/,                            // Loopback IPv6
  /^0:0:0:0:0:0:0:1$/,               // IPv6 loopback (expandido)
  /^10\./,                            // RFC 1918 clase A
  /^172\.(1[6-9]|2\d|3[01])\./,      // RFC 1918 clase B
  /^192\.168\./,                      // RFC 1918 clase C
  /^169\.254\./,                      // Link-local (metadata AWS/GCP/Azure)
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,  // CGNAT RFC 6598
  /^fc/i,                             // IPv6 unique local
  /^fd/i,                             // IPv6 unique local
  /^fe80:/i,                          // IPv6 link-local
  /^2001:db8/i,                       // IPv6 documentation
];

function isPrivateIp(ip: string): boolean {
  return BLOCKED_IP_PATTERNS.some(pattern => pattern.test(ip));
}

async function validateTargetUrl(urlString: string): Promise<{ safe: boolean; reason?: string; parsed?: URL }> {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    return { safe: false, reason: 'URL inválida' };
  }

  // Solo HTTP y HTTPS
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { safe: false, reason: `Protocolo no permitido: ${parsed.protocol}` };
  }

  const hostname = parsed.hostname;

  // Si el hostname es directamente una IP, validarla
  if (isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      return { safe: false, reason: `IP privada o reservada no permitida: ${hostname}` };
    }
    return { safe: true, parsed };
  }

  // Resolver DNS y validar las IPs resultantes (previene DNS rebinding)
  try {
    const [ipv4Addresses] = await Promise.allSettled([
      dns.resolve4(hostname),
    ]);

    const addresses: string[] = [];
    if (ipv4Addresses.status === 'fulfilled') addresses.push(...ipv4Addresses.value);

    if (addresses.length === 0) {
      return { safe: false, reason: `No se pudo resolver el hostname: ${hostname}` };
    }

    for (const ip of addresses) {
      if (isPrivateIp(ip)) {
        return { safe: false, reason: `El hostname resuelve a una IP privada: ${ip}` };
      }
    }
  } catch {
    return { safe: false, reason: `Error resolviendo DNS para: ${hostname}` };
  }

  return { safe: true, parsed };
}

export const auditUrl = async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { url } = req.body as { url: string };
  const clientIp = getClientIp(req as AuthRequest);

  try {
    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    // Validación de seguridad SSRF antes de hacer cualquier petición
    const validation = await validateTargetUrl(targetUrl);
    if (!validation.safe) {
      await createLog({
        eventType: 'web_audit_blocked',
        userId: req.user?.userId,
        userEmail: req.user?.email,
        ip: clientIp,
        severity: 'high',
        description: `Auditoría bloqueada por seguridad SSRF — ${validation.reason} — URL: ${targetUrl}`,
      });
      res.status(400).json({ message: `URL no permitida: ${validation.reason}` });
      return;
    }

    const httpsEnabled = targetUrl.startsWith('https://');
    let statusCode = 0;
    let responseHeaders: Record<string, string> = {};
    let server: string | null = null;
    let fetchError = false;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(targetUrl, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'User-Agent': 'SecureFM-SOC-Auditor/1.0 (Security Scanner)' },
      });
      clearTimeout(timeout);

      statusCode = response.status;
      response.headers.forEach((value, key) => {
        responseHeaders[key.toLowerCase()] = value;
      });
      server = responseHeaders['server'] || responseHeaders['x-powered-by'] || null;
    } catch {
      fetchError = true;
      statusCode = 0;
    }

    const headerChecks: HeaderCheck[] = SECURITY_HEADERS.map((h) => ({
      header: h.header,
      present: !fetchError && h.header in responseHeaders,
      value: !fetchError ? (responseHeaders[h.header] || null) : null,
      recommendation: h.recommendation,
      severity: h.severity,
      weight: h.weight,
    }));

    let score = httpsEnabled ? 20 : 0;
    const passed: string[] = [];
    const risks: { title: string; severity: string; description: string }[] = [];
    const recommendations: string[] = [];

    if (httpsEnabled) passed.push('HTTPS habilitado');
    else {
      risks.push({ title: 'Sin HTTPS', severity: 'critical', description: 'La URL no usa HTTPS. Los datos viajan sin cifrar.' });
      recommendations.push('Migrar a HTTPS inmediatamente.');
    }

    for (const check of headerChecks) {
      if (check.present) {
        score += check.weight;
        passed.push(`Cabecera ${check.header} presente`);
      } else if (!fetchError) {
        risks.push({ title: `Cabecera ${check.header} ausente`, severity: check.severity, description: check.recommendation });
        recommendations.push(check.recommendation);
      }
    }

    if (server) {
      risks.push({ title: 'Información del servidor expuesta', severity: 'low', description: `La cabecera Server/X-Powered-By revela: ${server}.` });
      recommendations.push('Eliminar o enmascarar las cabeceras Server y X-Powered-By.');
    }

    if (fetchError) {
      risks.push({ title: 'URL inaccesible', severity: 'medium', description: 'No se pudo conectar a la URL. Puede estar caída o bloquear bots.' });
    }

    score = Math.min(100, Math.max(0, score));

    const result: AuditResult = {
      url: targetUrl,
      timestamp: new Date().toISOString(),
      score,
      httpsEnabled,
      statusCode,
      redirects: [],
      server,
      headerChecks,
      passed,
      risks,
      recommendations,
    };

    await createLog({
      eventType: 'web_audit_executed',
      userId: req.user?.userId,
      userEmail: req.user?.email,
      ip: clientIp,
      severity: score < 40 ? 'medium' : 'info',
      description: `Auditoría web ejecutada sobre ${targetUrl} — Score: ${score}/100`,
    });

    res.json(result);
  } catch (err: unknown) {
    if (err instanceof Error && err.message?.includes('Invalid URL')) {
      res.status(400).json({ message: 'URL inválida' });
      return;
    }
    throw err;
  }
};
