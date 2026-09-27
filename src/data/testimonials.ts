// Most reviews come in through the site's review form and are approved at
// /admin — they're stored by the server, not here. Use this file only for
// reviews from elsewhere, e.g. copied verbatim from our Google Business
// Profile with `source: 'google'`. Never edit a quote beyond trimming it
// with an ellipsis.

export interface Testimonial {
  id?: string
  quote: string
  name: string
  // e.g. "Owner, Riverbend Bakery" — leave out if the client prefers.
  role?: string
  rating?: 1 | 2 | 3 | 4 | 5
  source: 'google' | 'direct'
  // ISO date (YYYY-MM-DD) the review was given.
  date: string
}

export const TESTIMONIALS: Testimonial[] = []
