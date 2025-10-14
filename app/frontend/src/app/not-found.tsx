import React from 'react';
import dynamicImport from 'next/dynamic';
import LoadingScreen from '../components/LoadingScreen';

export const dynamic = 'force-dynamic';

const NotFoundClient = dynamicImport(() => import('./NotFoundClient'), {
    loading: () => <LoadingScreen message="Chargement de la page..." />
});

export default function NotFound() {
    return <NotFoundClient />;
}