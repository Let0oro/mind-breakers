import { EditCourseForm } from './EditCourseForm'

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return <EditCourseForm courseId={id} />
}
