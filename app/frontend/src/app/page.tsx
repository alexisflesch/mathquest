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
  const { isStudent, isTeacher, isLoading, refreshAuth, canJoinGame, userState } = useAuth();

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
          <div className="flex items-center justify-center p-8">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="card w-full max-w-4xl bg-base-100 rounded-lg shadow-xl my-6">
        <div className="flex flex-col gap-8 p-8">
          {/* Header with logo */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <Image src="/favicon.svg" alt="MathQuest logo" width={64} height={64} priority />
            <h1 className="text-3xl text-center font-bold text-base-content">Bienvenue sur MathQuest</h1>
          </div>

          {/* What is MathQuest */}
          <div className="prose prose-lg max-w-none">
            <h2 className="text-xl font-semibold mb-4">Qu'est-ce que MathQuest ?</h2>
            <p className="text-base mb-4">
              MathQuest est une plateforme éducative interactive qui transforme l'apprentissage des mathématiques en aventure ludique.
              Que vous soyez élève souhaitant réviser ou enseignant cherchant à dynamiser vos cours, MathQuest s'adapte à vos besoins.
            </p>

            <div className="grid md:grid-cols-2 gap-6 my-6">
              <div className="bg-base-200 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">🎯 Pour tous</h3>
                <ul className="text-sm space-y-1">
                  <li>• Exercices adaptés par niveau (CP à Terminale)</li>
                  <li>• Mathématiques, sciences et plus</li>
                  <li>• Entraînement libre à votre rythme</li>
                  <li>• Tournois en temps réel ou en différé</li>
                </ul>
              </div>

              <div className="bg-primary/10 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">👨‍🏫 Spécial Enseignants</h3>
                <ul className="text-sm space-y-1">
                  <li>• Créez vos propres quiz personnalisés</li>
                  <li>• Organisez des tournois pour votre classe</li>
                  <li>• Suivez les résultats en temps réel</li>
                  <li>• Analysez les performances de vos élèves</li>
                  <li>• Gérez le rythme avec des contrôles avancés</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Getting Started - Dynamic content based on user state */}
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">
              {userState === 'anonymous' ? 'Comment commencer ?' :
                userState === 'guest' ? 'Que voulez-vous faire ?' :
                  userState === 'student' ? 'Votre espace étudiant' :
                    userState === 'teacher' ? 'Votre espace enseignant' : 'Actions disponibles'}
            </h2>

            {/* Anonymous users */}
            {userState === 'anonymous' && (
              <div className="bg-accent/10 p-6 rounded-lg mb-4">
                <h3 className="font-semibold mb-2">🚀 Nouvelle visite ?</h3>
                <p className="mb-4">Découvrez MathQuest en quelques clics !</p>
                <a href="/login" className="btn btn-primary btn-lg">
                  Se connecter ou jouer en invité
                </a>
              </div>
            )}

            {/* Guests */}
            {userState === 'guest' && (
              <div className="space-y-4">
                <div className="bg-success/10 p-6 rounded-lg">
                  <h3 className="font-semibold mb-2">🎮 Prêt à jouer !</h3>
                  <p className="mb-4">Vous êtes connecté en tant qu'invité. Explorez toutes les fonctionnalités !</p>
                  <div className="flex flex-wrap gap-3">
                    <a href="/student/create-game" className="btn btn-primary">
                      Créer un tournoi
                    </a>
                    <a href="/student/join" className="btn btn-outline">
                      Rejoindre un tournoi
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Students */}
            {userState === 'student' && (
              <div className="space-y-4">
                <div className="bg-primary/10 p-6 rounded-lg">
                  <h3 className="font-semibold mb-2">🎓 Votre espace personnel</h3>
                  <p className="mb-4">Bienvenue dans votre espace étudiant !</p>
                  <div className="flex flex-wrap gap-3">
                    <a href="/student/create-game" className="btn btn-primary">
                      Créer un tournoi
                    </a>
                    <a href="/student/join" className="btn btn-outline">
                      Rejoindre un tournoi
                    </a>
                    <a href="/student/practice/session" className="btn btn-secondary">
                      Mode entraînement
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Teachers */}
            {userState === 'teacher' && (
              <div className="space-y-4">
                <div className="bg-warning/10 p-6 rounded-lg">
                  <h3 className="font-semibold mb-2">👨‍🏫 Espace enseignant</h3>
                  <p className="mb-4">Gérez vos quiz et tournois, créez du contenu personnalisé.</p>
                  <div className="flex flex-wrap gap-3">
                    <a href="/teacher/quizzes" className="btn btn-primary">
                      Mes quiz
                    </a>
                    <a href="/teacher/create" className="btn btn-outline">
                      Créer un quiz
                    </a>
                    <a href="/student/create-game" className="btn btn-secondary">
                      Créer un tournoi
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Common actions for existing users */}
            {userState !== 'anonymous' && (
              <div className="bg-base-200 p-6 rounded-lg">
                <h3 className="font-semibold mb-2">💡 Besoin d'aide ?</h3>
                <p>
                  Utilisez le menu de navigation en haut de page pour accéder à toutes les fonctionnalités,
                  ou explorez les différentes sections pour découvrir tout ce que MathQuest a à offrir.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
