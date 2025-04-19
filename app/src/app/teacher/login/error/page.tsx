import Link from 'next/link';

export default function TeacherLoginErrorPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full flex flex-col items-center gap-8">
                <h1 className="text-3xl font-extrabold text-red-700 mb-4 text-center tracking-wide drop-shadow">Erreur de connexion</h1>
                <p className="text-lg text-gray-700 text-center mb-4">Email ou mot de passe incorrect.<br />Voulez-vous <Link href="/teacher/reset-password" className="text-blue-600 underline">réinitialiser votre mot de passe</Link> ?</p>
                <Link href="/teacher/login">
                    <button className="bg-gradient-to-r from-indigo-400 via-sky-400 to-violet-400 text-white font-extrabold py-3 px-8 rounded-full shadow-lg hover:scale-105 hover:shadow-xl focus:ring-4 focus:ring-indigo-200 focus:outline-none transition text-xl tracking-wide mt-2">
                        Réessayer
                    </button>
                </Link>
            </div>
        </div>
    );
}