/**
 * Student Registration Page - DEPRECATED
 * 
 * This page now redirects to the unified login page.
 * The unified login system handles all authentication types.
 */

"use client";
import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function StudentPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Preserve any redirect parameters
        const redirect = searchParams?.get('redirect');
        const redirectParam = redirect ? `&redirect=${encodeURIComponent(redirect)}` : '';
        router.replace(`/login?mode=student${redirectParam}`);
    }, [router, searchParams]);

    return (
        <div className="main-content">
            <div className="card w-full max-w-lg bg-base-100 rounded-lg shadow-xl my-6">
                <div className="flex flex-col gap-6 p-6">
                    <h1 className="text-2xl font-bold text-center">Redirection...</h1>
                    <p className="text-center">Vous allez être redirigé vers la page de connexion unifiée.</p>
                </div>
            </div>
        </div>
    );
}

export default function StudentPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <StudentPageInner />
        </Suspense>
    );
}
