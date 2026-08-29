import type { ReactNode } from 'react'
import { Reveal } from '../ui/Reveal'
import { SectionHeading } from '../ui/SectionHeading'
import './Services.css'

interface Service {
  icon: ReactNode
  title: string
  description: string
}

function IconBlueprint() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 9H20.5M9 20.5V9" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="14.5" cy="14" r="2.2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function IconFoundation() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 19h16M5 19V9.5L12 4l7 5.5V19" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 19v-6h6v6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  )
}

function IconCloud() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 18a4 4 0 0 1-.4-7.98A5 5 0 0 1 16.2 8.1 4.5 4.5 0 0 1 17.5 17H7Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconServer() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="16" height="6.5" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
      <rect x="4" y="13.5" width="16" height="6.5" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="7.5" cy="7.25" r="0.9" fill="currentColor" />
      <circle cx="7.5" cy="16.75" r="0.9" fill="currentColor" />
    </svg>
  )
}

function IconCompass() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="m14.8 9.2-1.9 4.6-4.6 1.9 1.9-4.6z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  )
}

function IconSpark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M10.5 4 12 9l5 1.5-5 1.5-1.5 5-1.5-5-5-1.5 5-1.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M18.5 15v3M17 16.5h3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

const SERVICES: Service[] = [
  {
    icon: <IconBlueprint />,
    title: 'MVP & Product Development',
    description:
      'Turn your idea into a working product without over-building it. We help early-stage teams design and ship a first version that’s solid enough for real users and real investors — without the technical debt startups usually inherit from moving fast.',
  },
  {
    icon: <IconFoundation />,
    title: 'Legacy Modernization & Platform Migration',
    description:
      'Inherited a codebase nobody wants to touch, or stuck on a platform that’s holding you back? We audit what you have, explain what’s actually going on in plain language, and put together a realistic plan to modernize or migrate it in stages — no risky "rewrite everything" bet required.',
  },
  {
    icon: <IconCloud />,
    title: 'Cloud & Azure Infrastructure',
    description:
      'Get your infrastructure set up right the first time: reliable, secure, and sized to what you actually need today — not a setup built for a company ten times your size. We work primarily in Azure, from first setup to ongoing architecture.',
  },
  {
    icon: <IconServer />,
    title: 'Backend Systems & APIs',
    description:
      'Well-built backends are invisible when they work and painful when they don’t. We design and build APIs and services that are straightforward to reason about, easy to extend, and built to hold up under real usage.',
  },
  {
    icon: <IconSpark />,
    title: 'AI Features & Automation',
    description:
      'Chatbots, workflow automation, internal tools built on your own data — whatever shape it takes, we’ve built AI features like this before and know where they tend to break. We can also help you figure out whether it’s worth doing at all.',
  },
  {
    icon: <IconCompass />,
    title: 'Technical Advisory & Fractional CTO',
    description:
      'Sometimes you just need someone senior in the room. We work with founders and non-technical leadership on an ongoing basis — reviewing decisions, vetting vendors and hires, and acting as a technical sounding board before big commitments.',
  },
]

export function Services() {
  return (
    <section className="section services" id="services">
      <div className="container">
        <SectionHeading
          eyebrow="Services"
          title="What we actually help with"
          subtitle="Practical, senior-level engineering work — scoped to what your business needs right now, not what a bigger company would buy."
        />

        <div className="services__grid">
          {SERVICES.map((service, index) => (
            <Reveal
              key={service.title}
              as="article"
              className="service-card"
              delay={index * 60}
            >
              <div className="service-card__icon">{service.icon}</div>
              <h3 className="service-card__title">{service.title}</h3>
              <p className="service-card__description">{service.description}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
