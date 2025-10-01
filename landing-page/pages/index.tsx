import Head from 'next/head'
import { useState, useEffect } from 'react'
import { Sun, Moon, X } from 'lucide-react'
import Carousel from '../components/Carousel'

const IMAGES = [
    '/assets/screenshots/desktop-projection-light.png',
    '/assets/screenshots/desktop-projection-dark.png',
    '/assets/screenshots/dashboard-light.png',
    '/assets/screenshots/dashboard-dark.png',
    '/assets/screenshots/activites-light.png',
    '/assets/screenshots/activites-dark.png',
    '/assets/screenshots/live-phone-light.png',
    '/assets/screenshots/live-phone-dark.png',
]

function Lightbox({ src, caption, onClose }: { src: string | null; caption?: string; onClose: () => void }) {
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [onClose])

    if (!src) return null
    return (
        <div className="lightbox" onClick={onClose} role="dialog" aria-modal="true">
            <div className="lightbox-content" onClick={e => e.stopPropagation()}>
                <button className="lightbox-close" onClick={onClose} aria-label="Fermer"><X size={20} /></button>
                <img src={src} alt="Screenshot agrandie" />
                {caption && <div className="screenshot-caption" style={{ padding: '0.75rem 1rem' }}>{caption}</div>}
            </div>
        </div>
    )
}

export default function Home() {
    const [theme, setTheme] = useState<'dark' | 'light'>(() => 'light')
    const [lightbox, setLightbox] = useState<string | null>(null)
    const [activeIndex, setActiveIndex] = useState(0)

    useEffect(() => {
        const stored = localStorage.getItem('theme')
        if (stored === 'dark' || stored === 'light') setTheme(stored)
        else setTheme(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    }, [])

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
        localStorage.setItem('theme', theme)
    }, [theme])

    const captions: Record<string, string> = {
        'desktop-projection': 'Projection — Vue vidéoprojecteur',
        'dashboard': 'Tableau de bord enseignant — gestion des quiz',
        'activites': "Activités — listing et instanciation",
        'live-phone': 'Vue mobile — participation en direct'
    }

    function captionFor(src?: string | null) {
        if (!src) return undefined
        const name = src.split('/').pop() || ''
        // match base name like 'dashboard' from 'dashboard-light.png'
        const m = name.match(/^([a-z0-9\-]+)-(light|dark)\./i)
        if (!m) return undefined
        const key = m[1]
        return captions[key] || undefined
    }

    return (
        <>
            <Head>
                <title>Kutsum – Alternative libre à Kahoot pour l'éducation</title>
                <meta name="description" content="Kutsum est une plateforme libre, gratuite et sans publicité pour créer des quiz interactifs, organiser des tournois et suivre la progression de vos élèves." />
                <link rel="canonical" href="https://www.kutsum.org/" />

                {/* Open Graph / Social */}
                <meta property="og:site_name" content="Kutsum" />
                <meta property="og:title" content="Kutsum – Alternative libre à Kahoot pour l'éducation" />
                <meta property="og:description" content="Kutsum est une plateforme libre, gratuite et sans publicité pour créer des quiz interactifs, organiser des tournois et suivre la progression de vos élèves." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://www.kutsum.org/" />
                <meta property="og:image" content="https://www.kutsum.org/assets/og-image.svg" />

                {/* Twitter card (useful even without an account; many platforms read these) */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Kutsum – Alternative libre à Kahoot" />
                <meta name="twitter:description" content="Kutsum est une plateforme libre, gratuite et sans publicité pour créer des quiz interactifs, organiser des tournois et suivre la progression de vos élèves." />
                <meta name="twitter:image" content="https://www.kutsum.org/assets/og-image.svg" />

                {/* Structured data: SoftwareApplication + Organization */}
                <script type="application/ld+json" dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@graph": [
                            {
                                "@type": "SoftwareApplication",
                                "name": "Kutsum",
                                "url": "https://www.kutsum.org/",
                                "description": "Kutsum est une plateforme libre et gratuite pour créer des quiz interactifs, organiser des tournois et suivre la progression des élèves.",
                                "applicationCategory": "Education",
                                "operatingSystem": "Web",
                                "screenshot": ["https://www.kutsum.org/assets/screenshots/desktop-projection-light.png"],
                                "author": { "@type": "Organization", "name": "Kutsum", "url": "https://www.kutsum.org/" }
                            },
                            {
                                "@type": "Organization",
                                "name": "Kutsum",
                                "url": "https://www.kutsum.org/",
                                "logo": "https://www.kutsum.org/assets/favicon.svg",
                                "sameAs": ["https://github.com/kutsum", "https://docs.kutsum.org"]
                            }
                        ]
                    })
                }} />
            </Head>

            <button className="theme-toggle" aria-label="Changer le thème" onClick={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}>
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <header className="hero">
                <div className="container">
                    <div className="hero-content">
                        <h1 className="hero-title">L'alternative <span className="highlight">libre</span> à Kahoot</h1>
                        <p className="hero-slogan">L'application de révisions qui n'en fait qu'à sa tête</p>
                        <p className="hero-subtitle">Kutsum facilite les révisions et dynamise les cours en proposant des quiz interactifs, des tournois et des outils de suivi de progression. Conçu pour les enseignants et les formateurs, il fonctionne sur ordinateur et mobile, et reste 100% gratuit et open source.</p>
                        <div className="hero-cta">
                            <a href="https://app.kutsum.org" className="btn btn-primary btn-lg">Essayer gratuitement</a>
                            <a href="https://docs.kutsum.org" className="btn btn-secondary btn-lg">Découvrir →</a>
                        </div>
                        <p className="hero-note">✓ Sans inscription pour les élèves · ✓ Du CP au post-bac · ✓ Support LaTeX</p>
                    </div>
                </div>
            </header>

            <main>
                <section className="value-prop">
                    <div className="container">
                        <h2 className="section-title">Pourquoi Kutsum ?</h2>
                        <div className="values">
                            <div className="value"><div className="value-icon">🆓</div><h3>100% Gratuit</h3><p>Aucun abonnement, aucune limite d'utilisation.</p></div>
                            <div className="value"><div className="value-icon">🔒</div><h3>Respecte votre vie privée</h3><p>Aucune publicité, aucun tracking.</p></div>
                            <div className="value"><div className="value-icon">🌍</div><h3>Open Source</h3><p>Code source ouvert (GPL-3.0).</p></div>
                            <div className="value"><div className="value-icon">🤝</div><h3>Base collaborative</h3><p>Contribuez et enrichissez la base.</p></div>
                        </div>
                    </div>
                </section>

                <section className="screenshots">
                    <div className="container">
                        <h2 className="section-title">Interface intuitive et responsive</h2>
                        <p className="section-subtitle">Fonctionne parfaitement sur ordinateur, tablette et mobile</p>

                        {/* show only screenshots matching the current theme */}
                        <Carousel
                            images={IMAGES.filter(src => {
                                if (theme === 'dark') return src.includes('-dark')
                                return src.includes('-light')
                            })}
                            onImageClick={src => setLightbox(src)}
                            onSlideChange={(idx) => setActiveIndex(idx)}
                            getAlt={(src) => captionFor(src)}
                        />
                        {/* caption for the currently visible slide */}
                        <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
                            <div className="screenshot-caption">{captionFor(IMAGES.filter(src => theme === 'dark' ? src.includes('-dark') : src.includes('-light'))[activeIndex])}</div>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="footer">
                <div className="container">
                    <p>Licence GPL-3.0 · Kutsum · 2025</p>
                </div>
            </footer>

            <Lightbox src={lightbox} caption={captionFor(lightbox)} onClose={() => setLightbox(null)} />
        </>
    )
}
