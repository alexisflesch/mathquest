import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function TeacherPage() {
    const cookieStore = await cookies();
    const teacherId = cookieStore.get('mathquest_teacher')?.value;
    if (teacherId) {
        redirect('/teacher/dashboard');
    } else {
        redirect('/teacher/login');
    }
    return null;
}
