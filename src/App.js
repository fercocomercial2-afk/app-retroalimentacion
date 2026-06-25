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
   ESQUEMAS DE REGISTROS SANITARIOS
   ================================================================ */
const RS_SCHEMAS = {
  dm: {
    table: 'rs_dispositivos_medicos', codigo: 'FOR-GT-001', nombre: 'Dispositivos Médicos',
    titleField: 'producto', codeField: 'registro_sanitario',
    fields: [
      { key: 'registro_sanitario', label: 'Registro Sanitario', type: 'text', required: true },
      { key: 'producto', label: 'Producto', type: 'text', required: true },
      { key: 'composicion', label: 'Composición', type: 'textarea' },
      { key: 'nombre_comun', label: 'Nombre común', type: 'text' },
      { key: 'presentacion', label: 'Presentación', type: 'textarea' },
      { key: 'tiempo_vida_util', label: 'Tiempo de vida útil', type: 'text' },
      { key: 'temperatura_almacenamiento', label: 'Temperatura de almacenamiento', type: 'text' },
      { key: 'fabricante', label: 'Fabricante', type: 'text' },
      { key: 'pais_fabricacion', label: 'País de fabricación', type: 'text' },
      { key: 'clase', label: 'Clase', type: 'text' },
      { key: 'rubro', label: 'Rubro', type: 'text' },
      { key: 'f_autorizacion', label: 'Fecha de autorización', type: 'date' },
      { key: 'f_vencimiento', label: 'Fecha de vencimiento', type: 'date', required: true },
      { key: 'estado', label: 'Estado', type: 'select', options: ['VIGENTE', 'EN REINSCRIPCIÓN', 'PARA REINSCRIPCIÓN'] },
      { key: 'n_expediente', label: 'N° de expediente', type: 'text' },
      { key: 'observaciones', label: 'Observaciones', type: 'textarea' },
    ]
  },
  cosm: {
    table: 'rs_cosmeticos', codigo: 'FOR-GT-002', nombre: 'Cosméticos',
    titleField: 'producto', codeField: 'nso',
    fields: [
      { key: 'nso', label: 'NSO', type: 'text', required: true },
      { key: 'producto', label: 'Producto', type: 'text', required: true },
      { key: 'denominacion_generica', label: 'Denominación genérica', type: 'text' },
      { key: 'tiempo_vida_util', label: 'Tiempo de vida útil', type: 'text' },
      { key: 'presentacion', label: 'Presentación', type: 'textarea' },
      { key: 'fabricante', label: 'Fabricante', type: 'text' },
      { key: 'pais_fabricacion', label: 'País de fabricación', type: 'text' },
      { key: 'rubro', label: 'Rubro', type: 'text' },
      { key: 'f_autorizacion', label: 'Fecha de autorización', type: 'date' },
      { key: 'f_vencimiento', label: 'Fecha de vencimiento', type: 'date', required: true },
      { key: 'estado', label: 'Estado', type: 'select', options: ['VIGENTE', 'EN REINSCRIPCIÓN', 'PARA REINSCRIPCIÓN'] },
      { key: 'n_expediente', label: 'N° de expediente', type: 'text' },
      { key: 'observaciones', label: 'Observaciones', type: 'textarea' },
    ]
  },
  pf: {
    table: 'rs_producto_farmaceutico', codigo: 'FOR-GT-003', nombre: 'Producto Farmacéutico',
    titleField: 'nombre', codeField: 'registro_sanitario',
    fields: [
      { key: 'registro_sanitario', label: 'Registro Sanitario', type: 'text', required: true },
      { key: 'nombre', label: 'Nombre', type: 'text', required: true },
      { key: 'concentracion', label: 'Concentración', type: 'text' },
      { key: 'forma_farmaceutica', label: 'Forma farmacéutica', type: 'text' },
      { key: 'fabricante', label: 'Fabricante', type: 'text' },
      { key: 'pais_fabricacion', label: 'País de fabricación', type: 'text' },
      { key: 'rubro', label: 'Rubro', type: 'text' },
      { key: 'f_autorizacion', label: 'Fecha de autorización', type: 'date' },
      { key: 'f_vencimiento', label: 'Fecha de vencimiento', type: 'date', required: true },
      { key: 'tipo_tramite', label: 'Tipo de trámite', type: 'text' },
      { key: 'estado', label: 'Estado', type: 'select', options: ['VIGENTE', 'EN REINSCRIPCIÓN', 'PARA REINSCRIPCIÓN'] },
      { key: 'suce', label: 'SUCE', type: 'text' },
      { key: 'n_expediente', label: 'N° de expediente', type: 'text' },
    ]
  },
  digesa: {
    table: 'rs_digesa', codigo: 'FOR-GT-004', nombre: 'DIGESA',
    titleField: 'producto', codeField: 'registro_sanitario',
    fields: [
      { key: 'registro_sanitario', label: 'Registro Sanitario', type: 'text', required: true },
      { key: 'producto', label: 'Producto', type: 'text', required: true },
      { key: 'composicion', label: 'Composición', type: 'textarea' },
      { key: 'presentacion', label: 'Presentación', type: 'textarea' },
      { key: 'tiempo_vida_util', label: 'Tiempo de vida útil', type: 'text' },
      { key: 'temperatura_almacenamiento', label: 'Temperatura de almacenamiento', type: 'text' },
      { key: 'fabricante', label: 'Fabricante', type: 'text' },
      { key: 'pais_fabricacion', label: 'País de fabricación', type: 'text' },
      { key: 'f_autorizacion', label: 'Fecha de autorización', type: 'date' },
      { key: 'f_vencimiento', label: 'Fecha de vencimiento', type: 'date', required: true },
      { key: 'estado', label: 'Estado', type: 'select', options: ['VIGENTE', 'EN REINSCRIPCIÓN', 'PARA REINSCRIPCIÓN'] },
      { key: 'suce', label: 'SUCE', type: 'text' },
      { key: 'n_expediente', label: 'N° de expediente', type: 'text' },
    ]
  },
  cert: {
    table: 'certificaciones_digemid', codigo: 'DIGEMID', nombre: 'Certificaciones',
    titleField: 'descripcion', codeField: 'n_certificado',
    fields: [
      { key: 'n_certificado', label: 'N° Certificado', type: 'text', required: true },
      { key: 'descripcion', label: 'Descripción', type: 'text', required: true },
      { key: 'condiciones_almacenamiento', label: 'Condiciones de almacenamiento', type: 'textarea' },
      { key: 'almacenes', label: 'Almacenes', type: 'textarea' },
      { key: 'f_inicio_validez', label: 'Fecha de inicio de validez', type: 'date' },
      { key: 'f_vencimiento', label: 'Fecha de vencimiento', type: 'date', required: true },
      { key: 'estado', label: 'Estado', type: 'select', options: ['VIGENTE', 'EN REINSCRIPCIÓN', 'PARA REINSCRIPCIÓN'] },
      { key: 'n_expediente', label: 'N° de expediente', type: 'text' },
    ]
  },
};

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
function Sidebar({ user, screen, setScreen, isAdmin, onLogout, managerName, notifCount, hasRegistrosAccess }) {
  const name = managerName || user?.email?.split('@')[0] || '';
  const items = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'trabajadores', icon: '👥', label: 'Mis Trabajadores' },
    { id: 'historial', icon: '🕐', label: 'Historial' },
    { id: 'notificaciones', icon: '🔔', label: 'Notificaciones' },
  ];
  if (hasRegistrosAccess) items.push({ id: 'registros', icon: '🧪', label: 'Registros Sanitarios' });
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
            {i.id === 'notificaciones' && notifCount > 0 && <span className="sidebar-badge">{notifCount}</span>}
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
   TEXTO EXPANDIBLE ("Ver más...") — respeta saltos de línea
   ================================================================ */
function ExpandableText({ text, limit = 150, className = '' }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;
  const isLong = text.length > limit;
  const shown = expanded || !isLong ? text : text.slice(0, limit).trimEnd() + '…';
  return (
    <span className={className}>
      <span style={{ whiteSpace: 'pre-wrap' }}>{shown}</span>
      {isLong && (
        <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} style={{ background: 'none', border: 'none', color: '#1F6FB2', fontWeight: 600, fontSize: 12, cursor: 'pointer', marginLeft: 6, padding: 0 }}>
          {expanded ? 'Ver menos' : 'Ver más'}
        </button>
      )}
    </span>
  );
}

/* ================================================================
   DASHBOARD
   ================================================================ */
function DashboardScreen({ myReports, allEmployees, opportunities, allOpportunities, categories, isAdmin, adminView, setAdminView }) {
  const emps = adminView === 'all' ? allEmployees : myReports;
  const opps = adminView === 'all' ? allOpportunities : opportunities;
  const [workerFilter, setWorkerFilter] = useState('all');

  const filtered = workerFilter === 'all' ? opps : opps.filter(o => o.employee_id === workerFilter);
  const proyectoCat = categories.find(c => c.name === 'Proyectos');
  const soloOpps = filtered.filter(o => o.category_id !== proyectoCat?.id);
  const soloProyectos = filtered.filter(o => o.category_id === proyectoCat?.id);

  const proceso = soloOpps.filter(o => o.status === 'proceso');
  const logrado = soloOpps.filter(o => o.status === 'logrado');
  const total = soloOpps.length;

  const proyProceso = soloProyectos.filter(o => o.status === 'proceso');
  const proyLogrado = soloProyectos.filter(o => o.status === 'logrado');
  const proyTotal = soloProyectos.length;

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
          {/* KPI principal: Oportunidades */}
          <div className="dash-kpi-label">OPORTUNIDADES</div>
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
          </div>

          {/* KPI: Proyectos */}
          <div className="dash-kpi-label" style={{ marginTop: 16 }}>PROYECTOS</div>
          <div className="dash-kpi-main">
            <div className="stat-card" style={{ flex: 1 }}>
              <div className="stat-card-label">Total de proyectos</div>
              <div className="stat-card-value" style={{ color: '#15362C' }}>{proyTotal}</div>
            </div>
            <div className="stat-card" style={{ flex: 1 }}>
              <div className="stat-card-label">En proceso</div>
              <div className="stat-card-value gold">{proyProceso.length}</div>
            </div>
            <div className="stat-card" style={{ flex: 1 }}>
              <div className="stat-card-label">Logrados</div>
              <div className="stat-card-value green">{proyLogrado.length}</div>
            </div>
          </div>

          {/* Charts */}
          <div className="charts-grid">
            <div className="chart-card">
              <div className="chart-title">Distribución (Oportunidades)</div>
              <DonutChart proceso={proceso.length} logrado={logrado.length} />
            </div>
            <div className="chart-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="chart-title" style={{ marginBottom: 2 }}>Progreso de {new Date().toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })}</div>
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
function TrabajadoresScreen({ myReports, allEmployees, opportunities, allOpportunities, followups, categories, tasks, onOpenNueva, onOpenSeguimiento, onOpenLograr, onOpenEliminar, onOpenEditarOpp, onOpenNuevaTask, onOpenSeguimientoTask, onOpenLograrTask, onOpenEliminarTask, onOpenEditarTask, onOpenEditarFollowup, expandedWorkers, toggleWorker, expandedOpps, toggleOpp, expandedTasks, toggleTask, isAdmin, adminView, setAdminView }) {
  const [segFilter, setSegFilter] = useState('all'); // 'all', 'con', 'sin' (solo en vista "todos")
  const [catFilter, setCatFilter] = useState('all');

  const emps = adminView === 'all' ? allEmployees : myReports;
  const opps = adminView === 'all' ? allOpportunities : opportunities;
  const activeOpps = opps.filter(o => o.status === 'proceso');
  const filteredOpps = catFilter === 'all' ? activeOpps : activeOpps.filter(o => o.category_id === catFilter);

  // Filtro de seguimiento (solo vista "todos")
  const filteredEmps = adminView === 'all' && segFilter !== 'all'
    ? emps.filter(e => {
        const hasOpp = filteredOpps.some(o => o.employee_id === e.id);
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

      {/* Filtro de categoría */}
      {categories.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: '#888' }}>Categoría:</span>
          <select className="form-select" style={{ width: 'auto', padding: '6px 12px', fontSize: 13 }} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            <option value="all">Todas las categorías</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      )}

      {/* Filtro de seguimiento (solo vista "todos") */}
      {adminView === 'all' && (
        <div className="tabs" style={{ marginBottom: 16 }}>
          <button className={`tab ${segFilter === 'all' ? 'active' : ''}`} onClick={() => setSegFilter('all')}>Todos ({emps.length})</button>
          <button className={`tab ${segFilter === 'con' ? 'active' : ''}`} onClick={() => setSegFilter('con')}>Con seguimiento ({emps.filter(e => filteredOpps.some(o => o.employee_id === e.id)).length})</button>
          <button className={`tab ${segFilter === 'sin' ? 'active' : ''}`} onClick={() => setSegFilter('sin')}>Sin seguimiento ({emps.filter(e => !filteredOpps.some(o => o.employee_id === e.id)).length})</button>
        </div>
      )}

      <div style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>
        {adminView === 'all'
          ? `${filteredEmps.length} trabajadores · ${filteredOpps.length} oportunidades en proceso`
          : `Oportunidades en proceso: ${filteredOpps.length}`}
      </div>

      {filteredEmps.length === 0 && <div className="empty-state">No hay empleados para mostrar.</div>}

      {filteredEmps.map((emp, idx) => {
        const empOpps = filteredOpps.filter(o => o.employee_id === emp.id);
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
                  const cat = categories.find(c => c.id === opp.category_id);
                  const isProyecto = cat?.name === 'Proyectos';
                  const oppTasks = isProyecto ? tasks.filter(t => t.opportunity_id === opp.id) : [];
                  const tasksLogradas = oppTasks.filter(t => t.status === 'logrado').length;
                  const tasksPendientes = oppTasks.filter(t => t.status === 'pendiente').length;
                  const today0 = new Date(); today0.setHours(0,0,0,0);
                  const hasAlert = isProyecto && oppTasks.some(t => {
                    if (t.status !== 'pendiente' || !t.due_date) return false;
                    const due = new Date(t.due_date + 'T00:00:00');
                    return due <= today0;
                  });

                  return (
                    <div key={opp.id} className="opp-card">
                      <div className="opp-row-header" onClick={() => toggleOpp(opp.id)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                          {cat && <span className="cat-badge" style={{ background: cat.color + '20', color: cat.color, borderLeft: `3px solid ${cat.color}`, flexShrink: 0 }}>{cat.name}</span>}
                          <span className="opp-name-line">
                            {opp.title || opp.description}
                            {hasAlert && <span className="task-alert" title="Hay tareas vencidas o que vencen hoy"> ⚠️</span>}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          {(adminView !== 'all') && (
                            <button className="btn-editar" onClick={(e) => { e.stopPropagation(); onOpenEditarOpp(opp); }} title="Editar">
                              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                          )}
                          <svg width="16" height="16" fill="none" stroke="#aaa" strokeWidth="2" style={{ transform: isOppExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}><path d="M4 7l5 5 5-5"/></svg>
                        </div>
                      </div>

                      {isOppExpanded && (
                        <div className="opp-row-body">
                          <div className="opp-meta">
                            <span>Creada {fmtDate(opp.created_at)} · hace {daysAgo} día{daysAgo !== 1 ? 's' : ''}</span>
                            {lastFu && <span>Último seg. {fmtDate(lastFu.created_at)} · hace {lastFuDays} día{lastFuDays !== 1 ? 's' : ''}</span>}
                          </div>
                          {oppFollowups.length > 0 && (
                            <div className="followup-list">
                              {oppFollowups.map(fu => (
                                <div key={fu.id} className="followup-item">
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                                    <div style={{ flex: 1 }}>
                                      <div className="followup-date">{fmtDate(fu.created_at)}</div>
                                      <div className="followup-text"><ExpandableText text={fu.observation} limit={200} /></div>
                                    </div>
                                    {(adminView !== 'all') && (
                                      <button className="btn-editar" onClick={() => onOpenEditarFollowup(fu)} title="Editar seguimiento">
                                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          {/* Solo mostrar botones si es "Mis Trabajadores" o admin */}
                          {(adminView !== 'all') && (
                            <div className="opp-actions">
                              {(!isProyecto || oppTasks.length === 0) && <button className="btn-seg" onClick={() => onOpenSeguimiento(opp)}>Seguimiento</button>}
                              {isProyecto && <button className="btn-seg" onClick={() => onOpenNuevaTask(opp)}>+ Tarea</button>}
                              {!isProyecto && <button className="btn-lograr" onClick={() => onOpenLograr(opp)}>Logrado</button>}
                              {isProyecto && (
                                <button className="btn-lograr" disabled={tasksPendientes > 0} title={tasksPendientes > 0 ? 'No puedes cerrar el proyecto: aún hay tareas pendientes' : ''} onClick={() => tasksPendientes === 0 && onOpenLograr(opp)}>Logrado</button>
                              )}
                              <button className="btn-eliminar" onClick={() => onOpenEliminar(opp)} title="Eliminar oportunidad">
                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6"/></svg>
                              </button>
                            </div>
                          )}

                          {/* SECCIÓN DE TAREAS (solo Proyectos) */}
                          {isProyecto && oppTasks.length > 0 && (
                            <div className="tasks-section">
                              <div className="tasks-section-title">TAREAS ({tasksLogradas} de {oppTasks.length} completadas)</div>
                              {oppTasks.map(task => {
                                const taskFollowups = followups.filter(f => f.task_id === task.id);
                                const isTaskExpanded = expandedTasks[task.id];
                                const isPendiente = task.status === 'pendiente';
                                const today = new Date(); today.setHours(0,0,0,0);
                                const due = task.due_date ? new Date(task.due_date + 'T00:00:00') : null;
                                const isVencida = isPendiente && due && due < today;
                                const isHoy = isPendiente && due && due.getTime() === today.getTime();

                                return (
                                  <div key={task.id} className={`task-card ${task.status === 'logrado' ? 'task-done' : ''}`}>
                                    <div className="task-header">
                                      <span className="task-check">{task.status === 'logrado' ? '☑' : '☐'}</span>
                                      <div style={{ flex: 1 }}>
                                        <div className="task-title">{task.title}{isVencida && <span className="task-alert"> ⚠️ Vencida</span>}{isHoy && <span className="task-alert"> ⚠️ Vence hoy</span>}</div>
                                        {(task.due_date || taskFollowups.length > 0) && (
                                          <div className="task-meta">
                                            {task.due_date && <span>Vence: {fmtDate(task.due_date)}{taskFollowups.length > 0 ? ' · ' : ''}</span>}
                                            {taskFollowups.length > 0 && (
                                              <button className="followup-toggle" style={{ display: 'inline', padding: 0 }} onClick={() => toggleTask(task.id)}>
                                                {isTaskExpanded ? 'Ocultar seguimientos' : `${taskFollowups.length} seguimiento${taskFollowups.length > 1 ? 's' : ''}`}
                                              </button>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                      {(adminView !== 'all') && (
                                        <button className="btn-editar" onClick={() => onOpenEditarTask(opp, task)} title="Editar tarea">
                                          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                        </button>
                                      )}
                                    </div>
                                    {isTaskExpanded && taskFollowups.map(fu => (
                                      <div key={fu.id} className="followup-item" style={{ marginLeft: 26 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                                          <div style={{ flex: 1 }}>
                                            <div className="followup-date">{fmtDate(fu.created_at)}</div>
                                            <div className="followup-text"><ExpandableText text={fu.observation} limit={200} /></div>
                                          </div>
                                          {(adminView !== 'all') && (
                                            <button className="btn-editar" onClick={() => onOpenEditarFollowup(fu)} title="Editar seguimiento">
                                              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                    {(adminView !== 'all') && isPendiente && (
                                      <div className="opp-actions" style={{ marginLeft: 26, marginTop: 8 }}>
                                        <button className="btn-seg" onClick={() => onOpenSeguimientoTask(opp, task)}>Seguimiento</button>
                                        <button className="btn-lograr" onClick={() => onOpenLograrTask(opp, task)}>Logrado</button>
                                        <button className="btn-eliminar" onClick={() => onOpenEliminarTask(opp, task)} title="Eliminar tarea">
                                          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6"/></svg>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
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
function HistorialScreen({ myReports, allEmployees, opportunities, allOpportunities, followups, categories, onOpenDetalle, isAdmin, adminView, setAdminView }) {
  const [workerFilter, setWorkerFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');
  const emps = adminView === 'all' ? allEmployees : myReports;
  const opps = adminView === 'all' ? allOpportunities : opportunities;
  const logradas = opps.filter(o => o.status === 'logrado');
  const filteredByCat = catFilter === 'all' ? logradas : logradas.filter(o => o.category_id === catFilter);
  const filtered = workerFilter === 'all' ? filteredByCat : filteredByCat.filter(o => o.employee_id === workerFilter);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Historial</h1>
        <p className="page-subtitle">Oportunidades cerradas</p>
      </div>

      <AdminViewToggle view={adminView} setView={setAdminView} isAdmin={isAdmin} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontSize: 14, color: '#555', fontWeight: 600 }}>{filtered.length} oportunidades cerradas</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: '#888' }}>Filtrar:</span>
          <select className="form-select" style={{ width: 'auto', padding: '8px 12px' }} value={workerFilter} onChange={e => setWorkerFilter(e.target.value)}>
            <option value="all">Todos los trabajadores</option>
            {emps.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          {categories.length > 0 && (
            <select className="form-select" style={{ width: 'auto', padding: '8px 12px' }} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
              <option value="all">Todas las categorías</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
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
                    {(() => { const cat = categories.find(c => c.id === opp.category_id); return cat ? <span className="cat-badge" style={{ background: cat.color + '20', color: cat.color, borderLeft: `3px solid ${cat.color}`, marginBottom: 6 }}>{cat.name}</span> : null; })()}
                    <div className="hist-desc">{opp.title || opp.description}</div>
                    <div className="hist-meta">
                      {emp?.name} · Creada {fmtDate(opp.created_at)} · Cerrada {fmtDate(opp.closed_at)} · {duration} días
                      {adminView === 'all' && emp?.manager_name && <span> · Jefe: {firstName(emp.manager_name)}</span>}
                    </div>
                    <div className="hist-obs"><strong>Observación final:</strong> <ExpandableText text={opp.final_observation || 'Sin observación.'} limit={200} /></div>
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
   NOTIFICACIONES
   ================================================================ */
function getNotifications(tasks, opportunities, allEmployees) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const list = [];
  tasks.filter(t => t.status === 'pendiente' && t.due_date).forEach(t => {
    const due = new Date(t.due_date + 'T00:00:00');
    const opp = opportunities.find(o => o.id === t.opportunity_id);
    if (!opp) return;
    const emp = allEmployees.find(e => e.id === opp.employee_id);
    const diffDays = Math.round((due - today) / 86400000);
    if (diffDays <= 0) {
      list.push({ id: t.id, task: t, opp, emp, diffDays, type: diffDays === 0 ? 'hoy' : 'vencida' });
    }
  });
  return list.sort((a, b) => a.diffDays - b.diffDays);
}

function getRsNotifications(rsDM, rsCosm, rsPF, rsDigesa, certDigemid) {
  const all = [
    ...rsDM.map(i => ({ ...i, _tab: 'dm' })),
    ...rsCosm.map(i => ({ ...i, _tab: 'cosm' })),
    ...rsPF.map(i => ({ ...i, _tab: 'pf' })),
    ...rsDigesa.map(i => ({ ...i, _tab: 'digesa' })),
    ...certDigemid.map(i => ({ ...i, _tab: 'cert' })),
  ];
  const result = [];
  for (const item of all) {
    if (!item.f_vencimiento) continue;
    const dias = diasHasta(item.f_vencimiento);
    if (dias === null || dias > 30) continue;
    const schema = RS_SCHEMAS[item._tab];
    result.push({
      id: item.id, tab: item._tab, nombre: schema.nombre, titulo: item[schema.titleField],
      codigo: item[schema.codeField], diasRestantes: dias,
      tipo: dias < 0 ? 'vencido' : dias === 0 ? 'hoy' : dias <= 15 ? '15dias' : '1mes'
    });
  }
  return result.sort((a, b) => a.diasRestantes - b.diasRestantes);
}

function NotificacionesScreen({ myTasks, myOpportunities, allTasks, allOpportunities, allEmployees, isAdmin, adminView, setAdminView, onOpenInTrabajadores, rsDM, rsCosm, rsPF, rsDigesa, certDigemid, hasRegistrosAccess, onOpenInRegistros }) {
  const tasksToUse = adminView === 'all' ? allTasks : myTasks;
  const oppsToUse = adminView === 'all' ? allOpportunities : myOpportunities;
  const notifs = getNotifications(tasksToUse, oppsToUse, allEmployees);
  const rsNotifs = hasRegistrosAccess ? getRsNotifications(rsDM, rsCosm, rsPF, rsDigesa, certDigemid) : [];

  const rsColor = (tipo) => tipo === 'vencido' ? '#D64545' : tipo === 'hoy' ? '#C98A2B' : tipo === '15dias' ? '#C98A2B' : '#3A8F8F';
  const rsIcon = (tipo) => tipo === 'vencido' ? '🔴' : tipo === 'hoy' ? '⚠️' : tipo === '15dias' ? '⚠️' : '⏳';
  const rsLabel = (n) => {
    if (n.tipo === 'vencido') return `Vencido hace ${Math.abs(n.diasRestantes)} día${Math.abs(n.diasRestantes) !== 1 ? 's' : ''}`;
    if (n.tipo === 'hoy') return 'Vence HOY';
    return `Vence en ${n.diasRestantes} día${n.diasRestantes !== 1 ? 's' : ''}`;
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Notificaciones</h1>
        <p className="page-subtitle">Tareas vencidas o que vencen hoy</p>
      </div>

      <AdminViewToggle view={adminView} setView={setAdminView} isAdmin={isAdmin} />

      {notifs.length === 0 ? (
        <div className="empty-state">🎉 No hay tareas vencidas ni que venzan hoy.</div>
      ) : (
        <div className="hist-list">
          {notifs.map(n => (
            <div key={n.id} className="hist-card" onClick={() => onOpenInTrabajadores(n.opp, n.task)} style={{ borderLeft: `4px solid ${n.type === 'hoy' ? '#C98A2B' : '#D64545'}` }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ fontSize: 22 }}>{n.type === 'hoy' ? '⚠️' : '🔴'}</div>
                <div style={{ flex: 1 }}>
                  <div className="hist-desc" style={{ fontWeight: 700 }}>
                    {n.type === 'hoy' ? 'Vence HOY: ' : `Vencida hace ${Math.abs(n.diffDays)} día${Math.abs(n.diffDays) !== 1 ? 's' : ''}: `}
                    "{n.task.title}"
                  </div>
                  <div className="hist-meta">
                    Proyecto: {n.opp.title || n.opp.description} · Colaborador: {n.emp?.name || '—'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasRegistrosAccess && (
        <div style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#15362C', marginBottom: 12 }}>🧪 Registros Sanitarios</h2>
          {rsNotifs.length === 0 ? (
            <div className="empty-state">🎉 Sin registros sanitarios por vencer en los próximos 30 días.</div>
          ) : (
            <div className="hist-list">
              {rsNotifs.map(n => (
                <div key={n.tab + n.id} className="hist-card" onClick={() => onOpenInRegistros(n.tab)} style={{ borderLeft: `4px solid ${rsColor(n.tipo)}` }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{ fontSize: 22 }}>{rsIcon(n.tipo)}</div>
                    <div style={{ flex: 1 }}>
                      <div className="hist-desc" style={{ fontWeight: 700 }}>{rsLabel(n)}: "{n.titulo}"</div>
                      <div className="hist-meta">{n.nombre} · Código: {n.codigo}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ================================================================
   REGISTROS SANITARIOS
   ================================================================ */
function diasHasta(fecha) {
  if (!fecha) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const f = new Date(fecha + 'T00:00:00');
  return Math.round((f - today) / 86400000);
}

function RsAlertBadge({ fVencimiento }) {
  const dias = diasHasta(fVencimiento);
  if (dias === null) return null;
  if (dias < 0) return <span className="task-alert" title="Vencido"> 🔴 Vencido hace {Math.abs(dias)} día{Math.abs(dias) !== 1 ? 's' : ''}</span>;
  if (dias === 0) return <span className="task-alert" title="Vence hoy"> ⚠️ Vence hoy</span>;
  if (dias <= 15) return <span className="task-alert" title="Vence en 15 días o menos"> ⚠️ Vence en {dias} día{dias !== 1 ? 's' : ''}</span>;
  if (dias <= 30) return <span style={{ color: '#C98A2B', fontWeight: 700 }} title="Vence en 1 mes o menos"> ⏳ Vence en {dias} días</span>;
  return null;
}

function RegistrosSanitariosScreen({ rsTab, setRsTab, rsDM, rsCosm, rsPF, rsDigesa, certDigemid, canEdit, onOpenNuevo, onOpenEditar, onOpenEliminar }) {
  const dataMap = { dm: rsDM, cosm: rsCosm, pf: rsPF, digesa: rsDigesa, cert: certDigemid };
  const schema = RS_SCHEMAS[rsTab];
  const items = dataMap[rsTab] || [];
  const [expandedItems, setExpandedItems] = useState({});
  const toggleItem = (id) => setExpandedItems(s => ({ ...s, [id]: !s[id] }));

  const tabs = [
    { key: 'dm', label: 'Dispositivos Médicos' },
    { key: 'cosm', label: 'Cosméticos' },
    { key: 'pf', label: 'Farmacéutico' },
    { key: 'digesa', label: 'DIGESA' },
    { key: 'cert', label: 'Certificaciones' },
  ];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Registros Sanitarios</h1>
          <p className="page-subtitle">{schema.codigo} · {schema.nombre}</p>
        </div>
        {canEdit && (
          <button className="btn-nueva" onClick={() => onOpenNuevo(rsTab)}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><line x1="9" y1="4" x2="9" y2="14"/><line x1="4" y1="9" x2="14" y2="9"/></svg>
            Agregar
          </button>
        )}
      </div>

      <div className="tabs" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.key} className={`tab ${rsTab === t.key ? 'active' : ''}`} onClick={() => setRsTab(t.key)}>{t.label}</button>
        ))}
      </div>

      <div style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>{items.length} registro{items.length !== 1 ? 's' : ''}</div>

      {items.length === 0 ? (
        <div className="empty-state">No hay registros en esta categoría todavía.</div>
      ) : (
        <div className="hist-list">
          {items.map(item => {
            const isExpanded = expandedItems[item.id];
            return (
              <div key={item.id} className="hist-card" style={{ cursor: 'default' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div className="hist-desc">
                      {item[schema.titleField]}
                      <RsAlertBadge fVencimiento={item.f_vencimiento} />
                    </div>
                    <div className="hist-meta">
                      Estado: {item.estado || '—'} · F. Vencimiento: {fmtDate(item.f_vencimiento)}
                    </div>
                    <button className="followup-toggle" onClick={() => toggleItem(item.id)}>
                      {isExpanded ? 'Ver menos' : 'Ver más'}
                    </button>
                    {isExpanded && (
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #f0f0f0', display: 'grid', gap: 6 }}>
                        {schema.fields.map(f => (
                          <div key={f.key} style={{ fontSize: 13, color: '#555' }}>
                            <strong style={{ color: '#333' }}>{f.label}:</strong>{' '}
                            <span style={{ whiteSpace: 'pre-wrap' }}>
                              {f.type === 'date' ? fmtDate(item[f.key]) : (item[f.key] || '—')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {canEdit && (
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button className="btn-editar" onClick={() => onOpenEditar(rsTab, item)} title="Editar">
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button className="btn-eliminar" onClick={() => onOpenEliminar(rsTab, item)} title="Eliminar">
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6"/></svg>
                      </button>
                    </div>
                  )}
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
function ConfigScreen({ employees, categories, onEmployeesUpdated, onAssignmentsUpdated, onCategoriesUpdated }) {
  const [tab, setTab] = useState('sync');
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResults, setSyncResults] = useState(null);
  const [search, setSearch] = useState('');
  const [reassignEmp, setReassignEmp] = useState(null);
  const [newMgrId, setNewMgrId] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#5B8DEF');
  const CAT_COLORS = ['#5B8DEF', '#E77C5A', '#8B5CF6', '#2C8B5D', '#C98A2B', '#D64545', '#3A8F8F', '#E07C4F', '#6366F1', '#EC4899'];

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
        <button className={`tab ${tab === 'categories' ? 'active' : ''}`} onClick={() => setTab('categories')}>🏷️ Categorías</button>
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

      {tab === 'categories' && (
        <div className="config-section">
          <div className="config-section-title">🏷️ Gestión de Categorías</div>
          <div className="config-section-desc">Agrega o elimina categorías para clasificar oportunidades de mejora.</div>

          <div style={{ marginBottom: 24 }}>
            <h4 style={{ color: '#333', marginBottom: 12 }}>Categorías actuales ({categories.length})</h4>
            {categories.length === 0 ? (
              <div className="empty-state">No hay categorías creadas.</div>
            ) : (
              <div className="employee-list">
                {categories.map(cat => (
                  <div key={cat.id} className="employee-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 16, height: 16, borderRadius: 4, background: cat.color, flexShrink: 0 }} />
                      <span style={{ fontWeight: 600 }}>{cat.name}</span>
                    </div>
                    <button className="btn-danger" onClick={async () => {
                      if (!window.confirm(`¿Eliminar la categoría "${cat.name}"? Las oportunidades existentes mantendrán su categoría.`)) return;
                      await supabase.from('categories').delete().eq('id', cat.id);
                      onCategoriesUpdated();
                    }}>Eliminar</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ background: '#f8f9fa', padding: 20, borderRadius: 10 }}>
            <h4 style={{ marginBottom: 12 }}>Agregar nueva categoría</h4>
            <div className="form-group">
              <label>Nombre</label>
              <input className="form-input" placeholder="Ej: Cumplimiento Normativo" value={newCatName} onChange={e => setNewCatName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Color</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {CAT_COLORS.map(c => (
                  <button key={c} onClick={() => setNewCatColor(c)} style={{ width: 32, height: 32, borderRadius: 8, background: c, border: newCatColor === c ? '3px solid #0a1628' : '2px solid #ddd', cursor: 'pointer', transition: 'transform 0.1s', transform: newCatColor === c ? 'scale(1.15)' : 'scale(1)' }} />
                ))}
              </div>
            </div>
            {newCatName.trim() && (
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 12, color: '#888' }}>Vista previa:</span>
                <span className="cat-badge" style={{ background: newCatColor + '20', color: newCatColor, borderLeft: `3px solid ${newCatColor}`, marginLeft: 8 }}>{newCatName.trim()}</span>
              </div>
            )}
            <button className="btn-primary" disabled={!newCatName.trim()} onClick={async () => {
              const { error } = await supabase.from('categories').insert([{ name: newCatName.trim(), color: newCatColor }]);
              if (error) { alert('Error: ' + error.message); return; }
              setNewCatName(''); setNewCatColor('#5B8DEF');
              onCategoriesUpdated();
            }}>Agregar categoría</button>
          </div>
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
  const [categories, setCategories] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [modulePermissions, setModulePermissions] = useState([]);
  const [rsDM, setRsDM] = useState([]);
  const [rsCosm, setRsCosm] = useState([]);
  const [rsPF, setRsPF] = useState([]);
  const [rsDigesa, setRsDigesa] = useState([]);
  const [certDigemid, setCertDigemid] = useState([]);

  // UI state
  const [modal, setModal] = useState(null);
  const [activeOpp, setActiveOpp] = useState(null);
  const [expandedWorkers, setExpandedWorkers] = useState({});
  const [expandedOpps, setExpandedOpps] = useState({});
  const [adminView, setAdminView] = useState('mine'); // 'mine' | 'all'
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [editTarget, setEditTarget] = useState(null); // { type: 'opp'|'task', item }
  const [expandedTasks, setExpandedTasks] = useState({});
  const [rsTab, setRsTab] = useState('dm'); // dm | cosm | pf | digesa | cert
  const [rsModal, setRsModal] = useState(null); // 'nuevo' | 'editar' | 'eliminar'
  const [rsEditItem, setRsEditItem] = useState(null);
  const [rsForm, setRsForm] = useState({});

  // Form state
  const [fEmpleado, setFEmpleado] = useState('');
  const [fObs, setFObs] = useState('');
  const [fLograrObs, setFLograrObs] = useState('');
  const [fCategory, setFCategory] = useState('');
  const [fTitle, setFTitle] = useState('');
  const [fTaskTitle, setFTaskTitle] = useState('');
  const [fTaskDue, setFTaskDue] = useState('');
  const [fTaskObs, setFTaskObs] = useState('');
  const [fEditTitle, setFEditTitle] = useState('');
  const [fEditCategory, setFEditCategory] = useState('');
  const [fEditDue, setFEditDue] = useState('');
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
  const loadCategories = useCallback(async () => {
    const { data } = await supabase.from('categories').select('*').order('created_at', { ascending: true });
    setCategories(data || []);
  }, []);
  const loadTasks = useCallback(async () => {
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: true });
    setTasks(data || []);
  }, []);
  const loadModulePermissions = useCallback(async () => {
    const { data } = await supabase.from('module_permissions').select('*');
    setModulePermissions(data || []);
  }, []);
  const loadRsDM = useCallback(async () => {
    const { data } = await supabase.from('rs_dispositivos_medicos').select('*').order('f_vencimiento', { ascending: true });
    setRsDM(data || []);
  }, []);
  const loadRsCosm = useCallback(async () => {
    const { data } = await supabase.from('rs_cosmeticos').select('*').order('f_vencimiento', { ascending: true });
    setRsCosm(data || []);
  }, []);
  const loadRsPF = useCallback(async () => {
    const { data } = await supabase.from('rs_producto_farmaceutico').select('*').order('f_vencimiento', { ascending: true });
    setRsPF(data || []);
  }, []);
  const loadRsDigesa = useCallback(async () => {
    const { data } = await supabase.from('rs_digesa').select('*').order('f_vencimiento', { ascending: true });
    setRsDigesa(data || []);
  }, []);
  const loadCertDigemid = useCallback(async () => {
    const { data } = await supabase.from('certificaciones_digemid').select('*').order('f_vencimiento', { ascending: true });
    setCertDigemid(data || []);
  }, []);
  const loadAll = useCallback(() => {
    loadEmployees(); loadOpportunities(); loadFollowups(); loadAssignments(); loadCategories(); loadTasks();
    loadModulePermissions(); loadRsDM(); loadRsCosm(); loadRsPF(); loadRsDigesa(); loadCertDigemid();
  }, [loadEmployees, loadOpportunities, loadFollowups, loadAssignments, loadCategories, loadTasks, loadModulePermissions, loadRsDM, loadRsCosm, loadRsPF, loadRsDigesa, loadCertDigemid]);

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
  const toggleTask = (id) => setExpandedTasks(s => ({ ...s, [id]: !s[id] }));

  const openNueva = () => { setModal('nueva'); setFEmpleado(''); setFCategory(''); setFTitle(''); setFormError(''); };
  const openSeguimiento = (opp) => { setModal('seguimiento'); setActiveOpp(opp); setActiveTask(null); setFObs(''); setFormError(''); };
  const openSeguimientoTask = (opp, task) => { setModal('seguimientoTask'); setActiveOpp(opp); setActiveTask(task); setFObs(''); setFormError(''); };
  const openLograr = (opp) => { setModal('lograr'); setActiveOpp(opp); setActiveTask(null); setFLograrObs(''); setFormError(''); };
  const openLograrTask = (opp, task) => { setModal('lograrTask'); setActiveOpp(opp); setActiveTask(task); setFTaskObs(''); setFormError(''); };
  const openDetalle = (opp) => { setModal('detalle'); setActiveOpp(opp); };
  const openEliminar = (opp) => { setModal('eliminar'); setActiveOpp(opp); setActiveTask(null); };
  const openEliminarTask = (opp, task) => { setModal('eliminarTask'); setActiveOpp(opp); setActiveTask(task); };
  const openNuevaTask = (opp) => { setModal('nuevaTask'); setActiveOpp(opp); setFTaskTitle(''); setFTaskDue(''); setFormError(''); };
  const openEditarOpp = (opp) => { setModal('editarOpp'); setEditTarget({ type: 'opp', item: opp }); setFEditTitle(opp.title || opp.description || ''); setFEditCategory(opp.category_id || ''); setFormError(''); };
  const openEditarTask = (opp, task) => { setModal('editarTask'); setActiveOpp(opp); setEditTarget({ type: 'task', item: task }); setFEditTitle(task.title); setFEditDue(task.due_date || ''); setFormError(''); };
  const openEditarFollowup = (fu) => { setModal('editarFollowup'); setEditTarget({ type: 'followup', item: fu }); setFObs(fu.observation); setFormError(''); };

  const openRsNuevo = (tabKey) => { setRsTab(tabKey); setRsModal('nuevo'); setRsEditItem(null); setRsForm({}); setFormError(''); };
  const openRsEditar = (tabKey, item) => { setRsTab(tabKey); setRsModal('editar'); setRsEditItem(item); setRsForm({ ...item }); setFormError(''); };
  const openRsEliminar = (tabKey, item) => { setRsTab(tabKey); setRsModal('eliminar'); setRsEditItem(item); };
  const closeRsModal = () => { setRsModal(null); setRsEditItem(null); setRsForm({}); setFormError(''); };

  const rsLoaders = { dm: loadRsDM, cosm: loadRsCosm, pf: loadRsPF, digesa: loadRsDigesa, cert: loadCertDigemid };

  const guardarRs = async () => {
    const schema = RS_SCHEMAS[rsTab];
    for (const f of schema.fields) {
      if (f.required && !rsForm[f.key]) return setFormError(`El campo "${f.label}" es obligatorio.`);
    }
    const payload = { ...rsForm, updated_at: new Date().toISOString() };
    if (rsModal === 'nuevo') {
      const { error } = await supabase.from(schema.table).insert([payload]);
      if (error) return setFormError('Error al guardar: ' + error.message);
    } else {
      const { error } = await supabase.from(schema.table).update(payload).eq('id', rsEditItem.id);
      if (error) return setFormError('Error al guardar: ' + error.message);
    }
    closeRsModal();
    rsLoaders[rsTab]();
  };

  const eliminarRs = async () => {
    const schema = RS_SCHEMAS[rsTab];
    await supabase.from(schema.table).delete().eq('id', rsEditItem.id);
    closeRsModal();
    rsLoaders[rsTab]();
  };
  const closeModal = () => { setModal(null); setActiveOpp(null); setActiveTask(null); setEditTarget(null); setFormError(''); };

  const guardarNueva = async () => {
    if (!fEmpleado) return setFormError('Selecciona un empleado.');
    if (!fCategory) return setFormError('Selecciona una categoría.');
    const cat = categories.find(c => c.id === fCategory);
    const isProyecto = cat?.name === 'Proyectos';
    if (fTitle.trim().length < 3) return setFormError(`El nombre ${isProyecto ? 'del proyecto' : 'de la oportunidad'} debe tener al menos 3 caracteres.`);
    const mgr = employees.find(e => e.email === user?.email);
    await supabase.from('opportunities').insert([{ employee_id: fEmpleado, manager_id: mgr?.id || null, description: fTitle.trim(), title: isProyecto ? fTitle.trim() : null, status: 'proceso', category_id: fCategory }]);
    setExpandedWorkers(s => ({ ...s, [fEmpleado]: true }));
    closeModal(); setScreen('trabajadores'); loadOpportunities();
  };
  const guardarSeguimiento = async () => {
    if (fObs.trim().length < 5) return setFormError('La observación debe tener al menos 5 caracteres.');
    if (activeTask) {
      await supabase.from('followups').insert([{ task_id: activeTask.id, observation: fObs.trim() }]);
      setExpandedTasks(s => ({ ...s, [activeTask.id]: true }));
    } else {
      await supabase.from('followups').insert([{ opportunity_id: activeOpp.id, observation: fObs.trim() }]);
      setExpandedOpps(s => ({ ...s, [activeOpp.id]: true }));
    }
    closeModal(); loadFollowups();
  };
  const guardarNuevaTask = async () => {
    if (fTaskTitle.trim().length < 3) return setFormError('El nombre de la tarea debe tener al menos 3 caracteres.');
    await supabase.from('tasks').insert([{ opportunity_id: activeOpp.id, title: fTaskTitle.trim(), due_date: fTaskDue || null, status: 'pendiente' }]);
    setExpandedOpps(s => ({ ...s, [activeOpp.id]: true }));
    closeModal(); loadTasks();
  };
  const confirmarLogradoTask = async () => {
    await supabase.from('tasks').update({ status: 'logrado', closed_at: new Date().toISOString(), final_observation: fTaskObs.trim() || 'Tarea completada.', updated_at: new Date().toISOString() }).eq('id', activeTask.id);
    closeModal(); loadTasks();
  };
  const eliminarTask = async () => {
    await supabase.from('tasks').delete().eq('id', activeTask.id);
    await supabase.from('audit_log').insert([{ action: 'DELETE_TASK', employee_id: activeOpp.employee_id, details: `Tarea eliminada: "${activeTask.title}"` }]);
    closeModal(); loadTasks();
  };
  const guardarEdicion = async () => {
    if (editTarget.type === 'opp') {
      const cat = categories.find(c => c.id === fEditCategory);
      const isProyecto = cat?.name === 'Proyectos';
      if (fEditTitle.trim().length < 3) return setFormError(`El nombre ${isProyecto ? 'del proyecto' : 'de la oportunidad'} debe tener al menos 3 caracteres.`);
      await supabase.from('opportunities').update({ description: fEditTitle.trim(), title: isProyecto ? fEditTitle.trim() : null, category_id: fEditCategory, updated_at: new Date().toISOString() }).eq('id', editTarget.item.id);
      await supabase.from('audit_log').insert([{ action: 'EDIT_OPP', employee_id: editTarget.item.employee_id, details: `Oportunidad editada: "${editTarget.item.description}" → "${fEditTitle.trim()}"` }]);
      loadOpportunities();
    } else if (editTarget.type === 'task') {
      if (fEditTitle.trim().length < 3) return setFormError('El nombre debe tener al menos 3 caracteres.');
      await supabase.from('tasks').update({ title: fEditTitle.trim(), due_date: fEditDue || null, updated_at: new Date().toISOString() }).eq('id', editTarget.item.id);
      await supabase.from('audit_log').insert([{ action: 'EDIT_TASK', employee_id: activeOpp?.employee_id, details: `Tarea editada: "${editTarget.item.title}" → "${fEditTitle.trim()}"` }]);
      loadTasks();
    } else if (editTarget.type === 'followup') {
      if (fObs.trim().length < 5) return setFormError('La observación debe tener al menos 5 caracteres.');
      await supabase.from('followups').update({ observation: fObs.trim() }).eq('id', editTarget.item.id);
      loadFollowups();
    }
    closeModal();
  };
  const confirmarLogrado = async () => {
    const cat = categories.find(c => c.id === activeOpp.category_id);
    if (cat?.name === 'Proyectos') {
      const pendientes = tasks.filter(t => t.opportunity_id === activeOpp.id && t.status === 'pendiente').length;
      if (pendientes > 0) { closeModal(); return; }
    }
    const duration = daysBetween(activeOpp.created_at, new Date());
    await supabase.from('opportunities').update({ status: 'logrado', closed_at: new Date().toISOString(), duration_days: duration, final_observation: fLograrObs.trim() || 'Objetivo cumplido.', updated_at: new Date().toISOString() }).eq('id', activeOpp.id);
    closeModal(); setScreen('historial'); loadOpportunities();
  };

  const eliminarOportunidad = async () => {
    await supabase.from('opportunities').update({ status: 'eliminado', closed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', activeOpp.id);
    await supabase.from('audit_log').insert([{ action: 'DELETE_OPP', employee_id: activeOpp.employee_id, details: `Oportunidad eliminada: "${activeOpp.description}"` }]);
    closeModal(); loadOpportunities();
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
  const myTaskOppIds = new Set(myOpportunities.map(o => o.id));
  const allTaskOppIds = new Set(allOpportunities.map(o => o.id));
  const myTasksList = tasks.filter(t => myTaskOppIds.has(t.opportunity_id));
  const allTasksList = tasks.filter(t => allTaskOppIds.has(t.opportunity_id));
  const myNotifs = getNotifications(myTasksList, myOpportunities, activeEmps);

  const goToTaskInTrabajadores = (opp, task) => {
    setScreen('trabajadores');
    setExpandedWorkers(s => ({ ...s, [opp.employee_id]: true }));
    setExpandedOpps(s => ({ ...s, [opp.id]: true }));
    if (task) setExpandedTasks(s => ({ ...s, [task.id]: true }));
  };

  const myPermission = modulePermissions.find(p => p.employee_email === user?.email && p.module === 'registros_sanitarios');
  const hasRegistrosAccess = !!myPermission;
  const canEditRegistros = myPermission?.access_level === 'edit';
  const rsUrgentCount = hasRegistrosAccess
    ? getRsNotifications(rsDM, rsCosm, rsPF, rsDigesa, certDigemid).filter(n => n.tipo === 'vencido' || n.tipo === 'hoy').length
    : 0;

  return (
    <div className="app-layout">
      <Sidebar user={user} screen={screen} setScreen={setScreen} isAdmin={isAdmin} onLogout={handleLogout} managerName={currentManager?.name} notifCount={myNotifs.length + rsUrgentCount} hasRegistrosAccess={hasRegistrosAccess} />
      <main className="main-content">
        {screen === 'dashboard' && <DashboardScreen myReports={myDirectReports} allEmployees={activeEmps} opportunities={myOpportunities} allOpportunities={allOpportunities} categories={categories} isAdmin={isAdmin} adminView={adminView} setAdminView={setAdminView} />}
        {screen === 'trabajadores' && <TrabajadoresScreen myReports={myDirectReports} allEmployees={activeEmps} opportunities={myOpportunities} allOpportunities={allOpportunities} followups={followups} categories={categories} tasks={tasks} onOpenNueva={openNueva} onOpenSeguimiento={openSeguimiento} onOpenLograr={openLograr} onOpenEliminar={openEliminar} onOpenEditarOpp={openEditarOpp} onOpenNuevaTask={openNuevaTask} onOpenSeguimientoTask={openSeguimientoTask} onOpenLograrTask={openLograrTask} onOpenEliminarTask={openEliminarTask} onOpenEditarTask={openEditarTask} onOpenEditarFollowup={openEditarFollowup} expandedWorkers={expandedWorkers} toggleWorker={toggleWorker} expandedOpps={expandedOpps} toggleOpp={toggleOpp} expandedTasks={expandedTasks} toggleTask={toggleTask} isAdmin={isAdmin} adminView={adminView} setAdminView={setAdminView} />}
        {screen === 'historial' && <HistorialScreen myReports={myDirectReports} allEmployees={activeEmps} opportunities={myOpportunities} allOpportunities={allOpportunities} followups={followups} categories={categories} onOpenDetalle={openDetalle} isAdmin={isAdmin} adminView={adminView} setAdminView={setAdminView} />}
        {screen === 'notificaciones' && <NotificacionesScreen myTasks={myTasksList} myOpportunities={myOpportunities} allTasks={allTasksList} allOpportunities={allOpportunities} allEmployees={activeEmps} isAdmin={isAdmin} adminView={adminView} setAdminView={setAdminView} onOpenInTrabajadores={goToTaskInTrabajadores} rsDM={rsDM} rsCosm={rsCosm} rsPF={rsPF} rsDigesa={rsDigesa} certDigemid={certDigemid} hasRegistrosAccess={hasRegistrosAccess} onOpenInRegistros={(tab) => { setScreen('registros'); setRsTab(tab); }} />}
        {screen === 'registros' && hasRegistrosAccess && <RegistrosSanitariosScreen rsTab={rsTab} setRsTab={setRsTab} rsDM={rsDM} rsCosm={rsCosm} rsPF={rsPF} rsDigesa={rsDigesa} certDigemid={certDigemid} canEdit={canEditRegistros} onOpenNuevo={openRsNuevo} onOpenEditar={openRsEditar} onOpenEliminar={openRsEliminar} />}
        {screen === 'registros' && !hasRegistrosAccess && <div className="error-msg">No tienes acceso a esta sección</div>}
        {screen === 'config' && isAdmin && <ConfigScreen employees={employees} categories={categories} onEmployeesUpdated={loadEmployees} onAssignmentsUpdated={loadAssignments} onCategoriesUpdated={loadCategories} />}
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
          <div className="form-group"><label>Categoría</label>
            <select className="form-select" value={fCategory} onChange={e => setFCategory(e.target.value)}>
              <option value="">— Selecciona una categoría —</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label>{categories.find(c => c.id === fCategory)?.name === 'Proyectos' ? 'Nombre del proyecto' : 'Nombre de la oportunidad'}</label>
            <input className="form-input" placeholder={categories.find(c => c.id === fCategory)?.name === 'Proyectos' ? 'Ej: Rediseño del catálogo de productos' : 'Ej: Mejorar puntualidad en reuniones'} value={fTitle} onChange={e => setFTitle(e.target.value)} />
          </div>
          {formError && <div className="error-msg">{formError}</div>}
          <div className="modal-actions">
            <button className="btn-secondary" onClick={closeModal}>Cancelar</button>
            <button className="btn-primary" onClick={guardarNueva} style={{ flex: 1 }}>Guardar</button>
          </div>
        </Modal>
      )}

      {/* MODAL: NUEVA TAREA (de un proyecto) */}
      {modal === 'nuevaTask' && activeOpp && (
        <Modal onClose={closeModal}>
          <div className="modal-title">Nueva tarea</div>
          <div className="modal-context">
            <div className="modal-context-label">Proyecto</div>
            <div className="modal-context-text">{activeOpp.title}</div>
          </div>
          <div className="form-group"><label>Nombre de la tarea</label>
            <input className="form-input" placeholder="Ej: Subir fotos de productos" value={fTaskTitle} onChange={e => setFTaskTitle(e.target.value)} />
          </div>
          <div className="form-group"><label>Fecha límite (opcional)</label>
            <input type="date" className="form-input" value={fTaskDue} onChange={e => setFTaskDue(e.target.value)} />
          </div>
          {formError && <div className="error-msg">{formError}</div>}
          <div className="modal-actions">
            <button className="btn-secondary" onClick={closeModal}>Cancelar</button>
            <button className="btn-primary" onClick={guardarNuevaTask} style={{ flex: 1 }}>Guardar tarea</button>
          </div>
        </Modal>
      )}

      {/* MODAL: SEGUIMIENTO DE TAREA */}
      {modal === 'seguimientoTask' && activeTask && (
        <Modal onClose={closeModal}>
          <div className="modal-title">Agregar seguimiento</div>
          <div className="modal-context">
            <div className="modal-context-label">Tarea</div>
            <div className="modal-context-text">{activeTask.title}</div>
            <div className="modal-context-meta">Proyecto: {activeOpp?.title || '—'}</div>
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

      {/* MODAL: LOGRAR TAREA */}
      {modal === 'lograrTask' && activeTask && (
        <Modal onClose={closeModal}>
          <div className="modal-title">Marcar tarea como Lograda</div>
          <div className="modal-context">
            <div className="modal-context-label">Tarea</div>
            <div className="modal-context-text">{activeTask.title}</div>
            <div className="modal-context-meta">Proyecto: {activeOpp?.title || '—'}</div>
          </div>
          <div className="form-group"><label>Observación final (opcional)</label>
            <textarea className="form-textarea" placeholder="Resultados obtenidos..." value={fTaskObs} onChange={e => setFTaskObs(e.target.value)} />
          </div>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={closeModal}>Cancelar</button>
            <button className="btn-lograr-confirm" onClick={confirmarLogradoTask}>Confirmar</button>
          </div>
        </Modal>
      )}

      {/* MODAL: ELIMINAR TAREA */}
      {modal === 'eliminarTask' && activeTask && (
        <Modal onClose={closeModal}>
          <div className="modal-title">¿Eliminar esta tarea?</div>
          <div className="modal-context">
            <div className="modal-context-label">Tarea</div>
            <div className="modal-context-text">{activeTask.title}</div>
          </div>
          <div style={{ fontSize: 14, color: '#666', lineHeight: 1.6, marginBottom: 20, background: '#fff3f3', padding: 16, borderRadius: 10, borderLeft: '4px solid #D64545' }}>
            Esta acción eliminará la tarea de forma permanente.
          </div>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={closeModal}>Cancelar</button>
            <button className="btn-danger" onClick={eliminarTask} style={{ flex: 1 }}>Sí, eliminar</button>
          </div>
        </Modal>
      )}

      {/* MODAL: EDITAR OPORTUNIDAD / PROYECTO */}
      {modal === 'editarOpp' && editTarget && (
        <Modal onClose={closeModal}>
          <div className="modal-title">Editar {categories.find(c => c.id === fEditCategory)?.name === 'Proyectos' ? 'proyecto' : 'oportunidad'}</div>
          <div className="form-group"><label>Categoría</label>
            <select className="form-select" value={fEditCategory} onChange={e => setFEditCategory(e.target.value)}>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label>{categories.find(c => c.id === fEditCategory)?.name === 'Proyectos' ? 'Nombre del proyecto' : 'Nombre de la oportunidad'}</label>
            <input className="form-input" value={fEditTitle} onChange={e => setFEditTitle(e.target.value)} />
          </div>
          {formError && <div className="error-msg">{formError}</div>}
          <div className="modal-actions">
            <button className="btn-secondary" onClick={closeModal}>Cancelar</button>
            <button className="btn-primary" onClick={guardarEdicion} style={{ flex: 1 }}>Guardar cambios</button>
          </div>
        </Modal>
      )}

      {/* MODAL: EDITAR TAREA */}
      {modal === 'editarTask' && editTarget && (
        <Modal onClose={closeModal}>
          <div className="modal-title">Editar tarea</div>
          <div className="form-group"><label>Nombre de la tarea</label>
            <input className="form-input" value={fEditTitle} onChange={e => setFEditTitle(e.target.value)} />
          </div>
          <div className="form-group"><label>Fecha límite (opcional)</label>
            <input type="date" className="form-input" value={fEditDue} onChange={e => setFEditDue(e.target.value)} />
          </div>
          {formError && <div className="error-msg">{formError}</div>}
          <div className="modal-actions">
            <button className="btn-secondary" onClick={closeModal}>Cancelar</button>
            <button className="btn-primary" onClick={guardarEdicion} style={{ flex: 1 }}>Guardar cambios</button>
          </div>
        </Modal>
      )}

      {/* MODAL: EDITAR SEGUIMIENTO */}
      {modal === 'editarFollowup' && editTarget && (
        <Modal onClose={closeModal}>
          <div className="modal-title">Editar seguimiento</div>
          <div className="form-group"><label>Observación</label>
            <textarea className="form-textarea" value={fObs} onChange={e => setFObs(e.target.value)} />
          </div>
          {formError && <div className="error-msg">{formError}</div>}
          <div className="modal-actions">
            <button className="btn-secondary" onClick={closeModal}>Cancelar</button>
            <button className="btn-primary" onClick={guardarEdicion} style={{ flex: 1 }}>Guardar cambios</button>
          </div>
        </Modal>
      )}

      {/* MODAL: SEGUIMIENTO */}
      {modal === 'seguimiento' && activeOpp && (
        <Modal onClose={closeModal}>
          <div className="modal-title">Agregar seguimiento</div>
          <div className="modal-context">
            <div className="modal-context-label">Oportunidad</div>
            <div className="modal-context-text">{activeOpp.title || activeOpp.description}</div>
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
            <div className="modal-context-text">{activeOpp.title || activeOpp.description}</div>
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

      {/* MODAL: ELIMINAR */}
      {modal === 'eliminar' && activeOpp && (
        <Modal onClose={closeModal}>
          <div className="modal-title">¿Eliminar esta oportunidad?</div>
          <div className="modal-context">
            <div className="modal-context-label">Oportunidad</div>
            <div className="modal-context-text">{activeOpp.title || activeOpp.description}</div>
            <div className="modal-context-meta">Colaborador: {activeEmp?.name || '—'}</div>
          </div>
          <div style={{ fontSize: 14, color: '#666', lineHeight: 1.6, marginBottom: 20, background: '#fff3f3', padding: 16, borderRadius: 10, borderLeft: '4px solid #D64545' }}>
            La oportunidad será removida de la vista activa. El registro se conserva en la base de datos.
          </div>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={closeModal}>Cancelar</button>
            <button className="btn-danger" onClick={eliminarOportunidad} style={{ flex: 1 }}>Sí, eliminar</button>
          </div>
        </Modal>
      )}

      {/* MODAL: REGISTROS SANITARIOS - NUEVO/EDITAR */}
      {(rsModal === 'nuevo' || rsModal === 'editar') && (
        <Modal onClose={closeRsModal}>
          <div className="modal-title">{rsModal === 'nuevo' ? 'Agregar' : 'Editar'} registro · {RS_SCHEMAS[rsTab].nombre}</div>
          {RS_SCHEMAS[rsTab].fields.map(f => (
            <div className="form-group" key={f.key}>
              <label>{f.label}{f.required && ' *'}</label>
              {f.type === 'textarea' ? (
                <textarea className="form-textarea" value={rsForm[f.key] || ''} onChange={e => setRsForm(s => ({ ...s, [f.key]: e.target.value }))} />
              ) : f.type === 'select' ? (
                <select className="form-select" value={rsForm[f.key] || ''} onChange={e => setRsForm(s => ({ ...s, [f.key]: e.target.value }))}>
                  <option value="">— Selecciona —</option>
                  {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : f.type === 'date' ? (
                <input type="date" className="form-input" value={rsForm[f.key] || ''} onChange={e => setRsForm(s => ({ ...s, [f.key]: e.target.value }))} />
              ) : (
                <input className="form-input" value={rsForm[f.key] || ''} onChange={e => setRsForm(s => ({ ...s, [f.key]: e.target.value }))} />
              )}
            </div>
          ))}
          {formError && <div className="error-msg">{formError}</div>}
          <div className="modal-actions">
            <button className="btn-secondary" onClick={closeRsModal}>Cancelar</button>
            <button className="btn-primary" onClick={guardarRs} style={{ flex: 1 }}>Guardar</button>
          </div>
        </Modal>
      )}

      {/* MODAL: REGISTROS SANITARIOS - ELIMINAR */}
      {rsModal === 'eliminar' && rsEditItem && (
        <Modal onClose={closeRsModal}>
          <div className="modal-title">¿Eliminar este registro?</div>
          <div className="modal-context">
            <div className="modal-context-label">{RS_SCHEMAS[rsTab].nombre}</div>
            <div className="modal-context-text">{rsEditItem[RS_SCHEMAS[rsTab].titleField]}</div>
          </div>
          <div style={{ fontSize: 14, color: '#666', lineHeight: 1.6, marginBottom: 20, background: '#fff3f3', padding: 16, borderRadius: 10, borderLeft: '4px solid #D64545' }}>
            Esta acción eliminará el registro de forma permanente.
          </div>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={closeRsModal}>Cancelar</button>
            <button className="btn-danger" onClick={eliminarRs} style={{ flex: 1 }}>Sí, eliminar</button>
          </div>
        </Modal>
      )}

      {/* MODAL: DETALLE */}
      {modal === 'detalle' && activeOpp && (
        <Modal onClose={closeModal}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div className="modal-title" style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>{activeOpp.title || activeOpp.description}</div>
            <span className="badge badge-green">Logrado</span>
          </div>
          {(() => { const cat = categories.find(c => c.id === activeOpp.category_id); return cat ? <div style={{ marginBottom: 12 }}><span className="cat-badge" style={{ background: cat.color + '20', color: cat.color, borderLeft: `3px solid ${cat.color}` }}>{cat.name}</span></div> : null; })()}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, fontSize: 13, color: '#888', flexWrap: 'wrap' }}>
            <span>Colaborador: <strong>{activeEmp?.name}</strong></span><span>·</span>
            <span>Creada: {fmtDate(activeOpp.created_at)}</span><span>·</span>
            <span>Cerrada: {fmtDate(activeOpp.closed_at)}</span><span>·</span>
            <span>{activeOpp.duration_days || 0} días</span>
          </div>
          <div style={{ background: '#f0fff4', padding: 16, borderRadius: 10, marginBottom: 16, borderLeft: '4px solid #2C8B5D' }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Observación final</div>
            <div style={{ fontSize: 14, color: '#333', whiteSpace: 'pre-wrap' }}>{activeOpp.final_observation || 'Sin observación.'}</div>
          </div>
          {(() => { const fus = followups.filter(f => f.opportunity_id === activeOpp.id); return fus.length > 0 && (
            <div><div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Seguimientos ({fus.length})</div>
              {fus.map(fu => (<div key={fu.id} className="followup-item"><div className="followup-date">{fmtDate(fu.created_at)}</div><div className="followup-text" style={{ whiteSpace: 'pre-wrap' }}>{fu.observation}</div></div>))}
            </div>
          ); })()}
          <div className="modal-actions" style={{ marginTop: 20 }}><button className="btn-secondary" onClick={closeModal} style={{ width: '100%' }}>Cerrar</button></div>
        </Modal>
      )}
    </div>
  );
}