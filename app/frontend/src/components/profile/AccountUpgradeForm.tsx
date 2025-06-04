'use client';

import React, { useState } from 'react';
import { Mail, Lock, User, Camera, Shield } from 'lucide-react';
import AvatarGrid from '../ui/AvatarGrid';

interface AccountUpgradeFormProps {
    guestUsername: string;
    guestAvatar: string;
    onUpgrade: (data: { email: string; password: string; confirmPassword: string; isTeacher?: boolean; adminPassword?: string }) => Promise<void>;
    isLoading?: boolean;
    className?: string;
}

export default function AccountUpgradeForm({
    guestUsername,
    guestAvatar,
    onUpgrade,
    isLoading = false,
    className = ""
}: AccountUpgradeFormProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isTeacher, setIsTeacher] = useState(false);
    const [adminPassword, setAdminPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            throw new Error('Les mots de passe ne correspondent pas');
        }

        await onUpgrade({
            email: email.trim(),
            password,
            confirmPassword,
            isTeacher,
            adminPassword: isTeacher ? adminPassword : undefined
        });
    };

    return (
        <div className={className}>
            <div className="mb-6 p-4 bg-[color:var(--muted)] rounded-lg">
                <h3 className="text-lg font-semibold text-[color:var(--foreground)] mb-2">
                    Profil actuel
                </h3>
                <div className="flex items-center gap-3">
                    <div className="text-2xl">{guestAvatar}</div>
                    <span className="text-[color:var(--foreground)]">{guestUsername}</span>
                </div>
                <p className="text-sm text-[color:var(--muted-foreground)] mt-2">
                    Créez un compte pour sauvegarder votre profil et vos progrès de façon permanente.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-[color:var(--foreground)] mb-1">
                        <Mail className="inline w-4 h-4 mr-2" />
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input input-bordered input-lg w-full"
                        autoComplete="email"
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
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={6}
                        className="input input-bordered input-lg w-full"
                        autoComplete="new-password"
                        required
                    />
                    <p className="text-xs text-[color:var(--muted-foreground)] mt-1">Minimum 6 caractères</p>
                </div>

                <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-[color:var(--foreground)] mb-1">
                        <Lock className="inline w-4 h-4 mr-2" />
                        Confirmer le mot de passe
                    </label>
                    <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        minLength={6}
                        className="input input-bordered input-lg w-full"
                        autoComplete="new-password"
                        required
                    />
                </div>

                <div className="flex items-center mt-2">
                    <input
                        type="checkbox"
                        id="isTeacherUpgrade"
                        checked={isTeacher}
                        onChange={e => setIsTeacher(e.target.checked)}
                        className="mr-2 accent-[color:var(--primary)]"
                    />
                    <label htmlFor="isTeacherUpgrade" className="text-sm text-[color:var(--foreground)] select-none cursor-pointer">
                        Compte enseignant
                    </label>
                </div>

                {isTeacher && (
                    <div>
                        <label htmlFor="adminPasswordUpgrade" className="block text-sm font-medium text-[color:var(--foreground)] mb-1">
                            <Shield className="inline w-4 h-4 mr-2" />
                            Mot de passe administrateur
                        </label>
                        <input
                            type="password"
                            id="adminPasswordUpgrade"
                            value={adminPassword}
                            onChange={e => setAdminPassword(e.target.value)}
                            className="input input-bordered input-lg w-full"
                            required={isTeacher}
                        />
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading || !email || !password || !confirmPassword || (isTeacher && !adminPassword)}
                    className="btn btn-primary btn-lg w-full"
                >
                    {isLoading ? 'Création du compte...' : (isTeacher ? 'Créer mon compte enseignant' : 'Créer mon compte')}
                </button>

                {isTeacher && (
                    <div className="mt-2 text-center">
                        <p className="text-[color:var(--muted-foreground)] text-xs">
                            Cochez la case ci-dessus et renseignez le mot de passe administrateur pour créer un compte enseignant.
                        </p>
                    </div>
                )}
            </form>
        </div>
    );
}
