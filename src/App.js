import React, { useState, useEffect, useCallback } from 'react';
import { supabase, BUK_CONFIG, ADMIN_EMAILS } from './config/supabase';
import './styles/App.css';

/* ================================================================
   UTILIDADES
   ================================================================ */
const initials = (name) => name ? name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase() : '??';
const firstName = (name) => name ? name.split(' ')[0] : '';
const daysBetween = (d1, d2) => { const a = new Date(d1); const b = new Date(d2); a.setHours(0,0,0,0); b.setHours(0,0,0,0); return Math.max(0, Math.round((b - a) / 86400000)); };
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }) : '—';
const fmtDateLong = (d) => d ? new Date(d).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';
const COLORS = ['#1F6FB2', '#2C8B5D', '#8A5BB0', '#C98A2B', '#D64545', '#3A8F8F', '#7B61FF', '#E07C4F'];

/* ================================================================
   LOGIN
   ================================================================ */
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (err) throw err;
      onLogin(data.user);
    } catch (err) {
      setError(err.message === 'Invalid login credentials' ? 'Email o contraseña incorrectos' : err.message === 'Email not confirmed' ? 'Tu email no ha sido confirmado. Contacta al administrador.' : err.message);
    } finally { setLoading(false); }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) { setError('Ingresa tu correo electrónico primero.'); return; }
    setLoading(true); setError(null);
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: window.location.origin,
      });
      if (err) throw err;
      setResetSent(true);
    } catch (err) {
      setError('Error al enviar el correo: ' + err.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="login-split">
      <div className="login-brand">
        <div className="login-brand-logo">
          <img src="/logo-ferco.png" alt="Ferco Medical" className="login-logo-img" />
        </div>
        <div className="login-brand-content">
          <h1 className="login-brand-title">Retroalimentación que impulsa a tu equipo.</h1>
          <p className="login-brand-sub">Crea oportunidades de mejora, dales seguimiento continuo y mide los resultados de cada uno de tus colaboradores.</p>
        </div>
        <div className="login-brand-circle" />
      </div>

      <div className="login-form-side">
        <div className="login-form-container">
          <h2 className="login-form-title">Iniciar sesión</h2>
          <p className="login-form-subtitle">Ingresa con tu cuenta de jefe de área.</p>

          {resetSent ? (
            <div className="success-msg" style={{ marginBottom: 20 }}>
              📧 Se envió un enlace de recuperación a <strong>{email}</strong>. Revisa tu bandeja de entrada.
              <button onClick={() => setResetSent(false)} style={{ display: 'block', marginTop: 12, background: 'none', border: 'none', color: '#1F6FB2', cursor: 'pointer', fontWeight: 600, fontSize: 14, padding: 0 }}>← Volver al inicio de sesión</button>
            </div>
          ) : (
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>CORREO ELECTRÓNICO</label>
                <input type="email" className="form-input" placeholder="tucorreo@ferco-medical.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>CONTRASEÑA</label>
                <div className="password-wrapper">
                  <input type={showPass ? 'text' : 'password'} className="form-input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required style={{ paddingRight: 48 }} />
                  <button type="button" className="password-toggle" onClick={() => setShowPass(!showPass)} tabIndex={-1}>
                    {showPass ? (
                      <svg width="20" height="20" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg width="20" height="20" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>
              {error && <div className="error-msg">{error}</div>}
              <button type="submit" className="btn-login" disabled={loading}>{loading ? 'Ingresando...' : 'Ingresar'}</button>
              <button type="button" className="forgot-password" onClick={handleForgotPassword} disabled={loading}>¿Olvidó su contraseña?</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   SIDEBAR - Ahora muestra ¡Hola Nombre!
   ================================================================ */
function Sidebar({ user, screen, setScreen, isAdmin, onLogout, managerName }) {
  const name = managerName || user?.email?.split('@')[0] || '';
  const items = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'trabajadores', icon: '👥', label: 'Mis Trabajadores' },
    { id: 'historial', icon: '🕐', label: 'Historial' },
  ];
  if (isAdmin) items.push({ id: 'config', icon: '⚙️', label: 'Configuración' });

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <img src="/logo-ferco.png" alt="Ferco" className="sidebar-logo-img" />
          <div><div className="sidebar-logo-text">FERCO</div><div className="sidebar-logo-sub">RETROALIMENTACIÓN</div></div>
        </div>
      </div>
      <nav className="sidebar-nav">
        {items.map(i => (
          <button key={i.id} className={`sidebar-btn ${screen === i.id ? 'active' : ''}`} onClick={() => setScreen(i.id)}>
            <span className="sidebar-btn-icon">{i.icon}</span><span>{i.label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-user">
        <div className="sidebar-user-info">
          <div className="sidebar-avatar">{initials(name)}</div>
          <div>
            <div className="sidebar-user-name">¡Hola {firstName(name)}!</div>
            <div className="sidebar-user-role">{isAdmin ? 'Administrador' : 'Jefe / Manager'}</div>
          </div>
        </div>
        <button className="sidebar-logout" onClick={onLogout}>Cerrar sesión</button>
      </div>
    </div>
  );
}

/* ================================================================
   ADMIN VIEW TOGGLE - Tabs "Mis Trabajadores" / "Todos"
   ================================================================ */
function AdminViewToggle({ view, setView, isAdmin }) {
  if (!isAdmin) return null;
  return (
    <div className="admin-toggle">
      <button className={`admin-toggle-btn ${view === 'mine' ? 'active' : ''}`} onClick={() => setView('mine')}>👤 Mis Trabajadores</button>
      <button className={`admin-toggle-btn ${view === 'all' ? 'active' : ''}`} onClick={() => setView('all')}>👥 Todos los Trabajadores</button>
    </div>
  );
}

/* ================================================================
   DONUT CHART
   ================================================================ */
function DonutChart({ proceso, logrado }) {
  const total = proceso + logrado;
  if (total === 0) return <div style={{ textAlign: 'center', color: '#aaa', padding: '30px' }}>Sin datos</div>;
  const r = 46, circ = 2 * Math.PI * r;
  const logPct = logrado / total, procPct = proceso / total;
  return (
    <div className="donut-container">
      <svg viewBox="0 0 140 140" className="donut-svg">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#EAE6DC" strokeWidth="22" />
        <circle cx="70" cy="70" r={r} fill="none" stroke="#2C8B5D" strokeWidth="22" strokeDasharray={`${logPct * circ} ${circ}`} transform="rotate(-90 70 70)" strokeLinecap="round" />
        <circle cx="70" cy="70" r={r} fill="none" stroke="#C98A2B" strokeWidth="22" strokeDasharray={`${procPct * circ} ${circ}`} strokeDashoffset={-logPct * circ} transform="rotate(-90 70 70)" strokeLinecap="round" />
        <text x="70" y="66" textAnchor="middle" fontSize="26" fontWeight="800" fill="#333">{total}</text>
        <text x="70" y="84" textAnchor="middle" fontSize="11" fill="#888">Total</text>
      </svg>
      <div className="donut-legend">
        <div className="donut-legend-item"><div className="donut-legend-dot" style={{ background: '#C98A2B' }} /><span>En proceso: <strong>{proceso}</strong></span></div>
        <div className="donut-legend-item"><div className="donut-legend-dot" style={{ background: '#2C8B5D' }} /><span>Logradas: <strong>{logrado}</strong></span></div>
      </div>
    </div>
  );
}

/* ================================================================
   PROGRESS BAR
   ================================================================ */
function ProgressBar({ logrado, total }) {
  const pct = total > 0 ? Math.round(logrado / total * 100) : 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>Progreso del mes</span>
        <span style={{ fontWeight: 700, color: '#2C8B5D' }}>{logrado} de {total}</span>
      </div>
      <div style={{ background: '#F2F0E9', borderRadius: 99, height: 12, overflow: 'hidden' }}>
        <div style={{ width: `${Math.max(pct, 2)}%`, height: '100%', background: 'linear-gradient(90deg, #2C8B5D, #3AAF73)', borderRadius: 99, transition: 'width 0.6s ease' }} />
      </div>
      <div style={{ fontSize: 12, color: '#888', marginTop: 6 }}>
        {total === 0 ? 'Sin oportunidades registradas' : `${pct}% completado`}
      </div>
    </div>
  );
}

/* ================================================================
   MODAL
   ================================================================ */
function Modal({ children, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  );
}

/* ================================================================
   DASHBOARD
   ================================================================ */
function DashboardScreen({ myReports, allEmployees, opportunities, allOpportunities, isAdmin, adminView, setAdminView }) {
  const emps = adminView === 'all' ? allEmployees : myReports;
  const opps = adminView === 'all' ? allOpportunities : opportunities;
  const [workerFilter, setWorkerFilter] = useState('all');

  const filtered = workerFilter === 'all' ? opps : opps.filter(o => o.employee_id === workerFilter);
  const proceso = filtered.filter(o => o.status === 'proceso');
  const logrado = filtered.filter(o => o.status === 'logrado');
  const total = filtered.length;
  // eslint-disable-next-line no-unused-vars
  const tasa = total > 0 ? Math.round(logrado.length / total * 100) : 0;

  const selectedName = workerFilter === 'all' ? 'Todos' : (emps.find(e => e.id === workerFilter)?.name || '');

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><h1 className="page-title">Dashboard</h1><p className="page-subtitle">Resumen general · {fmtDateLong(new Date())}</p></div>
      </div>

      <AdminViewToggle view={adminView} setView={setAdminView} isAdmin={isAdmin} />

      <div className="dash-layout">
        {/* Panel izquierdo - Lista de trabajadores */}
        <div className="dash-workers-panel">
          <div className="dash-workers-title">TRABAJADORES</div>
          <div className="dash-worker-list">
            <button className={`dash-worker-item ${workerFilter === 'all' ? 'active' : ''}`} onClick={() => setWorkerFilter('all')}>
              <span className="dash-worker-avatar" style={{ background: '#6B7280' }}>
                <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2"><rect x="3" y="3" width="4" height="4" /><rect x="9" y="3" width="4" height="4" /><rect x="3" y="9" width="4" height="4" /><rect x="9" y="9" width="4" height="4" /></svg>
              </span>
              <span>Todos</span>
            </button>
            {emps.map((e, i) => (
              <button key={e.id} className={`dash-worker-item ${workerFilter === e.id ? 'active' : ''}`} onClick={() => setWorkerFilter(e.id)}>
                <span className="dash-worker-avatar" style={{ background: COLORS[i % COLORS.length] }}>{initials(e.name)}</span>
                <span>{e.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Panel derecho - KPIs y charts */}
        <div className="dash-content">
          {/* KPI principal */}
          <div className="dash-kpi-main">
            <div className="stat-card" style={{ flex: 1 }}>
              <div className="stat-card-label">Total de oportunidades</div>
              <div className="stat-card-value" style={{ color: '#15362C' }}>{total}</div>
            </div>
            <div className="stat-card" style={{ flex: 1 }}>
              <div className="stat-card-label">En proceso</div>
              <div className="stat-card-value gold">{proceso.length}</div>
            </div>
            <div className="stat-card" style={{ flex: 1 }}>
              <div className="stat-card-label">Logradas</div>
              <div className="stat-card-value green">{logrado.length}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', color: '#888', fontSize: 14, padding: '0 16px' }}>{selectedName}</div>
          </div>

          {/* Charts */}
          <div className="charts-grid">
            <div className="chart-card">
              <div className="chart-title">Distribución</div>
              <div style={{ fontSize: 13, color: '#888', marginTop: -14, marginBottom: 16 }}>{selectedName}</div>
              <DonutChart proceso={proceso.length} logrado={logrado.length} />
            </div>
            <div className="chart-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="chart-title" style={{ marginBottom: 2 }}>Progreso de {new Date().toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })}</div>
                  <div style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>{selectedName}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 32, fontWeight: 800, color: '#15362C' }}>{logrado.length}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>de {total} cerradas</div>
                </div>
              </div>
              <ProgressBar logrado={logrado.length} total={total} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   MIS TRABAJADORES (+ Vista "Todos" para admins)
   ================================================================ */
function TrabajadoresScreen({ myReports, allEmployees, opportunities, allOpportunities, followups, onOpenNueva, onOpenSeguimiento, onOpenLograr, expandedWorkers, toggleWorker, expandedOpps, toggleOpp, isAdmin, adminView, setAdminView }) {
  const [segFilter, setSegFilter] = useState('all'); // 'all', 'con', 'sin' (solo en vista "todos")

  const emps = adminView === 'all' ? allEmployees : myReports;
  const opps = adminView === 'all' ? allOpportunities : opportunities;
  const activeOpps = opps.filter(o => o.status === 'proceso');

  // Filtro de seguimiento (solo vista "todos")
  const filteredEmps = adminView === 'all' && segFilter !== 'all'
    ? emps.filter(e => {
        const hasOpp = activeOpps.some(o => o.employee_id === e.id);
        return segFilter === 'con' ? hasOpp : !hasOpp;
      })
    : emps;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><h1 className="page-title">Mis Trabajadores</h1><p className="page-subtitle">{adminView === 'all' ? 'Vista general de todos los trabajadores' : 'Seguimientos en proceso'}</p></div>
        {adminView !== 'all' && (
          <button className="btn-nueva" onClick={onOpenNueva}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><line x1="9" y1="4" x2="9" y2="14"/><line x1="4" y1="9" x2="14" y2="9"/></svg>
            Nueva oportunidad
          </button>
        )}
      </div>

      <AdminViewToggle view={adminView} setView={setAdminView} isAdmin={isAdmin} />

      {/* Filtro de seguimiento (solo vista "todos") */}
      {adminView === 'all' && (
        <div className="tabs" style={{ marginBottom: 16 }}>
          <button className={`tab ${segFilter === 'all' ? 'active' : ''}`} onClick={() => setSegFilter('all')}>Todos ({emps.length})</button>
          <button className={`tab ${segFilter === 'con' ? 'active' : ''}`} onClick={() => setSegFilter('con')}>Con seguimiento ({emps.filter(e => activeOpps.some(o => o.employee_id === e.id)).length})</button>
          <button className={`tab ${segFilter === 'sin' ? 'active' : ''}`} onClick={() => setSegFilter('sin')}>Sin seguimiento ({emps.filter(e => !activeOpps.some(o => o.employee_id === e.id)).length})</button>
        </div>
      )}

      <div style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>
        {adminView === 'all'
          ? `${filteredEmps.length} trabajadores · ${activeOpps.length} oportunidades en proceso`
          : `Oportunidades en proceso: ${activeOpps.length}`}
      </div>

      {filteredEmps.length === 0 && <div className="empty-state">No hay empleados para mostrar.</div>}

      {filteredEmps.map((emp, idx) => {
        const empOpps = activeOpps.filter(o => o.employee_id === emp.id);
        const isExpanded = expandedWorkers[emp.id];
        const color = COLORS[idx % COLORS.length];

        return (
          <div key={emp.id} className="worker-card">
            <div className="worker-header" onClick={() => toggleWorker(emp.id)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="worker-avatar" style={{ background: color }}>{initials(emp.name)}</div>
                <div>
                  <div className="worker-name">{emp.name}</div>
                  <div className="worker-position">
                    {emp.position || 'Sin puesto'}
                    {adminView === 'all' && emp.manager_name && <span style={{ color: '#1F6FB2' }}> · Jefe: {firstName(emp.manager_name)}</span>}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className={`count-badge ${empOpps.length > 0 ? 'has-opps' : ''}`}>
                  {empOpps.length === 0 ? 'Sin oportunidades activas' : `${empOpps.length} oportunidad${empOpps.length > 1 ? 'es' : ''}`}
                </span>
                <svg width="18" height="18" fill="none" stroke="#999" strokeWidth="2" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}><path d="M4 7l5 5 5-5"/></svg>
              </div>
            </div>

            {isExpanded && (
              <div className="worker-opps">
                {empOpps.length === 0 ? (
                  <div style={{ padding: 20, color: '#aaa', fontSize: 14, textAlign: 'center' }}>Sin oportunidades activas</div>
                ) : empOpps.map(opp => {
                  const oppFollowups = followups.filter(f => f.opportunity_id === opp.id);
                  const daysAgo = daysBetween(opp.created_at, new Date());
                  const lastFu = oppFollowups.length > 0 ? oppFollowups[oppFollowups.length - 1] : null;
                  const lastFuDays = lastFu ? daysBetween(lastFu.created_at, new Date()) : null;
                  const isOppExpanded = expandedOpps[opp.id];

                  return (
                    <div key={opp.id} className="opp-card">
                      <div className="opp-desc">{opp.description}</div>
                      <div className="opp-meta">
                        <span>Creada {fmtDate(opp.created_at)} · hace {daysAgo} día{daysAgo !== 1 ? 's' : ''}</span>
                        <span>{lastFu ? `Último seg. ${fmtDate(lastFu.created_at)} · hace ${lastFuDays} día${lastFuDays !== 1 ? 's' : ''}` : 'Sin seguimientos aún'}</span>
                      </div>
                      {oppFollowups.length > 0 && (
                        <button className="followup-toggle" onClick={() => toggleOpp(opp.id)}>
                          {isOppExpanded ? 'Ocultar seguimientos' : `Ver ${oppFollowups.length} seguimiento${oppFollowups.length > 1 ? 's' : ''}`}
                        </button>
                      )}
                      {isOppExpanded && oppFollowups.map(fu => (
                        <div key={fu.id} className="followup-item">
                          <div className="followup-date">{fmtDate(fu.created_at)}</div>
                          <div className="followup-text">{fu.observation}</div>
                        </div>
                      ))}
                      {/* Solo mostrar botones si es "Mis Trabajadores" o admin */}
                      {(adminView !== 'all') && (
                        <div className="opp-actions">
                          <button className="btn-seg" onClick={() => onOpenSeguimiento(opp)}>Seguimiento</button>
                          <button className="btn-lograr" onClick={() => onOpenLograr(opp)}>Logrado</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ================================================================
   HISTORIAL
   ================================================================ */
function HistorialScreen({ myReports, allEmployees, opportunities, allOpportunities, followups, onOpenDetalle, isAdmin, adminView, setAdminView }) {
  const [workerFilter, setWorkerFilter] = useState('all');
  const emps = adminView === 'all' ? allEmployees : myReports;
  const opps = adminView === 'all' ? allOpportunities : opportunities;
  const logradas = opps.filter(o => o.status === 'logrado');
  const filtered = workerFilter === 'all' ? logradas : logradas.filter(o => o.employee_id === workerFilter);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Historial</h1>
        <p className="page-subtitle">Oportunidades cerradas</p>
      </div>

      <AdminViewToggle view={adminView} setView={setAdminView} isAdmin={isAdmin} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <span style={{ fontSize: 14, color: '#555', fontWeight: 600 }}>{filtered.length} oportunidades cerradas</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: '#888' }}>Filtrar:</span>
          <select className="form-select" style={{ width: 'auto', padding: '8px 12px' }} value={workerFilter} onChange={e => setWorkerFilter(e.target.value)}>
            <option value="all">Todos los trabajadores</option>
            {emps.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">No hay oportunidades cerradas</div>
      ) : (
        <div className="hist-list">
          {filtered.map(opp => {
            const emp = allEmployees.find(e => e.id === opp.employee_id);
            const empIdx = allEmployees.indexOf(emp);
            const color = COLORS[(empIdx >= 0 ? empIdx : 0) % COLORS.length];
            const duration = opp.duration_days || daysBetween(opp.created_at, opp.closed_at || new Date());
            const oppFollowups = followups.filter(f => f.opportunity_id === opp.id);

            return (
              <div key={opp.id} className="hist-card" onClick={() => onOpenDetalle(opp)}>
                <div style={{ display: 'flex', gap: 14 }}>
                  <div className="worker-avatar" style={{ background: color, flexShrink: 0, width: 36, height: 36, fontSize: 13 }}>{initials(emp?.name || '')}</div>
                  <div style={{ flex: 1 }}>
                    <div className="hist-desc">{opp.description}</div>
                    <div className="hist-meta">
                      {emp?.name} · Creada {fmtDate(opp.created_at)} · Cerrada {fmtDate(opp.closed_at)} · {duration} días
                      {adminView === 'all' && emp?.manager_name && <span> · Jefe: {firstName(emp.manager_name)}</span>}
                    </div>
                    <div className="hist-obs"><strong>Observación final:</strong> {opp.final_observation || 'Sin observación.'}</div>
                    {oppFollowups.length > 0 && <div className="hist-followups">{oppFollowups.length} seguimiento{oppFollowups.length > 1 ? 's' : ''}</div>}
                  </div>
                  <div className="badge badge-green" style={{ alignSelf: 'flex-start', flexShrink: 0 }}>Logrado</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ================================================================
   CONFIGURACIÓN (SOLO ADMIN)
   ================================================================ */
function ConfigScreen({ employees, onEmployeesUpdated, onAssignmentsUpdated }) {
  const [tab, setTab] = useState('sync');
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResults, setSyncResults] = useState(null);
  const [search, setSearch] = useState('');
  const [reassignEmp, setReassignEmp] = useState(null);
  const [newMgrId, setNewMgrId] = useState('');
  const [reassignReason, setReassignReason] = useState('');

  const syncBuk = async () => {
    setSyncLoading(true); setSyncResults(null);
    try {
      let allBukEmps = [];
      let page = 1;
      let hasMore = true;
      while (hasMore) {
        const res = await fetch(`${BUK_CONFIG.baseUrl}/employees?page=${page}`, {
          headers: { 'auth_token': BUK_CONFIG.authToken, 'Accept': 'application/json' }
        });
        if (!res.ok) throw new Error(`Error Buk API: ${res.status}`);
        const bukData = await res.json();
        const pageEmps = bukData.data || [];
        if (pageEmps.length === 0) { hasMore = false; } else { allBukEmps = [...allBukEmps, ...pageEmps]; page++; if (page > 10) hasMore = false; }
      }
      const activeEmps = allBukEmps.filter(b => b.status === 'activo');
      const bukMap = new Map(allBukEmps.map(b => [b.id, b.full_name || '']));
      const { data: local } = await supabase.from('employees').select('buk_employee_id');
      const localSet = new Set((local || []).map(e => e.buk_employee_id));
      let nuevos = 0, actualizados = 0, errores = 0;
      for (const b of activeEmps) {
        const bossId = b.current_job?.boss?.id || null;
        const empData = { buk_employee_id: b.id, name: b.full_name || `Empleado ${b.id}`, email: b.email || null, position: b.current_job?.role?.name || null, department: b.current_job?.area?.name || null, manager_id: bossId, manager_name: bossId ? (bukMap.get(bossId) || null) : null, status_in_buk: 'active', synced_at: new Date().toISOString(), updated_at: new Date().toISOString() };
        if (!localSet.has(b.id)) {
          empData.is_active_in_feedback = true; empData.created_at = new Date().toISOString();
          const { error } = await supabase.from('employees').insert([empData]);
          if (error) { console.error('Insert error:', b.full_name, error.message); errores++; } else { nuevos++; }
        } else {
          const { error } = await supabase.from('employees').update({ name: empData.name, email: empData.email, position: empData.position, department: empData.department, manager_id: empData.manager_id, manager_name: empData.manager_name, status_in_buk: empData.status_in_buk, synced_at: empData.synced_at, updated_at: empData.updated_at }).eq('buk_employee_id', b.id);
          if (error) { console.error('Update error:', b.full_name, error.message); errores++; } else { actualizados++; }
        }
      }
      await supabase.from('audit_log').insert([{ action: 'BUK_SYNC', details: `${nuevos} nuevos, ${actualizados} actualizados, ${errores} errores` }]);
      setSyncResults({ success: true, nuevos, actualizados, errores, totalBuk: allBukEmps.length, activos: activeEmps.length, timestamp: new Date().toLocaleString('es-PE') });
      onEmployeesUpdated();
    } catch (err) { setSyncResults({ success: false, error: err.message }); }
    finally { setSyncLoading(false); }
  };

  const toggleEmp = async (id, isActive) => {
    await supabase.from('employees').update({ is_active_in_feedback: !isActive, updated_at: new Date().toISOString() }).eq('id', id);
    onEmployeesUpdated();
  };

  const handleReassign = async () => {
    if (!reassignEmp || !newMgrId) return;
    await supabase.from('feedback_assignments').insert([{ employee_id: reassignEmp.id, original_manager_id: reassignEmp.manager_id, assigned_to_manager_id: newMgrId, override_reason: reassignReason }]);
    await supabase.from('audit_log').insert([{ action: 'REASSIGN', employee_id: reassignEmp.id, details: `${reassignEmp.name} reasignado. Motivo: ${reassignReason}` }]);
    setReassignEmp(null); setNewMgrId(''); setReassignReason('');
    onAssignmentsUpdated();
    alert('Reasignación guardada. El cambio es efectivo de inmediato.');
  };

  const filt = employees.filter(e => !search || e.name?.toLowerCase().includes(search.toLowerCase()));
  const activos = filt.filter(e => e.is_active_in_feedback);
  const inactivos = filt.filter(e => !e.is_active_in_feedback);

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Configuración</h1><p className="page-subtitle">Administra empleados, sincronización y reasignaciones</p></div>
      <div className="tabs">
        <button className={`tab ${tab === 'sync' ? 'active' : ''}`} onClick={() => setTab('sync')}>🔄 Actualizar desde Buk</button>
        <button className={`tab ${tab === 'toggle' ? 'active' : ''}`} onClick={() => setTab('toggle')}>👥 Activar / Desactivar</button>
        <button className={`tab ${tab === 'reassign' ? 'active' : ''}`} onClick={() => setTab('reassign')}>🔀 Reasignar</button>
      </div>

      {tab === 'sync' && (
        <div className="config-section">
          <div className="config-section-title">🔄 Sincronizar con Buk</div>
          <div className="config-section-desc">Actualiza empleados, jerarquías y puestos desde Buk HR. Las reasignaciones manuales se mantienen intactas.</div>
          <div className="sync-status"><div className="sync-status-dot" /><div className="sync-status-text">{employees.length > 0 ? `${employees.length} empleados en el sistema` : 'Sin empleados sincronizados'}</div></div>
          <button className="btn-warning" onClick={syncBuk} disabled={syncLoading}>{syncLoading ? '⏳ Sincronizando...' : '🔄 Actualizar desde Buk'}</button>
          {syncResults && (
            <div className="sync-results" style={{ marginTop: 16 }}>
              {syncResults.success ? (<><div className="sync-result-item">✅ Sincronización exitosa — {syncResults.timestamp}</div><div className="sync-result-item">🆕 {syncResults.nuevos} nuevos empleados</div><div className="sync-result-item">🔄 {syncResults.actualizados} actualizados</div>{syncResults.errores > 0 && <div className="sync-result-item">⚠️ {syncResults.errores} errores (ver consola F12)</div>}<div className="sync-result-item">📊 {syncResults.totalBuk} en Buk total, {syncResults.activos} activos</div></>) : (<div className="error-msg">{syncResults.error}</div>)}
            </div>
          )}
        </div>
      )}

      {tab === 'toggle' && (
        <div className="config-section">
          <div className="config-section-title">👥 Activar / Desactivar Trabajadores</div>
          <div className="config-section-desc">Los trabajadores desactivados no aparecerán en el sistema</div>
          <input type="text" className="form-input" placeholder="Buscar empleado..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: 20 }} />
          {activos.length > 0 && <><h4 style={{ color: '#2C8B5D', marginBottom: 12 }}>✅ Activos ({activos.length})</h4><div className="employee-list">{activos.map(e => (<div key={e.id} className="employee-item"><div className="employee-info"><div className="employee-name">{e.name}</div><div className="employee-detail">{e.position || 'Sin puesto'} — {e.department || 'Sin área'}</div></div><button className="btn-danger" onClick={() => toggleEmp(e.id, true)}>Desactivar</button></div>))}</div></>}
          {inactivos.length > 0 && <><h4 style={{ color: '#dc3545', marginBottom: 12, marginTop: 24 }}>❌ Inactivos ({inactivos.length})</h4><div className="employee-list">{inactivos.map(e => (<div key={e.id} className="employee-item" style={{ opacity: 0.7 }}><div className="employee-info"><div className="employee-name">{e.name}</div><div className="employee-detail">{e.position || 'Sin puesto'} — {e.department || 'Sin área'}</div></div><button className="btn-success" onClick={() => toggleEmp(e.id, false)}>Activar</button></div>))}</div></>}
          {employees.length === 0 && <div className="empty-state">No hay empleados. Sincroniza con Buk primero.</div>}
        </div>
      )}

      {tab === 'reassign' && (
        <div className="config-section">
          <div className="config-section-title">🔀 Reasignar Trabajadores</div>
          <div className="config-section-desc">Cambia quién califica a quién. Se mantiene incluso si actualizas desde Buk.</div>
          <div className="form-group"><label>Empleado a reasignar</label>
            <select className="form-select" value={reassignEmp?.id || ''} onChange={e => { const emp = employees.find(em => em.id === e.target.value); setReassignEmp(emp || null); }}>
              <option value="">— Selecciona un empleado —</option>
              {employees.filter(e => e.is_active_in_feedback).map(e => <option key={e.id} value={e.id}>{e.name} — Manager: {e.manager_name || 'No asignado'}</option>)}
            </select>
          </div>
          {reassignEmp && (
            <div style={{ background: '#f8f9fa', padding: 20, borderRadius: 10, marginTop: 16 }}>
              <h4 style={{ marginBottom: 12 }}>Reasignando: <span style={{ color: '#1F6FB2' }}>{reassignEmp.name}</span></h4>
              <p style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>Manager actual: <strong>{reassignEmp.manager_name || 'No asignado'}</strong></p>
              <div className="form-group"><label>Nuevo calificador</label><select className="form-select" value={newMgrId} onChange={e => setNewMgrId(e.target.value)}><option value="">— Selecciona —</option>{employees.filter(e => e.id !== reassignEmp.id && e.is_active_in_feedback).map(e => <option key={e.id} value={e.id}>{e.name} — {e.position || ''}</option>)}</select></div>
              <div className="form-group"><label>Motivo</label><input className="form-input" placeholder="Ej: Cambio de equipo..." value={reassignReason} onChange={e => setReassignReason(e.target.value)} /></div>
              <div style={{ display: 'flex', gap: 12 }}><button className="btn-primary" onClick={handleReassign} disabled={!newMgrId} style={{ flex: 1 }}>Confirmar</button><button className="btn-secondary" onClick={() => { setReassignEmp(null); setNewMgrId(''); setReassignReason(''); }}>Cancelar</button></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ================================================================
   CAMBIAR CONTRASEÑA (Recovery)
   ================================================================ */
function ResetPasswordScreen({ onDone }) {
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPass.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.');
    if (newPass !== confirmPass) return setError('Las contraseñas no coinciden.');
    setLoading(true); setError(null);
    try {
      const { error: err } = await supabase.auth.updateUser({ password: newPass });
      if (err) throw err;
      setSuccess(true);
      setTimeout(() => onDone(), 2000);
    } catch (err) {
      setError('Error al cambiar la contraseña: ' + err.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="login-split">
      <div className="login-brand">
        <div className="login-brand-logo"><img src="/logo-ferco.png" alt="Ferco Medical" className="login-logo-img" /></div>
        <div className="login-brand-content">
          <h1 className="login-brand-title">Establece tu nueva contraseña.</h1>
          <p className="login-brand-sub">Ingresa una contraseña segura para tu cuenta.</p>
        </div>
        <div className="login-brand-circle" />
      </div>
      <div className="login-form-side">
        <div className="login-form-container">
          <h2 className="login-form-title">Nueva contraseña</h2>
          <p className="login-form-subtitle">Ingresa y confirma tu nueva contraseña.</p>
          {success ? (
            <div className="success-msg">✅ Contraseña actualizada correctamente. Redirigiendo...</div>
          ) : (
            <form onSubmit={handleReset}>
              <div className="form-group">
                <label>NUEVA CONTRASEÑA</label>
                <div className="password-wrapper">
                  <input type={showPass ? 'text' : 'password'} className="form-input" placeholder="Mínimo 6 caracteres" value={newPass} onChange={e => setNewPass(e.target.value)} required style={{ paddingRight: 48 }} />
                  <button type="button" className="password-toggle" onClick={() => setShowPass(!showPass)} tabIndex={-1}>
                    {showPass ? (
                      <svg width="20" height="20" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg width="20" height="20" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>CONFIRMAR CONTRASEÑA</label>
                <input type={showPass ? 'text' : 'password'} className="form-input" placeholder="Repite la contraseña" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} required />
              </div>
              {error && <div className="error-msg">{error}</div>}
              <button type="submit" className="btn-login" disabled={loading}>{loading ? 'Guardando...' : 'Cambiar contraseña'}</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   APP PRINCIPAL
   ================================================================ */
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState('dashboard');
  const [employees, setEmployees] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [assignments, setAssignments] = useState([]);

  // UI state
  const [modal, setModal] = useState(null);
  const [activeOpp, setActiveOpp] = useState(null);
  const [expandedWorkers, setExpandedWorkers] = useState({});
  const [expandedOpps, setExpandedOpps] = useState({});
  const [adminView, setAdminView] = useState('mine'); // 'mine' | 'all'
  const [recoveryMode, setRecoveryMode] = useState(false);

  // Form state
  const [fEmpleado, setFEmpleado] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fObs, setFObs] = useState('');
  const [fLograrObs, setFLograrObs] = useState('');
  const [formError, setFormError] = useState('');

  const isAdmin = user ? ADMIN_EMAILS.includes(user.email) : false;

  const loadEmployees = useCallback(async () => {
    const { data } = await supabase.from('employees').select('*').order('name');
    setEmployees(data || []);
  }, []);
  const loadOpportunities = useCallback(async () => {
    const { data } = await supabase.from('opportunities').select('*').order('created_at', { ascending: false });
    setOpportunities(data || []);
  }, []);
  const loadFollowups = useCallback(async () => {
    const { data } = await supabase.from('followups').select('*').order('created_at', { ascending: true });
    setFollowups(data || []);
  }, []);
  const loadAssignments = useCallback(async () => {
    const { data } = await supabase.from('feedback_assignments').select('*').order('created_at', { ascending: false });
    setAssignments(data || []);
  }, []);
  const loadAll = useCallback(() => { loadEmployees(); loadOpportunities(); loadFollowups(); loadAssignments(); }, [loadEmployees, loadOpportunities, loadFollowups, loadAssignments]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryMode(true);
      }
      setUser(session?.user || null);
      setLoading(false);
    });
    return () => subscription?.unsubscribe();
  }, []);
  useEffect(() => { if (user) loadAll(); }, [user, loadAll]);

  const handleLogout = async () => { await supabase.auth.signOut(); setUser(null); setScreen('dashboard'); };
  const toggleWorker = (id) => setExpandedWorkers(s => ({ ...s, [id]: !s[id] }));
  const toggleOpp = (id) => setExpandedOpps(s => ({ ...s, [id]: !s[id] }));

  const openNueva = () => { setModal('nueva'); setFEmpleado(''); setFDesc(''); setFormError(''); };
  const openSeguimiento = (opp) => { setModal('seguimiento'); setActiveOpp(opp); setFObs(''); setFormError(''); };
  const openLograr = (opp) => { setModal('lograr'); setActiveOpp(opp); setFLograrObs(''); setFormError(''); };
  const openDetalle = (opp) => { setModal('detalle'); setActiveOpp(opp); };
  const closeModal = () => { setModal(null); setActiveOpp(null); setFormError(''); };

  const guardarNueva = async () => {
    if (!fEmpleado) return setFormError('Selecciona un empleado.');
    if (fDesc.trim().length < 10) return setFormError('La descripción debe tener al menos 10 caracteres.');
    const mgr = employees.find(e => e.email === user?.email);
    await supabase.from('opportunities').insert([{ employee_id: fEmpleado, manager_id: mgr?.id || null, description: fDesc.trim(), status: 'proceso' }]);
    setExpandedWorkers(s => ({ ...s, [fEmpleado]: true }));
    closeModal(); setScreen('trabajadores'); loadOpportunities();
  };
  const guardarSeguimiento = async () => {
    if (fObs.trim().length < 5) return setFormError('La observación debe tener al menos 5 caracteres.');
    await supabase.from('followups').insert([{ opportunity_id: activeOpp.id, observation: fObs.trim() }]);
    setExpandedOpps(s => ({ ...s, [activeOpp.id]: true }));
    closeModal(); loadFollowups();
  };
  const confirmarLogrado = async () => {
    const duration = daysBetween(activeOpp.created_at, new Date());
    await supabase.from('opportunities').update({ status: 'logrado', closed_at: new Date().toISOString(), duration_days: duration, final_observation: fLograrObs.trim() || 'Objetivo cumplido.', updated_at: new Date().toISOString() }).eq('id', activeOpp.id);
    closeModal(); setScreen('historial'); loadOpportunities();
  };

  if (loading) return <div className="loading-container"><div className="loading-spinner" /></div>;
  if (recoveryMode && user) return <ResetPasswordScreen onDone={() => setRecoveryMode(false)} />;
  if (!user) return <LoginScreen onLogin={setUser} />;

  // Encontrar al manager logueado
  const currentManager = employees.find(e => e.email === user?.email);
  const myBukId = currentManager?.buk_employee_id;
  const myId = currentManager?.id; // UUID
  const activeEmps = employees.filter(e => e.is_active_in_feedback);

  // Construir mapa de reasignaciones: employee_id → assigned_to_manager_id (última reasignación)
  const assignmentMap = new Map();
  // assignments ya viene ordenado por created_at DESC, así que el primero es el más reciente
  for (const a of assignments) {
    if (!assignmentMap.has(a.employee_id)) {
      assignmentMap.set(a.employee_id, a.assigned_to_manager_id);
    }
  }

  // Trabajadores directos: considerar reasignaciones
  const myDirectReports = activeEmps.filter(e => {
    const override = assignmentMap.get(e.id);
    if (override) {
      // Tiene reasignación → pertenece al manager asignado
      return override === myId;
    }
    // Sin reasignación → usa el manager de Buk
    return e.manager_id === myBukId;
  });
  const myDirectReportIds = new Set(myDirectReports.map(e => e.id));
  const myOpportunities = opportunities.filter(o => myDirectReportIds.has(o.employee_id));

  // Todos (para admins)
  const allActiveIds = new Set(activeEmps.map(e => e.id));
  const allOpportunities = opportunities.filter(o => allActiveIds.has(o.employee_id));

  const activeEmp = activeOpp ? employees.find(e => e.id === activeOpp.employee_id) : null;

  return (
    <div className="app-layout">
      <Sidebar user={user} screen={screen} setScreen={setScreen} isAdmin={isAdmin} onLogout={handleLogout} managerName={currentManager?.name} />
      <main className="main-content">
        {screen === 'dashboard' && <DashboardScreen myReports={myDirectReports} allEmployees={activeEmps} opportunities={myOpportunities} allOpportunities={allOpportunities} isAdmin={isAdmin} adminView={adminView} setAdminView={setAdminView} />}
        {screen === 'trabajadores' && <TrabajadoresScreen myReports={myDirectReports} allEmployees={activeEmps} opportunities={myOpportunities} allOpportunities={allOpportunities} followups={followups} onOpenNueva={openNueva} onOpenSeguimiento={openSeguimiento} onOpenLograr={openLograr} expandedWorkers={expandedWorkers} toggleWorker={toggleWorker} expandedOpps={expandedOpps} toggleOpp={toggleOpp} isAdmin={isAdmin} adminView={adminView} setAdminView={setAdminView} />}
        {screen === 'historial' && <HistorialScreen myReports={myDirectReports} allEmployees={activeEmps} opportunities={myOpportunities} allOpportunities={allOpportunities} followups={followups} onOpenDetalle={openDetalle} isAdmin={isAdmin} adminView={adminView} setAdminView={setAdminView} />}
        {screen === 'config' && isAdmin && <ConfigScreen employees={employees} onEmployeesUpdated={loadEmployees} onAssignmentsUpdated={loadAssignments} />}
        {screen === 'config' && !isAdmin && <div className="error-msg">No tienes acceso a esta sección</div>}
      </main>

      {/* MODAL: NUEVA OPORTUNIDAD */}
      {modal === 'nueva' && (
        <Modal onClose={closeModal}>
          <div className="modal-title">Nueva oportunidad de mejora</div>
          <div className="modal-subtitle">Asigna una oportunidad a un colaborador de tu equipo.</div>
          <div className="form-group"><label>Colaborador</label>
            <select className="form-select" value={fEmpleado} onChange={e => setFEmpleado(e.target.value)}>
              <option value="">— Selecciona un colaborador —</option>
              {myDirectReports.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Descripción de la oportunidad</label>
            <textarea className="form-textarea" placeholder="Describe la oportunidad de mejora con suficiente detalle..." value={fDesc} onChange={e => setFDesc(e.target.value)} />
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{fDesc.trim().length} caracteres · mínimo 10</div>
          </div>
          {formError && <div className="error-msg">{formError}</div>}
          <div className="modal-actions">
            <button className="btn-secondary" onClick={closeModal}>Cancelar</button>
            <button className="btn-primary" onClick={guardarNueva} style={{ flex: 1 }}>Guardar</button>
          </div>
        </Modal>
      )}

      {/* MODAL: SEGUIMIENTO */}
      {modal === 'seguimiento' && activeOpp && (
        <Modal onClose={closeModal}>
          <div className="modal-title">Agregar seguimiento</div>
          <div className="modal-context">
            <div className="modal-context-label">Oportunidad</div>
            <div className="modal-context-text">{activeOpp.description}</div>
            <div className="modal-context-meta">Colaborador: {activeEmp?.name || '—'}</div>
          </div>
          <div className="form-group"><label>Observación</label>
            <textarea className="form-textarea" placeholder="Describe avances, observaciones..." value={fObs} onChange={e => setFObs(e.target.value)} />
          </div>
          {formError && <div className="error-msg">{formError}</div>}
          <div className="modal-actions">
            <button className="btn-secondary" onClick={closeModal}>Cancelar</button>
            <button className="btn-primary" onClick={guardarSeguimiento} style={{ flex: 1 }}>Guardar seguimiento</button>
          </div>
        </Modal>
      )}

      {/* MODAL: LOGRADO paso 1 */}
      {modal === 'lograr' && activeOpp && (
        <Modal onClose={closeModal}>
          <div className="modal-title">Marcar como Logrado</div>
          <div className="modal-context">
            <div className="modal-context-label">Oportunidad</div>
            <div className="modal-context-text">{activeOpp.description}</div>
            <div className="modal-context-meta">Colaborador: {activeEmp?.name || '—'}</div>
          </div>
          <div className="form-group"><label>Observación final (opcional)</label>
            <textarea className="form-textarea" placeholder="Resultados obtenidos..." value={fLograrObs} onChange={e => setFLograrObs(e.target.value)} />
          </div>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={closeModal}>Cancelar</button>
            <button className="btn-lograr-confirm" onClick={() => setModal('confirmarLograr')}>Confirmar</button>
          </div>
        </Modal>
      )}

      {/* MODAL: LOGRADO paso 2 */}
      {modal === 'confirmarLograr' && activeOpp && (
        <Modal onClose={closeModal}>
          <div className="modal-title">¿Cerrar esta oportunidad?</div>
          <div style={{ fontSize: 14, color: '#666', lineHeight: 1.6, marginBottom: 20 }}>
            Se marcará como <b style={{ color: '#2C8B5D' }}>Lograda</b> y se moverá al historial. No se puede deshacer.
          </div>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setModal('lograr')}>Volver</button>
            <button className="btn-primary" onClick={confirmarLogrado} style={{ flex: 1 }}>Sí, cerrar oportunidad</button>
          </div>
        </Modal>
      )}

      {/* MODAL: DETALLE */}
      {modal === 'detalle' && activeOpp && (
        <Modal onClose={closeModal}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div className="modal-title" style={{ marginBottom: 0 }}>{activeOpp.description}</div>
            <span className="badge badge-green">Logrado</span>
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, fontSize: 13, color: '#888', flexWrap: 'wrap' }}>
            <span>Colaborador: <strong>{activeEmp?.name}</strong></span><span>·</span>
            <span>Creada: {fmtDate(activeOpp.created_at)}</span><span>·</span>
            <span>Cerrada: {fmtDate(activeOpp.closed_at)}</span><span>·</span>
            <span>{activeOpp.duration_days || 0} días</span>
          </div>
          <div style={{ background: '#f0fff4', padding: 16, borderRadius: 10, marginBottom: 16, borderLeft: '4px solid #2C8B5D' }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Observación final</div>
            <div style={{ fontSize: 14, color: '#333' }}>{activeOpp.final_observation || 'Sin observación.'}</div>
          </div>
          {(() => { const fus = followups.filter(f => f.opportunity_id === activeOpp.id); return fus.length > 0 && (
            <div><div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Seguimientos ({fus.length})</div>
              {fus.map(fu => (<div key={fu.id} className="followup-item"><div className="followup-date">{fmtDate(fu.created_at)}</div><div className="followup-text">{fu.observation}</div></div>))}
            </div>
          ); })()}
          <div className="modal-actions" style={{ marginTop: 20 }}><button className="btn-secondary" onClick={closeModal} style={{ width: '100%' }}>Cerrar</button></div>
        </Modal>
      )}
    </div>
  );
}