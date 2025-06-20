'use client';

import { useEffect, useState } from 'react';
import { STORAGE_KEYS } from '@/constants/auth';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

export default function DebugCookiesPage() {
    const [cookies, setCookies] = useState<string>('');
    const [serverCookies, setServerCookies] = useState<any>(null);
    const [localStorageData, setLocalStorageData] = useState<any>(null);

    useEffect(() => {
        // Client-side cookies
        setCookies(document.cookie);

        // Client-side localStorage
        setLocalStorageData({
            mathquest_jwt_token: localStorage.getItem('mathquest_jwt_token'),
            mathquest_teacher_id: localStorage.getItem(STORAGE_KEYS.TEACHER_ID),
            mathquest_cookie_id: localStorage.getItem('mathquest_cookie_id'),
            mathquest_username: localStorage.getItem('mathquest_username'),
            mathquest_avatar: localStorage.getItem('mathquest_avatar'),
        });

        // Make a request to check server-side cookies
        fetch('/api/debug-cookies')
            .then(res => res.json())
            .then(data => setServerCookies(data))
            .catch(err => console.error('Error fetching server cookies:', err));
    }, []);

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Cookie Debug Page</h1>

            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Client-side cookies (document.cookie):</h2>
                <pre className="bg-gray-100 p-4 rounded overflow-auto">
                    {cookies || 'No cookies found'}
                </pre>
            </div>

            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Server-side cookies (from API):</h2>
                <pre className="bg-gray-100 p-4 rounded overflow-auto">
                    {serverCookies ? JSON.stringify(serverCookies, null, 2) : 'Loading...'}
                </pre>
            </div>

            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">localStorage values:</h2>
                <pre className="bg-gray-100 p-4 rounded overflow-auto">
                    {localStorageData ? JSON.stringify(localStorageData, null, 2) : 'Loading...'}
                </pre>
            </div>
        </div>
    );
}
