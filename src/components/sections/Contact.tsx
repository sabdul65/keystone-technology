import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../ui/Button'
import { Reveal } from '../ui/Reveal'
import { SectionHeading } from '../ui/SectionHeading'
import './Contact.css'

const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit'

type Status = 'idle' | 'sending' | 'success' | 'error'

export function Contact() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<Status>('idle')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus('sending')

    try {
      const response = await fetch(WEB3FORMS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: import.meta.env.VITE_WEB3FORMS_ACCESS_KEY,
          subject: `New inquiry from ${name}`,
          from_name: 'Keystone Technology website',
          name,
          email,
          message,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setStatus('success')
        setName('')
        setEmail('')
        setMessage('')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <section className="section contact" id="contact">
        <div className="container contact__inner">
          <SectionHeading
            eyebrow="Contact"
            title="Message sent — thank you."
            subtitle="We’ve got it and will get back to you soon."
          />
        </div>
      </section>
    )
  }

  return (
    <section className="section contact" id="contact">
      <div className="container contact__inner">
        <SectionHeading
          eyebrow="Contact"
          title="Have a project in mind? Let’s talk."
          subtitle="No obligation, no sales pressure — just a conversation about what you’re trying to build and whether we can help."
        />

        <div className="contact__grid">
          <Reveal as="form" className="contact__form" onSubmit={handleSubmit}>
            <div className="contact__field">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>

            <div className="contact__field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className="contact__field">
              <label htmlFor="message">Tell us a bit about your project</label>
              <textarea
                id="message"
                name="message"
                rows={5}
                required
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="contact__submit"
              disabled={status === 'sending'}
            >
              {status === 'sending' ? 'Sending…' : 'Send message'}
            </Button>

            {status === 'error' && (
              <p className="contact__status contact__status--error" role="alert">
                Something went wrong sending your message. Please try again in a moment.
              </p>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  )
}
