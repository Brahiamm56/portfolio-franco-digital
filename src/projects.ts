import bn01 from './assets/projects/bn/01.jpg'
import bn02 from './assets/projects/bn/02.jpg'
import bn03 from './assets/projects/bn/03.jpg'
import bn04 from './assets/projects/bn/04.jpg'
import bn05 from './assets/projects/bn/05.jpg'
import p2701 from './assets/projects/p27/01.jpg'
import p2702 from './assets/projects/p27/02.jpg'
import p2703 from './assets/projects/p27/03.jpg'
import p2704 from './assets/projects/p27/04.jpg'
import p2705 from './assets/projects/p27/05.jpg'
import tenis01 from './assets/projects/tenis/01.jpg'
import tenis02 from './assets/projects/tenis/02.jpg'
import tenis03 from './assets/projects/tenis/03.jpg'
import tenis04 from './assets/projects/tenis/04.jpg'
import tenis05 from './assets/projects/tenis/05.jpg'
import postales01 from './assets/projects/postales/01.jpg'
import postales02 from './assets/projects/postales/02.jpg'
import postales03 from './assets/projects/postales/03.jpg'
import postales04 from './assets/projects/postales/04.jpg'
import postales05 from './assets/projects/postales/05.jpg'
import karting01 from './assets/projects/karting-gallery/01.jpg'
import karting02 from './assets/projects/karting-gallery/02.jpg'
import karting03 from './assets/projects/karting-gallery/03.jpg'
import karting04 from './assets/projects/karting-gallery/04.jpg'
import karting05 from './assets/projects/karting-gallery/05.jpg'
import palermo01 from './assets/projects/palermo/01.jpg'
import palermo02 from './assets/projects/palermo/02.jpg'
import palermo03 from './assets/projects/palermo/03.jpg'
import palermo04 from './assets/projects/palermo/04.jpg'
import palermo05 from './assets/projects/palermo/05.jpg'
import hercules01 from './assets/projects/hercules/01.jpg'
import hercules02 from './assets/projects/hercules/02.jpg'
import hercules03 from './assets/projects/hercules/03.jpg'
import hercules04 from './assets/projects/hercules/04.jpg'
import hercules05 from './assets/projects/hercules/05.jpg'

export type Project = {
  slug: string
  number: string
  title: string
  type: string
  category: string
  year: string
  location: string
  summary: string
  description: string
  services: string[]
  images: string[]
}

export const projects: Project[] = [
  {
    slug: 'bn-identidad-en-cancha',
    number: '01',
    title: 'B&N — Identidad en cancha',
    type: 'Fotografía + diseño de piezas',
    category: 'Pádel / Dirección visual',
    year: '2026',
    location: 'Chaco, Argentina',
    summary: 'Una serie en blanco y negro que combina fotografía deportiva, resultados y una dirección visual reconocible.',
    description: 'El movimiento se trabaja como materia gráfica: grano, contraste, encuadres cerrados y placas de resultados construyen una identidad consistente dentro y fuera de la cancha.',
    services: ['Fotografía deportiva', 'Edición', 'Piezas para redes'],
    images: [bn01, bn02, bn03, bn04, bn05],
  },
  {
    slug: 'p27-la-leonesa',
    number: '02',
    title: 'P27 La Leonesa',
    type: 'Cobertura + contenido social',
    category: 'Evento / Cultura',
    year: '2026',
    location: 'La Leonesa, Chaco',
    summary: 'Energía, escenario y color convertidos en una narrativa visual para redes.',
    description: 'La cobertura se pensó como una secuencia: momentos en vivo, retratos espontáneos y composiciones editoriales que reconstruyen el ritmo completo del evento.',
    services: ['Cobertura fotográfica', 'Selección editorial', 'Diseño de carrusel'],
    images: [p2701, p2702, p2703, p2704, p2705],
  },
  {
    slug: 'torneo-padel',
    number: '03',
    title: 'Torneo — Pádel en acción',
    type: 'Fotografía deportiva',
    category: 'Pádel / Torneo',
    year: '2026',
    location: 'Chaco, Argentina',
    summary: 'Velocidad, tensión y precisión registradas desde una mirada limpia y cercana.',
    description: 'Una cobertura centrada en gestos, impacto y técnica. La serie alterna planos abiertos con detalles para contar el torneo desde el cuerpo y la intensidad de cada punto.',
    services: ['Cobertura deportiva', 'Retoque', 'Curaduría de serie'],
    images: [tenis01, tenis02, tenis03, tenis04, tenis05],
  },
  {
    slug: 'postales-basquet',
    number: '04',
    title: 'Postales de una gran jornada',
    type: 'Fotografía deportiva',
    category: 'Básquet / Partido',
    year: '2026',
    location: 'Chaco, Argentina',
    summary: 'Una crónica visual de intensidad, contacto y emoción dentro de la cancha.',
    description: 'La cámara acompaña el juego sin quitarle velocidad. Acción, miradas y pequeños momentos se ordenan en una galería que conserva la tensión del partido.',
    services: ['Fotografía', 'Edición de color', 'Entrega para redes'],
    images: [postales01, postales02, postales03, postales04, postales05],
  },
  {
    slug: 'karting-al-atardecer',
    number: '05',
    title: 'Karting al atardecer',
    type: 'Fotografía de automovilismo',
    category: 'Motor / Velocidad',
    year: '2026',
    location: 'La Leonesa, Chaco',
    summary: 'Velocidad, tierra y luz baja en una serie construida alrededor del movimiento.',
    description: 'Barridos, contraluces y planos de detalle convierten una jornada de pruebas en una historia de velocidad. La edición conserva el polvo y la calidez del atardecer.',
    services: ['Fotografía de acción', 'Retoque', 'Contenido social'],
    images: [karting01, karting02, karting03, karting04, karting05],
  },
  {
    slug: 'palermo-basquet',
    number: '06',
    title: 'Palermo — Básquet nocturno',
    type: 'Fotografía deportiva',
    category: 'Básquet / Documental',
    year: '2025',
    location: 'Chaco, Argentina',
    summary: 'Los primeros pasos de una búsqueda fotográfica que pone el foco en la emoción del juego.',
    description: 'Una serie directa y nocturna donde la luz disponible, el gesto y la cercanía construyen el relato. Cada imagen busca guardar lo que sucede entre una jugada y la siguiente.',
    services: ['Fotografía documental', 'Cobertura', 'Edición'],
    images: [palermo01, palermo02, palermo03, palermo04, palermo05],
  },
  {
    slug: 'hercules-noche-gloriosa',
    number: '07',
    title: 'Hércules — Noche gloriosa',
    type: 'Cobertura fotográfica',
    category: 'Básquet / Club',
    year: '2026',
    location: 'Charata, Chaco',
    summary: 'Retratos, equipo y celebración para conservar una noche importante del club.',
    description: 'La cobertura combina identidad, retrato colectivo y acción. El resultado es una memoria visual pensada para comunicar el momento y fortalecer el archivo del club.',
    services: ['Fotografía de equipo', 'Cobertura', 'Archivo visual'],
    images: [hercules01, hercules02, hercules03, hercules04, hercules05],
  },
]
