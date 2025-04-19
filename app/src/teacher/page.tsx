import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../components/AuthProvider';

export default function TeacherPage() {
    const { isAuthenticated } = useAuth() || {};
    const router = useRouter();

    useEffect(() => {
        if (isAuthenticated) {
            router.replace('/teacher/dashboard'); // Redirect to the dashboard
        } else {
            router.replace('/teacher/login'); // Redirect to the login page
        }
    }, [isAuthenticated, router]);

    return null;
}