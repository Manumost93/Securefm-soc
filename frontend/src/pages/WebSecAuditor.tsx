import { useState, FormEvent } from 'react';
import { Search, Shield, CheckCircle, XCircle, AlertTriangle, Globe, Lock, Unlock, Server } from 'lucide-react';
import api from '../services/api';
import { AuditResult } from '../types';

const ScoreBar: React.FC<{ score: number }> = ({ score }) => {
  const color = score >= 70 ? '#5F6F52' : score >= 40 ? '#C58A2B' : '#9F3A32';
  const label = score >= 70 ? 'Bueno' : score >= 40 ? 'Mejorable' : 'Deficiente';
  return (
    <div className="flex items-center gap-4">
      <div className="flex-1 rounded-full h-2" style={{ background: '#EFE6D8' }}>
        <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="font-sans font-bold text-lg" style={{ color }}>{score}/100</span>
      <span className="badge" style={{ color, background: `${color}18`, borderColor: `${color}40` }}>{label}</span>
    </div>
  );
};

const SEV_STYLE: Record<string, { fg: string; bg: string; border: string }> = {
  low:      { fg: '#6F6558', bg: 'rgba(111,101,88,0.1)',  border: 'rgba(111,101,88,0.22)'  },
  medium:   { fg: '#C58A2B', bg: 'rgba(197,138,43,0.1)', border: 'rgba(197,138,43,0.22)'  },
  high:     { fg: '#B08A57', bg: 'rgba(176,138,87,0.12)', border: 'rgba(176,138,87,0.28)'  },
  critical: { fg: '#9F3A32', bg: 'rgba(159,58,50,0.1)',  border: 'rgba(159,58,50,0.28)'   },
};

const EXAMPLE_URLS = ['https://example.com', 'https://github.com', 'https://httpbin.org'];

const WebSecAuditorPage: React.FC = () => {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAudit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!url.trim()) return;
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const res = await api.post<AuditResult>('/audit', { url: url.trim() });
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al ejecutar la auditoría');
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="font-sans font-semibold text-base flex items-center gap-2" style={{ color: '#1F1C18' }}>
          <Search size={16} style={{ color: '#B08A57' }} /> WebSec Auditor
        </h2>
        <p className="font-sans text-xs mt-0.5" style={{ color: '#A89C8E' }}>
          Análisis pasivo de cabeceras HTTP y configuración de seguridad
        </p>
      </div>

      <div className="card p-6">
        <form onSubmit={handleAudit} className="space-y-4">
          <div>
            <label className="label">URL a analizar</label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Globe size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#C4B8AA' }} />
                <input value={url} onChange={(e) => setUrl(e.target.value)}
                  className="input pl-9" placeholder="https://ejemplo.com" type="text" />
              </div>
              <button type="submit" className="btn-primary flex items-center gap-2" disabled={loading || !url.trim()}>
                {loading ? (
                  <><span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,252,246,0.3)', borderTopColor: '#FFFCF6' }} /> Analizando...</>
                ) : (
                  <><Search size={14} /> Auditar</>
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <span className="font-sans text-xs" style={{ color: '#A89C8E' }}>Ejemplos:</span>
            {EXAMPLE_URLS.map((u) => (
              <button key={u} type="button" onClick={() => setUrl(u)}
                className="font-sans text-xs transition-colors underline underline-offset-2"
                style={{ color: '#B08A57' }}
                onMouseEnter={e => e.currentTarget.style.color = '#8A6B3E'}
                onMouseLeave={e => e.currentTarget.style.color = '#B08A57'}>
                {u}
              </button>
            ))}
          </div>
        </form>

        <div className="mt-4 p-3 rounded-md" style={{ background: 'rgba(197,138,43,0.07)', border: '1px solid rgba(197,138,43,0.2)' }}>
          <p className="font-sans text-xs" style={{ color: '#C58A2B' }}>
            Esta herramienta realiza únicamente análisis pasivo (cabeceras HTTP). No realiza escaneos agresivos, fuzzing ni explotación de vulnerabilidades.
          </p>
        </div>

        {error && (
          <div className="mt-4 text-sm px-3 py-2.5 rounded-md" style={{
            background: 'rgba(159,58,50,0.07)', border: '1px solid rgba(159,58,50,0.2)', color: '#9F3A32',
          }}>{error}</div>
        )}
      </div>

      {result && (
        <div className="space-y-5">
          <div className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-mono text-xs" style={{ color: '#C4B8AA' }}>{new Date(result.timestamp).toLocaleString('es-ES')}</p>
                <h3 className="font-sans font-semibold mt-1 break-all" style={{ color: '#1F1C18' }}>{result.url}</h3>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md" style={{
                background: result.httpsEnabled ? 'rgba(95,111,82,0.1)' : 'rgba(159,58,50,0.08)',
                border: `1px solid ${result.httpsEnabled ? 'rgba(95,111,82,0.25)' : 'rgba(159,58,50,0.2)'}`,
                color: result.httpsEnabled ? '#5F6F52' : '#9F3A32',
              }}>
                {result.httpsEnabled ? <Lock size={13} /> : <Unlock size={13} />}
                <span className="font-sans text-xs font-medium">{result.httpsEnabled ? 'HTTPS' : 'HTTP'}</span>
              </div>
            </div>

            <div className="mb-4">
              <p className="font-sans text-xs mb-2" style={{ color: '#A89C8E' }}>Score de seguridad</p>
              <ScoreBar score={result.score} />
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { value: result.statusCode || 'N/A', label: 'Código HTTP', color: '#1F1C18' },
                { value: result.passed.length, label: 'Checks superados', color: '#5F6F52' },
                { value: result.risks.length, label: 'Riesgos detectados', color: '#9F3A32' },
              ].map(({ value, label, color }) => (
                <div key={label} className="rounded-md p-3 text-center" style={{ background: '#F6F1E8', border: '1px solid #E5D8C5' }}>
                  <p className="font-sans font-bold text-2xl" style={{ color }}>{value}</p>
                  <p className="font-sans text-xs mt-0.5" style={{ color: '#A89C8E' }}>{label}</p>
                </div>
              ))}
            </div>

            {result.server && (
              <div className="mt-3 flex items-center gap-2 p-2.5 rounded-md" style={{
                background: 'rgba(197,138,43,0.07)', border: '1px solid rgba(197,138,43,0.2)',
              }}>
                <Server size={13} style={{ color: '#C58A2B' }} />
                <span className="font-sans text-xs" style={{ color: '#C58A2B' }}>
                  Servidor expuesto: <span className="font-mono">{result.server}</span>
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="card p-5">
              <h3 className="font-sans font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: '#1F1C18' }}>
                <CheckCircle size={14} style={{ color: '#5F6F52' }} /> Checks superados
              </h3>
              {result.passed.length === 0 ? (
                <p className="font-sans text-sm" style={{ color: '#A89C8E' }}>Ningún check superado.</p>
              ) : (
                <ul className="space-y-1.5">
                  {result.passed.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm">
                      <CheckCircle size={13} style={{ color: '#5F6F52', marginTop: 2, flexShrink: 0 }} />
                      <span style={{ color: '#6F6558' }}>{p}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card p-5">
              <h3 className="font-sans font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: '#1F1C18' }}>
                <XCircle size={14} style={{ color: '#9F3A32' }} /> Riesgos detectados
              </h3>
              {result.risks.length === 0 ? (
                <p className="font-sans text-sm" style={{ color: '#A89C8E' }}>No se detectaron riesgos.</p>
              ) : (
                <ul className="space-y-2">
                  {result.risks.map((r, i) => {
                    const sc = SEV_STYLE[r.severity] || SEV_STYLE.low;
                    return (
                      <li key={i} className="p-2.5 rounded-md border text-sm"
                        style={{ color: sc.fg, background: sc.bg, borderColor: sc.border }}>
                        <p className="font-medium text-xs">{r.title}</p>
                        <p className="text-xs mt-0.5" style={{ opacity: 0.8 }}>{r.description}</p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-sans font-semibold text-sm mb-4 flex items-center gap-2" style={{ color: '#1F1C18' }}>
              <Shield size={14} style={{ color: '#B08A57' }} /> Cabeceras HTTP analizadas
            </h3>
            <div className="overflow-x-auto">
              <table className="cyber-table">
                <thead>
                  <tr>
                    {['Cabecera', 'Estado', 'Valor', 'Impacto'].map((h) => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {result.headerChecks.map((h) => {
                    const sc = SEV_STYLE[h.severity];
                    return (
                      <tr key={h.header}>
                        <td className="font-mono text-xs" style={{ color: '#6F6558' }}>{h.header}</td>
                        <td>
                          {h.present
                            ? <CheckCircle size={14} style={{ color: '#5F6F52' }} />
                            : <XCircle size={14} style={{ color: '#9F3A32' }} />}
                        </td>
                        <td className="font-mono text-xs max-w-xs truncate" style={{ color: '#A89C8E' }}>{h.value || '—'}</td>
                        <td>
                          <span className="badge" style={{ color: sc?.fg, background: sc?.bg, borderColor: sc?.border }}>{h.severity}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {result.recommendations.length > 0 && (
            <div className="card p-5">
              <h3 className="font-sans font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: '#1F1C18' }}>
                <AlertTriangle size={14} style={{ color: '#C58A2B' }} /> Recomendaciones
              </h3>
              <ul className="space-y-2">
                {result.recommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: '#6F6558' }}>
                    <span className="font-mono text-xs shrink-0" style={{ color: '#C58A2B', marginTop: 2 }}>
                      {String(i + 1).padStart(2, '0')}.
                    </span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WebSecAuditorPage;
