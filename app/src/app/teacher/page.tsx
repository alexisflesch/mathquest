/**
 * Teacher Router Page
 * 
 * This server component acts as an intelligent router for the teacher section:
 * - Checks for teacher authentication via server-side cookies
 * - Redirects authenticated teachers to their dashboard
 * - Redirects unauthenticated users to the login page
 * 
 * By handling redirection at the server level, this component ensures
 * proper authentication flow and prevents unauthorized access to teacher
 * areas. It serves as the entry point for all /teacher routes.
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function TeacherPage() {
    const cookieStore = await cookies();
    const teacherId = cookieStore.get('mathquest_teacher')?.value;
    if (teacherId) {
        redirect('/teacher/home');
    } else {
        redirect('/teacher/login');
    }
    return null;
}
