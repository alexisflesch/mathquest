import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../components/AuthProvider';

export default function TeacherPage() {
    const { isAuthenticated } = useAuth() || {};
    const router = useRouter();

    useEffect(() => {
        if (isAuthenticated) {
            router.replace('/teacher/home'); // Redirect to the home page
        } else {
            router.replace('/teacher/login'); // Redirect to the login page
        }
    }, [isAuthenticated, router]);

    return null;
}