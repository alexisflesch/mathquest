"use client";
import { useAuth } from '@/components/AuthProvider';
import { useEffect, useState } from 'react';
import { STORAGE_KEYS } from '@/constants/auth';

export default function DebugAuthPage() {
    const { userState, userProfile, isStudent, isTeacher, isLoading } = useAuth();
    const [localStorageData, setLocalStorageData] = useState<any>({});

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setLocalStorageData({
                mathquest_username: localStorage.getItem('mathquest_username'),
                mathquest_avatar: localStorage.getItem('mathquest_avatar'),
                mathquest_cookie_id: localStorage.getItem('mathquest_cookie_id'),
                mathquest_teacher_id: localStorage.getItem(STORAGE_KEYS.TEACHER_ID),
                mathquest_jwt_token: localStorage.getItem('mathquest_jwt_token'),
            });
        }
    }, []);

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Authentication Debug</h1>

            <div className="space-y-4">
                <div className="card bg-base-100 shadow-xl p-4">
                    <h2 className="text-lg font-bold">Auth State</h2>
                    <pre className="bg-base-200 p-2 rounded">
                        {JSON.stringify({
                            userState,
                            userProfile,
                            isStudent,
                            isTeacher,
                            isLoading
                        }, null, 2)}
                    </pre>
                </div>

                <div className="card bg-base-100 shadow-xl p-4">
                    <h2 className="text-lg font-bold">LocalStorage Data</h2>
                    <pre className="bg-base-200 p-2 rounded">
                        {JSON.stringify(localStorageData, null, 2)}
                    </pre>
                </div>

                <div className="card bg-base-100 shadow-xl p-4">
                    <h2 className="text-lg font-bold">Actions</h2>
                    <div className="space-x-2">
                        <button
                            className="btn btn-warning"
                            onClick={() => {
                                localStorage.clear();
                                window.location.reload();
                            }}
                        >
                            Clear All LocalStorage
                        </button>
                        <a href="/login" className="btn btn-primary">
                            Try /login
                        </a>
                        <a href="/teacher/login" className="btn btn-secondary">
                            Try /teacher/login
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
