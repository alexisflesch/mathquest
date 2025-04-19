import Link from 'next/link';

export default function TeacherDashboard() {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
            <h1 className="text-3xl font-bold mb-8">Tableau de bord Enseignant</h1>
            <div className="space-y-4">
                <Link href="/teacher/reuse-quiz">
                    <button className="px-6 py-3 bg-blue-500 text-white rounded shadow hover:bg-blue-600">
                        Réutiliser un quiz existant
                    </button>
                </Link>
                <Link href="/teacher/create-quiz">
                    <button className="px-6 py-3 bg-green-500 text-white rounded shadow hover:bg-green-600">
                        Créer un nouveau quiz
                    </button>
                </Link>
                <Link href="/teacher/view-results">
                    <button className="px-6 py-3 bg-purple-500 text-white rounded shadow hover:bg-purple-600">
                        Consulter les résultats
                    </button>
                </Link>
            </div>
        </div>
    );
}