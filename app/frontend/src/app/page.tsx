/**
 * MathQuest Landing Page
 * 
 * This component serves as the main entry point for the application, providing:
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
import InfinitySpin from '@/components/InfinitySpin';
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

  return (
    <div className="main-content">
      <div className="card w-full max-w-4xl bg-base-100 rounded-lg shadow-xl my-6">
        <div className="card-body items-center gap-8">
          {/* Header with logo */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <Image src="/favicon.svg" alt="MathQuest logo" width={64} height={64} priority />
            <h1 className="text-3xl text-center font-bold text-base-content">Mathquest</h1>
          </div>

          {/* Description */}
          <div className="text-center mb-8">
            <p className="text-lg text-muted-foreground mb-4">
              🧠 Une alternative libre à Kahoot avec une base de questions partagée.
            </p>
            {/* <p className="text-success font-medium mb-6">
              🔓 Pas besoin de compte pour jouer !
            </p> */}

            <div className="text-left text-muted-foreground space-y-2 max-w-2xl mt-6">
              <p>• Créez vos quiz personnalisés en utilisant la base de questions partagée</p>
              <p>• Animez vos cours en temps réel avec scores et classements</p>
              <p>• Jouez en solo ou en mode multi-joueurs</p>
              <p>• Support natif de LaTeX pour les formules mathématiques</p>
              {/* <p>• Interface adaptée mobile, tablette et ordinateur</p> */}
            </div>
          </div>

          {/* Links */}
          <div className="text-left space-y-2">
            <p className="text-sm text-muted-foreground">Pour en savoir plus :
            </p>
            <div className="space-x-6">
              <a
                href="https://alexisflesch.github.io/mathquest/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                📖 Documentation
              </a>
              <a
                href="https://github.com/alexisflesch/mathquest"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                💻 Code source
              </a>
            </div>
          </div>
          {/* Avertissement développement en bas de page */}
          <div className="w-full mt-10">
            <div className="bg-yellow-50 border border-yellow-300 text-yellow-900 rounded-lg p-4 shadow-sm text-base">
              <strong>⚠️ En développement :</strong> certaines fonctionnalités peuvent manquer et le service être interrompu pour mise à jour.
              Auto-hébergez l&apos;application si possible.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Disable static generation for this page
export const dynamic = 'force-dynamic';
