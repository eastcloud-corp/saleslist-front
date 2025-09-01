import { use } from "react"
import { AddCompaniesClient } from "./add-companies-client"

interface AddCompaniesPageProps {
  params: Promise<{
    id: string
  }>
}

export default function AddCompaniesPage({ params }: AddCompaniesPageProps) {
  const resolvedParams = use(params)
  return <AddCompaniesClient projectId={resolvedParams.id} />
}
