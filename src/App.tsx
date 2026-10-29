import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import francoLogo from './assets/franco-digital-logo.png'
import francoPortrait from './assets/franco-acuna-portrait.jpg'
import FlexCarousel from './components/FlexCarousel'
import { projects, type Project } from './projects'
import './App.css'

gsap.registerPlugin(ScrollTrigger)

const GalleryStudio = lazy(() => import('./galleries/GalleryStudio'))

const instagramUrl = 'https://www.instagram.com/francodigital__/'
const whatsappUrl = 'https://wa.me/5493624080801'

function ReiconArrowUpRight({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M19 4.25C19.4142 4.25 19.75 4.58579 19.75 5V13C19.75 13.4142 19.4142 13.75 19 13.75C18.5858 13.75 18.25 13.4142 18.25 13V6.81066L5.53033 19.5303C5.23744 19.8232 4.76256 19.8232 4.46967 19.5303C4.17678 19.2374 4.17678 18.7626 4.46967 18.4697L17.1893 5.75H11C10.5858 5.75 10.25 5.41421 10.25 5C10.25 4.58579 10.5858 4.25 11 4.25H19Z" fill="currentColor" /></svg>
}

function ReiconInstagram({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M12 15.5C13.933 15.5 15.5 13.933 15.5 12C15.5 10.067 13.933 8.5 12 8.5C10.067 8.5 8.5 10.067 8.5 12C8.5 13.933 10.067 15.5 12 15.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M17.6361 7H17.6477" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function WhatsAppLogo({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.272-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>
}

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
        <div className="hero-layout">
          <div className="hero-copy">
            <h1 id="hero-title">Diseño que <em>se mueve.</em><br />Imágenes que quedan.</h1>
            <p className="hero-intro">Identidad visual, contenido y fotografía para marcas, clubes y proyectos que quieren comunicar con una imagen propia.</p>
            <div className="hero-actions">
              <a className="text-link" href="/#work" onClick={follow('/#work')}>
                <span>Explorar proyectos</span><span className="link-arrow" aria-hidden="true">↘</span>
              </a>
              <div className="hero-socials">
                <a className="instagram-button" href={instagramUrl} target="_blank" rel="noreferrer" aria-label="Ver Instagram de Franco Digital">
                  <ReiconInstagram className="instagram-button__icon" /><span>Instagram</span><ReiconArrowUpRight className="instagram-button__arrow" />
                </a>
                <a className="whatsapp-button" href={whatsappUrl} target="_blank" rel="noreferrer" aria-label="Hablar con Franco Digital por WhatsApp">
                  <WhatsAppLogo className="whatsapp-button__icon" /><span>WhatsApp</span><ReiconArrowUpRight className="whatsapp-button__arrow" />
                </a>
              </div>
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
              cardHeight={0.46}
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
          <a className="back-link" href="/#work" onClick={follow('/#work')}><span aria-hidden="true">←</span> Volver a proyectos</a>
          <h1>{project.title}</h1>
        </header>

        <section className="project-gallery" aria-label={`Fotos de ${project.title}`}>
          <div className="gallery-grid">
            {project.images.map((image, index) => (
              <button className={`gallery-item gallery-item--${index + 1}`} type="button" onClick={() => setLightboxIndex(index)} aria-label={`Ampliar imagen ${index + 1} de ${project.title}`} data-reveal key={image}>
                <img src={image} alt={`${project.title}, fotografía ${index + 1}`} loading={index < 2 ? 'eager' : 'lazy'} />
              </button>
            ))}
          </div>
        </section>
        <p className="project-hero__summary">{project.summary}</p>
      </article>

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
        <a className="contact-link" href={whatsappUrl} target="_blank" rel="noreferrer"><WhatsAppLogo className="contact-link__whatsapp" />+54 9 362 408-0801 <ReiconArrowUpRight className="contact-link__arrow" /></a>
      </div>
      <div className="contact-footer">
        <span>© 2026 Franco Digital</span>
        <div className="social-links"><a href={instagramUrl} target="_blank" rel="noreferrer"><ReiconInstagram className="social-links__icon social-links__icon--instagram" />Instagram</a><a href={whatsappUrl} target="_blank" rel="noreferrer"><WhatsAppLogo className="social-links__icon social-links__icon--whatsapp" />WhatsApp</a></div>
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
    const shareGallery = pathname.startsWith('/galeria/')
    document.title = pathname === '/admin'
      ? 'Panel de fotografía — Franco Digital'
      : shareGallery
        ? 'Galería privada — Franco Digital'
        : pathname === '/galerias'
          ? 'Galerías en vivo — Franco Digital'
          : activeProject ? `${activeProject.title} — Franco Digital` : 'Franco Digital — Diseño y fotografía'
  }, [activeProject, pathname])

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
        gsap.from('.desktop-navigation a', { y: -10, autoAlpha: 0, stagger: 0.055, duration: 0.42, delay: 0.08, ease: 'power3.out', clearProps: 'transform,opacity' })
      }

      if (pathname === '/') {
        gsap.from('.hero-meta > *', { y: 14, autoAlpha: 0, stagger: 0.055, duration: 0.42, delay: 0.08, ease: 'power3.out' })
        gsap.from('.hero h1', { y: 52, autoAlpha: 0, duration: 0.64, delay: 0.16, ease: 'power3.out' })
        gsap.from('.hero-intro, .hero-actions', { y: 22, autoAlpha: 0, stagger: 0.08, duration: 0.5, delay: 0.28, ease: 'power3.out' })
        gsap.to('.hero-copy', { yPercent: -7, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 } })
      } else {
        gsap.from('.project-hero > *', { y: 28, autoAlpha: 0, stagger: 0.06, duration: 0.52, ease: 'power3.out' })
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

  const adminRoute = pathname === '/admin'
  const sharedGalleryToken = pathname.startsWith('/galeria/') ? pathname.split('/').filter(Boolean).at(-1) ?? '' : ''

  return (
    <main className={`site-shell ${adminRoute ? 'site-shell--photo-app' : ''}`} ref={rootRef}>
      {adminRoute ? (
        <Suspense fallback={<div className="route-view"><p className="eyebrow">ARCHIVO PRIVADO</p><p>Abriendo la galería…</p></div>}>
          <GalleryStudio mode="admin" />
        </Suspense>
      ) : <>
      {!introComplete && <Intro onComplete={() => setIntroComplete(true)} />}
      <header className="site-header" id="top">
        <a className="brand-lockup" href="/" onClick={internalLink('/')} aria-label="Franco Digital, inicio">
          <img className="brand-logo" src={francoLogo} alt="Logo de Franco Digital" />
          <span className="wordmark"><strong>FRANCO DIGITAL</strong><small>Diseñador gráfico <i>/</i> fotógrafo profesional</small></span>
        </a>
        <nav className="desktop-navigation" aria-label="Navegación principal">
          <a className={pathname === '/' || activeProject ? 'is-active' : ''} href="/#work" onClick={internalLink('/#work')}><span>01</span>Proyectos</a>
          <a href="/#services" onClick={internalLink('/#services')}><span>02</span>Servicios</a>
          <a href="/#about" onClick={internalLink('/#about')}><span>03</span>Sobre mí</a>
          <a className={pathname === '/galerias' ? 'is-active' : ''} href="/galerias" onClick={internalLink('/galerias')}><span>04</span>Galerías</a>
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
          <a href="/#work" onClick={internalLink('/#work')} tabIndex={menuOpen ? 0 : -1}><strong>Proyectos</strong><ReiconArrowUpRight className="menu-navigation__arrow" /></a>
          <a href="/#services" onClick={internalLink('/#services')} tabIndex={menuOpen ? 0 : -1}><strong>¿Qué necesitás?</strong><ReiconArrowUpRight className="menu-navigation__arrow" /></a>
          <a href="/#about" onClick={internalLink('/#about')} tabIndex={menuOpen ? 0 : -1}><strong>Sobre mí</strong><ReiconArrowUpRight className="menu-navigation__arrow" /></a>
          <a href="/galerias" onClick={internalLink('/galerias')} tabIndex={menuOpen ? 0 : -1}><strong>Galerías</strong><ReiconArrowUpRight className="menu-navigation__arrow" /></a>
          <a href="/#contact" onClick={internalLink('/#contact')} tabIndex={menuOpen ? 0 : -1}><strong>Contacto</strong><ReiconArrowUpRight className="menu-navigation__arrow" /></a>
        </nav>
        <div className="menu-overlay__footer">
          <span>Diseño gráfico · Fotografía · Contenido</span>
          <div className="menu-overlay__socials">
            <a className="menu-overlay__social-link" href={instagramUrl} target="_blank" rel="noreferrer" tabIndex={menuOpen ? 0 : -1}><ReiconInstagram className="menu-overlay__social-icon" /><span>@francodigital__</span></a>
            <a className="menu-overlay__social-link menu-overlay__social-link--whatsapp" href={whatsappUrl} target="_blank" rel="noreferrer" tabIndex={menuOpen ? 0 : -1}><WhatsAppLogo className="menu-overlay__social-icon" /><span><strong>Franco Digital</strong><small>Hablá conmigo</small></span></a>
          </div>
        </div>
      </div>

      {pathname === '/' ? <HomePage navigate={navigate} /> : activeProject ? <ProjectDetail project={activeProject} navigate={navigate} /> : pathname.startsWith('/galeria/') ? (
        <Suspense fallback={<div className="route-view"><p className="eyebrow">ARCHIVO PRIVADO</p><p>Abriendo la galería…</p></div>}><GalleryStudio mode="gallery" token={sharedGalleryToken} /></Suspense>
      ) : pathname === '/galerias' ? (
        <Suspense fallback={<div className="route-view"><p className="eyebrow">ARCHIVO PÚBLICO</p><p>Cargando galerías…</p></div>}><GalleryStudio mode="directory" /></Suspense>
      ) : (
        <section className="route-view not-found"><p className="eyebrow">Error 404</p><h1>Esta página<br /><em>no existe.</em></h1><a className="text-link" href="/" onClick={internalLink('/')}><span>Volver al inicio</span><span>→</span></a></section>
      )}
      </>}
    </main>
  )
}

export default App
