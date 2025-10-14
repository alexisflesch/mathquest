import React from 'react';
import dynamicImport from 'next/dynamic';
import LoadingScreen from '../../components/LoadingScreen';

export const dynamic = 'force-dynamic';

const LoginPageClient = dynamicImport(() => import('./LoginPageClient'), {
    loading: () => <LoadingScreen message="Chargement de la page de connexion..." />
});

export default function LoginPage() {
    return <LoginPageClient />;
}
