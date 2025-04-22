import ThemeSelector from '@/components/ThemeSelector';

export default function Home() {
  return (
    <div className="h-[calc(100vh-56px)] flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-4 pt-14 md:h-screen md:pt-0">
      <div className="card w-full max-w-lg shadow-xl bg-base-100">
        <div className="card-body items-center gap-8">
          <ThemeSelector />
          <h1 className="card-title text-4xl mb-4">Bienvenue sur MathQuest !</h1>
          <div className="flex flex-col md:flex-row gap-4 w-full">
            <a href="/student" className="flex-1">
              <button className="btn btn-primary w-full">Espace Élève</button>
            </a>
            <a href="/teacher" className="flex-1">
              <button className="btn btn-secondary w-full">Espace Enseignant</button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
