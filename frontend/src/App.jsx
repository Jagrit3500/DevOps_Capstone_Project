import { useState, useEffect, useCallback } from 'react'
import {
  fetchStats,
  fetchCandidates,
  createCandidate,
  updateCandidate,
  deleteCandidate,
} from './api'

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUSES = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected']
const PRIORITIES = ['low', 'medium', 'high']
const DEPARTMENTS = ['Engineering', 'Design', 'Product', 'Data', 'Platform', 'Quality', 'Marketing', 'Sales']

const STATUS_COLORS = {
  applied: '#58a6ff',
  screening: '#bc8cff',
  interview: '#e3b341',
  offer: '#39c5cf',
  hired: '#3fb950',
  rejected: '#f85149',
}

const EMPTY_FORM = {
  name: '', email: '', position: '', department: 'Engineering',
  status: 'applied', priority: 'medium', notes: '', resume_url: '',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Badge({ status }) {
  return <span className={`badge badge-${status}`}>{status}</span>
}

function PriorityBadge({ priority }) {
  return <span className={`priority priority-${priority}`}>{priority}</span>
}

function Spinner() {
  return <div className="spinner" />
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])
  return (
    <div className={`toast toast-${type}`} onClick={onClose}>
      <span>{type === 'success' ? '✅' : '❌'}</span>
      <span>{message}</span>
    </div>
  )
}

// ─── Candidate Form Modal ─────────────────────────────────────────────────────
function CandidateModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState(initial || EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const e = {}
    if (!form.name.trim())     e.name = 'Name is required'
    if (!form.email.trim())    e.email = 'Email is required'
    if (!form.position.trim()) e.position = 'Position is required'
    if (!form.department)      e.department = 'Department is required'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email'
    return e
  }

  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setSaving(true)
    try {
      await onSave(form)
      onClose()
    } catch (err) {
      setErrors({ _: err.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{initial ? 'Edit Candidate' : '➕ Add Candidate'}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {errors._ && <div className="error-banner">⚠️ {errors._}</div>}
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label required">Full Name</label>
              <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Priya Sharma" />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>
            <div className="form-group">
              <label className="form-label required">Email</label>
              <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="priya@example.com" />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>
            <div className="form-group">
              <label className="form-label required">Position</label>
              <input className="form-input" value={form.position} onChange={e => set('position', e.target.value)} placeholder="Senior Engineer" />
              {errors.position && <span className="form-error">{errors.position}</span>}
            </div>
            <div className="form-group">
              <label className="form-label required">Department</label>
              <select className="form-select" value={form.department} onChange={e => set('department', e.target.value)}>
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" value={form.priority} onChange={e => set('priority', e.target.value)}>
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group full">
              <label className="form-label">Resume URL</label>
              <input className="form-input" value={form.resume_url} onChange={e => set('resume_url', e.target.value)} placeholder="https://linkedin.com/in/..." />
            </div>
            <div className="form-group full">
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Interview notes, strengths..." />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? <><Spinner /> Saving…</> : (initial ? 'Save Changes' : 'Add Candidate')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Confirm Delete Modal ─────────────────────────────────────────────────────
function ConfirmModal({ candidate, onConfirm, onClose }) {
  const [deleting, setDeleting] = useState(false)
  const handle = async () => {
    setDeleting(true)
    await onConfirm()
    onClose()
  }
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">🗑 Remove Candidate</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p className="confirm-text">
            Are you sure you want to remove <span className="confirm-name">{candidate.name}</span> from the pipeline?
            This action cannot be undone.
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={handle} disabled={deleting}>
            {deleting ? <><Spinner /> Removing…</> : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Stats Cards ──────────────────────────────────────────────────────────────
function StatsGrid({ stats }) {
  const cards = [
    { key: 'total',     label: 'Total',     value: stats.total,     cls: 'total' },
    { key: 'applied',   label: 'Applied',   value: stats.applied,   cls: 'applied' },
    { key: 'screening', label: 'Screening', value: stats.screening, cls: 'screening' },
    { key: 'interview', label: 'Interview', value: stats.interview, cls: 'interview' },
    { key: 'offer',     label: 'Offer',     value: stats.offer,     cls: 'offer' },
    { key: 'hired',     label: 'Hired',     value: stats.hired,     cls: 'hired' },
    { key: 'rejected',  label: 'Rejected',  value: stats.rejected,  cls: 'rejected' },
  ]
  return (
    <div className="stats-grid">
      {cards.map(c => (
        <div className={`stat-card ${c.cls}`} key={c.key}>
          <div className="stat-value">{c.value}</div>
          <div className="stat-label">{c.label}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Pipeline Bar ─────────────────────────────────────────────────────────────
function PipelineBar({ stats }) {
  const active = STATUSES.filter(s => s !== 'rejected')
  const activeTotal = active.reduce((s, k) => s + (stats[k] || 0), 0) || 1
  return (
    <div className="pipeline-card">
      <div className="pipeline-title">Pipeline Flow</div>
      <div className="pipeline-bar">
        {active.map(s => (
          <div
            key={s}
            className="pipeline-segment"
            style={{ flex: stats[s] || 0, background: STATUS_COLORS[s], minWidth: stats[s] > 0 ? 4 : 0 }}
            title={`${s}: ${stats[s]}`}
          />
        ))}
      </div>
      <div className="pipeline-legend">
        {active.map(s => (
          <div className="legend-item" key={s}>
            <div className="legend-dot" style={{ background: STATUS_COLORS[s] }} />
            <span style={{ textTransform: 'capitalize' }}>{s}</span>
            <strong style={{ color: 'var(--text-primary)' }}>{stats[s]}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Candidates Table ─────────────────────────────────────────────────────────
function CandidateTable({ candidates, onEdit, onDelete }) {
  if (candidates.length === 0) {
    return (
      <div className="table-wrap">
        <div className="empty-state">
          <div className="empty-icon">👤</div>
          <div className="empty-title">No candidates found</div>
          <div className="empty-sub">Try adjusting the filters or add a new candidate</div>
        </div>
      </div>
    )
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Candidate</th>
            <th>Position</th>
            <th>Department</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Added</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map(c => (
            <tr key={c.id}>
              <td>
                <div className="candidate-name">{c.name}</div>
                <div className="candidate-email">{c.email}</div>
              </td>
              <td>{c.position}</td>
              <td><span className="dept-tag">{c.department}</span></td>
              <td><Badge status={c.status} /></td>
              <td><PriorityBadge priority={c.priority} /></td>
              <td style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </td>
              <td>
                <div className="row-actions">
                  <button className="btn btn-sm btn-secondary" onClick={() => onEdit(c)} title="Edit">✏️</button>
                  <button className="btn btn-sm btn-danger" onClick={() => onDelete(c)} title="Remove">🗑</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [stats, setStats] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  const [modal, setModal] = useState(null) // 'add' | 'edit' | 'delete'
  const [selected, setSelected] = useState(null)
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' })

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
  }, [])

  const load = useCallback(async () => {
    try {
      const [s, c] = await Promise.all([fetchStats(), fetchCandidates()])
      setStats(s)
      setCandidates(c)
      setError(null)
    } catch (e) {
      setError('Cannot reach the HireFlow backend. Is it running?')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Client-side search filter
  const filtered = candidates.filter(c => {
    const q = filters.search.toLowerCase()
    if (filters.status && c.status !== filters.status) return false
    if (filters.priority && c.priority !== filters.priority) return false
    if (q && !(
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.position.toLowerCase().includes(q) ||
      c.department.toLowerCase().includes(q)
    )) return false
    return true
  })

  const handleAdd = async (form) => {
    const trimmed = { ...form }
    const c = await createCandidate(trimmed)
    setCandidates(prev => [c, ...prev])
    load() // refresh stats
    showToast(`${c.name} added to pipeline`)
  }

  const handleEdit = async (form) => {
    const c = await updateCandidate(selected.id, form)
    setCandidates(prev => prev.map(x => x.id === c.id ? c : x))
    load()
    showToast(`${c.name} updated`)
  }

  const handleDelete = async () => {
    await deleteCandidate(selected.id)
    setCandidates(prev => prev.filter(x => x.id !== selected.id))
    load()
    showToast(`${selected.name} removed from pipeline`)
  }

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">⚡</div>
          <div>
            <div className="sidebar-logo-text">HireFlow</div>
            <div className="sidebar-logo-sub">Recruitment Pipeline</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section-title">Workspace</div>
          <button className="nav-item active">
            <span className="nav-icon">📊</span>
            <span>Pipeline</span>
          </button>
          <button className="nav-item">
            <span className="nav-icon">👥</span>
            <span>Candidates</span>
          </button>
          <button className="nav-item">
            <span className="nav-icon">🏢</span>
            <span>Departments</span>
          </button>
          <div className="nav-section-title" style={{ marginTop: 12 }}>Reports</div>
          <button className="nav-item">
            <span className="nav-icon">📈</span>
            <span>Analytics</span>
          </button>
          <button className="nav-item">
            <span className="nav-icon">📅</span>
            <span>Calendar</span>
          </button>
          <div className="nav-section-title" style={{ marginTop: 12 }}>Settings</div>
          <button className="nav-item">
            <span className="nav-icon">⚙️</span>
            <span>Settings</span>
          </button>
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-version">HireFlow v1.0.0</div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main">
        <div className="topbar">
          <div>
            <div className="topbar-title">Recruitment Pipeline</div>
            <div className="topbar-subtitle">Track candidates through every stage</div>
          </div>
          <div className="topbar-actions">
            <button className="btn btn-secondary btn-sm" onClick={load}>🔄 Refresh</button>
            <button className="btn btn-primary" onClick={() => setModal('add')}>
              ＋ Add Candidate
            </button>
          </div>
        </div>

        <div className="page">
          {error && <div className="error-banner">⚠️ {error}</div>}

          {loading ? (
            <div className="loading-center"><Spinner /><span>Loading pipeline…</span></div>
          ) : (
            <>
              {stats && <StatsGrid stats={stats} />}
              {stats && <PipelineBar stats={stats} />}

              {/* Toolbar */}
              <div className="toolbar">
                <div className="search-wrap">
                  <input
                    className="search-input"
                    placeholder="Search candidates…"
                    value={filters.search}
                    onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                  />
                </div>
                <select
                  className="filter-select"
                  value={filters.status}
                  onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                >
                  <option value="">All Stages</option>
                  {STATUSES.map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s}</option>)}
                </select>
                <select
                  className="filter-select"
                  value={filters.priority}
                  onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}
                >
                  <option value="">All Priorities</option>
                  {PRIORITIES.map(p => <option key={p} value={p} style={{ textTransform: 'capitalize' }}>{p}</option>)}
                </select>
                <div className="toolbar-spacer" />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {filtered.length} of {candidates.length} candidates
                </span>
              </div>

              <CandidateTable
                candidates={filtered}
                onEdit={c => { setSelected(c); setModal('edit') }}
                onDelete={c => { setSelected(c); setModal('delete') }}
              />
            </>
          )}
        </div>
      </main>

      {/* Modals */}
      {modal === 'add' && (
        <CandidateModal onClose={() => setModal(null)} onSave={handleAdd} />
      )}
      {modal === 'edit' && selected && (
        <CandidateModal
          initial={selected}
          onClose={() => { setModal(null); setSelected(null) }}
          onSave={handleEdit}
        />
      )}
      {modal === 'delete' && selected && (
        <ConfirmModal
          candidate={selected}
          onConfirm={handleDelete}
          onClose={() => { setModal(null); setSelected(null) }}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  )
}
