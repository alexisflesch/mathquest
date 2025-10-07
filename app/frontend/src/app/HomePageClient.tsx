/**
 * Kutsum Landing Page
 * 
 * This component serves as the main entry point for the application, providing:
 * - A welcome introduction to the Kutsum platform
 * - Role selection between Student and Teacher modes
 * - Smart navigation that remembers previous user roles
 * - Visual branding with the Kutsum logo
 * 
 * The page intelligently directs returning users to the appropriate dashboard
 * based on their authentication status, while new users are guided through
 * the initial onboarding flow for their selected role.
 */

"use client";
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import InfinitySpin from '@/components/InfinitySpin';
import { useEffect } from 'react';
import { Gamepad, LogIn, User, SquareArrowRight, BookOpen, ClipboardList, PlusCircle, Globe, FilePlus, Github } from 'lucide-react';

export default function HomePageClient() {
    const { userState, userProfile, isLoading, refreshAuth } = useAuth();

    useEffect(() => {
        // Check if we just logged out (URL param)
        if (typeof window !== 'undefined' && window.location.href.includes('loggedOut=true')) {
            console.log('[LandingPage] Detected logout redirection, forcing auth refresh');

            // Force auth refresh to ensure we have the latest state
            refreshAuth(true);

            // Create a slight delay to ensure cookies are properly processed
            const timeoutId = setTimeout(() => {
                console.log('[LandingPage] Post-logout check - verifying authentication state');
                refreshAuth(true); // Double-check auth state after a delay
            }, 500);

            // Clean up URL
            window.history.replaceState({}, document.title, '/');

            // Clear timeout on unmount
            return () => clearTimeout(timeoutId);
        }
        // Return empty cleanup function for consistency
        return () => { };
    }, [refreshAuth]);

    // No automatic redirects - let users navigate from the main landing page
    useEffect(() => {
        if (isLoading) return;
        // All user types stay on landing page - no redirects to separate home pages
        console.log('[LandingPage] User state loaded, showing landing page for all users');
    }, [isLoading]);

    if (isLoading) {
        // Show loading while authentication state is being determined
        return (
            <div className="main-content">
                <div className="card w-full max-w-4xl bg-base-100 rounded-lg shadow-xl my-6">
                    <div className="card-body items-center">
                        <InfinitySpin size={48} />
                    </div>
                </div>
            </div>
        );
    }

    // Anonymous variant
    if (userState === 'anonymous') {
        return (
            <div className="main-content">
                <div className="card w-full max-w-4xl bg-base-100 rounded-lg shadow-xl my-6">
                    <div className="card-body items-center gap-8">
                        {/* Header with logo */}
                        <div className="flex items-center justify-center gap-4 mb-2">
                            <Image src="/favicon.svg" alt="Kutsum logo" width={64} height={64} priority />
                            <h1 className="text-3xl text-center font-bold text-base-content">Kutsum</h1>
                        </div>

                        <div className="text-center mx-auto">
                            {/* Slogan (emoji removed) */}
                            <p className="text-lg text-muted-foreground mb-8">L&apos;appli de révisions qui n&apos;en fait qu&apos;à sa tête</p>

                            {/* Instruction - full width, left aligned */}
                            <p className="text-sm text-base-content mb-6 text-left">Choisissez un pseudo et un avatar pour commencer rapidement — pas d&apos;inscription requise.</p>

                            {/* CTA links - stacked on mobile (left aligned), centered on larger screens */}
                            <div className="p-3 w-full max-w-md mx-auto mt-2">
                                {/* Use the same grid + full-width button style as teacher/guest mobile actions so labels align */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <span className="p-3 border border-base-200 rounded-md w-full inline-flex items-center gap-3 text-sm leading-normal">
                                        <Link href="/login?mode=guest" aria-label="Commencer sans compte" className="inline-flex items-center gap-2 text-primary hover:underline w-full">
                                            <Gamepad className="w-4 h-4" aria-hidden="true" />{"\u00A0"}
                                            <span className="text-sm leading-normal">Commencer sans compte</span>
                                        </Link>
                                    </span>

                                    <span className="p-3 border border-base-200 rounded-md w-full inline-flex items-center gap-3 text-sm leading-normal">
                                        <Link href="/login?mode=account" aria-label="Se connecter ou créer un compte" className="inline-flex items-center gap-2 text-primary hover:underline w-full">
                                            <LogIn className="w-4 h-4" aria-hidden="true" />{"\u00A0"}
                                            <span className="text-sm leading-normal">Se connecter / Créer un compte</span>
                                        </Link>
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="w-full mt-10">
                            <div className="text-left space-y-2">
                                <p className="text-sm text-muted-foreground">Pour en savoir plus :</p>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                    <a
                                        href="https://kutsum.org"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label="Site du projet externe"
                                        className="inline-flex items-center gap-1 text-primary hover:underline text-sm leading-normal mr-6"
                                    >
                                        <Globe className="w-4 h-4" aria-hidden="true" />{'\u00A0'}
                                        <span className="text-sm leading-normal">Site du projet</span>
                                    </a>
                                    <a
                                        href="https://docs.kutsum.org"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label="Documentation externe"
                                        className="inline-flex items-center gap-1 text-primary hover:underline text-sm leading-normal"
                                    >
                                        <BookOpen className="w-4 h-4" aria-hidden="true" />{'\u00A0'}
                                        <span className="text-sm leading-normal">Documentation</span>
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Dev warning */}
                        <div className="w-full mt-6">
                            <div className="bg-yellow-50 border border-yellow-300 text-yellow-900 rounded-lg p-4 shadow-sm text-base">
                                <strong>⚠️ En développement :</strong> le service peut être interrompu pour mise à jour.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Guests and Students variant
    if (userState === 'guest' || userState === 'student') {
        const username = userProfile.username || 'Tu';
        return (
            <div className="main-content">
                <div className="card w-full max-w-4xl bg-base-100 rounded-lg shadow-xl my-6">
                    <div className="card-body items-center gap-8">
                        <div className="flex items-center justify-center gap-4 mb-2">
                            <Image src="/favicon.svg" alt="Kutsum logo" width={64} height={64} priority />
                            <h1 className="text-3xl text-center font-bold text-base-content">Kutsum</h1>
                        </div>

                        <div className="text-center mx-auto">
                            <p className="text-lg text-muted-foreground mb-8">Keep Up The Speed, Unleash Mastery&nbsp;!</p>
                            <p className="text-sm text-base-content mb-2 text-left">Bonjour {username} 👋, ravi de te revoir&nbsp;!</p>
                            <p className="text-sm text-muted-foreground mb-6 text-left md:hidden">Utilise les boutons ci-dessous ou le menu pour naviguer dans l&apos;application.</p>

                            {/* Mobile: Quick action buttons */}
                            <div className="md:hidden p-3 w-full max-w-md mx-auto mt-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <span className="p-3 border border-base-200 rounded-md w-full inline-flex items-center gap-3 text-sm leading-normal">
                                        <Link href="/student/practice" className="inline-flex items-center gap-2 text-primary hover:underline">
                                            <BookOpen className="w-4 h-4" aria-hidden="true" />{'\u00A0'}
                                            <span className="text-sm leading-normal">Entraînement libre</span>
                                        </Link>
                                    </span>

                                    <span className="p-3 border border-base-200 rounded-md w-full inline-flex items-center gap-3 text-sm leading-normal">
                                        <Link href="/student/join" className="inline-flex items-center gap-2 text-primary hover:underline">
                                            <SquareArrowRight className="w-4 h-4" aria-hidden="true" />{'\u00A0'}
                                            <span className="text-sm leading-normal">Rejoindre une activité</span>
                                        </Link>
                                    </span>

                                    <span className="p-3 border border-base-200 rounded-md w-full inline-flex items-center gap-3 text-sm leading-normal">
                                        <Link href="/my-tournaments" className="inline-flex items-center gap-2 text-primary hover:underline">
                                            <ClipboardList className="w-4 h-4" aria-hidden="true" />{'\u00A0'}
                                            <span className="text-sm leading-normal">Mon historique</span>
                                        </Link>
                                    </span>

                                    <span className="p-3 border border-base-200 rounded-md w-full inline-flex items-center gap-3 text-sm leading-normal">
                                        <Link href="/profile" className="inline-flex items-center gap-2 text-primary hover:underline">
                                            <User className="w-4 h-4" aria-hidden="true" />{'\u00A0'}
                                            <span className="text-sm leading-normal">Mon profil</span>
                                        </Link>
                                    </span>
                                </div>
                            </div>

                            {/* Desktop: Explanatory text with menu guidance */}
                            <div className="hidden md:block text-left mt-4">
                                <p className="text-sm text-muted-foreground mb-4">
                                    Utilise le menu à gauche pour naviguer dans l&apos;application. Tu peux :
                                </p>
                                <ul className="text-sm text-base-content space-y-2 list-disc list-inside ml-2">
                                    <li><strong>Démarrer un entraînement</strong> : pratique à ton rythme avec des questions aléatoires</li>
                                    <li><strong>Rejoindre une activité</strong> : participe à un tournoi ou un quiz en direct</li>
                                    <li><strong>Créer un tournoi</strong> : défi tes amis en direct ou en différé avec des questions aléatoires</li>
                                    <li><strong>Consulter ton historique</strong> : revois tes performances passées et tes statistiques</li>
                                    <li><strong>Gérer ton profil</strong> : modifie ton avatar, ton pseudo et tes préférences</li>
                                </ul>
                            </div>
                        </div>

                        <div className="w-full mt-10">
                            <div className="text-left space-y-2">
                                <p className="text-sm text-muted-foreground">Pour en savoir plus :</p>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                    <a
                                        href="https://kutsum.org"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label="Site du projet externe"
                                        className="inline-flex items-center gap-1 text-primary hover:underline text-sm leading-normal mr-6"
                                    >
                                        <Globe className="w-4 h-4" aria-hidden="true" />{'\u00A0'}
                                        <span className="text-sm leading-normal">Site du projet</span>
                                    </a>
                                    <a
                                        href="https://docs.kutsum.org"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label="Documentation externe"
                                        className="inline-flex items-center gap-1 text-primary hover:underline text-sm leading-normal"
                                    >
                                        <BookOpen className="w-4 h-4" aria-hidden="true" />{'\u00A0'}
                                        <span className="text-sm leading-normal">Documentation</span>
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Dev warning */}
                        <div className="w-full mt-6">
                            <div className="bg-yellow-50 border border-yellow-300 text-yellow-900 rounded-lg p-4 shadow-sm text-base">
                                <strong>⚠️ En développement :</strong> le service peut être interrompu pour mise à jour.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Teacher variant
    if (userState === 'teacher') {
        const username = userProfile.username || 'Professeur';
        return (
            <div className="main-content">
                <div className="card w-full max-w-4xl bg-base-100 rounded-lg shadow-xl my-6">
                    <div className="card-body items-center gap-8">
                        <div className="flex items-center justify-center gap-4 mb-2">
                            <Image src="/favicon.svg" alt="Kutsum logo" width={64} height={64} priority />
                            <h1 className="text-3xl text-center font-bold text-base-content">Kutsum</h1>
                        </div>

                        <div className="text-center mx-auto">
                            <p className="text-lg text-muted-foreground mb-8">Keep Up The Speed, Unleash Mastery&nbsp;!</p>
                            <p className="text-sm text-base-content mb-2 text-left">Bonjour {username} 👋, ravi de vous revoir&nbsp;!</p>
                            <p className="text-sm text-muted-foreground mb-6 text-left md:hidden">Utilisez les boutons ci-dessous ou le menu pour gérer vos activités.</p>

                            {/* Mobile: Quick action buttons */}
                            <div className="md:hidden p-3 w-full max-w-md mx-auto mt-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <span className="p-3 border border-base-200 rounded-md w-full inline-flex items-center gap-3 text-sm leading-normal">
                                        <Link href="/teacher/games" className="inline-flex items-center gap-2 text-primary hover:underline">
                                            <BookOpen className="w-4 h-4" aria-hidden="true" />{'\u00A0'}
                                            <span className="text-sm leading-normal">Mes activités</span>
                                        </Link>
                                    </span>

                                    <span className="p-3 border border-base-200 rounded-md w-full inline-flex items-center gap-3 text-sm leading-normal">
                                        <Link href="/teacher/games/new" className="inline-flex items-center gap-2 text-primary hover:underline">
                                            <FilePlus className="w-4 h-4" aria-hidden="true" />{'\u00A0'}
                                            <span className="text-sm leading-normal">Créer une activité</span>
                                        </Link>
                                    </span>
                                </div>
                            </div>

                            {/* Desktop: Explanatory text with menu guidance */}
                            <div className="hidden md:block text-left mt-4">
                                <p className="text-sm text-muted-foreground mb-4">Utilisez le menu à gauche pour naviguer dans l&apos;application. Vous pouvez :</p>
                                <ul className="text-sm text-base-content space-y-2 list-disc list-inside ml-2">
                                    <li><strong>Gérer vos activités existantes</strong> : gérer vos sessions et tournois existants</li>
                                    <li><strong>Créer de nouvelles activités</strong> : préparer de nouveaux quiz ou tournois pour vos élèves en piochant dans la base de données</li>
                                </ul>
                            </div>

                            {/* Resources section */}
                            <div className="mt-10 text-left">
                                <p className="text-sm text-muted-foreground mb-3">Pour en savoir plus :</p>
                                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                                    <a
                                        href="https://kutsum.org"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label="Site du projet Kutsum"
                                        className="inline-flex items-center gap-1 text-primary hover:underline text-sm leading-normal"
                                    >
                                        <Globe className="w-4 h-4" aria-hidden="true" />{'\u00A0'}
                                        <span className="text-sm leading-normal">Site du projet</span>
                                    </a>
                                    <a
                                        href="https://docs.kutsum.org"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label="Documentation externe"
                                        className="inline-flex items-center gap-1 text-primary hover:underline text-sm leading-normal"
                                    >
                                        <BookOpen className="w-4 h-4" aria-hidden="true" />{'\u00A0'}
                                        <span className="text-sm leading-normal">Documentation</span>
                                    </a>
                                    <a
                                        href="https://github.com/alexisflesch/mathquest"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label="Contribuer sur GitHub"
                                        className="inline-flex items-center gap-1 text-primary hover:underline text-sm leading-normal"
                                    >
                                        <Github className="w-4 h-4" aria-hidden="true" />{'\u00A0'}
                                        <span className="text-sm leading-normal">Contribuer</span>
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Dev warning */}
                        <div className="w-full mt-6">
                            <div className="bg-yellow-50 border border-yellow-300 text-yellow-900 rounded-lg p-4 shadow-sm text-base">
                                <strong>⚠️ En développement :</strong> le service peut être interrompu pour mise à jour.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Fallback (shouldn’t happen, but keeps TS happy and UX safe)
    return (
        <div className="main-content">
            <div className="card w-full max-w-4xl bg-base-100 rounded-lg shadow-xl my-6">
                <div className="card-body items-center">
                    <InfinitySpin size={48} />
                </div>
            </div>
        </div>
    );
}
