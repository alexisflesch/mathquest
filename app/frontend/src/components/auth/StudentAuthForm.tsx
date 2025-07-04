'use client';

import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

interface StudentAuthFormProps {
    mode: 'login' | 'signup';
    onSubmit: (data: { email: string; password: string; username?: string }) => void;
    onModeToggle: () => void;
    isLoading?: boolean;
    error?: string;
    className?: string;
}

export default function StudentAuthForm({
    mode,
    onSubmit,
    onModeToggle,
    isLoading = false,
    error,
    className = ""
}: StudentAuthFormProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const data = { email: email.trim(), password };
        if (mode === 'signup') {
            (data as any).username = username.trim();
        }
        onSubmit(data);
    };

    return (
        <div className={className}>
            <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-[color:var(--foreground)]">
                    {mode === 'login' ? 'Connexion étudiant' : 'Créer un compte étudiant'}
                </h3>
                <p className="text-[color:var(--muted-foreground)] mt-2">
                    {mode === 'login'
                        ? 'Connectez-vous à votre compte pour accéder à toutes les fonctionnalités'
                        : 'Créez votre compte pour sauvegarder vos progrès et créer des tournois'
                    }
                </p>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-[color:var(--alert)]/10 border border-[color:var(--alert)] rounded-md">
                    <p className="text-[color:var(--alert)] text-sm">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email field */}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-[color:var(--foreground)] mb-1">
                        <Mail className="inline w-4 h-4 mr-1" />
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="votre@email.com"
                        className="w-full px-3 py-2 border border-[color:var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:border-[color:var(--primary)] bg-[color:var(--input)] text-[color:var(--foreground)]"
                        required
                    />
                </div>

                {/* Password field */}
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-[color:var(--foreground)] mb-1">
                        <Lock className="inline w-4 h-4 mr-1" />
                        Mot de passe
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Votre mot de passe"
                            minLength={6}
                            className="w-full px-3 py-2 pr-10 border border-[color:var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:border-[color:var(--primary)] bg-[color:var(--input)] text-[color:var(--foreground)]"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    {mode === 'signup' && (
                        <p className="text-xs text-[color:var(--muted-foreground)] mt-1">Minimum 6 caractères</p>
                    )}
                </div>

                {/* Username field (signup only, after email/password) */}
                {mode === 'signup' && (
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-[color:var(--foreground)] mb-1">
                            <User className="inline w-4 h-4 mr-1" />
                            Pseudo
                        </label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Votre nom d'utilisateur"
                            maxLength={20}
                            autoComplete="username"
                            className="w-full px-3 py-2 border border-[color:var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:border-[color:var(--primary)] bg-[color:var(--input)] text-[color:var(--foreground)]"
                            required
                        />
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-primary btn-lg w-full"
                >
                    {isLoading
                        ? (mode === 'login' ? 'Connexion...' : 'Création...')
                        : (mode === 'login' ? 'Se connecter' : 'Créer le compte')
                    }
                </button>
            </form>

            <div className="mt-6 text-center">
                <button
                    type="button"
                    onClick={onModeToggle}
                    className="text-[color:var(--primary)] hover:text-[color:var(--primary-hover)] text-sm font-medium"
                >
                    {mode === 'login'
                        ? "Pas encore de compte ? Créer un compte"
                        : "Déjà un compte ? Se connecter"
                    }
                </button>
            </div>
        </div>
    );
}
