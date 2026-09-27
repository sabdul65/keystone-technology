import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../components/ui/Button'
import { KeystoneMark } from '../components/layout/KeystoneMark'
import '../components/sections/Contact.css'
import './AdminReviews.css'

type ReviewStatus = 'pending' | 'approved' | 'rejected'

interface StoredReview {
  id: string
  status: ReviewStatus
  createdAt: string
  rating: number
  quote: string
  name: string
  role: string
  email: string
  okToPublish: boolean
}

const TABS: { status: ReviewStatus; label: string }[] = [
  { status: 'pending', label: 'Waiting for approval' },
  { status: 'approved', label: 'Published' },
  { status: 'rejected', label: 'Rejected' },
]

const PASSWORD_KEY = 'keystone-admin-password'

function readSavedPassword() {
  try {
    return sessionStorage.getItem(PASSWORD_KEY) ?? ''
  } catch {
    return ''
  }
}

function savePassword(value: string) {
  try {
    if (value) sessionStorage.setItem(PASSWORD_KEY, value)
    else sessionStorage.removeItem(PASSWORD_KEY)
  } catch {
    // Storage unavailable (private mode) — the password just won't persist.
  }
}

export function AdminReviews() {
  const [password, setPassword] = useState(readSavedPassword)
  const [passwordInput, setPasswordInput] = useState('')
  const [reviews, setReviews] = useState<StoredReview[] | null>(null)
  const [tab, setTab] = useState<ReviewStatus>('pending')
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')

  const request = useCallback(
    async (path: string, init: RequestInit = {}) => {
      const response = await fetch(path, {
        ...init,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}`, ...init.headers },
      })
      if (response.status === 401) {
        savePassword('')
        setPassword('')
        throw new Error('Wrong password, or too many attempts — wait 15 minutes and try again.')
      }
      const body = await response.json()
      if (!response.ok) throw new Error(body.error ?? 'Request failed')
      return body
    },
    [password],
  )

  const load = useCallback(async () => {
    try {
      setReviews(await request('/api/admin/reviews'))
      setError('')
    } catch (loadError) {
      setError((loadError as Error).message)
    }
  }, [request])

  useEffect(() => {
    document.title = 'Reviews · Keystone Technology admin'
    const robots = document.createElement('meta')
    robots.name = 'robots'
    robots.content = 'noindex, nofollow'
    document.head.append(robots)
    return () => robots.remove()
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on login
    if (password) load()
  }, [password, load])

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    savePassword(passwordInput)
    setPassword(passwordInput)
    setPasswordInput('')
  }

  const act = async (review: StoredReview, action: ReviewStatus | 'delete') => {
    if (action === 'delete' && !window.confirm(`Delete the review from ${review.name} permanently?`)) return
    setBusyId(review.id)
    try {
      await request(`/api/admin/reviews/${review.id}`, {
        method: action === 'delete' ? 'DELETE' : 'PATCH',
        body: action === 'delete' ? undefined : JSON.stringify({ status: action }),
      })
      await load()
    } catch (actionError) {
      setError((actionError as Error).message)
    } finally {
      setBusyId('')
    }
  }

  if (!password) {
    return (
      <main className="admin">
        <form className="admin__login contact__form" onSubmit={handleLogin}>
          <KeystoneMark className="admin__mark" />
          <h1 className="admin__title">Review admin</h1>
          <div className="contact__field">
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={passwordInput}
              onChange={(event) => setPasswordInput(event.target.value)}
            />
          </div>
          <Button type="submit">Sign in</Button>
          {error && (
            <p className="contact__status contact__status--error" role="alert">
              {error}
            </p>
          )}
        </form>
      </main>
    )
  }

  const visible = (reviews ?? []).filter((review) => review.status === tab)

  return (
    <main className="admin">
      <div className="admin__inner">
        <header className="admin__header">
          <a href="/" className="admin__home">
            <KeystoneMark className="admin__mark" />
            Keystone Technology
          </a>
          <Button
            variant="ghost"
            onClick={() => {
              savePassword('')
              setPassword('')
              setReviews(null)
            }}
          >
            Sign out
          </Button>
        </header>

        <h1 className="admin__title">Reviews</h1>

        <div className="admin__tabs" role="tablist">
          {TABS.map(({ status, label }) => (
            <button
              key={status}
              type="button"
              role="tab"
              aria-selected={tab === status}
              className={`admin__tab ${tab === status ? 'is-active' : ''}`}
              onClick={() => setTab(status)}
            >
              {label}
              <span className="admin__count">
                {(reviews ?? []).filter((review) => review.status === status).length}
              </span>
            </button>
          ))}
        </div>

        {error && (
          <p className="contact__status contact__status--error admin__error" role="alert">
            {error}
          </p>
        )}

        {reviews === null ? (
          <p className="admin__empty">Loading…</p>
        ) : visible.length === 0 ? (
          <p className="admin__empty">Nothing here.</p>
        ) : (
          <ul className="admin__list">
            {visible.map((review) => (
              <li key={review.id} className="admin__card">
                <div className="admin__card-top">
                  <span className="admin__stars" aria-label={`${review.rating} out of 5 stars`}>
                    {'★'.repeat(review.rating)}
                    <span className="admin__stars-off">{'★'.repeat(5 - review.rating)}</span>
                  </span>
                  <time dateTime={review.createdAt}>
                    {new Date(review.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                  </time>
                </div>
                <p className="admin__quote">“{review.quote}”</p>
                <p className="admin__who">
                  <strong>{review.name}</strong>
                  {review.role && ` · ${review.role}`} · <a href={`mailto:${review.email}`}>{review.email}</a>
                </p>
                {!review.okToPublish && (
                  <p className="admin__no-consent">Did not agree to publishing — can’t be approved.</p>
                )}
                <div className="admin__actions">
                  {review.status !== 'approved' && (
                    <Button
                      disabled={!review.okToPublish || busyId === review.id}
                      onClick={() => act(review, 'approved')}
                    >
                      Approve &amp; publish
                    </Button>
                  )}
                  {review.status === 'approved' && (
                    <Button variant="secondary" disabled={busyId === review.id} onClick={() => act(review, 'rejected')}>
                      Unpublish
                    </Button>
                  )}
                  {review.status === 'pending' && (
                    <Button variant="secondary" disabled={busyId === review.id} onClick={() => act(review, 'rejected')}>
                      Reject
                    </Button>
                  )}
                  <Button variant="ghost" disabled={busyId === review.id} onClick={() => act(review, 'delete')}>
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
