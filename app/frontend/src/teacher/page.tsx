import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../components/AuthProvider';

export default function TeacherPage() {
    const { isAuthenticated } = useAuth() || {};
    const router = useRouter();

    useEffect(() => {
        // Always redirect to main landing page - no separate teacher/student homes
        router.replace('/');
    }, [router]);

    return null;
}