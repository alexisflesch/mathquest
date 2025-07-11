'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User as UserIcon, Settings, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../../components/AuthProvider';
import ProfileForm from '../../components/profile/ProfileForm';
import AccountUpgradeForm from '../../components/profile/AccountUpgradeForm';
import TeacherUpgradeForm from '../../components/profile/TeacherUpgradeForm';
import Snackbar from '../../components/Snackbar';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

function ProfilePageInner() {
    const router = useRouter();
    const {
        userState,
        userProfile,
        setGuestProfile,
        upgradeGuestToAccount,
        updateProfile,
        upgradeToTeacher,
        registerTeacher
    } = useAuth();

    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'upgrade' | 'teacher'>('profile');

    // Snackbar state
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarType, setSnackbarType] = useState<'success' | 'error'>('success');

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
        setSnackbarOpen(false); // Close any existing snackbar

        try {
            if (userState === 'guest') {
                // Update guest profile in localStorage
                await setGuestProfile(data.username, data.avatar);
            } else {
                // Update account profile via API
                await updateProfile(data);
            }
            setSnackbarType('success');
            setSnackbarMessage('Profil mis à jour avec succès !');
            setSnackbarOpen(true);
        } catch (err: unknown) {
            setSnackbarType('error');
            setSnackbarMessage(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du profil');
            setSnackbarOpen(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAccountUpgrade = async (data: { email: string; password: string; confirmPassword: string; isTeacher?: boolean; adminPassword?: string }) => {
        setIsLoading(true);
        setSnackbarOpen(false); // Close any existing snackbar

        try {
            if (data.isTeacher && data.adminPassword) {
                // Create teacher account directly
                await registerTeacher(data.email, data.password, userProfile.username || '', data.adminPassword, userProfile.avatar || '');
                setSnackbarType('success');
                setSnackbarMessage('Compte enseignant créé avec succès !');
                setSnackbarOpen(true);
                // Switch to profile tab after successful teacher account creation
                setTimeout(() => setActiveTab('profile'), 1500);
            } else {
                // Create regular student account
                await upgradeGuestToAccount(data.email, data.password);
                setSnackbarType('success');
                setSnackbarMessage('Compte créé avec succès !');
                setSnackbarOpen(true);
                // Switch to profile tab after successful account upgrade
                setTimeout(() => setActiveTab('profile'), 1500);
            }
        } catch (err: unknown) {
            setSnackbarType('error');
            setSnackbarMessage(err instanceof Error ? err.message : 'Erreur lors de la création du compte');
            setSnackbarOpen(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTeacherUpgrade = async (adminPassword: string, email?: string, password?: string) => {
        setIsLoading(true);
        setSnackbarOpen(false); // Close any existing snackbar

        try {
            if (userState === 'guest' && email && password) {
                // For guests: create teacher account directly
                await registerTeacher(email, password, userProfile.username || '', adminPassword, userProfile.avatar || '');
                setSnackbarType('success');
                setSnackbarMessage('Compte enseignant créé avec succès !');
                setSnackbarOpen(true);
                // Switch to profile tab after successful teacher account creation
                setTimeout(() => setActiveTab('profile'), 1500);
            } else {
                // For students: upgrade to teacher
                await upgradeToTeacher(adminPassword);
                setSnackbarType('success');
                setSnackbarMessage('Compte enseignant activé avec succès !');
                setSnackbarOpen(true);
                // Switch to profile tab after successful teacher upgrade
                setTimeout(() => setActiveTab('profile'), 1500);
            }
        } catch (err: unknown) {
            setSnackbarType('error');
            setSnackbarMessage(err instanceof Error ? err.message : 'Erreur lors de l\'upgrade enseignant');
            setSnackbarOpen(true);
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
        <div className="main-content">
            <div className="card w-full max-w-2xl bg-base-100 rounded-lg shadow-xl my-8">
                <div className="card-body items-center gap-6">
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
                </div>
            </div>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbarOpen}
                message={snackbarMessage}
                type={snackbarType}
                onClose={() => setSnackbarOpen(false)}
            />
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
