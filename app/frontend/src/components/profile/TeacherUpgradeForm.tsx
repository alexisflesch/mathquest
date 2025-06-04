'use client';

import React, { useState } from 'react';
import { Shield, Lock, Mail, User } from 'lucide-react';

interface TeacherUpgradeFormProps {
    onUpgrade: (adminPassword: string, email?: string, password?: string) => Promise<void>;
    isLoading?: boolean;
    className?: string;
    isGuest?: boolean;
}

export default function TeacherUpgradeForm({
    onUpgrade,
    isLoading = false,
    className = "",
    isGuest = false
}: TeacherUpgradeFormProps) {
    const [adminPassword, setAdminPassword] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isGuest) {
            if (password !== confirmPassword) {
                alert('Les mots de passe ne correspondent pas');
                return;
            }
            await onUpgrade(adminPassword, email, password);
        } else {
            await onUpgrade(adminPassword);
        }
    };

    return (
        <div className={className}>
            <div className="mb-6 p-4 bg-[color:var(--muted)] rounded-lg">
                <h3 className="text-lg font-semibold text-[color:var(--foreground)] mb-2">
                    {isGuest ? 'Créer un compte enseignant' : 'Devenir enseignant'}
                </h3>
                <p className="text-sm text-[color:var(--muted-foreground)]">
                    {isGuest
                        ? 'Créez directement un compte enseignant pour accéder à toutes les fonctionnalités de création et gestion de quiz.'
                        : 'Upgradez votre compte étudiant vers un compte enseignant pour accéder aux fonctionnalités de création et gestion de quiz.'
                    }
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {isGuest && (
                    <>
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
                                required
                                placeholder="votre@email.com"
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
                                className="input input-bordered input-lg w-full"
                                required
                                minLength={6}
                                placeholder="Minimum 6 caractères"
                            />
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
                                className="input input-bordered input-lg w-full"
                                required
                                minLength={6}
                                placeholder="Retapez votre mot de passe"
                            />
                        </div>
                    </>
                )}
                <div>
                    <label htmlFor="adminPassword" className="block text-sm font-medium text-[color:var(--foreground)] mb-1">
                        <Shield className="inline w-4 h-4 mr-2" />
                        Mot de passe administrateur
                    </label>
                    <input
                        type="password"
                        id="adminPassword"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="input input-bordered input-lg w-full"
                        required
                        placeholder="Entrez le mot de passe administrateur"
                    />
                    <p className="text-xs text-[color:var(--muted-foreground)] mt-1">
                        Contactez votre administrateur pour obtenir ce mot de passe.
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={isLoading || !adminPassword.trim() || (isGuest && (!email.trim() || !password.trim() || !confirmPassword.trim()))}
                    className="btn btn-primary btn-lg w-full"
                >
                    {isLoading
                        ? (isGuest ? 'Création en cours...' : 'Upgrade en cours...')
                        : (isGuest ? 'Créer le compte enseignant' : 'Devenir enseignant')
                    }
                </button>
            </form>
        </div>
    );
}
