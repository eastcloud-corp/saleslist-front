import { use } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { ProjectDetailClient } from "./project-detail-client"

interface ProjectDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const resolvedParams = use(params)
  const projectId = resolvedParams.id

  return (
    <MainLayout>
      <ProjectDetailClient projectId={projectId} />
    </MainLayout>
  )
}
