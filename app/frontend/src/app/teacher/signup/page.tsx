'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation'; // Use navigation for redirect after signup
import Link from 'next/link';
import AvatarSelector from '@/components/AvatarSelector';
import { makeApiRequest } from '@/config/api';

export default function TeacherSignupPage() {
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '', // Optional based on PRD, but good for login/recovery
        adminPassword: '', // The fixed admin password
        password: '',
        confirmPassword: '',
        username: '',
        avatar: '',
    });
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (formData.password !== formData.confirmPassword) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }
        if (!formData.adminPassword) {
            setError('Le mot de passe administrateur est requis.');
            return;
        }
        if (!formData.username) {
            setError('Le username est obligatoire.');
            return;
        }
        if (!formData.avatar) {
            setError('Veuillez choisir un avatar.');
            return;
        }
        setIsLoading(true);
        try {
            const result = await makeApiRequest<{
                message?: string;
                enseignantId?: string;
            }>('auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'teacher_signup',
                    nom: formData.nom,
                    prenom: formData.prenom,
                    email: formData.email,
                    adminPassword: formData.adminPassword,
                    password: formData.password,
                    username: formData.username,
                    avatar: formData.avatar,
                }),
            });
            // Store teacher id in localStorage for frontend profile fetch
            if (result.enseignantId) {
                localStorage.setItem('mathquest_teacher_id', result.enseignantId);
            }
            setSuccess('Compte enseignant créé avec succès ! Vous allez être redirigé.');
            setTimeout(() => router.push('/teacher/login'), 2000);
        } catch (err: unknown) {
            setError((err as Error).message || 'Une erreur est survenue.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="main-content">
            <div className="card w-full max-w-4xl shadow-xl bg-base-100 m-4 my-6">
                <div className="flex flex-col gap-8">
                    <p className="text-center text-sm mb-2 text-muted w-full">
                        Déjà un compte ?{' '}
                        <Link href="/teacher/login" className="link link-primary">
                            Se connecter
                        </Link>
                    </p>
                    <div className="card-body flex-1 flex flex-col items-center gap-8 min-h-0 overflow-y-auto w-full p-0">
                        <h1 className="card-title text-3xl mb-4">Créer un compte enseignant</h1>
                        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6 flex-1 min-h-0">
                            <div>
                                <label className="block text-lg font-bold mb-2" htmlFor="nom">
                                    Nom
                                </label>
                                <input
                                    className="input input-bordered input-lg w-full"
                                    id="nom"
                                    type="text"
                                    name="nom"
                                    value={formData.nom}
                                    onChange={handleChange}
                                    required
                                    placeholder="Votre nom"
                                    autoComplete="family-name"
                                />
                            </div>
                            <div>
                                <label className="block text-lg font-bold mb-2" htmlFor="prenom">
                                    Prénom
                                </label>
                                <input
                                    className="input input-bordered input-lg w-full"
                                    id="prenom"
                                    type="text"
                                    name="prenom"
                                    value={formData.prenom}
                                    onChange={handleChange}
                                    required
                                    placeholder="Votre prénom"
                                    autoComplete="given-name"
                                />
                            </div>
                            <div>
                                <label className="block text-lg font-bold mb-2" htmlFor="email">
                                    Email
                                </label>
                                <input
                                    className="input input-bordered input-lg w-full"
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    placeholder="Votre email"
                                    autoComplete="email"
                                />
                            </div>
                            <div>
                                <label className="block text-lg font-bold mb-2" htmlFor="adminPassword">
                                    Mot de passe administrateur
                                </label>
                                <input
                                    className="input input-bordered input-lg w-full"
                                    id="adminPassword"
                                    type="password"
                                    name="adminPassword"
                                    value={formData.adminPassword}
                                    onChange={handleChange}
                                    required
                                    placeholder="Mot de passe admin"
                                    autoComplete="off"
                                />
                            </div>
                            <div>
                                <label className="block text-lg font-bold mb-2" htmlFor="password">
                                    Mot de passe
                                </label>
                                <input
                                    className="input input-bordered input-lg w-full"
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    minLength={8}
                                    placeholder="Votre mot de passe"
                                    autoComplete="new-password"
                                />
                            </div>
                            <div>
                                <label className="block text-lg font-bold mb-2" htmlFor="confirmPassword">
                                    Confirmer le mot de passe
                                </label>
                                <input
                                    className="input input-bordered input-lg w-full"
                                    id="confirmPassword"
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    placeholder="Confirmez le mot de passe"
                                    autoComplete="new-password"
                                />
                            </div>
                            <div>
                                <label className="block text-lg font-bold mb-2" htmlFor="username">
                                    username
                                </label>
                                <input
                                    className="input input-bordered input-lg w-full"
                                    id="username"
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                    placeholder="Votre username"
                                    autoComplete="off"
                                />
                            </div>
                            <div>
                                <label className="block text-lg font-bold mb-2">
                                    Choisissez votre avatar !
                                </label>
                                <div className="flex justify-center w-full">
                                    <AvatarSelector onSelect={avatar => setFormData(f => ({ ...f, avatar }))} selected={formData.avatar} />
                                </div>
                            </div>
                            {error && <div className="alert alert-error justify-center">{error}</div>}
                            {success && <div className="alert alert-success justify-center">{success}</div>}
                            <div className="flex justify-center w-full">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="btn btn-primary btn-lg w-full"
                                >
                                    {isLoading ? 'Création en cours...' : 'Créer le compte'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
