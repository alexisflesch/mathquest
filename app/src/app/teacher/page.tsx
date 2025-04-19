import { cookies } from 'next/headers';
import TeacherDashboard from './TeacherDashboardClient';
import { redirect } from 'next/navigation';

export default async function TeacherPage() {
    const cookieStore = await cookies();
    const teacherId = cookieStore.get('mathquest_teacher')?.value;
    if (!teacherId) {
        redirect('/teacher/login');
    }
    return <TeacherDashboard teacherId={teacherId} />;
}
