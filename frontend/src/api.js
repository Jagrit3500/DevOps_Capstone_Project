const BASE = '/api/candidates'

export async function fetchStats() {
  const res = await fetch(`${BASE}/stats`)
  if (!res.ok) throw new Error('Failed to fetch stats')
  return res.json()
}

export async function fetchCandidates(params = {}) {
  const q = new URLSearchParams()
  if (params.status)     q.set('status', params.status)
  if (params.priority)   q.set('priority', params.priority)
  if (params.department) q.set('department', params.department)
  const res = await fetch(`${BASE}/?${q}`)
  if (!res.ok) throw new Error('Failed to fetch candidates')
  return res.json()
}

export async function createCandidate(payload) {
  const res = await fetch(`${BASE}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Failed to create candidate')
  }
  return res.json()
}

export async function updateCandidate(id, payload) {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Failed to update candidate')
  }
  return res.json()
}

export async function deleteCandidate(id) {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete candidate')
}
