import { AddCompaniesClient } from "./add-companies-client"

interface AddCompaniesPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function AddCompaniesPage({ params }: AddCompaniesPageProps) {
  const resolvedParams = await params
  return <AddCompaniesClient projectId={resolvedParams.id} />
}
