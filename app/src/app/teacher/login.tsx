import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TeacherLoginPage() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            const response = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'teacher_login',
                    email: formData.email,
                    password: formData.password,
                }),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Erreur lors de la connexion.');
            }
            // TODO: Set session/cookie here
            router.push('/teacher');
        } catch (err: unknown) {
            setError((err as Error).message || 'Une erreur est survenue.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full flex flex-col items-center gap-8">
                <h1 className="text-3xl font-extrabold text-indigo-700 mb-4 text-center tracking-wide drop-shadow">Connexion Enseignant</h1>
                <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
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
                            placeholder="Votre mot de passe"
                            autoComplete="current-password"
                        />
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-gradient-to-r from-indigo-400 via-sky-400 to-violet-400 text-white font-extrabold py-3 px-8 rounded-full shadow-lg hover:scale-105 hover:shadow-xl focus:ring-4 focus:ring-indigo-200 focus:outline-none transition text-2xl tracking-wide mt-2"
                    >
                        {isLoading ? 'Connexion...' : 'Se connecter'}
                    </button>
                </form>
            </div>
        </div>
    );
}
