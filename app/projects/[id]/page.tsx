import { MainLayout } from "@/components/layout/main-layout"
import { ProjectDetailClient } from "./project-detail-client"

interface ProjectDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const resolvedParams = await params
  const projectId = resolvedParams.id

  return (
    <MainLayout>
      <ProjectDetailClient projectId={projectId} />
    </MainLayout>
  )
}
