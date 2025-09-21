'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, User, Mail, Lock, Shield, Gamepad } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../../components/AuthProvider';
import AuthModeToggle, { AuthMode } from '../../components/auth/AuthModeToggle';
import GuestForm from '../../components/auth/GuestForm';
import StudentAuthForm from '../../components/auth/StudentAuthForm';
import AvatarGrid from '../../components/ui/AvatarGrid';
import UsernameSelector from '../../components/ui/UsernameSelector';
import Image from 'next/image';
import InfinitySpin from '@/components/InfinitySpin';
import EmailVerificationModal from '../../components/auth/EmailVerificationModal';
import { SOCKET_EVENTS } from '@shared/types/socket/events';
import { default as dynamicImport } from 'next/dynamic';

// Dynamically import the inner component to force client-side rendering
const LoginPageInner = dynamicImport(() => Promise.resolve(LoginPageInnerComponent), {
    ssr: false,
    loading: () => <div>Chargement...</div>
});

function LoginPageInnerComponent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { userState, userProfile, setGuestProfile, universalLogin, loginStudent, registerStudent, loginTeacher, registerTeacher, logout } = useAuth();

    const [authMode, setAuthMode] = useState<AuthMode>('guest');
    const [studentAuthMode, setStudentAuthMode] = useState<'login' | 'signup'>('login');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    // Only two modes for AuthModeToggle
    const [simpleMode, setSimpleMode] = useState<'guest' | 'account'>('guest');
    const [isTeacherSignup, setIsTeacherSignup] = useState(false);
    const [adminPassword, setAdminPassword] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState('');
    const [accountUsername, setAccountUsername] = useState('');

    // Email verification modal state
    const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false);
    const [registeredUserEmail, setRegisteredUserEmail] = useState('');

    // URL params for redirect after login  
    const returnTo = searchParams?.get('returnTo') || '/';
    const gameCode = searchParams?.get('game');

    // If there's a game code, redirect to the live game after login
    const finalRedirectUrl = gameCode ? `/live/${gameCode}` : returnTo;

    useEffect(() => {
        // Debug: log the current userState
        console.log('Login page - Current userState:', userState);

        // Redirect authenticated users away from login page
        // If a returnTo param is present, use it; otherwise, go to home
        if (userState === 'guest' || userState === 'student' || userState === 'teacher') {
            router.push(finalRedirectUrl);
        }
    }, [userState, router, finalRedirectUrl]);

    // Set initial auth mode based on URL params
    useEffect(() => {
        const mode = searchParams?.get('mode') as AuthMode;
        if (mode && ['guest', 'student', 'teacher'].includes(mode)) {
            setAuthMode(mode);
        }
    }, [searchParams]);

    // Map simpleMode to authMode
    useEffect(() => {
        if (simpleMode === 'guest') setAuthMode('guest');
        else setAuthMode('student'); // 'Compte' tab always shows account form
    }, [simpleMode]);

    const handleGuestSubmit = async (guestData: { username: string; avatar: string }) => {
        setIsLoading(true);
        setError('');

        try {
            await setGuestProfile(guestData.username, guestData.avatar);
            router.push(finalRedirectUrl);
        } catch (err) {
            setError('Erreur lors de la connexion. Veuillez réessayer.');
        } finally {
            setIsLoading(false);
        }
    };

    // Unified account form submit handler
    const handleAccountAuth = async (data: { email: string; password: string; confirmPassword?: string; username?: string; avatar?: string }) => {
        setIsLoading(true);
        setError('');
        try {
            if (studentAuthMode === 'login') {
                // For login, use universal login that automatically detects user role
                if (isTeacherSignup) {
                    // If user explicitly selected teacher mode, use teacher login
                    await loginTeacher(data.email, data.password);
                } else {
                    // Use universal login - automatically detects if user is student or teacher
                    await universalLogin(data.email, data.password);
                }
                // Login successful, redirect to target page
                router.push(finalRedirectUrl);
            } else {
                if (!data.username) throw new Error('Nom d\'utilisateur requis pour l\'inscription');
                if (!data.avatar) throw new Error('Avatar requis pour l\'inscription');
                if (!data.confirmPassword) throw new Error('Confirmation du mot de passe requise');
                if (data.password !== data.confirmPassword) throw new Error('Les mots de passe ne correspondent pas');

                // Registration - use appropriate endpoint based on teacher checkbox
                if (isTeacherSignup) {
                    await registerTeacher(data.email, data.password, data.username, adminPassword, data.avatar);
                } else {
                    await registerStudent(data.email, data.password, data.username, data.avatar);
                }

                // Both student and teacher registrations require email verification
                setRegisteredUserEmail(data.email);
                setShowEmailVerificationModal(true);
                // Don't redirect immediately - let the modal handle the flow
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Erreur lors de l\'authentification');
        } finally {
            setIsLoading(false);
        }
    };

    // Handler for guest upgrade form - removed as upgrade is now in profile page

    // Handle resending email verification
    const handleResendEmailVerification = async () => {
        try {
            const response = await fetch('/api/auth/resend-email-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: registeredUserEmail }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de l\'envoi de l\'email');
            }
        } catch (error) {
            throw error; // Re-throw to let the modal handle the error display
        }
    };

    // Handle email verification modal close
    const handleEmailVerificationModalClose = () => {
        setShowEmailVerificationModal(false);
        setRegisteredUserEmail('');
        // Redirect to final destination after modal is closed
        router.push(finalRedirectUrl);
    };

    // Only anonymous users should reach this point (all authenticated users are redirected)
    // Show loading state while authentication is being determined
    if (userState === 'guest' || userState === 'student' || userState === 'teacher') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[color:var(--background)]">
                <InfinitySpin size={48} />
                <p className="mt-4 text-base-content">Redirection en cours...</p>
            </div>
        );
    }

    return (
        <div className="main-content">
            <div className="card w-full max-w-4xl bg-base-100 rounded-lg shadow-xl my-6">
                <div className="card-body items-center gap-6">
                    <div className="flex flex-col items-center gap-2 mb-2">
                        {/* Title removed as upgrade functionality moved to profile page */}
                    </div>
                    {/* AuthModeToggle for guest/account selection */}
                    <div className="bg-[color:var(--muted)] p-1 rounded-lg flex space-x-1 mb-2">
                        <button
                            onClick={() => setSimpleMode('guest')}
                            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${simpleMode === 'guest' ? 'bg-[color:var(--card)] text-[color:var(--primary)] shadow-sm' : 'text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] hover:bg-[color:var(--muted)]'}`}
                        >
                            <Gamepad className="w-4 h-4" /> Invité
                        </button>
                        <button
                            onClick={() => setSimpleMode('account')}
                            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${simpleMode === 'account' ? 'bg-[color:var(--card)] text-[color:var(--primary)] shadow-sm' : 'text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] hover:bg-[color:var(--muted)]'}`}
                        >
                            <Lock className="w-4 h-4" /> Compte
                        </button>
                    </div>
                    {error && (
                        <div className="mb-4 p-3 bg-[color:var(--destructive-bg)] border border-[color:var(--destructive-border)] rounded-md">
                            <p className="text-[color:var(--destructive)] text-sm">{error}</p>
                        </div>
                    )}
                    {/* Render content based on simpleMode */}
                    {simpleMode === 'guest' ? (
                        <div>
                            <div className="mt-4 mb-6">
                                <p className="text-base text-muted mb-2 w-full">
                                    {gameCode
                                        ? `Choisissez un pseudo et un avatar pour rejoindre la partie ${gameCode}`
                                        : 'Commencez rapidement avec un pseudo et un avatar. Vous pourrez créer un compte plus tard pour sauvegarder vos progrès.'
                                    }
                                </p>
                            </div>
                            <GuestForm
                                onSubmit={handleGuestSubmit}
                                isLoading={isLoading}
                            />
                        </div>
                    ) : (
                        <div>
                            <div className="text-center mb-6 mt-4">
                                <h2 className="text-2xl font-semibold text-base-content mb-2">
                                    {studentAuthMode === 'login' ? 'Connexion' : 'Créer un compte'}
                                </h2>
                                {/* <p className="text-base text-muted mt-2 max-w-md mx-auto">
                                        {studentAuthMode === 'login'
                                            ? 'Connectez-vous à votre compte pour accéder à toutes les fonctionnalités'
                                            : 'Créez votre compte pour sauvegarder vos progrès et créer des tournois'}
                                    </p> */}
                            </div>
                            <form onSubmit={e => {
                                e.preventDefault();
                                const form = e.currentTarget;
                                const formData = {
                                    email: form.email.value,
                                    password: form.password.value,
                                    confirmPassword: form.confirmPassword?.value,
                                    username: accountUsername, // Use state directly
                                    avatar: selectedAvatar
                                };
                                console.log('Form submission data:', formData);
                                console.log('accountUsername state:', accountUsername);
                                handleAccountAuth(formData);
                            }} className="space-y-4">
                                {/* Only one set of fields, in correct order */}
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-[color:var(--foreground)] mb-1">
                                        <Mail className="inline w-4 h-4 mr-2" />
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        className="input input-bordered input-lg w-full"
                                        autoComplete="username"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-[color:var(--foreground)] mb-1">
                                        <Lock className="inline w-4 h-4 mr-2" />
                                        Mot de passe
                                    </label>
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        minLength={6}
                                        className="input input-bordered input-lg w-full"
                                        autoComplete={studentAuthMode === 'login' ? 'current-password' : 'new-password'}
                                        required
                                    />
                                    {studentAuthMode === 'login' && (
                                        <div className="mt-1 text-right">
                                            <Link
                                                href="/reset-password"
                                                className="text-sm text-[color:var(--primary)] hover:text-[color:var(--primary-hover)]"
                                            >
                                                Mot de passe oublié ?
                                            </Link>
                                        </div>
                                    )}
                                    {studentAuthMode === 'signup' && (
                                        <p className="text-xs text-[color:var(--muted-foreground)] mt-1">Minimum 6 caractères</p>
                                    )}
                                </div>
                                {studentAuthMode === 'signup' && (
                                    <div>
                                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-[color:var(--foreground)] mb-1">
                                            <Lock className="inline w-4 h-4 mr-2" />
                                            Confirmer le mot de passe
                                        </label>
                                        <input
                                            type="password"
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            minLength={6}
                                            className="input input-bordered input-lg w-full"
                                            autoComplete="new-password"
                                            required
                                        />
                                    </div>
                                )}
                                {studentAuthMode === 'signup' && (
                                    <div>
                                        <UsernameSelector
                                            id="username"
                                            value={accountUsername}
                                            onChange={setAccountUsername}
                                            required
                                        />
                                    </div>
                                )}
                                {studentAuthMode === 'signup' && (
                                    <div>
                                        <label className="block text-sm font-medium text-[color:var(--foreground)] mb-2">
                                            Avatar
                                        </label>
                                        <AvatarGrid
                                            selectedAvatar={selectedAvatar}
                                            onAvatarSelect={setSelectedAvatar}
                                        />
                                    </div>
                                )}
                                {studentAuthMode === 'signup' && (
                                    <div className="flex items-center mt-2">
                                        <input
                                            type="checkbox"
                                            id="isTeacherSignup"
                                            checked={isTeacherSignup}
                                            onChange={e => setIsTeacherSignup(e.target.checked)}
                                            className="mr-2 accent-[color:var(--primary)]"
                                        />
                                        <label htmlFor="isTeacherSignup" className="text-sm text-[color:var(--foreground)] select-none cursor-pointer">
                                            Compte enseignant
                                        </label>
                                    </div>
                                )}
                                {studentAuthMode === 'signup' && isTeacherSignup && (
                                    <div>
                                        <label htmlFor="adminPassword" className="block text-sm font-medium text-[color:var(--foreground)] mb-1">
                                            <Shield className="inline w-4 h-4 mr-2" />
                                            Mot de passe administrateur
                                        </label>
                                        <input
                                            type="password"
                                            id="adminPassword"
                                            name="adminPassword"
                                            value={adminPassword}
                                            onChange={e => setAdminPassword(e.target.value)}
                                            className="input input-bordered input-lg w-full"
                                            required={isTeacherSignup}
                                        />
                                    </div>
                                )}
                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isLoading || (studentAuthMode === 'signup' && !selectedAvatar)}
                                        className="btn btn-primary btn-lg"
                                    >
                                        {isLoading
                                            ? (studentAuthMode === 'login' ? 'Connexion...' : 'Création...')
                                            : (studentAuthMode === 'login' ? 'Se connecter' : 'Créer le compte')
                                        }
                                    </button>
                                </div>
                            </form>
                            <div className="mt-6 text-center">
                                <button
                                    type="button"
                                    onClick={() => setStudentAuthMode(studentAuthMode === 'login' ? 'signup' : 'login')}
                                    className="text-[color:var(--primary)] hover:text-[color:var(--primary-hover)] text-sm font-medium"
                                >
                                    {studentAuthMode === 'login'
                                        ? "Pas encore de compte ? Créer un compte"
                                        : "Déjà un compte ? Se connecter"
                                    }
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Email Verification Modal */}
            <EmailVerificationModal
                isOpen={showEmailVerificationModal}
                onClose={handleEmailVerificationModalClose}
                userEmail={registeredUserEmail}
                onResendEmail={handleResendEmailVerification}
            />
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <LoginPageInner />
        </Suspense>
    );
}

// Disable static generation for this page
export const dynamic = 'force-dynamic';
