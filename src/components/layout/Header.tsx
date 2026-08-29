import { useEffect, useState } from 'react'
import { Button } from '../ui/Button'
import { KeystoneMark } from './KeystoneMark'
import './Header.css'

const NAV_LINKS = [
  { href: '#about', label: 'About' },
  { href: '#services', label: 'Services' },
  { href: '#process', label: 'How We Work' },
  { href: '#contact', label: 'Contact' },
]

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    if (!isMenuOpen) return

    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMenuOpen])

  const closeMenu = () => setIsMenuOpen(false)

  return (
    <header className="header">
      <div className="container header__inner">
        <a href="#top" className="header__logo" onClick={closeMenu}>
          <KeystoneMark className="header__logo-mark" />
          <span>Keystone Technology</span>
        </a>

        <nav className="header__nav" aria-label="Primary">
          <ul>
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="header__cta">
          <Button href="#contact" variant="primary">
            Get in touch
          </Button>
        </div>

        <button
          type="button"
          className="header__menu-toggle"
          aria-expanded={isMenuOpen}
          aria-controls="mobile-nav"
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <span className={`header__menu-icon ${isMenuOpen ? 'is-open' : ''}`} />
        </button>
      </div>

      <div
        id="mobile-nav"
        className={`header__mobile-nav ${isMenuOpen ? 'is-open' : ''}`}
      >
        <ul>
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} onClick={closeMenu}>
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <Button href="#contact" variant="primary" onClick={closeMenu}>
          Get in touch
        </Button>
      </div>
    </header>
  )
}
