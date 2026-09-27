// Production server: serves the built site and a tiny reviews API.
// No dependencies — only Node built-ins. Reviews live in a JSON file on
// App Service's persistent /home disk, so they survive redeploys.

import { createServer } from 'node:http'
import { randomUUID, timingSafeEqual, createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises'
import { dirname, extname, join, normalize, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT ?? 8080)
// Deployed layout is server.mjs + public/; locally we serve ../dist.
const STATIC_DIR =
  process.env.STATIC_DIR ?? (existsSync(join(here, 'public')) ? join(here, 'public') : join(here, '..', 'dist'))
const DATA_DIR = process.env.DATA_DIR ?? (process.env.WEBSITE_SITE_NAME ? '/home/data/keystone' : join(here, '..', '.data'))
const DATA_FILE = join(DATA_DIR, 'reviews.json')
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? ''

const MAX_BODY_BYTES = 16 * 1024
const MAX_PENDING = 200

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.woff2': 'font/woff2',
}

// ---------- storage ----------

// Reviews are kept in memory (the app runs a single instance) and written to
// disk in the background. /home on App Service is a network share where a
// write can stall for up to a minute, so requests must never wait on it.
let reviewsPromise = null
let writeQueue = Promise.resolve()

function loadReviews() {
  reviewsPromise ??= readFile(DATA_FILE, 'utf8').then(JSON.parse, (error) => {
    if (error.code === 'ENOENT') return []
    reviewsPromise = null
    throw error
  })
  return reviewsPromise
}

function persist(reviews) {
  const snapshot = JSON.stringify(reviews, null, 2)
  writeQueue = writeQueue
    .then(async () => {
      const started = Date.now()
      await mkdir(DATA_DIR, { recursive: true })
      const tmp = `${DATA_FILE}.tmp`
      await writeFile(tmp, snapshot)
      await rename(tmp, DATA_FILE)
      const took = Date.now() - started
      if (took > 2000) console.warn(`Saving reviews to disk took ${took}ms`)
    })
    .catch((error) => console.error('Failed to save reviews to disk:', error))
}

async function updateReviews(mutate) {
  const reviews = await loadReviews()
  const result = mutate(reviews)
  persist(reviews)
  return result
}

function toPublic(review) {
  return {
    id: review.id,
    quote: review.quote,
    name: review.name,
    role: review.role || undefined,
    rating: review.rating,
    source: 'direct',
    date: review.createdAt.slice(0, 10),
  }
}

// ---------- helpers ----------

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': CONTENT_TYPES['.json'], 'Cache-Control': 'no-store' })
  res.end(JSON.stringify(body))
}

async function readJsonBody(req) {
  let size = 0
  const chunks = []
  for await (const chunk of req) {
    size += chunk.length
    if (size > MAX_BODY_BYTES) throw Object.assign(new Error('Body too large'), { status: 413 })
    chunks.push(chunk)
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw Object.assign(new Error('Invalid JSON'), { status: 400 })
  }
}

function cleanText(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

// Basic brute-force protection for the admin password.
const failedLogins = new Map()

function isAdmin(req) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0] ?? req.socket.remoteAddress
  const record = failedLogins.get(ip)
  if (record && record.count >= 10 && Date.now() - record.last < 15 * 60 * 1000) return false

  const header = req.headers.authorization ?? ''
  const given = header.startsWith('Bearer ') ? header.slice(7) : ''
  const hash = (value) => createHash('sha256').update(value).digest()
  const ok = ADMIN_PASSWORD.length >= 12 && timingSafeEqual(hash(given), hash(ADMIN_PASSWORD))

  if (ok) failedLogins.delete(ip)
  else failedLogins.set(ip, { count: (record?.count ?? 0) + 1, last: Date.now() })
  return ok
}

// ---------- API ----------

async function handleApi(req, res, pathname) {
  if (pathname === '/api/reviews' && req.method === 'GET') {
    const reviews = await loadReviews()
    const approved = reviews
      .filter((review) => review.status === 'approved')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(toPublic)
    return sendJson(res, 200, approved)
  }

  if (pathname === '/api/reviews' && req.method === 'POST') {
    const body = await readJsonBody(req)
    // Honeypot field — hidden from people, and named so browser autofill
    // never recognises it. Pretend success so bots don't adapt.
    if (body.kt_hp_field) {
      console.log('Discarded review caught by honeypot')
      return sendJson(res, 201, { id: randomUUID(), saved: false })
    }

    const rating = Number(body.rating)
    const review = {
      id: randomUUID(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      rating: Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : 0,
      quote: cleanText(body.review, 2000),
      name: cleanText(body.name, 100),
      role: cleanText(body.role, 120),
      email: cleanText(body.email, 200),
      okToPublish: body.okToPublish === true,
    }
    if (!review.rating || !review.quote || !review.name || !review.email.includes('@')) {
      return sendJson(res, 400, { error: 'Missing or invalid fields' })
    }

    const saved = await updateReviews((reviews) => {
      if (reviews.filter((r) => r.status === 'pending').length >= MAX_PENDING) return false
      reviews.push(review)
      return true
    })
    if (!saved) return sendJson(res, 503, { error: 'Too many pending reviews' })
    console.log(`Saved pending review ${review.id}`)
    return sendJson(res, 201, { id: review.id, saved: true })
  }

  if (pathname.startsWith('/api/admin/')) {
    if (!isAdmin(req)) return sendJson(res, 401, { error: 'Unauthorized' })

    if (pathname === '/api/admin/reviews' && req.method === 'GET') {
      const reviews = await loadReviews()
      return sendJson(res, 200, [...reviews].sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
    }

    const match = pathname.match(/^\/api\/admin\/reviews\/([\w-]+)$/)
    if (match && (req.method === 'PATCH' || req.method === 'DELETE')) {
      const id = match[1]
      const body = req.method === 'PATCH' ? await readJsonBody(req) : {}
      if (req.method === 'PATCH' && !['approved', 'rejected', 'pending'].includes(body.status)) {
        return sendJson(res, 400, { error: 'Invalid status' })
      }

      const result = await updateReviews((reviews) => {
        const index = reviews.findIndex((review) => review.id === id)
        if (index === -1) return 'missing'
        if (req.method === 'DELETE') {
          reviews.splice(index, 1)
          return 'ok'
        }
        if (body.status === 'approved' && !reviews[index].okToPublish) return 'no-consent'
        reviews[index].status = body.status
        reviews[index].reviewedAt = new Date().toISOString()
        return 'ok'
      })

      if (result === 'missing') return sendJson(res, 404, { error: 'Not found' })
      if (result === 'no-consent') {
        return sendJson(res, 409, { error: 'The reviewer did not agree to publishing this review' })
      }
      return sendJson(res, 200, { ok: true })
    }
  }

  return sendJson(res, 404, { error: 'Not found' })
}

// ---------- static files ----------

async function serveStatic(req, res, pathname) {
  const filePath = normalize(join(STATIC_DIR, decodeURIComponent(pathname)))
  const insideRoot = filePath === STATIC_DIR || filePath.startsWith(STATIC_DIR + sep)

  let target = join(STATIC_DIR, 'index.html')
  if (insideRoot) {
    try {
      if ((await stat(filePath)).isFile()) target = filePath
    } catch {
      // Fall through to the SPA entry point.
    }
  }

  const headers = { 'Content-Type': CONTENT_TYPES[extname(target)] ?? 'application/octet-stream' }
  // Vite fingerprints everything under /assets, so it can be cached forever.
  headers['Cache-Control'] = pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache'
  if (target.endsWith('index.html') && pathname.startsWith('/admin')) headers['X-Robots-Tag'] = 'noindex'

  res.writeHead(200, headers)
  res.end(req.method === 'HEAD' ? undefined : await readFile(target))
}

createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url, 'http://localhost')
    if (pathname.startsWith('/api/')) return await handleApi(req, res, pathname)
    if (req.method !== 'GET' && req.method !== 'HEAD') return sendJson(res, 405, { error: 'Method not allowed' })
    return await serveStatic(req, res, pathname)
  } catch (error) {
    if (!res.headersSent) sendJson(res, error.status ?? 500, { error: error.status ? error.message : 'Server error' })
    if (!error.status) console.error(error)
  }
}).listen(PORT, () => {
  // Warm the cache so the first visitor doesn't wait on the network share.
  loadReviews().catch((error) => console.error('Failed to load reviews:', error))
  console.log(`Keystone server on :${PORT} (static: ${STATIC_DIR}, data: ${DATA_FILE})`)
  if (ADMIN_PASSWORD.length < 12) console.warn('ADMIN_PASSWORD is missing or shorter than 12 characters — admin API disabled.')
})
