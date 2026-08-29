import { Reveal } from '../ui/Reveal'
import { SectionHeading } from '../ui/SectionHeading'
import './About.css'

const CREDENTIALS = [
  'A decade-plus of experience, across the board',
  'Senior & principal-level backgrounds',
  'Startups to production-scale systems',
  'Cloud, backend & legacy systems',
]

export function About() {
  return (
    <section className="section about" id="about">
      <div className="container about__inner">
        <SectionHeading
          eyebrow="About"
          title="A small team of engineers who've been doing this a long time."
        />

        <div className="about__content">
          <Reveal as="div" className="about__copy">
            <p>
              We&apos;re a small, senior team — every engineer here has spent
              a decade or more in the field, working through senior and
              principal-level roles across a wide range of systems:
              customer-facing products, enterprise resource planning software
              for accounting and finance teams, data migrations and data
              warehouses, cloud infrastructure that has to stay up, and
              legacy code we&apos;ve had to untangle before building anything
              new on top of it.
            </p>
            <p>
              Somewhere along the way we noticed that the businesses who need
              this kind of experience most are usually the ones who can least
              afford to hire it full-time. A five-person startup doesn&apos;t
              need an entire engineering department — but it does need people
              who&apos;ve seen enough systems succeed and fail to help them
              make the right calls early, before those calls get expensive.
            </p>
            <p>
              That&apos;s what Keystone Technology is: a small, nimble team of
              senior engineers, sized and priced for businesses that
              don&apos;t have an engineering department of their own.
            </p>
          </Reveal>

          <Reveal as="ul" className="about__credentials" delay={120}>
            {CREDENTIALS.map((item) => (
              <li key={item}>
                <span className="about__credentials-dot" aria-hidden="true" />
                {item}
              </li>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  )
}
