import { useState, FormEvent } from 'react';
import { Search, Shield, CheckCircle, XCircle, AlertTriangle, Globe, Lock, Unlock, Server } from 'lucide-react';
import api from '../services/api';
import { AuditResult } from '../types';

const ScoreBar: React.FC<{ score: number }> = ({ score }) => {
  const color = score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500';
  const label = score >= 70 ? 'Bueno' : score >= 40 ? 'Mejorable' : 'Deficiente';
  const textColor = score >= 70 ? 'text-green-400' : score >= 40 ? 'text-amber-400' : 'text-red-400';
  return (
    <div className="flex items-center gap-4">
      <div className="flex-1 bg-slate-800 rounded-full h-3">
        <div className={`h-3 rounded-full transition-all duration-700 ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-lg font-bold font-mono ${textColor}`}>{score}/100</span>
      <span className={`badge ${textColor} border`}>{label}</span>
    </div>
  );
};

const SEVERITY_COLORS: Record<string, string> = {
  low: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  medium: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  high: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  critical: 'text-red-400 bg-red-500/10 border-red-500/30',
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Search size={18} className="text-blue-400" /> WebSec Auditor
        </h2>
        <p className="text-slate-500 text-xs mt-0.5">Análisis pasivo de cabeceras HTTP y configuración de seguridad</p>
      </div>

      <div className="card p-6">
        <form onSubmit={handleAudit} className="space-y-4">
          <div>
            <label className="label">URL a analizar</label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="input pl-9"
                  placeholder="https://ejemplo.com"
                  type="text"
                />
              </div>
              <button type="submit" className="btn-primary flex items-center gap-2" disabled={loading || !url.trim()}>
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analizando...</>
                ) : (
                  <><Search size={15} /> Auditar</>
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-slate-500">Ejemplos:</span>
            {EXAMPLE_URLS.map((u) => (
              <button key={u} type="button" onClick={() => setUrl(u)} className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2">
                {u}
              </button>
            ))}
          </div>
        </form>

        <div className="mt-4 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
          <p className="text-xs text-amber-400/80">
            Esta herramienta realiza únicamente análisis pasivo (cabeceras HTTP). No realiza escaneos agresivos, fuzzing ni explotación de vulnerabilidades.
          </p>
        </div>

        {error && (
          <div className="mt-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded-lg">{error}</div>
        )}
      </div>

      {result && (
        <div className="space-y-5 animate-in fade-in">
          <div className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-slate-500 text-xs font-mono">{new Date(result.timestamp).toLocaleString('es-ES')}</p>
                <h3 className="text-white font-bold mt-1 break-all">{result.url}</h3>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${result.httpsEnabled ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                {result.httpsEnabled ? <Lock size={13} /> : <Unlock size={13} />}
                <span className="text-xs font-medium">{result.httpsEnabled ? 'HTTPS' : 'HTTP'}</span>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs text-slate-500 mb-2">Score de seguridad</p>
              <ScoreBar score={result.score} />
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-white font-mono">{result.statusCode || 'N/A'}</p>
                <p className="text-xs text-slate-500">Código HTTP</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-400 font-mono">{result.passed.length}</p>
                <p className="text-xs text-slate-500">Checks superados</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-red-400 font-mono">{result.risks.length}</p>
                <p className="text-xs text-slate-500">Riesgos detectados</p>
              </div>
            </div>

            {result.server && (
              <div className="mt-3 flex items-center gap-2 p-2.5 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                <Server size={13} className="text-amber-400" />
                <span className="text-xs text-amber-400">Servidor expuesto: <span className="font-mono">{result.server}</span></span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="card p-5">
              <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                <CheckCircle size={14} className="text-green-400" /> Checks Superados
              </h3>
              {result.passed.length === 0 ? (
                <p className="text-slate-600 text-sm">Ningún check superado.</p>
              ) : (
                <ul className="space-y-1.5">
                  {result.passed.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm">
                      <CheckCircle size={13} className="text-green-400 mt-0.5 shrink-0" />
                      <span className="text-slate-300">{p}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card p-5">
              <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                <XCircle size={14} className="text-red-400" /> Riesgos Detectados
              </h3>
              {result.risks.length === 0 ? (
                <p className="text-slate-600 text-sm">No se detectaron riesgos.</p>
              ) : (
                <ul className="space-y-2">
                  {result.risks.map((r, i) => (
                    <li key={i} className={`p-2.5 rounded-lg border text-sm ${SEVERITY_COLORS[r.severity] || 'text-slate-400 bg-slate-800/50 border-slate-700/50'}`}>
                      <p className="font-medium text-xs">{r.title}</p>
                      <p className="text-xs opacity-80 mt-0.5">{r.description}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
              <Shield size={14} className="text-blue-400" /> Cabeceras HTTP Analizadas
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    {['Cabecera', 'Estado', 'Valor', 'Impacto'].map((h) => (
                      <th key={h} className="text-left text-xs text-slate-500 font-mono uppercase pb-2 pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.headerChecks.map((h) => (
                    <tr key={h.header} className="border-b border-slate-800/30">
                      <td className="py-2.5 pr-4 font-mono text-xs text-slate-300">{h.header}</td>
                      <td className="py-2.5 pr-4">
                        {h.present ? (
                          <CheckCircle size={14} className="text-green-400" />
                        ) : (
                          <XCircle size={14} className="text-red-400" />
                        )}
                      </td>
                      <td className="py-2.5 pr-4 text-xs text-slate-500 font-mono max-w-xs truncate">
                        {h.value || '—'}
                      </td>
                      <td className="py-2.5">
                        <span className={`badge border ${SEVERITY_COLORS[h.severity] || ''}`}>{h.severity}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {result.recommendations.length > 0 && (
            <div className="card p-5">
              <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-400" /> Recomendaciones
              </h3>
              <ul className="space-y-2">
                {result.recommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-400">
                    <span className="text-amber-400 font-mono text-xs mt-0.5 shrink-0">{String(i + 1).padStart(2, '0')}.</span>
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
