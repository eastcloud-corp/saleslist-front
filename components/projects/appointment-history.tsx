"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, TrendingUp, Users } from "lucide-react"

interface AppointmentHistoryProps {
  projectCompanies: any[]
}

export function AppointmentHistory({ projectCompanies }: AppointmentHistoryProps) {
  const appointmentStats = {
    total: projectCompanies.reduce((sum, pc) => sum + (pc.appointment_count || 0), 0),
    successful: projectCompanies.filter(pc => pc.appointment_result === '成約').length,
    pending: projectCompanies.filter(pc => pc.appointment_result === '継続検討').length,
    declined: projectCompanies.filter(pc => pc.appointment_result === '見送り').length,
  }

  const getResultBadge = (result: string) => {
    const variants = {
      '成約': 'default',
      '継続検討': 'secondary', 
      '見送り': 'destructive',
    } as const

    return (
      <Badge variant={variants[result as keyof typeof variants] || 'outline'}>
        {result || '未設定'}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* アポ実績サマリー */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">総アポ数</p>
                <p className="text-2xl font-bold">{appointmentStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">成約</p>
                <p className="text-2xl font-bold text-green-600">{appointmentStats.successful}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">継続検討</p>
                <p className="text-2xl font-bold text-yellow-600">{appointmentStats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm font-medium">見送り</p>
                <p className="text-2xl font-bold text-red-600">{appointmentStats.declined}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* アポ実績一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>アポ実績詳細</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projectCompanies
              .filter(pc => pc.appointment_count > 0)
              .map((pc) => (
                <div key={pc.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-medium">{pc.company_name}</p>
                      <p className="text-sm text-muted-foreground">{pc.company_industry}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">アポ数: {pc.appointment_count}</p>
                      {pc.last_appointment_date && (
                        <p className="text-xs text-muted-foreground">
                          最終: {new Date(pc.last_appointment_date).toLocaleDateString('ja-JP')}
                        </p>
                      )}
                    </div>
                    {getResultBadge(pc.appointment_result)}
                  </div>
                </div>
              ))}
            
            {projectCompanies.filter(pc => pc.appointment_count > 0).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>アポ実績がありません</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}