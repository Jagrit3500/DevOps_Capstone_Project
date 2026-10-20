import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fetchCandidates } from './api.js'

test('loads candidate pages beyond the first hundred while preserving filters', async (t) => {
  const urls = []
  t.mock.method(globalThis, 'fetch', async (url) => {
    urls.push(new URL(url, 'http://localhost'))
    const skip = Number(urls.at(-1).searchParams.get('skip'))
    return { ok: true, json: async () => Array.from({ length: skip === 0 ? 100 : 3 }, (_, i) => ({ id: skip + i })) }
  })
  const candidates = await fetchCandidates({ status: 'hired' })
  assert.equal(candidates.length, 103)
  assert.equal(candidates.at(-1).id, 102)
  assert.deepEqual(urls.map(url => url.searchParams.get('skip')), ['0', '100'])
  assert.ok(urls.every(url => url.searchParams.get('status') === 'hired'))
})

test('reports a failed page instead of displaying a partial candidate list', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => ({ ok: false }))
  await assert.rejects(fetchCandidates(), /Failed to fetch candidates/)
})
