import { Reveal } from '../ui/Reveal'
import { SectionHeading } from '../ui/SectionHeading'
import './Process.css'

const STEPS = [
  {
    number: '01',
    title: 'Discovery call',
    description:
      'We hop on a no-pressure call to talk through what you’re building, what’s not working, and what success looks like. No sales pitch — just an honest conversation about whether we’re a good fit.',
  },
  {
    number: '02',
    title: 'Plan & scope',
    description:
      'We put together a clear, plain-language plan: what we’d do, in what order, and roughly what it will take. You’ll know what you’re getting before you commit to anything.',
  },
  {
    number: '03',
    title: 'Build & check in',
    description:
      'We get to work, with regular check-ins so you’re never left wondering what’s happening. You’ll see real progress along the way, not just status updates.',
  },
  {
    number: '04',
    title: 'Hand off & support',
    description:
      'When the work is done, we make sure you and your team actually understand what was built and how to run it — and we stay reachable after launch if questions come up.',
  },
]

export function Process() {
  return (
    <section className="section process" id="process">
      <div className="container">
        <SectionHeading
          eyebrow="How We Work"
          title="A simple, honest process"
          subtitle="No jargon, no surprises. Here’s what working together actually looks like, start to finish."
        />

        <ol className="process__list">
          {STEPS.map((step, index) => (
            <Reveal
              key={step.number}
              as="li"
              className="process__step"
              delay={index * 90}
            >
              <span className="process__number" aria-hidden="true">
                {step.number}
              </span>
              <h3 className="process__title">{step.title}</h3>
              <p className="process__description">{step.description}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}
