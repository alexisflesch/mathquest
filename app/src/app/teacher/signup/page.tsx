'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation'; // Use navigation for redirect after signup

export default function TeacherSignupPage() {
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '', // Optional based on PRD, but good for login/recovery
        adminPassword: '', // The fixed admin password
        password: '',
        confirmPassword: '',
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
        setIsLoading(true);
        try {
            const response = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'teacher_signup',
                    nom: formData.nom,
                    prenom: formData.prenom,
                    email: formData.email,
                    adminPassword: formData.adminPassword,
                    password: formData.password,
                }),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Erreur lors de la création du compte.');
            }
            setSuccess('Compte enseignant créé avec succès ! Vous allez être redirigé.');
            setTimeout(() => router.push('/teacher'), 2000);
        } catch (err: unknown) {
            setError((err as Error).message || 'Une erreur est survenue.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full flex flex-col items-center gap-8">
                <h1 className="text-3xl font-extrabold text-indigo-700 mb-4 text-center tracking-wide drop-shadow">Créer un compte enseignant</h1>
                <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
                    <div>
                        <label className="block text-lg font-bold text-sky-700 mb-2" htmlFor="nom">
                            Nom
                        </label>
                        <input
                            className="w-full py-3 px-4 rounded-full border-2 border-sky-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-200 text-lg font-semibold text-gray-700 bg-sky-50 placeholder:text-sky-300 transition"
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
                        <label className="block text-lg font-bold text-sky-700 mb-2" htmlFor="prenom">
                            Prénom
                        </label>
                        <input
                            className="w-full py-3 px-4 rounded-full border-2 border-sky-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-200 text-lg font-semibold text-gray-700 bg-sky-50 placeholder:text-sky-300 transition"
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
                        <label className="block text-lg font-bold text-sky-700 mb-2" htmlFor="email">
                            Email
                        </label>
                        <input
                            className="w-full py-3 px-4 rounded-full border-2 border-sky-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-200 text-lg font-semibold text-gray-700 bg-sky-50 placeholder:text-sky-300 transition"
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
                        <label className="block text-lg font-bold text-indigo-700 mb-2" htmlFor="adminPassword">
                            Mot de passe administrateur
                        </label>
                        <input
                            className="w-full py-3 px-4 rounded-full border-2 border-indigo-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 text-lg font-semibold text-gray-700 bg-indigo-50 placeholder:text-indigo-300 transition"
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
                        <label className="block text-lg font-bold text-violet-700 mb-2" htmlFor="password">
                            Mot de passe
                        </label>
                        <input
                            className="w-full py-3 px-4 rounded-full border-2 border-violet-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-200 text-lg font-semibold text-gray-700 bg-violet-50 placeholder:text-violet-300 transition"
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
                        <label className="block text-lg font-bold text-violet-700 mb-2" htmlFor="confirmPassword">
                            Confirmer le mot de passe
                        </label>
                        <input
                            className="w-full py-3 px-4 rounded-full border-2 border-violet-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-200 text-lg font-semibold text-gray-700 bg-violet-50 placeholder:text-violet-300 transition"
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

                    {error && <p className="text-sm text-red-600">{error}</p>}
                    {success && <p className="text-sm text-green-600">{success}</p>}

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-gradient-to-r from-indigo-400 via-sky-400 to-violet-400 text-white font-extrabold py-3 px-8 rounded-full shadow-lg hover:scale-105 hover:shadow-xl focus:ring-4 focus:ring-indigo-200 focus:outline-none transition text-2xl tracking-wide mt-2"
                        >
                            {isLoading ? 'Création en cours...' : 'Créer le compte'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
