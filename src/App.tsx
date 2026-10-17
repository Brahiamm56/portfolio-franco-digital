import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import francoLogo from './assets/franco-digital-logo.png'
import francoPortrait from './assets/franco-acuna-portrait.jpg'
import FlexCarousel from './components/FlexCarousel'
import { projects, type Project } from './projects'
import './App.css'

gsap.registerPlugin(ScrollTrigger)

const instagramUrl = 'https://www.instagram.com/francodigital__/'
const whatsappUrl = 'https://wa.me/5493624080801'

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

const processSteps = [
  ['01', 'Escuchar', 'Entender el proyecto, su contexto y lo que necesita comunicar.'],
  ['02', 'Dirigir', 'Definir una idea visual, referencias y una forma propia de contarla.'],
  ['03', 'Producir', 'Diseñar, fotografiar y construir cada pieza con intención.'],
  ['04', 'Entregar', 'Ordenar el material para que esté listo para publicar y crecer.'],
]

const normalizePath = (path: string) => path.replace(/\/+$/, '') || '/'

type Navigate = (target: string) => void

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle className="instagram-dot" cx="17.4" cy="6.7" r="1" />
    </svg>
  )
}

function Intro({ onComplete }: { onComplete: () => void }) {
  const introRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const overlay = introRef.current
    if (!overlay) return

    const stage = overlay.querySelector('.intro-logo-stage')
    const wholeLogo = overlay.querySelector('.intro-logo__whole')
    const splitLogo = overlay.querySelectorAll('.intro-logo__piece')
    const leftLogo = overlay.querySelector('.intro-logo__left')
    const rightLogo = overlay.querySelector('.intro-logo__right')
    const echoLogo = overlay.querySelector('.intro-logo__echo')
    let finished = false
    let fallbackId = 0

    const finishIntro = () => {
      if (finished) return
      finished = true
      window.clearTimeout(fallbackId)
      document.body.classList.remove('intro-visible')
      onComplete()
    }

    document.body.classList.add('intro-visible')
    gsap.set(overlay, { autoAlpha: 1 })
    gsap.set(splitLogo, { autoAlpha: 0 })

    const timeline = gsap.timeline({ onComplete: finishIntro })
    timeline
      .fromTo(
        stage,
        { z: -1100, scale: 0.12, rotationX: 58, rotationY: -56, rotationZ: -18, autoAlpha: 0, filter: 'blur(28px)' },
        { z: 0, scale: 1, rotationX: 0, rotationY: 0, rotationZ: 0, autoAlpha: 1, filter: 'blur(0px)', duration: 0.72, ease: 'expo.out', force3D: true },
      )
      .fromTo(echoLogo, { scale: 0.75, autoAlpha: 0.32, filter: 'grayscale(1) brightness(1.8) blur(0px)' }, { scale: 1.9, autoAlpha: 0, filter: 'grayscale(1) brightness(1.8) blur(16px)', duration: 0.42, ease: 'power3.out' }, '-=0.23')
      .to(stage, { scale: 1.06, z: 90, rotationY: 7, duration: 0.13, ease: 'power2.out' }, '-=0.12')
      .to(stage, { scale: 1, z: 0, rotationY: 0, duration: 0.16, ease: 'power2.inOut' })
      .set(splitLogo, { autoAlpha: 1 })
      .set(wholeLogo, { autoAlpha: 0 }, '<')
      .to(leftLogo, { xPercent: -195, z: 280, rotationY: -78, rotationZ: -12, scale: 0.68, autoAlpha: 0, filter: 'blur(15px)', duration: 0.48, ease: 'power3.in', force3D: true }, '<0.02')
      .to(rightLogo, { xPercent: 195, z: 280, rotationY: 78, rotationZ: 12, scale: 0.68, autoAlpha: 0, filter: 'blur(15px)', duration: 0.48, ease: 'power3.in', force3D: true }, '<')
      .to(overlay, { autoAlpha: 0, duration: 0.28, ease: 'power2.out' }, '-=0.08')

    fallbackId = window.setTimeout(finishIntro, 2400)

    return () => {
      window.clearTimeout(fallbackId)
      timeline.kill()
      document.body.classList.remove('intro-visible')
    }
  }, [onComplete])

  return (
    <div className="intro-screen" ref={introRef} aria-hidden="true">
      <div className="intro-logo-stage">
        <img className="intro-logo__echo" src={francoLogo} alt="" draggable="false" />
        <img className="intro-logo__whole" src={francoLogo} alt="" draggable="false" />
        <img className="intro-logo__piece intro-logo__left" src={francoLogo} alt="" draggable="false" />
        <img className="intro-logo__piece intro-logo__right" src={francoLogo} alt="" draggable="false" />
      </div>
    </div>
  )
}

function ProjectCard({ project, index, navigate }: { project: Project; index: number; navigate: Navigate }) {
  const [activeImage, setActiveImage] = useState(0)

  useEffect(() => {
    const nextImage = new Image()
    nextImage.decoding = 'async'
    nextImage.src = project.images[(activeImage + 1) % project.images.length]
  }, [activeImage, project.images])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveImage((current) => (current + 1) % project.images.length)
    }, 3000 + (index % 3) * 360)
    return () => window.clearInterval(timer)
  }, [index, project.images.length])

  const openProject = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    const card = event.currentTarget
    gsap.timeline({ onComplete: () => navigate(`/proyectos/${project.slug}`) })
      .to(card, { scale: 0.975, duration: 0.13, ease: 'power2.out' })
      .to(card, { scale: 1, duration: 0.22, ease: 'back.out(2)' })
  }

  return (
    <a className="project-card" href={`/proyectos/${project.slug}`} onClick={openProject} data-reveal>
      <div className="project-art">
        <div className="project-art__slides">
          {project.images.map((image, imageIndex) => (
            <img
              className={imageIndex === activeImage ? 'is-active' : ''}
              src={image}
              alt={imageIndex === activeImage ? `${project.title}, imagen ${imageIndex + 1}` : ''}
              loading={imageIndex === 0 ? 'eager' : 'lazy'}
              fetchPriority={index < 2 && imageIndex === 0 ? 'high' : 'auto'}
              decoding="async"
              key={image}
            />
          ))}
        </div>
        <span className="art-label">{project.number}</span>
        <span className="slide-count">{String(activeImage + 1).padStart(2, '0')} / {String(project.images.length).padStart(2, '0')}</span>
        <span className="slide-progress" key={activeImage} aria-hidden="true" />
      </div>
      <div className="project-info">
        <span>{project.type}</span>
        <h3>{project.title}</h3>
        <span className="project-arrow" aria-hidden="true">↗</span>
      </div>
    </a>
  )
}

function HomePage({ navigate }: { navigate: Navigate }) {
  const follow = (target: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    navigate(target)
  }

  return (
    <div className="route-view home-view">
      <section className="hero" id="home" aria-labelledby="hero-title">
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

        <div className="hero-layout">
          <div className="hero-copy">
            <p className="hero-kicker">Branding · CM · Fotografía profesional</p>
            <h1 id="hero-title">Diseño que <em>se mueve.</em><br />Imágenes que quedan.</h1>
            <p className="hero-intro">Identidad visual, contenido y fotografía para marcas, clubes y proyectos que quieren comunicar con una imagen propia.</p>
            <div className="hero-actions">
              <a className="text-link" href="/#work" onClick={follow('/#work')}>
                <span>Explorar proyectos</span><span className="link-arrow" aria-hidden="true">↘</span>
              </a>
              <a className="instagram-button" href={instagramUrl} target="_blank" rel="noreferrer" aria-label="Ver Instagram de Franco Digital">
                <InstagramIcon /><span>Instagram</span><i aria-hidden="true">↗</i>
              </a>
            </div>
          </div>

          <div className="hero-carousel-wrap">
            <FlexCarousel
              items={projects.map((project) => ({
                src: project.images[0],
                alt: `${project.title}, portada del proyecto`,
                title: project.title,
                subtitle: project.category,
              }))}
              preset="liquid"
              intro="rise"
              cardHeight={0.56}
              gap={14}
              squeeze={0.2}
              focusOnClick
              captions
              fit="natural"
              radius={4}
              lensWidth={0.74}
              lensHeight={1.18}
              tilt={62}
              roundness={1}
              bend={0.34}
              reach={0.38}
              curl="twist"
              dispersion={0.45}
              liquid={0.08}
              followCursor={false}
              autoplay
              interval={3.2}
              captureWheel
              onSelect={(index) => navigate(`/proyectos/${projects[index].slug}`)}
            />
            <span className="project-carousel-hint" aria-hidden="true">Scroll / arrastrá para recorrer</span>
          </div>
        </div>
      </section>

      <div className="motion-strip" aria-hidden="true">
        <div className="motion-strip__track">
          <span>Fotografía deportiva</span><i>✦</i><span>Dirección visual</span><i>✦</i><span>Contenido social</span><i>✦</i><span>Identidad</span><i>✦</i>
          <span>Fotografía deportiva</span><i>✦</i><span>Dirección visual</span><i>✦</i><span>Contenido social</span><i>✦</i><span>Identidad</span><i>✦</i>
        </div>
      </div>

      <section className="work-section section-frame" id="work" aria-labelledby="work-title">
        <div className="section-heading" data-reveal>
          <div><p className="eyebrow">Archivo seleccionado</p><h2 id="work-title">Historias completas,<br />no imágenes sueltas.</h2></div>
          <p className="section-note">01—07 / Casos seleccionados</p>
        </div>
        <div className="project-grid">
          {projects.map((project, index) => <ProjectCard project={project} index={index} navigate={navigate} key={project.slug} />)}
        </div>
      </section>

      <section className="archive-section section-frame" aria-labelledby="archive-title">
        <div className="archive-heading" data-reveal>
          <p className="eyebrow">Archivo en movimiento</p>
          <h2 id="archive-title">Una mirada que cambia<br /><em>con cada disciplina.</em></h2>
        </div>
        <div className="archive-reel" data-reveal>
          {projects.slice(0, 5).map((project, index) => (
            <a className={`archive-shot archive-shot--${index + 1}`} href={`/proyectos/${project.slug}`} onClick={follow(`/proyectos/${project.slug}`)} key={project.slug}>
              <img src={project.images[(index + 1) % project.images.length]} alt={project.title} loading="lazy" />
              <span>{project.category}</span>
            </a>
          ))}
        </div>
        <div className="archive-stats" data-reveal>
          <div><strong>07</strong><span>series publicadas</span></div>
          <div><strong>35</strong><span>imágenes en archivo</span></div>
          <div><strong>04</strong><span>universos visuales</span></div>
        </div>
      </section>

      <section className="services-section section-frame" id="services" aria-labelledby="services-title">
        <div className="section-heading" data-reveal>
          <div><p className="eyebrow">¿Qué necesitás?</p><h2 id="services-title">Una imagen que trabaje<br />a favor de tu proyecto.</h2></div>
          <p className="section-note">Servicios / 03</p>
        </div>
        <div className="service-list">
          {services.map((service) => (
            <article className="service-item" key={service.number} data-reveal>
              <span>{service.number}</span><h3>{service.title}</h3><p>{service.description}</p><span aria-hidden="true">↗</span>
            </article>
          ))}
        </div>
      </section>

      <section className="process-section section-frame" aria-labelledby="process-title">
        <div className="section-heading" data-reveal>
          <div><p className="eyebrow">Del primer mensaje a la entrega</p><h2 id="process-title">Un proceso simple.<br /><em>Una dirección clara.</em></h2></div>
          <p className="section-note">Método / 04 etapas</p>
        </div>
        <div className="process-grid">
          {processSteps.map(([number, title, description]) => (
            <article className="process-card" data-reveal key={number}>
              <span>{number}</span><div className="process-mark" aria-hidden="true" /><h3>{title}</h3><p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-section section-frame" id="about" aria-labelledby="about-title">
        <div className="section-heading section-heading--about" data-reveal><p className="eyebrow">Sobre mí</p><span className="section-note">Franco Acuña / Franco Digital</span></div>
        <div className="about-content" data-reveal>
          <figure className="about-portrait">
            <div className="about-portrait__frame">
              <img src={francoPortrait} alt="Franco Acuña, diseñador gráfico y fotógrafo profesional" loading="lazy" />
              <span className="viewfinder viewfinder--top" aria-hidden="true" />
              <span className="viewfinder viewfinder--bottom" aria-hidden="true" />
            </div>
            <figcaption><strong>Franco Acuña</strong><span>Diseñador gráfico · Fotógrafo</span></figcaption>
          </figure>
          <div className="about-story">
            <h2 id="about-title">Detrás del lente,<br /><em>hay una idea.</em></h2>
            <div className="about-copy">
              <p>Soy Franco Acuña. Trabajo entre el diseño, el contenido y la fotografía para construir una presencia visual reconocible, desde la identidad de marca hasta la cobertura de cada momento.</p>
              <div className="about-tags" aria-label="Especialidades"><span>Branding</span><span>Deporte</span><span>Eventos</span><span>Contenido</span></div>
              <a className="text-link" href="/#contact" onClick={follow('/#contact')}><span>Empezar un proyecto</span><span className="link-arrow" aria-hidden="true">↘</span></a>
            </div>
          </div>
        </div>
      </section>

      <ContactSection />
    </div>
  )
}

function ProjectDetail({ project, navigate }: { project: Project; navigate: Navigate }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const nextProject = projects[(projects.findIndex((item) => item.slug === project.slug) + 1) % projects.length]

  useEffect(() => {
    if (lightboxIndex === null) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightboxIndex(null)
      if (event.key === 'ArrowRight') setLightboxIndex((current) => current === null ? 0 : (current + 1) % project.images.length)
      if (event.key === 'ArrowLeft') setLightboxIndex((current) => current === null ? 0 : (current - 1 + project.images.length) % project.images.length)
    }
    document.body.classList.add('lightbox-visible')
    window.addEventListener('keydown', handleKey)
    return () => {
      document.body.classList.remove('lightbox-visible')
      window.removeEventListener('keydown', handleKey)
    }
  }, [lightboxIndex, project.images.length])

  const follow = (target: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    navigate(target)
  }

  return (
    <div className="route-view project-view">
      <article>
        <header className="project-hero">
          <a className="back-link" href="/#work" onClick={follow('/#work')}><span aria-hidden="true">←</span> Todos los proyectos</a>
          <div className="project-hero__meta"><span>Proyecto {project.number}</span><span>{project.year}</span><span>{project.location}</span></div>
          <p className="eyebrow">{project.category}</p>
          <h1>{project.title}</h1>
          <p className="project-hero__summary">{project.summary}</p>
          <div className="project-cover">
            <img src={project.images[0]} alt={`${project.title}, portada`} />
            <span>01 / {String(project.images.length).padStart(2, '0')}</span>
          </div>
        </header>

        <section className="project-story section-frame" data-reveal>
          <p className="eyebrow">El proyecto</p>
          <div><p>{project.description}</p><ul>{project.services.map((service) => <li key={service}>{service}</li>)}</ul></div>
        </section>

        <section className="project-gallery section-frame" aria-labelledby="gallery-title">
          <div className="gallery-heading" data-reveal><p className="eyebrow">Serie completa</p><h2 id="gallery-title">Cada imagen,<br /><em>parte del relato.</em></h2><span>{String(project.images.length).padStart(2, '0')} fotografías</span></div>
          <div className="gallery-grid">
            {project.images.map((image, index) => (
              <button className={`gallery-item gallery-item--${index + 1}`} type="button" onClick={() => setLightboxIndex(index)} aria-label={`Ampliar imagen ${index + 1} de ${project.title}`} data-reveal key={image}>
                <img src={image} alt={`${project.title}, fotografía ${index + 1}`} loading={index < 2 ? 'eager' : 'lazy'} />
                <span>{String(index + 1).padStart(2, '0')}</span>
                <i aria-hidden="true">↗</i>
              </button>
            ))}
          </div>
        </section>

        <section className="next-project" data-reveal>
          <p className="eyebrow">Siguiente proyecto</p>
          <a href={`/proyectos/${nextProject.slug}`} onClick={follow(`/proyectos/${nextProject.slug}`)}>
            <span>{nextProject.number}</span><strong>{nextProject.title}</strong><i aria-hidden="true">→</i>
          </a>
        </section>
      </article>
      <ContactSection compact />

      {lightboxIndex !== null && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={`Galería de ${project.title}`} onMouseDown={(event) => { if (event.target === event.currentTarget) setLightboxIndex(null) }}>
          <div className="lightbox__top"><span>{project.title}</span><span>{String(lightboxIndex + 1).padStart(2, '0')} / {String(project.images.length).padStart(2, '0')}</span></div>
          <button className="lightbox__close" type="button" onClick={() => setLightboxIndex(null)} aria-label="Cerrar imagen">Cerrar ×</button>
          <button className="lightbox__nav lightbox__nav--prev" type="button" onClick={() => setLightboxIndex((lightboxIndex - 1 + project.images.length) % project.images.length)} aria-label="Imagen anterior">←</button>
          <img src={project.images[lightboxIndex]} alt={`${project.title}, fotografía ampliada ${lightboxIndex + 1}`} />
          <button className="lightbox__nav lightbox__nav--next" type="button" onClick={() => setLightboxIndex((lightboxIndex + 1) % project.images.length)} aria-label="Imagen siguiente">→</button>
        </div>
      )}
    </div>
  )
}

function ContactSection({ compact = false }: { compact?: boolean }) {
  return (
    <section className={`contact-section ${compact ? 'contact-section--compact' : ''}`} id="contact" aria-labelledby={compact ? 'detail-contact-title' : 'contact-title'}>
      <div className="contact-inner" data-reveal>
        <p className="eyebrow">¿Hacemos algo?</p>
        <h2 id={compact ? 'detail-contact-title' : 'contact-title'}>Tu próxima idea<br /><em>empieza acá.</em></h2>
        <a className="contact-link" href={whatsappUrl} target="_blank" rel="noreferrer">+54 9 362 408-0801 <span aria-hidden="true">↗</span></a>
      </div>
      <div className="contact-footer">
        <span>© 2026 Franco Digital</span>
        <div className="social-links"><a href={instagramUrl} target="_blank" rel="noreferrer">Instagram</a><a href={whatsappUrl} target="_blank" rel="noreferrer">WhatsApp</a></div>
        <a href="#top">Volver arriba ↑</a>
      </div>
    </section>
  )
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [introComplete, setIntroComplete] = useState(false)
  const [pathname, setPathname] = useState(() => normalizePath(window.location.pathname))
  const rootRef = useRef<HTMLElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuHasOpened = useRef(false)

  const navigate: Navigate = (target) => {
    const url = new URL(target, window.location.origin)
    const nextPath = normalizePath(url.pathname)
    window.history.pushState({}, '', `${url.pathname}${url.hash}`)
    setMenuOpen(false)
    if (nextPath !== pathname) {
      window.scrollTo({ top: 0, behavior: 'auto' })
      setPathname(nextPath)
    }
    window.setTimeout(() => {
      if (url.hash) document.querySelector(url.hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      else window.scrollTo({ top: 0, behavior: 'auto' })
    }, nextPath === pathname ? 20 : 100)
  }

  useEffect(() => {
    const handlePopState = () => {
      setMenuOpen(false)
      setPathname(normalizePath(window.location.pathname))
      window.setTimeout(() => {
        if (window.location.hash) document.querySelector(window.location.hash)?.scrollIntoView({ block: 'start' })
        else window.scrollTo({ top: 0, behavior: 'auto' })
      }, 50)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const activeProject = pathname.startsWith('/proyectos/')
    ? projects.find((project) => project.slug === pathname.split('/').filter(Boolean).at(-1))
    : undefined

  useEffect(() => {
    document.title = activeProject ? `${activeProject.title} — Franco Digital` : 'Franco Digital — Diseño y fotografía'
  }, [activeProject])

  useLayoutEffect(() => {
    if (!rootRef.current || !introComplete) return

    const context = gsap.context(() => {
      gsap.fromTo(
        '.route-view',
        { autoAlpha: 0, y: 22, scale: 0.985 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.58, ease: 'power3.out', clearProps: 'opacity,visibility,transform' },
      )
      gsap.from('.site-header', { y: -24, duration: 0.58, ease: 'power3.out', immediateRender: false })
      if (window.matchMedia('(min-width: 761px)').matches) {
        gsap.from('.desktop-navigation a, .desktop-cta', { y: -10, autoAlpha: 0, stagger: 0.055, duration: 0.42, delay: 0.08, ease: 'power3.out' })
      }

      if (pathname === '/') {
        gsap.from('.hero-meta > *', { y: 14, autoAlpha: 0, stagger: 0.055, duration: 0.42, delay: 0.08, ease: 'power3.out' })
        gsap.from('.hero-kicker', { y: 18, autoAlpha: 0, duration: 0.42, delay: 0.14, ease: 'power3.out' })
        gsap.from('.hero h1', { y: 52, autoAlpha: 0, duration: 0.64, delay: 0.16, ease: 'power3.out' })
        gsap.from('.hero-intro, .hero-actions', { y: 22, autoAlpha: 0, stagger: 0.08, duration: 0.5, delay: 0.28, ease: 'power3.out' })
        gsap.to('.hero-copy', { yPercent: -7, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 } })
      } else {
        gsap.from('.project-hero > :not(.project-cover)', { y: 42, autoAlpha: 0, stagger: 0.08, duration: 0.72, ease: 'power3.out' })
        gsap.from('.project-cover', { y: 80, scale: 0.97, autoAlpha: 0, duration: 1, delay: 0.18, ease: 'power3.out' })
      }

      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((element) => {
        if (element.closest('.hero, .project-hero')) return
        gsap.from(element, {
          y: 70,
          autoAlpha: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: element, start: 'top 88%', once: true },
        })
      })

      if (window.matchMedia('(max-width: 760px)').matches) {
        const wordmark = rootRef.current?.querySelector<HTMLElement>('.wordmark')
        const brandLockup = rootRef.current?.querySelector<HTMLElement>('.brand-lockup')
        if (wordmark && brandLockup) {
          const expandedWidth = wordmark.getBoundingClientRect().width
          const collapse = () => {
            gsap.to(wordmark, { width: 0, x: -14, autoAlpha: 0, duration: 0.42, ease: 'power3.out', overwrite: true })
            gsap.to(brandLockup, { gap: 0, duration: 0.42, ease: 'power3.out', overwrite: true })
          }
          const expand = () => {
            gsap.to(wordmark, { width: expandedWidth, x: 0, autoAlpha: 1, duration: 0.42, ease: 'power3.out', overwrite: true })
            gsap.to(brandLockup, { gap: '0.7rem', duration: 0.42, ease: 'power3.out', overwrite: true })
          }
          ScrollTrigger.create({ start: 60, end: 'max', onEnter: collapse, onLeaveBack: expand })
          if (window.scrollY > 60) collapse()
        }
      }
    }, rootRef)

    document.fonts.ready.then(() => ScrollTrigger.refresh())
    return () => context.revert()
  }, [introComplete, pathname])

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
        .fromTo(overlay, { autoAlpha: 0, clipPath: 'inset(0 0 100% 0)', filter: 'blur(10px)' }, { autoAlpha: 1, clipPath: 'inset(0 0 0% 0)', filter: 'blur(0px)', duration: 0.72, ease: 'power4.inOut' })
        .fromTo(links, { y: 58, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.075, duration: 0.58, ease: 'power3.out' }, '-=0.35')
        .fromTo(footer, { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.45, ease: 'power2.out' }, '-=0.2')
    } else {
      timeline
        .to(links, { y: -20, autoAlpha: 0, stagger: 0.035, duration: 0.25, ease: 'power2.in' })
        .to(footer, { y: -12, autoAlpha: 0, duration: 0.2 }, '<')
        .to(overlay, { autoAlpha: 0, clipPath: 'inset(0 0 100% 0)', filter: 'blur(8px)', duration: 0.55, ease: 'power4.inOut' }, '-=0.08')
        .set(overlay, { visibility: 'hidden', pointerEvents: 'none', filter: 'none' })
    }
    return () => { timeline.kill() }
  }, [menuOpen])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false) }
    document.body.classList.toggle('menu-visible', menuOpen)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.classList.remove('menu-visible')
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen])

  const internalLink = (target: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    navigate(target)
  }

  return (
    <main className="site-shell" ref={rootRef}>
      {!introComplete && <Intro onComplete={() => setIntroComplete(true)} />}
      <header className="site-header" id="top">
        <a className="brand-lockup" href="/" onClick={internalLink('/')} aria-label="Franco Digital, inicio">
          <img className="brand-logo" src={francoLogo} alt="Logo de Franco Digital" />
          <span className="wordmark"><strong>FRANCO DIGITAL</strong><small>Diseñador gráfico <i>/</i> fotógrafo profesional</small></span>
        </a>
        <nav className="desktop-navigation" aria-label="Navegación principal">
          <a href="/#work" onClick={internalLink('/#work')}><span>01</span>Proyectos</a>
          <a href="/#services" onClick={internalLink('/#services')}><span>02</span>Servicios</a>
          <a href="/#about" onClick={internalLink('/#about')}><span>03</span>Sobre mí</a>
        </nav>
        <a className="desktop-cta" href={whatsappUrl} target="_blank" rel="noreferrer">
          <span>Hablemos</span><i aria-hidden="true">↗</i>
        </a>
        <button className={`menu-toggle ${menuOpen ? 'is-active' : ''}`} type="button" aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'} aria-controls="fullscreen-menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
          <span className="menu-toggle__label">{menuOpen ? 'Cerrar' : 'Menú'}</span><span className="menu-toggle__icon" aria-hidden="true"><i /><i /></span>
        </button>
      </header>

      <div className={`menu-overlay ${menuOpen ? 'is-open' : ''}`} id="fullscreen-menu" aria-hidden={!menuOpen} ref={menuRef}>
        <nav className="menu-navigation" aria-label="Menú principal">
          <a href="/#work" onClick={internalLink('/#work')} tabIndex={menuOpen ? 0 : -1}><span>01</span><strong>Proyectos</strong><i aria-hidden="true">↗</i></a>
          <a href="/#services" onClick={internalLink('/#services')} tabIndex={menuOpen ? 0 : -1}><span>02</span><strong>¿Qué necesitás?</strong><i aria-hidden="true">↗</i></a>
          <a href="/#about" onClick={internalLink('/#about')} tabIndex={menuOpen ? 0 : -1}><span>03</span><strong>Sobre mí</strong><i aria-hidden="true">↗</i></a>
          <a href="/#contact" onClick={internalLink('/#contact')} tabIndex={menuOpen ? 0 : -1}><span>04</span><strong>Contacto</strong><i aria-hidden="true">↗</i></a>
        </nav>
        <div className="menu-overlay__footer"><span>Diseño gráfico · Fotografía · Contenido</span><a href={instagramUrl} target="_blank" rel="noreferrer" tabIndex={menuOpen ? 0 : -1}>@francodigital__ ↗</a></div>
      </div>

      {pathname === '/' ? <HomePage navigate={navigate} /> : activeProject ? <ProjectDetail project={activeProject} navigate={navigate} /> : (
        <section className="route-view not-found"><p className="eyebrow">Error 404</p><h1>Esta página<br /><em>no existe.</em></h1><a className="text-link" href="/" onClick={internalLink('/')}><span>Volver al inicio</span><span>→</span></a></section>
      )}
    </main>
  )
}

export default App
