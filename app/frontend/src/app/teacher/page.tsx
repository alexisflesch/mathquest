/**
 * Teacher Router Page - DEPRECATED
 * 
 * This page now redirects to the unified login page.
 * The unified login system handles all authentication types.
 */

import { redirect } from 'next/navigation';

export default async function TeacherPage() {
    redirect('/login?mode=teacher');
    return null;
}
