import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import francoLogo from './assets/franco-digital-logo.png'
import basketballAction from './assets/projects/basketball-action.jpg'
import bnBasketball from './assets/projects/bn-basketball.jpg'
import karting from './assets/projects/karting.jpg'
import p27Event from './assets/projects/p27-event.jpg'
import './App.css'

gsap.registerPlugin(ScrollTrigger)

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
  const [introComplete, setIntroComplete] = useState(false)
  const rootRef = useRef<HTMLElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const introRef = useRef<HTMLDivElement>(null)
  const menuHasOpened = useRef(false)

  useLayoutEffect(() => {
    const overlay = introRef.current
    if (!overlay) return

    const stage = overlay.querySelector('.intro-logo-stage')
    const wholeLogo = overlay.querySelector('.intro-logo__whole')
    const splitLogo = overlay.querySelectorAll('.intro-logo__piece')
    const leftLogo = overlay.querySelector('.intro-logo__left')
    const rightLogo = overlay.querySelector('.intro-logo__right')
    const ring = overlay.querySelector('.intro-ring')
    const flare = overlay.querySelector('.intro-flare')
    let finished = false
    let fallbackId = 0

    const finishIntro = () => {
      if (finished) return
      finished = true
      window.clearTimeout(fallbackId)
      document.body.classList.remove('intro-visible')
      setIntroComplete(true)
    }

    document.body.classList.add('intro-visible')
    gsap.set(overlay, { autoAlpha: 1 })
    gsap.set(splitLogo, { autoAlpha: 0 })

    const timeline = gsap.timeline({ onComplete: finishIntro })

    timeline
      .fromTo(
        stage,
        {
          z: -900,
          scale: 0.18,
          rotationX: 52,
          rotationY: -48,
          rotationZ: -16,
          autoAlpha: 0,
          filter: 'blur(24px)',
        },
        {
          z: 0,
          scale: 1,
          rotationX: 0,
          rotationY: 0,
          rotationZ: 0,
          autoAlpha: 1,
          filter: 'blur(0px)',
          duration: 0.68,
          ease: 'expo.out',
          force3D: true,
        },
      )
      .fromTo(
        ring,
        { scale: 0.62, autoAlpha: 0 },
        { scale: 1.35, autoAlpha: 0.55, duration: 0.3, ease: 'power2.out' },
        '-=0.3',
      )
      .to(ring, { scale: 1.75, autoAlpha: 0, duration: 0.25, ease: 'power2.in' })
      .to(stage, { scale: 1.07, z: 80, duration: 0.14, ease: 'power2.out' }, '-=0.2')
      .set(splitLogo, { autoAlpha: 1 })
      .set(wholeLogo, { autoAlpha: 0 }, '<')
      .fromTo(
        flare,
        { scaleX: 0.06, autoAlpha: 0 },
        { scaleX: 1, autoAlpha: 0.75, duration: 0.16, ease: 'power2.out' },
      )
      .to(
        leftLogo,
        {
          xPercent: -185,
          z: 240,
          rotationY: -72,
          rotationZ: -10,
          scale: 0.72,
          autoAlpha: 0,
          filter: 'blur(14px)',
          duration: 0.46,
          ease: 'power3.in',
          force3D: true,
        },
        '<0.03',
      )
      .to(
        rightLogo,
        {
          xPercent: 185,
          z: 240,
          rotationY: 72,
          rotationZ: 10,
          scale: 0.72,
          autoAlpha: 0,
          filter: 'blur(14px)',
          duration: 0.46,
          ease: 'power3.in',
          force3D: true,
        },
        '<',
      )
      .to(flare, { scaleX: 0.12, autoAlpha: 0, duration: 0.26, ease: 'power2.in' }, '<0.08')
      .to(overlay, { autoAlpha: 0, duration: 0.28, ease: 'power2.out' }, '-=0.08')

    fallbackId = window.setTimeout(finishIntro, 2600)

    return () => {
      window.clearTimeout(fallbackId)
      timeline.kill()
      document.body.classList.remove('intro-visible')
    }
  }, [])

  useLayoutEffect(() => {
    if (!rootRef.current) return

    const context = gsap.context(() => {
      gsap.from('.site-header', { y: -24, duration: 0.58, ease: 'power3.out', immediateRender: false })
      gsap.from('.hero-meta > *', { y: 14, stagger: 0.055, duration: 0.42, delay: 0.08, ease: 'power3.out', immediateRender: false })
      gsap.from('.hero-kicker', { y: 18, duration: 0.42, delay: 0.14, ease: 'power3.out', immediateRender: false })
      gsap.from('.hero h1', { y: 52, duration: 0.64, delay: 0.16, ease: 'power3.out', immediateRender: false })
      gsap.from('.hero-intro', { y: 22, duration: 0.5, delay: 0.28, ease: 'power3.out', immediateRender: false })
      gsap.from('.hero .text-link', { y: 18, duration: 0.46, delay: 0.34, ease: 'power3.out', immediateRender: false })
      gsap.from('.hero-orbit', { scale: 0.68, rotation: -38, duration: 0.58, delay: 0.2, ease: 'power3.out', immediateRender: false })

      gsap.to('.hero-orbit', {
        rotation: 120,
        yPercent: 32,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 1.2,
        },
      })

      gsap.to('.hero-copy', {
        yPercent: -7,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      })

      gsap.utils.toArray<HTMLElement>('.section-frame').forEach((section) => {
        const headingElements = section.querySelectorAll('.eyebrow, h2, .section-note')
        let revealed = false
        const startAt = () => Math.max(0, section.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.82)
        const reveal = () => {
          if (revealed) return
          revealed = true
          gsap.to(headingElements, {
            y: 0,
            autoAlpha: 1,
            stagger: 0.09,
            duration: 0.9,
            ease: 'power3.out',
          })
        }

        gsap.set(headingElements, { y: 52, autoAlpha: 0 })
        ScrollTrigger.create({
          start: startAt,
          end: 'max',
          invalidateOnRefresh: true,
          once: true,
          onEnter: reveal,
        })

        if (window.scrollY >= startAt()) reveal()
      })

      const revealGroups = [
        {
          targets: '.project-card',
          trigger: '.project-grid',
          from: { y: 100, autoAlpha: 0 },
          to: { y: 0, autoAlpha: 1, stagger: 0.14, duration: 1.05, ease: 'power3.out' },
          threshold: 0.78,
        },
        {
          targets: '.service-item',
          trigger: '.service-list',
          from: { x: -64, autoAlpha: 0 },
          to: { x: 0, autoAlpha: 1, stagger: 0.12, duration: 0.9, ease: 'power3.out' },
          threshold: 0.82,
        },
        {
          targets: '.about-content > *',
          trigger: '.about-content',
          from: { y: 65, autoAlpha: 0 },
          to: { y: 0, autoAlpha: 1, stagger: 0.16, duration: 1, ease: 'power3.out' },
          threshold: 0.82,
        },
        {
          targets: '.contact-inner > *, .contact-footer > *',
          trigger: '.contact-section',
          from: { y: 55, autoAlpha: 0 },
          to: { y: 0, autoAlpha: 1, stagger: 0.1, duration: 0.85, ease: 'power3.out' },
          threshold: 0.76,
        },
      ]

      revealGroups.forEach((group) => {
        const trigger = rootRef.current?.querySelector<HTMLElement>(group.trigger)
        const targets = rootRef.current?.querySelectorAll<HTMLElement>(group.targets)
        if (!trigger || !targets?.length) return

        let revealed = false
        const startAt = () => Math.max(0, trigger.getBoundingClientRect().top + window.scrollY - window.innerHeight * group.threshold)
        const reveal = () => {
          if (revealed) return
          revealed = true
          gsap.to(targets, group.to)
        }

        gsap.set(targets, group.from)
        ScrollTrigger.create({
          start: startAt,
          end: 'max',
          invalidateOnRefresh: true,
          once: true,
          onEnter: reveal,
        })

        if (window.scrollY >= startAt()) reveal()
      })

      if (window.matchMedia('(max-width: 760px)').matches) {
        const wordmark = rootRef.current?.querySelector<HTMLElement>('.wordmark')
        const brandLockup = rootRef.current?.querySelector<HTMLElement>('.brand-lockup')

        if (wordmark && brandLockup) {
          const expandedWidth = wordmark.getBoundingClientRect().width

          const collapseBrand = () => {
            gsap.to(wordmark, { width: 0, x: -14, autoAlpha: 0, duration: 0.42, ease: 'power3.out', overwrite: true })
            gsap.to(brandLockup, { gap: 0, duration: 0.42, ease: 'power3.out', overwrite: true })
          }

          const expandBrand = () => {
            gsap.to(wordmark, { width: expandedWidth, x: 0, autoAlpha: 1, duration: 0.42, ease: 'power3.out', overwrite: true })
            gsap.to(brandLockup, { gap: '0.7rem', duration: 0.42, ease: 'power3.out', overwrite: true })
          }

          ScrollTrigger.create({
            start: 60,
            end: 'max',
            onEnter: collapseBrand,
            onLeaveBack: expandBrand,
          })

          if (window.scrollY > 60) collapseBrand()
        }
      }
    }, rootRef)

    document.fonts.ready.then(() => ScrollTrigger.refresh())

    return () => {
      context.revert()
    }
  }, [])

  useLayoutEffect(() => {
    const overlay = menuRef.current
    if (!overlay) return

    const links = overlay.querySelectorAll('.menu-navigation a')
    const footer = overlay.querySelector('.menu-overlay__footer')
    if (!menuOpen && !menuHasOpened.current) {
      gsap.set(overlay, { autoAlpha: 0, clipPath: 'inset(0 0 100% 0)', pointerEvents: 'none' })
      gsap.set([links, footer], { autoAlpha: 0 })
      return
    }

    const timeline = gsap.timeline()

    if (menuOpen) {
      menuHasOpened.current = true
      timeline
        .set(overlay, { visibility: 'visible', pointerEvents: 'auto' })
        .fromTo(
          overlay,
          { autoAlpha: 0, clipPath: 'inset(0 0 100% 0)', filter: 'blur(10px)' },
          { autoAlpha: 1, clipPath: 'inset(0 0 0% 0)', filter: 'blur(0px)', duration: 0.72, ease: 'power4.inOut' },
        )
        .fromTo(links, { y: 58, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.075, duration: 0.58, ease: 'power3.out' }, '-=0.35')
        .fromTo(footer, { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.45, ease: 'power2.out' }, '-=0.2')
    } else {
      timeline
        .to(links, { y: -20, autoAlpha: 0, stagger: 0.035, duration: 0.25, ease: 'power2.in' })
        .to(footer, { y: -12, autoAlpha: 0, duration: 0.2 }, '<')
        .to(overlay, { autoAlpha: 0, clipPath: 'inset(0 0 100% 0)', filter: 'blur(8px)', duration: 0.55, ease: 'power4.inOut' }, '-=0.08')
        .set(overlay, { visibility: 'hidden', pointerEvents: 'none', filter: 'none' })
    }

    return () => {
      timeline.kill()
    }
  }, [menuOpen])

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

  const animateProjectOpen = (event: React.MouseEvent<HTMLAnchorElement>) => {
    gsap
      .timeline()
      .to(event.currentTarget, { scale: 0.975, duration: 0.13, ease: 'power2.out' })
      .to(event.currentTarget, { scale: 1, duration: 0.28, ease: 'back.out(2)' })
  }

  return (
    <main className="site-shell" ref={rootRef}>
      {!introComplete && (
        <div className="intro-screen" ref={introRef} aria-hidden="true">
          <div className="intro-flare" />
          <div className="intro-logo-stage">
            <span className="intro-ring" />
            <img className="intro-logo__whole" src={francoLogo} alt="" draggable="false" />
            <img className="intro-logo__piece intro-logo__left" src={francoLogo} alt="" draggable="false" />
            <img className="intro-logo__piece intro-logo__right" src={francoLogo} alt="" draggable="false" />
          </div>
        </div>
      )}

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
        ref={menuRef}
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
            <a className="project-card" href={project.href} target="_blank" rel="noreferrer" key={project.number} onClick={animateProjectOpen}>
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
