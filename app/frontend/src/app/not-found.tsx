import React from 'react';
import dynamicImport from 'next/dynamic';

export const dynamic = 'force-dynamic';

const NotFoundClient = dynamicImport(() => import('./NotFoundClient'), {
    loading: () => <div>Loading...</div>
});

export default function NotFound() {
    return <NotFoundClient />;
}