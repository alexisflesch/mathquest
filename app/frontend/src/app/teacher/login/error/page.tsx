import Link from 'next/link';

export default function TeacherLoginErrorPage() {
    return (
        <div className="h-[calc(100vh-56px)] flex items-center justify-center  p-4 pt-14 md:h-screen md:pt-0">
            <div className="card w-full max-w-md shadow-xl bg-base-100">
                <div className="card-body items-center gap-8">
                    <h1 className="card-title text-3xl mb-4 text-error">Erreur de connexion</h1>
                    <div className="alert alert-error w-full justify-center mb-4">
                        Email ou mot de passe incorrect.<br />
                        Voulez-vous <Link href="/teacher/reset-password" className="link link-primary">réinitialiser votre mot de passe</Link> ?
                    </div>
                    <Link href="/teacher/login">
                        <button className="btn btn-primary btn-lg w-full mt-2">Réessayer</button>
                    </Link>
                </div>
            </div>
        </div>
    );
}