import { Button } from '../ui/Button'
import { Reveal } from '../ui/Reveal'
import './Hero.css'

export function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero__grid" aria-hidden="true" />
      <div className="container hero__inner">
        <Reveal as="p" className="hero__eyebrow">
          A small, independent team of senior engineers
        </Reveal>

        <Reveal as="h1" className="hero__title" delay={80}>
          Senior engineering help for businesses that aren&apos;t ready to
          hire a whole team.
        </Reveal>

        <Reveal as="p" className="hero__subtitle" delay={160}>
          We&apos;re a small team of senior and veteran engineers who work
          directly with small businesses and startups on the technical work
          that&apos;s too important to guess on — MVPs, legacy systems, cloud
          infrastructure, and the decisions that shape everything after.
          Small enough to stay nimble, experienced enough to get it right.
        </Reveal>

        <Reveal className="hero__actions" delay={240}>
          <Button href="#contact" variant="primary">
            Let&apos;s talk about your project
          </Button>
          <Button href="#services" variant="secondary">
            See how we can help
          </Button>
        </Reveal>
      </div>
    </section>
  )
}
