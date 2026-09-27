import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { TESTIMONIALS } from '../../data/testimonials'
import type { Testimonial } from '../../data/testimonials'
import { Button } from '../ui/Button'
import { Reveal } from '../ui/Reveal'
import { SectionHeading } from '../ui/SectionHeading'
import './Contact.css'
import './Testimonials.css'

const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit'

const GOOGLE_PLACE_ID = import.meta.env.VITE_GOOGLE_PLACE_ID
const GOOGLE_WRITE_REVIEW_URL = GOOGLE_PLACE_ID
  ? `https://search.google.com/local/writereview?placeid=${GOOGLE_PLACE_ID}`
  : undefined
const GOOGLE_REVIEWS_URL = GOOGLE_PLACE_ID
  ? `https://search.google.com/local/reviews?placeid=${GOOGLE_PLACE_ID}`
  : undefined

type Status = 'idle' | 'sending' | 'success' | 'error'

function Stars({ rating }: { rating: number }) {
  return (
    <span className="stars" role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <span key={value} className={value <= rating ? 'stars__on' : 'stars__off'} aria-hidden="true">
          ★
        </span>
      ))}
    </span>
  )
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="google-mark" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.56 10.56 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z" />
    </svg>
  )
}

function formatDate(isoDate: string) {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <figure className="testimonial-card">
      {testimonial.rating && <Stars rating={testimonial.rating} />}
      <blockquote className="testimonial-card__quote">
        <p>“{testimonial.quote}”</p>
      </blockquote>
      <figcaption className="testimonial-card__caption">
        <span className="testimonial-card__name">{testimonial.name}</span>
        {testimonial.role && <span className="testimonial-card__role">{testimonial.role}</span>}
        <span className="testimonial-card__meta">
          {testimonial.source === 'google' ? (
            <>
              <GoogleMark /> Google review · {formatDate(testimonial.date)}
            </>
          ) : (
            <>Client review · {formatDate(testimonial.date)}</>
          )}
        </span>
      </figcaption>
    </figure>
  )
}

function GoogleReviewButton({ children }: { children: string }) {
  if (!GOOGLE_WRITE_REVIEW_URL) return null

  return (
    <Button
      href={GOOGLE_WRITE_REVIEW_URL}
      variant="secondary"
      target="_blank"
      rel="noopener noreferrer"
    >
      <GoogleMark /> {children}
    </Button>
  )
}

export function Testimonials() {
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [email, setEmail] = useState('')
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState('')
  const [canPublish, setCanPublish] = useState(true)
  const [trap, setTrap] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [approved, setApproved] = useState<Testimonial[]>([])

  useEffect(() => {
    fetch('/api/reviews')
      .then((response) => (response.ok ? response.json() : []))
      .then(setApproved)
      .catch(() => {})
  }, [])

  const testimonials = [...approved, ...TESTIMONIALS]
  const hasTestimonials = testimonials.length > 0

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus('sending')

    try {
      // Save first — the review is then waiting in /admin for approval.
      const saveResponse = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, role, rating, review, okToPublish: canPublish, kt_hp_field: trap }),
      })
      if (!saveResponse.ok) throw new Error('Could not save review')
      const { saved } = await saveResponse.json()

      // Then notify by email — only for reviews that were actually stored, so an
      // email always means there's something waiting in /admin. The review is
      // already saved, so a failed email isn't a failed submit.
      if (saved) await fetch(WEB3FORMS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: import.meta.env.VITE_WEB3FORMS_ACCESS_KEY,
          subject: `New ${rating}-star review from ${name} — needs approval`,
          from_name: 'Keystone Technology website',
          name,
          email,
          role,
          rating: `${rating} / 5`,
          review,
          ok_to_publish: canPublish ? 'Yes' : 'No',
          approve_here: `${window.location.origin}/admin`,
        }),
      }).catch(() => {})

      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  return (
    <section className="section testimonials" id="reviews">
      <div className="container">
        <SectionHeading
          eyebrow="Reviews"
          title={hasTestimonials ? 'What clients say' : 'Worked with us? We’d love to hear how it went.'}
          subtitle={
            hasTestimonials
              ? 'Unedited feedback from the businesses we’ve worked with.'
              : 'Honest feedback — good or bad — helps us get better and helps other small businesses decide whether we’re the right fit.'
          }
        />

        {hasTestimonials && (
          <div className="testimonials__grid">
            {testimonials.map((testimonial, index) => (
              <Reveal key={testimonial.id ?? `${testimonial.name}-${testimonial.date}`} delay={index * 90}>
                <TestimonialCard testimonial={testimonial} />
              </Reveal>
            ))}
          </div>
        )}

        {hasTestimonials && GOOGLE_REVIEWS_URL && (
          <p className="testimonials__all">
            <a href={GOOGLE_REVIEWS_URL} target="_blank" rel="noopener noreferrer">
              <GoogleMark /> Read all our reviews on Google
            </a>
          </p>
        )}

        <div className="review" id="review">
          <Reveal className="review__intro">
            <h3 className="review__title">Leave a review</h3>
            <p className="review__text">
              {GOOGLE_WRITE_REVIEW_URL
                ? 'The most helpful place is Google — it takes about a minute and helps other business owners find us. Prefer not to use Google? Send it to us directly with the form instead.'
                : 'Tell us how the project went. We read every one, and with your permission we may share it here.'}
            </p>
            <GoogleReviewButton>Review us on Google</GoogleReviewButton>
          </Reveal>

          {status === 'success' ? (
            <Reveal className="review__form review__form--done" role="status">
              <h3 className="review__title">Thank you, {name.split(' ')[0]}.</h3>
              <p className="review__text">
                We really appreciate you taking the time.
                {GOOGLE_WRITE_REVIEW_URL && ' If you’re willing, posting the same words on Google helps us a lot.'}
              </p>
              <GoogleReviewButton>Post it on Google too</GoogleReviewButton>
            </Reveal>
          ) : (
            <Reveal as="form" className="review__form" onSubmit={handleSubmit}>
              <fieldset className="review__rating">
                <legend>Your rating</legend>
                <div className="review__stars">
                  {[5, 4, 3, 2, 1].map((value) => (
                    <label key={value} title={`${value} star${value > 1 ? 's' : ''}`}>
                      <input
                        type="radio"
                        name="rating"
                        value={value}
                        required
                        checked={rating === value}
                        onChange={() => setRating(value)}
                      />
                      <span aria-hidden="true">★</span>
                      <span className="visually-hidden">
                        {value} star{value > 1 ? 's' : ''}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="contact__field">
                <label htmlFor="review-text">Your review</label>
                <textarea
                  id="review-text"
                  rows={4}
                  required
                  value={review}
                  onChange={(event) => setReview(event.target.value)}
                />
              </div>

              <div className="review__row">
                <div className="contact__field">
                  <label htmlFor="review-name">Name</label>
                  <input
                    id="review-name"
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </div>
                <div className="contact__field">
                  <label htmlFor="review-role">
                    Role &amp; company <span className="review__optional">(optional)</span>
                  </label>
                  <input
                    id="review-role"
                    type="text"
                    autoComplete="organization-title"
                    placeholder="Owner, Riverbend Bakery"
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                  />
                </div>
              </div>

              <div className="contact__field">
                <label htmlFor="review-email">
                  Email <span className="review__optional">(never shown publicly)</span>
                </label>
                <input
                  id="review-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              {/* Honeypot: hidden from people, filled in by spam bots. The name is
                  deliberately meaningless so browser autofill never fills it. */}
              <input
                type="text"
                name="kt_hp_field"
                className="review__honeypot"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={trap}
                onChange={(event) => setTrap(event.target.value)}
              />

              <label className="review__consent">
                <input
                  type="checkbox"
                  checked={canPublish}
                  onChange={(event) => setCanPublish(event.target.checked)}
                />
                Keystone Technology may publish this review, with my name and role, on its website.
              </label>

              <Button type="submit" variant="primary" disabled={status === 'sending'}>
                {status === 'sending' ? 'Sending…' : 'Submit review'}
              </Button>

              {status === 'error' && (
                <p className="contact__status contact__status--error" role="alert">
                  Something went wrong sending your review. Please try again in a moment.
                </p>
              )}
            </Reveal>
          )}
        </div>
      </div>
    </section>
  )
}
