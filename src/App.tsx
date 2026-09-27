import { Suspense, lazy } from 'react'
import { Header } from './components/layout/Header'
import { Footer } from './components/layout/Footer'
import { Hero } from './components/sections/Hero'
import { About } from './components/sections/About'
import { Services } from './components/sections/Services'
import { Process } from './components/sections/Process'
import { Testimonials } from './components/sections/Testimonials'
import { Contact } from './components/sections/Contact'

// Loaded only on /admin so visitors never download it.
const AdminReviews = lazy(() =>
  import('./admin/AdminReviews').then((module) => ({ default: module.AdminReviews })),
)

function App() {
  if (window.location.pathname.startsWith('/admin')) {
    return (
      <Suspense>
        <AdminReviews />
      </Suspense>
    )
  }

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <Header />
      <main id="main-content">
        <Hero />
        <About />
        <Services />
        <Process />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
    </>
  )
}

export default App
