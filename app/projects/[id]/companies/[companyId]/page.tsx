import { use } from "react"
import { SalesTargetCompanyDetail } from "./sales-target-company-detail"

interface SalesTargetCompanyPageProps {
  params: Promise<{
    id: string
    companyId: string
  }>
}

export default function SalesTargetCompanyPage({ params }: SalesTargetCompanyPageProps) {
  const resolvedParams = use(params)
  return (
    <SalesTargetCompanyDetail 
      projectId={resolvedParams.id} 
      companyId={resolvedParams.companyId} 
    />
  )
}