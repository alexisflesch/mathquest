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

export default function Home() {
  const { isStudent, isTeacher } = useAuth();
  const studentHref = isStudent || isTeacher ? '/student/menu' : '/student';

  return (
    <div className="h-[calc(100vh-56px)] flex items-center justify-center  p-4 pt-14 md:h-screen md:pt-0">
      <div className="w-full max-w-lg shadow-xl bg-base-100 p-6 rounded-lg">
        <div className="flex flex-col gap-8">
          {/* Move icon and title into a flex row */}
          <div className="flex items-center justify-center gap-4 mb-5">
            <Image src="/favicon.svg" alt="MathQuest logo" width={64} height={64} priority />
            <h1 className="text-2xl text-center font-bold text-base-content">Bienvenue sur MathQuest</h1>
          </div>
          {/* <ThemeSelector /> */}
          <p className="text-base text-muted mb-2 max-w-md">
            Révisez en solo ou défiez vos amis dans des tournois en direct ou en différé. Choisissez un niveau, une discipline, des thèmes, et c&apos;est parti !
          </p>
          <div className="w-full flex flex-col mb-4 mt-6">
            Choisissez votre rôle puis utilisez le menu pour naviguer.
          </div>
          <div className="flex flex-col md:flex-row gap-4 w-full">
            <a href={studentHref} className="flex-1">
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
