import { useEffect, useState } from 'react'
import francoLogo from './assets/franco-digital-logo.png'
import basketballAction from './assets/projects/basketball-action.jpg'
import bnBasketball from './assets/projects/bn-basketball.jpg'
import karting from './assets/projects/karting.jpg'
import p27Event from './assets/projects/p27-event.jpg'
import './App.css'

const projects = [
  {
    number: '01',
    title: 'B&N — Identidad en cancha',
    type: 'Dirección visual / Básquet',
    image: bnBasketball,
    href: 'https://www.instagram.com/francodigital__/p/Deh6I3skSRG/',
  },
  {
    number: '02',
    title: 'P27 La Leonesa',
    type: 'Cobertura / Contenido',
    image: p27Event,
    href: 'https://www.instagram.com/francodigital__/p/DdM5u_Lkcqh/',
  },
  {
    number: '03',
    title: 'Postales de una gran jornada',
    type: 'Fotografía deportiva / Básquet',
    image: basketballAction,
    href: 'https://www.instagram.com/francodigital__/p/Dcj3S0UkTy1/',
  },
  {
    number: '04',
    title: 'Karting al atardecer',
    type: 'Fotografía / Automovilismo',
    image: karting,
    href: 'https://www.instagram.com/francodigital__/p/Db6qI2SkW3q/',
  },
]

const services = [
  {
    number: '01',
    title: 'Branding',
    description: 'Identidades visuales con una dirección clara, consistente y preparada para crecer.',
  },
  {
    number: '02',
    title: 'Community Manager',
    description: 'Estrategia, diseño y contenido para construir una presencia activa en redes.',
  },
  {
    number: '03',
    title: 'Fotografía profesional',
    description: 'Coberturas deportivas, eventos y contenido visual que conserva la energía del momento.',
  },
]

function App() {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.body.classList.toggle('menu-visible', menuOpen)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.classList.remove('menu-visible')
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  return (
    <main className="site-shell">
      <header className="site-header">
        <a className="brand-lockup" href="#top" aria-label="Franco Digital, inicio">
          <img className="brand-logo" src={francoLogo} alt="Logo de Franco Digital" />
          <span className="wordmark">
            <strong>FRANCO DIGITAL</strong>
            <small>Diseñador gráfico <i>/</i> fotógrafo profesional</small>
          </span>
        </a>

        <button
          className={`menu-toggle ${menuOpen ? 'is-active' : ''}`}
          type="button"
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-controls="fullscreen-menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="menu-toggle__label">{menuOpen ? 'Cerrar' : 'Menú'}</span>
          <span className="menu-toggle__icon" aria-hidden="true">
            <i />
            <i />
          </span>
        </button>
      </header>

      <div
        className={`menu-overlay ${menuOpen ? 'is-open' : ''}`}
        id="fullscreen-menu"
        aria-hidden={!menuOpen}
      >
        <nav className="menu-navigation" aria-label="Menú principal">
          <a href="#work" onClick={closeMenu} tabIndex={menuOpen ? 0 : -1}>
            <span>01</span> Proyectos
          </a>
          <a href="#services" onClick={closeMenu} tabIndex={menuOpen ? 0 : -1}>
            <span>02</span> ¿Qué necesitás?
          </a>
          <a href="#about" onClick={closeMenu} tabIndex={menuOpen ? 0 : -1}>
            <span>03</span> Sobre mí
          </a>
          <a href="#contact" onClick={closeMenu} tabIndex={menuOpen ? 0 : -1}>
            <span>04</span> Contacto
          </a>
        </nav>

        <div className="menu-overlay__footer">
          <span>Diseño gráfico · Fotografía · Contenido</span>
          <a href="https://www.instagram.com/francodigital__/" target="_blank" rel="noreferrer" tabIndex={menuOpen ? 0 : -1}>
            @francodigital__ ↗
          </a>
        </div>
      </div>

      <section className="hero" id="top" aria-labelledby="hero-title">
        <div className="hero-meta eyebrow">
          <span>Diseñador gráfico / Fotógrafo profesional</span>
          <span className="country-flag" role="img" aria-label="Argentina">
            <svg viewBox="0 0 30 20" aria-hidden="true">
              <path fill="#74acdf" d="M0 0h30v20H0z" />
              <path fill="#fff" d="M0 6.67h30v6.66H0z" />
              <circle cx="15" cy="10" r="2" fill="#f6b40e" />
            </svg>
          </span>
        </div>

        <div className="hero-copy">
          <p className="hero-kicker">Branding · CM · Fotografía profesional</p>
          <h1 id="hero-title">
            Diseño que <em>se mueve.</em>
            <br />
            Imágenes que quedan.
          </h1>
          <p className="hero-intro">
            Identidad visual, contenido y fotografía para marcas, clubes y proyectos
            que quieren comunicar con una imagen propia.
          </p>
          <a className="text-link" href="#work">
            <span>Explorar proyectos</span>
            <span className="link-arrow" aria-hidden="true">↘</span>
          </a>
        </div>

        <div className="hero-index" aria-hidden="true">01 / 04</div>
        <div className="hero-orbit" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </section>

      <section className="work-section section-frame" id="work" aria-labelledby="work-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Selección de trabajo</p>
            <h2 id="work-title">Proyectos que hablan<br />por sí solos.</h2>
          </div>
          <p className="section-note">01—04 / Casos seleccionados</p>
        </div>

        <div className="project-grid">
          {projects.map((project) => (
            <a className="project-card" href={project.href} target="_blank" rel="noreferrer" key={project.number}>
              <div className="project-art">
                <img src={project.image} alt={project.title} loading="lazy" />
                <span className="art-label">{project.number}</span>
              </div>
              <div className="project-info">
                <span>{project.type}</span>
                <h3>{project.title}</h3>
                <span className="project-arrow" aria-hidden="true">↗</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="services-section section-frame" id="services" aria-labelledby="services-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">¿Qué necesitás?</p>
            <h2 id="services-title">Una imagen que trabaje<br />a favor de tu proyecto.</h2>
          </div>
          <p className="section-note">Servicios / 03</p>
        </div>

        <div className="service-list">
          {services.map((service) => (
            <article className="service-item" key={service.number}>
              <span>{service.number}</span>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
              <span aria-hidden="true">↗</span>
            </article>
          ))}
        </div>
      </section>

      <section className="about-section section-frame" id="about" aria-labelledby="about-title">
        <div className="section-heading section-heading--about">
          <p className="eyebrow">El enfoque</p>
          <span className="section-note">02—04 / Método</span>
        </div>
        <div className="about-content">
          <h2 id="about-title">Ideas con intención,<br /><em>detalles con carácter.</em></h2>
          <div className="about-copy">
            <p>
              Trabajo entre el diseño, el contenido y la fotografía para construir una
              presencia visual reconocible, desde la identidad de marca hasta la cobertura
              de cada momento.
            </p>
            <a className="text-link" href="#contact">
              <span>Conocer el proceso</span>
              <span className="link-arrow" aria-hidden="true">↘</span>
            </a>
          </div>
        </div>
      </section>

      <section className="contact-section" id="contact" aria-labelledby="contact-title">
        <div className="contact-inner">
          <p className="eyebrow">¿Hacemos algo?</p>
          <h2 id="contact-title">Tu próxima idea<br /><em>empieza acá.</em></h2>
          <a className="contact-link" href="https://wa.me/5493624080801" target="_blank" rel="noreferrer">
            +54 9 362 408-0801 <span aria-hidden="true">↗</span>
          </a>
        </div>
        <div className="contact-footer">
          <span>© 2026 Franco Digital</span>
          <div className="social-links">
            <a href="https://www.instagram.com/francodigital__/" target="_blank" rel="noreferrer">Instagram</a>
            <a href="https://wa.me/5493624080801" target="_blank" rel="noreferrer">WhatsApp</a>
          </div>
          <span>Volver arriba ↑</span>
        </div>
      </section>
    </main>
  )
}

export default App
