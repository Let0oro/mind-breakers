import { EditQuestForm } from './EditQuestForm'

export default async function EditQuestPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return <EditQuestForm questId={id} />
}
