/**
 * MathQuest Landing Page
 * 
 * This comp  //  // No automatic redirects - let users navigate from the main landing page
  useEffect(() => {
    if (isLoading) return;
    // All user types stay on landing page - no redirects to separate home pages
    console.log('[LandingPage] User state loaded, showing landing page for all users');
  }, [isLoading]);tomatic redirections - show landing page content for all users
  if (isLoading) {
    // Only show loading state during auth check
    return null;
  } the main entry point for the application, providing:
 * - A welcome introduction to the MathQuest platform
 * - Role selection between Student and Teacher modes
 * - Smart navigation that remembers previous user roles
 * - Visual branding with the MathQuest logo
 * 
 * The page intelligently directs returning users to the appropriate dashboard
 * based on their authentication status, while new users are guided through
 * the initial onboarding flow for their selected role.
 */

"use client";
import Image from 'next/image';
import { useAuth } from '@/components/AuthProvider';
import { useEffect } from 'react';

export default function Home() {
  const { isStudent, isTeacher, isLoading, refreshAuth, canJoinGame } = useAuth();

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
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="card w-full max-w-4xl bg-base-100 rounded-lg shadow-xl my-6">
        <div className="card-body items-center gap-8">
          {/* Header with logo */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <Image src="/favicon.svg" alt="MathQuest logo" width={64} height={64} priority />
            <h1 className="text-3xl text-center font-bold text-base-content">Zornigma</h1>
          </div>

          {/* Subtitle */}
          <div className="text-left mt-12 mb-6">
            <p className="text-lg text-muted-foreground">
              🧠 Une alternative libre à Kahoot, pour tous les niveaux, toutes les disciplines.
            </p>
          </div>

          {/* Features Grid */}
          <div className="flex flex-col md:flex-row md:flex-wrap gap-6 my-6 w-full">
            {/* For Students */}
            <div className="bg-primary/10 p-6 rounded-lg md:flex-1 md:basis-[calc(50%-0.75rem)]">
              <h3 className="font-semibold text-xl mb-4">👋 Pour les étudiants</h3>
              <ul className="space-y-3 text-sm">
                <li>• Révisez à votre rythme avec des quiz issus d'une grande base de données mutualisée</li>
                <li>• Affrontez vos amis en duel ou en mode compétition multi-joueurs</li>
                <li>• Jouez sans compte : entrez juste un pseudo et c'est parti !</li>
                <li>• Envie de suivre vos progrès ? Créez un compte (optionnel) pour garder un historique</li>
              </ul>
            </div>

            {/* For Teachers */}
            <div className="bg-secondary/10 p-6 rounded-lg md:flex-1 md:basis-[calc(50%-0.75rem)]">
              <h3 className="font-semibold text-xl mb-4">🧑‍🏫 Pour les enseignants</h3>
              <ul className="space-y-3 text-sm">
                <li>• Créez vos quiz personnalisés à partir de la base commune (ou ajoutez vos propres questions)</li>
                <li>• Animez vos cours en projetant les quiz en temps réel avec scores, podiums, statistiques</li>
                <li>• Contrôlez tout : timer, ordre des questions, affichage des réponses, visibilité des résultats…</li>
                <li>• Partagez vos questions avec la communauté</li>
              </ul>
            </div>

            {/* Question Database */}
            <div className="bg-accent/10 p-6 rounded-lg md:flex-1 md:basis-[calc(50%-0.75rem)]">
              <h3 className="font-semibold text-xl mb-4">📚 Une base de questions ouverte</h3>
              <ul className="space-y-2 text-sm">
                <li>• Des milliers de questions du CP à Bac+2, dans toutes les disciplines</li>
                <li>• Rédigées, vérifiées et filtrées par un enseignant</li>
                <li>• Utilisables en classe, en autonomie, en ligne, sur tablette ou smartphone</li>
              </ul>
            </div>

            {/* Open Source */}
            <div className="bg-success/10 p-6 rounded-lg md:flex-1 md:basis-[calc(50%-0.75rem)]">
              <h3 className="font-semibold text-xl mb-4">🔓 Libre. Gratuit. Sans pub.</h3>
              <ul className="space-y-2 text-sm">
                <li>• Projet personnel libre et gratuit, sans publicité</li>
                <li>• Hébergé sur notre propre serveur</li>
                <li>• Utilisation illimitée, sans restriction de temps ni de fonctionnalités</li>
              </ul>
            </div>
          </div>

          {/* Help section for everyone */}
          <div className="border-t pt-6 w-full">
            <div className="bg-base-200 p-6 rounded-lg">
              <h3 className="font-semibold mb-2">💡 Besoin d'aide ?</h3>
              <p>
                Commencez par vous connecter en choisissant un pseudo et un avatar (pas besoind de créer un compte) puis utilisez le menu pour naviguer dans les différentes sections.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
