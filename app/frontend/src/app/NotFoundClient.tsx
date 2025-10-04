'use client';

import React from 'react';
import Link from 'next/link';

export default function NotFoundClient() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Page non trouvée</h1>
                    <p className="text-gray-600 mb-4">
                        La page que vous recherchez n&apos;existe pas.
                    </p>
                    <Link
                        href="/"
                        className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Retour à l&apos;accueil
                    </Link>
                </div>
            </div>
        </div>
    );
}