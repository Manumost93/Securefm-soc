import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// El seed usa su propia instancia para poder desconectar limpiamente al final
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de base de datos...');

  await prisma.ticketComment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.securityLog.deleteMany();
  await prisma.user.deleteMany();

  const hashedAdmin = await bcrypt.hash('Admin123!', 12);
  const hashedTech = await bcrypt.hash('Tech123!', 12);
  const hashedViewer = await bcrypt.hash('Viewer123!', 12);

  const admin = await prisma.user.create({
    data: { email: 'admin@securefm.local', password: hashedAdmin, name: 'Admin SecureFM', role: 'admin' },
  });
  const tech = await prisma.user.create({
    data: { email: 'tech@securefm.local', password: hashedTech, name: 'Carlos Técnico', role: 'technician' },
  });
  const tech2 = await prisma.user.create({
    data: { email: 'tech2@securefm.local', password: hashedTech, name: 'María López', role: 'technician' },
  });
  const viewer = await prisma.user.create({
    data: { email: 'viewer@securefm.local', password: hashedViewer, name: 'Visitante Viewer', role: 'viewer' },
  });

  console.log('✅ Usuarios creados');

  const ticketsData = [
    { title: 'Avería cuadro eléctrico principal', description: 'El cuadro eléctrico principal tiene un diferencial que salta intermitentemente causando cortes de luz en planta baja.', category: 'Electricidad', location: 'Cuadro eléctrico principal', priority: 'critical', status: 'in_progress', assigneeId: tech.id },
    { title: 'Aire acondicionado no enfría en sala de reuniones', description: 'El split de la sala de reuniones A no alcanza la temperatura configurada. Posible problema en el compresor o gas refrigerante bajo.', category: 'Climatización', location: 'Sala de reuniones A - Planta 1', priority: 'high', status: 'open', assigneeId: tech.id },
    { title: 'Fuga de agua en aseos planta 2', description: 'Se ha detectado humedad en el falso techo del pasillo de la planta 2, procedente de los aseos superiores. Requiere inspección urgente.', category: 'Fontanería', location: 'Aseos planta 2', priority: 'high', status: 'open', assigneeId: tech2.id },
    { title: 'Cámara de seguridad sin imagen - Parking', description: 'La cámara IP del parking zona B no transmite imagen desde hace 48h. Podría ser problema de red o de la propia cámara.', category: 'Seguridad', location: 'Parking zona B', priority: 'critical', status: 'in_progress', assigneeId: tech.id },
    { title: 'Ordenadores lentos en oficina administración', description: 'Los equipos de la oficina de administración tardan más de 5 minutos en arrancar. Posible disco duro en mal estado o malware.', category: 'IT', location: 'Oficina administración', priority: 'medium', status: 'open', assigneeId: tech2.id },
    { title: 'Revisión preventiva calderas', description: 'Revisión periódica trimestral de las calderas de calefacción. Incluye limpieza de filtros y verificación de presiones.', category: 'Climatización', location: 'Sala técnica sótano', priority: 'low', status: 'pending', assigneeId: tech.id },
    { title: 'Alumbrado de emergencia fundido - Escalera norte', description: 'Varias luminarias de emergencia de la escalera norte no funcionan. Incumplimiento normativa contra incendios.', category: 'Electricidad', location: 'Escalera norte - todos los pisos', priority: 'high', status: 'resolved', assigneeId: tech.id },
    { title: 'Limpieza técnica sala de servidores', description: 'Limpieza anual de filtros, ventiladores y bandejas de servidores. Coordinación requerida con IT para parada controlada.', category: 'Limpieza técnica', location: 'Sala de servidores - planta 0', priority: 'medium', status: 'pending', assigneeId: tech2.id },
    { title: 'Puerta de emergencia bloqueada - Almacén', description: 'La puerta de emergencia del almacén no abre correctamente desde el interior. El mecanismo antipánico está defectuoso.', category: 'Prevención', location: 'Almacén planta baja', priority: 'critical', status: 'open', assigneeId: tech.id },
    { title: 'Mantenimiento ascensores ITV anual', description: 'Coordinación con empresa mantenedora para revisión ITV anual obligatoria de los dos ascensores del edificio.', category: 'Mantenimiento general', location: 'Ascensores - zonas común', priority: 'medium', status: 'closed', assigneeId: tech2.id },
    { title: 'Router WiFi caído zona de carga', description: 'El punto de acceso WiFi de la zona de carga no responde. Los carretilleros no pueden usar las tablets de gestión.', category: 'IT', location: 'Zona de carga - nave', priority: 'high', status: 'in_progress', assigneeId: tech2.id },
    { title: 'Grieta en pared sala técnica', description: 'Se ha detectado una grieta horizontal en la pared de la sala técnica de aproximadamente 50cm. Requiere valoración estructural.', category: 'Mantenimiento general', location: 'Sala técnica planta 1', priority: 'high', status: 'open', assigneeId: null },
    { title: 'Sistema de control de acceso - error de lectora', description: 'La lectora de tarjeta de acceso del acceso principal falla intermitentemente. Algunos empleados no pueden acceder.', category: 'Seguridad', location: 'Acceso principal', priority: 'high', status: 'resolved', assigneeId: tech.id },
    { title: 'Revisión extintores cuadrimestral', description: 'Revisión periódica obligatoria de los 24 extintores del edificio. Empresa externa ya programada.', category: 'Prevención', location: 'Todo el edificio', priority: 'low', status: 'resolved', assigneeId: tech2.id },
    { title: 'Iluminación LED zona parking exterior', description: 'Sustitución de luminarias de vapor de sodio por LED en el parking exterior. Mejora eficiencia y seguridad.', category: 'Electricidad', location: 'Parking exterior', priority: 'low', status: 'pending', assigneeId: null },
  ];

  for (const t of ticketsData) {
    const created = new Date();
    created.setDate(created.getDate() - Math.floor(Math.random() * 60));
    await prisma.ticket.create({
      data: {
        ...t,
        creatorId: admin.id,
        createdAt: created,
      },
    });
  }

  console.log('✅ Tickets creados');

  const tickets = await prisma.ticket.findMany({ take: 5 });
  for (const ticket of tickets) {
    await prisma.ticketComment.createMany({
      data: [
        { content: 'Ticket recibido y asignado al equipo técnico.', action: 'assigned', ticketId: ticket.id, userId: admin.id },
        { content: 'Revisado in situ. Se confirma el problema. Pendiente de piezas.', ticketId: ticket.id, userId: tech.id },
      ],
    });
  }

  console.log('✅ Comentarios creados');

  const ips = ['192.168.1.100', '10.0.0.5', '203.0.113.42', '198.51.100.23', '45.89.106.200', '185.220.101.5', '91.108.4.120', '172.16.0.1'];
  const countries = ['ES', 'US', 'DE', 'RU', 'CN', 'FR', 'BR', 'MX'];
  const agents = ['Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'curl/7.68.0', 'python-requests/2.28.0', 'Nmap/7.80'];

  const logsData = [
    { eventType: 'login_success', userEmail: 'admin@securefm.local', ip: ips[0], country: 'ES', severity: 'info', description: 'Login exitoso desde red corporativa' },
    { eventType: 'login_failed', userEmail: 'admin@securefm.local', ip: ips[4], country: 'RU', severity: 'high', description: 'Intento de login fallido - IP sospechosa rusa' },
    { eventType: 'login_failed', userEmail: 'admin@securefm.local', ip: ips[4], country: 'RU', severity: 'high', description: 'Segundo intento fallido consecutivo' },
    { eventType: 'login_failed', userEmail: 'root@securefm.local', ip: ips[5], country: 'CN', severity: 'critical', description: 'Intento de login con usuario inexistente root' },
    { eventType: 'login_failed', userEmail: 'admin@localhost', ip: ips[5], country: 'CN', severity: 'critical', description: 'Ataque de fuerza bruta detectado' },
    { eventType: 'login_success', userEmail: 'tech@securefm.local', ip: ips[0], country: 'ES', severity: 'info', description: 'Login técnico desde oficina' },
    { eventType: 'login_failed', userEmail: 'viewer@securefm.local', ip: ips[6], country: 'BR', severity: 'medium', description: 'Contraseña incorrecta - 3er intento' },
    { eventType: 'access_denied', userEmail: 'viewer@securefm.local', ip: ips[1], country: 'ES', severity: 'medium', description: 'Acceso denegado a endpoint /api/users - rol insuficiente' },
    { eventType: 'access_denied', userEmail: 'tech@securefm.local', ip: ips[1], country: 'ES', severity: 'low', description: 'Intento de acceso a panel de administración' },
    { eventType: 'ticket_created', userEmail: 'tech@securefm.local', ip: ips[0], country: 'ES', severity: 'info', description: 'Ticket de avería eléctrica creado' },
    { eventType: 'ticket_created', userEmail: 'admin@securefm.local', ip: ips[0], country: 'ES', severity: 'info', description: 'Ticket de seguridad crítica creado' },
    { eventType: 'ticket_deleted', userEmail: 'admin@securefm.local', ip: ips[0], country: 'ES', severity: 'medium', description: 'Ticket #ERR-001 eliminado por administrador' },
    { eventType: 'role_changed', userEmail: 'admin@securefm.local', ip: ips[0], country: 'ES', severity: 'high', description: 'Rol de usuario tech2 cambiado de viewer a technician' },
    { eventType: 'suspicious_ip', userEmail: null, ip: ips[5], country: 'CN', severity: 'critical', description: 'IP en lista negra intentando acceso al sistema' },
    { eventType: 'suspicious_ip', userEmail: null, ip: ips[4], country: 'RU', severity: 'high', description: 'Múltiples peticiones desde IP sospechosa' },
    { eventType: 'rate_limit_triggered', userEmail: null, ip: ips[4], country: 'RU', severity: 'high', description: 'Rate limit alcanzado en endpoint /api/auth/login' },
    { eventType: 'rate_limit_triggered', userEmail: null, ip: ips[5], country: 'CN', severity: 'critical', description: 'Posible ataque DDoS - 1000 req/min' },
    { eventType: 'web_audit_executed', userEmail: 'admin@securefm.local', ip: ips[0], country: 'ES', severity: 'info', description: 'Auditoría web sobre https://example.com - Score: 45/100' },
    { eventType: 'web_audit_executed', userEmail: 'tech@securefm.local', ip: ips[1], country: 'ES', severity: 'medium', description: 'Auditoría web sobre http://old-site.example - Score: 15/100 (HTTP sin cifrar)' },
    { eventType: 'login_success', userEmail: 'admin@securefm.local', ip: ips[0], country: 'ES', severity: 'info', description: 'Login desde dispositivo de confianza' },
    { eventType: 'login_failed', userEmail: 'superadmin@securefm.local', ip: ips[6], country: 'BR', severity: 'high', description: 'Intento de acceso con usuario inexistente superadmin' },
    { eventType: 'access_denied', userEmail: 'viewer@securefm.local', ip: ips[1], country: 'ES', severity: 'low', description: 'Intento de crear ticket sin permisos suficientes' },
    { eventType: 'login_failed', userEmail: 'administrator@securefm.local', ip: ips[7], country: 'MX', severity: 'medium', description: 'Enumeración de usuarios detectada' },
    { eventType: 'suspicious_ip', userEmail: null, ip: '185.220.101.34', country: 'DE', severity: 'critical', description: 'IP de nodo TOR detectada intentando acceso' },
    { eventType: 'ticket_created', userEmail: 'tech@securefm.local', ip: ips[1], country: 'ES', severity: 'info', description: 'Incidencia de seguridad física reportada' },
    { eventType: 'login_success', userEmail: 'tech2@securefm.local', ip: ips[0], country: 'ES', severity: 'info', description: 'Login técnico - sesión iniciada' },
    { eventType: 'role_changed', userEmail: 'admin@securefm.local', ip: ips[0], country: 'ES', severity: 'high', description: 'Privilegios temporales asignados para mantenimiento' },
    { eventType: 'web_audit_executed', userEmail: 'admin@securefm.local', ip: ips[0], country: 'ES', severity: 'info', description: 'Auditoría sobre https://google.com - Score: 82/100' },
    { eventType: 'login_failed', userEmail: 'admin@securefm.local', ip: '45.33.32.156', country: 'US', severity: 'high', description: 'Múltiples fallos de autenticación - posible brute force' },
    { eventType: 'rate_limit_triggered', userEmail: null, ip: '45.33.32.156', country: 'US', severity: 'high', description: 'Rate limit en login desde IP americana sospechosa' },
    { eventType: 'access_denied', userEmail: null, ip: ips[5], country: 'CN', severity: 'critical', description: 'Intento de acceso sin token a endpoint protegido /api/admin' },
    { eventType: 'suspicious_ip', userEmail: null, ip: '91.108.4.120', country: 'RU', severity: 'high', description: 'Scanner de vulnerabilidades detectado (Nmap fingerprinting)' },
    { eventType: 'login_success', userEmail: 'viewer@securefm.local', ip: ips[1], country: 'ES', severity: 'info', description: 'Viewer autenticado - solo lectura' },
    { eventType: 'ticket_deleted', userEmail: 'admin@securefm.local', ip: ips[0], country: 'ES', severity: 'medium', description: 'Ticket duplicado eliminado por admin' },
    { eventType: 'web_audit_executed', userEmail: 'tech@securefm.local', ip: ips[0], country: 'ES', severity: 'info', description: 'Auditoría sobre https://github.com - Score: 91/100' },
    { eventType: 'login_failed', userEmail: 'backup@securefm.local', ip: ips[4], country: 'RU', severity: 'critical', description: 'Intento de acceso a cuenta de backup desde exterior' },
    { eventType: 'suspicious_ip', userEmail: null, ip: '185.220.101.5', country: 'DE', severity: 'critical', description: 'IP de red anonimizadora - acceso bloqueado por WAF' },
    { eventType: 'role_changed', userEmail: 'admin@securefm.local', ip: ips[0], country: 'ES', severity: 'medium', description: 'Permisos de viewer ajustados tras revisión de accesos' },
    { eventType: 'access_denied', userEmail: 'tech@securefm.local', ip: ips[1], country: 'ES', severity: 'low', description: 'Técnico intentó acceder a gestión de usuarios' },
    { eventType: 'login_success', userEmail: 'admin@securefm.local', ip: ips[0], country: 'ES', severity: 'info', description: 'Sesión administrativa iniciada para revisión semanal' },
  ];

  for (let i = 0; i < logsData.length; i++) {
    const created = new Date();
    created.setHours(created.getHours() - i * 2 - Math.floor(Math.random() * 5));
    await prisma.securityLog.create({
      data: {
        ...logsData[i],
        userAgent: agents[i % agents.length],
        createdAt: created,
      },
    });
  }

  console.log('✅ Logs de seguridad creados');
  console.log('\n🎉 Seed completado exitosamente!\n');
  console.log('Usuarios de prueba:');
  console.log('  admin@securefm.local    / Admin123!  (admin)');
  console.log('  tech@securefm.local     / Tech123!   (technician)');
  console.log('  tech2@securefm.local    / Tech123!   (technician)');
  console.log('  viewer@securefm.local   / Viewer123! (viewer)\n');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
