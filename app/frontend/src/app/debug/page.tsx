"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { makeApiRequest } from '@/config/api';
import { AUTH_ENDPOINTS } from '@/constants/auth';
import { useAuth } from '@/components/AuthProvider';
import { AuthStatusResponseSchema, LogoutResponseSchema } from '@shared/types/api/schemas';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

/**
 * Authentication Debug Page
 * 
 * This page provides tools to test and debug authentication issues with the MathQuest app.
 * It includes:
 * - Status display of localStorage items related to auth
 * - Status display of cookies (only client-visible ones)
 * - Test buttons for navigation and logout
 * - Force login/logout test functions
 */
export default function DebugPage() {
    const { logout } = useAuth();
    const router = useRouter();
    const [localStorageItems, setLocalStorageItems] = useState<Record<string, string>>({});
    const [cookies, setCookies] = useState<string[]>([]);
    const [status, setStatus] = useState('Initializing...');

    // Refresh the debug information
    const refreshDebugInfo = () => {
        if (typeof window !== 'undefined') {
            // Get localStorage items
            const items: Record<string, string> = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key) {
                    items[key] = localStorage.getItem(key) || '';
                }
            }
            setLocalStorageItems(items);

            // Get cookies
            setCookies(document.cookie.split(';').map(cookie => cookie.trim()));

            setStatus('Debug info refreshed at ' + new Date().toLocaleTimeString());
        }
    };

    // Initial load
    useEffect(() => {
        refreshDebugInfo();
    }, []);

    // Force clear authentication data using all available methods
    const forceClear = async () => {
        try {
            setStatus('Clearing all auth data using all available methods...');

            // 1. Use centralized logout function (doesn't redirect)
            setStatus('Using AuthProvider logout...');
            await logout();

            // 2. For extra safety, also call clear-cookies API endpoint
            setStatus('Calling clear-cookies API endpoint...');
            const clearResult = await makeApiRequest(AUTH_ENDPOINTS.CLEAR_COOKIES, { method: 'POST' }, undefined, LogoutResponseSchema);
            console.log('[Debug] Clear cookies API response:', clearResult);

            // 3. Extra clearing for client-side cookies
            const cookiesList = document.cookie.split(';');
            if (cookiesList.length > 0) {
                setStatus(`Still found ${cookiesList.length} client-side cookies, trying direct clear...`);
                cookiesList.forEach(function (c) {
                    const cookieStr = c.replace(/^ +/, '');
                    const cookieName = cookieStr.split('=')[0];
                    console.log(`[Debug] Clearing stubborn client cookie: ${cookieName}`);

                    // Clear with multiple aggressive methods
                    document.cookie = `${cookieName}=;expires=${new Date(0).toUTCString()};path=/`;
                    document.cookie = `${cookieName}=;expires=${new Date(0).toUTCString()};path=/;domain=${window.location.hostname}`;
                    document.cookie = `${cookieName}=;expires=${new Date(0).toUTCString()};path=/;domain=.${window.location.hostname}`;
                });
            }

            setStatus(`Auth data cleared successfully at ${new Date().toLocaleTimeString()}`);
            refreshDebugInfo();
        } catch (error) {
            console.error('[Debug] Force clear error:', error);
            setStatus(`Error clearing auth data: ${error}`);
        }
    };

    // Check auth status from server-side
    const checkAuthStatus = async () => {
        try {
            setStatus('Checking auth status from server...');
            const statusResult = await makeApiRequest(AUTH_ENDPOINTS.STATUS, { method: 'GET' }, undefined, AuthStatusResponseSchema);
            console.log('[Debug] Auth status from server:', statusResult);
            setStatus(`Auth status checked at ${new Date().toLocaleTimeString()}`);
            alert(JSON.stringify(statusResult, null, 2));
        } catch (error) {
            console.error('[Debug] Check auth status error:', error);
            setStatus(`Error checking auth status: ${error}`);
        }
    };

    // Test navigation to login page
    const testNavigation = () => {
        setStatus(`Navigating to /login with Next.js router at ${new Date().toLocaleTimeString()}`);
        router.push('/login');
    };

    // Force page reload
    const forceReload = () => {
        setStatus('Forcing page reload...');
        window.location.reload();
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">MathQuest Auth Debug</h1>

            <div className="bg-blue-100 dark:bg-blue-900 p-4 mb-6 rounded">
                <p><strong>Status:</strong> {status}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded shadow">
                    <h2 className="text-xl font-semibold mb-2">LocalStorage Items</h2>
                    {Object.keys(localStorageItems).length > 0 ? (
                        <ul className="list-disc pl-5">
                            {Object.entries(localStorageItems).map(([key, value]) => (
                                <li key={key} className="mb-1">
                                    <strong>{key}:</strong> {value.substring(0, 30)}{value.length > 30 ? '...' : ''}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="italic">No localStorage items found</p>
                    )}
                </div>

                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded shadow">
                    <h2 className="text-xl font-semibold mb-2">Visible Cookies</h2>
                    <p className="text-sm text-gray-500 mb-2">(HttpOnly cookies are not visible here)</p>
                    {cookies.length > 0 ? (
                        <ul className="list-disc pl-5">
                            {cookies.map((cookie, index) => (
                                <li key={index} className="mb-1">{cookie}</li>
                            ))}
                        </ul>
                    ) : (
                        <p className="italic">No visible cookies found</p>
                    )}
                </div>
            </div>

            <div className="mt-6 space-y-4">
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded shadow">
                    <h2 className="text-xl font-semibold mb-4">Debug Actions</h2>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={refreshDebugInfo}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            Refresh Debug Info
                        </button>
                        <button
                            onClick={forceClear}
                            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                            Force Clear Auth Data
                        </button>
                        <button
                            onClick={checkAuthStatus}
                            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                        >
                            Check Server Auth Status
                        </button>
                        <button
                            onClick={forceReload}
                            className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                        >
                            Force Page Reload
                        </button>
                    </div>
                </div>

                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded shadow">
                    <h2 className="text-xl font-semibold mb-4">Navigation Tests</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                            <h3 className="text-md font-semibold mb-2">Router Navigation (Next.js Client Router)</h3>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => router.push('/')}
                                    className="px-3 py-1 bg-emerald-200 dark:bg-emerald-800 text-center rounded hover:bg-emerald-300"
                                >
                                    Home (Router)
                                </button>
                                <button
                                    onClick={testNavigation}
                                    className="px-3 py-1 bg-emerald-200 dark:bg-emerald-800 text-center rounded hover:bg-emerald-300"
                                >
                                    Login (Router)
                                </button>
                                <button
                                    onClick={() => router.push('/student/home')}
                                    className="px-3 py-1 bg-emerald-200 dark:bg-emerald-800 text-center rounded hover:bg-emerald-300"
                                >
                                    Student Home (Router)
                                </button>
                                <button
                                    onClick={() => router.push('/teacher/home')}
                                    className="px-3 py-1 bg-emerald-200 dark:bg-emerald-800 text-center rounded hover:bg-emerald-300"
                                >
                                    Teacher Home (Router)
                                </button>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-md font-semibold mb-2">Direct Links (Browser Navigation)</h3>
                            <div className="flex flex-wrap gap-2">
                                <Link href="/" className="px-3 py-1 bg-orange-200 dark:bg-orange-800 text-center rounded hover:bg-orange-300">Home</Link>
                                <a href="/login" className="px-3 py-1 bg-orange-200 dark:bg-orange-800 text-center rounded hover:bg-orange-300">Login</a>
                                <a href="/student/home" className="px-3 py-1 bg-orange-200 dark:bg-orange-800 text-center rounded hover:bg-orange-300">Student Home</a>
                                <a href="/teacher/home" className="px-3 py-1 bg-orange-200 dark:bg-orange-800 text-center rounded hover:bg-orange-300">Teacher Home</a>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded shadow">
                    <h2 className="text-xl font-semibold mb-2">API Testing</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <a
                            href={process.env.NEXT_PUBLIC_BACKEND_API_URL ? `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/auth/status` : '/api/v1/auth/status'}
                            target="_blank"
                            className="px-3 py-1 bg-teal-200 dark:bg-teal-800 text-center rounded hover:bg-teal-300"
                        >
                            GET /api/v1/auth/status
                        </a>
                        <a
                            href="/api/v1/auth/clear-cookies"
                            target="_blank"
                            className="px-3 py-1 bg-teal-200 dark:bg-teal-800 text-center rounded hover:bg-teal-300"
                        >
                            GET /api/v1/auth/clear-cookies
                        </a>
                    </div>
                </div>

                <div className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded">
                    <p className="text-sm">
                        <strong>TIP:</strong> If you&apos;re stuck after logout, try the following steps:
                    </p>
                    <ol className="list-decimal ml-5 text-sm">
                        <li>Use &quot;Force Clear Auth Data&quot; to clear both client and server cookies</li>
                        <li>Force a page reload</li>
                        <li>Try both router navigation and direct links to test routing behavior</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
