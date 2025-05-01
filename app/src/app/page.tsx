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
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { isStudent, isTeacher, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (isTeacher) {
      router.replace('/teacher/home');
    } else if (isStudent) {
      router.replace('/student/home');
    }
  }, [isTeacher, isStudent, isLoading, router]);

  if (isLoading || isTeacher || isStudent) {
    // Ne rien afficher pendant le chargement ou la redirection
    return null;
  }

  return (
    <div className="main-content">
      <div className="card w-full max-w-lg bg-base-100 rounded-lg shadow-xl my-6">
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-center gap-4 mb-5">
            <Image src="/favicon.svg" alt="MathQuest logo" width={64} height={64} priority />
            <h1 className="text-2xl text-center font-bold text-base-content">Bienvenue sur MathQuest</h1>
          </div>
          <p className="text-base text-muted mb-2 max-w-md">
            Révisez en solo ou défiez vos amis dans des tournois en direct ou en différé. Choisissez un niveau, une discipline, des thèmes, et c&apos;est parti !
          </p>
          <div className="w-full flex flex-col mb-4 mt-6">
            Choisissez votre rôle puis utilisez le menu pour naviguer.
          </div>
          <div className="flex flex-col md:flex-row gap-4 w-full">
            <a href="/student" className="flex-1">
              <button className="btn btn-primary btn-lg w-full">Élève</button>
            </a>
            <a href="/teacher" className="flex-1">
              <button className="btn btn-primary btn-lg w-full">Enseignant</button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
