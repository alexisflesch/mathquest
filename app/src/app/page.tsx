export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full flex flex-col items-center gap-8">
        <h1 className="text-4xl font-extrabold text-indigo-700 mb-6 text-center tracking-wide drop-shadow">Bienvenue sur MathQuest !</h1>
        <div className="flex flex-col md:flex-row gap-6 w-full justify-center">
          <a href="/student" className="flex-1">
            <button className="w-full bg-gradient-to-r from-sky-400 to-indigo-400 text-white font-extrabold py-4 px-8 rounded-full shadow-lg hover:scale-105 hover:shadow-xl focus:ring-4 focus:ring-sky-300 focus:outline-none transition text-xl tracking-wide mb-4 md:mb-0">
              Espace Élève
            </button>
          </a>
          <a href="/teacher" className="flex-1">
            <button className="w-full bg-gradient-to-r from-violet-400 to-sky-400 text-white font-extrabold py-4 px-8 rounded-full shadow-lg hover:scale-105 hover:shadow-xl focus:ring-4 focus:ring-violet-300 focus:outline-none transition text-xl tracking-wide">
              Espace Enseignant
            </button>
          </a>
        </div>
      </div>
    </div>
  );
}
