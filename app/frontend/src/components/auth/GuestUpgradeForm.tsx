/**
 * Guest Account Upgrade Form
 * 
 * Allows guests to upgrade their temporary account to a permanent student account
 * by providing email and password. Preserves their guest profile data.
 */

"use client";
import React, { useState } from 'react';
import { Mail, Lock, User, Crown } from 'lucide-react';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

interface GuestUpgradeFormProps {
    onSubmit: (data: { email: string; password: string }) => void;
    isLoading: boolean;
    error?: string;
    guestUsername?: string;
}

export default function GuestUpgradeForm({
    onSubmit,
    isLoading,
    error,
    guestUsername
}: GuestUpgradeFormProps) {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

    const validateForm = () => {
        const errors: { [key: string]: string } = {};

        // Email validation
        if (!formData.email) {
            errors.email = 'L\'email est requis';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Format d\'email invalide';
        }

        // Password validation
        if (!formData.password) {
            errors.password = 'Le mot de passe est requis';
        } else if (formData.password.length < 6) {
            errors.password = 'Le mot de passe doit contenir au moins 6 caractères';
        }

        // Confirm password validation
        if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Les mots de passe ne correspondent pas';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit({
                email: formData.email,
                password: formData.password
            });
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear validation error when user starts typing
        if (validationErrors[field]) {
            setValidationErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-6">
                <p className="text-base text-muted mb-2 max-w-md mx-auto">
                    Transformez votre profil invité en compte permanent pour sauvegarder vos progrès.
                </p>
                {guestUsername && (
                    <div className="mt-4 p-3 bg-[color:var(--muted)] rounded-lg border border-[color:var(--border)]">
                        <div className="flex items-center justify-center space-x-2 text-[color:var(--primary)]">
                            <User size={16} />
                            <span className="text-sm font-medium">
                                Profil actuel: {guestUsername}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="mb-4 p-3 bg-[color:var(--destructive-bg)] border border-[color:var(--destructive-border)] rounded-md">
                        <p className="text-[color:var(--destructive)] text-sm">{error}</p>
                    </div>
                )}

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-[color:var(--foreground)] mb-1">
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        placeholder="votre@email.com"
                        className="input input-bordered input-lg w-full"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        disabled={isLoading}
                        autoComplete="email"
                        required
                    />
                    {validationErrors.email && (
                        <p className="text-xs text-[color:var(--destructive)] mt-1">{validationErrors.email}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-[color:var(--foreground)] mb-1">
                        Mot de passe
                    </label>
                    <input
                        type="password"
                        id="password"
                        placeholder="Minimum 6 caractères"
                        className="input input-bordered input-lg w-full"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        disabled={isLoading}
                        autoComplete="new-password"
                        minLength={6}
                        required
                    />
                    {validationErrors.password && (
                        <p className="text-xs text-[color:var(--destructive)] mt-1">{validationErrors.password}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-[color:var(--foreground)] mb-1">
                        Confirmer le mot de passe
                    </label>
                    <input
                        type="password"
                        id="confirmPassword"
                        placeholder="Confirmez votre mot de passe"
                        className="input input-bordered input-lg w-full"
                        value={formData.confirmPassword}
                        disabled={isLoading}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        autoComplete="new-password"
                        minLength={6}
                        required
                    />
                    {validationErrors.confirmPassword && (
                        <p className="text-xs text-[color:var(--destructive)] mt-1">{validationErrors.confirmPassword}</p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-primary btn-lg w-full"
                >
                    {isLoading ? 'Création du compte...' : 'Enregistrer mon compte'}
                </button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-xs text-[color:var(--muted-foreground)]">
                    En créant un compte, vos données de profil invité seront conservées
                    et vous pourrez sauvegarder vos futurs scores et progrès.
                </p>
            </div>
        </div>
    );
}
