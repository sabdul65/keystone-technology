import { KeystoneMark } from './KeystoneMark'
import './Footer.css'

const CONTACT_EMAIL = 'hello@keystonetechnology.dev'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <a href="#top" className="footer__logo">
            <KeystoneMark className="footer__logo-mark" />
            <span>Keystone Technology</span>
          </a>
          <p className="footer__tagline">Building technology, building small businesses.</p>
        </div>

        <nav className="footer__links" aria-label="Footer">
          <a href="#about">About</a>
          <a href="#services">Services</a>
          <a href="#process">How We Work</a>
          <a href="#contact">Contact</a>
        </nav>

        <a className="footer__email" href={`mailto:${CONTACT_EMAIL}`}>
          {CONTACT_EMAIL}
        </a>
      </div>

      <div className="container footer__bottom">
        <p>© {year} Keystone Technology. All rights reserved.</p>
      </div>
    </footer>
  )
}
