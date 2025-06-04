'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User as UserIcon, Settings, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../../components/AuthProvider';
import ProfileForm from '../../components/profile/ProfileForm';
import AccountUpgradeForm from '../../components/profile/AccountUpgradeForm';
import TeacherUpgradeForm from '../../components/profile/TeacherUpgradeForm';

function ProfilePageInner() {
    const router = useRouter();
    const {
        userState,
        userProfile,
        setGuestProfile,
        upgradeGuestToAccount,
        updateProfile
    } = useAuth();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState<'profile' | 'upgrade' | 'teacher'>('profile');

    // Redirect if not authenticated
    useEffect(() => {
        if (userState === 'anonymous') {
            router.push('/login');
        }
    }, [userState, router]);

    // Don't render anything if not authenticated
    if (userState === 'anonymous') {
        return null;
    }

    const handleProfileUpdate = async (data: { username: string; avatar: string }) => {
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            if (userState === 'guest') {
                // Update guest profile in localStorage
                await setGuestProfile(data.username, data.avatar);
            } else {
                // Update account profile via API
                await updateProfile(data);
            }
            setSuccess('Profil mis à jour avec succès !');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du profil');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAccountUpgrade = async (data: { email: string; password: string; confirmPassword: string; isTeacher?: boolean; adminPassword?: string }) => {
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            if (data.isTeacher && data.adminPassword) {
                // Create teacher account directly
                console.log('Creating teacher account:', { email: data.email, password: data.password, adminPassword: data.adminPassword });
                // TODO: Implement teacher account creation API call
                // await createTeacherAccount(data.email, data.password, data.adminPassword, userProfile.username, userProfile.avatar);
                setSuccess('Compte enseignant créé avec succès !');
                // Switch to profile tab after successful teacher account creation
                setTimeout(() => setActiveTab('profile'), 1500);
            } else {
                // Create regular student account
                await upgradeGuestToAccount(data.email, data.password);
                setSuccess('Compte créé avec succès !');
                // Switch to profile tab after successful account upgrade
                setTimeout(() => setActiveTab('profile'), 1500);
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Erreur lors de la création du compte');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTeacherUpgrade = async (adminPassword: string, email?: string, password?: string) => {
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            if (userState === 'guest' && email && password) {
                // For guests: create teacher account directly
                // TODO: Implement teacher account creation API call
                console.log('Creating teacher account:', { email, password, adminPassword });
                // await createTeacherAccount(email, password, adminPassword, userProfile.username, userProfile.avatar);
                setSuccess('Compte enseignant créé avec succès !');
                // Switch to profile tab after successful teacher account creation
                setTimeout(() => setActiveTab('profile'), 1500);
            } else {
                // For students: upgrade to teacher
                // TODO: Implement teacher upgrade API call
                console.log('Teacher upgrade with admin password:', adminPassword);
                // await upgradeToTeacher(adminPassword);
                setSuccess('Compte enseignant activé avec succès !');
                // Switch to profile tab after successful teacher upgrade
                setTimeout(() => setActiveTab('profile'), 1500);
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Erreur lors de l\'upgrade enseignant');
        } finally {
            setIsLoading(false);
        }
    };

    const getPageTitle = () => {
        switch (userState) {
            case 'guest': return 'Profil Invité';
            case 'student': return 'Profil Étudiant';
            case 'teacher': return 'Profil Enseignant';
            default: return 'Profil';
        }
    };

    const getAvailableTabs = () => {
        const tabs: Array<{ id: 'profile' | 'upgrade' | 'teacher', label: string, icon: React.ComponentType<any> }> = [
            { id: 'profile', label: 'Profil', icon: UserIcon }
        ];

        if (userState === 'guest') {
            tabs.push({ id: 'upgrade', label: 'S\'enregistrer', icon: Settings });
        }

        if (userState === 'student') {
            tabs.push({ id: 'teacher', label: 'Enseignant', icon: GraduationCap });
        }

        return tabs;
    };

    const availableTabs = getAvailableTabs();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[color:var(--background)]">
            <div className="main-content w-full flex flex-col items-center justify-center">
                <div className="card w-full max-w-2xl bg-base-100 rounded-lg shadow-xl my-8 p-0">
                    <div className="flex flex-col gap-6 p-8">
                        <div className="flex flex-col items-center gap-2 mb-2">
                            <h1 className="card-title text-3xl mb-4 text-base-content">
                                {getPageTitle()}
                            </h1>

                            {userProfile.username && userProfile.avatar && (
                                <div className="flex flex-col items-center gap-2 mb-4">
                                    <div className="text-6xl emoji-avatar">{userProfile.avatar}</div>
                                    <p className="text-xl font-semibold text-base-content">{userProfile.username}</p>
                                    {userProfile.email && (
                                        <p className="text-sm text-[color:var(--muted-foreground)]">{userProfile.email}</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Tabs */}
                        {availableTabs.length > 1 && (
                            <div className="bg-[color:var(--muted)] p-1 rounded-lg flex space-x-1 mb-4">
                                {availableTabs.map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === tab.id
                                                ? 'bg-[color:var(--card)] text-[color:var(--primary)] shadow-sm'
                                                : 'text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] hover:bg-[color:var(--muted)]'
                                                }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Status Messages */}
                        {error && (
                            <div className="mb-4 p-3 bg-[color:var(--destructive-bg)] border border-[color:var(--destructive-border)] rounded-md">
                                <p className="text-[color:var(--destructive)] text-sm">{error}</p>
                            </div>
                        )}

                        {success && (
                            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                                <p className="text-green-700 text-sm">{success}</p>
                            </div>
                        )}

                        {/* Tab Content */}
                        {activeTab === 'profile' && (
                            <ProfileForm
                                initialUsername={userProfile.username || ''}
                                initialAvatar={userProfile.avatar || ''}
                                onSave={handleProfileUpdate}
                                isLoading={isLoading}
                            />
                        )}

                        {activeTab === 'upgrade' && userState === 'guest' && (
                            <AccountUpgradeForm
                                guestUsername={userProfile.username || ''}
                                guestAvatar={userProfile.avatar || ''}
                                onUpgrade={handleAccountUpgrade}
                                isLoading={isLoading}
                            />
                        )}

                        {activeTab === 'teacher' && (userState === 'student' || userState === 'guest') && (
                            <TeacherUpgradeForm
                                onUpgrade={handleTeacherUpgrade}
                                isLoading={isLoading}
                                isGuest={userState === 'guest'}
                            />
                        )}

                        <div className="flex items-center justify-center mt-6">
                            <Link href="/" className="text-sm text-[color:var(--primary)] hover:underline flex items-center gap-1">
                                <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ProfilePage() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <ProfilePageInner />
        </Suspense>
    );
}
