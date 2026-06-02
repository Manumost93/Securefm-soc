export function downloadCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = row[h];
      if (val === null || val === undefined) return '';
      const str = String(val).replace(/"/g, '""');
      return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
    }).join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ticketsToCSV(tickets: any[]) {
  return tickets.map((t) => ({
    ID: t.id.slice(0, 8),
    Titulo: t.title,
    Categoria: t.category,
    Ubicacion: t.location,
    Prioridad: t.priority,
    Estado: t.status,
    Tecnico: t.assignee?.name || 'Sin asignar',
    Creador: t.creator?.name || '',
    Creado: new Date(t.createdAt).toLocaleString('es-ES'),
    Actualizado: new Date(t.updatedAt).toLocaleString('es-ES'),
  }));
}

export function logsToCSV(logs: any[]) {
  return logs.map((l) => ({
    ID: l.id.slice(0, 8),
    Fecha: new Date(l.createdAt).toLocaleString('es-ES'),
    Tipo: l.eventType,
    Usuario: l.userEmail || '',
    IP: l.ip || '',
    Pais: l.country || '',
    Severidad: l.severity,
    Descripcion: l.description,
  }));
}
